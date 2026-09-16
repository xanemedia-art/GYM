import { NextRequest } from "next/server";
import { runDailyMorningAutomation } from "@/lib/cron/scanner";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "cron_dev_secret_2026";

    const isSecretValid = authHeader === `Bearer ${cronSecret}`;
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
