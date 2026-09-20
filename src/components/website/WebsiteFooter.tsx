import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BRANCHES } from "@/data/branches";
import { useWebsiteContent } from "./WebsiteLayout";
import {
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";

export function WebsiteFooter() {
  const { content } = useWebsiteContent();
  const branches = content?.branches?.length ? content.branches : BRANCHES;
  const general = content?.general;

  const kulluBranches = branches.filter((b) => b.city === "Kullu");
  const dehradunBranches = branches.filter((b) => b.city === "Dehradun");

  return (
    <footer className="relative bg-slate-950 text-slate-400 border-t border-white/10 pt-16 pb-12 overflow-hidden z-10">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center">
                <Image
                  src="/bff-icon.png"
                  alt="Be Free Fitness"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-lg font-black tracking-tight text-white uppercase">
                BE FREE FITNESS
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              {general?.tagline ||
                "North India's premier athletic chain, born in the rugged peaks of Kullu Valley and expanding across Himachal Pradesh and Uttarakhand. Engineered with Olympic-grade strength lines, biomechanical precision, automated eSSL door access, and elite coaching."}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={general?.socialLinks?.instagram || "https://instagram.com"}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-lime-400 hover:border-lime-400/40 transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href={general?.socialLinks?.facebook || "https://facebook.com"}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-lime-400 hover:border-lime-400/40 transition-colors"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={general?.socialLinks?.youtube || "https://youtube.com"}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-lime-400 hover:border-lime-400/40 transition-colors"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>

            <div className="pt-2">
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/15 hover:border-lime-400/50 text-xs font-bold text-slate-300 hover:text-lime-400 transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-lime-400" />
                <span>Staff Portal • Manage</span>
              </Link>
            </div>
          </div>

          {/* Kullu Valley Branches */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              <span>Kullu Valley (4)</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {kulluBranches.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/locations/${b.slug}`}
                    className="hover:text-lime-400 transition-colors flex items-center justify-between group"
                  >
                    <span>{b.shortName}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-lime-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dehradun Branches */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Dehradun (2)</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              {dehradunBranches.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/locations/${b.slug}`}
                    className="hover:text-lime-400 transition-colors flex items-center justify-between group"
                  >
                    <span>{b.shortName}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-lime-400" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Hours of Operation
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mon – Sat: 5:30 AM – 10:00 PM<br />
                Sunday: 6:00 AM – 1:00 PM
              </p>
            </div>
          </div>

          {/* Quick Links & Franchise */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/about" className="hover:text-lime-400 transition-colors">
                  About Our Philosophy
                </Link>
              </li>
              <li>
                <Link href="/franchise" className="hover:text-lime-400 transition-colors flex items-center gap-1.5 text-lime-400 font-semibold">
                  <span>Franchise Opportunities</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-lime-400 text-slate-950 font-black">
                    HOT
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/locations" className="hover:text-lime-400 transition-colors">
                  Find Nearest Gym
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-lime-400 transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-lime-400 transition-colors">
                  Gym Management System
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Be Free Fitness Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Official Gym Network</span>
            <span>•</span>
            <span>ISO 9001 Biomechanics</span>
            <span>•</span>
            <Link href="/portal" className="text-slate-400 hover:text-lime-400 font-bold transition-colors">
              Manage
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
