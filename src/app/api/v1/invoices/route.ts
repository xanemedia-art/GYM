import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { calculateGst, formatInvoiceNumber, getIndianFinancialYear, GYM_HSN_SAC_CODE } from "@/lib/gst";
import { apiError, apiSuccess } from "@/lib/api-response";
import { InvoiceStatus } from "@prisma/client";

const createInvoiceSchema = z.object({
  memberId: z.string().uuid("Valid member ID required"),
  membershipId: z.string().uuid().optional().nullable(),
  basePrice: z.number().positive("Base price must be positive"),
  discountAmount: z.number().nonnegative().optional().default(0),
  description: z.string().min(1, "Item description is required"),
  dueDate: z.string().optional(),
  isInterState: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as InvoiceStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenantId: session.tenantId,
    };

    if (status) {
      whereClause.status = status;
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where: whereClause }),
      prisma.invoice.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { issuedAt: "desc" },
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, phone: true, memberCode: true },
          },
          items: true,
          payments: {
            select: { id: true, paymentNumber: true, amount: true, mode: true, paymentDate: true },
          },
        },
      }),
    ]);

    return apiSuccess(invoices, { page, limit, total });
  } catch (error: any) {
    console.error("List Invoices API Error:", error);
    return apiError("Failed to fetch invoices", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "COLLECT_PAYMENTS")) {
      return apiError("Insufficient permission to generate invoices", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { memberId, membershipId, basePrice, discountAmount, description, dueDate, isInterState } = parsed.data;

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: session.tenantId },
    });

    const prefix = tenantSettings?.invoicePrefix || "INV";
    const gstRate = Number(tenantSettings?.gstRatePercentage || 18.0);
    const fy = getIndianFinancialYear();

    // Calculate tax breakdown
    const gstBreakdown = calculateGst(basePrice, discountAmount, gstRate, isInterState);

    // Atomic sequence count for tenant this FY
    const invoiceCount = await prisma.invoice.count({
      where: { tenantId: session.tenantId },
    });
    const invoiceNumber = formatInvoiceNumber(prefix, fy, invoiceCount + 1);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: session.tenantId,
        invoiceNumber,
        memberId,
        membershipId: membershipId || null,
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
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        items: {
          create: {
            description,
            hsnSacCode: GYM_HSN_SAC_CODE,
            quantity: 1,
            unitPrice: gstBreakdown.basePrice,
            taxableValue: gstBreakdown.taxableAmount,
            gstRate,
            totalItemAmount: gstBreakdown.totalAmount,
          },
        },
      },
      include: {
        items: true,
        member: true,
      },
    });

    return apiSuccess(invoice, undefined, 201);
  } catch (error: any) {
    console.error("Create Invoice API Error:", error);
    return apiError("Failed to create tax invoice", "SERVER_ERROR", 500);
  }
}
