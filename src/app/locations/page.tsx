"use client";

import React, { useState } from "react";
import { BRANCHES } from "@/data/branches";
import { WebsiteLayout, useWebsiteModals } from "@/components/website/WebsiteLayout";
import { BranchCard } from "@/components/website/BranchCard";
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Building,
  Dumbbell,
} from "lucide-react";

export default function LocationsPage() {
  const { openBookNow, openInquireNow } = useWebsiteModals();
  const [branches, setBranches] = useState(BRANCHES);
  const [regionFilter, setRegionFilter] = useState<"ALL" | "Kullu Valley" | "Dehradun">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    fetch("/api/v1/website-content")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.branches) {
          setBranches(json.data.branches);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = branches.filter((b) => {
    if (regionFilter !== "ALL" && b.region !== regionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.landmark.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <WebsiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 md:space-y-16">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-6 md:pt-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-lime-400 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5" />
            <span>6 Premier Gym Facilities</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            OUR <span className="text-lime-400 lime-glow-text">LOCATIONS</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Find the Be Free Fitness facility nearest to you. Every location features competition-grade
            equipment, automated eSSL smart turnstiles, and certified athletic coaching.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl">
          {/* Region Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {(["ALL", "Kullu Valley", "Dehradun"] as const).map((reg) => (
              <button
                key={reg}
                onClick={() => setRegionFilter(reg)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  regionFilter === reg
                    ? "bg-lime-400 text-slate-950 shadow-md shadow-lime-400/20"
                    : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
                }`}
              >
                {reg === "ALL"
                  ? `All Branches (${BRANCHES.length})`
                  : `${reg} (${BRANCHES.filter((b) => b.region === reg).length})`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search branch, city, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-all"
            />
          </div>
        </div>

        {/* Results Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-slate-950 border border-white/10 text-slate-400 text-xs">
            <Dumbbell className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            No gym branches matched your search query. Try clearing your search filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((branch) => (
              <BranchCard
                key={branch.slug}
                branch={branch}
                onBookNow={(slug) => openBookNow(slug)}
                onInquireNow={(slug) => openInquireNow(slug)}
              />
            ))}
          </div>
        )}
      </div>
    </WebsiteLayout>
  );
}
