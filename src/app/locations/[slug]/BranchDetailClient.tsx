"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Branch } from "@/data/branches";
import { WebsiteLayout, useWebsiteModals } from "@/components/website/WebsiteLayout";
import { LiquidGlassCard } from "@/components/website/LiquidGlassCard";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  Dumbbell,
  CheckCircle,
  ExternalLink,
  Users,
  ChevronLeft,
  Flame,
  Award,
} from "lucide-react";

interface BranchDetailClientProps {
  branch: Branch;
}

export function BranchDetailClient({ branch }: BranchDetailClientProps) {
  const { openBookNow, openInquireNow } = useWebsiteModals();
  const [selectedPhoto, setSelectedPhoto] = useState(branch.image);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${branch.name} ${branch.address} ${branch.city}`
  )}`;

  return (
    <WebsiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-20">
        {/* Back Link */}
        <div className="pt-4">
          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-lime-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to All Locations</span>
          </Link>
        </div>

        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-white/15 text-xs font-bold text-white shadow-md">
              <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
              <span>{branch.city}</span>
              <span className="text-slate-500">•</span>
              <span className="text-lime-300">{branch.region}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{branch.areaSqFt.toLocaleString()} sq.ft</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
              {branch.name}
            </h1>

            <p className="text-base text-lime-400 font-semibold tracking-wide">
              {branch.tagline}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Located at {branch.address}, {branch.city} ({branch.landmark}). Equipped with elite
              Olympic lifting platforms, precision isolation machines, Finnish steam rooms, and
              instant automated eSSL biometric smart turnstiles.
            </p>

            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-lime-400 shrink-0" />
                <span>
                  <strong>Timings:</strong> {branch.timings.weekdays} (Mon–Sat) |{" "}
                  {branch.timings.sunday} (Sun)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-lime-400 shrink-0" />
                <span>{branch.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-lime-400 shrink-0" />
                <span>{branch.phone}</span>
              </div>
            </div>

            {/* DUAL ACTION CTAS FOR THIS BRANCH */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => openBookNow(branch.slug)}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-xl shadow-lime-400/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                <span>BOOK-Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => openInquireNow(branch.slug)}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-white/15 hover:border-lime-400/40 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>Inquire on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Photo Showcase */}
          <div className="space-y-3">
            <div className="relative h-[340px] sm:h-[400px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
              <Image
                src={selectedPhoto}
                alt={branch.name}
                fill
                className="object-cover transition-all duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>

            {/* Gallery Thumbnails */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {[branch.image, ...branch.gallery].map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPhoto(img)}
                  className={`relative h-16 w-24 rounded-xl overflow-hidden border transition-all shrink-0 cursor-pointer ${
                    selectedPhoto === img
                      ? "border-lime-400 ring-2 ring-lime-400/40"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="Thumbnail" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AMENITIES & EQUIPMENT HIGHLIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Amenities Grid (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">
              Facility Amenities & Features
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branch.amenities.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-lime-400 font-bold text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{a.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Equipment Highlights List */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-lime-400" />
                <span>Featured Equipment Line</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {branch.equipmentHighlights.map((eq, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-lime-400 shrink-0" />
                    <span>{eq}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Head Trainer & Map card */}
          <div className="space-y-6">
            {/* Head Trainer Card */}
            <div className="p-6 rounded-3xl bg-slate-950/70 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-400">
                <Award className="h-4 w-4" />
                <span>Head Strength Coach</span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{branch.headTrainer.name}</h3>
                <p className="text-xs text-slate-400">{branch.headTrainer.title}</p>
                <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-lime-300 font-bold">
                  {branch.headTrainer.experience}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {branch.headTrainer.bio}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {branch.headTrainer.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Google Map & Directions */}
            <div className="p-6 rounded-3xl bg-slate-950/70 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-lime-400" />
                  <span>Map & Navigation</span>
                </h4>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 text-xs text-slate-400 leading-relaxed">
                <p className="font-semibold text-white mb-1">{branch.landmark}</p>
                <p>{branch.address}, {branch.city}, {branch.state} — {branch.pincode}</p>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <span>Get Driving Directions</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM FIXED / IN-PAGE CTA BANNER */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-lime-400/30 text-center space-y-4 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">
            Start Training at {branch.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Generate your private 1-hour self-registration pass now, or message the front-desk directly
            on WhatsApp to verify current slot availability.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openBookNow(branch.slug)}
              className="py-3 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-lime-400/25 cursor-pointer"
            >
              BOOK-Now
            </button>
            <button
              type="button"
              onClick={() => openInquireNow(branch.slug)}
              className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 shadow-md cursor-pointer flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp Inquiry</span>
            </button>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
