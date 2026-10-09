import React from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getCachedTenant } from "@/lib/tenant-cache";
import GateQrClient from "./GateQrClient";

export const metadata: Metadata = {
  title: "Entry Gate QR Poster | Gym Management OS",
  description: "Generate and print A4 entry gate posters for member self-onboarding",
};

export default async function GateQrPage() {
  const session = await getSession();

  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await getCachedTenant(session.tenantId);

  if (!tenant) {
    redirect("/login");
  }

  return (
    <GateQrClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: {
          businessName: tenant.businessName,
          slug: tenant.slug,
        },
      }}
      tenant={{
        id: tenant.id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        phone: tenant.phone || "",
        email: tenant.email || "",
        address: tenant.address as any,
      }}
    />
  );
}
