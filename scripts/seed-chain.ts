import { PrismaClient, UserRole, GenderType, MemberStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🏢 Seeding Multi-Branch Gym Chain...");
  const defaultPasswordHash = await bcrypt.hash("Password@123", 12);

  // 1. Bengaluru Branch
  const blrTenant = await prisma.tenant.upsert({
    where: { slug: "be-free-fitness-bengaluru" },
    update: {},
    create: {
      slug: "be-free-fitness-bengaluru",
      businessName: "Be Free Fitness Prime (Indiranagar)",
      legalName: "Be Free Fitness South Private Limited",
      gstin: "29AAAAF1234F1Z3",
      phone: "+919880011223",
      email: "bengaluru@befreefitness.in",
      address: {
        street: "100 Feet Road, HAL 2nd Stage",
        area: "Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      },
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: blrTenant.id },
    update: {},
    create: {
      tenantId: blrTenant.id,
      invoicePrefix: "BFF-BLR",
      enableGst: true,
      gstRatePercentage: 18.0,
      attendanceDuplicateWindowMin: 5,
      autoWhatsappBirthdays: true,
      autoWhatsappReminders: true,
      reminderScheduleDaysBefore: [7, 3, 1],
    },
  });

  // 2. Mumbai Branch
  const bomTenant = await prisma.tenant.upsert({
    where: { slug: "be-free-fitness-mumbai" },
    update: {},
    create: {
      slug: "be-free-fitness-mumbai",
      businessName: "Be Free Fitness Signature (Bandra)",
      legalName: "Be Free Fitness West Private Limited",
      gstin: "27AAAAF1234F1Z8",
      phone: "+919820055443",
      email: "mumbai@befreefitness.in",
      address: {
        street: "Hill Road, Near Bandra Station",
        area: "Bandra West",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400050",
      },
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: bomTenant.id },
    update: {},
    create: {
      tenantId: bomTenant.id,
      invoicePrefix: "BFF-BOM",
      enableGst: true,
      gstRatePercentage: 18.0,
      attendanceDuplicateWindowMin: 5,
      autoWhatsappBirthdays: true,
      autoWhatsappReminders: true,
      reminderScheduleDaysBefore: [7, 3, 1],
    },
  });

  // Add staff & plans for both branches
  const branches = [blrTenant, bomTenant];

  for (const branch of branches) {
    // Owner access in branch
    await prisma.user.upsert({
      where: {
        uq_tenant_user_email: {
          tenantId: branch.id,
          email: "owner@fitzone.in",
        },
      },
      update: {},
      create: {
        tenantId: branch.id,
        email: "owner@fitzone.in",
        passwordHash: defaultPasswordHash,
        fullName: "Vikram Malhotra",
        phone: "+919811001100",
        role: UserRole.GYM_OWNER,
      },
    });

    // Branch manager
    await prisma.user.upsert({
      where: {
        uq_tenant_user_email: {
          tenantId: branch.id,
          email: `manager.${branch.slug}@fitzone.in`,
        },
      },
      update: {},
      create: {
        tenantId: branch.id,
        email: `manager.${branch.slug}@fitzone.in`,
        passwordHash: defaultPasswordHash,
        fullName: branch.slug.includes("bengaluru") ? "Karthik Raja" : "Aditya Deshmukh",
        phone: "+919844001122",
        role: UserRole.MANAGER,
      },
    });

    // Check if plans exist
    const planCount = await prisma.membershipPlan.count({ where: { tenantId: branch.id } });
    if (planCount === 0) {
      const plans = [
        { name: "Monthly Strength Plan", durationDays: 30, basePrice: 2800, joiningFee: 500 },
        { name: "Quarterly Transformation", durationDays: 90, basePrice: 7200, joiningFee: 0 },
        { name: "Annual Pro Elite", durationDays: 365, basePrice: 21999, joiningFee: 0 },
      ];

      for (const p of plans) {
        await prisma.membershipPlan.create({
          data: {
            tenantId: branch.id,
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
    }

    // Add demo members
    const memberCount = await prisma.member.count({ where: { tenantId: branch.id } });
    if (memberCount === 0) {
      await prisma.member.create({
        data: {
          tenantId: branch.id,
          memberCode: `${branch.slug.includes("bengaluru") ? "BLR" : "BOM"}-1001`,
          firstName: branch.slug.includes("bengaluru") ? "Arjun" : "Karan",
          lastName: branch.slug.includes("bengaluru") ? "Nair" : "Singhania",
          gender: GenderType.MALE,
          dateOfBirth: new Date("1995-04-18"),
          phone: branch.slug.includes("bengaluru") ? "+919888111222" : "+919822333444",
          whatsappNumber: branch.slug.includes("bengaluru") ? "+919888111222" : "+919822333444",
          email: branch.slug.includes("bengaluru") ? "arjun.nair@example.com" : "karan.s@example.com",
          status: MemberStatus.ACTIVE,
          emergencyContactName: "Family",
          emergencyContactPhone: "+919888111999",
        },
      });
    }

    console.log(`✓ Seeded branch: ${branch.businessName}`);
  }

  console.log("✅ All gym chain branches ready!");
}

main()
  .catch((e) => {
    console.error("Error seeding chain:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
