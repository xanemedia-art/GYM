"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Fingerprint,
  CalendarDays,
  QrCode,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearchDialog } from "./GlobalSearchDialog";
import { GymSwitcher } from "./GymSwitcher";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      businessName: string;
      slug: string;
    };
  } | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 5 Core Operational Pillars: Dashboard, Members, Attendance, Calendar, Gate QR Poster
  const primaryNavItems = [
    { name: "Dashboard", href: "/portal", icon: LayoutDashboard, shortName: "Home" },
    { name: "Members", href: "/members", icon: Users, shortName: "Members" },
    { name: "Attendance", href: "/attendance", icon: Fingerprint, shortName: "Attendance" },
    { name: "Calendar & Dates", href: "/calendar", icon: CalendarDays, shortName: "Calendar" },
    { name: "Gate QR Poster", href: "/gate-qr", icon: QrCode, shortName: "Gate QR" },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-xs">
            <Image
              src="/bff-icon.png"
              alt="Be Free Fitness"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
              <span className="truncate">{user?.tenant?.businessName || "Be Free Fitness"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 shrink-0">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate">Be Free Fitness OS</div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Quick Client Punch Link shortcut */}
          <div className="pt-6 px-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                <Fingerprint className="h-3.5 w-3.5 text-emerald-600" />
                <span>Client Self-Punch</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Members can punch in from their mobile phones via web link or desk QR.
              </p>
              <Link
                href={`/punch/${user?.tenant?.slug || "be-free-fitness"}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>Open Punch Portal</span>
                <span>↗</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Gym Settings Shortcut */}
        <div className="px-3 pb-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
              pathname === "/settings"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70"
            )}
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Gym Settings</span>
          </Link>
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.fullName || "Staff User"}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold capitalize truncate">
                  {user?.role?.replace("_", " ").toLowerCase() || "Front Desk"}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <GymSwitcher currentTenant={user?.tenant} userRole={user?.role} />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative w-56 md:w-72 flex items-center bg-slate-100/90 border border-slate-200/90 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white transition-all text-left shadow-xs"
            >
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <span>Search member, phone, or ID...</span>
              <kbd className="ml-auto hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Biometric Gateway Online</span>
            </div>

            <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-4 shadow-lg">
            <div className="flex items-center gap-3 px-2 pb-3 border-b border-slate-100">
              <div className="h-9 w-9 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <Image
                  src="/bff-icon.png"
                  alt="Be Free Fitness"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.tenant?.businessName || "Be Free Fitness"}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Be Free Fitness OS</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
                Main Menu
              </div>
              {primaryNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    pathname === item.href
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <item.icon className="h-4 w-4 text-emerald-600" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  pathname === "/settings"
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Gym Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Page Content (with bottom padding on mobile for bottom bar) */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/70 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar - Fixed & Instant Access */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] transition-all min-w-[56px]",
                  isActive
                    ? "text-emerald-700 font-extrabold"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-lg relative transition-all",
                    isActive ? "bg-emerald-100/70 text-emerald-700 scale-105" : "text-slate-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                  )}
                </div>
                <span className="mt-0.5 truncate">{item.shortName}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
