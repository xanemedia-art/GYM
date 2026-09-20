import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WebsiteCmsClient from "./WebsiteCmsClient";

export default async function WebsiteCmsPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  // Only owners, admins, or managers can access Website CMS
  if (
    session.role !== "GYM_OWNER" &&
    session.role !== "SUPER_ADMIN" &&
    session.role !== "MANAGER"
  ) {
    redirect("/portal");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessName: true, slug: true },
  });

  return (
    <WebsiteCmsClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant || undefined,
      }}
    />
  );
}
