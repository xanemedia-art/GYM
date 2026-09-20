import React from "react";
import { notFound } from "next/navigation";
import { getBranchBySlug, BRANCHES } from "@/data/branches";
import { getWebsiteContent } from "@/lib/website-content";
import { BranchDetailClient } from "./BranchDetailClient";
import { Metadata } from "next";

export async function generateStaticParams() {
  const content = getWebsiteContent();
  return (content.branches || BRANCHES).map((b) => ({
    slug: b.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = getWebsiteContent();
  const branch = content.branches.find((b) => b.slug === slug) || getBranchBySlug(slug);
  if (!branch) return { title: "Branch Not Found | Be Free Fitness" };

  return {
    title: `${branch.name} (${branch.city}) | Be Free Fitness`,
    description: `${branch.tagline}. Located at ${branch.address}. Equipped with Olympic lifting lines, Finnish steam, and automated eSSL smart entry.`,
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = getWebsiteContent();
  const branch = content.branches.find((b) => b.slug === slug) || getBranchBySlug(slug);

  if (!branch) {
    notFound();
  }

  return <BranchDetailClient branch={branch} />;
}
