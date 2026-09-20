"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { QrCode, Download, Share2, Copy, Check, Sparkles, AlertCircle, Save, ExternalLink } from "lucide-react";
import { buildUpiUri, generateQrDataUrl } from "@/lib/upi";

interface UpiStandeeCardProps {
  initialUpiId?: string | null;
  initialMerchantName?: string | null;
  gymName: string;
  onSave?: (upiId: string, upiMerchantName: string) => Promise<void>;
}

export function UpiStandeeCard({
  initialUpiId,
  initialMerchantName,
  gymName,
  onSave,
}: UpiStandeeCardProps) {
  const [upiId, setUpiId] = useState(initialUpiId || "");
  const [merchantName, setMerchantName] = useState(initialMerchantName || gymName);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const standeeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialUpiId) setUpiId(initialUpiId);
    if (initialMerchantName) setMerchantName(initialMerchantName);
  }, [initialUpiId, initialMerchantName]);

  useEffect(() => {
    const vpa = upiId.trim() || "befreefitness@icici";
    const name = merchantName.trim() || gymName;
    const uri = buildUpiUri({ pa: vpa, pn: name });

    generateQrDataUrl(uri, 320)
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Failed to generate QR:", err));
  }, [upiId, merchantName, gymName]);

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const vpa = upiId.trim() || "befreefitness@icici";
    const name = merchantName.trim() || gymName;
    const text = encodeURIComponent(
      `🏋️ *${name} — Official UPI Payment Details*\n\n` +
      `Scan to pay or enter UPI ID on any app (GPay, PhonePe, Paytm, BHIM):\n` +
      `• *UPI ID*: \`${vpa}\`\n` +
      `• *Payee Name*: ${name}\n\n` +
      `Please share the payment screenshot or UTR after paying. Thank you!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleDownloadStandee = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `${gymName.replace(/\s+/g, "_")}_UPI_QR_Standee.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleSaveSettings = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(upiId.trim(), merchantName.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save UPI settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Branch UPI Payment & Official QR Standee
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                NPCI Universal UPI
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Configure this branch's UPI Virtual Payment Address (VPA) and print counter standees for members
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <Check className="h-3.5 w-3.5" />
            <span>UPI ID Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Branch UPI ID (VPA) *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. befreefitness@icici or 9876543210@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all pr-20"
              />
              {upiId && (
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="absolute right-2 top-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-1"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Payments sent to this UPI ID will credit directly to your bank account without POS machine rent.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payee Display Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Be Free Fitness"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Shown to the customer on GPay, PhonePe, or Paytm when scanning the QR code.
            </span>
          </div>

          <div className="pt-2 flex flex-wrap gap-2.5">
            {onSave && (
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? "Saving..." : "Save UPI Settings"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 transition-all"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share on WhatsApp</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Counter POS Integration</span>
            </div>
            <p className="text-[11px] text-slate-500">
              This UPI ID is automatically used when cashiers select <strong>UPI Payment</strong> on the POS billing modal, generating dynamic on-screen QR codes with the exact invoice amount pre-filled!
            </p>
          </div>
        </div>

        {/* Right: Printable Official Standee Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            ref={standeeRef}
            className="w-full max-w-[280px] rounded-3xl bg-gradient-to-b from-emerald-600 via-slate-900 to-slate-950 p-4 text-white shadow-xl text-center space-y-3.5 border border-slate-700 relative overflow-hidden"
          >
            {/* Ambient subtle glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Standee Header */}
            <div className="flex flex-col items-center pt-2">
              <div className="h-10 w-auto flex items-center justify-center mb-1">
                <Image
                  src="/bff-icon.png"
                  alt="Be Free Fitness"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain drop-shadow"
                />
              </div>
              <div className="font-black text-sm tracking-tight text-white">{merchantName || gymName}</div>
              <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Accepted Here</div>
            </div>

            {/* White QR Code Card */}
            <div className="bg-white rounded-2xl p-3.5 shadow-md flex flex-col items-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="UPI QR Code" className="h-44 w-44 object-contain rounded-lg" />
              ) : (
                <div className="h-44 w-44 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <div className="mt-2 text-[10px] font-mono font-black text-slate-800 tracking-tight truncate max-w-full px-1">
                {upiId || "befreefitness@icici"}
              </div>
            </div>

            {/* UPI Brand Strip */}
            <div className="space-y-1 pb-1">
              <div className="text-[10px] text-slate-300 font-semibold">Scan with Any UPI App</div>
              <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">GPay</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">PhonePe</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">Paytm</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">BHIM</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadStandee}
            className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Standee QR (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
