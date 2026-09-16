import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

const createCalendarEventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  isRecurringYearly: z.boolean().default(false),
  eventType: z.enum(["ANNIVERSARY", "HOLIDAY", "WORKOUT_CHALLENGE", "MAINTENANCE", "SPECIAL_OCCASION"]).default("SPECIAL_OCCASION"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // 1-12
    const yearParam = searchParams.get("year"); // e.g. 2026

    const now = new Date();
    const targetYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const targetMonth = monthParam ? parseInt(monthParam, 10) - 1 : now.getMonth();

    const rangeStart = new Date(targetYear, targetMonth, 1);
    const rangeEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // 1. Fetch custom stored events for this tenant
    const events = await prisma.calendarEvent.findMany({
      where: {
        tenantId: session.tenantId,
        OR: [
          {
            eventDate: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          {
            isRecurringYearly: true,
          },
        ],
      },
      orderBy: { eventDate: "asc" },
    });

    // 2. Fetch all active members to compute birthdays and subscription expirations in this period
    const members = await prisma.member.findMany({
      where: {
        tenantId: session.tenantId,
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        memberCode: true,
        dateOfBirth: true,
        memberships: {
          where: {
            status: "ACTIVE",
            endDate: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          select: {
            id: true,
            endDate: true,
            status: true,
            planVersion: {
              select: {
                plan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Filter members having birthday in targetMonth
    const birthdays = members
      .filter((m) => {
        if (!m.dateOfBirth) return false;
        const bday = new Date(m.dateOfBirth);
        return bday.getMonth() === targetMonth;
      })
      .map((m) => {
        const bday = new Date(m.dateOfBirth!);
        const currentYearDate = new Date(targetYear, targetMonth, bday.getDate());
        return {
          id: `bday-${m.id}`,
          title: `🎂 ${m.firstName} ${m.lastName}'s Birthday`,
          description: `Member Code: ${m.memberCode} | Contact: ${m.phone}`,
          eventDate: currentYearDate.toISOString().split("T")[0],
          eventType: "BIRTHDAY" as const,
          isRecurringYearly: true,
          memberId: m.id,
          phone: m.phone,
        };
      });

    // Extract expirations
    const expirations: any[] = [];
    members.forEach((m) => {
      m.memberships.forEach((ms) => {
        const planName = ms.planVersion?.plan?.name || "Membership";
        expirations.push({
          id: `exp-${ms.id}`,
          title: `⏰ ${m.firstName} ${m.lastName} (${planName}) Expires`,
          description: `Plan: ${planName} | Phone: ${m.phone}`,
          eventDate: new Date(ms.endDate).toISOString().split("T")[0],
          eventType: "EXPIRY" as const,
          isRecurringYearly: false,
          memberId: m.id,
          phone: m.phone,
        });
      });
    });

    // Format custom events
    const formattedCustomEvents = events.map((e) => {
      let dateStr = new Date(e.eventDate).toISOString().split("T")[0];
      if (e.isRecurringYearly) {
        const orig = new Date(e.eventDate);
        dateStr = new Date(targetYear, orig.getMonth(), orig.getDate()).toISOString().split("T")[0];
      }
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        eventDate: dateStr,
        eventType: e.eventType,
        isRecurringYearly: e.isRecurringYearly,
      };
    });

    const combinedList = [...formattedCustomEvents, ...birthdays, ...expirations].sort(
      (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );

    return apiSuccess({
      year: targetYear,
      month: targetMonth + 1,
      totalEvents: combinedList.length,
      events: combinedList,
    });
  } catch (error: any) {
    console.error("Calendar GET error:", error);
    return apiError("Failed to fetch calendar events", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parsed = createCalendarEventSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { title, description, eventDate, isRecurringYearly, eventType } = parsed.data;

    const event = await prisma.calendarEvent.create({
      data: {
        tenantId: session.tenantId,
        title,
        description: description || null,
        eventDate: new Date(eventDate),
        isRecurringYearly,
        eventType,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.id,
        action: "CALENDAR_EVENT_CREATED",
        entityType: "CALENDAR_EVENT",
        entityId: event.id,
        newValues: { title, eventDate, eventType, isRecurringYearly },
      },
    });

    return apiSuccess(event, undefined, 201);
  } catch (error: any) {
    console.error("Calendar POST error:", error);
    return apiError("Failed to create calendar event", "SERVER_ERROR", 500);
  }
}
