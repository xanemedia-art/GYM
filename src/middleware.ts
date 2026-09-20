import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gym-saas-development-secret-jwt-key-2026-very-secure-32chars"
);

const SESSION_COOKIE_NAME = "gms_session";

// Management routes requiring authenticated gym staff/owner sessions
const PROTECTED_ROUTES = [
  "/portal",
  "/members",
  "/billing",
  "/devices",
  "/website-cms",
  "/plans",
  "/calendar",
  "/settings",
  "/reports",
  "/audit-logs",
  "/kiosk",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  let response = NextResponse.next();

  if (isProtectedRoute) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    let isAuthenticated = false;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      response = NextResponse.redirect(loginUrl);
    }
  }

  // Security Headers (Clickjacking, MIME Sniffing, Referrer Policy)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (uploads, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads|images).*)",
  ],
};
