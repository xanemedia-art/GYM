"use client";

import React, { useEffect, useRef } from "react";

export function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    let rafId: number | null = null;
    let targetX = 500;
    let targetY = 300;

    const updateGlow = () => {
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(650px circle at ${targetX}px ${targetY}px, rgba(163, 230, 53, 0.05), rgba(16, 185, 129, 0.02) 40%, transparent 80%)`;
      }
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updateGlow);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500 overflow-hidden"
    />
  );
}

