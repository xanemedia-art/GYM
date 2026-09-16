import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth";
import { apiSuccess } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const response = apiSuccess({ message: "Logged out successfully" });
  const cookieOptions = getSessionCookieOptions();

  // Expire session cookie
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
