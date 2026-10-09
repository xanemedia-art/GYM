import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true,
      businessName: true,
      slug: true,
      phone: true,
    },
  });

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
              phone: tenant.phone,
            }
          : undefined,
      }}
    />
  );
}
