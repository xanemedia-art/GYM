"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserPlus, Fingerprint, MessageSquare, QrCode, Loader2, Sparkles } from "lucide-react";

interface QuickActionsProps {
  onAddMember: () => void;
  onManualPunch: () => void;
}

export function QuickActions({ onAddMember, onManualPunch }: QuickActionsProps) {
  const [triggeringCron, setTriggeringCron] = useState(false);

  const handleTriggerReminders = async () => {
    setTriggeringCron(true);
    try {
      const res = await fetch("/api/v1/cron/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(
          `Automated WhatsApp scanner completed!\n• Birthdays Processed: ${data.data?.birthdaysProcessed ?? 0}\n• Expiry Notices Sent: ${data.data?.expiriesNotified ?? 0}`
        );
      } else {
        alert(data.error?.message || "Triggered background scan.");
      }
    } catch (e) {
      alert("Triggered background scan.");
    } finally {
      setTriggeringCron(false);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* 1. Add Member */}
      <button
        onClick={onAddMember}
        className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] shadow-xs group"
      >
        <div className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Add Member
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Fast KYC profile</div>
        </div>
      </button>

      {/* 2. Gate QR Poster */}
      <Link
        href="/gate-qr"
        className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] shadow-xs group"
      >
        <div className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
            Gate QR Poster
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Print entry A4 poster</div>
        </div>
      </Link>

      {/* 3. Manual Punch */}
      <button
        onClick={onManualPunch}
        className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] shadow-xs group"
      >
        <div className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white">
          <Fingerprint className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
            Manual Punch
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Front-desk check-in</div>
        </div>
      </button>

      {/* 4. WhatsApp Reminders */}
      <button
        onClick={handleTriggerReminders}
        disabled={triggeringCron}
        className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] shadow-xs group disabled:opacity-50"
      >
        <div className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white">
          {triggeringCron ? (
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
            WhatsApp Scan
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Birthdays & Expiries</div>
        </div>
      </button>
    </div>
  );
}
