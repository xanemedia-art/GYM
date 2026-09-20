"use client";

import React, { useState } from "react";
import {
  Zap,
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  Receipt,
  User,
  Phone,
  IndianRupee,
  FileText,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface CustomPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMember?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

export function CustomPaymentModal({
  isOpen,
  onClose,
  defaultMember,
}: CustomPaymentModalProps) {
  const [clientName, setClientName] = useState(defaultMember?.name || "");
  const [clientPhone, setClientPhone] = useState(defaultMember?.phone || "");
  const [clientEmail, setClientEmail] = useState(defaultMember?.email || "");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<{
    invoiceNumber: string;
    amount: number;
    paymentLink: string;
    whatsappUrl: string;
    whatsappMessage: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [500, 1000, 2000, 3500, 5000, 10000];
  const quickPurposes = [
    "Annual Locker Facility Fee",
    "One-Time Registration Fee",
    "Special Summer Bootcamp",
    "Fitness Diet Consultation",
    "Gym Day Pass",
    "Membership Renewal Balance",
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/payments/custom-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: defaultMember?.id,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
          amount: numAmount,
          description: description.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to generate payment request");
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.paymentLink) return;
    navigator.clipboard.writeText(result.paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setResult(null);
    setAmount("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Send Custom Payment Link</h2>
              <p className="text-xs text-slate-500">Create custom charge & share via Razorpay & WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Mobile *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      required
                      type="tel"
                      placeholder="9876543210"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Amount (₹ INR) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Quick Amount Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        amount === amt.toString()
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purpose / Service Description *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Annual Locker Deposit or Bootcamp Registration"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Quick Purpose Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickPurposes.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDescription(p)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Razorpay Payment Link...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Generate & Share Payment Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Result Screen */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-600 text-white mb-1 shadow-sm">
                  <Check className="h-5 w-5" />
                </div>
                <div className="text-base font-black text-slate-900">Payment Request Ready!</div>
                <div className="text-xs text-slate-600">
                  Invoice <strong className="font-mono text-emerald-800">{result.invoiceNumber}</strong> generated for{" "}
                  <strong className="text-slate-900">{formatINR(result.amount)}</strong>.
                </div>
              </div>

              {/* Link Box */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Razorpay Secure Checkout Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    type="text"
                    value={result.paymentLink}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={result.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Send via WhatsApp</span>
                </a>

                <a
                  href={result.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Checkout Preview</span>
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ← Create Another Request
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
