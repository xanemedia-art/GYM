"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Fingerprint,
  CalendarCheck,
  Cpu,
  BarChart3,
  CalendarDays,
  Lock,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Dumbbell,
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

  const navSections = [
    {
      title: "OPERATIONS",
      items: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Members", href: "/members", icon: Users },
        { name: "POS & Billing", href: "/billing", icon: CreditCard },
        { name: "Live Attendance", href: "/attendance", icon: Fingerprint },
      ],
    },
    {
      title: "HARDWARE & SCHEDULE",
      items: [
        { name: "Biometric Devices", href: "/devices", icon: Cpu },
        { name: "Calendar & Events", href: "/calendar", icon: CalendarDays },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { name: "Membership Plans", href: "/plans", icon: CalendarCheck },
        { name: "Reports & GST", href: "/reports", icon: BarChart3 },
        { name: "Security & Audit", href: "/audit-logs", icon: Lock },
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
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
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-md shadow-emerald-600/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
              {user?.tenant?.businessName || "FitZone Elite"}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Gym Management OS</div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs"
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
            </div>
          ))}
        </nav>

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
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  {section.title}
                </div>
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <item.icon className="h-4 w-4 text-emerald-600" />
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100">
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

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/70">{children}</main>
      </div>

      <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
