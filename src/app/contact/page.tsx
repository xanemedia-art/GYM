"use client";

import React, { useState } from "react";
import { BRANCHES } from "@/data/branches";
import { WebsiteLayout, useWebsiteModals } from "@/components/website/WebsiteLayout";
import { LiquidGlassCard } from "@/components/website/LiquidGlassCard";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export default function ContactPage() {
  const { openBookNow } = useWebsiteModals();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].slug);
  const [topic, setTopic] = useState("Membership Inquiry");
  const [message, setMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = BRANCHES.find((b) => b.slug === selectedBranch) || BRANCHES[0];
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const waText = encodeURIComponent(
      `Hi Be Free Fitness (${branch.name})! My name is ${name.trim()} (${cleanPhone}).\nTopic: ${topic}\nMessage: ${message.trim()}\n\nPlease connect with me.`
    );
    window.open(`https://wa.me/${branch.whatsapp}?text=${waText}`, "_blank");
  };

  const faqs = [
    {
      q: "How does the BOOK-Now registration pass work?",
      a: "When you click 'BOOK-Now', our system instantly creates a secure cryptographic registration token valid for 60 minutes. You can register your KYC online, choose your plan, and walk right in to activate your biometric access.",
    },
    {
      q: "Can I access multiple Be Free Fitness branches with one pass?",
      a: "Yes! Members holding a 3-Month Transformation Pass or Annual Elite Pass enjoy cross-branch access across our Kullu Valley branches, and Annual Elite members have unrestricted entry to all 6 branches across Kullu and Dehradun.",
    },
    {
      q: "How does the automated eSSL door lock work?",
      a: "Every registered member receives a paired RFID card or biometric fingerprint ID. When you swipe at the entrance turnstile, our system verifies your membership in under 0.3 seconds and automatically unlocks the turnstile.",
    },
    {
      q: "Can I freeze my membership if I am traveling?",
      a: "Yes! Annual and semi-annual memberships support temporary freezing for up to 30 days per year upon informing the front desk in advance.",
    },
    {
      q: "Do you offer dedicated female-only training slots?",
      a: "Yes, our Dhalpur, Gandhinagar, and Akhara Bazar branches offer dedicated women's strength coaching batches led by certified female trainers.",
    },
  ];

  return (
    <WebsiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-24">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-6 md:pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-lime-400 uppercase tracking-wider">
            <Phone className="h-3.5 w-3.5" />
            <span>Always Connected</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            GET IN <span className="text-lime-400 lime-glow-text">TOUCH</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Have questions about memberships, personal training, or facilities? Connect directly
            with any of our 6 branches via phone, WhatsApp, or the form below.
          </p>
        </div>

        {/* 6 Branches Direct Contact Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            <span>Direct Branch Phone & WhatsApp Lines</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BRANCHES.map((b) => (
              <div
                key={b.slug}
                className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 space-y-3 hover:border-lime-400/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">{b.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-lime-300 font-bold">
                    {b.city}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 truncate">{b.landmark}, {b.address}</p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <a
                    href={`tel:${b.phone}`}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
                  >
                    <Phone className="h-3.5 w-3.5 text-lime-400" />
                    <span>{b.phone}</span>
                  </a>

                  <a
                    href={`https://wa.me/${b.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form & FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Form */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-5">
            <div>
              <h3 className="text-xl font-black text-white uppercase">Send Direct Message</h3>
              <p className="text-xs text-slate-400 mt-1">
                Fill out the details below to chat with the specific branch front-desk on WhatsApp.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahil Thakur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98160..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Branch *
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400 transition-all cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.slug} value={b.slug} className="bg-slate-900 text-white">
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Topic
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400 transition-all cursor-pointer"
                  >
                    <option value="Membership Plans & Rates">Membership Plans & Rates</option>
                    <option value="1-on-1 Personal Training">1-on-1 Personal Training</option>
                    <option value="Trial Pass Question">Trial Pass Question</option>
                    <option value="Corporate / Student Group">Corporate / Student Group</option>
                    <option value="Franchise Query">Franchise Query</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Message / Question *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us what you need help with..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Send via WhatsApp Desk</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black text-white uppercase">Frequently Asked Questions</h3>
              <p className="text-xs text-slate-400 mt-1">
                Common questions regarding guest passes, entry, and policies.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left text-xs font-bold text-white flex items-center justify-between gap-3 hover:text-lime-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isOpen ? "rotate-180 text-lime-400" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick 1-hour booking pass prompt */}
            <div className="p-4 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-between gap-3 text-xs">
              <span className="text-lime-300 font-medium">
                Want to train today? Generate your temporary registration link now.
              </span>
              <button
                type="button"
                onClick={() => openBookNow()}
                className="px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-sm"
              >
                BOOK-Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
