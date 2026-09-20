import { prisma } from "@/lib/prisma";
import { ChannelType, MessageStatus } from "@prisma/client";

export interface SendEmailParams {
  tenantId: string;
  memberId?: string;
  to: string;
  subject: string;
  htmlContent: string;
  templateType?: "WELCOME" | "PAYMENT_RECEIPT" | "EXPIRY_REMINDER" | "BIRTHDAY" | "GENERIC";
}

export interface EmailResult {
  success: boolean;
  messageId: string;
  isSimulated: boolean;
  error?: string;
}

/**
 * Sends a transactional email or records a simulated send in dev/test.
 * Also logs the delivery to communication_logs.
 */
export async function sendTransactionalEmail(params: SendEmailParams): Promise<EmailResult> {
  const { tenantId, memberId, to, subject, htmlContent, templateType = "GENERIC" } = params;

  const resendApiKey = process.env.RESEND_API_KEY;
  const isSimulation = !resendApiKey && !process.env.SMTP_HOST;

  let externalMessageId = `sim_mail_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  let status: MessageStatus = MessageStatus.SENT;
  let errorMessage: string | undefined;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Be Free Fitness <billing@befreefitness.in>",
          to,
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        externalMessageId = data.id || externalMessageId;
        status = MessageStatus.DELIVERED;
      } else {
        const errText = await res.text();
        status = MessageStatus.FAILED;
        errorMessage = `Resend API Error: ${errText}`;
      }
    } catch (err: any) {
      status = MessageStatus.FAILED;
      errorMessage = err.message || "Network error dispatching email";
    }
  }

  // Record into communication_logs table
  try {
    await prisma.communicationLog.create({
      data: {
        tenantId,
        memberId: memberId || null,
        channel: ChannelType.EMAIL,
        recipient: to,
        messageContent: `[${subject}]\n${htmlContent.substring(0, 1000)}...`,
        externalMessageId,
        status,
        errorMessage: errorMessage || null,
        deliveredAt: status === MessageStatus.DELIVERED ? new Date() : null,
      },
    });
  } catch (logErr) {
    console.warn("Could not write communicationLog for email:", logErr);
  }

  return {
    success: status !== MessageStatus.FAILED,
    messageId: externalMessageId,
    isSimulated: isSimulation,
    error: errorMessage,
  };
}

// -------------------------------------------------------------
// Responsive Indian GST & Gym HTML Email Templates
// -------------------------------------------------------------

export function generateWelcomeEmailHtml(data: {
  gymName: string;
  memberName: string;
  memberCode: string;
  planName: string;
  startDate: string;
  endDate: string;
  gymAddress: string;
  contactPhone: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center; color: #022c22; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #064e3b; color: #34d399; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .footer { padding: 16px 24px; background: #0b1120; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin:0; font-size: 24px; font-weight: 800;">${data.gymName}</h1>
      <p style="margin:4px 0 0 0; font-size: 14px;">Welcome to your premium fitness transformation!</p>
    </div>
    <div class="content">
      <span class="badge">MEMBERSHIP CONFIRMED</span>
      <h2 style="margin-top:0; color:#f8fafc;">Namaste ${data.memberName},</h2>
      <p style="color:#94a3b8; font-size: 14px; line-height: 1.6;">
        Welcome to the ${data.gymName} family! Your biometric access profile is now active on our smart turnstiles.
      </p>

      <table class="info-table">
        <tr><td style="color:#94a3b8;">Member ID:</td><td style="font-weight:bold; color:#10b981; font-family:monospace;">${data.memberCode}</td></tr>
        <tr><td style="color:#94a3b8;">Subscribed Plan:</td><td style="font-weight:600; color:#f8fafc;">${data.planName}</td></tr>
        <tr><td style="color:#94a3b8;">Access Window:</td><td style="color:#cbd5e1;">${data.startDate} to ${data.endDate}</td></tr>
        <tr><td style="color:#94a3b8;">Facility Location:</td><td style="color:#cbd5e1;">${data.gymAddress}</td></tr>
      </table>

      <p style="color:#94a3b8; font-size: 13px; margin-top:20px;">
        To check in, simply place your registered finger or face on the biometric scanner at the entrance.
      </p>
    </div>
    <div class="footer">
      Support Desk: ${data.contactPhone} &bull; ${data.gymName}
    </div>
  </div>
</body>
</html>`;
}

