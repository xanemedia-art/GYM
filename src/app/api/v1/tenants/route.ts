import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

const createTenantSchema = z.object({
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  businessName: z.string().min(2, "Gym branch name required"),
  legalName: z.string().optional(),
  gstin: z.string().optional(),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  street: z.string().optional(),
  pincode: z.string().optional(),
  invoicePrefix: z.string().min(2).max(10).optional().default("FZ"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Scope tenants: Staff only see their assigned branch; Owners/SuperAdmins see their network
    const whereClause: any = { isActive: true };
    if (session.role !== "SUPER_ADMIN" && session.role !== "GYM_OWNER") {
      whereClause.id = session.tenantId || "none";
    }

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      include: {
        settings: true,
        _count: {
          select: {
            members: { where: { isDeleted: false } },
            users: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      businessName: t.businessName,
      legalName: t.legalName,
      gstin: t.gstin,
      phone: t.phone,
      email: t.email,
      address: t.address,
      invoicePrefix: t.settings?.invoicePrefix || "BFF",
      upiId: t.settings?.upiId || null,
      upiMerchantName: t.settings?.upiMerchantName || t.businessName,
      memberCount: t._count.members,
      staffCount: t._count.users,
      isCurrent: t.id === session.tenantId,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    console.error("List Tenants Error:", error);
    return apiError("Failed to fetch gym branches", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== "GYM_OWNER" && session.role !== "SUPER_ADMIN") {
      return apiError("Only gym owners can register new branches", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const {
      slug,
      businessName,
      legalName,
      gstin,
      phone,
      email,
      city,
      state,
      street,
      pincode,
      invoicePrefix,
    } = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return apiError("A branch with this URL slug already exists", "CONFLICT", 409);
    }

    // Fetch current owner user to clone credentials
    const currentOwner = await prisma.user.findUnique({ where: { id: session.id } });
    if (!currentOwner) {
      return apiError("User not found", "NOT_FOUND", 404);
    }

    // Atomically create Tenant, TenantSettings, and owner association
    const newTenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          businessName,
          legalName: legalName || businessName,
          gstin: gstin || null,
          phone,
          email,
          address: {
            street: street || "",
            city,
            state,
            pincode: pincode || "",
          },
          currency: "INR",
          timezone: "Asia/Kolkata",
          settings: {
            create: {
              invoicePrefix: invoicePrefix || "FZ",
              enableGst: true,
              gstRatePercentage: 18.0,
              attendanceDuplicateWindowMin: 5,
              autoWhatsappBirthdays: true,
              autoWhatsappReminders: true,
              reminderScheduleDaysBefore: [7, 3, 1],
            },
          },
        },
        include: { settings: true },
      });

      // Ensure owner has user record in new branch
      await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: currentOwner.email,
          passwordHash: currentOwner.passwordHash,
          fullName: currentOwner.fullName,
          phone: currentOwner.phone,
          role: "GYM_OWNER",
        },
      });

      // Create standard default plans for new branch
      const starterPlans = [
        { name: "Monthly Strength Plan", durationDays: 30, basePrice: 2500, joiningFee: 500 },
        { name: "Quarterly Transformation", durationDays: 90, basePrice: 6500, joiningFee: 0 },
        { name: "Annual Pro Elite", durationDays: 365, basePrice: 19999, joiningFee: 0 },
      ];

      for (const p of starterPlans) {
        await tx.membershipPlan.create({
          data: {
            tenantId: tenant.id,
            name: p.name,
            durationDays: p.durationDays,
            basePrice: p.basePrice,
            joiningFee: p.joiningFee,
            versions: {
              create: {
                versionNumber: 1,
                durationDays: p.durationDays,
                basePrice: p.basePrice,
              },
            },
          },
        });
      }

      return tenant;
    });

    return apiSuccess(newTenant, undefined, 201);
  } catch (error: any) {
    console.error("Create Tenant Error:", error);
    return apiError("Failed to create gym branch", "SERVER_ERROR", 500);
  }
}

const updateSettingsSchema = z.object({
  businessName: z.string().min(2).optional(),
  legalName: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  upiId: z.string().optional().nullable(),
  upiMerchantName: z.string().optional().nullable(),
  invoicePrefix: z.string().optional(),
  gstRatePercentage: z.number().optional(),
  attendanceDuplicateWindowMin: z.number().optional(),
  autoWhatsappBirthdays: z.boolean().optional(),
  autoWhatsappReminders: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }
    const tenantId: string = session.tenantId;

    if (session.role !== "GYM_OWNER" && session.role !== "SUPER_ADMIN" && session.role !== "MANAGER") {
      return apiError("Only gym managers and owners can update branch settings", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const {
      businessName,
      legalName,
      gstin,
      phone,
      email,
      upiId,
      upiMerchantName,
      invoicePrefix,
      gstRatePercentage,
      attendanceDuplicateWindowMin,
      autoWhatsappBirthdays,
      autoWhatsappReminders,
    } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Tenant profile
      const tenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          ...(businessName ? { businessName } : {}),
          ...(legalName !== undefined ? { legalName } : {}),
          ...(gstin !== undefined ? { gstin } : {}),
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
        },
      });

      // 2. Upsert Tenant Settings
      const settings = await tx.tenantSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          upiId: upiId || null,
          upiMerchantName: upiMerchantName || businessName || tenant.businessName,
          invoicePrefix: invoicePrefix || "BFF",
          gstRatePercentage: gstRatePercentage !== undefined ? gstRatePercentage : 18.0,
          attendanceDuplicateWindowMin: attendanceDuplicateWindowMin !== undefined ? attendanceDuplicateWindowMin : 5,
          autoWhatsappBirthdays: autoWhatsappBirthdays ?? true,
          autoWhatsappReminders: autoWhatsappReminders ?? true,
        },
        update: {
          ...(upiId !== undefined ? { upiId } : {}),
          ...(upiMerchantName !== undefined ? { upiMerchantName } : {}),
          ...(invoicePrefix ? { invoicePrefix } : {}),
          ...(gstRatePercentage !== undefined ? { gstRatePercentage } : {}),
          ...(attendanceDuplicateWindowMin !== undefined ? { attendanceDuplicateWindowMin } : {}),
          ...(autoWhatsappBirthdays !== undefined ? { autoWhatsappBirthdays } : {}),
          ...(autoWhatsappReminders !== undefined ? { autoWhatsappReminders } : {}),
        },
      });

      return { ...tenant, settings };
    });

    return apiSuccess(updated);
  } catch (error: any) {
    console.error("Update Tenant Settings Error:", error);
    return apiError("Failed to update branch settings", "SERVER_ERROR", 500);
  }
}
