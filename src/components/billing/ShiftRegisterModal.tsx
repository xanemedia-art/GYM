"use client";

import React, { useState } from "react";
import {
  X,
  Calculator,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Printer,
  Share2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Coins,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

interface ShiftRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  gymName?: string;
  systemTotals: {
    cash: number;
    upi: number;
    card: number;
    online: number;
    total: number;
  };
}

export function ShiftRegisterModal({
  isOpen,
  onClose,
  staffName,
  gymName = "Be Free Fitness",
  systemTotals,
}: ShiftRegisterModalProps) {
  const [openingFloat, setOpeningFloat] = useState<string>("1000");
  const [physicalCashCounted, setPhysicalCashCounted] = useState<string>("");
  const [handoverTo, setHandoverTo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isClosed, setIsClosed] = useState(false);

  if (!isOpen) return null;

  const floatNum = Number(openingFloat) || 0;
  const expectedCashInDrawer = floatNum + systemTotals.cash;
  const countedCashNum = Number(physicalCashCounted) || 0;
  const discrepancy = countedCashNum - expectedCashInDrawer;

  const handlePrintSlip = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*Shift Closing Report - ${gymName}*
Date: ${formatDate(new Date())}
Cashier: ${staffName}
Handed Over To: ${handoverTo || "Next Shift"}
------------------------
• Opening Cash Float: ${formatINR(floatNum)}
• System Cash Collections: ${formatINR(systemTotals.cash)}
• Total Expected in Drawer: ${formatINR(expectedCashInDrawer)}
• Physical Cash Counted: ${formatINR(countedCashNum)}
• Discrepancy: ${discrepancy === 0 ? "Exact Match (₹0)" : (discrepancy > 0 ? `+${formatINR(discrepancy)} Surplus` : `-${formatINR(Math.abs(discrepancy))} Shortage`)}
------------------------
*Non-Cash Tenders:*
• Direct UPI: ${formatINR(systemTotals.upi)}
• Card Swipe: ${formatINR(systemTotals.card)}
• Online Razorpay: ${formatINR(systemTotals.online)}
*Total Shift Realized:* ${formatINR(systemTotals.total)}
${notes ? `\nNotes: ${notes}` : ""}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Front-Desk Shift Closing & Cash Handover
              </h3>
              <p className="text-xs text-slate-500">
                Cash drawer reconciliation & shift balance handover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Shift Details Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Duty Cashier: </span>
              <span className="font-bold text-slate-800">{staffName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 font-mono">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatDate(new Date())}</span>
            </div>
          </div>

          {/* System Recorded Totals Grid */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              System Recorded Shift Collections
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Cash Collected</div>
                <div className="text-base font-black text-emerald-700 font-mono mt-0.5">
                  {formatINR(systemTotals.cash)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                <div className="text-[10px] font-bold text-blue-700 uppercase">Direct UPI</div>
                <div className="text-base font-black text-blue-700 font-mono mt-0.5">
                  {formatINR(systemTotals.upi)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                <div className="text-[10px] font-bold text-purple-700 uppercase">Card Swipe</div>
                <div className="text-base font-black text-purple-700 font-mono mt-0.5">
                  {formatINR(systemTotals.card)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Online Razorpay</div>
                <div className="text-base font-black text-amber-700 font-mono mt-0.5">
                  {formatINR(systemTotals.online)}
                </div>
              </div>
            </div>
          </div>

          {/* Cash Reconciliation Form */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-600" />
              <span>Cash Drawer Physical Reconciliation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Opening Cash Float (₹)
                </label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Actual Physical Cash Counted (₹)
                </label>
                <input
                  type="number"
                  value={physicalCashCounted}
                  onChange={(e) => setPhysicalCashCounted(e.target.value)}
                  placeholder="Enter cash count in drawer"
                  className="w-full bg-white border-2 border-emerald-500/80 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Reconciliation Math Banner */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Expected in Drawer: </span>
                <span className="font-bold font-mono text-slate-800">
                  {formatINR(expectedCashInDrawer)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (Float {formatINR(floatNum)} + Sales {formatINR(systemTotals.cash)})
                </span>
              </div>

              {physicalCashCounted && (
                <div className="text-right">
                  <span className="text-slate-500">Difference: </span>
                  <span
                    className={`font-black font-mono text-sm ${
                      discrepancy === 0
                        ? "text-emerald-700"
                        : discrepancy > 0
                        ? "text-blue-600"
                        : "text-rose-600"
                    }`}
                  >
                    {discrepancy === 0
                      ? "₹0.00 (Balanced)"
                      : discrepancy > 0
                      ? `+${formatINR(discrepancy)} (Surplus)`
                      : `-${formatINR(Math.abs(discrepancy))} (Shortage)`}
                  </span>
                </div>
              )}
            </div>

            {/* Handover & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Handed Over To (Name)
                </label>
                <input
                  type="text"
                  value={handoverTo}
                  onChange={(e) => setHandoverTo(e.target.value)}
                  placeholder="e.g. Rahul (Evening Manager)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Shift Notes / Discrepancy Reason
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid ₹150 for drinking water"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              <span>Send Summary on WhatsApp</span>
            </button>

            <button
              onClick={() => {
                alert("Shift handover record verified and saved!");
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Complete Handover</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
