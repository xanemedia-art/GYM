"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import QRCode from "qrcode";
import {
  Printer,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Sparkles,
  MapPin,
  Phone,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Building2,
} from "lucide-react";

interface GateQrClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant: {
      businessName: string;
      slug: string;
    };
  };
  tenant: {
    id: string;
    businessName: string;
    slug: string;
    phone: string;
    email: string;
    address?: {
      city?: string;
      area?: string;
      state?: string;
      line1?: string;
    };
  };
}

export default function GateQrClient({ user, tenant }: GateQrClientProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [posterTitle, setPosterTitle] = useState("SCAN TO JOIN THE GYM");
  const [subheading, setSubheading] = useState("Fast Mobile Self-Registration • Entry Gate Pass");
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine public domain
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullUrl = `${origin}/join/${tenant.slug}`;
    setJoinUrl(fullUrl);

    // Generate high-resolution 1000px QR Code for crystal-clear physical printing
    QRCode.toDataURL(fullUrl, {
      width: 800,
      margin: 2,
      color: {
        dark: "#0f172a", // slate-900
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));
  }, [tenant.slug]);

  const handleCopy = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${tenant.slug}-gate-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const city = tenant.address?.city || tenant.address?.area || "Main Branch";

  return (
    <AppLayout user={user}>
      {/* Print Specific CSS Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-poster,
          #printable-poster * {
            visibility: visible;
          }
          #printable-poster {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 2.5rem;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999;
          }
          aside,
          header,
          nav,
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                Entry Gate QR Poster
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="h-3 w-3" />
                Print-Ready A4
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Print and paste this poster on the gym entrance gate so walk-in clients can scan and self-onboard.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 min-h-[42px]"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 min-h-[42px]"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Save PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[44px]"
            >
              <Printer className="h-4 w-4" />
              <span>Print A4 Poster</span>
            </button>
          </div>
        </div>

        {/* Customization Bar (Non-printed) */}
        <div className="no-print p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Poster Headline</label>
            <input
              type="text"
              value={posterTitle}
              onChange={(e) => setPosterTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Poster Subtitle</label>
            <input
              type="text"
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Live Printable A4 Poster Canvas */}
        <div className="flex justify-center">
          <div
            id="printable-poster"
            ref={printAreaRef}
            className="w-full max-w-[620px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-5 sm:p-10 flex flex-col justify-between text-slate-900 text-center relative overflow-hidden"
          >
            {/* Top Brand Banner */}
            <div className="space-y-3 pb-5 sm:pb-6 border-b-2 border-slate-100">
              <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-slate-50 border border-slate-200 mx-auto">
                <Image
                  src="/bff-logo.png"
                  alt="Be Free Fitness"
                  width={180}
                  height={56}
                  className="h-10 sm:h-12 w-auto object-contain"
                  priority
                />
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight uppercase text-slate-900">
                  {tenant.businessName}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{city} Branch</span>
                  <span>•</span>
                  <span>Open Daily</span>
                </div>
              </div>
            </div>

            {/* Poster Headline */}
            <div className="py-4 sm:py-6 space-y-1.5">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1 sm:mb-2">
                Self-Registration Gate Pass
              </div>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 uppercase leading-none">
                {posterTitle}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {subheading}
              </p>
            </div>

            {/* The QR Code Card */}
            <div className="my-2 p-4 sm:p-6 rounded-3xl bg-slate-50 border-2 border-slate-200/90 inline-block mx-auto shadow-inner">
              {qrDataUrl ? (
                <div className="relative p-2 bg-white rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={qrDataUrl}
                    alt="Entry Gate QR Code"
                    className="w-48 h-48 sm:w-64 sm:h-64 object-contain mx-auto"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-10 w-10 rounded-xl bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center">
                      <Image
                        src="/bff-icon.png"
                        alt="BFF"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center text-xs text-slate-400">
                  Generating Gate QR...
                </div>
              )}

              <div className="mt-3 text-[11px] font-mono font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 inline-block">
                scan on your camera
              </div>
            </div>

            {/* 3 Step Walk-in Instructions */}
            <div className="pt-5 sm:pt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center border-t-2 border-slate-100">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs mx-auto">
                  1
                </div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">Scan Gate QR</div>
                <div className="text-[9px] text-slate-500">With phone camera</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs mx-auto">
                  2
                </div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">Fill & Pick Plan</div>
                <div className="text-[9px] text-slate-500">Takes under 60 secs</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs mx-auto">
                  3
                </div>
                <div className="text-[11px] font-bold text-slate-900 leading-tight">Show at Desk</div>
                <div className="text-[9px] text-slate-500">Pay offline & enter</div>
              </div>
            </div>

            {/* Poster Footer */}
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-600" />
                <span>Front Desk: {tenant.phone}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {joinUrl}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
