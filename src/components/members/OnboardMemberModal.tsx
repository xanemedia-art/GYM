"use client";

import React, { useState } from "react";
import { X, UserPlus, AlertCircle, Sparkles, Fingerprint, Loader2 } from "lucide-react";
import { AvatarUploader } from "@/components/common/AvatarUploader";

interface OnboardMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OnboardMemberModal({ isOpen, onClose, onSuccess }: OnboardMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    phone: "",
    email: "",
    dateOfBirth: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    goal: "General Fitness",
    doorLockUid: "",
    photoUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [detectingUid, setDetectingUid] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAutoDetect = async () => {
    setDetectingUid(true);
    setDetectMsg(null);
    try {
      const res = await fetch("/api/v1/integrations/essl/recent-swipes");
      const json = await res.json();
      if (json.success && json.data?.latest) {
        const latest = json.data.latest;
        setFormData((prev) => ({ ...prev, doorLockUid: latest.uid }));
        setDetectMsg(`✨ Detected UID ${latest.uid} from ${latest.deviceName || "Door Lock"}!`);
      } else {
        setDetectMsg("No card swipe detected recently. Please tap card on the door lock now, then click again.");
      }
    } catch (e) {
      setDetectMsg("Failed to connect to door lock feed.");
    } finally {
      setDetectingUid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.photoUrl) {
      setError("Member photograph is mandatory. Please snap a photo using the desk webcam or upload an image before proceeding.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          photoUrl: formData.photoUrl,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyContactPhone: formData.emergencyContactPhone || undefined,
          doorLockUid: formData.doorLockUid ? formData.doorLockUid.trim() : undefined,
          healthMetrics: { goal: formData.goal },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to onboard member");
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe Bar Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0 bg-white">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Quick Member Onboarding</h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">Add a new gym member in under 60 seconds</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0 active:scale-90"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Member Profile Photo */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5">
              <AvatarUploader
                value={formData.photoUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url || "" }))}
                label="Member Profile Photo"
                description="Snap with desk webcam or upload image (Mandatory for entry pass)"
                required={true}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sharma"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer transition-all"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="member@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="Parent / Spouse name"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  placeholder="+91 9811001100"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* eSSL Door Lock UID / RFID Card */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  eSSL Door Lock UID / RFID Card
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={detectingUid}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors min-h-[32px] px-2 rounded-lg hover:bg-emerald-50"
                >
                  {detectingUid ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span>⚡ Auto-Detect</span>
                </button>
              </div>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 0008432190 or tap card on door lock"
                  value={formData.doorLockUid}
                  onChange={(e) => setFormData({ ...formData, doorLockUid: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-3 py-2.5 text-[16px] sm:text-xs text-slate-900 font-mono font-semibold focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
              {detectMsg && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 mt-1.5 font-medium">
                  {detectMsg}
                </p>
              )}
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 sm:px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 flex-1 sm:flex-initial px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Registering..." : "Enroll Member"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
