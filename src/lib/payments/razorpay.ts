import crypto from "crypto";

export interface CreatePaymentLinkParams {
  amount: number; // in INR rupees
  currency?: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
}

export interface PaymentLinkResponse {
  id: string;
  short_url: string;
  status: string;
  amount: number;
  currency: string;
  isSimulated: boolean;
}

/**
 * Creates a Razorpay Payment Link using Razorpay REST API
 * Falls back to deterministic simulation if keys are omitted.
 */
export async function createRazorpayPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResponse> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const amountInPaise = Math.round(params.amount * 100);

  if (keyId && keySecret) {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: params.currency || "INR",
        accept_partial: false,
        description: params.description || `Payment for Invoice ${params.invoiceNumber}`,
        customer: {
          name: params.customerName,
          contact: params.customerPhone || undefined,
          email: params.customerEmail || undefined,
        },
        notify: {
          sms: Boolean(params.customerPhone),
          email: Boolean(params.customerEmail),
        },
        reminder_enable: true,
        notes: {
          invoiceId: params.invoiceId,
          invoiceNumber: params.invoiceNumber,
          tenantId: params.tenantId,
        },
        callback_method: "get",
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Razorpay API Error:", errBody);
      throw new Error(`Razorpay API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      short_url: data.short_url,
      status: data.status,
      amount: data.amount / 100,
      currency: data.currency,
      isSimulated: false,
    };
  }

  // Simulation mode
  const simulatedId = `plink_sim_${crypto.randomBytes(8).toString("hex")}`;
  return {
    id: simulatedId,
    short_url: `https://rzp.io/i/${simulatedId}`,
    status: "created",
    amount: params.amount,
    currency: params.currency || "INR",
    isSimulated: true,
  };
}

/**
 * Verifies the Razorpay Webhook signature using constant-time comparison
 * prevents timing attacks.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
