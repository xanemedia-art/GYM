"use client";
import React, { useState, useEffect } from "react";
import { X, CreditCard, IndianRupee, QrCode, Banknote, AlertCircle, Check, Share2, ExternalLink, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { buildUpiUri, generateQrDataUrl } from "@/lib/upi";

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMemberId?: string;
}

export function CollectPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMemberId,
}: CollectPaymentModalProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<string>("UPI");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic UPI State
  const [upiId, setUpiId] = useState<string>("befreefitness@icici");
  const [merchantName, setMerchantName] = useState<string>("Be Free Fitness");
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch open invoices
      fetch("/api/v1/invoices?status=ISSUED")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setInvoices(json.data);
            if (json.data.length > 0) {
              const matched = defaultMemberId
                ? json.data.find((inv: any) => inv.memberId === defaultMemberId || inv.member?.id === defaultMemberId)
                : null;
              const target = matched || json.data[0];
              setSelectedInvoiceId(target.id);
              setAmount(String(target.balanceAmount));
            }
          }
        })
        .catch(console.error);

      // Fetch active branch UPI ID
      fetch("/api/v1/tenants")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const current = json.data.find((t: any) => t.isCurrent);
            if (current) {
              if (current.upiId) setUpiId(current.upiId);
              if (current.upiMerchantName || current.businessName) {
                setMerchantName(current.upiMerchantName || current.businessName);
              }
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === "UPI" && amount && parseFloat(amount) > 0) {
      const selectedInv = invoices.find((i) => i.id === selectedInvoiceId);
      const uri = buildUpiUri({
        pa: upiId || "befreefitness@icici",
        pn: merchantName || "Be Free Fitness",
        am: parseFloat(amount),
        tn: selectedInv ? selectedInv.invoiceNumber : "Fee Payment",
      });
      generateQrDataUrl(uri, 220)
        .then((url) => setDynamicQrUrl(url))
        .catch(console.error);
    } else {
      setDynamicQrUrl(null);
    }
  }, [mode, amount, selectedInvoiceId, upiId, merchantName, invoices]);

  if (!isOpen) return null;

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setAmount(String(inv.balanceAmount));
    }
  };

  const handleSendRazorpayLink = async () => {
    if (!selectedInvoiceId) return;
    setSendingLink(true);
    try {
      const res = await fetch("/api/v1/payments/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount: parseFloat(amount) || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const inv = invoices.find((i) => i.id === selectedInvoiceId);
        const msg = encodeURIComponent(
          `🏋️ *${merchantName}*\n\n` +
          `Hi! Here is your secure payment link for Invoice *${json.data.invoiceNumber}* (${formatINR(json.data.amount)}):\n` +
          `${json.data.paymentLink}\n\n` +
          `You can pay via UPI, Credit/Debit Card, or NetBanking. Thank you!`
        );
        const phone = inv?.member?.phone?.replace(/\D/g, "").slice(-10);
        window.open(phone ? `https://wa.me/91${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
        setLinkSent(true);
        setTimeout(() => setLinkSent(false), 4000);
      } else {
        alert(json.error?.message || "Failed to generate online payment link");
      }
    } catch (e) {
      alert("Error sending payment link");
    } finally {
      setSendingLink(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount: parseFloat(amount),
          mode,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to record payment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">POS Fee Collection</h2>
              <p className="text-xs text-slate-500">Record cash, UPI, or card payments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Pending Invoice *</label>
            {invoices.length > 0 ? (
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.member?.firstName} {inv.member?.lastName} (Due: {formatINR(inv.balanceAmount)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                No unpaid invoices found. Generate a membership invoice first.
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Collect (₹) *</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Tender Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Tender *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "UPI / QR", value: "UPI", icon: QrCode },
                { label: "Cash", value: "CASH", icon: Banknote },
                { label: "Card POS", value: "CARD", icon: CreditCard },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = mode === t.value;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setMode(t.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic On-Screen UPI QR Code Card */}
          {mode === "UPI" && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3.5 animate-in fade-in duration-150">
              <div className="bg-white p-1.5 rounded-xl shadow-2xs border border-slate-200 shrink-0">
                {dynamicQrUrl ? (
                  <img src={dynamicQrUrl} alt="UPI Payment QR" className="h-24 w-24 object-contain rounded-lg" />
                ) : (
                  <div className="h-24 w-24 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                    Generating...
                  </div>
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Scan to Pay {formatINR(parseFloat(amount) || 0)}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    Auto-Filled
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-800 font-bold truncate">
                  {upiId}
                </div>
                <p className="text-[10px] text-slate-500">
                  Scan with GPay, PhonePe, Paytm, or BHIM. Amount pre-filled.
                </p>
                <button
                  type="button"
                  onClick={handleSendRazorpayLink}
                  disabled={sendingLink || !selectedInvoiceId}
                  className="mt-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                >
                  {sendingLink ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : linkSent ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Share2 className="h-3 w-3" />
                  )}
                  <span>{linkSent ? "Razorpay Link Sent on WhatsApp!" : "Send Razorpay Online Link via WhatsApp"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Reference Number for UPI or Card */}
          {mode !== "CASH" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === "UPI" ? "UPI Reference / UTR Number" : "Card Auth / Slip Reference"}
              </label>
              <input
                type="text"
                placeholder={mode === "UPI" ? "12-digit UTR number" : "Approval code"}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedInvoiceId}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Recording..." : "Record Payment & Print Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
