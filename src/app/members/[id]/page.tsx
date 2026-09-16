import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MemberDetailClient from "./MemberDetailClient";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessName: true, slug: true },
  });

  return (
    <MemberDetailClient
      memberId={id}
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant || undefined,
      }}
    />
  );
}
