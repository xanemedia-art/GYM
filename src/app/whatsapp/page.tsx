import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCachedTenant } from "@/lib/tenant-cache";
import WhatsAppClient from "./WhatsAppClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Desk & Automation | Gym OS",
  description: "Connect WhatsApp API, dispatch automated member alerts, and send custom messages",
};

export default async function WhatsAppPage() {
  const session = await getSession();

  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await getCachedTenant(session.tenantId);

  return (
    <WhatsAppClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant
          ? {
              businessName: tenant.businessName,
              slug: tenant.slug,
              phone: tenant.phone || "",
            }
          : undefined,
      }}
    />
  );
}
