import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { broadcastPushNotification } from "@/lib/push-notifications";
import { apiError, apiSuccess } from "@/lib/api-response";

const broadcastSchema = z.object({
  title: z.string().min(1, "Notification title is required"),
  body: z.string().min(1, "Notification message body is required"),
  url: z.string().optional().default("/portal"),
  tag: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { title, body: msgBody, url, tag } = parsed.data;

    const stats = await broadcastPushNotification({
      tenantId: session.tenantId,
      payload: {
        title,
        body: msgBody,
        url,
        tag: tag || "gym-announcement-" + Date.now(),
        vibrate: [150, 100, 150],
      },
    });

    return apiSuccess({
      message: `Push notification dispatched to ${stats.sent} devices (${stats.failed} failed)`,
      stats,
    });
  } catch (error: any) {
    console.error("Broadcast Push Notification Error:", error);
    return apiError("Failed to broadcast push notification", "SERVER_ERROR", 500);
  }
}
