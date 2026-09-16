import { test, describe } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { calculateGst, getIndianFinancialYear, formatInvoiceNumber } from "../../src/lib/gst";
import { hashPassword, verifyPassword } from "../../src/lib/password";
import { hasPermission, canAccessModule } from "../../src/lib/permissions";
import { verifyRazorpayWebhookSignature } from "../../src/lib/payments/razorpay";
import {
  generateWelcomeEmailHtml,
  generatePaymentReceiptEmailHtml,
  generateExpiryReminderEmailHtml,
} from "../../src/lib/notifications/email";

describe("1. Indian GST Calculation Engine (SAC 999723)", () => {
  test("Calculates intra-state 18% GST (9% CGST + 9% SGST) on base plan", () => {
    const result = calculateGst(10000, 0, 18, false);

    assert.strictEqual(result.basePrice, 10000);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.taxableAmount, 10000);
    assert.strictEqual(result.cgstAmount, 900);
    assert.strictEqual(result.sgstAmount, 900);
    assert.strictEqual(result.igstAmount, 0);
    assert.strictEqual(result.totalAmount, 11800);
  });

  test("Calculates inter-state 18% IGST when member is outside gym state", () => {
    const result = calculateGst(5000, 500, 18, true);

    assert.strictEqual(result.basePrice, 5000);
    assert.strictEqual(result.discountAmount, 500);
    assert.strictEqual(result.taxableAmount, 4500);
    assert.strictEqual(result.cgstAmount, 0);
    assert.strictEqual(result.sgstAmount, 0);
    assert.strictEqual(result.igstAmount, 810);
    assert.strictEqual(result.totalAmount, 5310);
  });

  test("Handles zero base price or 100% promotional discount", () => {
    const result = calculateGst(2000, 2000, 18, false);

    assert.strictEqual(result.taxableAmount, 0);
    assert.strictEqual(result.totalAmount, 0);
  });
});

describe("2. Statutory Indian Financial Year and Invoice Numbering", () => {
  test("Computes correct FY for mid-year (September 2026)", () => {
    const date = new Date("2026-09-16T10:00:00Z");
    const fy = getIndianFinancialYear(date);
    assert.strictEqual(fy, "26-27");
  });

  test("Computes correct FY for pre-April date (February 2026)", () => {
    const date = new Date("2026-02-10T10:00:00Z");
    const fy = getIndianFinancialYear(date);
    assert.strictEqual(fy, "25-26");
  });

  test("Formats sequential invoice number correctly", () => {
    const invNum = formatInvoiceNumber("FZ", "26-27", 42);
    assert.strictEqual(invNum, "FZ/26-27/0042");
  });
});

describe("3. ESSL Biometric Deduplication Window Engine", () => {
  function getDedupHash(tenantId: string, memberId: string, timestampMs: number): string {
    const bucket = Math.floor(timestampMs / (5 * 60 * 1000));
    return crypto.createHash("sha256").update(`${tenantId}:${memberId}:${bucket}`).digest("hex");
  }

  test("Punches from same member within 5 minutes produce identical hash (Duplicate suppressed)", () => {
    const tenantId = "tenant-uuid-1";
    const memberId = "member-uuid-101";

    const punch1Time = new Date("2026-09-16T08:01:00Z").getTime();
    const punch2Time = new Date("2026-09-16T08:03:30Z").getTime(); // 2.5 minutes later

    const hash1 = getDedupHash(tenantId, memberId, punch1Time);
    const hash2 = getDedupHash(tenantId, memberId, punch2Time);

    assert.strictEqual(hash1, hash2, "Punches within 5 minutes must have identical dedup hash");
  });

  test("Punches from different members in same window produce different hashes", () => {
    const tenantId = "tenant-uuid-1";
    const member1 = "member-1";
    const member2 = "member-2";
    const time = new Date("2026-09-16T08:01:00Z").getTime();

    const hash1 = getDedupHash(tenantId, member1, time);
    const hash2 = getDedupHash(tenantId, member2, time);

    assert.notStrictEqual(hash1, hash2);
  });
});

