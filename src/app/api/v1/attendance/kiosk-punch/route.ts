import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

const kioskPunchSchema = z.object({
  query: z.string().min(1, "Search query or member code required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parsed = kioskPunchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const rawQuery = parsed.data.query.trim();

    // 1. Search member by exact memberCode, phone, or name
    const member = await prisma.member.findFirst({
      where: {
        tenantId: session.tenantId,
        isDeleted: false,
        OR: [
          { memberCode: { equals: rawQuery, mode: "insensitive" } },
          { phone: { contains: rawQuery } },
          { firstName: { contains: rawQuery, mode: "insensitive" } },
          { lastName: { contains: rawQuery, mode: "insensitive" } },
        ],
      },
      include: {
        memberships: {
          orderBy: { endDate: "desc" },
          take: 1,
          include: {
            planVersion: {
              include: {
                plan: true,
              },
            },
          },
        },
        invoices: {
          where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!member) {
      return apiError("No member found matching query", "MEMBER_NOT_FOUND", 404);
    }

    const now = new Date();
    const activeMembership = member.memberships[0];

    // Calculate total balance due
    const totalBalanceDue = member.invoices.reduce(
      (sum, inv) => sum + Number(inv.balanceAmount || 0),
      0
    );

    // Evaluate Membership Validity
    let accessStatus: "GRANTED" | "EXPIRING_SOON" | "DENIED" | "FROZEN" = "GRANTED";
    let message = "Welcome to Be Free Fitness!";
    let daysRemaining = 0;

    if (!activeMembership) {
      accessStatus = "DENIED";
      message = "No active membership package on record.";
    } else if (activeMembership.status === "FROZEN") {
      accessStatus = "FROZEN";
      message = "Membership is currently frozen.";
    } else {
      const endDate = new Date(activeMembership.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        accessStatus = "DENIED";
        message = `Membership expired ${Math.abs(daysRemaining)} day(s) ago.`;
      } else if (daysRemaining <= 3) {
        accessStatus = "EXPIRING_SOON";
        message = `Access Granted. Notice: Membership expires in ${daysRemaining} day(s)!`;
      }
    }

    // If access is granted or expiring soon, record attendance punch (with 5-minute dedup)
    let punchRecorded = false;
    let isDuplicate = false;

    if (accessStatus === "GRANTED" || accessStatus === "EXPIRING_SOON") {
      const windowMinutes = 5;
      const windowMs = windowMinutes * 60 * 1000;
      const roundedTime = Math.floor(now.getTime() / windowMs) * windowMs;
      const dedupHash = crypto
        .createHash("sha256")
        .update(`${session.tenantId}:${member.id}:CHECK_IN:${roundedTime}`)
        .digest("hex");

      try {
        await prisma.attendanceRecord.create({
          data: {
            tenantId: session.tenantId,
            memberId: member.id,
            punchTime: now,
            punchType: "CHECK_IN",
            verificationMode: "KIOSK_DESK",
            isManualEntry: true,
            verifiedById: session.id,
            dedupHash,
          },
        });
        punchRecorded = true;
      } catch (err: any) {
        if (err.code === "P2002") {
          // Duplicate punch in 5 min window
          isDuplicate = true;
          message = "Already checked in recently! (Access verified)";
        } else {
          console.error("Kiosk punch error:", err);
        }
      }
    }

    return apiSuccess({
      accessStatus,
      message,
      punchRecorded,
      isDuplicate,
      daysRemaining: Math.max(0, daysRemaining),
      totalBalanceDue,
      member: {
        id: member.id,
        memberCode: member.memberCode,
        fullName: `${member.firstName} ${member.lastName}`,
        phone: member.phone,
        status: member.status,
        planName: activeMembership?.planVersion?.plan?.name || "No Plan",
        membershipEndDate: activeMembership?.endDate || null,
        emergencyPhone: member.emergencyContactPhone,
      },
    });
  } catch (error: any) {
    console.error("Kiosk Punch Error:", error);
    return apiError("Failed to process kiosk punch", "SERVER_ERROR", 500);
  }
}
