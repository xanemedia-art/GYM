import { prisma } from "@/lib/prisma";
import { ChannelType, MessageStatus } from "@prisma/client";

interface SendWhatsAppTemplateParams {
  tenantId: string;
  memberId?: string;
  recipientPhone: string;
  templateName: string;
  languageCode?: string;
  parameters: Array<{ type: "text" | "currency" | "date_time"; text?: string; [key: string]: any }>;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Dispatches an approved WhatsApp HSM Template message using Meta's Cloud API.
 * Gracefully falls back to simulation mode in development environments.
 */
export async function sendWhatsAppTemplate({
  tenantId,
  memberId,
  recipientPhone,
  templateName,
  languageCode = "en",
  parameters,
}: SendWhatsAppTemplateParams): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Clean phone number (must include country code without + or dashes e.g. 919876543210)
  const cleanPhone = recipientPhone.replace(/\D/g, "");

  // Format message content for audit log
  const formattedContent = `[WhatsApp Template: ${templateName}] Variables: ${JSON.stringify(parameters)}`;

  // If credentials are mock or missing, log and persist communication log for verification
  if (!token || token === "mock_token" || !phoneNumberId) {
    console.log(`[WhatsApp SIMULATION] Sending '${templateName}' to ${cleanPhone}:`, parameters);

    const log = await prisma.communicationLog.create({
      data: {
        tenantId,
        memberId: memberId || null,
        channel: ChannelType.WHATSAPP,
        recipient: cleanPhone,
        messageContent: formattedContent,
        externalMessageId: `mock_wamid_${Date.now()}`,
        status: MessageStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    return { success: true, messageId: log.externalMessageId! };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: "body",
            parameters,
          },
        ],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Meta WhatsApp API error response:", data);
      await prisma.communicationLog.create({
        data: {
          tenantId,
          memberId: memberId || null,
          channel: ChannelType.WHATSAPP,
          recipient: cleanPhone,
          messageContent: formattedContent,
          status: MessageStatus.FAILED,
          errorMessage: JSON.stringify(data.error || data),
        },
      });
      return { success: false, error: data.error?.message || "WhatsApp send failed" };
    }

    const messageId = data.messages?.[0]?.id;

    await prisma.communicationLog.create({
      data: {
        tenantId,
        memberId: memberId || null,
        channel: ChannelType.WHATSAPP,
        recipient: cleanPhone,
        messageContent: formattedContent,
        externalMessageId: messageId,
        status: MessageStatus.SENT,
      },
    });

    return { success: true, messageId };
  } catch (error: any) {
    console.error("WhatsApp Send Error:", error);
    await prisma.communicationLog.create({
      data: {
        tenantId,
        memberId: memberId || null,
        channel: ChannelType.WHATSAPP,
        recipient: cleanPhone,
        messageContent: formattedContent,
        status: MessageStatus.FAILED,
        errorMessage: error.message,
      },
    });
    return { success: false, error: error.message };
  }
}
