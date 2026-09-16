import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { PaymentMode, InvoiceStatus } from "@prisma/client";

const createPaymentSchema = z.object({
  invoiceId: z.string().uuid("Valid invoice ID required"),
  amount: z.number().positive("Payment amount must be positive"),
  mode: z.nativeEnum(PaymentMode),
  referenceNumber: z.string().optional(), // UPI UTR or Card Transaction ID
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "COLLECT_PAYMENTS")) {
      return apiError("Insufficient permission to record payments", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { invoiceId, amount, mode, referenceNumber, notes } = parsed.data;

    // Run in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId: session.tenantId! },
        include: { member: true },
      });

      if (!invoice) {
        throw new Error("INVOICE_NOT_FOUND");
      }

      const currentBalance = Number(invoice.balanceAmount);
      if (currentBalance <= 0) {
        throw new Error("INVOICE_ALREADY_SETTLED");
      }

      if (amount > currentBalance) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
      }

      const newPaid = Number(invoice.paidAmount) + amount;
      const newBalance = Number((currentBalance - amount).toFixed(2));
      const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      // Generate payment receipt number e.g. RCP-2425-0012
      const payCount = await tx.payment.count({ where: { tenantId: session.tenantId! } });
      const paymentNumber = `RCP-${String(payCount + 1).padStart(5, "0")}`;

      const payment = await tx.payment.create({
        data: {
          tenantId: session.tenantId!,
          invoiceId: invoice.id,
          memberId: invoice.memberId,
          paymentNumber,
          amount,
          mode,
          referenceNumber: referenceNumber || null,
          collectedById: session.id,
          notes: notes || null,
        },
      });

      // Update invoice balances
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
        },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId!,
          userId: session.id,
          action: "PAYMENT_RECORDED",
          entityType: "PAYMENT",
          entityId: payment.id,
          newValues: {
            paymentNumber,
            amount,
            mode,
            invoiceId,
            referenceNumber,
            remainingBalance: newBalance,
          },
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return apiSuccess(result, undefined, 201);
  } catch (error: any) {
    if (error.message === "INVOICE_NOT_FOUND") {
      return apiError("Invoice not found", "NOT_FOUND", 404);
    }
    if (error.message === "INVOICE_ALREADY_SETTLED") {
      return apiError("Invoice has already been fully paid", "ALREADY_PAID", 400);
    }
    if (error.message === "PAYMENT_EXCEEDS_BALANCE") {
      return apiError("Payment amount exceeds outstanding balance", "EXCEEDS_BALANCE", 400);
    }
    console.error("Record Payment API Error:", error);
    return apiError("Failed to record payment transaction", "SERVER_ERROR", 500);
  }
}
