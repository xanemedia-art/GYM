import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

interface AttendanceCacheEntry {
  data: any;
  timestamp: number;
}
const attendanceCache = new Map<string, AttendanceCacheEntry>();
const ATTENDANCE_CACHE_TTL_MS = 2000; // 2 seconds micro-debounce for ultra-live accuracy

export function invalidateAttendanceTodayCache(tenantId?: string) {
  if (tenantId) {
    attendanceCache.delete(tenantId);
  } else {
    attendanceCache.clear();
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const tenantId = session.tenantId;
    const isFresh = req.nextUrl.searchParams.get("fresh") === "true";

    const cached = attendanceCache.get(tenantId);
    if (!isFresh && cached && Date.now() - cached.timestamp < ATTENDANCE_CACHE_TTL_MS) {
      const res = apiSuccess(cached.data);
      res.headers.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
      return res;
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

    const payload = {
      totalCheckIns,
      estimatedActiveInside: activeInside,
      recentPunches: records,
    };

    attendanceCache.set(tenantId, {
      data: payload,
      timestamp: Date.now(),
    });

    const res = apiSuccess(payload);
    res.headers.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
    return res;
  } catch (error: any) {
    console.error("Attendance Today API Error:", error);
    return apiError("Failed to fetch today's attendance feed", "SERVER_ERROR", 500);
  }
}
