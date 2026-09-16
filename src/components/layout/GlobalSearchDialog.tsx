"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Receipt, X, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ members: any[]; invoices: any[] }>({
    members: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ members: [], invoices: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ members: [], invoices: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success && json.data) {
          setResults(json.data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="h-5 w-5 text-emerald-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search member name, phone (+91), member code, or invoice..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-4 text-center text-xs text-slate-400">Searching database...</div>
          )}

          {/* Members */}
          {results.members.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Members ({results.members.length})
              </div>
              <div className="space-y-1">
                {results.members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      router.push(`/members/${m.id}`);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          {m.firstName} {m.lastName}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {m.memberCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{m.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : m.status === "FROZEN"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {m.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {results.invoices.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Invoices ({results.invoices.length})
              </div>
              <div className="space-y-1">
                {results.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      router.push(`/billing`);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          {inv.invoiceNumber}
                          <span className="text-[11px] text-slate-500 font-normal">
                            ({inv.member?.firstName} {inv.member?.lastName})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Total: <strong className="text-slate-800">{formatINR(Number(inv.totalAmount))}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query.length >= 2 && !loading && results.members.length === 0 && results.invoices.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No members or invoices matched &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Search members by name, phone or code</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
