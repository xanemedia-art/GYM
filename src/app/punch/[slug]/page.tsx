import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientPunchTerminal from "./ClientPunchTerminal";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { businessName: true },
  });

  return {
    title: tenant ? `Self Check-In | ${tenant.businessName}` : "Gym Attendance Check-In",
    description: "Quick self-punch attendance terminal for gym members",
  };
}

export default async function PunchPage({ params }: PageProps) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      businessName: true,
      logoUrl: true,
      phone: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  return <ClientPunchTerminal tenant={tenant} />;
}
