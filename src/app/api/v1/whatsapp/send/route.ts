import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sendCustomWhatsAppMessage } from "@/lib/notifications/whatsapp";
import { runDailyNotificationScanner } from "@/lib/cron/scanner";

const sendCustomSchema = z.object({
  recipientPhone: z.string().min(10, "Valid 10-digit mobile number required"),
  message: z.string().min(1, "Message cannot be empty"),
  memberId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const tenantId = session.tenantId;
    const body = await req.json();

    // Check if on-demand batch dispatch was requested
    if (body.action === "dispatch_all_pending") {
      const summary = await runDailyNotificationScanner();
      return apiSuccess({
        message: "Automated scan and dispatch completed",
        summary,
      });
    }

    const parsed = sendCustomSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { recipientPhone, message, memberId } = parsed.data;

    // Dispatch custom message
    const result = await sendCustomWhatsAppMessage({
      tenantId,
      memberId: memberId || undefined,
      recipientPhone,
      messageText: message.trim(),
    });

    if (!result.success) {
      return apiError(result.error || "Failed to send WhatsApp message", "SEND_FAILED", 500);
    }

    const cleanPhone = recipientPhone.replace(/\D/g, "").slice(-10);
    const waMeUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message.trim())}`;

    return apiSuccess({
      message: "WhatsApp message dispatched successfully",
      messageId: result.messageId,
      waMeUrl,
    });
  } catch (error: any) {
    console.error("WhatsApp Send API Error:", error);
    return apiError("Failed to process message request", "SERVER_ERROR", 500);
  }
}
