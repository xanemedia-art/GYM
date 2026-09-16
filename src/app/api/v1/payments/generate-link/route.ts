import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createRazorpayPaymentLink } from "@/lib/payments/razorpay";

const generateLinkSchema = z.object({
  invoiceId: z.string().uuid("Valid invoice ID is required"),
  amount: z.number().positive().optional(), // If not supplied, defaults to remaining balance
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "COLLECT_PAYMENTS")) {
      return apiError("Insufficient permission to generate payment links", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = generateLinkSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { invoiceId, amount: requestedAmount } = parsed.data;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: session.tenantId },
      include: {
        member: true,
        tenant: true,
      },
    });

    if (!invoice) {
      return apiError("Invoice not found", "NOT_FOUND", 404);
    }

    const outstandingBalance = Number(invoice.balanceAmount);
    if (outstandingBalance <= 0) {
      return apiError("Invoice is already fully paid", "ALREADY_PAID", 400);
    }

    const chargeAmount = requestedAmount !== undefined ? requestedAmount : outstandingBalance;
    if (chargeAmount > outstandingBalance) {
      return apiError("Amount exceeds outstanding invoice balance", "AMOUNT_TOO_HIGH", 400);
    }

    const paymentLinkResult = await createRazorpayPaymentLink({
      amount: chargeAmount,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tenantId: session.tenantId,
      customerName: `${invoice.member.firstName} ${invoice.member.lastName}`,
      customerPhone: invoice.member.phone || undefined,
      customerEmail: invoice.member.email || undefined,
      description: `Payment for Gym Invoice ${invoice.invoiceNumber}`,
    });

    return apiSuccess({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: chargeAmount,
      balanceAmount: outstandingBalance,
      paymentLink: paymentLinkResult.short_url,
      paymentLinkId: paymentLinkResult.id,
      isSimulated: paymentLinkResult.isSimulated,
    });
  } catch (error: any) {
    console.error("Generate Payment Link API Error:", error);
    return apiError("Failed to generate payment link", "SERVER_ERROR", 500);
  }
}
