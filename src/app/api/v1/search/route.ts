import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      return apiSuccess({ members: [], invoices: [] });
    }

    const tenantId = session.tenantId;

    const [members, invoices] = await Promise.all([
      prisma.member.findMany({
        where: {
          tenantId,
          isDeleted: false,
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { memberCode: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          memberCode: true,
          phone: true,
          status: true,
          photoUrl: true,
          memberships: {
            where: { status: "ACTIVE" },
            take: 1,
            select: { endDate: true },
          },
        },
      }),
      prisma.invoice.findMany({
        where: {
          tenantId,
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        include: {
          member: {
            select: { firstName: true, lastName: true, memberCode: true },
          },
        },
      }),
    ]);

    return apiSuccess({ members, invoices });
  } catch (error: any) {
    console.error("Global Search API Error:", error);
    return apiError("Failed to perform search", "SERVER_ERROR", 500);
  }
}
