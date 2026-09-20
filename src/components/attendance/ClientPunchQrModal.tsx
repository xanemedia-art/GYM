"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { X, Download, Printer, Copy, Check, QrCode, Sparkles } from "lucide-react";

interface ClientPunchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymName: string;
  slug: string;
}

export function ClientPunchQrModal({
  isOpen,
  onClose,
  gymName,
  slug,
}: ClientPunchQrModalProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const punchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/punch/${slug}`
    : `https://gym.com/punch/${slug}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(punchUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrUrl(url))
        .catch(console.error);
    }
  }, [isOpen, punchUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(punchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Front Desk Check-In QR - ${gymName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px;
              color: #0f172a;
              background: #ffffff;
            }
            .card {
              max-width: 420px;
              margin: 0 auto;
              border: 3px solid #059669;
              border-radius: 24px;
              padding: 32px 24px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            h1 { font-size: 24px; margin-bottom: 4px; font-weight: 900; }
            p { font-size: 14px; color: #475569; margin-top: 0; }
            .badge {
              display: inline-block;
              background: #ecfdf5;
              color: #047857;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 700;
              margin-bottom: 20px;
            }
            .qr-img { width: 280px; height: 280px; margin: 12px auto; display: block; }
            .instruction {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 16px;
            }
            .url {
              font-size: 11px;
              color: #64748b;
              font-family: monospace;
              word-break: break-all;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">OFFICIAL ATTENDANCE TERMINAL</span>
            <h1>${gymName}</h1>
            <p>Scan with your phone camera to check in</p>
            <img src="${qrUrl}" class="qr-img" />
            <div class="instruction">⚡ Quick Self-Punch Check-In</div>
            <div class="url">${punchUrl}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-center">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <QrCode className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-900">Front-Desk Punch QR</h2>
              <p className="text-[11px] text-slate-500">Scan to punch in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Client Punch QR"
                className="w-56 h-56 rounded-xl border border-slate-200/80 shadow-xs"
              />
            ) : (
              <div className="w-56 h-56 rounded-xl bg-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}

            <div className="mt-3 font-bold text-slate-900 text-sm">{gymName}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono break-all mt-0.5">
              {punchUrl}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied Link" : "Copy Link"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
