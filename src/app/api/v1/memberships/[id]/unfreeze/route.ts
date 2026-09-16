import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { MemberStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "FREEZE_CANCEL_MEMBERSHIP")) {
      return apiError("Insufficient permission to unfreeze memberships", "FORBIDDEN", 403);
    }

    const { id } = await params;

    const membership = await prisma.membership.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        freezeLogs: {
          where: { unfrozenAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!membership) {
      return apiError("Membership not found", "NOT_FOUND", 404);
    }

    if (membership.status !== MemberStatus.FROZEN) {
      return apiError("Membership is not currently frozen", "NOT_FROZEN", 400);
    }

    const unfreezeDate = new Date();
    const activeFreezeLog = membership.freezeLogs[0];

    // Calculate duration in frozen state
    let frozenDays = 1;
    if (activeFreezeLog) {
      const start = new Date(activeFreezeLog.freezeStartDate);
      const diffTime = Math.abs(unfreezeDate.getTime() - start.getTime());
      frozenDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Extend end date by the exact frozen duration
    const newEndDate = new Date(membership.endDate);
    newEndDate.setDate(newEndDate.getDate() + frozenDays);

    const result = await prisma.$transaction(async (tx) => {
      if (activeFreezeLog) {
        await tx.membershipFreezeLog.update({
          where: { id: activeFreezeLog.id },
          data: {
            freezeEndDate: unfreezeDate,
            unfrozenAt: unfreezeDate,
          },
        });
      }

      const updated = await tx.membership.update({
        where: { id: membership.id },
        data: {
          status: MemberStatus.ACTIVE,
          endDate: newEndDate,
          frozenDaysTotal: membership.frozenDaysTotal + frozenDays,
        },
      });

      await tx.member.update({
        where: { id: membership.memberId },
        data: { status: MemberStatus.ACTIVE },
      });

      return updated;
    });

    return apiSuccess({
      membership: result,
      extendedDays: frozenDays,
      newEndDate,
    });
  } catch (error: any) {
    console.error("Unfreeze Membership API Error:", error);
    return apiError("Failed to unfreeze membership", "SERVER_ERROR", 500);
  }
}