describe("4. Cryptographic Password Hashing & Verification", () => {
  test("Hashes password and successfully verifies match", async () => {
    const raw = "SecureGymPass#2026";
    const hash = await hashPassword(raw);

    assert.notStrictEqual(raw, hash);
    const isMatch = await verifyPassword(raw, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await verifyPassword("WrongPassword", hash);
    assert.strictEqual(isWrong, false);
  });
});

describe("5. Role-Based Access Control (RBAC) Matrix", () => {
  test("Front Desk role permissions", () => {
    assert.strictEqual(hasPermission("FRONT_DESK", "MEMBER_ONBOARDING"), true);
    assert.strictEqual(hasPermission("FRONT_DESK", "COLLECT_PAYMENTS"), true);
    assert.strictEqual(hasPermission("FRONT_DESK", "MANUAL_ATTENDANCE"), true);
    assert.strictEqual(hasPermission("FRONT_DESK", "MANAGE_TENANT_SETTINGS"), false);
    assert.strictEqual(hasPermission("FRONT_DESK", "ISSUE_REFUNDS"), false);
  });

  test("Gym Owner role permissions", () => {
    assert.strictEqual(hasPermission("GYM_OWNER", "MANAGE_TENANT_SETTINGS"), true);
    assert.strictEqual(hasPermission("GYM_OWNER", "ISSUE_REFUNDS"), true);
    assert.strictEqual(hasPermission("GYM_OWNER", "VIEW_FINANCIAL_REPORTS"), true);
  });

  test("Module access permissions", () => {
    assert.strictEqual(canAccessModule("FRONT_DESK", "members"), true);
    assert.strictEqual(canAccessModule("FRONT_DESK", "settings"), false);
    assert.strictEqual(canAccessModule("GYM_OWNER", "settings"), true);
    assert.strictEqual(canAccessModule("ACCOUNTANT", "billing"), true);
    assert.strictEqual(canAccessModule("ACCOUNTANT", "members"), false);
  });
});

describe("6. Razorpay Webhook HMAC-SHA256 Cryptographic Verification", () => {
  const secret = "super_secret_webhook_key_2026";
  const rawBody = JSON.stringify({
    event: "payment_link.paid",
    payload: {
      payment: {
        entity: {
          id: "pay_TEST123456",
          amount: 590000,
        },
      },
    },
  });

  test("Valid signature passes verification", () => {
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const isValid = verifyRazorpayWebhookSignature(rawBody, validSignature, secret);
    assert.strictEqual(isValid, true);
  });

  test("Tampered body fails verification", () => {
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const tamperedBody = rawBody.replace("590000", "100000");
    const isValid = verifyRazorpayWebhookSignature(tamperedBody, validSignature, secret);
    assert.strictEqual(isValid, false);
  });

  test("Wrong secret or forged signature fails verification", () => {
    const forgedSignature = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    const isValid = verifyRazorpayWebhookSignature(rawBody, forgedSignature, secret);
    assert.strictEqual(isValid, false);
  });
});

describe("7. Transactional Email Notification Templates", () => {
  test("Welcome email template includes gym details and member code", () => {
    const html = generateWelcomeEmailHtml({
      gymName: "FitZone Elite",
      memberName: "Rohit Sharma",
      memberCode: "FZ-1008",
      planName: "Annual Platinum All-Access",
      startDate: "16 Sep 2026",
      endDate: "15 Sep 2027",
      gymAddress: "Plot 42, HSR Layout Sector 2, Bengaluru",
      contactPhone: "+91 98765 43210",
    });

    assert.ok(html.includes("FitZone Elite"));
    assert.ok(html.includes("Rohit Sharma"));
    assert.ok(html.includes("FZ-1008"));
    assert.ok(html.includes("Annual Platinum All-Access"));
    assert.ok(html.includes("Plot 42, HSR Layout"));
  });

  test("Statutory GST Payment receipt email contains SAC code and receipt number", () => {
    const html = generatePaymentReceiptEmailHtml({
      gymName: "FitZone Elite",
      gymGstin: "29AAAAA0000A1Z5",
      receiptNumber: "RCP-00042",
      invoiceNumber: "FZ/26-27/0042",
      memberName: "Pooja Verma",
      amount: 11800,
      paymentMode: "UPI",
      referenceNumber: "UPI-UTR-998877",
      balanceAmount: 0,
      paymentDate: "16 Sep 2026",
    });

    assert.ok(html.includes("29AAAAA0000A1Z5"));
    assert.ok(html.includes("RCP-00042"));
    assert.ok(html.includes("FZ/26-27/0042"));
    assert.ok(html.includes("SAC Code: 999723"));
    assert.ok(html.includes("UPI-UTR-998877"));
  });

  test("Expiry warning email contains remaining days and urgency banner", () => {
    const html = generateExpiryReminderEmailHtml({
      gymName: "FitZone Elite",
      memberName: "Pooja Verma",
      planName: "3 Month Strength & Conditioning",
      expiryDate: "19 Sep 2026",
      daysRemaining: 3,
      contactPhone: "+91 98765 43210",
      renewalLink: "https://fitzone.in/renew/FZ-1008",
    });

    assert.ok(html.includes("3 days"));
    assert.ok(html.includes("19 Sep 2026"));
    assert.ok(html.includes("https://fitzone.in/renew/FZ-1008"));
  });
});

describe("8. Cryptographic Client Self-Registration Invite Tokens", () => {
  test("Generates and successfully verifies valid invite token", async () => {
    const { createClientInviteToken, verifyClientInviteToken } = await import("@/lib/invites");
    const payload = {
      tenantId: "5fe0f2fc-5e85-46dc-bb03-16b9bc803f80",
      gymName: "FitZone Elite Club",
      clientName: "Rohan Kapoor",
      clientPhone: "9876543210",
    };

    const token = await createClientInviteToken(payload, 48);
    assert.ok(typeof token === "string" && token.length > 20);

    const decoded = await verifyClientInviteToken(token);
    assert.ok(decoded !== null);
    assert.strictEqual(decoded?.tenantId, payload.tenantId);
    assert.strictEqual(decoded?.gymName, payload.gymName);
    assert.strictEqual(decoded?.clientName, payload.clientName);
    assert.strictEqual(decoded?.clientPhone, payload.clientPhone);
  });

  test("Rejects malformed or tampered invite tokens", async () => {
    const { verifyClientInviteToken } = await import("@/lib/invites");
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";
    const result = await verifyClientInviteToken(invalidToken);
    assert.strictEqual(result, null);
  });
});

