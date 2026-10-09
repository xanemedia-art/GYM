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

interface SendCustomWhatsAppParams {
  tenantId: string;
  memberId?: string;
  recipientPhone: string;
  messageText: string;
}

/**
 * Dispatches a custom free-form WhatsApp message to a member or phone number.
 * Supports direct Meta Cloud API and graceful simulation fallback.
 */
export async function sendCustomWhatsAppMessage({
  tenantId,
  memberId,
  recipientPhone,
  messageText,
}: SendCustomWhatsAppParams): Promise<WhatsAppSendResult> {
  const cleanPhone = recipientPhone.replace(/\D/g, "").slice(-10);
  const internationalPhone = `91${cleanPhone}`;

  // Check tenant custom WhatsApp credentials if configured
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { address: true },
  });

  const tenantConfig = (tenant?.address as any)?.whatsappConfig;
  const token = tenantConfig?.accessToken || process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = tenantConfig?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Simulation fallback
  if (!token || token === "mock_token" || !phoneNumberId || phoneNumberId === "mock_phone_id") {
    console.log(`[WhatsApp CUSTOM SIMULATION] To: ${internationalPhone} | Message: ${messageText}`);

    const log = await prisma.communicationLog.create({
      data: {
        tenantId,
        memberId: memberId || null,
        channel: ChannelType.WHATSAPP,
        recipient: internationalPhone,
        messageContent: messageText,
        externalMessageId: `mock_custom_${Date.now()}`,
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
      to: internationalPhone,
      type: "text",
      text: { body: messageText },
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
      console.error("Meta WhatsApp Custom Message Error:", data);
      await prisma.communicationLog.create({
        data: {
          tenantId,
          memberId: memberId || null,
          channel: ChannelType.WHATSAPP,
          recipient: internationalPhone,
          messageContent: messageText,
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
        recipient: internationalPhone,
        messageContent: messageText,
        externalMessageId: messageId,
        status: MessageStatus.SENT,
      },
    });

    return { success: true, messageId };
  } catch (error: any) {
    console.error("WhatsApp Custom Send Exception:", error);
    await prisma.communicationLog.create({
      data: {
        tenantId,
        memberId: memberId || null,
        channel: ChannelType.WHATSAPP,
        recipient: internationalPhone,
        messageContent: messageText,
        status: MessageStatus.FAILED,
        errorMessage: error.message,
      },
    });
    return { success: false, error: error.message };
  }
}

