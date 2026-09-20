import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getRecentUnassignedSwipes } from "@/lib/door-lock";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const swipes = getRecentUnassignedSwipes(session.tenantId);

    return apiSuccess({
      swipes,
      total: swipes.length,
      latest: swipes[0] || null,
    });
  } catch (error: any) {
    console.error("Recent Swipes API Error:", error);
    return apiError("Failed to fetch recent door lock swipes", "SERVER_ERROR", 500);
  }
}
