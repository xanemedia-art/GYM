import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FrontDeskKioskClient from "./FrontDeskKioskClient";

export const metadata = {
  title: "Front-Desk Check-In Kiosk | Be Free Fitness",
  description: "High-speed front-desk kiosk punch terminal for Be Free Fitness",
};

export default async function KioskPage() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { businessName: true, slug: true },
  });

  // Fetch today's recent punches for this tenant
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialPunches = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: session.tenantId,
      punchTime: { gte: today },
    },
    orderBy: { punchTime: "desc" },
    take: 15,
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          memberCode: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  return (
    <FrontDeskKioskClient
      user={{
        fullName: session.fullName,
        role: session.role,
        email: session.email,
        tenant: tenant || undefined,
      }}
      initialPunches={initialPunches.map((p) => ({
        id: p.id,
        memberId: p.memberId,
        memberName: `${p.member.firstName} ${p.member.lastName}`,
        memberCode: p.member.memberCode,
        phone: p.member.phone,
        punchTime: p.punchTime.toISOString(),
        verificationMode: p.verificationMode,
      }))}
    />
  );
}
