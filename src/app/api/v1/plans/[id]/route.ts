import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";

const updatePlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").optional(),
  description: z.string().optional().nullable(),
  durationDays: z.number().int().positive("Duration must be at least 1 day").optional(),
  basePrice: z.number().nonnegative("Base price cannot be negative").optional(),
  joiningFee: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
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

    const plan = await prisma.membershipPlan.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
      },
    });

    if (!plan) {
      return apiError("Membership plan not found", "NOT_FOUND", 404);
    }

    return apiSuccess(plan);
  } catch (error: any) {
    console.error("Get Plan Error:", error);
    return apiError("Failed to fetch membership plan", "SERVER_ERROR", 500);
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

    if (!hasPermission(session.role, "MANAGE_PLANS")) {
      return apiError("Insufficient permission to modify membership plans", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const data = parsed.data;

    const existingPlan = await prisma.membershipPlan.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });

    if (!existingPlan) {
      return apiError("Plan not found", "NOT_FOUND", 404);
    }

    const latestVersion = existingPlan.versions[0];
    const hasPricingOrDurationChanged =
      (data.durationDays !== undefined && data.durationDays !== latestVersion?.durationDays) ||
      (data.basePrice !== undefined && data.basePrice !== Number(latestVersion?.basePrice));

    const updatedPlan = await prisma.$transaction(async (tx) => {
      // If pricing or duration changed, create new version
      if (hasPricingOrDurationChanged && latestVersion) {
        await tx.membershipPlanVersion.create({
          data: {
            planId: existingPlan.id,
            versionNumber: latestVersion.versionNumber + 1,
            durationDays: data.durationDays ?? existingPlan.durationDays,
            basePrice: data.basePrice ?? existingPlan.basePrice,
            effectiveFrom: new Date(),
          },
        });
      }

      const updated = await tx.membershipPlan.update({
        where: { id: existingPlan.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.durationDays !== undefined && { durationDays: data.durationDays }),
          ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
          ...(data.joiningFee !== undefined && { joiningFee: data.joiningFee }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          versions: { orderBy: { versionNumber: "desc" } },
        },
      });

      return updated;
    });

    return apiSuccess(updatedPlan);
  } catch (error: any) {
    console.error("Update Plan API Error:", error);
    return apiError("Failed to update membership plan", "SERVER_ERROR", 500);
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

    if (!hasPermission(session.role, "MANAGE_PLANS")) {
      return apiError("Insufficient permission to delete membership plans", "FORBIDDEN", 403);
    }

    const { id } = await params;

    const existingPlan = await prisma.membershipPlan.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        versions: {
          include: {
            _count: { select: { memberships: true } },
          },
        },
      },
    });

    if (!existingPlan) {
      return apiError("Plan not found", "NOT_FOUND", 404);
    }

    const totalMemberships = existingPlan.versions.reduce(
      (sum, v) => sum + v._count.memberships,
      0
    );

    if (totalMemberships > 0) {
      // Deactivate so historical subscriptions remain intact
      await prisma.membershipPlan.update({
        where: { id: existingPlan.id },
        data: { isActive: false },
      });
      return apiSuccess({ message: "Plan deactivated successfully (active member contracts preserved)" });
    }

    // If never used, delete versions and plan
    await prisma.$transaction([
      prisma.membershipPlanVersion.deleteMany({ where: { planId: existingPlan.id } }),
      prisma.membershipPlan.delete({ where: { id: existingPlan.id } }),
    ]);

    return apiSuccess({ message: "Plan deleted successfully" });
  } catch (error: any) {
    console.error("Delete Plan API Error:", error);
    return apiError("Failed to delete membership plan", "SERVER_ERROR", 500);
  }
}
