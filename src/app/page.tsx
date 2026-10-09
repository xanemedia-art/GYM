"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BRANCHES } from "@/data/branches";
import { WebsiteLayout, useWebsiteModals } from "@/components/website/WebsiteLayout";
import { BranchCard } from "@/components/website/BranchCard";
import { LiquidGlassCard } from "@/components/website/LiquidGlassCard";
import {
  Dumbbell,
  ArrowRight,
  Shield,
  Sparkles,
  Zap,
  Clock,
  MapPin,
  MessageCircle,
  Flame,
  Award,
  Users,
  Activity,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

export default function BrandHomePage() {
  const { openBookNow, openInquireNow } = useWebsiteModals();
  const [branches, setBranches] = useState(BRANCHES);
  const [heroData, setHeroData] = useState({
    badge: "BE FREE FITNESS NETWORK • 6 Branches in Kullu & Dehradun",
    headline: "UNLEASH YOUR",
    headlineAccent: "FREEDOM.",
    subtitle:
      "North India's premier athletic luxury gym chain. High-caliber Olympic strength lines, automated eSSL smart biometric access, Finnish saunas, and elite mountain-bred coaching.",
  });
  const [selectedRegion, setSelectedRegion] = useState<"ALL" | "Kullu Valley" | "Dehradun">("ALL");
  const [dynamicPlans, setDynamicPlans] = useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/v1/website-content")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.branches) setBranches(json.data.branches);
          if (json.data.sections?.hero) {
            setHeroData({
              badge: json.data.sections.hero.badge || heroData.badge,
              headline: json.data.sections.hero.headline || heroData.headline,
              headlineAccent: json.data.sections.hero.headlineAccent || heroData.headlineAccent,
              subtitle: json.data.sections.hero.subtitle || heroData.subtitle,
            });
          }
        }
      })
      .catch(() => {});

    fetch("/api/v1/public/plans")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.plans && json.data.plans.length > 0) {
          setDynamicPlans(json.data.plans);
        }
      })
      .catch(() => {});
  }, []);

  const filteredBranches = branches.filter((b) => {
    if (selectedRegion === "ALL") return true;
    return b.region === selectedRegion;
  });

  const membershipPasses = [
    {
      name: "Daily Workout Pass",
      duration: "1 Day Access",
      price: "₹200",
      description: "Ideal for travelers, guests, and single-session visitors.",
      features: [
        "Full gym floor & equipment access",
        "Locker & shower facilities",
        "Valid for any 1 branch",
        "Access to floor trainers",
      ],
      badge: "Drop-in",
      popular: false,
    },
    {
      name: "Monthly Strength Plan",
      duration: "1 Month (30 Days)",
      price: "₹2,000",
      description: "Complete unhindered athletic access with smart biometric entry.",
      features: [
        "Unlimited floor access",
        "eSSL Biometric smart door entry",
        "Locker & steam room access",
        "Personalized split workout sheet",
        "Certified floor trainer guidance",
      ],
      badge: "Monthly",
      popular: false,
    },
    {
      name: "Quarterly Transformation Plan",
      duration: "3 Months (90 Days)",
      price: "₹5,000",
      description: "Our signature high-conversion transformation cycle.",
      features: [
        "Everything in Monthly Plan",
        "Body composition assessment",
        "Clinical nutrition & diet guide",
        "Cross-branch training access",
        "1 Complimentary PT session",
      ],
      badge: "Most Popular",
      popular: true,
    },
    {
      name: "Semiannual Elite Plan",
      duration: "6 Months (180 Days)",
      price: "₹8,000",
      description: "Long-term athletic progression and sustainable physique development.",
      features: [
        "Everything in Quarterly Plan",
        "15 Days membership freeze option",
        "Periodic progress tracking",
        "Priority locker access",
        "Cross-branch access included",
      ],
      badge: "Best Value",
      popular: false,
    },
    {
      name: "Yearly Platinum VIP Plan",
      duration: "12 Months (365 Days)",
      price: "₹14,000",
      description: "The ultimate athlete membership with VIP perks and freezing options.",
      features: [
        "All branches access (Kullu & Dehradun)",
        "30 Days membership freeze option",
        "Exclusive Be Free Fitness Gym Bag & Shaker",
        "Monthly progress review with Master Coach",
        "Priority lockers & guest pass every month",
      ],
      badge: "VIP Elite",
      popular: false,
    },
  ];

  return (
    <WebsiteLayout>
      <div className="space-y-24 md:space-y-32">
        {/* HERO SECTION */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-8 md:pt-16 overflow-hidden">
          {/* Background Ambient Mesh Light */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[1000px] h-[450px] bg-gradient-to-br from-lime-400/15 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/15 text-xs font-bold text-slate-200 mb-6 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-ping" />
            <span className="text-lime-300 font-extrabold">{heroData.badge}</span>
          </div>

          {/* Main Fluid Headline */}
          <h1 className="max-w-5xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[1.08] drop-shadow-2xl">
            {heroData.headline}{" "}
            <span className="text-lime-400 lime-glow-text">{heroData.headlineAccent}</span>
            <br />
            CONQUER YOUR LIMITS.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            {heroData.subtitle}
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md">
            <button
              type="button"
              onClick={() => openBookNow()}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-lime-400/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>BOOK-Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => openInquireNow()}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-white/15 hover:border-lime-400/40 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>Inquire on WhatsApp</span>
            </button>
          </div>

          {/* Live Quick Metrics Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl text-left">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">6</div>
              <div className="text-xs text-lime-400 font-semibold mt-0.5">Elite Locations</div>
              <div className="text-[11px] text-slate-400 mt-1">Kullu Valley & Dehradun</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">12,000+</div>
              <div className="text-xs text-lime-400 font-semibold mt-0.5">Members Transformed</div>
              <div className="text-[11px] text-slate-400 mt-1">Proven body recomposition</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">35,000+</div>
              <div className="text-xs text-lime-400 font-semibold mt-0.5">Sq.Ft Training Area</div>
              <div className="text-[11px] text-slate-400 mt-1">Heavy strength & cardio</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">eSSL 100%</div>
              <div className="text-xs text-lime-400 font-semibold mt-0.5">Automated Access</div>
              <div className="text-[11px] text-slate-400 mt-1">Biometric turnstiles</div>
            </div>
          </div>
        </section>

        {/* 6 LOCATIONS SPOTLIGHT SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-lime-400 uppercase tracking-wider mb-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>Our Official Network</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
                Find Your Training Ground
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                6 state-of-the-art facilities equipped with competition iron, turf, and recovery zones
              </p>
            </div>

            {/* Region Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-white/10">
              {(["ALL", "Kullu Valley", "Dehradun"] as const).map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRegion === reg
                      ? "bg-lime-400 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {reg === "ALL" ? "All (6)" : reg}
                </button>
              ))}
            </div>
          </div>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch) => (
              <BranchCard
                key={branch.slug}
                branch={branch}
                onBookNow={(slug) => openBookNow(slug)}
                onInquireNow={(slug) => openInquireNow(slug)}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm group"
            >
              <span>View Full Directory with Maps & Equipment Rosters</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-lime-400" />
            </Link>
          </div>
        </section>

        {/* WHY BE FREE FITNESS: 4 LIQUID GLASS PILLARS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-lime-400 uppercase tracking-wider mb-2">
              <Award className="h-3.5 w-3.5" />
              <span>The Gold Standard</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Why We Are Different
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              No gimmicks. Just uncompromising biomechanics, automated convenience, and authentic culture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LiquidGlassCard glow className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                <Dumbbell className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white">Olympic & Heavy Iron</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eleiko barbells, calibrated steel plates, heavy dumbbells up to 65 kg, and dual cable
                stations built for relentless compound loading.
              </p>
            </LiquidGlassCard>

            <LiquidGlassCard glow className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white">eSSL Smart Entry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero front-desk bottlenecks. Check in instantly using your personal RFID band or biometric
                fingerprint at high-speed optical turnstiles.
              </p>
            </LiquidGlassCard>

            <LiquidGlassCard glow className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white">Thermotherapy & Steam</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Finnish cedarwood steam suites and infrared recovery pods to accelerate lactic acid clearance,
                soothe joints, and refresh your nervous system.
              </p>
            </LiquidGlassCard>

            <LiquidGlassCard glow className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-white">Clinical Body Recomp</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Targeted sports nutrition protocols, progressive overload tracking, and guidance from certified
                master trainers who walk the walk.
              </p>
            </LiquidGlassCard>
          </div>
        </section>

        {/* MEMBERSHIP PASSES OVERVIEW */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-lime-400 uppercase tracking-wider mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Transparent Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Choose Your Pass
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Generate your 1-hour self-registration link online and lock in your membership pass immediately.
            </p>
          </div>

          {(() => {
            const activePasses =
              dynamicPlans.length > 0
                ? dynamicPlans.map((p) => {
                    const lines = (p.description || "")
                      .split("\n")
                      .map((l: string) => l.replace(/^[•\-\*]\s*/, "").trim())
                      .filter(Boolean);
                    const descText = lines[0] || "Full unhindered athletic access.";
                    const features =
                      lines.length > 1
                        ? lines.slice(1)
                        : [
                            "Full floor & equipment access",
                            "eSSL Biometric smart door entry",
                            "Steam & shower facilities",
                            "Locker storage included",
                          ];
                    const isPopular =
                      p.durationDays === 90 ||
                      p.name.toLowerCase().includes("popular") ||
                      p.name.toLowerCase().includes("transformation");
                    const durationLabel =
                      p.durationDays === 1
                        ? "1 Day Access"
                        : p.durationDays >= 365
                        ? "12 Months (Yearly)"
                        : p.durationDays >= 180
                        ? "6 Months (Semiannual)"
                        : p.durationDays >= 90
                        ? "3 Months (Quarterly)"
                        : p.durationDays >= 30
                        ? "1 Month (Monthly)"
                        : `${p.durationDays} Days`;
                    const badge =
                      p.durationDays === 1
                        ? "Drop-in"
                        : isPopular
                        ? "Most Popular"
                        : p.durationDays >= 365
                        ? "VIP Elite"
                        : p.durationDays >= 180
                        ? "Best Value"
                        : "Monthly";

                    return {
                      name: p.name,
                      duration: durationLabel,
                      price: `₹${Number(p.basePrice).toLocaleString("en-IN")}`,
                      description: descText,
                      features: features.length > 0 ? features : ["Full facility access", "Biometric entry"],
                      badge,
                      popular: isPopular,
                    };
                  })
                : membershipPasses;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {activePasses.map((pass) => (
              <div
                key={pass.name}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  pass.popular
                    ? "bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-lime-400 shadow-xl shadow-lime-400/15 -translate-y-2"
                    : "bg-slate-950/70 border border-white/10 hover:border-white/25"
                }`}
              >
                {pass.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-lime-400 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md">
                    MOST POPULAR
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {pass.duration}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {pass.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">{pass.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black font-mono text-lime-400">
                        {pass.price}
                      </span>
                      <span className="text-xs text-slate-400">/ plan</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {pass.description}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-300">
                    {pass.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-lime-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => openBookNow()}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                      pass.popular
                        ? "bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-md shadow-lime-400/20"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    <span>BOOK-Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </section>

        {/* FRANCHISE TEASER BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-lime-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 md:p-12 overflow-hidden shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-xs font-bold text-lime-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Franchise Opportunity</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-tight">
                Own a High-ROI Be Free Fitness Center in Your City
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Join North India’s fastest-growing fitness franchise. Proven unit economics in Tier-2 and
                Tier-3 markets, 38–46% projected operational margins, and turn-key operational support
                with integrated eSSL door lock automation.
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href="/franchise"
                  className="py-3 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-lime-400/20 flex items-center gap-2"
                >
                  <span>Explore Franchise Details & ROI</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => openInquireNow()}
                  className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>Chat with Franchise Director</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </WebsiteLayout>
  );
}
