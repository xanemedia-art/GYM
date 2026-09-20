"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Dumbbell,
  ArrowRight,
  Sparkles,
  Phone,
  LayoutDashboard,
} from "lucide-react";

interface WebsiteNavbarProps {
  onBookNowClick: () => void;
}

export function WebsiteNavbar({ onBookNowClick }: WebsiteNavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Franchise Details", href: "/franchise" },
    { label: "Our Locations", href: "/locations" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/85 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center shrink-0 group-hover:border-lime-400/50 transition-colors shadow-md">
              <Image
                src="/bff-icon.png"
                alt="Be Free Fitness"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase group-hover:text-lime-300 transition-colors">
                  BE FREE FITNESS
                </span>
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
              </div>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono">
                Kullu • Dehradun • 6 Gyms
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full shadow-inner">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white/10 text-lime-400 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Book Now Button */}
            <button
              type="button"
              onClick={onBookNowClick}
              className="py-2.5 px-4 rounded-full bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black tracking-tight shadow-lg shadow-lime-400/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>BOOK-Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Manage Button */}
            <Link
              href="/portal"
              className="py-2.5 px-4 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white hover:text-lime-300 text-xs font-bold border border-white/15 hover:border-lime-400/40 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              title="Open Gym Management System"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-lime-400" />
              <span>Manage</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/portal"
              className="py-1.5 px-3 rounded-full bg-slate-900 border border-white/15 text-xs font-bold text-lime-400 hover:text-white transition-colors"
            >
              Manage
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-white/15 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl lg:hidden flex flex-col p-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center">
                <Image
                  src="/bff-icon.png"
                  alt="Be Free Fitness"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-base font-black text-white">BE FREE FITNESS</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-lime-400 text-slate-950 font-black shadow-md shadow-lime-400/20"
                      : "text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onBookNowClick();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-lime-400 text-slate-950 font-black text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-lime-400/25 active:scale-98"
            >
              <span>BOOK-Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              href="/portal"
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-white border border-white/15 font-bold text-sm text-center flex items-center justify-center gap-2 hover:border-lime-400/40"
            >
              <LayoutDashboard className="h-4 w-4 text-lime-400" />
              <span>Manage</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
