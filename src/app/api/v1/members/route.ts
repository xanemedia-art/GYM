import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma, getTenantPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { GenderType, MemberStatus } from "@prisma/client";
import { generateUniqueMemberCode } from "@/lib/member-code";
import { assignUidToMember } from "@/lib/door-lock";

const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.nativeEnum(GenderType),
  phone: z.string().min(10, "Valid 10-digit mobile number required"),
  whatsappNumber: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
  dateOfBirth: z.string().optional().nullable().or(z.literal("")),
  photoUrl: z.string().optional().nullable().or(z.literal("")),
  emergencyContactName: z.string().optional().nullable().or(z.literal("")),
  emergencyContactPhone: z.string().optional().nullable().or(z.literal("")),
  assignedTrainerId: z.string().optional().nullable().or(z.literal("")),
  healthMetrics: z.record(z.string(), z.any()).optional().nullable(),
  notes: z.string().optional().nullable().or(z.literal("")),
  doorLockUid: z.string().optional().nullable().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as MemberStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const tenantDb = getTenantPrisma(session.tenantId);

    const whereClause: any = {
      tenantId: session.tenantId,
      isDeleted: false,
    };

    if (status) {
      whereClause.status = status;
    }

    if (search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { memberCode: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, members] = await Promise.all([
      tenantDb.member.count({ where: whereClause }),
      tenantDb.member.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTrainer: {
            select: { id: true, fullName: true },
          },
          memberships: {
            where: { status: "ACTIVE" },
            take: 1,
            orderBy: { endDate: "desc" },
            include: {
              planVersion: {
                include: {
                  plan: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return apiSuccess(members, { page, limit, total });
  } catch (error: any) {
    console.error("List Members API Error:", error);
    return apiError("Failed to fetch members list", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "MEMBER_ONBOARDING")) {
      return apiError("Insufficient permission to onboard members", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const data = parsed.data;

    // Clean phone number (extract last 10 digits)
    const cleanPhone = data.phone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return apiError("Valid 10-digit phone number is required", "INVALID_PHONE", 400);
    }

    // 1. Check duplicate phone for active members in this tenant
    const existing = await prisma.member.findFirst({
      where: {
        tenantId: session.tenantId,
        isDeleted: false,
        OR: [
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { phone: `0${cleanPhone}` },
          { phone: { endsWith: cleanPhone } },
        ],
      },
      select: {
        id: true,
        memberCode: true,
        firstName: true,
        lastName: true,
      },
    });

    if (existing) {
      return apiError(
        `A member with phone ${cleanPhone} already exists (${existing.firstName} ${existing.lastName}, ID: ${existing.memberCode})`,
        "DUPLICATE_PHONE",
        409
      );
    }

    // 2. Free any SOFT-DELETED member records holding this phone number
    await prisma.member.updateMany({
      where: {
        tenantId: session.tenantId,
        isDeleted: true,
        OR: [
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { phone: `0${cleanPhone}` },
          { phone: { endsWith: cleanPhone } },
        ],
      },
      data: {
        phone: `${cleanPhone}_del_${Date.now()}`,
        memberCode: `DEL_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      },
    });

    // 3. Generate collision-proof Member Code (e.g. M-1004)
    const memberCode = await generateUniqueMemberCode(session.tenantId, "M");

    // 4. Safe DOB
    let parsedDob: Date | null = null;
    if (data.dateOfBirth && data.dateOfBirth.trim() !== "") {
      const d = new Date(data.dateOfBirth);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    const member = await prisma.member.create({
      data: {
        tenantId: session.tenantId,
        memberCode,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gender: data.gender,
        phone: cleanPhone,
        whatsappNumber: data.whatsappNumber ? data.whatsappNumber.replace(/\D/g, "").slice(-10) : cleanPhone,
        email: data.email && data.email.trim() !== "" ? data.email.trim().toLowerCase() : null,
        dateOfBirth: parsedDob,
        photoUrl: data.photoUrl || null,
        emergencyContactName: data.emergencyContactName?.trim() || null,
        emergencyContactPhone: data.emergencyContactPhone?.trim() || null,
        assignedTrainerId: data.assignedTrainerId || null,
        healthMetrics: (data.healthMetrics as any) || {},
        customFields: data.doorLockUid ? { doorLockUid: data.doorLockUid.trim() } : {},
        notes: data.notes?.trim() || null,
        status: MemberStatus.ACTIVE,
      },
    });

    // If doorLockUid is set, link DeviceUser
    if (data.doorLockUid && data.doorLockUid.trim() !== "") {
      try {
        await assignUidToMember({
          tenantId: session.tenantId,
          memberId: member.id,
          uid: data.doorLockUid.trim(),
          cardNumber: data.doorLockUid.trim(),
        });
      } catch (devErr) {
        console.warn("Could not create initial DeviceUser:", devErr);
      }
    }

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.id,
          action: "MEMBER_CREATED",
          entityType: "MEMBER",
          entityId: member.id,
          newValues: {
            memberCode: member.memberCode,
            name: `${member.firstName} ${member.lastName}`,
            phone: member.phone,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation non-fatal error:", auditErr);
    }

    return apiSuccess(member, undefined, 201);
  } catch (error: any) {
    console.error("Create Member API Error:", error);
    if (error?.code === "P2002") {
      return apiError(
        "A member with these details already exists in this gym branch.",
        "DUPLICATE_ENTRY",
        409
      );
    }
    return apiError(error?.message || "Failed to register member", "SERVER_ERROR", 500);
  }
}
