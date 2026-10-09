import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api-response";
import { GenderType, MemberStatus } from "@prisma/client";
import { generateUniqueMemberCode } from "@/lib/member-code";
import { broadcastPushNotification } from "@/lib/push-notifications";

const gateRegisterSchema = z.object({
  slug: z.string().min(1, "Branch slug is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  whatsappNumber: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email("Valid email required").optional().nullable().or(z.literal("")),
  gender: z.nativeEnum(GenderType).default(GenderType.MALE),
  dateOfBirth: z.string().min(1, "Date of birth is mandatory"),
  height: z
    .union([z.number(), z.string()])
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 40 && Number(v) <= 250, "Height (cm) is mandatory (40 - 250 cm)"),
  weight: z
    .union([z.number(), z.string()])
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 20 && Number(v) <= 300, "Current weight (kg) is mandatory (20 - 300 kg)"),
  emergencyContactName: z.string().optional().nullable().or(z.literal("")),
  emergencyContactPhone: z.string().optional().nullable().or(z.literal("")),
  planId: z.string().uuid("Valid plan ID required").optional().nullable().or(z.literal("")),
  photoUrl: z.string().optional().nullable().or(z.literal("")),
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
      photoUrl,
    } = parsed.data;

    const numHeight = Number(height);
    const numWeight = Number(weight);

    // Clean phone number (extract last 10 digits)
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return apiError("Invalid phone number. Must be at least 10 digits.", "INVALID_PHONE", 400);
    }

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

    // 2. Check if an ACTIVE member with this phone already exists
    const existingActive = await prisma.member.findFirst({
      where: {
        tenantId: tenant.id,
        isDeleted: false,
        OR: [
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { phone: `0${cleanPhone}` },
          { phone: { endsWith: cleanPhone } },
        ],
      },
      select: {
        id: true,
        memberCode: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (existingActive) {
      return apiError(
        `A member with phone ${cleanPhone} already exists (${existingActive.firstName} ${existingActive.lastName}, ID: ${existingActive.memberCode}). Please visit the front desk for assistance.`,
        "MEMBER_EXISTS",
        409
      );
    }

    // 3. Free any SOFT-DELETED member records holding this phone number
    // so PostgreSQL's uq_tenant_member_phone constraint does not conflict
    await prisma.member.updateMany({
      where: {
        tenantId: tenant.id,
        isDeleted: true,
        OR: [
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { phone: `0${cleanPhone}` },
          { phone: { endsWith: cleanPhone } },
        ],
      },
      data: {
        phone: `${cleanPhone}_del_${Date.now()}`,
        memberCode: `DEL_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      },
    });

    // 4. Resolve Selected Plan details if provided
    let planDetails = "General Membership Inquiry";
    if (planId && typeof planId === "string" && planId.trim() !== "") {
      const selectedPlan = await prisma.membershipPlan.findFirst({
        where: { id: planId, tenantId: tenant.id, isActive: true },
        select: { name: true, durationDays: true },
      });
      if (selectedPlan) {
        planDetails = `Desired Plan: ${selectedPlan.name} (${selectedPlan.durationDays} Days)`;
      }
    }

    // 5. Generate collision-proof sequential Member Code
    const prefix = tenant.settings?.invoicePrefix ? `${tenant.settings.invoicePrefix}-W` : "BF-W";
    const memberCode = await generateUniqueMemberCode(tenant.id, prefix);

    // 6. Safe Date parsing
    let parsedDob: Date | null = null;
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    // 7. Create Member with status LEAD (Gate Registration awaiting payment clearance)
    const member = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        memberCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        phone: cleanPhone,
        whatsappNumber: whatsappNumber ? whatsappNumber.replace(/\D/g, "").slice(-10) : cleanPhone,
        email: email && email.trim() !== "" ? email.trim().toLowerCase() : null,
        dateOfBirth: parsedDob,
        emergencyContactName: emergencyContactName?.trim() || null,
        emergencyContactPhone: emergencyContactPhone?.trim() || null,
        photoUrl: photoUrl || null,
        status: MemberStatus.LEAD,
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

    // Broadcast instant push alert to gym owners & branch staff devices
    try {
      await broadcastPushNotification({
        tenantId: tenant.id,
        includeAdmins: true,
        payload: {
          title: "New Gate Registration! 🏋️",
          body: `${member.firstName} ${member.lastName} (${cleanPhone}) self-registered via Gate QR at ${tenant.businessName}!`,
          icon: member.photoUrl || "/bff-icon.png",
          badge: "/bff-icon.png",
          url: `/members`,
          tag: `gate-reg-${member.id}`,
        },
      });
    } catch (pushErr) {
      console.warn("[GATE_REGISTER_PUSH_WARN] Push notification dispatch non-fatal warning:", pushErr);
    }

    return apiSuccess(
      {
        message: "Gate registration received successfully!",
        memberCode: member.memberCode,
        fullName: `${member.firstName} ${member.lastName}`,
        photoUrl: member.photoUrl,
        businessName: tenant.businessName,
        status: "LEAD",
        requestedPlan: planDetails,
      },
      undefined,
      201
    );
  } catch (error: any) {
    console.error("Gate Register API Error:", error);
    if (error?.code === "P2002") {
      return apiError(
        "A member with these details already exists in this gym branch. Please visit the front desk for assistance.",
        "DUPLICATE_ENTRY",
        409
      );
    }
    return apiError(
      error?.message || "Failed to register. Please visit the front desk.",
      "SERVER_ERROR",
      500
    );
  }
}
