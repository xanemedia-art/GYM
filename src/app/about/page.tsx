"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { WebsiteLayout, useWebsiteModals } from "@/components/website/WebsiteLayout";
import { LiquidGlassCard } from "@/components/website/LiquidGlassCard";
import {
  Dumbbell,
  Shield,
  Sparkles,
  Award,
  Users,
  Compass,
  ArrowRight,
  Flame,
  CheckCircle,
  Clock,
  HeartHandshake,
} from "lucide-react";

export default function AboutUsPage() {
  const { openBookNow, openInquireNow } = useWebsiteModals();

  const milestones = [
    {
      year: "2019",
      title: "The Genesis in Dhalpur, Kullu",
      desc: "Founded by mountain fitness visionaries frustrated by cramped commercial gyms. Dhalpur flagship opened with 6,500 sq.ft of pure Olympic iron.",
    },
    {
      year: "2021",
      title: "Gandhinagar Hypertrophy Lab",
      desc: "Expanded into Gandhinagar, introducing the valley's first biomechanically converging and diverging isolation equipment line.",
    },
    {
      year: "2022",
      title: "Akhara Bazar Heavy Iron Den",
      desc: "Opened Akhara Bazar to meet the surge of competitive powerlifters and cross-trainers, featuring heavy dumbbells up to 65 kg.",
    },
    {
      year: "2023",
      title: "Bajaura Valley Panoramic Facility",
      desc: "Bajaura opened with a mountain-view cardio deck, calisthenics zone, and outdoor cross-training turf on NH 21.",
    },
    {
      year: "2024",
      title: "Expansion to Dehradun (Sudhowala Mega Campus)",
      desc: "Crossed state borders into Uttarakhand with a 7,200 sq.ft double-decker facility on Chakrata Road serving university athletes and residents.",
    },
    {
      year: "2025",
      title: "Prem Nagar Cantonment Facility & eSSL Automation",
      desc: "Launched our 6th branch at Prem Nagar Chowk with fully automated eSSL turnstiles and proprietary gym management operating system.",
    },
  ];

  return (
    <WebsiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 md:space-y-28">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-6 md:pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-lime-400 uppercase tracking-wider">
            <Compass className="h-3.5 w-3.5" />
            <span>The Be Free Fitness Story</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            FORGED IN THE MOUNTAINS. <br />
            <span className="text-lime-400 lime-glow-text">BUILT FOR GLORY.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            We started with a single conviction: authentic physical training shouldn't be reserved for
            metropolitan luxury towers. We brought international-grade biomechanics, mountain grit, and
            uncompromising coaching to the heart of Kullu Valley and Dehradun.
          </p>
        </div>

        {/* Brand Philosophy Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 h-[420px] bg-slate-900 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
              alt="Be Free Fitness Training Culture"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs text-slate-200">
              <div className="text-lime-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                The Be Free Creed
              </div>
              "True freedom isn't the absence of resistance—it's the power to overcome any load life places on your shoulders."
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">
              The 3 Pillars of Be Free Fitness
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">1. Scientific Biomechanics</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    We only procure machinery with physiological resistance curves matching human muscular strength
                    profiles. Less joint wear, maximum hypertrophy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="h-10 w-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">2. Authentic Gym Culture</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    No ego lifting, zero intimidation. Whether you are deadlifting 200 kg or doing your first push-up,
                    our coaches and community treat you with equal respect.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">3. Zero-Friction Technology</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Powered by automated eSSL optical door turnstiles, proprietary membership software, and 1-hour digital
                    guest passes. Smooth, modern, and efficient.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => openBookNow()}
                className="py-3 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-lime-400/20 cursor-pointer"
              >
                Experience Be Free Today
              </button>
              <button
                type="button"
                onClick={() => openInquireNow()}
                className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
              >
                Ask a Question
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-lime-400 uppercase tracking-wider mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Milestones & Growth</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Our Journey (2019 – Present)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              From a single valley vision to 6 bustling athletic facilities across two states
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.map((m) => (
              <LiquidGlassCard key={m.year} className="space-y-2.5">
                <div className="text-2xl font-black font-mono text-lime-400">{m.year}</div>
                <h3 className="text-sm font-black text-white">{m.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </LiquidGlassCard>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="text-center rounded-3xl p-10 bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl space-y-4">
          <h2 className="text-3xl font-black text-white uppercase">
            Ready to Begin Your Transformation?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Generate an instant 1-hour self-registration pass for your preferred gym branch or talk
            directly with our certified coaching staff.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openBookNow()}
              className="py-3 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-lime-400/20 cursor-pointer"
            >
              BOOK-Now
            </button>
            <Link
              href="/locations"
              className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
            >
              Find Closest Branch
            </Link>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
