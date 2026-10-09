import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BRANCHES } from "../src/data/branches";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting 6 Be Free Fitness Branches Database Seed...");

  const defaultPasswordHash = await bcrypt.hash("Password@123", 12);

  // Prefix mapping
  const prefixMap: Record<string, string> = {
    "dhalpur-kullu": "BFF-DH",
    "gandhinagar-kullu": "BFF-GN",
    "akhara-bazar-kullu": "BFF-AB",
    "bajaura-kullu": "BFF-BJ",
    "sudhowala-dehradun": "BFF-SD",
    "prem-nagar-dehradun": "BFF-PN",
  };

  const defaultPlans = [
    {
      name: "1-Day Mountain Pass",
      description: "Full floor & equipment access with steam & shower for 1 day.",
      durationDays: 1,
      basePrice: 300,
      joiningFee: 0,
    },
    {
      name: "Monthly Strength Pass",
      description: "Unlimited floor access, eSSL biometric entry & locker.",
      durationDays: 30,
      basePrice: 2200,
      joiningFee: 500,
    },
    {
      name: "3-Month Transformation Pass",
      description: "Cross-branch access, progress assessment & body recomposition plan.",
      durationDays: 90,
      basePrice: 5800,
      joiningFee: 0,
    },
    {
      name: "Annual Elite Pass",
      description: "All-access unrestricted pass to all 6 branches across Kullu & Dehradun.",
      durationDays: 365,
      basePrice: 16500,
      joiningFee: 0,
    },
  ];

  for (const branch of BRANCHES) {
    console.log(`Setting up branch: ${branch.name} (${branch.slug})`);

    const tenant = await prisma.tenant.upsert({
      where: { slug: branch.slug },
      update: {
        businessName: branch.name,
        phone: branch.phone,
        email: branch.email,
        address: {
          street: branch.address,
          landmark: branch.landmark,
          city: branch.city,
          state: branch.state,
          pincode: branch.pincode,
          region: branch.region,
        },
      },
      create: {
        slug: branch.slug,
        businessName: branch.name,
        legalName: `${branch.name} Pvt Ltd`,
        phone: branch.phone,
        email: branch.email,
        address: {
          street: branch.address,
          landmark: branch.landmark,
          city: branch.city,
          state: branch.state,
          pincode: branch.pincode,
          region: branch.region,
        },
        currency: "INR",
        timezone: "Asia/Kolkata",
        isActive: true,
      },
    });

    // Upsert tenant settings
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        invoicePrefix: prefixMap[branch.slug] || "BFF",
      },
      create: {
        tenantId: tenant.id,
        invoicePrefix: prefixMap[branch.slug] || "BFF",
        enableGst: true,
        gstRatePercentage: 18.0,
        attendanceDuplicateWindowMin: 5,
        autoWhatsappBirthdays: true,
        autoWhatsappReminders: true,
        reminderScheduleDaysBefore: [7, 3, 1],
      },
    });

    // Ensure staff login for each branch
    await prisma.user.upsert({
      where: {
        uq_tenant_user_email: {
          tenantId: tenant.id,
          email: "owner@fitzone.in",
        },
      },
      update: {
        passwordHash: defaultPasswordHash,
        fullName: "Vikram Malhotra (Owner)",
      },
      create: {
        tenantId: tenant.id,
        email: "owner@fitzone.in",
        passwordHash: defaultPasswordHash,
        fullName: "Vikram Malhotra (Owner)",
        phone: "+919816012001",
        role: UserRole.GYM_OWNER,
      },
    });

    // Seed default plans for this branch if none exist
    for (const plan of defaultPlans) {
      const existing = await prisma.membershipPlan.findFirst({
        where: { tenantId: tenant.id, name: plan.name },
      });
      if (!existing) {
        await prisma.membershipPlan.create({
          data: {
            tenantId: tenant.id,
            name: plan.name,
            description: plan.description,
            durationDays: plan.durationDays,
            basePrice: plan.basePrice,
            joiningFee: plan.joiningFee,
            isActive: true,
            versions: {
              create: {
                versionNumber: 1,
                durationDays: plan.durationDays,
                basePrice: plan.basePrice,
              },
            },
          },
        });
      }
    }
  }

  // Also update old demo tenant if it had slug 'be-free-fitness-delhi' or 'fitzone-delhi'
  const oldTenant = await prisma.tenant.findFirst({
    where: {
      slug: { in: ["fitzone-delhi", "be-free-fitness-delhi"] },
    },
  });
  if (oldTenant) {
    console.log(`Found legacy tenant ${oldTenant.slug}, renaming to match Be Free Fitness Central`);
    await prisma.tenant.update({
      where: { id: oldTenant.id },
      data: {
        businessName: "Be Free Fitness (Central Admin)",
      },
    });
  }

  console.log("✅ All 6 Be Free Fitness branches successfully seeded and configured!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
