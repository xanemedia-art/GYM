"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  BarChart3,
  IndianRupee,
  Receipt,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { formatINR, formatDate, formatTime } from "@/lib/utils";

interface ReportsClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      businessName: string;
      slug: string;
      gstin?: string | null;
    };
  };
}

export default function ReportsClient({ user }: ReportsClientProps) {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reports?range=${range}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  const exportCSV = () => {
    if (!data?.financials?.recentTransactions) return;

    const headers = ["Payment Number", "Date", "Member Name", "Member Code", "Invoice Number", "Mode", "Amount (INR)", "Collected By"];
    const rows = data.financials.recentTransactions.map((tx: any) => [
      tx.paymentNumber,
      formatDate(tx.paymentDate),
      `"${tx.member?.firstName} ${tx.member?.lastName}"`,
      tx.member?.memberCode,
      tx.invoice?.invoiceNumber,
      tx.mode,
      tx.amount,
      `"${tx.collectedBy?.fullName}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gym_financial_report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const financials = data?.financials;
  const members = data?.members;
  const attendance = data?.attendance;

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-6xl">
        {/* Header & Range Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Analytics & Reports</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Financial collections, GST statutory breakdown (SAC 999723), and peak turnstile analytics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 text-xs font-medium">
              {[
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "90d", label: "90 Days" },
                { id: "1y", label: "1 Year" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                    range === r.id
                      ? "bg-white text-emerald-700 font-bold shadow-xs border border-emerald-200/60"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={exportCSV}
              disabled={!financials}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Collection</div>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
              {formatINR(financials?.totalCollected || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Cash, UPI, and Card receipts</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300" />
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taxable Turnover</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {formatINR(financials?.totalTaxable || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Base revenue (SAC 999723)</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Total GST (18%)</div>
            <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
              {formatINR(Number(financials?.totalCgst || 0) + Number(financials?.totalSgst || 0) + Number(financials?.totalIgst || 0))}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              CGST: {formatINR(financials?.totalCgst || 0)} • SGST: {formatINR(financials?.totalSgst || 0)}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Outstanding Dues</div>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">
              {formatINR(financials?.totalOutstanding || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Unpaid invoice balances</div>
          </div>
        </div>

        {/* Breakdown: Tender Distribution & Attendance Peak Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Tender Distribution */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
                <span>Collections by Tender Mode</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono font-semibold">{range.toUpperCase()}</span>
            </div>

            <div className="space-y-3">
              {financials?.modeBreakdown &&
                Object.entries(financials.modeBreakdown).map(([mode, amt]) => {
                  const percentage =
                    financials.totalCollected > 0
                      ? Math.round(((amt as number) / financials.totalCollected) * 100)
                      : 0;
                  return (
                    <div key={mode}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 capitalize">{mode.toLowerCase().replace("_", " ")}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatINR(amt as number)} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Peak Attendance Hours */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span>Peak Gym Floor Hours</span>
              </h3>
              <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Turnstile Punches
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Biometric punch distribution by hour of day (Indian Standard Time):
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
                {[6, 7, 8, 9, 18, 19, 20, 21].map((hour) => {
                  const count = attendance?.hourlyDistribution?.[hour] || 0;
                  return (
                    <div key={hour} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold font-mono">
                        {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                      <div className="text-sm font-bold text-emerald-700 mt-1 font-mono">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Financial Transactions Table */}
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Recent Payment Receipts (Audit Log)</span>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {financials?.recentTransactions?.length || 0} Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Receipt No</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Member</th>
                  <th className="px-5 py-3.5 font-semibold">Invoice Ref</th>
                  <th className="px-5 py-3.5 font-semibold">Tender</th>
                  <th className="px-5 py-3.5 font-semibold">Collected By</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financials?.recentTransactions?.length > 0 ? (
                  financials.recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-bold">{tx.paymentNumber}</td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDate(tx.paymentDate)}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {tx.member?.firstName} {tx.member?.lastName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">{tx.invoice?.invoiceNumber}</td>
                      <td className="px-5 py-3.5 font-mono uppercase text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          {tx.mode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{tx.collectedBy?.fullName}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono">{formatINR(tx.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      {loading ? "Loading transactions..." : "No payment transactions recorded in this period."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
