import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from "@/lib/notifications/whatsapp";
import { MemberStatus, InvoiceStatus } from "@prisma/client";

export interface CronScanResult {
  birthdaysProcessed: number;
  expiriesNotified: number;
  membershipsExpired: number;
  timestamp: string;
}

/**
 * Automated Cron Job Engine
 * Typically scheduled every morning at 06:00 AM IST.
 */
export async function runDailyMorningAutomation(): Promise<CronScanResult> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate(); // 1-31

  console.log(`[Automation] Starting daily morning scan at ${now.toISOString()}`);

  let birthdaysProcessed = 0;
  let expiriesNotified = 0;
  let membershipsExpired = 0;

  // -------------------------------------------------------------
  // 1. Process Member Birthdays
  // -------------------------------------------------------------
  const allActiveMembersWithDob = await prisma.member.findMany({
    where: {
      status: MemberStatus.ACTIVE,
      isDeleted: false,
      dateOfBirth: { not: null },
    },
    include: {
      tenant: {
        include: { settings: true },
      },
    },
  });

  for (const member of allActiveMembersWithDob) {
    if (!member.dateOfBirth) continue;
    const dob = new Date(member.dateOfBirth);

    if (dob.getUTCMonth() + 1 === currentMonth && dob.getUTCDate() === currentDay) {
      birthdaysProcessed++;
      const shouldSend = member.tenant?.settings?.autoWhatsappBirthdays ?? true;

      if (shouldSend) {
        console.log(`[Automation] Dispatching Birthday WhatsApp to ${member.firstName} ${member.lastName} (${member.phone})`);
        await sendWhatsAppTemplate({
          tenantId: member.tenantId,
          memberId: member.id,
          recipientPhone: member.whatsappNumber || member.phone,
          templateName: "member_birthday_wish",
          parameters: [
            { type: "text", text: member.firstName },
            { type: "text", text: member.tenant?.businessName || "Your Gym" },
          ],
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Scan Memberships Expiring in 7, 3, or 1 Days
  // -------------------------------------------------------------
  const reminderDays = [7, 3, 1];
  for (const days of reminderDays) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const expiringMemberships = await prisma.membership.findMany({
      where: {
        status: MemberStatus.ACTIVE,
        endDate: { gte: startOfTarget, lte: endOfTarget },
      },
      include: {
        member: true,
        planVersion: { include: { plan: true } },
        tenant: { include: { settings: true } },
      },
    });

    for (const membership of expiringMemberships) {
      expiriesNotified++;
      const shouldRemind = membership.tenant?.settings?.autoWhatsappReminders ?? true;

      if (shouldRemind) {
        console.log(`[Automation] Sending ${days}-day expiry reminder to ${membership.member.firstName} (${membership.member.phone})`);
        await sendWhatsAppTemplate({
          tenantId: membership.tenantId,
          memberId: membership.memberId,
          recipientPhone: membership.member.whatsappNumber || membership.member.phone,
          templateName: "membership_expiry_reminder",
          parameters: [
            { type: "text", text: membership.member.firstName },
            { type: "text", text: String(days) },
            { type: "text", text: membership.planVersion.plan.name },
            { type: "text", text: membership.endDate.toISOString().split("T")[0] },
          ],
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 3. Transition Expired Memberships (where endDate < today)
  // -------------------------------------------------------------
  const expiredMemberships = await prisma.membership.findMany({
    where: {
      status: MemberStatus.ACTIVE,
      endDate: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0) },
    },
  });

  for (const m of expiredMemberships) {
    await prisma.membership.update({
      where: { id: m.id },
      data: { status: MemberStatus.EXPIRED },
    });

    // Check if member has any other active memberships
    const otherActive = await prisma.membership.findFirst({
      where: { memberId: m.memberId, status: MemberStatus.ACTIVE },
    });

    if (!otherActive) {
      await prisma.member.update({
        where: { id: m.memberId },
        data: { status: MemberStatus.EXPIRED },
      });
    }

    membershipsExpired++;
  }

  console.log(`[Automation] Scan complete: ${birthdaysProcessed} birthdays, ${expiriesNotified} expiry notices, ${membershipsExpired} transitioned to expired.`);

  return {
    birthdaysProcessed,
    expiriesNotified,
    membershipsExpired,
    timestamp: now.toISOString(),
  };
}
