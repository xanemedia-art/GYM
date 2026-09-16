import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { settings: true },
  });

  return (
    <SettingsClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant
          ? {
              id: tenant.id,
              businessName: tenant.businessName,
              legalName: tenant.legalName || "",
              gstin: tenant.gstin || "",
              phone: tenant.phone,
              email: tenant.email,
              slug: tenant.slug,
              settings: tenant.settings
                ? {
                    ...tenant.settings,
                    gstRatePercentage: Number(tenant.settings.gstRatePercentage),
                    createdAt: tenant.settings.createdAt.toISOString(),
                    updatedAt: tenant.settings.updatedAt.toISOString(),
                  }
                : undefined,
            }
          : undefined,
      }}
    />
  );
}
