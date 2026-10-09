import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Default dev VAPID keypair so local dev and testing work immediately out-of-the-box
// Can be overridden via environment variables in production
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "UU2iMo0hiTstaeFlmWpbdDOvLHYL-epPbqcTHZyUMsg";

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@befreefitness.in";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (!vapidConfigured) {
    try {
      webpush.setVapidDetails(
        VAPID_SUBJECT,
        DEFAULT_VAPID_PUBLIC_KEY,
        DEFAULT_VAPID_PRIVATE_KEY
      );
      vapidConfigured = true;
    } catch (err) {
      console.error("[WebPush] Failed to set VAPID details:", err);
    }
  }
}

export function getVapidPublicKey(): string {
  return DEFAULT_VAPID_PUBLIC_KEY;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  vibrate?: number[];
  timestamp?: number;
  data?: Record<string, any>;
}

export function formatPushPayload(payload: PushNotificationPayload): string {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/bff-icon.png",
    badge: payload.badge || "/bff-icon.png",
    url: payload.url || "/portal",
    tag: payload.tag || "gym-alert",
    vibrate: payload.vibrate || [100, 50, 100],
    timestamp: payload.timestamp || Date.now(),
    data: {
      url: payload.url || "/portal",
      ...(payload.data || {}),
    },
  });
}

/**
 * Sends a web push notification to a single device subscription.
 * Automatically deactivates the subscription if the push service returns 404 or 410 (expired/uninstalled).
 */
export async function sendPushNotification(
  subscription: {
    id?: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushNotificationPayload
): Promise<{ success: boolean; statusCode?: number; error?: string; expired?: boolean }> {
  ensureVapidConfigured();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const payloadString = formatPushPayload(payload);

  try {
    const result = await webpush.sendNotification(pushSubscription, payloadString, {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: "high",
    });

    return {
      success: true,
      statusCode: result.statusCode,
    };
  } catch (err: any) {
    const statusCode = err.statusCode || err.status;
    const isExpired = statusCode === 410 || statusCode === 404;

    console.warn(
      `[WebPush] Push delivery failed for endpoint: ${subscription.endpoint.slice(0, 40)}... (status: ${statusCode})`
    );

    // Auto-clean expired subscription if ID is known
    if (isExpired && subscription.id) {
      try {
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        });
        console.log(`[WebPush] Deactivated expired subscription ID: ${subscription.id}`);
      } catch (dbErr) {
        console.error("[WebPush] Failed to deactivate expired subscription:", dbErr);
      }
    }

    return {
      success: false,
      statusCode,
      error: err.message || "Failed to deliver push notification",
      expired: isExpired,
    };
  }
}

/**
 * Broadcasts a push notification to all active devices in a gym tenant.
 * Can filter by tenantId and targetUserIds.
 */
export async function broadcastPushNotification({
  tenantId,
  targetUserIds,
  payload,
}: {
  tenantId?: string;
  targetUserIds?: string[];
  payload: PushNotificationPayload;
}): Promise<{ total: number; sent: number; failed: number }> {
  ensureVapidConfigured();

  const whereClause: any = {
    isActive: true,
  };

  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  if (targetUserIds && targetUserIds.length > 0) {
    whereClause.userId = { in: targetUserIds };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: whereClause,
  });

  if (subscriptions.length === 0) {
    return { total: 0, sent: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushNotification(
        {
          id: sub.id,
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload
      )
    )
  );

  let sent = 0;
  let failed = 0;

  results.forEach((res) => {
    if (res.status === "fulfilled" && res.value.success) {
      sent++;
    } else {
      failed++;
    }
  });

  return {
    total: subscriptions.length,
    sent,
    failed,
  };
}
