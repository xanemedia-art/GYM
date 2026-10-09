import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";

const manualPunchSchema = z.object({
  memberId: z.string().uuid("Valid member ID required"),
  punchType: z.enum(["CHECK_IN", "CHECK_OUT"]).default("CHECK_IN"),
  verificationMode: z.string().default("MANUAL"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "MANUAL_ATTENDANCE")) {
      return apiError("Insufficient permission to record manual attendance", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = manualPunchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { memberId, punchType, verificationMode } = parsed.data;

    // Verify member exists in tenant (lean selection for sub-20ms high concurrency)
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId: session.tenantId, isDeleted: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberCode: true,
        status: true,
        memberships: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { endDate: "desc" },
          select: {
            id: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    if (!member) {
      return apiError("Member not found", "NOT_FOUND", 404);
    }

    const punchTime = new Date();
    // 5-minute deduplication bucket
    const bucket = Math.floor(punchTime.getTime() / (5 * 60 * 1000));
    const dedupHash = crypto
      .createHash("sha256")
      .update(`${session.tenantId}:${member.id}:${bucket}`)
      .digest("hex");

    // Check duplicate
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        uq_attendance_dedup: {
          tenantId: session.tenantId,
          dedupHash,
        },
      },
    });

    if (existing) {
      return apiError("Member has already punched within the last 5 minutes", "DUPLICATE_PUNCH", 409);
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        tenantId: session.tenantId,
        memberId: member.id,
        punchTime,
        punchType,
        verificationMode,
        isManualEntry: true,
        verifiedById: session.id,
        dedupHash,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberCode: true,
            status: true,
          },
        },
      },
    });

    return apiSuccess({
      record,
      hasActiveMembership: member.memberships.length > 0,
      membershipDetails: member.memberships[0] || null,
    }, undefined, 201);
  } catch (error: any) {
    console.error("Manual Attendance API Error:", error);
    return apiError("Failed to record manual attendance", "SERVER_ERROR", 500);
  }
}
