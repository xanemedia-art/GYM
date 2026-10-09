import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCachedTenant } from "@/lib/tenant-cache";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await getCachedTenant(session.tenantId);

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading calendar...</div>}>
      <CalendarClient
        user={{
          fullName: session.fullName,
          role: session.role,
          email: session.email,
          tenant: tenant || undefined,
        }}
      />
    </Suspense>
  );
}
