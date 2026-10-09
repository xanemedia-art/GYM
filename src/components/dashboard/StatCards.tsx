"use client";

import React from "react";
import { Users, UserCheck, Fingerprint, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface StatCardsProps {
  stats: {
    members: {
      total: number;
      active: number;
      expiringSoon: number;
      expired: number;
    };
    pendingMembers?: {
      count: number;
      list: any[];
    };
    attendance: {
      todayCheckIns: number;
      recentCheckIns: any[];
    };
  };
}

export function StatCards({ stats }: StatCardsProps) {
  const pendingCount = stats.pendingMembers?.count || 0;

  const cards = [
    {
      title: "Active Members",
      value: stats.members.active,
      subtitle: `${stats.members.total} Total Registered`,
      icon: Users,
      trend: `${stats.members.expiringSoon} Expiring Soon`,
      trendColor: stats.members.expiringSoon > 0 ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50",
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accentBar: "bg-emerald-500",
    },
    {
      title: "Pending Plan Allocation",
      value: pendingCount,
      subtitle: "Gate Walk-ins & Inquiries",
      icon: UserCheck,
      trend: pendingCount > 0 ? `${pendingCount} Needs Verification` : "All Verified",
      trendColor: pendingCount > 0 ? "text-amber-700 bg-amber-50 font-bold" : "text-emerald-700 bg-emerald-50",
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      accentBar: "bg-amber-500",
    },
    {
      title: "Today's Check-ins",
      value: stats.attendance.todayCheckIns,
      subtitle: "Biometric & Manual",
      icon: Fingerprint,
      trend: "Peak: 6 PM - 9 PM",
      trendColor: "text-slate-600 bg-slate-100",
      iconBg: "bg-purple-50 text-purple-600 border-purple-100",
      accentBar: "bg-purple-500",
    },
    {
      title: "Expiring Passes",
      value: stats.members.expiringSoon,
      subtitle: "Passes Expiring Within 7 Days",
      icon: Clock,
      trend: stats.members.expiringSoon > 0 ? "WhatsApp Reminders Active" : "No Urgent Expiries",
      trendColor: stats.members.expiringSoon > 0 ? "text-rose-700 bg-rose-50" : "text-emerald-700 bg-emerald-50",
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
      accentBar: "bg-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs transition-all hover:shadow-md hover:border-slate-300 group flex flex-col justify-between"
          >
            {/* Top color indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${card.accentBar}`} />

            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`h-7 w-7 sm:h-9 sm:w-9 rounded-xl border flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>

              <div className="mt-2 sm:mt-3">
                <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-mono">
                  {card.value}
                </div>
                <div className="mt-0.5 text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                  {card.subtitle}
                </div>
              </div>
            </div>

            <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full truncate max-w-full ${card.trendColor}`}>
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                <span className="truncate">{card.trend}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
