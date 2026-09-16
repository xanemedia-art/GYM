"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface AllocateMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: {
    id: string;
    memberCode: string;
    firstName: string;
    lastName: string;
  };
}

export function AllocateMembershipModal({
  isOpen,
  onClose,
  onSuccess,
  member,
}: AllocateMembershipModalProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await fetch("/api/v1/plans");
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setPlans(json.data);
          setSelectedPlanId(json.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const basePrice = selectedPlan ? Number(selectedPlan.basePrice) : 0;
  const joiningFee = selectedPlan ? Number(selectedPlan.joiningFee || 0) : 0;
  const grossAmount = basePrice + joiningFee;
  const discount = Math.min(discountAmount, grossAmount);
  const taxableValue = Math.max(0, grossAmount - discount);
  const gstAmount = Math.round(taxableValue * 0.18 * 100) / 100;
  const totalPayable = taxableValue + gstAmount;

  // Calculate projected end date
  let projectedEndDate = "-";
  if (selectedPlan && startDate) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + selectedPlan.durationDays);
    projectedEndDate = end.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      setError("Please select a membership plan");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          planId: selectedPlanId,
          startDate,
          discountAmount: Number(discountAmount) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to allocate membership");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Allocate Membership Plan</h2>
              <p className="text-xs text-slate-500">
                Assign a subscription package to{" "}
                <span className="font-semibold text-slate-800">
                  {member.firstName} {member.lastName}
                </span>{" "}
                ({member.memberCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Plan Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Membership Package *
            </label>
            {loadingPlans ? (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Loading available plans...</span>
              </div>
            ) : plans.length > 0 ? (
              <select
                required
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.durationDays} Days ({formatINR(p.basePrice)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
                No active membership plans found. Please configure plans first.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Activation Start Date *
              </label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Real-time Calculation Breakdown Box */}
          {selectedPlan && (
            <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Base Plan Price ({selectedPlan.durationDays} Days)</span>
                <span className="font-mono font-medium text-slate-800">{formatINR(basePrice)}</span>
              </div>

              {joiningFee > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>One-time Joining Fee</span>
                  <span className="font-mono font-medium text-slate-800">{formatINR(joiningFee)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-medium">
                  <span>Promotional Discount</span>
                  <span className="font-mono">- {formatINR(discount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                <span>Taxable Value</span>
                <span className="font-mono">{formatINR(taxableValue)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>GST (18%) SAC 999723 (CGST 9% + SGST 9%)</span>
                <span className="font-mono">{formatINR(gstAmount)}</span>
              </div>

              <div className="flex items-center justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                <span>Total Invoice Payable</span>
                <span className="font-mono text-emerald-700">{formatINR(totalPayable)}</span>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>
                  Projected Expiration: <strong className="text-slate-800">{projectedEndDate}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPlanId}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Receipt className="h-3.5 w-3.5" />
              <span>{submitting ? "Allocating..." : "Allocate & Issue Invoice"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
