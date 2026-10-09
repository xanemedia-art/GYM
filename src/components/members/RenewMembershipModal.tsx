"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  Loader2,
  CreditCard,
  Sparkles,
  AlertCircle,
  Package,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    fullName: string;
    memberCode: string;
    status: string;
    currentPlanName?: string;
    currentEndDate?: string;
  } | null;
  onSuccess: () => void;
}

export function RenewMembershipModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: RenewMembershipModalProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetch("/api/v1/plans")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const activePlans = json.data.filter((p: any) => p.isActive !== false);
            setPlans(activePlans);
            if (activePlans.length > 0) {
              setSelectedPlanId(activePlans[0].id);
            }
          }
        })
        .catch((e) => console.error("Error loading plans:", e))
        .finally(() => setLoading(false));

      // Default start date: today
      setStartDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const isLead = member.status === "LEAD";
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Compute calculated end date
  let computedEndDate = "";
  if (selectedPlan && startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + selectedPlan.durationDays);
    computedEndDate = end.toISOString().split("T")[0];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !startDate) {
      setError("Please select a plan and start date.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/memberships/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          planId: selectedPlanId,
          startDate,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to renew membership");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sparkles className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isLead ? "Activate Gate Registration" : "Renew / Extend Membership"}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {member.fullName} • <span className="font-mono">{member.memberCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Member current status badge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Current Status: </span>
              <span className="font-bold text-slate-900 capitalize">
                {isLead ? "New Gate Registration (Lead)" : member.status.toLowerCase()}
              </span>
            </div>
            {member.currentEndDate && (
              <div className="text-[11px] text-slate-500">
                Expires: <strong className="text-slate-800">{formatDate(member.currentEndDate)}</strong>
              </div>
            )}
          </div>

          {/* Select Plan */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-emerald-600" />
              <span>Select Membership Package</span>
            </label>
            {loading ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Loading available plans...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const price = Number(p.basePrice);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold shadow-xs"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {p.durationDays} Days Duration
                        </div>
                      </div>
                      <div className="mt-2 font-mono font-bold text-slate-900">
                        {formatINR(price)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span>Membership Start Date</span>
            </label>
            <input
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-semibold"
            />
          </div>

          {/* Computed Expiry Summary */}
          {selectedPlan && computedEndDate && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span>New Expiry Date:</span>
                <span className="font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  {formatDate(computedEndDate)}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800/90 pt-1 flex items-center gap-1">
                <span>Fee: {formatINR(Number(selectedPlan.basePrice))} (Offline Cash / Desk UPI)</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPlanId}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle2 className="h-4 w-4" />
              <span>{isLead ? "Confirm Fee & Activate Pass" : "Confirm Fee & Renew"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
