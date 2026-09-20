import { prisma } from "../src/lib/prisma";
import { recordDoorLockSwipe, getRecentUnassignedSwipes, assignUidToMember } from "../src/lib/door-lock";

async function main() {
  console.log("=== 1. Testing Door Lock Swipes Buffer ===");
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
    select: { id: true, slug: true, businessName: true },
  });

  if (!tenant) {
    console.error("No active tenant found");
    return;
  }
  console.log(`Found tenant: ${tenant.businessName} (${tenant.slug}, id: ${tenant.id})`);

  // Simulate an unmapped swipe from an eSSL machine
  const testUid = "0008432190";
  const swipe = recordDoorLockSwipe({
    uid: testUid,
    deviceName: "Main Entrance Turnstile",
    tenantId: tenant.id,
    rawTime: new Date().toISOString(),
  });
  console.log("Recorded simulated door lock swipe:", swipe);

  // Retrieve unassigned swipes
  const swipes = getRecentUnassignedSwipes(tenant.id);
  console.log(`Retrieved ${swipes.length} recent unassigned swipes for tenant`);
  if (swipes.some((s) => s.uid === testUid)) {
    console.log("✓ Swipe buffer correctly stores and retrieves UIDs!");
  } else {
    console.error("✗ Swipe buffer did not find test UID");
  }

  // Find a test member to test UID assignment
  const member = await prisma.member.findFirst({
    where: { tenantId: tenant.id, isDeleted: false },
    select: { id: true, firstName: true, lastName: true, phone: true, memberCode: true, customFields: true },
  });

  if (member) {
    console.log(`Testing UID assignment to member: ${member.firstName} ${member.lastName} (${member.memberCode})`);
    await assignUidToMember({
      tenantId: tenant.id,
      memberId: member.id,
      uid: testUid,
    });

    const updatedMember = await prisma.member.findUnique({
      where: { id: member.id },
      select: { customFields: true },
    });
    console.log("Updated member customFields:", updatedMember?.customFields);
    const custom = updatedMember?.customFields as Record<string, any>;
    if (custom?.doorLockUid === testUid) {
      console.log("✓ Door lock UID successfully bound to member profile!");
    } else {
      console.error("✗ Door lock UID not found in member customFields");
    }

    console.log("\n=== 2. Testing Client Self-Punch Logic ===");
    console.log(`Member phone: ${member.phone}, code: ${member.memberCode}`);
    console.log(`Client punch URL: http://localhost:3000/punch/${tenant.slug}`);
  }

  console.log("\n=== Verification Script Complete ===");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
