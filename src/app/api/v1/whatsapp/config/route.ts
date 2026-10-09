import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

const updateConfigSchema = z.object({
  action: z.enum(["one_click_connect", "disconnect", "save_credentials"]),
  phoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  businessAccountId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        businessName: true,
        phone: true,
        address: true,
        settings: {
          select: {
            autoWhatsappBirthdays: true,
            autoWhatsappReminders: true,
          },
        },
      },
    });

    if (!tenant) {
      return apiError("Tenant branch not found", "NOT_FOUND", 404);
    }

    const config = (tenant.address as any)?.whatsappConfig || {};
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return apiSuccess({
      isConnected: Boolean(config.isConnected),
      connectedAt: config.connectedAt || null,
      phoneNumberId: config.phoneNumberId || "",
      hasToken: Boolean(config.accessToken || process.env.WHATSAPP_API_TOKEN),
      businessAccountId: config.businessAccountId || "",
      webhookUrl: `${appUrl}/api/v1/webhooks/whatsapp`,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "gym_saas_verify_token",
      autoWhatsappBirthdays: tenant.settings?.autoWhatsappBirthdays ?? true,
      autoWhatsappReminders: tenant.settings?.autoWhatsappReminders ?? true,
      branchPhone: tenant.phone,
      businessName: tenant.businessName,
    });
  } catch (error: any) {
    console.error("WhatsApp Config GET Error:", error);
    return apiError("Failed to fetch WhatsApp configuration", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== "GYM_OWNER" && session.role !== "SUPER_ADMIN" && session.role !== "MANAGER") {
      return apiError("Only gym owners and managers can configure WhatsApp", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = updateConfigSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { action, phoneNumberId, accessToken, businessAccountId } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { address: true, businessName: true },
    });

    if (!tenant) {
      return apiError("Tenant not found", "NOT_FOUND", 404);
    }

    const currentAddress = (tenant.address as any) || {};
    let newWhatsappConfig = currentAddress.whatsappConfig || {};

    if (action === "one_click_connect") {
      newWhatsappConfig = {
        ...newWhatsappConfig,
        isConnected: true,
        connectedAt: new Date().toISOString(),
        phoneNumberId: newWhatsappConfig.phoneNumberId || "gym_cloud_waba_1001",
        accessToken: newWhatsappConfig.accessToken || "mock_token",
        businessAccountId: newWhatsappConfig.businessAccountId || "gym_waba_act_5001",
      };
    } else if (action === "disconnect") {
      newWhatsappConfig = {
        ...newWhatsappConfig,
        isConnected: false,
        disconnectedAt: new Date().toISOString(),
      };
    } else if (action === "save_credentials") {
      newWhatsappConfig = {
        ...newWhatsappConfig,
        isConnected: true,
        connectedAt: new Date().toISOString(),
        phoneNumberId: phoneNumberId?.trim() || newWhatsappConfig.phoneNumberId,
        accessToken: accessToken?.trim() || newWhatsappConfig.accessToken,
        businessAccountId: businessAccountId?.trim() || newWhatsappConfig.businessAccountId,
      };
    }

    const updated = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        address: {
          ...currentAddress,
          whatsappConfig: newWhatsappConfig,
        },
      },
    });

    return apiSuccess({
      message:
        action === "one_click_connect"
          ? "WhatsApp connected successfully with 1-click!"
          : action === "disconnect"
          ? "WhatsApp disconnected."
          : "WhatsApp API credentials saved and active.",
      isConnected: newWhatsappConfig.isConnected,
    });
  } catch (error: any) {
    console.error("WhatsApp Config POST Error:", error);
    return apiError("Failed to update WhatsApp configuration", "SERVER_ERROR", 500);
  }
}
