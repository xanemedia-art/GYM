import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signSessionToken, getSessionCookieOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid credentials format", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { tenant: true },
    });

    if (!user) {
      return apiError("Invalid email or password", "AUTH_FAILED", 401);
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return apiError("Invalid email or password", "AUTH_FAILED", 401);
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const sessionPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
    };

    const token = await signSessionToken(sessionPayload);
    const cookieOptions = getSessionCookieOptions();

    const response = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenant: user.tenant
          ? {
              id: user.tenant.id,
              slug: user.tenant.slug,
              businessName: user.tenant.businessName,
              currency: user.tenant.currency,
            }
          : null,
      },
    });

    response.cookies.set(cookieOptions.name, token, cookieOptions);
    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return apiError("Internal server error during authentication", "SERVER_ERROR", 500);
  }
}
