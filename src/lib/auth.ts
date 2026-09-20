import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";

const DEFAULT_DEV_SECRET = "gym-saas-development-secret-jwt-key-2026-very-secure-32chars";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_DEV_SECRET)
) {
  console.error(
    "FATAL CRITICAL SECURITY WARNING: Default development JWT_SECRET is active in production environment! Set a unique 32+ character JWT_SECRET in environment variables immediately."
  );
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || DEFAULT_DEV_SECRET
);

export const SESSION_COOKIE_NAME = "gms_session";
const SESSION_EXPIRATION = "7d"; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string | null;
}

/**
 * Sign a new JWT session token containing user identity and tenant context.
 */
export async function signSessionToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(JWT_SECRET);
}

/**
 * Verify an incoming JWT session token.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
      tenantId: (payload.tenantId as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Server-side helper to retrieve the authenticated session from cookies.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Server-side helper to set the session cookie in response headers.
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}
