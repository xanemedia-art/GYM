import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { MemberStatus } from "@prisma/client";

const renewMembershipSchema = z.object({
  memberId: z.string().uuid("Valid member ID is required"),
  planId: z.string().uuid("Valid plan ID is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const tenantId = session.tenantId;

    const body = await req.json();
    const parsed = renewMembershipSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { memberId, planId, startDate: startDateStr } = parsed.data;

    // 1. Verify Member belongs to this branch workspace
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        tenantId: session.tenantId,
        isDeleted: false,
      },
    });

    if (!member) {
      return apiError("Member profile not found in your branch workspace", "NOT_FOUND", 404);
    }

    // 2. Verify Plan belongs to this branch
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        tenantId: session.tenantId,
        isActive: true,
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!plan) {
      return apiError("Membership plan not found or inactive", "NOT_FOUND", 404);
    }

    let planVersion = plan.versions[0];
    if (!planVersion) {
      planVersion = await prisma.membershipPlanVersion.create({
        data: {
          planId: plan.id,
          versionNumber: 1,
          durationDays: plan.durationDays,
          basePrice: plan.basePrice,
        },
      });
    }

    // 3. Compute Dates
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planVersion.durationDays);

    // 4. Update in fast atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create new Membership record
      const membership = await tx.membership.create({
        data: {
          tenantId,
          memberId: member.id,
          planVersionId: planVersion.id,
          startDate,
          endDate,
          originalEndDate: endDate,
          status: MemberStatus.ACTIVE,
        },
        include: {
          planVersion: {
            include: { plan: true },
          },
        },
      });

      // Update Member status to ACTIVE & update notes
      const updatedMember = await tx.member.update({
        where: { id: member.id },
        data: {
          status: MemberStatus.ACTIVE,
          notes: `${member.notes || ""}\n[${new Date().toISOString().split("T")[0]}] Activated/Renewed ${plan.name} (${planVersion.durationDays} days) by ${session.fullName}. Fee collected offline at desk.`.trim(),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session.id,
          action: "MEMBERSHIP_ACTIVATED_OFFLINE",
          entityType: "MEMBERSHIP",
          entityId: membership.id,
          newValues: {
            planName: plan.name,
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            staffName: session.fullName,
          },
        },
      });

      return { membership, updatedMember };
    });

    return apiSuccess({
      message: `Membership successfully activated for ${member.firstName} ${member.lastName}!`,
      membershipId: result.membership.id,
      planName: plan.name,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      memberStatus: result.updatedMember.status,
    });
  } catch (error: any) {
    console.error("Renew Membership API Error:", error);
    return apiError("Failed to renew membership", "SERVER_ERROR", 500);
  }
}
