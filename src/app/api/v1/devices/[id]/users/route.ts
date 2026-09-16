import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";

const mapUserSchema = z.object({
  memberId: z.string().uuid("Valid member ID required"),
  deviceEnrollmentId: z.number().int().positive("Device integer user ID must be positive"),
  cardNumber: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { id } = await params;

    const deviceUsers = await prisma.deviceUser.findMany({
      where: { deviceId: id, tenantId: session.tenantId },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, memberCode: true, phone: true, status: true },
        },
      },
      orderBy: { deviceEnrollmentId: "asc" },
    });

    return apiSuccess(deviceUsers);
  } catch (error: any) {
    console.error("List Device Users API Error:", error);
    return apiError("Failed to list mapped biometric users", "SERVER_ERROR", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "CONFIGURE_DEVICES")) {
      return apiError("Insufficient permission to map biometric users", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = mapUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { memberId, deviceEnrollmentId, cardNumber } = parsed.data;

    const device = await prisma.device.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!device) return apiError("Device not found", "NOT_FOUND", 404);

    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId: session.tenantId, isDeleted: false },
    });
    if (!member) return apiError("Member not found", "NOT_FOUND", 404);

    // Upsert mapping
    const mapping = await prisma.deviceUser.upsert({
      where: {
        uq_device_enrollment: {
          deviceId: device.id,
          deviceEnrollmentId,
        },
      },
      update: {
        memberId: member.id,
        cardNumber: cardNumber || null,
        isSynced: true,
      },
      create: {
        tenantId: session.tenantId,
        deviceId: device.id,
        memberId: member.id,
        deviceEnrollmentId,
        cardNumber: cardNumber || null,
        isSynced: true,
      },
      include: {
        member: { select: { firstName: true, lastName: true, memberCode: true } },
      },
    });

    return apiSuccess(mapping, undefined, 201);
  } catch (error: any) {
    console.error("Map Device User API Error:", error);
    return apiError("Failed to map biometric user", "SERVER_ERROR", 500);
  }
}
