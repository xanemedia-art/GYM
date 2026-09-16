"use client";

import React, { useState, useEffect } from "react";
import { X, Fingerprint, Search, AlertCircle, CheckCircle2 } from "lucide-react";

interface ManualCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualCheckinModal({ isOpen, onClose, onSuccess }: ManualCheckinModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [punchType, setPunchType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/v1/members?limit=50")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setMembers(json.data);
            if (json.data.length > 0) {
              setSelectedMemberId(json.data[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) =>
    `${m.firstName} ${m.lastName} ${m.phone} ${m.memberCode}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          punchType,
          verificationMode: "FRONT_DESK_OVERRIDE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to record manual punch");
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
              <Fingerprint className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manual Attendance Punch</h2>
              <p className="text-xs text-slate-500">Front-desk check-in override</p>
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

          {/* Punch Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPunchType("CHECK_IN")}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                punchType === "CHECK_IN"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              🟢 Check In
            </button>
            <button
              type="button"
              onClick={() => setPunchType("CHECK_OUT")}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                punchType === "CHECK_OUT"
                  ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              🟠 Check Out
            </button>
          </div>

          {/* Member Search & Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Member *</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by name, phone or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-1.5 bg-slate-50/50">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  const isSelected = selectedMemberId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-semibold shadow-xs"
                          : "hover:bg-white hover:shadow-xs text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {m.firstName} {m.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {m.memberCode} • {m.phone}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">No matching members found</div>
              )}
            </div>
          </div>

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
              disabled={loading || !selectedMemberId}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Record Attendance Punch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
