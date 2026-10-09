"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, CheckCircle2, ArrowRight, MessageCircle, Clock, ShieldCheck, Heart } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PendingMemberItem {
  id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsappNumber?: string;
  gender: string;
  dateOfBirth?: string;
  healthMetrics?: {
    heightCm?: number;
    weightKg?: number;
  };
  createdAt: string;
  notes?: string;
  customFields?: {
    requestedPlanName?: string;
  };
}

interface PendingMembersSectionProps {
  pendingMembers: PendingMemberItem[];
  onActivatePass: (member: { id: string; fullName: string; memberCode: string; status: string }) => void;
}

export function PendingMembersSection({ pendingMembers, onActivatePass }: PendingMembersSectionProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Pending Members Requiring Plan Allocation & Verification
              </h2>
              {pendingMembers.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {pendingMembers.length} Awaiting Action
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gate QR self-enrolments & walk-in inquiries awaiting plan allocation and offline fee clearance
            </p>
          </div>
        </div>

        <Link
          href="/members"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto transition-colors"
        >
          <span>View Directory</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      {pendingMembers.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-1.5">
          <ShieldCheck className="h-7 w-7 text-emerald-500 mx-auto" />
          <p className="font-bold text-slate-700">All Members Verified</p>
          <p className="text-[11px] text-slate-400">
            No gate walk-in registrations are currently awaiting plan allocation.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-slate-100">
          {pendingMembers.map((m) => {
            const fullName = `${m.firstName} ${m.lastName}`;
            const height = m.healthMetrics?.heightCm;
            const weight = m.healthMetrics?.weightKg;
            const requestedPlan = m.customFields?.requestedPlanName || m.notes || "Inquiry";
            const cleanPhone = m.phone.replace(/\D/g, "").slice(-10);

            return (
              <div
                key={m.id}
                className="p-3.5 sm:py-3.5 sm:px-2.5 rounded-2xl sm:rounded-xl bg-slate-50/70 sm:bg-transparent border sm:border-0 border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="space-y-1.5 sm:space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-slate-900">{fullName}</span>
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {m.memberCode}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {m.gender}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 flex-wrap">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="text-slate-800 font-mono font-bold hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>📞</span>
                      <span>{m.phone}</span>
                    </a>
                    {m.dateOfBirth && (
                      <span>DOB: <strong className="text-slate-800">{formatDate(m.dateOfBirth)}</strong></span>
                    )}
                    {(height || weight) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white sm:bg-slate-100/80 px-2 py-0.5 rounded-md border sm:border-0 border-slate-200/80">
                        <Heart className="h-3 w-3 text-rose-500" />
                        {height ? `${height} cm` : ""}
                        {height && weight ? " • " : ""}
                        {weight ? `${weight} kg` : ""}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 truncate">
                    <span>Preference: </span>
                    <strong className="text-emerald-700 font-bold">{requestedPlan}</strong>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/80">
                  <a
                    href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      `Hello ${m.firstName}, welcome to our gym! We received your registration (${m.memberCode}). Please visit the front desk to complete verification.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/90 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                    title="Message on WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="sm:hidden">WhatsApp</span>
                  </a>

                  <button
                    onClick={() =>
                      onActivatePass({
                        id: m.id,
                        fullName,
                        memberCode: m.memberCode,
                        status: "LEAD",
                      })
                    }
                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify & Allocate Plan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
