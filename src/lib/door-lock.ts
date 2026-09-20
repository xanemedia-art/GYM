import { prisma } from "@/lib/prisma";

export interface DoorLockSwipe {
  id: string;
  uid: string;
  cardNumber?: string;
  deviceName: string;
  deviceId?: string;
  tenantId: string;
  timestamp: number;
  rawTime: string;
}

// Persist in-memory ring buffer across hot reloads
const globalForSwipes = globalThis as unknown as {
  doorLockSwipes: DoorLockSwipe[];
};

if (!globalForSwipes.doorLockSwipes) {
  globalForSwipes.doorLockSwipes = [];
}

export function recordDoorLockSwipe(swipe: Omit<DoorLockSwipe, "id" | "timestamp">) {
  const newSwipe: DoorLockSwipe = {
    ...swipe,
    id: `swipe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  // Add to beginning and cap buffer at 30 items
  globalForSwipes.doorLockSwipes = [newSwipe, ...globalForSwipes.doorLockSwipes.slice(0, 29)];
  return newSwipe;
}

export function getRecentUnassignedSwipes(tenantId: string, maxAgeMinutes = 30): DoorLockSwipe[] {
  const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
  return globalForSwipes.doorLockSwipes.filter(
    (s) => s.tenantId === tenantId && s.timestamp >= cutoff
  );
}

export function removeSwipe(swipeId: string) {
  globalForSwipes.doorLockSwipes = globalForSwipes.doorLockSwipes.filter((s) => s.id !== swipeId);
}

/**
 * Assigns a door lock UID to a member profile:
 * 1. Updates Member.customFields with doorLockUid and cardNumber
 * 2. If a device exists for this tenant, upserts DeviceUser record
 */
export async function assignUidToMember(params: {
  tenantId: string;
  memberId: string;
  uid: string;
  cardNumber?: string;
  deviceId?: string;
}) {
  const { tenantId, memberId, uid, cardNumber, deviceId } = params;

  // 1. Fetch current member
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId, isDeleted: false },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  const existingCustomFields = (member.customFields as Record<string, any>) || {};
  const updatedCustomFields = {
    ...existingCustomFields,
    doorLockUid: uid,
    ...(cardNumber ? { cardNumber } : {}),
  };

  // 2. Update Member
  await prisma.member.update({
    where: { id: memberId },
    data: {
      customFields: updatedCustomFields,
    },
  });

  // 3. If device exists (either provided or tenant's primary device), link DeviceUser
  let targetDeviceId = deviceId;
  if (!targetDeviceId) {
    const primaryDevice = await prisma.device.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    if (primaryDevice) {
      targetDeviceId = primaryDevice.id;
    }
  }

  if (targetDeviceId) {
    const numericEnrollmentId = parseInt(uid.replace(/\D/g, ""), 10) || Math.floor(1000 + Math.random() * 9000);
    
    // Check if device user already exists
    const existingDeviceUser = await prisma.deviceUser.findFirst({
      where: {
        tenantId,
        memberId,
        deviceId: targetDeviceId,
      },
    });

    if (existingDeviceUser) {
      await prisma.deviceUser.update({
        where: { id: existingDeviceUser.id },
        data: {
          deviceEnrollmentId: numericEnrollmentId,
          cardNumber: cardNumber || uid,
          isSynced: true,
        },
      });
    } else {
      // Check if this enrollment ID is already used on this device
      const duplicateEnrollment = await prisma.deviceUser.findUnique({
        where: {
          uq_device_enrollment: {
            deviceId: targetDeviceId,
            deviceEnrollmentId: numericEnrollmentId,
          },
        },
      });

      const safeEnrollmentId = duplicateEnrollment
        ? Math.floor(20000 + Math.random() * 70000)
        : numericEnrollmentId;

      await prisma.deviceUser.create({
        data: {
          tenantId,
          memberId,
          deviceId: targetDeviceId,
          deviceEnrollmentId: safeEnrollmentId,
          cardNumber: cardNumber || uid,
          isSynced: true,
        },
      });
    }
  }

  return { success: true, memberId, uid };
}
