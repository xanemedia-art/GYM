import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessName: true, slug: true },
  });

  return (
    <PlansClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant || undefined,
      }}
    />
  );
}
