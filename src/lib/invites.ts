import { SignJWT, jwtVerify } from "jose";

const INVITE_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gym-saas-development-secret-jwt-key-2026-very-secure-32chars"
);

export interface ClientInvitePayload {
  tenantId: string;
  gymName: string;
  clientName?: string;
  clientPhone?: string;
}

/**
 * Generate a cryptographically signed client self-registration token with expiration.
 */
export async function createClientInviteToken(
  payload: ClientInvitePayload,
  expiresInHours: number = 48
): Promise<string> {
  return new SignJWT({
    tenantId: payload.tenantId,
    gymName: payload.gymName,
    clientName: payload.clientName || undefined,
    clientPhone: payload.clientPhone || undefined,
    type: "client_invite",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInHours}h`)
    .sign(INVITE_SECRET);
}

/**
 * Verify and decode an incoming client self-registration token.
 */
export async function verifyClientInviteToken(token: string): Promise<ClientInvitePayload | null> {
  try {
    const { payload } = await jwtVerify(token, INVITE_SECRET);
    if (payload.type !== "client_invite") return null;

    return {
      tenantId: payload.tenantId as string,
      gymName: payload.gymName as string,
      clientName: payload.clientName as string | undefined,
      clientPhone: payload.clientPhone as string | undefined,
    };
  } catch {
    return null;
  }
}
