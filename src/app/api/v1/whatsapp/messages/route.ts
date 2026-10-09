import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { ChannelType, MemberStatus } from "@prisma/client";

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

    // 1. Fetch Recent WhatsApp Communication Logs
    const recentLogs = await prisma.communicationLog.findMany({
      where: {
        tenantId,
        channel: ChannelType.WHATSAPP,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberCode: true,
            phone: true,
          },
        },
      },
    });

    // 2. Compute Today's Pending Birthday Messages
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const membersWithDob = await prisma.member.findMany({
      where: {
        tenantId,
        isDeleted: false,
        status: { in: [MemberStatus.ACTIVE, MemberStatus.EXPIRING_SOON] },
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberCode: true,
        phone: true,
        whatsappNumber: true,
        dateOfBirth: true,
      },
    });

    // Members whose birthday is today
    const birthdayMembersToday = membersWithDob.filter((m) => {
      if (!m.dateOfBirth) return false;
      const d = new Date(m.dateOfBirth);
      return d.getUTCMonth() + 1 === currentMonth && d.getUTCDate() === currentDay;
    });

    // Check which ones already received a message today
    const todayLogs = await prisma.communicationLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: { memberId: true, messageContent: true },
    });

    const pendingBirthdays = birthdayMembersToday.filter((m) => {
      const alreadySent = todayLogs.some(
        (log) => log.memberId === m.id && log.messageContent.toLowerCase().includes("birthday")
      );
      return !alreadySent;
    });

    // 3. Compute Pending Expiry Reminders (expiring in 1, 3, 7 days)
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        endDate: { gte: now, lte: next7Days },
      },
      select: {
        id: true,
        endDate: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberCode: true,
            phone: true,
            whatsappNumber: true,
          },
        },
        planVersion: {
          select: {
            plan: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { endDate: "asc" },
      take: 15,
    });

    const pendingExpiries = expiringMemberships.map((sub) => {
      const remainingDays = Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        membershipId: sub.id,
        memberId: sub.member.id,
        fullName: `${sub.member.firstName} ${sub.member.lastName}`,
        memberCode: sub.member.memberCode,
        phone: sub.member.whatsappNumber || sub.member.phone,
        planName: sub.planVersion.plan.name,
        endDate: sub.endDate,
        daysRemaining: remainingDays,
      };
    });

    return apiSuccess({
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        recipient: log.recipient,
        messageContent: log.messageContent,
        status: log.status,
        createdAt: log.createdAt,
        deliveredAt: log.deliveredAt,
        errorMessage: log.errorMessage,
        member: log.member
          ? {
              fullName: `${log.member.firstName} ${log.member.lastName}`,
              memberCode: log.member.memberCode,
              phone: log.member.phone,
            }
          : null,
      })),
      pendingBirthdays: pendingBirthdays.map((m) => ({
        id: m.id,
        fullName: `${m.firstName} ${m.lastName}`,
        memberCode: m.memberCode,
        phone: m.whatsappNumber || m.phone,
        dateOfBirth: m.dateOfBirth,
      })),
      pendingExpiries,
    });
  } catch (error: any) {
    console.error("WhatsApp Messages GET Error:", error);
    return apiError("Failed to fetch WhatsApp messages", "SERVER_ERROR", 500);
  }
}
