import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { MemberStatus, InvoiceStatus } from "@prisma/client";

interface CacheEntry {
  data: any;
  timestamp: number;
}
const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2000; // 2 seconds micro-debounce for ultra-live accuracy

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const tenantId = session.tenantId;
    const isFresh = req.nextUrl.searchParams.get("fresh") === "true";

    const cached = statsCache.get(tenantId);
    if (!isFresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      const res = apiSuccess(cached.data);
      res.headers.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
      return res;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowMonth = tomorrowDate.getMonth() + 1;
    const tomorrowDay = tomorrowDate.getDate();

    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
    const nextMonthIndex = nextMonthDate.getMonth();
    const nextMonthNumber = nextMonthIndex + 1;

    // Run all database queries in a single consolidated parallel batch
    const [
      statusGroups,
      pendingMembersList,
      todayCheckIns,
      recentCheckIns,
      devices,
      nextMonthExpiringCount,
      nextMonthEventsCount,
      todayBirthdays,
      tomorrowBirthdays,
      nextMonthBirthdaysResult,
      todayRevenueAgg,
      thisMonthRevenueAgg,
      outstandingBalanceAgg,
    ] = await Promise.all([
      // 1. Single consolidated Member Status GroupBy (replaces 5 separate count queries)
      prisma.member.groupBy({
        by: ["status"],
        where: { tenantId, isDeleted: false },
        _count: { _all: true },
      }),
      // 2. Pending walk-in members (lean fields)
      prisma.member.findMany({
        where: { tenantId, status: MemberStatus.LEAD, isDeleted: false },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          memberCode: true,
          firstName: true,
          lastName: true,
          phone: true,
          whatsappNumber: true,
          gender: true,
          dateOfBirth: true,
          createdAt: true,
        },
      }),
      // 3. Today attendance count
      prisma.attendanceRecord.count({
        where: { tenantId, punchTime: { gte: todayStart, lte: todayEnd } },
      }),
      // 4. Recent attendance punches
      prisma.attendanceRecord.findMany({
        where: { tenantId, punchTime: { gte: todayStart } },
        take: 10,
        orderBy: { punchTime: "desc" },
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, memberCode: true, photoUrl: true },
          },
        },
      }),
      // 5. Hardware Device Status
      prisma.device.findMany({
        where: { tenantId },
        select: {
          id: true,
          deviceName: true,
          serialNumber: true,
          isOnline: true,
          lastHeartbeatAt: true,
        },
      }),
      // 6. Next Month Expiring Memberships
      prisma.membership.count({
        where: {
          tenantId,
          status: "ACTIVE",
          endDate: { gte: nextMonthDate, lte: nextMonthEnd },
        },
      }),
      // 7. Next Month Calendar Events
      prisma.calendarEvent.count({
        where: {
          tenantId,
          OR: [
            { eventDate: { gte: nextMonthDate, lte: nextMonthEnd } },
            { isRecurringYearly: true },
          ],
        },
      }),
      // 8. Direct SQL Birthday Extraction for Today (replaces loading all members)
      prisma.$queryRaw<any[]>`
        SELECT id, first_name AS "firstName", last_name AS "lastName", member_code AS "memberCode", phone, date_of_birth AS "dateOfBirth", photo_url AS "photoUrl"
        FROM members
        WHERE tenant_id = ${tenantId}
          AND is_deleted = false
          AND date_of_birth IS NOT NULL
          AND EXTRACT(MONTH FROM date_of_birth) = ${currentMonth}
          AND EXTRACT(DAY FROM date_of_birth) = ${currentDay}
        LIMIT 20
      `,
      // 9. Direct SQL Birthday Extraction for Tomorrow
      prisma.$queryRaw<any[]>`
        SELECT id, first_name AS "firstName", last_name AS "lastName", member_code AS "memberCode", phone, date_of_birth AS "dateOfBirth", photo_url AS "photoUrl"
        FROM members
        WHERE tenant_id = ${tenantId}
          AND is_deleted = false
          AND date_of_birth IS NOT NULL
          AND EXTRACT(MONTH FROM date_of_birth) = ${tomorrowMonth}
          AND EXTRACT(DAY FROM date_of_birth) = ${tomorrowDay}
        LIMIT 20
      `,
      // 10. Direct SQL Count for Next Month Birthdays
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM members
        WHERE tenant_id = ${tenantId}
          AND is_deleted = false
          AND date_of_birth IS NOT NULL
          AND EXTRACT(MONTH FROM date_of_birth) = ${nextMonthNumber}
      `,
      // 11. Live Today Revenue Aggregate
      prisma.payment.aggregate({
        where: { tenantId, paymentDate: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      // 12. Live This Month Revenue Aggregate
      prisma.payment.aggregate({
        where: { tenantId, paymentDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      // 13. Live Outstanding Balance Aggregate
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] } },
        _sum: { balanceAmount: true },
      }),
    ]);

    // Aggregate member counts from single groupBy
    let totalMembers = 0;
    let activeMembers = 0;
    let expiringSoonMembers = 0;
    let expiredMembers = 0;
    let pendingMembersCount = 0;

    for (const group of statusGroups) {
      const count = group._count._all;
      totalMembers += count;
      if (group.status === MemberStatus.ACTIVE) activeMembers = count;
      else if (group.status === MemberStatus.EXPIRING_SOON) expiringSoonMembers = count;
      else if (group.status === MemberStatus.EXPIRED) expiredMembers = count;
      else if (group.status === MemberStatus.LEAD) pendingMembersCount = count;
    }

    const nextMonthBirthdaysCount = Number(nextMonthBirthdaysResult[0]?.count || 0);

    const upcomingMonth = {
      monthName: nextMonthDate.toLocaleString("default", { month: "long" }),
      year: nextMonthDate.getFullYear(),
      monthNumber: nextMonthIndex + 1,
      expiringMembers: nextMonthExpiringCount,
      birthdays: nextMonthBirthdaysCount,
      events: nextMonthEventsCount,
    };

    const statsPayload = {
      members: {
        total: totalMembers,
        active: activeMembers,
        expiringSoon: expiringSoonMembers,
        expired: expiredMembers,
      },
      pendingMembers: {
        count: pendingMembersCount,
        list: pendingMembersList,
      },
      revenue: {
        today: Number(todayRevenueAgg._sum.amount || 0),
        thisMonth: Number(thisMonthRevenueAgg._sum.amount || 0),
        outstandingBalance: Number(outstandingBalanceAgg._sum.balanceAmount || 0),
      },
      attendance: {
        todayCheckIns,
        recentCheckIns,
      },
      birthdays: {
        today: todayBirthdays,
        tomorrow: tomorrowBirthdays,
      },
      devices,
      upcomingMonth,
    };

    statsCache.set(tenantId, { data: statsPayload, timestamp: Date.now() });

    const res = apiSuccess(statsPayload);
    res.headers.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return res;
  } catch (error: any) {
    console.error("Dashboard Stats API Error:", error);
    return apiError("Failed to fetch dashboard metrics", "SERVER_ERROR", 500);
  }
}

