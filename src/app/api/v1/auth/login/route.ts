import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signSessionToken, getSessionCookieOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api-response";

// Synthetic dummy hash used to neutralize timing attacks on non-existent users
const DUMMY_BCRYPT_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoO.P8f0z4v2Y1W5b8EaG0G3X0N7B7N7Nu";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. IP Rate Limiting (Defense against credential stuffing & brute-force)
    const ipRateLimit = checkRateLimit(`login_ip:${ip}`, 5, 60);
    if (!ipRateLimit.allowed) {
      return apiError(
        `Too many login attempts from this network. Please wait ${ipRateLimit.resetSeconds}s before trying again.`,
        "RATE_LIMITED",
        429
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid credentials format", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Account-Level Rate Limiting (Defense against distributed botnet attacks)
    const accountRateLimit = checkRateLimit(`login_acc:${normalizedEmail}`, 5, 60);
    if (!accountRateLimit.allowed) {
      return apiError(
        `Account temporarily locked due to multiple consecutive login attempts. Please wait ${accountRateLimit.resetSeconds}s.`,
        "RATE_LIMITED",
        429
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, isActive: true },
      include: { tenant: true },
    });

    // 3. Timing-Safe Password Verification
    if (!user) {
      // Execute dummy bcrypt comparison so request timing is identical
      await verifyPassword(password, DUMMY_BCRYPT_HASH);
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
