import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { apiError, apiSuccess } from "@/lib/api-response";
import { UserRole } from "@prisma/client";

const updateStaffSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable().or(z.literal("")),
  role: z.enum([
    UserRole.MANAGER,
    UserRole.FRONT_DESK,
    UserRole.TRAINER,
    UserRole.ACCOUNTANT,
  ]).optional(),
  tenantId: z.string().uuid().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== UserRole.GYM_OWNER && session.role !== UserRole.SUPER_ADMIN) {
      return apiError("Only the gym owner can modify staff accounts", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const data = parsed.data;

    // Fetch existing staff user
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existing) {
      return apiError("Staff member not found", "NOT_FOUND", 404);
    }

    // Safety guard: Owner cannot demote or deactivate their own account via staff API
    if (existing.email === session.email && (data.isActive === false || data.role !== undefined)) {
      return apiError("You cannot deactivate or modify the role of your own Gym Owner account", "FORBIDDEN", 403);
    }

    const updatePayload: any = {};

    if (data.fullName) updatePayload.fullName = data.fullName.trim();
    if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null;
    if (data.role) updatePayload.role = data.role;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    // Reassigning branch
    if (data.tenantId && data.tenantId !== existing.tenantId) {
      const targetBranch = await prisma.tenant.findUnique({
        where: { id: data.tenantId },
      });
      if (!targetBranch || !targetBranch.isActive) {
        return apiError("Target branch not found or inactive", "NOT_FOUND", 404);
      }
      updatePayload.tenantId = data.tenantId;
    }

    // Resetting password
    if (data.password && data.password.trim() !== "") {
      updatePayload.passwordHash = await hashPassword(data.password.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        isActive: true,
        lastLoginAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            businessName: true,
          },
        },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: updatedUser.tenantId || session.tenantId || "",
          userId: session.id,
          action: "STAFF_USER_UPDATED",
          entityType: "USER",
          entityId: updatedUser.id,
          newValues: {
            role: updatedUser.role,
            tenantId: updatedUser.tenantId,
            isActive: updatedUser.isActive,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Non-fatal audit log warning:", auditErr);
    }

    return apiSuccess(updatedUser);
  } catch (error: any) {
    console.error("Update Staff API Error:", error);
    return apiError(error?.message || "Failed to update staff member", "SERVER_ERROR", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== UserRole.GYM_OWNER && session.role !== UserRole.SUPER_ADMIN) {
      return apiError("Only the gym owner can delete staff accounts", "FORBIDDEN", 403);
    }

    const { id } = await params;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError("Staff member not found", "NOT_FOUND", 404);
    }

    // Safeguard: Cannot delete self
    if (existing.email === session.email) {
      return apiError("You cannot delete your own account", "FORBIDDEN", 403);
    }

    // Soft deactivate or hard delete if no critical foreign keys
    try {
      await prisma.user.delete({ where: { id } });
    } catch (fkErr) {
      // If foreign keys (e.g. past punches or payments) exist, safely deactivate the account
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return apiSuccess({ message: "Staff account removed or deactivated successfully" });
  } catch (error: any) {
    console.error("Delete Staff API Error:", error);
    return apiError("Failed to delete staff account", "SERVER_ERROR", 500);
  }
}
