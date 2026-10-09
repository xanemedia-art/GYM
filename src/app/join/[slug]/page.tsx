import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PublicJoinClient from "./PublicJoinClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug, isActive: true },
    select: { businessName: true },
  });

  return {
    title: tenant ? `Join ${tenant.businessName} | Gate Self-Registration` : "Gym Self-Registration",
    description: "Scan, register, and start your fitness journey with our gym family.",
  };
}

export default async function PublicJoinPage({ params }: PageProps) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      businessName: true,
      slug: true,
      phone: true,
      email: true,
      address: true,
      membershipPlans: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          durationDays: true,
          basePrice: true,
          joiningFee: true,
        },
        orderBy: { durationDays: "asc" },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const serializedPlans = tenant.membershipPlans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    durationDays: p.durationDays,
    basePrice: Number(p.basePrice),
    joiningFee: Number(p.joiningFee),
  }));

  return (
    <PublicJoinClient
      tenant={{
        id: tenant.id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address as any,
      }}
      plans={serializedPlans}
    />
  );
}