export function generatePaymentReceiptEmailHtml(data: {
  gymName: string;
  gymGstin?: string;
  receiptNumber: string;
  invoiceNumber: string;
  memberName: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string;
  balanceAmount: number;
  paymentDate: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: #1e293b; padding: 20px 24px; border-bottom: 2px solid #10b981; }
    .content { padding: 24px; }
    .amount-box { background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .footer { padding: 16px 24px; background: #0b1120; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size: 20px; color:#f8fafc;">${data.gymName}</h2>
      <p style="margin:4px 0 0 0; font-size: 12px; color:#94a3b8;">
        Official Statutory Tax Receipt ${data.gymGstin ? `&bull; GSTIN: ${data.gymGstin}` : ""}
      </p>
    </div>
    <div class="content">
      <p style="color:#cbd5e1; font-size: 14px; margin-top:0;">Dear <strong>${data.memberName}</strong>,</p>
      <p style="color:#94a3b8; font-size: 14px;">We gratefully acknowledge receipt of your payment toward gym membership services (SAC Code: 999723).</p>

      <div class="amount-box">
        <div style="font-size: 12px; color:#6ee7b7; text-transform:uppercase; letter-spacing:0.05em;">Total Amount Received</div>
        <div style="font-size: 28px; font-weight:800; color:#ffffff; margin-top:4px;">₹${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      </div>

      <table class="info-table">
        <tr><td style="color:#94a3b8;">Receipt No:</td><td style="font-weight:bold; font-family:monospace; color:#f8fafc;">${data.receiptNumber}</td></tr>
        <tr><td style="color:#94a3b8;">Against Invoice:</td><td style="font-family:monospace; color:#f8fafc;">${data.invoiceNumber}</td></tr>
        <tr><td style="color:#94a3b8;">Payment Date:</td><td style="color:#cbd5e1;">${data.paymentDate}</td></tr>
        <tr><td style="color:#94a3b8;">Payment Mode:</td><td style="color:#34d399; font-weight:600;">${data.paymentMode}</td></tr>
        ${data.referenceNumber ? `<tr><td style="color:#94a3b8;">UTR / Ref No:</td><td style="font-family:monospace; color:#cbd5e1;">${data.referenceNumber}</td></tr>` : ""}
        <tr><td style="color:#94a3b8;">Outstanding Balance:</td><td style="color:${data.balanceAmount > 0 ? "#f87171" : "#34d399"}; font-weight:bold;">₹${data.balanceAmount.toFixed(2)}</td></tr>
      </table>
    </div>
    <div class="footer">
      This is a system-generated statutory receipt issued in compliance with GST Rules. &bull; ${data.gymName}
    </div>
  </div>
</body>
</html>`;
}

export function generateExpiryReminderEmailHtml(data: {
  gymName: string;
  memberName: string;
  planName: string;
  expiryDate: string;
  daysRemaining: number;
  contactPhone: string;
  renewalLink?: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: #dc2626; padding: 20px 24px; text-align: center; color: #ffffff; }
    .content { padding: 24px; }
    .alert-banner { background: #450a0a; border: 1px solid #991b1b; color: #fca5a5; padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
    .btn { display: inline-block; background: #10b981; color: #022c22; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 16px 0; }
    .footer { padding: 16px 24px; background: #0b1120; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin:0; font-size: 20px;">Membership Expiry Warning</h2>
    </div>
    <div class="content">
      <div class="alert-banner">
        Your ${data.planName} plan expires in <strong>${data.daysRemaining} day${data.daysRemaining === 1 ? "" : "s"}</strong> on <strong>${data.expiryDate}</strong>.
      </div>

      <p style="color:#cbd5e1; font-size: 14px;">Hi ${data.memberName},</p>
      <p style="color:#94a3b8; font-size: 14px; line-height: 1.6;">
        Don't let your workout momentum pause! To ensure uninterrupted biometric entry and locker privileges, please renew your subscription before ${data.expiryDate}.
      </p>

      ${
        data.renewalLink
          ? `<div style="text-align: center;"><a href="${data.renewalLink}" class="btn">Renew Membership Online</a></div>`
          : ""
      }

      <p style="color:#94a3b8; font-size: 13px;">
        You can also renew at the front desk or call our team directly at <strong>${data.contactPhone}</strong>.
      </p>
    </div>
    <div class="footer">
      Keep Pushing Your Limits! &bull; ${data.gymName}
    </div>
  </div>
</body>
</html>`;
}
