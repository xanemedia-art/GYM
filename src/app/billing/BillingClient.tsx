"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollectPaymentModal } from "@/components/billing/CollectPaymentModal";
import { ThermalReceiptModal } from "@/components/billing/ThermalReceiptModal";
import { CreditCard, IndianRupee, FileText, CheckCircle2, Clock, AlertCircle, Printer, ArrowUpRight, TrendingUp } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

interface BillingClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      businessName: string;
      slug: string;
    };
  };
}

export default function BillingClient({ user }: BillingClientProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<any | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/invoices?limit=50");
      const json = await res.json();
      if (json.success && json.data) {
        setInvoices(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Invoicing & POS Billing</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              GST compliant tax invoices (SAC 999723), receipts, thermal slips, and tender tracking
            </p>
          </div>

          <button
            onClick={() => setIsCollectPaymentOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-2 self-start sm:self-auto transition-all active:scale-95"
          >
            <CreditCard className="h-4 w-4" />
            <span>Collect Fee (POS)</span>
          </button>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300" />
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Billed (SAC 999723)</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">{formatINR(totalBilled)}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <FileText className="h-3 w-3 text-slate-400" />
              <span>{invoices.length} invoices generated</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Realized Revenue</div>
            <div className="text-xl font-black text-emerald-600 font-mono mt-1">{formatINR(totalPaid)}</div>
            <div className="text-[11px] text-emerald-700/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Cash, UPI & Card tenders cleared</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Outstanding Member Dues</div>
            <div className="text-xl font-black text-rose-600 font-mono mt-1">{formatINR(totalDue)}</div>
            <div className="text-[11px] text-rose-500/80 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-rose-500" />
              <span>Follow-ups pending</span>
            </div>
          </div>
        </div>

        {/* Invoice Ledger Table */}
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900">Tax Invoices & Billing Ledger</div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {invoices.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Invoice No.</th>
                  <th className="px-5 py-3.5 font-semibold">Member</th>
                  <th className="px-5 py-3.5 font-semibold">Issued Date</th>
                  <th className="px-5 py-3.5 font-semibold">Taxable Val</th>
                  <th className="px-5 py-3.5 font-semibold">GST (18%)</th>
                  <th className="px-5 py-3.5 font-semibold">Total Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Balance Due</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-bold">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {inv.member?.firstName} {inv.member?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{inv.member?.phone}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDate(inv.issuedAt)}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">{formatINR(inv.taxableAmount)}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">
                        {formatINR(Number(inv.cgstAmount) + Number(inv.sgstAmount) + Number(inv.igstAmount))}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">{formatINR(inv.totalAmount)}</td>
                      <td className="px-5 py-3.5 font-bold font-mono">
                        {Number(inv.balanceAmount) > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                            {formatINR(inv.balanceAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-xs font-semibold">₹0.00</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {inv.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Paid
                          </span>
                        ) : inv.status === "PARTIALLY_PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3" />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="h-3 w-3" />
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setReceiptInvoice(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-medium border border-slate-200/80 transition-all active:scale-95"
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-500" />
                          <span>80mm Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                      {loading ? "Loading invoices..." : "No invoices recorded yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ThermalReceiptModal
        isOpen={!!receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
        invoice={receiptInvoice}
        tenant={user.tenant}
      />

      <CollectPaymentModal
        isOpen={isCollectPaymentOpen}
        onClose={() => setIsCollectPaymentOpen(false)}
        onSuccess={fetchInvoices}
      />
    </AppLayout>
  );
}
