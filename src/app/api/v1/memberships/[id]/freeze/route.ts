import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { MemberStatus } from "@prisma/client";

const freezeSchema = z.object({
  freezeStartDate: z.string().optional(),
  reason: z.string().min(1, "Freeze reason required"),
});

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
      return apiError("Insufficient permission to freeze memberships", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = freezeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { freezeStartDate: inputStart, reason } = parsed.data;
    const freezeStartDate = inputStart ? new Date(inputStart) : new Date();

    const membership = await prisma.membership.findFirst({
      where: { id, tenantId: session.tenantId },
    });

    if (!membership) {
      return apiError("Membership not found", "NOT_FOUND", 404);
    }

    if (membership.status === MemberStatus.FROZEN) {
      return apiError("Membership is already frozen", "ALREADY_FROZEN", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const freezeLog = await tx.membershipFreezeLog.create({
        data: {
          membershipId: membership.id,
          frozenById: session.id,
          freezeStartDate,
          reason,
        },
      });

      const updated = await tx.membership.update({
        where: { id: membership.id },
        data: { status: MemberStatus.FROZEN },
      });

      await tx.member.update({
        where: { id: membership.memberId },
        data: { status: MemberStatus.FROZEN },
      });

      return { membership: updated, freezeLog };
    });

    return apiSuccess(result);
  } catch (error: any) {
    console.error("Freeze Membership API Error:", error);
    return apiError("Failed to freeze membership", "SERVER_ERROR", 500);
  }
}
