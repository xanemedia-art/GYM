import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable if relying on session
    }

    let targetSubscription: { endpoint: string; p256dh: string; auth: string; id?: string } | null = null;

    // 1. If explicit subscription provided in body
    if (body.endpoint && body.keys?.p256dh && body.keys?.auth) {
      targetSubscription = {
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      };
    } else if (session?.id) {
      // 2. Look up latest active subscription for this user
      const found = await prisma.pushSubscription.findFirst({
        where: { userId: session.id, isActive: true },
        orderBy: { updatedAt: "desc" },
      });
      if (found) {
        targetSubscription = {
          id: found.id,
          endpoint: found.endpoint,
          p256dh: found.p256dh,
          auth: found.auth,
        };
      }
    }

    if (!targetSubscription) {
      return apiError(
        "No active device subscription found. Please tap 'Enable Push Notifications' first.",
        "NOT_FOUND",
        404
      );
    }

    const tenantName = session?.tenantId
      ? (await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { businessName: true } }))?.businessName
      : "Be Free Fitness";

    const payload = {
      title: `${tenantName || "GymOS"} - Test Alert 🔔`,
      body: "Push alerts are active on your device! You will receive instant gym operational updates even when the app is closed.",
      url: "/settings",
      tag: "test-alert-" + Date.now(),
      vibrate: [200, 100, 200],
    };

    const result = await sendPushNotification(targetSubscription, payload);

    if (!result.success) {
      return apiError(
        result.error || "Failed to deliver push notification to device",
        "PUSH_ERROR",
        500,
        { statusCode: result.statusCode, expired: result.expired }
      );
    }

    return apiSuccess({
      message: "Test push notification successfully sent to device!",
      statusCode: result.statusCode,
    });
  } catch (error: any) {
    console.error("Test Push Notification Error:", error);
    return apiError("Server error sending test notification", "SERVER_ERROR", 500);
  }
}
