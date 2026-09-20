"use client";

import React, { useEffect, useState } from "react";

export function MouseGlow() {
  const [mousePos, setMousePos] = useState({ x: 500, y: 300 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500 overflow-hidden"
      style={{
        background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(163, 230, 53, 0.05), rgba(16, 185, 129, 0.02) 40%, transparent 80%)`,
      }}
    />
  );
}
