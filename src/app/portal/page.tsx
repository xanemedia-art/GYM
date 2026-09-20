import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "../DashboardClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Front-Desk Operations | Be Free Fitness Management OS",
  description: "Internal front-desk management, attendance, billing, and member operations",
};

export default async function PortalDashboardPage() {
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
