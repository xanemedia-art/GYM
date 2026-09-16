import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { apiError, apiSuccess } from "@/lib/api-response";
import { DeviceProtocol } from "@prisma/client";

const createDeviceSchema = z.object({
  deviceName: z.string().min(1, "Device name required"),
  serialNumber: z.string().min(1, "Serial number required"),
  ipAddress: z.string().optional(),
  port: z.number().int().default(4370),
  protocol: z.nativeEnum(DeviceProtocol).default(DeviceProtocol.ZK_LAN_DIRECT),
  deviceDirection: z.string().default("IN_OUT"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const devices = await prisma.device.findMany({
      where: { tenantId: session.tenantId },
      include: {
        _count: {
          select: {
            deviceUsers: true,
            attendanceRecords: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(devices);
  } catch (error: any) {
    console.error("List Devices API Error:", error);
    return apiError("Failed to fetch registered biometric devices", "SERVER_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return apiError("Unauthorized", "UNAUTHORIZED", 401);
    }

    if (!hasPermission(session.role, "CONFIGURE_DEVICES")) {
      return apiError("Insufficient permission to configure devices", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = createDeviceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { deviceName, serialNumber, ipAddress, port, protocol, deviceDirection } = parsed.data;

    // Check duplicate serial
    const existing = await prisma.device.findFirst({
      where: { tenantId: session.tenantId, serialNumber },
    });

    if (existing) {
      return apiError("A device with this serial number is already registered", "DUPLICATE_DEVICE", 409);
    }

    // Generate secure device API Key
    const rawApiKey = `gymsync_${crypto.randomBytes(24).toString("hex")}`;
    const apiKeyHash = crypto.createHash("sha256").update(rawApiKey).digest("hex");

    const device = await prisma.device.create({
      data: {
        tenantId: session.tenantId,
        deviceName,
        serialNumber,
        ipAddress: ipAddress || "192.168.1.201",
        port,
        protocol,
        deviceDirection,
        apiKeyHash,
      },
    });

    return apiSuccess({
      device,
      credentials: {
        deviceSerial: device.serialNumber,
        deviceApiKey: rawApiKey, // Only returned once on creation for agent config
      },
    }, undefined, 201);
  } catch (error: any) {
    console.error("Register Device API Error:", error);
    return apiError("Failed to register biometric device", "SERVER_ERROR", 500);
  }
}
