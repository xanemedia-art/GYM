"use client";

import React, { useState, useEffect } from "react";
import { X, Fingerprint, Search, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface AssignDoorLockUidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  uid: string;
  deviceName?: string;
  swipeId?: string;
}

export function AssignDoorLockUidModal({
  isOpen,
  onClose,
  onSuccess,
  uid,
  deviceName,
  swipeId,
}: AssignDoorLockUidModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/v1/members?limit=100")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setMembers(json.data);
            if (json.data.length > 0) {
              setSelectedMemberId(json.data[0].id);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
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
    if (!selectedMemberId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/integrations/essl/assign-uid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          uid,
          swipeId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to link door lock UID");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to connect UID");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Connect Door Lock Card / UID</h2>
              <p className="text-[11px] text-slate-500">Auto-attendance biometric binding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Detected UID Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Detected Door Lock UID
              </div>
              <div className="text-base font-black font-mono text-emerald-950 mt-0.5">{uid}</div>
            </div>
            {deviceName && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                {deviceName}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Gym Member to Connect
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Loading member list...</span>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-1.5 bg-slate-50/50">
                {filteredMembers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No members found</div>
                ) : (
                  filteredMembers.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white font-bold shadow-xs"
                            : "hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <div>
                          <div>
                            {m.firstName} {m.lastName}
                          </div>
                          <div
                            className={`text-[10px] font-mono ${
                              isSelected ? "text-emerald-100" : "text-slate-400"
                            }`}
                          >
                            {m.memberCode} • {m.phone}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Once connected, whenever this member taps their card or fingerprint on the eSSL door lock, their attendance will be marked automatically!
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedMemberId}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Connect to Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
