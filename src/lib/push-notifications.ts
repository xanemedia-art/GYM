import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Default RFC 8292 compliant matching VAPID keypair
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  "BO93RP00Ulpv89DaYuXpVprTl_jwmLuouRyWuVPWzLqeQC6QFNs7LNMCT5i_bv2EablmLtuh4yoyc9vQizeMBcw";

const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "uk_fVnL9q8SncZpeEsewrsO26zO5Hg7afBoxgibqdBM";

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
  return (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    DEFAULT_VAPID_PUBLIC_KEY
  );
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
 * Automatically deactivates the subscription if the push service returns 404, 410, or key mismatch.
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
      headers: {
        "apns-push-type": "alert",
        "apns-priority": "10",
        "apns-topic": "in.befreefitness.app",
      },
    });

    return {
      success: true,
      statusCode: result.statusCode,
    };
  } catch (err: any) {
    const statusCode = err.statusCode || err.status;
    const bodyStr = typeof err.body === "string" ? err.body : JSON.stringify(err.body || "");
    const isExpired = statusCode === 410 || statusCode === 404;
    const isKeyMismatch =
      (statusCode === 400 && bodyStr.includes("VapidPkHashMismatch")) ||
      (statusCode === 403 && bodyStr.includes("BadJwtToken"));

    console.warn(
      `[WebPush] Push delivery failed for endpoint: ${subscription.endpoint.slice(0, 45)}... (status: ${statusCode}, reason: ${bodyStr})`
    );

    // Auto-clean expired or mismatched subscription if ID is known
    if ((isExpired || isKeyMismatch) && subscription.id) {
      try {
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        });
        console.log(`[WebPush] Deactivated stale subscription ID: ${subscription.id}`);
      } catch (dbErr) {
        console.error("[WebPush] Failed to deactivate invalid subscription:", dbErr);
      }
    }

    let userFriendlyError = err.message || "Failed to deliver push notification";
    if (isKeyMismatch) {
      userFriendlyError = "Push encryption key mismatch. Device subscription was reset. Tap 'Enable Push Notifications' to refresh.";
    } else if (isExpired) {
      userFriendlyError = "Device push subscription has expired. Tap 'Enable Push Notifications' to refresh.";
    }

    return {
      success: false,
      statusCode,
      error: userFriendlyError,
      expired: isExpired || isKeyMismatch,
    };
  }
}

/**
 * Broadcasts a push notification to active devices in a gym tenant.
 * Also alerts GYM_OWNER and SUPER_ADMIN devices across the gym network.
 */
export async function broadcastPushNotification({
  tenantId,
  targetUserIds,
  includeAdmins = true,
  payload,
}: {
  tenantId?: string;
  targetUserIds?: string[];
  includeAdmins?: boolean;
  payload: PushNotificationPayload;
}): Promise<{ total: number; sent: number; failed: number }> {
  ensureVapidConfigured();

  const whereConditions: any[] = [{ isActive: true }];

  if (tenantId && includeAdmins) {
    whereConditions.push({
      OR: [
        { tenantId },
        { user: { role: { in: ["SUPER_ADMIN", "GYM_OWNER"] } } },
        { tenantId: null },
      ],
    });
  } else if (tenantId) {
    whereConditions.push({ tenantId });
  }

  if (targetUserIds && targetUserIds.length > 0) {
    whereConditions.push({ userId: { in: targetUserIds } });
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      AND: whereConditions,
    },
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
