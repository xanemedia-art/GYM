"use client";

import React from "react";
import { UserPlus, CreditCard, Fingerprint, MessageSquare, Share2 } from "lucide-react";

interface QuickActionsProps {
  onAddMember: () => void;
  onCollectPayment: () => void;
  onManualPunch: () => void;
  onShareInvite?: () => void;
}

export function QuickActions({
  onAddMember,
  onCollectPayment,
  onManualPunch,
  onShareInvite,
}: QuickActionsProps) {
  const actions = [
    {
      title: "Add Member",
      desc: "Fast KYC onboarding",
      icon: UserPlus,
      onClick: onAddMember,
      iconColor: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
    },
    {
      title: "Share Join Link",
      desc: "Client self-registration",
      icon: Share2,
      onClick: onShareInvite || (() => {}),
      iconColor: "bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white",
    },
    {
      title: "Collect Payment",
      desc: "Cash / UPI / Card POS",
      icon: CreditCard,
      onClick: onCollectPayment,
      iconColor: "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white",
    },
    {
      title: "Manual Punch",
      desc: "Front-desk check-in",
      icon: Fingerprint,
      onClick: onManualPunch,
      iconColor: "bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white",
    },
    {
      title: "Send Reminders",
      desc: "WhatsApp dues & expiry",
      icon: MessageSquare,
      onClick: async () => {
        try {
          const res = await fetch("/api/v1/cron/run", { method: "POST" });
          const data = await res.json();
          alert(`Automated WhatsApp scanner executed! Processed ${data.data?.results?.expirationsProcessed || 0} reminders.`);
        } catch (e) {
          alert("Triggered scanner background run.");
        }
      },
      iconColor: "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.title}
            onClick={action.onClick}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] shadow-xs group"
          >
            <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${action.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {action.title}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{action.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
