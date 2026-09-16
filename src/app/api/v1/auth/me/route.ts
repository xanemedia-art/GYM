import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return apiError("Unauthenticated session", "UNAUTHENTICATED", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            businessName: true,
            currency: true,
            timezone: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return apiError("User account inactive or not found", "USER_INACTIVE", 403);
    }

    return apiSuccess({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenant: user.tenant,
    });
  } catch (error: any) {
    console.error("Auth Me API Error:", error);
    return apiError("Failed to fetch session profile", "SERVER_ERROR", 500);
  }
}
