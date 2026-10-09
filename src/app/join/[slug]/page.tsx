import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Dumbbell } from "lucide-react";
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

  // 1. Check if slug matches a Gym Tenant Branch (Gate QR Self-Registration)
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

  // 2. If it's a valid branch slug, render Gate QR Walk-in Self-Registration
  if (tenant) {
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

  // 3. Fallback when branch slug is invalid or not found
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
          <Dumbbell className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Gym Branch Not Found</h1>
          <p className="text-sm text-slate-400">
            The registration link or QR code you scanned is invalid or expired.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 text-left flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Please scan the official QR code displayed at your gym entrance or contact the front desk staff for assistance.
          </span>
        </div>
        <Link
          href="/login"
          className="inline-block text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Staff & Management Login &rarr;
        </Link>
      </div>
    </div>
  );
}
