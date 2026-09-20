"use client";

import React from "react";

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export function LiquidGlassCard({
  children,
  className = "",
  glow = false,
  interactive = false,
  onClick,
}: LiquidGlassCardProps) {
  return (
    <div
      onClick={onClick}
      data-interactive={interactive ? "true" : undefined}
      className={`relative rounded-2xl md:rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl p-5 md:p-6 transition-all duration-300 overflow-hidden ${
        glow ? "shadow-[0_0_40px_-10px_rgba(163,230,53,0.15)]" : "shadow-2xl"
      } ${
        interactive
          ? "hover:border-lime-400/40 hover:bg-slate-900/80 hover:-translate-y-1 cursor-pointer group"
          : ""
      } ${className}`}
    >
      {/* Specular Top Border Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Subtle Corner Lime Tint */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-lime-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-lime-400/15 transition-all" />

      {children}
    </div>
  );
}
