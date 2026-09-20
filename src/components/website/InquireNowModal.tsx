"use client";

import React, { useState } from "react";
import { BRANCHES } from "@/data/branches";
import { useWebsiteContent } from "./WebsiteLayout";
import {
  X,
  MessageCircle,
  Phone,
  User,
  Target,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface InquireNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBranchSlug?: string;
}

export function InquireNowModal({ isOpen, onClose, initialBranchSlug }: InquireNowModalProps) {
  const { content } = useWebsiteContent();
  const branchesList = content?.branches?.length ? content.branches : BRANCHES;
  const [selectedBranch, setSelectedBranch] = useState(
    initialBranchSlug || branchesList[0]?.slug || BRANCHES[0].slug
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("Weight Loss & Fat Burn");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const branchObj = branchesList.find((b) => b.slug === selectedBranch) || branchesList[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const extra = message.trim() ? ` Notes: ${message.trim()}` : "";
    const waText = encodeURIComponent(
      `Hi Be Free Fitness (${branchObj.name})! My name is ${name.trim()} (${cleanPhone}). I am interested in joining your gym for ${goal}.${extra} Please share membership plans, personal training options, and slot availability!`
    );

    // Call public inquiry route in background for logging
    fetch("/api/v1/public/inquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone: cleanPhone,
        branchSlug: branchObj.slug,
        goal,
        message,
      }),
    }).catch(() => {});

    // Open WhatsApp
    const waUrl = `https://wa.me/${branchObj.whatsapp}?text=${waText}`;
    window.open(waUrl, "_blank");

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 md:p-8 my-8 text-white overflow-hidden">
        {/* Top Emerald/Lime Ambient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500" />
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Inquire Now</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  Direct WhatsApp
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect directly with the front desk of your chosen branch
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Gym Branch *
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all cursor-pointer"
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
                Your Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anjali Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 98160..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Primary Fitness Goal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all cursor-pointer"
            >
              <option value="Weight Loss & Fat Burn">Weight Loss & Fat Burn</option>
              <option value="Muscle Building & Hypertrophy">Muscle Building & Hypertrophy</option>
              <option value="Personal Training Coaching">1-on-1 Personal Training</option>
              <option value="Strength & Powerlifting">Strength & Powerlifting</option>
              <option value="CrossFit & Functional Conditioning">CrossFit & Functional Conditioning</option>
              <option value="General Health & Membership Pricing">General Membership Pricing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Any Specific Question / Slot Preference (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Looking for early morning slots or couple packages..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all resize-none"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-3 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Direct connection to <strong>{branchObj.name}</strong> desk via WhatsApp. No spam, fast response.
            </span>
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all active:scale-95 shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5 fill-current" />
              )}
              <span>Chat on WhatsApp</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
