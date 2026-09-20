"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Branch } from "@/data/branches";
import {
  MapPin,
  Clock,
  ArrowUpRight,
  Shield,
  MessageCircle,
  Calendar,
  Sparkles,
} from "lucide-react";

interface BranchCardProps {
  branch: Branch;
  onBookNow: (slug: string) => void;
  onInquireNow: (slug: string) => void;
}

export function BranchCard({ branch, onBookNow, onInquireNow }: BranchCardProps) {
  return (
    <div className="group relative rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-lime-400/40 hover:shadow-[0_12px_40px_-10px_rgba(163,230,53,0.18)] hover:-translate-y-1.5 flex flex-col">
      {/* Specular top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

      {/* Image Container with Badges */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-900">
        <Image
          src={branch.image}
          alt={branch.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Region / City Pill */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
          <span>{branch.city}</span>
          <span className="text-slate-400">•</span>
          <span className="text-lime-300">{branch.region}</span>
        </div>

        {/* Area SqFt Badge */}
        <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
          {branch.areaSqFt.toLocaleString()} sq.ft
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white group-hover:text-lime-300 transition-colors">
                {branch.name}
              </h3>
              <p className="text-xs text-lime-400/90 font-semibold mt-0.5">
                {branch.tagline}
              </p>
            </div>
            <Link
              href={`/locations/${branch.slug}`}
              className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-lime-400 hover:text-slate-950 transition-all shrink-0"
              title="View Branch Details"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{branch.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{branch.timings.weekdays}</span>
            </div>
          </div>

          {/* Amenities Mini Tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {branch.amenities.slice(0, 3).map((a) => (
              <span
                key={a.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300"
              >
                {a.name}
              </span>
            ))}
            {branch.amenities.length > 3 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-lg bg-white/5 text-slate-400">
                +{branch.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-4 border-t border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onBookNow(branch.slug)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-sm shadow-lime-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>BOOK-Now</span>
          </button>

          <button
            type="button"
            onClick={() => onInquireNow(branch.slug)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Inquire</span>
          </button>

          <Link
            href={`/locations/${branch.slug}`}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
