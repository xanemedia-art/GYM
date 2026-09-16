import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClientInviteToken } from "@/lib/invites";
import { apiError, apiSuccess } from "@/lib/api-response";

const generateInviteSchema = z.object({
  expiresInHours: z.number().int().min(1).max(720).default(48),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = generateInviteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { expiresInHours, clientName, clientPhone } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { id: true, businessName: true },
    });

    if (!tenant) {
      return apiError("Gym tenant not found", "NOT_FOUND", 404);
    }

    const token = await createClientInviteToken(
      {
        tenantId: tenant.id,
        gymName: tenant.businessName,
        clientName,
        clientPhone,
      },
      expiresInHours
    );

    const origin = req.nextUrl.origin;
    const inviteUrl = `${origin}/join/${token}`;

    return apiSuccess({
      token,
      url: inviteUrl,
      expiresInHours,
      gymName: tenant.businessName,
    });
  } catch (error: any) {
    console.error("Generate Invite Error:", error);
    return apiError("Failed to generate client invite link", "SERVER_ERROR", 500);
  }
}
