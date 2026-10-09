import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCachedTenant } from "@/lib/tenant-cache";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await getCachedTenant(session.tenantId);

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
