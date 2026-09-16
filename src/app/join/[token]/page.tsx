import React from "react";
import ClientOnboardClient from "./ClientOnboardClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Self-Registration | Gym Management Portal",
  description: "Complete your gym membership self-registration and choose your plan.",
};

export default async function ClientJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ClientOnboardClient token={token} />;
}
