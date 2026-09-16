import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

const punchItemSchema = z.object({
  deviceEnrollmentId: z.number().int().positive(),
  punchTime: z.string(), // ISO String or YYYY-MM-DD HH:mm:ss
  punchType: z.enum(["CHECK_IN", "CHECK_OUT"]).default("CHECK_IN"),
  verificationMode: z.string().default("FINGERPRINT"), // FINGERPRINT, FACE, RFID
});

const batchPunchesSchema = z.object({
  punches: z.array(punchItemSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const serialNumber = req.headers.get("x-device-serial");
    const apiKey = req.headers.get("x-device-api-key");

    if (!serialNumber || !apiKey) {
      return apiError("Missing device authentication headers", "UNAUTHORIZED", 401);
    }

    // Lookup device
    const device = await prisma.device.findFirst({
      where: { serialNumber },
      include: { tenant: true },
    });

    if (!device) {
      return apiError("Device not registered", "DEVICE_NOT_FOUND", 404);
    }

    // Verify API Key (using SHA256 comparison)
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    if (device.apiKeyHash !== keyHash) {
      return apiError("Invalid device API key", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const parsed = batchPunchesSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation error", "VALIDATION_ERROR", 400, parsed.error.format());
    }

    const { punches } = parsed.data;

    let processedCount = 0;
    let duplicateCount = 0;
    let unmappedCount = 0;

    for (const punch of punches) {
      // Find member mapped to this enrollment ID on this device
      const mapping = await prisma.deviceUser.findUnique({
        where: {
          uq_device_enrollment: {
            deviceId: device.id,
            deviceEnrollmentId: punch.deviceEnrollmentId,
          },
        },
        include: { member: true },
      });

      if (!mapping || !mapping.member) {
        unmappedCount++;
        continue;
      }

      const punchDate = new Date(punch.punchTime);
      const bucket = Math.floor(punchDate.getTime() / (5 * 60 * 1000));
      const dedupHash = crypto
        .createHash("sha256")
        .update(`${device.tenantId}:${mapping.memberId}:${bucket}`)
        .digest("hex");

      try {
        await prisma.attendanceRecord.create({
          data: {
            tenantId: device.tenantId,
            memberId: mapping.memberId,
            deviceId: device.id,
            punchTime: punchDate,
            punchType: punch.punchType,
            verificationMode: punch.verificationMode,
            dedupHash,
          },
        });
        processedCount++;
      } catch (err: any) {
        // P2002 is Prisma unique constraint violation (duplicate punch)
        if (err.code === "P2002") {
          duplicateCount++;
        } else {
          console.error("Error creating attendance record:", err);
        }
      }
    }

    // Update device heartbeat and status
    await prisma.device.update({
      where: { id: device.id },
      data: {
        lastHeartbeatAt: new Date(),
        isOnline: true,
      },
    });

    return apiSuccess({
      totalReceived: punches.length,
      processedCount,
      duplicateCount,
      unmappedCount,
    });
  } catch (error: any) {
    console.error("ESSL Punches API Error:", error);
    return apiError("Failed to ingest biometric punches", "SERVER_ERROR", 500);
  }
}
