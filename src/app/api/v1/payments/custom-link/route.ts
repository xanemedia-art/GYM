import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createRazorpayPaymentLink } from "@/lib/payments/razorpay";
import { calculateGst, formatInvoiceNumber, getIndianFinancialYear, GYM_HSN_SAC_CODE } from "@/lib/gst";
import { generateUniqueMemberCode } from "@/lib/member-code";

const customPaymentSchema = z.object({
  memberId: z.string().uuid().optional(),
  clientName: z.string().min(2, "Client name is required"),
  clientPhone: z.string().min(10, "Valid 10-digit phone is required"),
  clientEmail: z.string().email().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().min(3, "Description/purpose is required"),
  dueDateDays: z.number().int().min(1).max(30).optional().default(3),
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
    const parsed = customPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const {
      memberId,
      clientName,
      clientPhone,
      clientEmail,
      amount,
      description,
      dueDateDays,
    } = parsed.data;

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: { settings: true },
    });

    if (!tenant) {
      return apiError("Tenant branch not found", "NOT_FOUND", 404);
    }

    // 1. Resolve or Create Member
    let targetMemberId = memberId;
    if (targetMemberId) {
      const existing = await prisma.member.findFirst({
        where: { id: targetMemberId, tenantId: session.tenantId, isDeleted: false },
      });
      if (!existing) {
        return apiError("Provided member ID does not exist in this gym branch", "NOT_FOUND", 404);
      }
    } else {
      // Check if member exists by phone in this tenant
      let existingMember = await prisma.member.findFirst({
        where: { tenantId: session.tenantId, phone: clientPhone },
      });

      if (!existingMember) {
        // Create a walk-in/lead member record with guaranteed unique code
        const memberCode = await generateUniqueMemberCode(session.tenantId, "BFF");
        const nameParts = clientName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "";

        existingMember = await prisma.member.create({
          data: {
            tenantId: session.tenantId,
            memberCode,
            firstName,
            lastName,
            gender: "UNDISCLOSED",
            phone: clientPhone,
            email: clientEmail || null,
            status: "LEAD",
            notes: `Auto-created for custom payment: ${description}`,
          },
        });
      }
      targetMemberId = existingMember.id;
    }

    // 2. Compute Invoice Financial Year Number
    const prefix = tenant.settings?.invoicePrefix || "BFF";
    const fy = getIndianFinancialYear();
    const invoiceCount = await prisma.invoice.count({
      where: { tenantId: session.tenantId },
    });
    const nextInvoiceNumber = formatInvoiceNumber(prefix, fy, invoiceCount + 1);

    // 3. Compute GST
    const gstRate = tenant.settings?.gstRatePercentage ? Number(tenant.settings.gstRatePercentage) : 18;
    const gstCalc = calculateGst(amount, 0, gstRate, false);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDateDays);

    // 4. Create Invoice Record in DB
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: session.tenantId,
        invoiceNumber: nextInvoiceNumber,
        memberId: targetMemberId,
        subtotal: amount,
        discountAmount: 0,
        taxableAmount: gstCalc.taxableAmount,
        cgstAmount: gstCalc.cgstAmount,
        sgstAmount: gstCalc.sgstAmount,
        igstAmount: gstCalc.igstAmount,
        totalAmount: gstCalc.totalAmount,
        paidAmount: 0,
        balanceAmount: gstCalc.totalAmount,
        status: "ISSUED",
        dueDate,
        items: {
          create: [
            {
              description,
              hsnSacCode: "999723",
              quantity: 1,
              unitPrice: gstCalc.taxableAmount,
              taxableValue: gstCalc.taxableAmount,
              gstRate,
              totalItemAmount: gstCalc.totalAmount,
            },
          ],
        },
      },
    });

    // 5. Generate Razorpay Payment Link
    const razorpayLink = await createRazorpayPaymentLink({
      amount: Number(gstCalc.totalAmount),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tenantId: session.tenantId,
      customerName: clientName,
      customerPhone: clientPhone,
      customerEmail: clientEmail,
      description: `${description} (${tenant.businessName})`,
    });

    // 6. Format WhatsApp Message
    const formattedAmount = `₹${Number(gstCalc.totalAmount).toLocaleString("en-IN")}`;
    const whatsappMessage = 
      `🏋️ *${tenant.businessName}*\n\n` +
      `Hi ${clientName}! Here is your payment request for *${description}*.\n\n` +
      `• *Amount Due*: ${formattedAmount}\n` +
      `• *Invoice Number*: ${invoice.invoiceNumber}\n` +
      `• *Pay Online via Razorpay* (UPI, Card, NetBanking):\n` +
      `${razorpayLink.short_url}\n\n` +
      `Please let us know once paid. Thank you!`;

    const cleanPhone = clientPhone.replace(/\D/g, "").slice(-10);
    const whatsappUrl = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    return apiSuccess({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(gstCalc.totalAmount),
      paymentLink: razorpayLink.short_url,
      paymentLinkId: razorpayLink.id,
      whatsappUrl,
      whatsappMessage,
      isSimulated: razorpayLink.isSimulated,
    }, undefined, 201);
  } catch (error: any) {
    console.error("Custom Payment Link API Error:", error);
    return apiError("Failed to create custom payment link", "SERVER_ERROR", 500);
  }
}
