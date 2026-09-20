import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function GenericPunchPage() {
  // Find primary tenant
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  });

  if (tenant) {
    redirect(`/punch/${tenant.slug}`);
  }

  redirect("/login");
}
