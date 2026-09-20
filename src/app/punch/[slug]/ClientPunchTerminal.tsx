"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  AlertCircle,
  Loader2,
  Sparkles,
  Phone,
  ArrowRight,
  RefreshCw,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

interface ClientPunchTerminalProps {
  tenant: {
    id: string;
    slug: string;
    businessName: string;
    logoUrl?: string | null;
    phone: string;
  };
}

export default function ClientPunchTerminal({ tenant }: ClientPunchTerminalProps) {
  const [identifier, setIdentifier] = useState("");
  const [punchType, setPunchType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Autofocus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer to auto-clear result after punch
  useEffect(() => {
    if (resetCountdown === null) return;
    if (resetCountdown <= 0) {
      setResult(null);
      setResetCountdown(null);
      setIdentifier("");
      inputRef.current?.focus();
      return;
    }
    const timer = setTimeout(() => {
      setResetCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  const handlePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v1/attendance/client-punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          identifier: identifier.trim(),
          punchType,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to record attendance punch");
      }

      setResult(json.data);
      setResetCountdown(8); // Reset in 8 seconds for next member
    } catch (err: any) {
      setError(err.message || "Could not check in. Please check with reception.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center backdrop-blur-md shadow-inner">
            <Image
              src="/bff-icon.png"
              alt={tenant.businessName}
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="font-black text-base text-white tracking-tight leading-tight">
              {tenant.businessName}
            </h1>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Member Self Check-In
            </p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="text-right">
          <div className="text-sm font-black font-mono text-emerald-300">
            {formatTime(currentTime)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>
      </header>

      {/* Main Punch Form / Result Container */}
      <main className="w-full max-w-md my-auto">
        {result ? (
          /* Punch Result View */
          <div
            className={`rounded-3xl p-6 border backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-200 text-center ${
              result.status === "SUCCESS"
                ? "bg-emerald-950/40 border-emerald-500/40 shadow-emerald-950/50"
                : "bg-amber-950/40 border-amber-500/40 shadow-amber-950/50"
            }`}
          >
            <div className="flex justify-center mb-3">
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center border ${
                  result.status === "SUCCESS"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/40"
                    : "bg-amber-500/20 text-amber-400 border-amber-400/40"
                }`}
              >
                <CheckCircle2 className="h-9 w-9" />
              </div>
            </div>

            <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-2">
              {result.punchType === "CHECK_OUT" ? "Checked Out" : "Access Granted"}
            </span>

            <h2 className="text-2xl font-black text-white">
              {result.member?.firstName} {result.member?.lastName}
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              ID: {result.member?.memberCode} • {formatTime(result.punchTime)}
            </p>

            <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Membership Package:</span>
                <span className="font-bold text-emerald-300">{result.member?.planName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Plan Validity:</span>
                <span className="font-bold text-white">
                  {result.member?.daysRemaining > 0
                    ? `${result.member.daysRemaining} days remaining`
                    : "Expiring soon"}
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-400 font-semibold mt-4 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              Have an energized workout today!
            </p>

            <button
              onClick={() => {
                setResult(null);
                setIdentifier("");
                inputRef.current?.focus();
              }}
              className="mt-5 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold border border-white/15 transition-all"
            >
              Done (Resetting in {resetCountdown}s)
            </button>
          </div>
        ) : (
          /* Punch Input View */
          <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl">
            {/* Punch In / Out Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setPunchType("CHECK_IN")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  punchType === "CHECK_IN"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Dumbbell className="h-4 w-4" />
                <span>Punch In (Workout)</span>
              </button>
              <button
                type="button"
                onClick={() => setPunchType("CHECK_OUT")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  punchType === "CHECK_OUT"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LogOut className="h-4 w-4" />
                <span>Punch Out (Leaving)</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePunch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Mobile Number or Member ID
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="e.g. 9876543210 or M-1001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-2xl pl-10 pr-4 py-3.5 text-base font-mono font-bold text-white placeholder:text-slate-500 placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Type your registered 10-digit mobile phone number
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  punchType === "CHECK_IN"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25"
                    : "bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 shadow-amber-500/25"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>{punchType === "CHECK_IN" ? "⚡ Punch In Now" : "👋 Punch Out Now"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md pt-4 pb-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>Official Check-In Terminal • {tenant.businessName}</span>
      </footer>
    </div>
  );
}
