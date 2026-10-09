import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api-response";
import { GenderType, MemberStatus } from "@prisma/client";

const gateRegisterSchema = z.object({
  slug: z.string().min(1, "Branch slug is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  whatsappNumber: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  gender: z.nativeEnum(GenderType).default(GenderType.MALE),
  dateOfBirth: z.string().min(1, "Date of birth is mandatory"),
  height: z
    .union([z.number(), z.string()])
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 40 && Number(v) <= 250, "Height (cm) is mandatory (40 - 250 cm)"),
  weight: z
    .union([z.number(), z.string()])
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 20 && Number(v) <= 300, "Current weight (kg) is mandatory (20 - 300 kg)"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  planId: z.string().uuid("Valid plan ID required").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`gate_reg:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return apiError(
        `Too many registration requests. Please wait ${rateLimit.resetSeconds}s.`,
        "RATE_LIMITED",
        429
      );
    }

    const body = await req.json();
    const parsed = gateRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const {
      slug,
      firstName,
      lastName,
      phone,
      whatsappNumber,
      email,
      gender,
      dateOfBirth,
      height,
      weight,
      emergencyContactName,
      emergencyContactPhone,
      planId,
    } = parsed.data;

    const numHeight = Number(height);
    const numWeight = Number(weight);

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    // 1. Resolve Tenant Branch
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        businessName: true,
        isActive: true,
        settings: {
          select: {
            invoicePrefix: true,
          },
        },
      },
    });

    if (!tenant || !tenant.isActive) {
      return apiError("Gym branch not found or inactive", "TENANT_NOT_FOUND", 404);
    }

    // 2. Check if already registered
    const existing = await prisma.member.findFirst({
      where: {
        tenantId: tenant.id,
        phone: { contains: cleanPhone },
        isDeleted: false,
      },
      select: {
        id: true,
        memberCode: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (existing) {
      return apiError(
        `A member with phone ${phone} already exists (${existing.firstName} ${existing.lastName}, Code: ${existing.memberCode}). Please visit the front desk for assistance.`,
        "MEMBER_EXISTS",
        409
      );
    }

    // 3. Resolve Selected Plan details if provided
    let planDetails = "General Membership Inquiry";
    if (planId) {
      const selectedPlan = await prisma.membershipPlan.findFirst({
        where: { id: planId, tenantId: tenant.id, isActive: true },
        select: { name: true, durationDays: true },
      });
      if (selectedPlan) {
        planDetails = `Desired Plan: ${selectedPlan.name} (${selectedPlan.durationDays} Days)`;
      }
    }

    // 4. Generate sequential Lead/Inquiry Code
    const totalMembers = await prisma.member.count({ where: { tenantId: tenant.id } });
    const prefix = tenant.settings?.invoicePrefix || "BF";
    const memberCode = `${prefix}-W${1000 + totalMembers + 1}`;

    // 5. Create Member with status LEAD (Inquiry / Gate Registration)
    const member = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        memberCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        phone: cleanPhone,
        whatsappNumber: whatsappNumber ? whatsappNumber.replace(/\D/g, "").slice(-10) : cleanPhone,
        email: email || null,
        dateOfBirth: new Date(dateOfBirth),
        emergencyContactName: emergencyContactName?.trim() || null,
        emergencyContactPhone: emergencyContactPhone?.trim() || null,
        status: MemberStatus.LEAD, // Saved as Lead first, waiting for front desk offline fee clearance
        healthMetrics: {
          heightCm: numHeight,
          weightKg: numWeight,
        },
        notes: `Self-onboarded via Gate QR Code. Height: ${numHeight} cm, Weight: ${numWeight} kg. ${planDetails}. Awaiting front-desk offline payment clearance.`,
        customFields: {
          requestedPlanId: planId || null,
          requestedPlanName: planDetails,
          heightCm: numHeight,
          weightKg: numWeight,
          source: "GATE_QR_CODE",
        },
      },
    });

    return apiSuccess(
      {
        message: "Gate registration received successfully!",
        memberCode: member.memberCode,
        fullName: `${member.firstName} ${member.lastName}`,
        businessName: tenant.businessName,
        status: "LEAD",
        requestedPlan: planDetails,
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error("Gate Register API Error:", error);
    return apiError("Failed to register. Please visit the front desk.", "SERVER_ERROR", 500);
  }
}
