import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchSlug = searchParams.get("branch");

    let tenant = null;
    if (branchSlug) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: branchSlug, isActive: true },
        select: { id: true, businessName: true, slug: true, currency: true },
      });
    }

    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, businessName: true, slug: true, currency: true },
      });
    }

    if (!tenant) {
      return apiSuccess([]);
    }

    const plans = await prisma.membershipPlan.findMany({
      where: {
        tenantId: tenant.id,
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

    return apiSuccess({
      branch: {
        id: tenant.id,
        name: tenant.businessName,
        slug: tenant.slug,
        currency: tenant.currency,
      },
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        durationDays: p.durationDays,
        basePrice: Number(p.basePrice),
        joiningFee: Number(p.joiningFee),
        isActive: p.isActive,
        version: p.versions[0]?.versionNumber || 1,
      })),
    });
  } catch (error: any) {
    console.error("Public Plans API Error:", error);
    return apiError("Failed to fetch membership plans", "SERVER_ERROR", 500);
  }
}
