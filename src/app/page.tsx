import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || !session.tenantId) {
    redirect("/login");
  }

  // Fetch initial dashboard stats server-side
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      businessName: true,
      slug: true,
      currency: true,
      settings: true,
    },
  });

  return (
    <DashboardClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant
          ? {
              businessName: tenant.businessName,
              slug: tenant.slug,
            }
          : undefined,
      }}
    />
  );
}
