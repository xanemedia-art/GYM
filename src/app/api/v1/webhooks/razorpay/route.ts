import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { PaymentMode, InvoiceStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (process.env.NODE_ENV === "production" && !webhookSecret) {
      console.error("FATAL: RAZORPAY_WEBHOOK_SECRET is not configured in production");
      return NextResponse.json({ error: "Webhook configuration error" }, { status: 500 });
    }

    const secretToVerify = webhookSecret || "default_webhook_secret_for_dev";
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secretToVerify);
    if (!isValid) {
      console.warn("Razorpay webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventData = JSON.parse(rawBody);
    const eventType = eventData.event;

    // Handle payment events
    if (eventType === "payment_link.paid" || eventType === "payment.captured") {
      const paymentEntity =
        eventData.payload?.payment?.entity || eventData.payload?.payment_link?.entity;
      const paymentId = paymentEntity?.id || `pay_${Date.now()}`;
      const amountPaise = paymentEntity?.amount || 0;
      const amountRupees = Number((amountPaise / 100).toFixed(2));

      // Extract invoice and tenant info from notes
      const notes =
        eventData.payload?.payment_link?.entity?.notes ||
        eventData.payload?.payment?.entity?.notes ||
        {};
      const invoiceId = notes.invoiceId;
      const tenantId = notes.tenantId;

      if (!invoiceId) {
        // Acknowledge webhook even if not relevant to our invoices
        return NextResponse.json({ received: true, ignored: "No invoiceId in notes" }, { status: 200 });
      }

      // Process atomically with idempotency guard
      await prisma.$transaction(async (tx) => {
        // Idempotency check: Ensure this razorpay paymentId hasn't been recorded yet
        const existingPayment = await tx.payment.findFirst({
          where: { referenceNumber: paymentId },
        });

        if (existingPayment) {
          return existingPayment;
        }

        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (!invoice) {
          console.warn(`Invoice ${invoiceId} not found during Razorpay webhook processing`);
          return null;
        }

        const effectiveTenantId = tenantId || invoice.tenantId;

        // Find an admin user to attribute system collection
        const adminUser = await tx.user.findFirst({
          where: { tenantId: effectiveTenantId },
        });

        const currentBalance = Number(invoice.balanceAmount);
        const actualPaymentAmount = Math.min(amountRupees, currentBalance);
        const newPaid = Number((Number(invoice.paidAmount) + actualPaymentAmount).toFixed(2));
        const newBalance = Number(Math.max(0, currentBalance - actualPaymentAmount).toFixed(2));
        const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

        // Generate receipt number
        const payCount = await tx.payment.count({ where: { tenantId: effectiveTenantId } });
        const paymentNumber = `RCP-PG-${String(payCount + 1).padStart(5, "0")}`;

        const payment = await tx.payment.create({
          data: {
            tenantId: effectiveTenantId,
            invoiceId: invoice.id,
            memberId: invoice.memberId,
            paymentNumber,
            amount: actualPaymentAmount,
            mode: PaymentMode.ONLINE_PAYMENT_GATEWAY,
            referenceNumber: paymentId,
            collectedById: adminUser?.id || "system",
            notes: `Online payment received via Razorpay Gateway (${paymentId})`,
          },
        });

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newStatus,
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: effectiveTenantId,
            userId: adminUser?.id || null,
            action: "ONLINE_PAYMENT_WEBHOOK_RECEIVED",
            entityType: "PAYMENT",
            entityId: payment.id,
            newValues: {
              paymentNumber,
              amount: actualPaymentAmount,
              razorpayPaymentId: paymentId,
              invoiceId: invoice.id,
              remainingBalance: newBalance,
              gatewayEvent: eventType,
            },
          },
        });

        return payment;
      });
    }

    return NextResponse.json({ received: true, status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("Razorpay webhook handler error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
