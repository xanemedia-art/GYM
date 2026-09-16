"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ManualCheckinModal } from "@/components/attendance/ManualCheckinModal";
import { Fingerprint, Clock, CheckCircle2, AlertTriangle, XCircle, RefreshCw, UserCheck, Users, Activity } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";

interface AttendanceClientProps {
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

export default function AttendanceClient({ user }: AttendanceClientProps) {
  const [data, setData] = useState<any>({ totalCheckIns: 0, estimatedActiveInside: 0, recentPunches: [] });
  const [loading, setLoading] = useState(true);
  const [isManualPunchOpen, setIsManualPunchOpen] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/attendance/today");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 15000); // 15-second refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header & Live Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Live Attendance & Access</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Turnstiles Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time biometric feed from ESSL hardware and front-desk reception overrides
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAttendance}
              title="Refresh attendance stream"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
            <button
              onClick={() => setIsManualPunchOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Manual Punch</span>
            </button>
          </div>
        </div>

        {/* Headcount Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated On Floor</div>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">{data.estimatedActiveInside} Members</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span>Inside gym based on recent 90-minute activity window</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300" />
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Check-Ins Today</div>
              <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200/60">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{data.totalCheckIns} Punches</div>
            <div className="text-xs text-slate-400 mt-1">Includes fingerprint, facial recognition, RFID, and manual overrides</div>
          </div>
        </div>

        {/* Attendance Log Table */}
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">Today's Turnstile Punch Stream</div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {data.recentPunches?.length || 0} Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Time</th>
                  <th className="px-5 py-3.5 font-semibold">Member</th>
                  <th className="px-5 py-3.5 font-semibold">Action</th>
                  <th className="px-5 py-3.5 font-semibold">Device / Gateway</th>
                  <th className="px-5 py-3.5 font-semibold">Membership Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentPunches && data.recentPunches.length > 0 ? (
                  data.recentPunches.map((punch: any) => (
                    <tr key={punch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-bold">
                        {formatTime(punch.punchTime)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {punch.member?.firstName} {punch.member?.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{punch.member?.memberCode}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            punch.punchType === "CHECK_IN"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {punch.punchType === "CHECK_IN" ? "🟢 Check In" : "🟠 Check Out"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 capitalize text-slate-700 font-medium">
                        {punch.device?.deviceName || punch.verificationMode.toLowerCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        {punch.member?.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            {punch.member?.status || "Inactive"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      {loading ? "Loading attendance stream..." : "No attendance punches recorded yet today."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ManualCheckinModal
        isOpen={isManualPunchOpen}
        onClose={() => setIsManualPunchOpen(false)}
        onSuccess={fetchAttendance}
      />
    </AppLayout>
  );
}
