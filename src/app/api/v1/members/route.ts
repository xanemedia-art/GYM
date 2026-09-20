import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma, getTenantPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { GenderType, MemberStatus } from "@prisma/client";

const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.nativeEnum(GenderType),
  phone: z.string().min(10, "Valid 10-digit mobile number required"),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().nullable(),
  photoUrl: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  assignedTrainerId: z.string().optional().nullable(),
  healthMetrics: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  doorLockUid: z.string().optional(),
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

    // Check duplicate phone in this tenant
    const existing = await prisma.member.findFirst({
      where: {
        tenantId: session.tenantId,
        phone: data.phone,
        isDeleted: false,
      },
    });

    if (existing) {
      return apiError("A member with this phone number already exists", "DUPLICATE_PHONE", 409);
    }

    // Generate next member code: e.g. M-1001
    const count = await prisma.member.count({
      where: { tenantId: session.tenantId },
    });
    const memberCode = `M-${String(1001 + count).padStart(4, "0")}`;

    const member = await prisma.member.create({
      data: {
        tenantId: session.tenantId,
        memberCode,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber || data.phone,
        email: data.email || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        photoUrl: data.photoUrl || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        assignedTrainerId: data.assignedTrainerId || null,
        healthMetrics: (data.healthMetrics as any) || {},
        customFields: data.doorLockUid ? { doorLockUid: data.doorLockUid } : {},
        notes: data.notes || null,
        status: MemberStatus.ACTIVE,
      },
    });

    // If doorLockUid is set and tenant has devices, link DeviceUser
    if (data.doorLockUid) {
      try {
        const primaryDevice = await prisma.device.findFirst({
          where: { tenantId: session.tenantId },
          orderBy: { createdAt: "asc" },
        });
        if (primaryDevice) {
          const numericEnrollmentId = parseInt(data.doorLockUid.replace(/\D/g, ""), 10) || Math.floor(1000 + Math.random() * 9000);
          await prisma.deviceUser.create({
            data: {
              tenantId: session.tenantId,
              memberId: member.id,
              deviceId: primaryDevice.id,
              deviceEnrollmentId: numericEnrollmentId,
              cardNumber: data.doorLockUid,
              isSynced: true,
            },
          });
        }
      } catch (devErr) {
        console.warn("Could not create initial DeviceUser:", devErr);
      }
    }

    // Create Audit Log
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

    return apiSuccess(member, undefined, 201);
  } catch (error: any) {
    console.error("Create Member API Error:", error);
    return apiError("Failed to register member", "SERVER_ERROR", 500);
  }
}
