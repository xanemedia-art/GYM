"use client";

import React, { useState } from "react";
import {
  Share2,
  X,
  Copy,
  Check,
  MessageCircle,
  Clock,
  Loader2,
  AlertCircle,
  Sparkles,
  Link2,
} from "lucide-react";

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymName?: string;
}

export function ShareInviteModal({ isOpen, onClose, gymName }: ShareInviteModalProps) {
  const [expiresInHours, setExpiresInHours] = useState<number>(48);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/v1/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresInHours: Number(expiresInHours),
          clientName: clientName || undefined,
          clientPhone: clientPhone || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to generate invite link");
      }

      setGeneratedUrl(json.data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanPhone = clientPhone.replace(/\D/g, "").slice(-10);
  const whatsappText = encodeURIComponent(
    `Hi${clientName ? ` ${clientName}` : ""}! Here is your private link to register with ${
      gymName || "Be Free Fitness"
    } and choose your membership package: ${generatedUrl} (Link valid for ${expiresInHours} hours). Welcome aboard!`
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Share Client Onboarding Link</h2>
              <p className="text-xs text-slate-500">
                Generate a temporary link for client self-registration
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

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!generatedUrl ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Varun Dhawan"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Validity & Expiration *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "24 Hours", hours: 24 },
                    { label: "48 Hours", hours: 48 },
                    { label: "3 Days", hours: 72 },
                    { label: "7 Days", hours: 168 },
                  ].map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setExpiresInHours(opt.hours)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        expiresInHours === opt.hours
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  The client will land on a dedicated, mobile-friendly page where they can enter their
                  KYC info and choose their membership package. An official GST invoice is generated automatically upon signup.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <Link2 className="h-3.5 w-3.5" />
                  <span>{loading ? "Generating..." : "Generate Secure Link"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Invite link generated successfully! Valid for <strong>{expiresInHours} hours</strong>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Self-Registration URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={generatedUrl}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Share via WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setGeneratedUrl(null)}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
                >
                  Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
