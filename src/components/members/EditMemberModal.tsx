"use client";

import React, { useState } from "react";
import { User, X, AlertCircle, Loader2, Save, HeartHandshake, Fingerprint, Sparkles } from "lucide-react";
import { AvatarUploader } from "@/components/common/AvatarUploader";

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: any;
}

export function EditMemberModal({
  isOpen,
  onClose,
  onSuccess,
  member,
}: EditMemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    phone: member?.phone || "",
    whatsappNumber: member?.whatsappNumber || "",
    email: member?.email || "",
    gender: member?.gender || "MALE",
    dateOfBirth: member?.dateOfBirth
      ? new Date(member.dateOfBirth).toISOString().split("T")[0]
      : "",
    emergencyContactName: member?.emergencyContactName || "",
    emergencyContactPhone: member?.emergencyContactPhone || "",
    status: member?.status || "ACTIVE",
    notes: member?.notes || "",
    doorLockUid: member?.customFields?.doorLockUid || "",
    photoUrl: member?.photoUrl || "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [detectingUid, setDetectingUid] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

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
        setDetectMsg("No card swipe detected recently. Tap card on door lock now, then click again.");
      }
    } catch (e) {
      setDetectMsg("Failed to connect to door lock feed.");
    } finally {
      setDetectingUid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber || null,
          email: formData.email || null,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || null,
          emergencyContactName: formData.emergencyContactName || null,
          emergencyContactPhone: formData.emergencyContactPhone || null,
          status: formData.status,
          notes: formData.notes || null,
          doorLockUid: formData.doorLockUid ? formData.doorLockUid.trim() : null,
          photoUrl: formData.photoUrl || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update member profile");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      {/* Background click to dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile Swipe Bar Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0 bg-white">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Edit Member Profile</h2>
              <p className="text-[11px] text-slate-500 truncate">
                {member.firstName} {member.lastName} • <span className="font-mono">{member.memberCode}</span>
              </p>
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

        {/* Scrollable Form Body with prevent-zoom text-[16px] for iOS */}
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
                description="Capture via camera or upload an updated photo."
                required={false}
              />
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Contact fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="+91..."
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Email & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNDISCLOSED">Prefer Not to Say</option>
                </select>
              </div>
            </div>

            {/* Date of Birth & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Member Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-bold focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="EXPIRING_SOON">EXPIRING_SOON</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="FROZEN">FROZEN</option>
                  <option value="LEAD">LEAD (Walk-in Inquiry)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
                <span>Emergency Contact</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Sharma"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-3 py-2.5 text-[16px] sm:text-xs text-slate-900 font-mono font-semibold focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              {detectMsg && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 mt-1.5 font-medium">
                  {detectMsg}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Staff Notes / Goals</label>
              <textarea
                rows={2}
                placeholder="Health conditions, workout preferences, or membership remarks..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[16px] sm:text-xs text-slate-900 font-medium focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Sticky Action Footer (Always Visible on Mobile Screen) */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-xs shrink-0 flex items-center justify-between gap-3 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 sm:px-5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 flex-1 sm:flex-initial px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              <span>{submitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
