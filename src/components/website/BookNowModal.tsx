"use client";

import React, { useState } from "react";
import { BRANCHES } from "@/data/branches";
import { useWebsiteContent } from "./WebsiteLayout";
import {
  X,
  Clock,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Share2,
  Dumbbell,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface BookNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBranchSlug?: string;
}

export function BookNowModal({ isOpen, onClose, initialBranchSlug }: BookNowModalProps) {
  const { content } = useWebsiteContent();
  const branchesList = content?.branches?.length ? content.branches : BRANCHES;
  const [selectedBranch, setSelectedBranch] = useState(
    initialBranchSlug || branchesList[0]?.slug || BRANCHES[0].slug
  );
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/v1/public/book-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchSlug: selectedBranch,
          clientName: clientName.trim() || undefined,
          clientPhone: clientPhone.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to generate pass link");
      }

      setGeneratedUrl(json.data.url);
      setExpiresAt(json.data.expiresAt);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
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

  const branchObj = BRANCHES.find((b) => b.slug === selectedBranch) || BRANCHES[0];
  const cleanPhone = clientPhone.replace(/\D/g, "").slice(-10);
  const whatsappShareText = encodeURIComponent(
    `Hi${clientName ? ` ${clientName}` : ""}! Here is your exclusive 1-Hour Self-Registration Pass for Be Free Fitness (${branchObj.name}): ${generatedUrl}\n\nThis link is valid for 60 minutes. Complete your registration to lock in your membership!`
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${whatsappShareText}`
    : `https://wa.me/?text=${whatsappShareText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 md:p-8 my-8 text-white overflow-hidden">
        {/* Ambient Top Lime Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-lime-400 via-emerald-400 to-lime-500" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>BOOK-Now</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-lime-400 text-slate-950">
                  1-Hour Pass
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate a temporary client self-registration link valid for 60 minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {!generatedUrl ? (
          <form onSubmit={handleGenerateLink} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Select Your Nearest Gym Branch *
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all cursor-pointer"
              >
                {branchesList.map((b) => (
                  <option key={b.slug} value={b.slug} className="bg-slate-900 text-white">
                    {b.name} ({b.city} — {b.landmark})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Your Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 98160..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-all"
                />
              </div>
            </div>

            {/* Feature pill highlights */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-lime-400 font-semibold">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Valid for exactly 1 hour from generation</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                You will receive a private onboarding link to select your membership duration, enter
                your details, and receive your digital access pass.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-lime-400 hover:bg-lime-300 text-slate-950 transition-all active:scale-95 shadow-md shadow-lime-400/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{loading ? "Generating Link..." : "Generate 1-Hour Link"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-xs text-lime-300 space-y-1">
              <div className="flex items-center gap-2 font-black text-lime-400 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Link Generated Successfully!</span>
              </div>
              <p className="text-[11px] text-lime-200/90">
                Valid for <strong>60 minutes</strong> for{" "}
                <strong>{branchObj.name}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Your Private Registration Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={generatedUrl}
                  className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-mono text-lime-300 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer border border-white/10"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href={generatedUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs text-center transition-all shadow-md shadow-lime-400/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Proceed to Register Now</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp Link</span>
              </a>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setGeneratedUrl(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Generate a link for another branch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
