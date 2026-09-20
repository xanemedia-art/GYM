import { NextRequest } from "next/server";
import crypto from "crypto";
import { runDailyMorningAutomation } from "@/lib/cron/scanner";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit cron invocation (max 6 triggers per hour)
    const rateLimit = checkRateLimit(`cron_trigger:${ip}`, 6, 3600);
    if (!rateLimit.allowed) {
      return apiError("Cron trigger rate limit reached", "RATE_LIMITED", 429);
    }

    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;

    let isSecretValid = false;
    if (cronSecret && authHeader.startsWith("Bearer ")) {
      const provided = authHeader.slice(7).trim();
      const expectedBuf = Buffer.from(cronSecret);
      const providedBuf = Buffer.from(provided);
      if (expectedBuf.length === providedBuf.length) {
        isSecretValid = crypto.timingSafeEqual(expectedBuf, providedBuf);
      }
    } else if (process.env.NODE_ENV !== "production" && authHeader === "Bearer cron_dev_secret_2026") {
      isSecretValid = true;
    }

    const session = await getSession();
    const isAdmin = session?.role === "GYM_OWNER" || session?.role === "SUPER_ADMIN";

    if (!isSecretValid && !isAdmin) {
      return apiError("Unauthorized cron trigger", "UNAUTHORIZED", 401);
    }

    const result = await runDailyMorningAutomation();
    return apiSuccess(result);
  } catch (error: any) {
    console.error("Cron Execution Error:", error);
    return apiError("Automation execution failed", "SERVER_ERROR", 500);
  }
}
