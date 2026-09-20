"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { LiquidGlassCard } from "@/components/website/LiquidGlassCard";
import {
  TrendingUp,
  Sparkles,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Cpu,
  Users,
  MessageCircle,
  Clock,
  Send,
} from "lucide-react";

export default function FranchisePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [investmentBudget, setInvestmentBudget] = useState("₹45 - ₹60 Lakhs");
  const [propertyStatus, setPropertyStatus] = useState("Commercial Space Identified");
  const [notes, setNotes] = useState("");

  const handleFranchiseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const msg = encodeURIComponent(
      `Hi Be Free Fitness Expansion Team! I am interested in opening a Be Free Fitness franchise in ${city.trim()}.\n\nName: ${name.trim()}\nPhone: ${cleanPhone}\nBudget Range: ${investmentBudget}\nProperty Status: ${propertyStatus}\nNotes: ${notes.trim() || "None"}\n\nPlease share the franchise prospectus and financial model!`
    );
    window.open(`https://wa.me/919816012001?text=${msg}`, "_blank");
  };

  const unitEconomics = [
    {
      label: "Space Requirement",
      value: "3,500 – 8,000 sq.ft",
      detail: "High-ceiling commercial or standalone building",
    },
    {
      label: "Estimated Capex",
      value: "₹38L – ₹75L",
      detail: "Includes OEM gear, interiors, turnstiles & branding",
    },
    {
      label: "Payback Period",
      value: "14 – 18 Months",
      detail: "Fastest break-even in North India's gym sector",
    },
    {
      label: "Operational Margin",
      value: "38% – 46%",
      detail: "Healthy recurring membership cashflows",
    },
  ];

  return (
    <WebsiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 md:space-y-28">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-6 md:pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-xs font-bold text-lime-400 uppercase tracking-wider">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>High-Return Fitness Venture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            PARTNER WITH <span className="text-lime-400 lime-glow-text">BE FREE FITNESS.</span>
            <br />
            DOMINATE YOUR CITY.
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            The most reliable and technologically integrated fitness franchise model in North India.
            Low overheads, Olympic-standard infrastructure, automated eSSL turnstiles, and industry-leading
            cash flow returns.
          </p>
        </div>

        {/* 4 Key Unit Economics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {unitEconomics.map((m) => (
            <LiquidGlassCard key={m.label} glow className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {m.label}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-lime-400">
                {m.value}
              </div>
              <p className="text-xs text-slate-400">{m.detail}</p>
            </LiquidGlassCard>
          ))}
        </div>

        {/* Turnkey Support Model */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">
              Complete Turnkey Support
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              We handle the complex engineering so you can focus on building local authority and community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LiquidGlassCard className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                <Building className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-white">1. Design & Equipment Procurement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                3D CAD layouts, acoustic zoning, and direct OEM commercial discounts saving up to 30% on
                Olympic-standard strength lines, dumbbells, and cardio fleets.
              </p>
            </LiquidGlassCard>

            <LiquidGlassCard className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-white">2. Automated Tech & eSSL Turnstiles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pre-configured eSSL biometric hardware, custom digital QR check-ins, automated GST billing,
                and centralized management software ready on Day 1.
              </p>
            </LiquidGlassCard>

            <LiquidGlassCard className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-white">3. Staff Hiring & Pre-Sales Kickoff</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Head coach recruitment and rigorous training playbooks, combined with a targeted digital pre-sale
                marketing funnel that guarantees 150+ paid members on opening day.
              </p>
            </LiquidGlassCard>
          </div>
        </div>

        {/* Interactive Application Form */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 md:p-12 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Confidential Application</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                Apply for Franchise Rights
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Submit your details below to schedule an initial consultation with our Expansion Director.
              </p>
            </div>

            <form onSubmit={handleFranchiseSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikas Sood"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98160..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Manali, Shimla, Rishikesh, Mandi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Available Investment Budget
                  </label>
                  <select
                    value={investmentBudget}
                    onChange={(e) => setInvestmentBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400 transition-all cursor-pointer"
                  >
                    <option value="₹35 - ₹45 Lakhs">₹35 – ₹45 Lakhs (Standard Model)</option>
                    <option value="₹45 - ₹60 Lakhs">₹45 – ₹60 Lakhs (Flagship Model)</option>
                    <option value="₹60 - ₹85+ Lakhs">₹60 – ₹85+ Lakhs (Mega Multi-Story)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Commercial Property Status
                </label>
                <select
                  value={propertyStatus}
                  onChange={(e) => setPropertyStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400 transition-all cursor-pointer"
                >
                  <option value="Commercial Space Identified / Ready">Commercial Space Identified / Leased</option>
                  <option value="Self-Owned Commercial Building">Self-Owned Commercial Building</option>
                  <option value="Searching for Suitable Property">Need Assistance Finding Property</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Professional Background & Vision (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share any past business experience, fitness background, or specific questions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm transition-all active:scale-95 shadow-xl shadow-lime-400/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Application via WhatsApp Desk</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
