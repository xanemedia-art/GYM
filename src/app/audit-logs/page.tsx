import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import AuditLogsClient from "./AuditLogsClient";

export default async function AuditLogsPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  if (!hasPermission(session.role, "VIEW_FINANCIAL_REPORTS")) {
    redirect("/");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessName: true, slug: true },
  });

  return (
    <AuditLogsClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant || undefined,
      }}
    />
  );
}
