import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyClientInviteToken } from "@/lib/invites";
import { calculateGst, formatInvoiceNumber, getIndianFinancialYear, GYM_HSN_SAC_CODE } from "@/lib/gst";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api-response";
import { GenderType, MemberStatus, InvoiceStatus } from "@prisma/client";

const selfRegisterSchema = z.object({
  token: z.string().min(1, "Invite token required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid 10-digit phone required"),
  whatsappNumber: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  gender: z.nativeEnum(GenderType).default(GenderType.MALE),
  dateOfBirth: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  planId: z.string().uuid("Valid plan ID required"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`self_reg_get:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return apiError(`Too many requests. Please wait ${rateLimit.resetSeconds}s.`, "RATE_LIMITED", 429);
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return apiError("Missing invite token", "VALIDATION_ERROR", 400);
    }

    const payload = await verifyClientInviteToken(token);
    if (!payload) {
      return apiError("This registration link has expired or is invalid", "EXPIRED_LINK", 400);
    }

    const [tenant, plans] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: payload.tenantId, isActive: true },
        select: {
          id: true,
          businessName: true,
          legalName: true,
          phone: true,
          email: true,
          address: true,
          currency: true,
        },
      }),
      prisma.membershipPlan.findMany({
        where: { tenantId: payload.tenantId, isActive: true },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
        orderBy: { durationDays: "asc" },
      }),
    ]);

    if (!tenant) {
      return apiError("Gym branch not found or inactive", "NOT_FOUND", 404);
    }

    return apiSuccess({
      tenant,
      plans,
      prefill: {
        clientName: payload.clientName || "",
        clientPhone: payload.clientPhone || "",
      },
    });
  } catch (error: any) {
    console.error("Self Register GET Error:", error);
    return apiError("Failed to verify invitation", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`self_reg_post:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return apiError(
        `Registration rate limit exceeded. Please wait ${rateLimit.resetSeconds}s before attempting again.`,
        "RATE_LIMITED",
        429
      );
    }

    const body = await req.json();
    const parsed = selfRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const {
      token,
      firstName,
      lastName,
      phone,
      whatsappNumber,
      email,
      gender,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      planId,
      notes,
    } = parsed.data;

    // Verify token
    const payload = await verifyClientInviteToken(token);
    if (!payload) {
      return apiError("This invitation link has expired. Please contact the gym reception.", "EXPIRED_LINK", 400);
    }

    const tenantId = payload.tenantId;

    // Verify plan
    const [plan, tenantSettings, existingMember] = await Promise.all([
      prisma.membershipPlan.findFirst({
        where: { id: planId, tenantId, isActive: true },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      }),
      prisma.tenantSettings.findUnique({ where: { tenantId } }),
      prisma.member.findFirst({ where: { tenantId, phone, isDeleted: false } }),
    ]);

    if (!plan) {
      return apiError("Selected plan is not available", "NOT_FOUND", 404);
    }

    if (existingMember) {
      return apiError(
        `A member with phone number ${phone} is already registered. Please visit the front desk for renewal.`,
        "DUPLICATE_MEMBER",
        409
      );
    }

    let latestVersion = plan.versions[0];
    if (!latestVersion) {
      latestVersion = await prisma.membershipPlanVersion.create({
        data: {
          planId: plan.id,
          versionNumber: 1,
          durationDays: plan.durationDays,
          basePrice: plan.basePrice,
        },
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + latestVersion.durationDays);

    // Generate sequential member code
    const memberCount = await prisma.member.count({ where: { tenantId } });
    const prefix = tenantSettings?.invoicePrefix || "FZ";
    const memberCode = `${prefix}-${1000 + memberCount + 1}`;

    // Run creation in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Member
      const member = await tx.member.create({
        data: {
          tenantId,
          memberCode,
          firstName,
          lastName,
          gender,
          phone,
          whatsappNumber: whatsappNumber || phone,
          email: email || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          status: MemberStatus.ACTIVE,
          notes: notes ? `Self-Registered online. Notes: ${notes}` : "Self-Registered online via client portal.",
        },
      });

      // 2. Create Membership
      const membership = await tx.membership.create({
        data: {
          tenantId,
          memberId: member.id,
          planVersionId: latestVersion.id,
          startDate,
          endDate,
          originalEndDate: endDate,
          status: MemberStatus.ACTIVE,
        },
      });

      // 3. Generate statutory GST Tax Invoice
      const gstRate = Number(tenantSettings?.gstRatePercentage || 18.0);
      const fy = getIndianFinancialYear(startDate);
      const basePrice = Number(latestVersion.basePrice) + Number(plan.joiningFee);
      const gstBreakdown = calculateGst(basePrice, 0, gstRate, false);

      const invoiceCount = await tx.invoice.count({ where: { tenantId } });
      const invoiceNumber = formatInvoiceNumber(prefix, fy, invoiceCount + 1);

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          memberId: member.id,
          membershipId: membership.id,
          subtotal: gstBreakdown.basePrice,
          discountAmount: 0.0,
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
              description: `${plan.name} (${latestVersion.durationDays} Days) - Self Onboarding`,
              hsnSacCode: GYM_HSN_SAC_CODE,
              quantity: 1,
              unitPrice: gstBreakdown.basePrice,
              taxableValue: gstBreakdown.taxableAmount,
              gstRate,
              totalItemAmount: gstBreakdown.totalAmount,
            },
          },
        },
      });

      return { member, membership, invoice };
    });

    return apiSuccess(
      {
        message: "Registration completed successfully! Welcome to the gym family.",
        memberCode: result.member.memberCode,
        fullName: `${result.member.firstName} ${result.member.lastName}`,
        planName: plan.name,
        endDate: endDate.toISOString(),
        invoiceNumber: result.invoice.invoiceNumber,
        totalAmount: Number(result.invoice.totalAmount),
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error("Self Register POST Error:", error);
    return apiError("Registration failed. Please contact the gym reception.", "SERVER_ERROR", 500);
  }
}
