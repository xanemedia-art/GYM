import { PrismaClient, UserRole, GenderType, MemberStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create or update demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "fitzone-delhi" },
    update: {},
    create: {
      slug: "fitzone-delhi",
      businessName: "FitZone Elite Club",
      legalName: "FitZone Fitness Private Limited",
      gstin: "07AAAAF1234F1Z5",
      phone: "+919876543210",
      email: "contact@fitzone.in",
      address: {
        street: "Plot 42, Outer Ring Road",
        area: "Connaught Place",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
      },
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  // 2. Create tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      invoicePrefix: "FZ",
      enableGst: true,
      gstRatePercentage: 18.0,
      attendanceDuplicateWindowMin: 5,
      autoWhatsappBirthdays: true,
      autoWhatsappReminders: true,
      reminderScheduleDaysBefore: [7, 3, 1],
    },
  });

  // 3. Create staff users
  const defaultPasswordHash = await bcrypt.hash("Password@123", 12);

  const owner = await prisma.user.upsert({
    where: {
      uq_tenant_user_email: {
        tenantId: tenant.id,
        email: "owner@fitzone.in",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "owner@fitzone.in",
      passwordHash: defaultPasswordHash,
      fullName: "Vikram Malhotra",
      phone: "+919811001100",
      role: UserRole.GYM_OWNER,
    },
  });

  const frontDesk = await prisma.user.upsert({
    where: {
      uq_tenant_user_email: {
        tenantId: tenant.id,
        email: "reception@fitzone.in",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "reception@fitzone.in",
      passwordHash: defaultPasswordHash,
      fullName: "Anjali Sharma",
      phone: "+919822002200",
      role: UserRole.FRONT_DESK,
    },
  });

  const trainer = await prisma.user.upsert({
    where: {
      uq_tenant_user_email: {
        tenantId: tenant.id,
        email: "trainer@fitzone.in",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "trainer@fitzone.in",
      passwordHash: defaultPasswordHash,
      fullName: "Rohan Varma",
      phone: "+919833003300",
      role: UserRole.TRAINER,
    },
  });

  // 4. Create membership plans with versions
  const plansData = [
    { name: "Monthly Strength Plan", durationDays: 30, basePrice: 2500, joiningFee: 500 },
    { name: "Quarterly Transformation Plan", durationDays: 90, basePrice: 6500, joiningFee: 0 },
    { name: "Half-Yearly Elite Plan", durationDays: 180, basePrice: 11500, joiningFee: 0 },
    { name: "Annual Platinum Pro Plan", durationDays: 365, basePrice: 19999, joiningFee: 0 },
  ];

  for (const plan of plansData) {
    const createdPlan = await prisma.membershipPlan.create({
      data: {
        tenantId: tenant.id,
        name: plan.name,
        durationDays: plan.durationDays,
        basePrice: plan.basePrice,
        joiningFee: plan.joiningFee,
        versions: {
          create: {
            versionNumber: 1,
            durationDays: plan.durationDays,
            basePrice: plan.basePrice,
          },
        },
      },
    });
    console.log(`✓ Created plan: ${createdPlan.name}`);
  }

  // 5. Create demo members
  const memberA = await prisma.member.upsert({
    where: {
      uq_tenant_member_code: {
        tenantId: tenant.id,
        memberCode: "FZ-1001",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      memberCode: "FZ-1001",
      firstName: "Rahul",
      lastName: "Sharma",
      gender: GenderType.MALE,
      dateOfBirth: new Date("1996-09-16"), // Matches today's date for birthday demo!
      phone: "+919871112233",
      whatsappNumber: "+919871112233",
      email: "rahul.sharma@example.com",
      status: MemberStatus.ACTIVE,
      assignedTrainerId: trainer.id,
      emergencyContactName: "Neeta Sharma",
      emergencyContactPhone: "+919871112244",
      healthMetrics: { weightKg: 78, heightCm: 178, goal: "Muscle Gain" },
    },
  });

  const memberB = await prisma.member.upsert({
    where: {
      uq_tenant_member_code: {
        tenantId: tenant.id,
        memberCode: "FZ-1002",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      memberCode: "FZ-1002",
      firstName: "Priya",
      lastName: "Kapoor",
      gender: GenderType.FEMALE,
      dateOfBirth: new Date("1998-05-12"),
      phone: "+919872223344",
      whatsappNumber: "+919872223344",
      email: "priya.k@example.com",
      status: MemberStatus.EXPIRING_SOON,
      assignedTrainerId: trainer.id,
      healthMetrics: { weightKg: 56, heightCm: 165, goal: "Fat Loss & Mobility" },
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log(`Tenant: ${tenant.businessName} (${tenant.id})`);
  console.log(`Default accounts (Password: Password@123):`);
  console.log(` - Owner: ${owner.email}`);
  console.log(` - Front Desk: ${frontDesk.email}`);
  console.log(` - Trainer: ${trainer.email}`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
