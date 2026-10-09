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
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {pendingMembers.map((m) => {
            const fullName = `${m.firstName} ${m.lastName}`;
            const height = m.healthMetrics?.heightCm;
            const weight = m.healthMetrics?.weightKg;
            const requestedPlan = m.customFields?.requestedPlanName || m.notes || "Inquiry";
            const cleanPhone = m.phone.replace(/\D/g, "").slice(-10);

            return (
              <div
                key={m.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{fullName}</span>
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {m.memberCode}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {m.gender}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span>Phone: <strong className="text-slate-800 font-mono">{m.phone}</strong></span>
                    {m.dateOfBirth && (
                      <span>DOB: <strong className="text-slate-800">{formatDate(m.dateOfBirth)}</strong></span>
                    )}
                    {(height || weight) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded">
                        <Heart className="h-3 w-3 text-rose-500" />
                        {height ? `${height} cm` : ""}
                        {height && weight ? " • " : ""}
                        {weight ? `${weight} kg` : ""}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 truncate max-w-lg">
                    <span>Preference: </span>
                    <strong className="text-emerald-700 font-medium">{requestedPlan}</strong>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      `Hello ${m.firstName}, welcome to our gym! We received your registration (${m.memberCode}). Please visit the front desk to complete verification.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold transition-all shadow-2xs"
                    title="Message on WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
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
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
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
