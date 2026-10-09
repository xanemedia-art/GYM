import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCachedTenant } from "@/lib/tenant-cache";
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

  // Fetch cached tenant metadata (0ms in-memory lookup)
  const tenant = await getCachedTenant(session.tenantId);

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
