import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, signSessionToken, getSessionCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

const switchGymSchema = z.object({
  tenantId: z.string().uuid("Valid branch ID required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== "GYM_OWNER" && session.role !== "SUPER_ADMIN") {
      return apiError("Only gym owners and administrators can switch branches", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = switchGymSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid branch identifier", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { tenantId } = parsed.data;

    const targetTenant = await prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
      include: { settings: true },
    });

    if (!targetTenant) {
      return apiError("Target gym branch not found or inactive", "NOT_FOUND", 404);
    }

    // Generate updated session with new branch tenantId
    const updatedPayload = {
      id: session.id,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
      tenantId: targetTenant.id,
    };

    const newToken = await signSessionToken(updatedPayload);
    const cookieOptions = getSessionCookieOptions();

    const response = apiSuccess({
      message: `Successfully switched to ${targetTenant.businessName}`,
      tenant: {
        id: targetTenant.id,
        slug: targetTenant.slug,
        businessName: targetTenant.businessName,
        currency: targetTenant.currency,
        invoicePrefix: targetTenant.settings?.invoicePrefix || "FZ",
      },
    });

    response.cookies.set(cookieOptions.name, newToken, cookieOptions);
    return response;
  } catch (error: any) {
    console.error("Switch Gym API Error:", error);
    return apiError("Failed to switch gym branch", "SERVER_ERROR", 500);
  }
}
