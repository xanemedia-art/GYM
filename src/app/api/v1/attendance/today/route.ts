import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        tenantId: session.tenantId,
        punchTime: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { punchTime: "desc" },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberCode: true,
            photoUrl: true,
            status: true,
            memberships: {
              where: { status: "ACTIVE" },
              take: 1,
              orderBy: { endDate: "desc" },
              include: {
                planVersion: {
                  include: { plan: { select: { name: true } } },
                },
              },
            },
          },
        },
        device: {
          select: { id: true, deviceName: true },
        },
      },
    });

    const totalCheckIns = records.length;
    // Estimated currently inside: check-ins in the last 90 minutes
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000);
    const activeInside = records.filter(
      (r) => new Date(r.punchTime) >= ninetyMinutesAgo && r.punchType === "CHECK_IN"
    ).length;

    return apiSuccess({
      totalCheckIns,
      estimatedActiveInside: activeInside,
      recentPunches: records,
    });
  } catch (error: any) {
    console.error("Attendance Today API Error:", error);
    return apiError("Failed to fetch today's attendance feed", "SERVER_ERROR", 500);
  }
}
