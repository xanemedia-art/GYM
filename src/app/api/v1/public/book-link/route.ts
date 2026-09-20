import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClientInviteToken } from "@/lib/invites";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getBranchBySlug } from "@/data/branches";

const bookLinkSchema = z.object({
  branchSlug: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce IP Rate Limiting (max 10 requests per minute per IP)
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`book_link:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return apiError(
        `Too many booking requests. Please wait ${rateLimit.resetSeconds}s before trying again.`,
        "RATE_LIMITED",
        429
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bookLinkSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid parameters", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { branchSlug, clientName, clientPhone } = parsed.data;

    // 2. Resolve Tenant Branch
    let tenant = null;
    if (branchSlug) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: branchSlug, isActive: true },
        select: { id: true, businessName: true, slug: true },
      });
    }

    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { isActive: true },
        select: { id: true, businessName: true, slug: true },
      });
    }

    if (!tenant) {
      return apiError("Gym tenant not found", "NOT_FOUND", 404);
    }

    const branch = branchSlug ? getBranchBySlug(branchSlug) : undefined;
    const gymDisplayName = branch ? `${tenant.businessName} (${branch.name})` : tenant.businessName;

    // 3. Create a 1-hour valid registration token
    const token = await createClientInviteToken(
      {
        tenantId: tenant.id,
        gymName: gymDisplayName,
        clientName: clientName?.trim() || undefined,
        clientPhone: clientPhone?.trim() || undefined,
      },
      1 // exactly 1 hour validity
    );

    const origin = req.nextUrl.origin;
    const registrationUrl = `${origin}/join/${token}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    return apiSuccess({
      token,
      url: registrationUrl,
      expiresInMinutes: 60,
      expiresAt,
      gymName: gymDisplayName,
      branchSlug: branch?.slug || tenant.slug,
      branchName: branch?.name || tenant.businessName,
    });
  } catch (error: any) {
    console.error("Public Book Link generation error:", error);
    return apiError("Failed to generate booking link", "SERVER_ERROR", 500);
  }
}
