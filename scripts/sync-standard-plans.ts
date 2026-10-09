import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const STANDARDIZED_PLANS = [
  {
    name: "Daily Workout Pass",
    durationDays: 1,
    basePrice: 200,
    joiningFee: 0,
    description: "1-Day athletic floor access, locker & shower facilities. Ideal for day guests & travelers.",
  },
  {
    name: "Monthly Strength Plan",
    durationDays: 30,
    basePrice: 2000,
    joiningFee: 0,
    description: "30 Days unlimited gym floor access, eSSL smart biometric access, locker room & certified floor trainer guidance.",
  },
  {
    name: "Quarterly Transformation Plan",
    durationDays: 90,
    basePrice: 5000,
    joiningFee: 0,
    description: "90 Days dedicated body recomposition cycle, customized split workout guide & cross-branch training access.",
  },
  {
    name: "Semiannual Elite Plan",
    durationDays: 180,
    basePrice: 8000,
    joiningFee: 0,
    description: "180 Days athletic conditioning, regular progress reviews, priority locker access & clinical fitness assessment.",
  },
  {
    name: "Yearly Platinum VIP Plan",
    durationDays: 365,
    basePrice: 14000,
    joiningFee: 0,
    description: "365 Days complete all-access pass across all branches, 30-day membership freeze privilege, custom nutrition guide & VIP perks.",
  },
];

async function main() {
  console.log("⚡ Synchronizing standardized gym membership plans across all branches...");

  const tenants = await prisma.tenant.findMany({
    select: { id: true, businessName: true, slug: true },
  });

  console.log(`Found ${tenants.length} tenants/branches in system.`);

  const validDurations = STANDARDIZED_PLANS.map((p) => p.durationDays);

  for (const tenant of tenants) {
    console.log(`\n🏢 Updating plans for: ${tenant.businessName} (${tenant.slug})`);

    // Fetch existing plans for this tenant
    const existingPlans = await prisma.membershipPlan.findMany({
      where: { tenantId: tenant.id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    // 1. Deactivate non-standard plans
    for (const ep of existingPlans) {
      if (!validDurations.includes(ep.durationDays) && ep.isActive) {
        await prisma.membershipPlan.update({
          where: { id: ep.id },
          data: { isActive: false },
        });
        console.log(`  Deactivated non-standard plan: ${ep.name} (${ep.durationDays} days)`);
      }
    }

    // 2. Upsert each standardized plan
    for (const std of STANDARDIZED_PLANS) {
      const match = existingPlans.find((p) => p.durationDays === std.durationDays);

      if (match) {
        // Update existing plan
        await prisma.membershipPlan.update({
          where: { id: match.id },
          data: {
            name: std.name,
            basePrice: std.basePrice,
            joiningFee: std.joiningFee,
            description: std.description,
            isActive: true,
          },
        });

        const latestVersion = match.versions[0];
        if (!latestVersion) {
          await prisma.membershipPlanVersion.create({
            data: {
              planId: match.id,
              versionNumber: 1,
              durationDays: std.durationDays,
              basePrice: std.basePrice,
            },
          });
        } else if (Number(latestVersion.basePrice) !== std.basePrice) {
          await prisma.membershipPlanVersion.create({
            data: {
              planId: match.id,
              versionNumber: latestVersion.versionNumber + 1,
              durationDays: std.durationDays,
              basePrice: std.basePrice,
            },
          });
        }

        console.log(`  ✓ Updated ${std.name} (${std.durationDays}d) -> ₹${std.basePrice}`);
      } else {
        // Create new plan
        const newPlan = await prisma.membershipPlan.create({
          data: {
            tenantId: tenant.id,
            name: std.name,
            durationDays: std.durationDays,
            basePrice: std.basePrice,
            joiningFee: std.joiningFee,
            description: std.description,
            isActive: true,
            versions: {
              create: {
                versionNumber: 1,
                durationDays: std.durationDays,
                basePrice: std.basePrice,
              },
            },
          },
        });
        console.log(`  + Created ${newPlan.name} (${std.durationDays}d) -> ₹${std.basePrice}`);
      }
    }
  }

  console.log("\n✅ All gym branches successfully synchronized with standard plans!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Plan synchronization failed:", err);
  process.exit(1);
});
