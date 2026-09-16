import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessName: true, slug: true },
  });

  return (
    <MembersClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant || undefined,
      }}
    />
  );
}
