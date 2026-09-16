import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "VIEW_FINANCIAL_REPORTS")) {
      return apiError("Insufficient permission to view audit logs", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const userId = searchParams.get("userId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const whereClause: any = {
      tenantId: session.tenantId,
    };

    if (action) {
      whereClause.action = action;
    }
    if (entityType) {
      whereClause.entityType = entityType;
    }
    if (userId) {
      whereClause.userId = userId;
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    return apiSuccess({
      total,
      limit,
      offset,
      logs,
    });
  } catch (error: any) {
    console.error("Audit logs API Error:", error);
    return apiError("Failed to fetch audit logs", "SERVER_ERROR", 500);
  }
}
