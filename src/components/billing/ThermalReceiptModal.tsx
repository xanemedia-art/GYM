"use client";

import React, { useRef } from "react";
import { X, Printer } from "lucide-react";
import { formatINR, formatDate, formatTime } from "@/lib/utils";

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  tenant: any;
}

export function ThermalReceiptModal({ isOpen, onClose, invoice, tenant }: ThermalReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-sm rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col print:shadow-none print:max-w-none print:border-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">80mm Thermal Slip</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 80mm Receipt Body */}
        <div ref={receiptRef} className="p-6 font-mono text-xs leading-tight space-y-3 print:p-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="text-base font-black tracking-tight uppercase">
              {tenant?.businessName || "FITZONE ELITE CLUB"}
            </div>
            <div className="text-[11px] text-slate-600">Connaught Place, New Delhi - 110001</div>
            <div className="text-[11px] font-bold">GSTIN: {tenant?.gstin || "07AAAAF1234F1Z5"}</div>
            <div className="text-[10px] text-slate-500">Ph: {tenant?.phone || "+91 9876543210"}</div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Invoice Meta */}
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">TAX INVOICE:</span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DATE & TIME:</span>
              <span>{formatDate(invoice.issuedAt)} {formatTime(invoice.issuedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MEMBER:</span>
              <span className="font-bold">{invoice.member?.firstName} {invoice.member?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MEMBER ID:</span>
              <span>{invoice.member?.memberCode}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Items */}
          <div className="space-y-1">
            <div className="flex justify-between font-bold text-[10px] text-slate-600">
              <span>DESCRIPTION (SAC 999723)</span>
              <span>AMOUNT</span>
            </div>
            {invoice.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-[11px]">
                <span className="truncate max-w-[180px]">{item.description}</span>
                <span className="font-bold">{formatINR(item.totalItemAmount)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Tax Breakdown */}
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Taxable Amount:</span>
              <span>{formatINR(invoice.taxableAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">CGST (9.0%):</span>
              <span>{formatINR(invoice.cgstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">SGST (9.0%):</span>
              <span>{formatINR(invoice.sgstAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
              <span>NET TOTAL:</span>
              <span>{formatINR(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold pt-0.5">
              <span>PAID:</span>
              <span>{formatINR(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold">
              <span>BALANCE DUE:</span>
              <span>{formatINR(invoice.balanceAmount)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-2" />

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-500 space-y-1 pt-1">
            <div>Thank you for training with us! 💪</div>
            <div>Fees once paid are non-refundable.</div>
            <div className="font-bold text-slate-700">Powered by Gym Management OS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
