"use client";

import React, { useEffect, useState, useRef } from "react";

export function DumbbellCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [rotation, setRotation] = useState(0);

  const prevPos = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    // Only run on devices with fine pointer (mouse/trackpad, not touch)
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    document.body.classList.add("custom-cursor-enabled");

    const onMouseMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      setPos({ x, y });
      if (!isVisible) setIsVisible(true);

      // Compute slight rotational tilt based on horizontal movement
      const deltaX = x - prevPos.current.x;
      const targetRotation = Math.max(-25, Math.min(25, deltaX * 1.5));
      setRotation(targetRotation);
      prevPos.current = { x, y };

      // Check if target or parent is interactive
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          "button, a, input, select, textarea, [data-interactive='true'], [role='button']"
        );
        setIsHovering(!!interactive);
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      document.body.classList.remove("custom-cursor-enabled");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed z-[9999] top-0 left-0 transition-transform duration-75 ease-out will-change-transform"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
    >
      {/* Outer ambient glow pulse when hovering */}
      <div
        className={`absolute -top-6 -left-6 rounded-full transition-all duration-300 pointer-events-none ${
          isHovering
            ? "w-16 h-16 bg-lime-400/25 blur-md scale-125"
            : "w-12 h-12 bg-lime-400/10 blur-sm scale-75"
        }`}
      />

      {/* Trailing precision dot */}
      <div
        className={`absolute -top-1 -left-1 rounded-full transition-transform duration-150 ${
          isHovering ? "w-2.5 h-2.5 bg-lime-400 ring-4 ring-lime-400/30" : "w-1.5 h-1.5 bg-emerald-400"
        }`}
      />

      {/* Gym Dumbbell SVG Icon */}
      <div
        className="absolute -top-3.5 -left-3.5 transition-transform duration-200 ease-out origin-center drop-shadow-[0_0_8px_rgba(163,230,53,0.7)]"
        style={{
          transform: `rotate(${rotation - 35}deg) scale(${
            isMouseDown ? 0.85 : isHovering ? 1.35 : 1
          })`,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-lime-400"
        >
          {/* Left Weight Outer Collar */}
          <rect x="2" y="7" width="2" height="10" rx="0.8" fill="#a3e635" />
          {/* Left Big Plate */}
          <rect x="4" y="5" width="2.5" height="14" rx="1" fill="#10b981" />
          {/* Left Inner Plate */}
          <rect x="6.5" y="6.5" width="1.5" height="11" rx="0.5" fill="#a3e635" />

          {/* Central Knurled Barbell Shaft */}
          <rect x="8" y="10.5" width="8" height="3" rx="1" fill="#ffffff" />
          {/* Knurling Grid Texture */}
          <line x1="10" y1="11" x2="10" y2="13" stroke="#05080c" strokeWidth="0.75" />
          <line x1="12" y1="11" x2="12" y2="13" stroke="#05080c" strokeWidth="0.75" />
          <line x1="14" y1="11" x2="14" y2="13" stroke="#05080c" strokeWidth="0.75" />

          {/* Right Inner Plate */}
          <rect x="16" y="6.5" width="1.5" height="11" rx="0.5" fill="#a3e635" />
          {/* Right Big Plate */}
          <rect x="17.5" y="5" width="2.5" height="14" rx="1" fill="#10b981" />
          {/* Right Weight Outer Collar */}
          <rect x="20" y="7" width="2" height="10" rx="0.8" fill="#a3e635" />
        </svg>
      </div>
    </div>
  );
}
