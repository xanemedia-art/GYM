"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { ManualCheckinModal } from "@/components/attendance/ManualCheckinModal";
import { ClientPunchQrModal } from "@/components/attendance/ClientPunchQrModal";
import { AssignDoorLockUidModal } from "@/components/attendance/AssignDoorLockUidModal";
import {
  Fingerprint,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  UserCheck,
  Users,
  Activity,
  QrCode,
  Copy,
  Check,
  Send,
  ExternalLink,
  Cpu,
  Search,
  Sparkles,
  Dumbbell,
  LogOut,
  Maximize2,
  Radio,
  Loader2,
} from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";

interface AttendanceClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      id?: string;
      businessName: string;
      slug: string;
    };
  };
}

export default function AttendanceClient({ user }: AttendanceClientProps) {
  const [data, setData] = useState<any>({ totalCheckIns: 0, estimatedActiveInside: 0, recentPunches: [] });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isManualPunchOpen, setIsManualPunchOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [assignUidModal, setAssignUidModal] = useState<{
    isOpen: boolean;
    uid: string;
    deviceName?: string;
    swipeId?: string;
  }>({
    isOpen: false,
    uid: "",
  });

  // Copied link toast state
  const [copiedLink, setCopiedLink] = useState(false);

  // Recent eSSL unmapped swipes
  const [recentSwipes, setRecentSwipes] = useState<any[]>([]);

  // Inline Fast Punch state
  const [punchSearch, setPunchSearch] = useState("");
  const [matchingMembers, setMatchingMembers] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [punchingMemberId, setPunchingMemberId] = useState<string | null>(null);
  const [punchFeedback, setPunchFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const tenantSlug = user?.tenant?.slug || "be-free-fitness";
  const gymName = user?.tenant?.businessName || "Be Free Fitness";
  const punchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/punch/${tenantSlug}`
    : `https://gym.com/punch/${tenantSlug}`;

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

  const fetchRecentSwipes = async () => {
    try {
      const res = await fetch("/api/v1/integrations/essl/recent-swipes");
      const json = await res.json();
      if (json.success && json.data) {
        setRecentSwipes(json.data.swipes || []);
      }
    } catch (err) {
      console.error("Failed to load door lock swipes:", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchRecentSwipes();
    const interval = setInterval(() => {
      fetchAttendance();
      fetchRecentSwipes();
    }, 10000); // 10-second live refresh
    return () => clearInterval(interval);
  }, []);

  // Search members as owner types in quick punch bar
  useEffect(() => {
    if (!punchSearch.trim() || punchSearch.length < 2) {
      setMatchingMembers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMembers(true);
      try {
        const res = await fetch(`/api/v1/members?limit=5&search=${encodeURIComponent(punchSearch.trim())}`);
        const json = await res.json();
        if (json.success && json.data) {
          setMatchingMembers(json.data);
        }
      } catch (e) {
        console.error("Member search error:", e);
      } finally {
        setIsSearchingMembers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [punchSearch]);

  const handleQuickPunch = async (memberId: string, punchType: "CHECK_IN" | "CHECK_OUT", memberName: string) => {
    setPunchingMemberId(memberId);
    setPunchFeedback(null);

    try {
      const res = await fetch("/api/v1/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          punchType,
          verificationMode: "FRONT_DESK_QUICK",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to record punch");
      }

      setPunchFeedback({
        type: "success",
        message: `✅ ${memberName} successfully ${punchType === "CHECK_IN" ? "checked in" : "checked out"}!`,
      });

      setPunchSearch("");
      setMatchingMembers([]);
      fetchAttendance();

      setTimeout(() => setPunchFeedback(null), 5000);
    } catch (err: any) {
      setPunchFeedback({
        type: "error",
        message: err.message || "Failed to record punch",
      });
    } finally {
      setPunchingMemberId(null);
    }
  };

  const handleCopyPunchLink = () => {
    navigator.clipboard.writeText(punchUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi! Mark your daily attendance at ${gymName} quickly using our self check-in link:\n\n${punchUrl}\n\nJust enter your mobile number and tap Punch In!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const latestUnmappedSwipe = recentSwipes[0];

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header & Live Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                Attendance & Access Hub
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified attendance for {gymName}: Front-desk punch, client mobile self-punch & eSSL door lock
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchAttendance();
                fetchRecentSwipes();
              }}
              title="Refresh attendance stream"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            </button>

            <Link
              href="/kiosk"
              target="_blank"
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <Maximize2 className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Tablet Kiosk Mode</span>
            </Link>

            <button
              onClick={() => setIsManualPunchOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Full Manual Form</span>
            </button>
          </div>
        </div>

        {/* 1. Fast Inline Quick Punch Bar */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Quick Reception Punch
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Type member name, phone or code</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search member to punch In / Out (e.g. Rahul, 9876543210, M-1001)..."
              value={punchSearch}
              onChange={(e) => setPunchSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
            />
            {isSearchingMembers && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 animate-spin" />
            )}
          </div>

          {/* Quick Match Results Dropdown */}
          {matchingMembers.length > 0 && (
            <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden animate-in fade-in">
              {matchingMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {m.firstName} {m.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {m.memberCode} • {m.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={punchingMemberId === m.id}
                      onClick={() => handleQuickPunch(m.id, "CHECK_IN", `${m.firstName} ${m.lastName}`)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Dumbbell className="h-3 w-3" />
                      <span>Punch In</span>
                    </button>
                    <button
                      disabled={punchingMemberId === m.id}
                      onClick={() => handleQuickPunch(m.id, "CHECK_OUT", `${m.firstName} ${m.lastName}`)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Punch Out</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Punch Feedback Alert */}
          {punchFeedback && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
                punchFeedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              <span>{punchFeedback.message}</span>
              <button
                onClick={() => setPunchFeedback(null)}
                className="text-xs font-bold underline ml-2 text-slate-500 hover:text-slate-800"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 2. Live Door Lock Detected Card / Alert (When unmapped card swiped) */}
        {latestUnmappedSwipe && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 p-4 shadow-sm animate-in slide-in-from-top-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-200">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-black text-amber-900 flex items-center gap-2">
                  <span>New eSSL Door Lock Card Swiped!</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800 font-mono font-bold">
                    UID: {latestUnmappedSwipe.uid}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Swiped at {latestUnmappedSwipe.deviceName || "Entrance Lock"}. Connect this card to a member's profile for automatic access!
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                setAssignUidModal({
                  isOpen: true,
                  uid: latestUnmappedSwipe.uid,
                  deviceName: latestUnmappedSwipe.deviceName,
                  swipeId: latestUnmappedSwipe.id,
                })
              }
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm shadow-amber-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-95 shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>Connect to Member</span>
            </button>
          </div>
        )}

        {/* 3. Client Self-Punch Shortcut Card & eSSL Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client Self-Punch Portal Card (Spans 2 cols) */}
          <div className="md:col-span-2 rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                    📱
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Client Mobile Self-Punch Shortcut
                    </h3>
                    <p className="text-xs text-slate-500">
                      Share link or print desk QR so gym members can check in from their phones
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Ready to Share
                </span>
              </div>

              {/* URL Display */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600 break-all gap-2">
                <span className="truncate">{punchUrl}</span>
                <button
                  onClick={handleCopyPunchLink}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-sans text-xs font-semibold shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={handleShareWhatsApp}
                className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Send className="h-3.5 w-3.5 text-emerald-600" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <QrCode className="h-3.5 w-3.5 text-slate-600" />
                <span>Print Front-Desk QR</span>
              </button>

              <Link
                href={`/punch/${tenantSlug}`}
                target="_blank"
                className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all"
              >
                <span>Open Portal</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* eSSL Biometric Door Lock Card */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">eSSL Door Lock</h3>
                  <p className="text-[11px] text-slate-500">Biometric & RFID status</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hardware Link Active</span>
                </div>
                <p className="text-[10px] text-emerald-700 leading-snug">
                  eSSL ADMS cloud push connected. Automatic punches enabled.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3">
              <Link
                href="/devices"
                className="w-full py-2 rounded-xl text-center text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 block transition-all"
              >
                Manage Door Lock Terminals →
              </Link>
            </div>
          </div>
        </div>

        {/* 4. Headcount Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
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
              <span>Active inside gym based on recent 90-minute window</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300" />
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Punches Today</div>
              <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200/60">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{data.totalCheckIns} Punches</div>
            <div className="text-xs text-slate-400 mt-1">
              Includes eSSL door lock, mobile client self-punches & front desk
            </div>
          </div>
        </div>

        {/* 5. Today's Punch Stream Table */}
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Today's Attendance Punch Stream</div>
              <p className="text-[11px] text-slate-500">Live check-ins and check-outs across all channels</p>
            </div>
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
                  <th className="px-5 py-3.5 font-semibold">Source / Device</th>
                  <th className="px-5 py-3.5 font-semibold">Membership Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentPunches && data.recentPunches.length > 0 ? (
                  data.recentPunches.map((punch: any) => {
                    const mode = punch.verificationMode || "MANUAL";
                    let modeBadge = "Front Desk Override";
                    if (mode === "CLIENT_PORTAL") modeBadge = "📱 Mobile Self-Punch";
                    else if (mode === "ESSL_DOOR_LOCK" || punch.device) modeBadge = "🔒 eSSL Door Lock";
                    else if (mode === "FRONT_DESK_QUICK") modeBadge = "⚡ Reception Quick Punch";

                    return (
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
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-slate-700">{modeBadge}</span>
                          {punch.device?.deviceName && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {punch.device.deviceName}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Active Member</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                      No turnstile punches recorded yet today. Punches will appear here in real-time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Checkin Modal (Full Form) */}
      <ManualCheckinModal
        isOpen={isManualPunchOpen}
        onClose={() => setIsManualPunchOpen(false)}
        onSuccess={fetchAttendance}
      />

      {/* Front Desk QR Poster Modal */}
      <ClientPunchQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        gymName={gymName}
        slug={tenantSlug}
      />

      {/* Assign eSSL Door Lock UID Modal */}
      <AssignDoorLockUidModal
        isOpen={assignUidModal.isOpen}
        onClose={() => setAssignUidModal({ isOpen: false, uid: "" })}
        onSuccess={() => {
          fetchRecentSwipes();
          fetchAttendance();
        }}
        uid={assignUidModal.uid}
        deviceName={assignUidModal.deviceName}
        swipeId={assignUidModal.swipeId}
      />
    </AppLayout>
  );
}
