"use client";

import React from "react";
import { Users, UserCheck, Fingerprint, Clock, AlertCircle } from "lucide-react";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 group flex flex-col justify-between"
          >
            {/* Top color indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${card.accentBar}`} />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight text-slate-900">{card.value}</div>
                <div className="mt-0.5 text-xs text-slate-500 font-medium">{card.subtitle}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${card.trendColor}`}>
                <TrendingUp className="h-3 w-3" />
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
