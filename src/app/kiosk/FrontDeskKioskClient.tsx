"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowLeft,
  Calendar,
  Phone,
  CreditCard,
  Send,
  UserCheck,
  ShieldAlert,
  Loader2,
  Delete,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CollectPaymentModal } from "@/components/billing/CollectPaymentModal";
import { CustomPaymentModal } from "@/components/billing/CustomPaymentModal";

interface InitialPunch {
  id: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  phone: string;
  punchTime: string;
  verificationMode: string;
}

interface FrontDeskKioskClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      businessName: string;
      slug: string;
    };
  };
  initialPunches: InitialPunch[];
}

export default function FrontDeskKioskClient({
  user,
  initialPunches,
}: FrontDeskKioskClientProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [punches, setPunches] = useState<InitialPunch[]>(initialPunches);
  const [showKeypad, setShowKeypad] = useState(false);

  // Active Punch Result
  const [activeResult, setActiveResult] = useState<{
    accessStatus: "GRANTED" | "EXPIRING_SOON" | "DENIED" | "FROZEN";
    message: string;
    punchRecorded: boolean;
    isDuplicate: boolean;
    daysRemaining: number;
    totalBalanceDue: number;
    member: {
      id: string;
      memberCode: string;
      fullName: string;
      phone: string;
      status: string;
      planName: string;
      membershipEndDate: string | null;
      emergencyPhone?: string | null;
    };
  } | null>(null);

  const [resetCountdown, setResetCountdown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal states for handling dues on the spot
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Autofocus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer to reset active card
  useEffect(() => {
    if (resetCountdown === null) return;
    if (resetCountdown <= 0) {
      setActiveResult(null);
      setResetCountdown(null);
      inputRef.current?.focus();
      return;
    }
    const timer = setTimeout(() => {
      setResetCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  // Synthesized Web Audio Chimes
  const playChime = (type: "GRANTED" | "EXPIRING_SOON" | "DENIED") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "GRANTED") {
        // Cheerful major chord ding (C5 -> G5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.2);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.6);
      } else if (type === "EXPIRING_SOON") {
        // Warning gentle chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else {
        // Low buzzer for denied/expired
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  const handlePunch = async (searchQuery?: string) => {
    const term = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!term) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/attendance/kiosk-punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const result = data.data;
        setActiveResult(result);
        setQuery("");
        setResetCountdown(7); // 7-second countdown display

        if (result.accessStatus === "GRANTED") {
          playChime("GRANTED");
        } else if (result.accessStatus === "EXPIRING_SOON") {
          playChime("EXPIRING_SOON");
        } else {
          playChime("DENIED");
        }

        // Add to punch list if punch recorded or verified
        if (result.punchRecorded || result.accessStatus === "GRANTED" || result.accessStatus === "EXPIRING_SOON") {
          setPunches((prev) => [
            {
              id: "kiosk-" + Date.now(),
              memberId: result.member.id,
              memberName: result.member.fullName,
              memberCode: result.member.memberCode,
              phone: result.member.phone,
              punchTime: new Date().toISOString(),
              verificationMode: "KIOSK_DESK",
            },
            ...prev.slice(0, 19),
          ]);
        }
      } else {
        playChime("DENIED");
        alert(data.error?.message || "Member not found. Please verify details.");
      }
    } catch (err) {
      console.error("Kiosk error:", err);
      playChime("DENIED");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === "CLEAR") {
      setQuery("");
    } else if (val === "BACKSPACE") {
      setQuery((prev) => prev.slice(0, -1));
    } else if (val === "ENTER") {
      handlePunch();
    } else {
      setQuery((prev) => prev + val);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Header Bar */}
      <header className="h-20 bg-slate-900/90 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold"
            title="Return to Main Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Management</span>
          </Link>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-1.5 flex items-center justify-center shadow-lg shadow-emerald-950">
              <Image
                src="/bff-icon.png"
                alt="Be Free Fitness"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-base font-black tracking-wider text-white uppercase flex items-center gap-2">
                <span>BE FREE FITNESS</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  KIOSK
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {user.tenant?.businessName || "Reception Terminal"}
              </div>
            </div>
          </div>
        </div>

        {/* Center Live Clock */}
        <div className="hidden lg:flex flex-col items-center">
          <div className="text-2xl font-black font-mono tracking-widest text-emerald-400">
            {currentTime.toLocaleTimeString("en-IN", { hour12: true })}
          </div>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {currentTime.toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2.5 rounded-xl border transition-all ${
              soundEnabled
                ? "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700"
                : "bg-rose-950/40 border-rose-900/50 text-rose-400 hover:bg-rose-900/50"
            }`}
            title={soundEnabled ? "Mute audio chimes" : "Unmute audio chimes"}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Kiosk Arena */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left / Center: Punch Stage (8 cols) */}
        <main className="lg:col-span-8 p-6 md:p-10 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Input Bar */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Member Check-In Scanner</span>
                <span className="text-[11px] text-emerald-400 font-normal">
                  Auto-focus active • Barcode / Phone / Name
                </span>
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePunch();
                }}
                className="relative flex items-center"
              >
                <div className="absolute left-4 pointer-events-none text-slate-400">
                  <Search className="h-6 w-6" />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter Phone No, Member ID, or Scan..."
                  className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl pl-14 pr-32 py-5 text-xl md:text-2xl font-bold text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 transition-all font-mono shadow-2xl"
                  autoComplete="off"
                />

                <div className="absolute right-3 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-900/50 flex items-center gap-2 active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>PUNCH</span>
                        <UserCheck className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Press [Enter] to submit check-in</span>
                <button
                  type="button"
                  onClick={() => setShowKeypad((prev) => !prev)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
                >
                  {showKeypad ? "Hide Touch Keypad" : "Show Touch Keypad (Tablets)"}
                </button>
              </div>
            </div>

            {/* Optional Touch Keypad for Tablet Desks */}
            {showKeypad && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLEAR", "0", "BACKSPACE"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={`h-14 rounded-xl font-bold font-mono text-lg transition-all active:scale-95 flex items-center justify-center ${
                      key === "CLEAR"
                        ? "bg-rose-950/40 border border-rose-900/40 text-rose-400 hover:bg-rose-900/50 text-xs"
                        : key === "BACKSPACE"
                        ? "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
                    }`}
                  >
                    {key === "BACKSPACE" ? <Delete className="h-5 w-5" /> : key}
                  </button>
                ))}
              </div>
            )}

            {/* Result Stage */}
            {activeResult ? (
              <div
                className={`rounded-3xl border-2 p-6 md:p-8 transition-all duration-300 shadow-2xl relative overflow-hidden ${
                  activeResult.accessStatus === "GRANTED"
                    ? "bg-emerald-950/40 border-emerald-500/80 shadow-emerald-950/60"
                    : activeResult.accessStatus === "EXPIRING_SOON"
                    ? "bg-amber-950/40 border-amber-500/80 shadow-amber-950/60"
                    : "bg-rose-950/40 border-rose-500/80 shadow-rose-950/60"
                }`}
              >
                {/* Reset Progress Bar */}
                {resetCountdown !== null && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${
                        activeResult.accessStatus === "GRANTED"
                          ? "bg-emerald-500"
                          : activeResult.accessStatus === "EXPIRING_SOON"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${(resetCountdown / 7) * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Identity & Status */}
                  <div className="flex items-start gap-5">
                    <div
                      className={`h-20 w-20 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-xl ${
                        activeResult.accessStatus === "GRANTED"
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-400"
                          : activeResult.accessStatus === "EXPIRING_SOON"
                          ? "bg-amber-500/20 border-amber-400 text-amber-400"
                          : "bg-rose-500/20 border-rose-400 text-rose-400"
                      }`}
                    >
                      {activeResult.accessStatus === "GRANTED" ? (
                        <CheckCircle2 className="h-10 w-10 animate-bounce" />
                      ) : activeResult.accessStatus === "EXPIRING_SOON" ? (
                        <AlertTriangle className="h-10 w-10" />
                      ) : (
                        <XCircle className="h-10 w-10" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                            activeResult.accessStatus === "GRANTED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : activeResult.accessStatus === "EXPIRING_SOON"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {activeResult.accessStatus === "GRANTED"
                            ? "ACCESS GRANTED"
                            : activeResult.accessStatus === "EXPIRING_SOON"
                            ? "EXPIRING SOON"
                            : "ACCESS DENIED / EXPIRED"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {activeResult.member.memberCode}
                        </span>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        {activeResult.member.fullName}
                      </h2>

                      <p className="text-sm font-medium text-slate-300">
                        {activeResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Membership Stats */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0 gap-2">
                    <div className="text-left md:text-right">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Package
                      </div>
                      <div className="text-sm font-bold text-white">
                        {activeResult.member.planName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Days Left
                      </div>
                      <div
                        className={`text-2xl font-black font-mono ${
                          activeResult.daysRemaining > 7
                            ? "text-emerald-400"
                            : activeResult.daysRemaining > 0
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {activeResult.daysRemaining}d
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overdue Balance Alert & Instant Action */}
                {activeResult.totalBalanceDue > 0 && (
                  <div className="mt-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                          Overdue Balance Pending
                        </div>
                        <div className="text-lg font-black font-mono text-white">
                          {formatINR(activeResult.totalBalanceDue)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCollectModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Collect (POS)</span>
                      </button>

                      <button
                        onClick={() => setIsCustomModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                      >
                        <Send className="h-4 w-4" />
                        <span>Send UPI Link</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Idle Standby Screen */
              <div className="rounded-3xl border-2 border-dashed border-slate-800 p-12 text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-xl">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-300">
                    Ready for Next Member
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Scan RFID / Barcode card or type registered phone number to verify entrance credentials.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Desk Instructions */}
          <div className="text-center text-xs text-slate-500 py-4">
            Be Free Fitness High-Speed Front-Desk Operating System • All entries cryptographically deduplicated (5-min window)
          </div>
        </main>

        {/* Right Sidebar: Real-time Punches Feed (4 cols) */}
        <aside className="lg:col-span-4 bg-slate-900/60 border-t lg:border-t-0 lg:border-l border-slate-800/80 p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Today&apos;s Punches
              </div>
              <div className="text-lg font-black text-white">
                {punches.length} Verified Check-ins
              </div>
            </div>
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 mt-3 pr-1 space-y-1">
            {punches.length > 0 ? (
              punches.map((p) => (
                <div
                  key={p.id}
                  className="py-3 px-2 flex items-center justify-between rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs font-mono">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {p.memberName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.memberCode || p.phone}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-slate-300">
                      {new Date(p.punchTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                      {p.verificationMode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No check-ins recorded today yet.
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Collect Modal if dues collected directly at Kiosk */}
      <CollectPaymentModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        defaultMemberId={activeResult?.member.id}
        onSuccess={() => {
          setIsCollectModalOpen(false);
          setActiveResult(null);
        }}
      />

      {/* Custom Payment Link Modal */}
      <CustomPaymentModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        defaultMember={
          activeResult
            ? {
                id: activeResult.member.id,
                name: activeResult.member.fullName,
                phone: activeResult.member.phone,
              }
            : undefined
        }
      />
    </div>
  );
}
