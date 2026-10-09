import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { OFFICIAL_INDIAN_GOVT_HOLIDAYS } from "@/data/indian-holidays";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const tenantId = session.tenantId;

    let addedCount = 0;
    for (const h of OFFICIAL_INDIAN_GOVT_HOLIDAYS) {
      const eventDate = new Date(h.date);

      // Check if already exists
      const existing = await prisma.calendarEvent.findFirst({
        where: {
          tenantId,
          title: h.title,
          eventDate,
        },
      });

      if (!existing) {
        await prisma.calendarEvent.create({
          data: {
            tenantId,
            title: h.title,
            description: `${h.description} • Official Govt of India Gazetted Calendar`,
            eventDate,
            eventType: "HOLIDAY",
            isRecurringYearly: false,
          },
        });
        addedCount++;
      }
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.id,
        action: "INDIAN_HOLIDAYS_SYNCED",
        entityType: "CALENDAR_EVENT",
        entityId: tenantId,
        newValues: { syncedCount: addedCount },
      },
    });

    return apiSuccess({
      message: `Successfully synchronized ${addedCount} official Government of India holidays into your calendar!`,
      addedCount,
      totalHolidays: OFFICIAL_INDIAN_GOVT_HOLIDAYS.length,
    });
  } catch (error: any) {
    console.error("Sync Holidays Error:", error);
    return apiError("Failed to sync Indian Government calendar", "SERVER_ERROR", 500);
  }
}
