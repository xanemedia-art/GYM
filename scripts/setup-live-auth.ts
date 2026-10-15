import { UserRole } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🚀 Starting Live Production Authentication & Owner Setup...");

  const ownerEmail = "ben@befreefitness.in";
  const ownerName = "Ben (Mahender Chauhan)";
  const rawPassword = "Owner@befree";
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  // 1. Fetch all active tenants / branches
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, businessName: true },
  });

  if (tenants.length === 0) {
    throw new Error("No active gym branches found!");
  }

  console.log(`Found ${tenants.length} active gym branches.`);

  // 2. Identify or create the primary owner account
  let primaryOwner = await prisma.user.findFirst({
    where: { email: ownerEmail },
  });

  if (!primaryOwner) {
    // Check if legacy demo owner exists to re-use or migrate ID
    const legacyOwner = await prisma.user.findFirst({
      where: { email: "owner@fitzone.in" },
    });

    if (legacyOwner) {
      console.log(`Migrating legacy owner user (${legacyOwner.id}) to Ben (Mahender Chauhan)...`);
      primaryOwner = await prisma.user.update({
        where: { id: legacyOwner.id },
        data: {
          email: ownerEmail,
          fullName: ownerName,
          passwordHash: passwordHash,
          role: UserRole.GYM_OWNER,
          phone: "+919816012001",
          isActive: true,
        },
      });
    } else {
      console.log(`Creating primary owner account for ${ownerName}...`);
      primaryOwner = await prisma.user.create({
        data: {
          tenantId: tenants[0].id,
          email: ownerEmail,
          fullName: ownerName,
          passwordHash: passwordHash,
          role: UserRole.GYM_OWNER,
          phone: "+919816012001",
          isActive: true,
        },
      });
    }
  } else {
    // Update existing Ben user credentials
    primaryOwner = await prisma.user.update({
      where: { id: primaryOwner.id },
      data: {
        fullName: ownerName,
        passwordHash: passwordHash,
        role: UserRole.GYM_OWNER,
        isActive: true,
      },
    });
  }

  console.log(`✓ Primary owner established: ID ${primaryOwner.id} (${primaryOwner.email})`);

  // 3. Reassign any payments, refunds, and attendance records that reference other old demo users
  const demoUsers = await prisma.user.findMany({
    where: {
      email: { in: ["owner@fitzone.in", "reception@fitzone.in", "trainer@fitzone.in", "manager.fitzone-bengaluru@fitzone.in", "manager.fitzone-mumbai@fitzone.in"] },
      id: { not: primaryOwner.id },
    },
    select: { id: true, email: true },
  });

  const demoUserIds = demoUsers.map((u) => u.id);

  if (demoUserIds.length > 0) {
    console.log(`Reassigning historical records from ${demoUserIds.length} demo user instances...`);

    // Reassign collected payments
    const updatedPayments = await prisma.payment.updateMany({
      where: { collectedById: { in: demoUserIds } },
      data: { collectedById: primaryOwner.id },
    });
    console.log(`Reassigned ${updatedPayments.count} payments to primary owner.`);

    // Reassign processed refunds
    const updatedRefunds = await prisma.refund.updateMany({
      where: { processedById: { in: demoUserIds } },
      data: { processedById: primaryOwner.id },
    });
    console.log(`Reassigned ${updatedRefunds.count} refunds to primary owner.`);

    // Reassign verified attendance
    const updatedAttendance = await prisma.attendanceRecord.updateMany({
      where: { verifiedById: { in: demoUserIds } },
      data: { verifiedById: primaryOwner.id },
    });
    console.log(`Reassigned ${updatedAttendance.count} attendance verifications to primary owner.`);

    // Reassign audit logs
    const updatedAuditLogs = await prisma.auditLog.updateMany({
      where: { userId: { in: demoUserIds } },
      data: { userId: primaryOwner.id },
    });
    console.log(`Reassigned ${updatedAuditLogs.count} audit logs to primary owner.`);

    // Reassign assigned trainers on members
    await prisma.member.updateMany({
      where: { assignedTrainerId: { in: demoUserIds } },
      data: { assignedTrainerId: null },
    });

    // Reassign assigned trainers on memberships
    await prisma.membership.updateMany({
      where: { assignedTrainerId: { in: demoUserIds } },
      data: { assignedTrainerId: null },
    });

    // Reassign frozen memberships
    await prisma.membershipFreezeLog.updateMany({
      where: { frozenById: { in: demoUserIds } },
      data: { frozenById: primaryOwner.id },
    });

    // Safely delete remaining duplicate demo users
    const deleted = await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });
    console.log(`✓ Cleaned up ${deleted.count} legacy demo user records.`);
  }

  // 4. Ensure Ben's owner user is present for all gym branches
  // (Because prisma schema enforces unique([tenantId, email]))
  for (const tenant of tenants) {
    await prisma.user.upsert({
      where: {
        uq_tenant_user_email: {
          tenantId: tenant.id,
          email: ownerEmail,
        },
      },
      update: {
        fullName: ownerName,
        passwordHash: passwordHash,
        role: UserRole.GYM_OWNER,
        phone: "+919816012001",
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        email: ownerEmail,
        fullName: ownerName,
        passwordHash: passwordHash,
        role: UserRole.GYM_OWNER,
        phone: "+919816012001",
        isActive: true,
      },
    });
    console.log(`✓ Verified owner access for branch: ${tenant.businessName} (${tenant.slug})`);
  }

  console.log("==================================================");
  console.log("🎉 LIVE PRODUCTION AUTH SETUP COMPLETE!");
  console.log(`Owner Login:    ${ownerEmail}`);
  console.log(`Owner Name:     ${ownerName}`);
  console.log(`Owner Password: ${rawPassword}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Live setup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
