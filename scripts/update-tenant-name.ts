import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log("Current tenants in database:", tenants.map((t) => ({ id: t.id, name: t.businessName, slug: t.slug })));
  
  // If there are tenants with FitZone, update to Be Free Fitness
  for (const t of tenants) {
    if (t.businessName.includes("FitZone")) {
      const updatedName = t.businessName.replace(/FitZone Elite Club|FitZone Elite|FitZone/g, "Be Free Fitness");
      const updatedSlug = t.slug.replace(/fitzone/g, "be-free-fitness");
      console.log(`Updating tenant ${t.id} from "${t.businessName}" to "${updatedName}" (slug: ${updatedSlug})`);
      await prisma.tenant.update({
        where: { id: t.id },
        data: {
          businessName: updatedName,
          legalName: t.legalName ? t.legalName.replace(/FitZone/g, "Be Free Fitness") : "Be Free Fitness Private Limited",
          slug: updatedSlug,
        },
      });
    }
  }

  const refreshed = await prisma.tenant.findMany();
  console.log("Updated tenants:", refreshed.map((t) => ({ id: t.id, name: t.businessName, slug: t.slug })));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
