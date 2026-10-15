import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, getTenantPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { GenderType, MemberStatus, UserRole } from "@prisma/client";
import { generateUniqueMemberCode } from "@/lib/member-code";
import { assignUidToMember } from "@/lib/door-lock";
import { invalidateMembersCache } from "../route";

interface RawCsvMember {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  gender?: string;
  memberCode?: string;
  email?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  planName?: string;
  startDate?: string;
  endDate?: string;
  doorLockUid?: string;
  notes?: string;
}

function parseFlexDate(dateStr?: string | null): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const s = dateStr.trim();

  // Try ISO format YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    } else if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const isAuthorized =
      session.role === UserRole.GYM_OWNER ||
      session.role === UserRole.SUPER_ADMIN ||
      hasPermission(session.role, "MEMBER_ONBOARDING");

    if (!isAuthorized) {
      return apiError("Insufficient permissions to import members", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const rows: RawCsvMember[] = Array.isArray(body.rows) ? body.rows : [];
    const isPreview = Boolean(body.preview);

    if (rows.length === 0) {
      return apiError("No member rows provided in import payload", "VALIDATION_ERROR", 400);
    }

    if (rows.length > 2000) {
      return apiError("Maximum batch size is 2,000 members per CSV upload", "BATCH_TOO_LARGE", 400);
    }

    const tenantDb = getTenantPrisma(session.tenantId);

    // 1. Fetch existing members in this branch for duplicate phone & memberCode checking
    const existingMembers = await tenantDb.member.findMany({
      where: { tenantId: session.tenantId, isDeleted: false },
      select: { id: true, phone: true, memberCode: true, firstName: true, lastName: true },
    });

    const existingPhones = new Set<string>();
    const existingCodes = new Set<string>();

    for (const m of existingMembers) {
      const clean = m.phone.replace(/\D/g, "").slice(-10);
      if (clean) existingPhones.add(clean);
      if (m.memberCode) existingCodes.add(m.memberCode.toLowerCase());
    }

    // 2. Fetch available membership plans for this branch
    const branchPlans = await prisma.membershipPlan.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    // Plan matching helper (case-insensitive substring or exact match)
    const findMatchingPlan = (planNameStr?: string) => {
      if (!planNameStr || planNameStr.trim() === "") return null;
      const clean = planNameStr.toLowerCase().trim();
      return (
        branchPlans.find(
          (p) =>
            p.name.toLowerCase() === clean ||
            p.name.toLowerCase().includes(clean) ||
            clean.includes(p.name.toLowerCase())
        ) || null
      );
    };

    // 3. Process & Analyze every row
    const analyzedRows: any[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    const seenPhonesInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;

      // Extract names
      let firstName = (r.firstName || "").trim();
      let lastName = (r.lastName || "").trim();

      if (!firstName && r.fullName) {
        const parts = r.fullName.trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      if (!lastName) {
        lastName = "."; // Fallback to satisfy non-nullable schema column
      }

      // Clean phone
      const cleanPhone = (r.phone || "").replace(/\D/g, "").slice(-10);

      // Gender normalization
      let gender: GenderType = GenderType.MALE;
      if (r.gender) {
        const g = r.gender.toUpperCase().trim();
        if (g === "FEMALE" || g === "F") gender = GenderType.FEMALE;
        else if (g === "OTHER" || g === "O") gender = GenderType.OTHER;
      }

      const planMatch = findMatchingPlan(r.planName);
      const parsedDob = parseFlexDate(r.dateOfBirth);
      const parsedStart = parseFlexDate(r.startDate) || new Date();
      let parsedEnd = parseFlexDate(r.endDate);

      if (!parsedEnd && planMatch) {
        const dur = planMatch.durationDays || 30;
        parsedEnd = new Date(parsedStart.getTime() + dur * 24 * 60 * 60 * 1000);
      }

      // Validation issues
      const issues: string[] = [];

      if (!firstName || firstName === ".") {
        issues.push("Missing first name");
      }

      if (!cleanPhone || cleanPhone.length < 10) {
        issues.push("Invalid phone number (must be 10 digits)");
      } else if (existingPhones.has(cleanPhone)) {
        issues.push("Duplicate phone (member already exists in this branch - will skip)");
      } else if (seenPhonesInBatch.has(cleanPhone)) {
        issues.push("Duplicate phone inside this CSV file (will skip)");
      }

      const isDuplicate = issues.some((msg) => msg.includes("Duplicate phone"));
      const isFatal = issues.some((msg) => !msg.includes("Duplicate phone"));

      let statusBadge: "VALID" | "DUPLICATE_SKIPPED" | "ERROR" = "VALID";
      if (isFatal) {
        statusBadge = "ERROR";
        errorCount++;
      } else if (isDuplicate) {
        statusBadge = "DUPLICATE_SKIPPED";
        duplicateCount++;
      } else {
        validCount++;
        if (cleanPhone) seenPhonesInBatch.add(cleanPhone);
      }

      analyzedRows.push({
        rowNumber: rowNum,
        firstName,
        lastName: lastName === "." ? "" : lastName,
        fullName: `${firstName} ${lastName === "." ? "" : lastName}`.trim(),
        phone: cleanPhone || r.phone || "",
        gender,
        memberCode: r.memberCode?.trim() || null,
        email: r.email?.toLowerCase().trim() || null,
        dateOfBirth: parsedDob ? parsedDob.toISOString().split("T")[0] : null,
        planName: planMatch ? planMatch.name : r.planName?.trim() || null,
        matchedPlanId: planMatch?.id || null,
        matchedPlanVersionId: planMatch?.versions[0]?.id || null,
        startDate: parsedStart.toISOString().split("T")[0],
        endDate: parsedEnd ? parsedEnd.toISOString().split("T")[0] : null,
        doorLockUid: r.doorLockUid?.trim() || null,
        emergencyContactName: r.emergencyContactName?.trim() || null,
        emergencyContactPhone: r.emergencyContactPhone?.trim() || null,
        notes: r.notes?.trim() || null,
        statusBadge,
        issues,
      });
    }

    // If dry run preview requested, return analysis immediately
    if (isPreview) {
      return apiSuccess({
        preview: true,
        totalRows: rows.length,
        validCount,
        duplicateCount,
        errorCount,
        availablePlans: branchPlans.map((p) => p.name),
        rows: analyzedRows,
      });
    }

    // 4. Execution Mode: Insert valid non-duplicate rows into Database
    const rowsToInsert = analyzedRows.filter((r) => r.statusBadge === "VALID");

    if (rowsToInsert.length === 0) {
      return apiError(
        "No valid rows to import. All rows were duplicates or contained validation errors.",
        "NO_VALID_ROWS",
        400
      );
    }

    let insertedCount = 0;
    const errors: { row: number; error: string }[] = [];

    for (const r of rowsToInsert) {
      try {
        // Generate member code if not provided
        let code = r.memberCode;
        if (!code || existingCodes.has(code.toLowerCase())) {
          code = await generateUniqueMemberCode(session.tenantId, "BFF");
        }
        existingCodes.add(code.toLowerCase());

        // Create Member
        const createdMember = await prisma.member.create({
          data: {
            tenantId: session.tenantId,
            memberCode: code,
            firstName: r.firstName,
            lastName: r.lastName || ".",
            gender: r.gender,
            phone: r.phone,
            whatsappNumber: r.phone,
            email: r.email || null,
            dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth) : null,
            emergencyContactName: r.emergencyContactName || null,
            emergencyContactPhone: r.emergencyContactPhone || null,
            customFields: r.doorLockUid ? { doorLockUid: r.doorLockUid } : {},
            notes: r.notes || "Imported via CSV Previous Data",
            status: MemberStatus.ACTIVE,
          },
        });

        // If plan was matched, attach active Membership
        if (r.matchedPlanVersionId && r.endDate) {
          try {
            await prisma.membership.create({
              data: {
                tenantId: session.tenantId,
                memberId: createdMember.id,
                planVersionId: r.matchedPlanVersionId,
                startDate: new Date(r.startDate),
                endDate: new Date(r.endDate),
                originalEndDate: new Date(r.endDate),
                status: MemberStatus.ACTIVE,
              },
            });
          } catch (memErr) {
            console.warn(`Could not attach membership for member ${createdMember.id}:`, memErr);
          }
        }

        // If doorLockUid is specified, link DeviceUser
        if (r.doorLockUid) {
          try {
            await assignUidToMember({
              tenantId: session.tenantId,
              memberId: createdMember.id,
              uid: r.doorLockUid,
              cardNumber: r.doorLockUid,
            });
          } catch (devErr) {
            console.warn(`Could not link turnstile UID for ${createdMember.id}:`, devErr);
          }
        }

        insertedCount++;
      } catch (err: any) {
        console.error(`Error importing row ${r.rowNumber}:`, err);
        errors.push({ row: r.rowNumber, error: err.message || "Failed to insert member" });
      }
    }

    // Write Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.id,
          action: "MEMBERS_BULK_IMPORTED",
          entityType: "MEMBER_BATCH",
          entityId: session.tenantId,
          newValues: {
            totalUploaded: rows.length,
            importedCount: insertedCount,
            skippedDuplicates: duplicateCount,
            errorsCount: errors.length,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Bulk import audit log warning:", auditErr);
    }

    invalidateMembersCache(session.tenantId);

    return apiSuccess({
      success: true,
      totalUploaded: rows.length,
      importedCount: insertedCount,
      skippedCount: duplicateCount,
      failedCount: errors.length,
      errors,
    });
  } catch (error: any) {
    console.error("Bulk Import Members API Error:", error);
    return apiError(error?.message || "Failed to process CSV member import", "SERVER_ERROR", 500);
  }
}
