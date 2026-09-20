import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api-response";

const clientPunchSchema = z.object({
  tenantSlug: z.string().min(1, "Tenant slug is required"),
  identifier: z.string().min(1, "Mobile number or Member ID is required"),
  punchType: z.enum(["CHECK_IN", "CHECK_OUT"]).default("CHECK_IN"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (Prevents phone scraping & mass enumeration)
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`client_punch:${ip}`, 15, 60);
    if (!rateLimit.allowed) {
      return apiError(
        `Too many punch requests. Please wait ${rateLimit.resetSeconds}s.`,
        "RATE_LIMITED",
        429
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = clientPunchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { tenantSlug, identifier, punchType } = parsed.data;
    const cleanId = identifier.trim();

    // 2. Resolve Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, businessName: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      return apiError("Gym portal not found or inactive", "TENANT_NOT_FOUND", 404);
    }

    // 3. Find Member (by phone, clean digits, or memberCode)
    const phoneClean = cleanId.replace(/\D/g, "");
    const member = await prisma.member.findFirst({
      where: {
        tenantId: tenant.id,
        isDeleted: false,
        OR: [
          { memberCode: { equals: cleanId, mode: "insensitive" } },
          { memberCode: { equals: `M-${cleanId}`, mode: "insensitive" } },
          { phone: { contains: phoneClean.length >= 10 ? phoneClean.slice(-10) : cleanId } },
        ],
      },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          orderBy: { endDate: "desc" },
          take: 1,
          include: {
            planVersion: {
              include: { plan: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!member) {
      return apiError(
        "No active member profile found with this phone number or ID. Please check with the front desk.",
        "MEMBER_NOT_FOUND",
        404
      );
    }

    const now = new Date();
    const activeMembership = member.memberships[0];

    // Membership validity check
    let daysRemaining = 0;
    if (activeMembership) {
      const diffTime = new Date(activeMembership.endDate).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // 4. Check 5-minute dedup window
    const bucket = Math.floor(now.getTime() / (5 * 60 * 1000));
    const dedupHash = crypto
      .createHash("sha256")
      .update(`${tenant.id}:${member.id}:${bucket}`)
      .digest("hex");

    const duplicate = await prisma.attendanceRecord.findUnique({
      where: {
        uq_attendance_dedup: {
          tenantId: tenant.id,
          dedupHash,
        },
      },
    });

    // Mask member last name for privacy protection on public kiosk
    const maskedLastName = member.lastName ? `${member.lastName[0]}.` : "";

    if (duplicate) {
      return apiSuccess({
        status: "ALREADY_CHECKED_IN",
        message: `Welcome back, ${member.firstName}! You are already checked in. Have a great workout! 💪`,
        punchTime: duplicate.punchTime.toISOString(),
        member: {
          firstName: member.firstName,
          lastName: maskedLastName,
          memberCode: member.memberCode,
          planName: activeMembership?.planVersion?.plan?.name || "Active Membership",
          daysRemaining,
        },
      });
    }

    // 5. Record Attendance Punch
    const record = await prisma.attendanceRecord.create({
      data: {
        tenantId: tenant.id,
        memberId: member.id,
        punchTime: now,
        punchType,
        verificationMode: "CLIENT_PORTAL",
        isManualEntry: false,
        dedupHash,
      },
    });

    return apiSuccess({
      status: "SUCCESS",
      punchType,
      message: `${punchType === "CHECK_IN" ? "Checked In Successfully!" : "Checked Out Successfully!"} Welcome, ${member.firstName}!`,
      punchTime: record.punchTime.toISOString(),
      member: {
        firstName: member.firstName,
        lastName: maskedLastName,
        memberCode: member.memberCode,
        planName: activeMembership?.planVersion?.plan?.name || "Standard Membership",
        daysRemaining,
        hasActivePlan: !!activeMembership,
      },
    });
  } catch (error: any) {
    console.error("Client Punch API Error:", error);
    return apiError("Failed to record attendance punch", "SERVER_ERROR", 500);
  }
}
