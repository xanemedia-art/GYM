import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getWebsiteContent, saveWebsiteContent, WebsiteContent, DEFAULT_WEBSITE_CONTENT } from "@/lib/website-content";

export async function GET(req: NextRequest) {
  try {
    const content = getWebsiteContent();
    const response = apiSuccess(content);
    response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return response;
  } catch (error: any) {
    console.error("GET /api/v1/website-content error:", error);
    return apiError("Failed to fetch website content", "SERVER_ERROR", 500);
  }
}

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export async function PUT(req: NextRequest) {
  try {
    // 1. Enforce authentication & role authorization
    const session = await getSession();
    if (!session) {
      return apiError("Authentication required to update website content", "UNAUTHORIZED", 401);
    }

    if (session.role !== "GYM_OWNER" && session.role !== "SUPER_ADMIN") {
      return apiError("Only gym owners and administrators can modify website content", "FORBIDDEN", 403);
    }

    // 2. Rate limit (max 10 saves per minute per user/ip)
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`cms_save:${session.id || ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return apiError(
        `Too many updates. Please wait ${rateLimit.resetSeconds}s before saving again.`,
        "RATE_LIMITED",
        429
      );
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return apiError("Invalid website content payload", "VALIDATION_ERROR", 400);
    }

    // Merge or validate
    const updatedContent: WebsiteContent = {
      general: {
        ...DEFAULT_WEBSITE_CONTENT.general,
        ...(body.general || {}),
      },
      sections: {
        hero: {
          ...DEFAULT_WEBSITE_CONTENT.sections.hero,
          ...(body.sections?.hero || {}),
        },
        about: {
          ...DEFAULT_WEBSITE_CONTENT.sections.about,
          ...(body.sections?.about || {}),
        },
        franchise: {
          ...DEFAULT_WEBSITE_CONTENT.sections.franchise,
          ...(body.sections?.franchise || {}),
        },
      },
      branches: Array.isArray(body.branches) && body.branches.length > 0
        ? body.branches
        : DEFAULT_WEBSITE_CONTENT.branches,
    };

    saveWebsiteContent(updatedContent);

    // Revalidate public website paths immediately
    try {
      revalidatePath("/");
      revalidatePath("/locations");
      revalidatePath("/locations/[slug]", "page");
      revalidatePath("/about");
      revalidatePath("/franchise");
      revalidatePath("/contact");
    } catch (revalErr) {
      console.warn("Path revalidation warning:", revalErr);
    }

    return apiSuccess(updatedContent);
  } catch (error: any) {
    console.error("PUT /api/v1/website-content error:", error);
    return apiError("Failed to save website content", "SERVER_ERROR", 500);
  }
}
