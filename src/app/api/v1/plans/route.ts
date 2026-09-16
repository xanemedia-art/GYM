import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";

const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  durationDays: z.number().int().positive("Duration must be at least 1 day"),
  basePrice: z.number().nonnegative("Base price cannot be negative"),
  joiningFee: z.number().nonnegative().optional().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const plans = await prisma.membershipPlan.findMany({
      where: {
        tenantId: session.tenantId,
        isActive: true,
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
      orderBy: { durationDays: "asc" },
    });

    return apiSuccess(plans);
  } catch (error: any) {
    console.error("List Plans API Error:", error);
    return apiError("Failed to fetch membership plans", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "MANAGE_PLANS")) {
      return apiError("Insufficient permission to manage membership plans", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { name, description, durationDays, basePrice, joiningFee } = parsed.data;

    const plan = await prisma.membershipPlan.create({
      data: {
        tenantId: session.tenantId,
        name,
        description,
        durationDays,
        basePrice,
        joiningFee,
        versions: {
          create: {
            versionNumber: 1,
            durationDays,
            basePrice,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return apiSuccess(plan, undefined, 201);
  } catch (error: any) {
    console.error("Create Plan API Error:", error);
    return apiError("Failed to create membership plan", "SERVER_ERROR", 500);
  }
}
