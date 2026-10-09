import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { GenderType, MemberStatus } from "@prisma/client";

const updateMemberSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  gender: z.nativeEnum(GenderType).optional(),
  phone: z.string().min(10).optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().nullable(),
  photoUrl: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  assignedTrainerId: z.string().optional().nullable(),
  status: z.nativeEnum(MemberStatus).optional(),
  healthMetrics: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  doorLockUid: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;

    const member = await prisma.member.findFirst({
      where: {
        id,
        tenantId: session.tenantId,
        isDeleted: false,
      },
      include: {
        assignedTrainer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        memberships: {
          orderBy: { createdAt: "desc" },
          include: {
            planVersion: {
              include: {
                plan: { select: { name: true, durationDays: true } },
              },
            },
            freezeLogs: {
              orderBy: { createdAt: "desc" },
              include: {
                frozenBy: { select: { fullName: true } },
              },
            },
          },
        },
        invoices: {
          orderBy: { issuedAt: "desc" },
          include: {
            items: true,
            payments: {
              orderBy: { paymentDate: "desc" },
              include: {
                collectedBy: { select: { fullName: true } },
              },
            },
          },
        },
        attendanceRecords: {
          take: 30,
          orderBy: { punchTime: "desc" },
          include: {
            device: { select: { deviceName: true } },
          },
        },
        communicationLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!member) {
      return apiError("Member not found", "NOT_FOUND", 404);
    }

    return apiSuccess(member);
  } catch (error: any) {
    console.error("Get Member Detail API Error:", error);
    return apiError("Failed to fetch member profile", "SERVER_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "MEMBER_ONBOARDING")) {
      return apiError("Insufficient permission to edit member", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const data = parsed.data;

    const existing = await prisma.member.findFirst({
      where: { id, tenantId: session.tenantId, isDeleted: false },
    });

    if (!existing) {
      return apiError("Member not found", "NOT_FOUND", 404);
    }

    const updated = await prisma.member.update({
      where: { id: existing.id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.gender && { gender: data.gender }),
        ...(data.phone && { phone: data.phone }),
        ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.emergencyContactName !== undefined && { emergencyContactName: data.emergencyContactName }),
        ...(data.emergencyContactPhone !== undefined && { emergencyContactPhone: data.emergencyContactPhone }),
        ...(data.assignedTrainerId !== undefined && { assignedTrainerId: data.assignedTrainerId }),
        ...(data.status && { status: data.status }),
        ...(data.healthMetrics && { healthMetrics: data.healthMetrics as any }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.doorLockUid !== undefined && {
          customFields: {
            ...((existing.customFields as Record<string, any>) || {}),
            doorLockUid: data.doorLockUid,
          },
        }),
      },
    });

    // Log mutation in AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.id,
        action: "MEMBER_UPDATED",
        entityType: "MEMBER",
        entityId: id,
        oldValues: { name: `${existing.firstName} ${existing.lastName}`, phone: existing.phone },
        newValues: { name: `${updated.firstName} ${updated.lastName}`, phone: updated.phone },
      },
    });

    return apiSuccess(updated);
  } catch (error: any) {
    console.error("Update Member API Error:", error);
    return apiError("Failed to update member profile", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "FREEZE_CANCEL_MEMBERSHIP") && !hasPermission(session.role, "MEMBER_ONBOARDING")) {
      return apiError("Insufficient permission to delete member", "FORBIDDEN", 403);
    }

    const { id } = await params;

    const existing = await prisma.member.findFirst({
      where: { id, tenantId: session.tenantId, isDeleted: false },
    });

    if (!existing) {
      return apiError("Member not found", "NOT_FOUND", 404);
    }

    // Soft delete
    await prisma.member.update({
      where: { id: existing.id },
      data: { isDeleted: true, status: MemberStatus.CANCELLED },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.id,
        action: "MEMBER_SOFT_DELETED",
        entityType: "MEMBER",
        entityId: id,
      },
    });

    return apiSuccess({ message: "Member successfully removed" });
  } catch (error: any) {
    console.error("Delete Member API Error:", error);
    return apiError("Failed to delete member", "SERVER_ERROR", 500);
  }
}
