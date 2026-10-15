import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { apiError, apiSuccess } from "@/lib/api-response";
import { UserRole } from "@prisma/client";

const createStaffSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email address is required"),
  password: z.string().min(6, "Initial password must be at least 6 characters"),
  role: z.enum([
    UserRole.MANAGER,
    UserRole.FRONT_DESK,
    UserRole.TRAINER,
    UserRole.ACCOUNTANT,
  ]),
  tenantId: z.string().uuid("Valid assigned branch ID is required"),
  phone: z.string().optional().nullable().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Only Gym Owner and Super Admin can view and manage staff accounts
    if (session.role !== UserRole.GYM_OWNER && session.role !== UserRole.SUPER_ADMIN) {
      return apiError("Only the gym owner can access staff management", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(req.url);
    const branchFilter = searchParams.get("tenantId");
    const roleFilter = searchParams.get("role") as UserRole | null;
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const whereClause: any = {};

    if (branchFilter && branchFilter !== "ALL") {
      whereClause.tenantId = branchFilter;
    }

    if (roleFilter) {
      whereClause.role = roleFilter;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const staffUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            businessName: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "desc" },
      ],
    });

    return apiSuccess(staffUsers);
  } catch (error: any) {
    console.error("List Staff API Error:", error);
    return apiError("Failed to fetch staff members", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (session.role !== UserRole.GYM_OWNER && session.role !== UserRole.SUPER_ADMIN) {
      return apiError("Only the gym owner can create new staff logins", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { fullName, email, password, role, tenantId, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify assigned target branch exists and is active
    const targetBranch = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, businessName: true, isActive: true },
    });

    if (!targetBranch || !targetBranch.isActive) {
      return apiError("Selected gym branch does not exist or is inactive", "NOT_FOUND", 404);
    }

    // Check if staff user already exists for this tenant
    const existing = await prisma.user.findFirst({
      where: {
        tenantId,
        email: normalizedEmail,
      },
    });

    if (existing) {
      return apiError(
        `A user with email ${normalizedEmail} is already assigned to ${targetBranch.businessName}`,
        "DUPLICATE_STAFF",
        409
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        tenantId,
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        role,
        phone: phone?.trim() || null,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            businessName: true,
          },
        },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: session.id,
          action: "STAFF_USER_CREATED",
          entityType: "USER",
          entityId: newUser.id,
          newValues: {
            email: newUser.email,
            role: newUser.role,
            assignedBranch: targetBranch.businessName,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Non-fatal staff creation audit log warning:", auditErr);
    }

    return apiSuccess(newUser, undefined, 201);
  } catch (error: any) {
    console.error("Create Staff API Error:", error);
    if (error?.code === "P2002") {
      return apiError("This staff email is already registered in this branch.", "DUPLICATE_ENTRY", 409);
    }
    return apiError(error?.message || "Failed to create staff account", "SERVER_ERROR", 500);
  }
}
