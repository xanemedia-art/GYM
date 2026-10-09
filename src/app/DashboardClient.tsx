"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCards } from "@/components/dashboard/StatCards";
import { BirthdayWidget } from "@/components/dashboard/BirthdayWidget";
import { UpcomingMonthCard } from "@/components/dashboard/UpcomingMonthCard";
import { LiveAttendanceFeed } from "@/components/dashboard/LiveAttendanceFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PendingMembersSection } from "@/components/dashboard/PendingMembersSection";
import { OnboardMemberModal } from "@/components/members/OnboardMemberModal";
import { ManualCheckinModal } from "@/components/attendance/ManualCheckinModal";
import { RenewMembershipModal } from "@/components/members/RenewMembershipModal";
import { RefreshCw, Sparkles, QrCode } from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      businessName: string;
      slug: string;
    };
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [isManualPunchModalOpen, setIsManualPunchModalOpen] = useState(false);
  const [selectedMemberForActivation, setSelectedMemberForActivation] = useState<{
    id: string;
    fullName: string;
    memberCode: string;
    status: string;
  } | null>(null);

  const fetchStats = async (fresh = false) => {
    try {
      const url = fresh ? "/api/v1/dashboard/stats?fresh=true" : "/api/v1/dashboard/stats";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh metrics every 30 seconds
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Top Operational Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                Front-Desk Operations
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="h-3 w-3" />
                Live Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.tenant?.businessName || "Gym"} • Shift in progress ({user.fullName})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/gate-qr"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 border border-emerald-200/80 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <QrCode className="h-3.5 w-3.5 text-emerald-600" />
              <span>Gate QR Poster</span>
            </Link>

            <button
              onClick={() => fetchStats(true)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : "text-slate-400"}`} />
              <span>Sync Metrics</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Grid (Streamlined) */}
        <QuickActions
          onAddMember={() => setIsOnboardModalOpen(true)}
          onManualPunch={() => setIsManualPunchModalOpen(true)}
        />

        {/* Real-time Metric Cards */}
        {stats ? (
          <StatCards stats={stats} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 shadow-xs animate-pulse" />
            ))}
          </div>
        )}

        {/* Dedicated Pending Members Verification Section */}
        <PendingMembersSection
          pendingMembers={stats?.pendingMembers?.list || []}
          onActivatePass={(member) => setSelectedMemberForActivation(member)}
        />

        {/* Operational Feeds: Left = Attendance, Right = Birthdays & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveAttendanceFeed
              records={stats?.attendance?.recentCheckIns || []}
              onManualPunchClick={() => setIsManualPunchModalOpen(true)}
            />
          </div>

          <div className="space-y-6">
            <BirthdayWidget
              birthdays={stats?.birthdays || { today: [], tomorrow: [] }}
            />
            <UpcomingMonthCard
              upcomingMonth={stats?.upcomingMonth}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <OnboardMemberModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        onSuccess={fetchStats}
      />

      <ManualCheckinModal
        isOpen={isManualPunchModalOpen}
        onClose={() => setIsManualPunchModalOpen(false)}
        onSuccess={fetchStats}
      />

      <RenewMembershipModal
        isOpen={!!selectedMemberForActivation}
        member={selectedMemberForActivation}
        onClose={() => setSelectedMemberForActivation(null)}
        onSuccess={() => {
          setSelectedMemberForActivation(null);
          fetchStats(true);
        }}
      />
    </AppLayout>
  );
}
