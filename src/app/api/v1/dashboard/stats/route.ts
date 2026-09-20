import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { MemberStatus, InvoiceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const tenantId = session.tenantId;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Member metrics
    const [totalMembers, activeMembers, expiringSoonMembers, expiredMembers] = await Promise.all([
      prisma.member.count({ where: { tenantId, isDeleted: false } }),
      prisma.member.count({ where: { tenantId, status: MemberStatus.ACTIVE, isDeleted: false } }),
      prisma.member.count({ where: { tenantId, status: MemberStatus.EXPIRING_SOON, isDeleted: false } }),
      prisma.member.count({ where: { tenantId, status: MemberStatus.EXPIRED, isDeleted: false } }),
    ]);

    // 2. Revenue & Financials
    const [todayPayments, monthPayments, outstandingInvoices] = await Promise.all([
      prisma.payment.aggregate({
        where: { tenantId, paymentDate: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { tenantId, paymentDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
        },
        _sum: { balanceAmount: true },
      }),
    ]);

    // 3. Attendance
    const [todayCheckIns, recentCheckIns] = await Promise.all([
      prisma.attendanceRecord.count({
        where: { tenantId, punchTime: { gte: todayStart, lte: todayEnd } },
      }),
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
    ]);

    // 4. Birthdays (find members whose DOB month & day match today)
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Query members with DOB
    const allMembersWithDob = await prisma.member.findMany({
      where: {
        tenantId,
        isDeleted: false,
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberCode: true,
        phone: true,
        dateOfBirth: true,
        photoUrl: true,
      },
    });

    const todayBirthdays = allMembersWithDob.filter((m) => {
      if (!m.dateOfBirth) return false;
      const d = new Date(m.dateOfBirth);
      return d.getUTCMonth() + 1 === currentMonth && d.getUTCDate() === currentDay;
    });

    const tomorrowBirthdays = allMembersWithDob.filter((m) => {
      if (!m.dateOfBirth) return false;
      const d = new Date(m.dateOfBirth);
      return d.getUTCMonth() + 1 === currentMonth && d.getUTCDate() === currentDay + 1;
    });

    // 5. Hardware Device Status
    const devices = await prisma.device.findMany({
      where: { tenantId },
      select: {
        id: true,
        deviceName: true,
        serialNumber: true,
        isOnline: true,
        lastHeartbeatAt: true,
      },
    });

    // 6. Upcoming Month Forecast Outlook
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
    const nextMonthIndex = nextMonthDate.getMonth();

    const [nextMonthExpiringCount, nextMonthEventsCount] = await Promise.all([
      prisma.membership.count({
        where: {
          tenantId,
          status: "ACTIVE",
          endDate: { gte: nextMonthDate, lte: nextMonthEnd },
        },
      }),
      prisma.calendarEvent.count({
        where: {
          tenantId,
          OR: [
            { eventDate: { gte: nextMonthDate, lte: nextMonthEnd } },
            { isRecurringYearly: true },
          ],
        },
      }),
    ]);

    const nextMonthBirthdaysCount = allMembersWithDob.filter((m) => {
      if (!m.dateOfBirth) return false;
      const d = new Date(m.dateOfBirth);
      return d.getUTCMonth() === nextMonthIndex;
    }).length;

    const upcomingMonth = {
      monthName: nextMonthDate.toLocaleString("default", { month: "long" }),
      year: nextMonthDate.getFullYear(),
      monthNumber: nextMonthIndex + 1,
      expiringMembers: nextMonthExpiringCount,
      birthdays: nextMonthBirthdaysCount,
      events: nextMonthEventsCount,
    };

    return apiSuccess({
      members: {
        total: totalMembers,
        active: activeMembers,
        expiringSoon: expiringSoonMembers,
        expired: expiredMembers,
      },
      revenue: {
        today: Number(todayPayments._sum.amount || 0),
        thisMonth: Number(monthPayments._sum.amount || 0),
        outstandingBalance: Number(outstandingInvoices._sum.balanceAmount || 0),
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
    });
  } catch (error: any) {
    console.error("Dashboard Stats API Error:", error);
    return apiError("Failed to fetch dashboard metrics", "SERVER_ERROR", 500);
  }
}
