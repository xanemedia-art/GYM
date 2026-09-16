import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { calculateGst, formatInvoiceNumber, getIndianFinancialYear, GYM_HSN_SAC_CODE } from "@/lib/gst";
import { apiError, apiSuccess } from "@/lib/api-response";
import { MemberStatus, InvoiceStatus } from "@prisma/client";

const assignMembershipSchema = z.object({
  memberId: z.string().uuid("Valid member ID required"),
  planId: z.string().uuid("Valid plan ID required"),
  startDate: z.string().optional(),
  discountAmount: z.number().nonnegative().optional().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "MEMBER_ONBOARDING")) {
      return apiError("Insufficient permission to assign memberships", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = assignMembershipSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { memberId, planId, startDate: inputStartDate, discountAmount } = parsed.data;

    // Verify member and plan
    const [member, plan, tenantSettings] = await Promise.all([
      prisma.member.findFirst({
        where: { id: memberId, tenantId: session.tenantId, isDeleted: false },
      }),
      prisma.membershipPlan.findFirst({
        where: { id: planId, tenantId: session.tenantId, isActive: true },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      }),
      prisma.tenantSettings.findUnique({
        where: { tenantId: session.tenantId },
      }),
    ]);

    if (!member) return apiError("Member not found", "NOT_FOUND", 404);
    if (!plan || plan.versions.length === 0) return apiError("Plan not found", "NOT_FOUND", 404);

    const latestVersion = plan.versions[0];

    const startDate = inputStartDate ? new Date(inputStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + latestVersion.durationDays);

    // Run creation in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Membership instance
      const membership = await tx.membership.create({
        data: {
          tenantId: session.tenantId!,
          memberId: member.id,
          planVersionId: latestVersion.id,
          startDate,
          endDate,
          originalEndDate: endDate,
          status: MemberStatus.ACTIVE,
        },
      });

      // 2. Generate initial tax invoice
      const prefix = tenantSettings?.invoicePrefix || "INV";
      const gstRate = Number(tenantSettings?.gstRatePercentage || 18.0);
      const fy = getIndianFinancialYear(startDate);

      const basePrice = Number(latestVersion.basePrice) + Number(plan.joiningFee);
      const gstBreakdown = calculateGst(basePrice, discountAmount, gstRate, false);

      const invoiceCount = await tx.invoice.count({ where: { tenantId: session.tenantId! } });
      const invoiceNumber = formatInvoiceNumber(prefix, fy, invoiceCount + 1);

      const invoice = await tx.invoice.create({
        data: {
          tenantId: session.tenantId!,
          invoiceNumber,
          memberId: member.id,
          membershipId: membership.id,
          subtotal: gstBreakdown.basePrice,
          discountAmount: gstBreakdown.discountAmount,
          taxableAmount: gstBreakdown.taxableAmount,
          cgstAmount: gstBreakdown.cgstAmount,
          sgstAmount: gstBreakdown.sgstAmount,
          igstAmount: gstBreakdown.igstAmount,
          totalAmount: gstBreakdown.totalAmount,
          paidAmount: 0.0,
          balanceAmount: gstBreakdown.totalAmount,
          status: InvoiceStatus.ISSUED,
          dueDate: startDate,
          items: {
            create: {
              description: `${plan.name} (${latestVersion.durationDays} Days)`,
              hsnSacCode: GYM_HSN_SAC_CODE,
              quantity: 1,
              unitPrice: gstBreakdown.basePrice,
              taxableValue: gstBreakdown.taxableAmount,
              gstRate,
              totalItemAmount: gstBreakdown.totalAmount,
            },
          },
        },
        include: { items: true },
      });

      // 3. Update member status to ACTIVE
      await tx.member.update({
        where: { id: member.id },
        data: { status: MemberStatus.ACTIVE },
      });

      return { membership, invoice };
    });

    return apiSuccess(result, undefined, 201);
  } catch (error: any) {
    console.error("Assign Membership API Error:", error);
    return apiError("Failed to assign membership", "SERVER_ERROR", 500);
  }
}
