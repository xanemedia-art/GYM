import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

const subscribeSchema = z.object({
  endpoint: z.string().url("Valid push service endpoint URL is required"),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh key is required"),
    auth: z.string().min(1, "auth secret is required"),
  }),
  deviceType: z.string().optional().default("MOBILE"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid push subscription payload", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { endpoint, keys, deviceType } = parsed.data;
    const userAgent = req.headers.get("user-agent") || undefined;

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        tenantId: session?.tenantId || null,
        userId: session?.id || null,
        userAgent,
        deviceType,
        isActive: true,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        tenantId: session?.tenantId || undefined,
        userId: session?.id || undefined,
        userAgent,
        deviceType,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return apiSuccess({
      message: "Push subscription registered successfully",
      id: subscription.id,
      deviceType: subscription.deviceType,
    });
  } catch (error: any) {
    console.error("Push Subscribe API Error:", error);
    return apiError("Failed to register push subscription", "SERVER_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const endpoint = body.endpoint;

    if (!endpoint) {
      return apiError("Endpoint is required to unsubscribe", "VALIDATION_ERROR", 400);
    }

    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { isActive: false },
    });

    return apiSuccess({ message: "Device successfully unsubscribed from push notifications" });
  } catch (error: any) {
    console.error("Push Unsubscribe API Error:", error);
    return apiError("Failed to remove push subscription", "SERVER_ERROR", 500);
  }
}
