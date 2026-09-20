"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UpiStandeeCard } from "@/components/settings/UpiStandeeCard";
import {
  Settings,
  Building2,
  Receipt,
  Bell,
  Check,
  Save,
  MapPin,
  Users,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

interface SettingsClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      id: string;
      businessName: string;
      legalName: string;
      gstin: string;
      phone: string;
      email: string;
      slug: string;
      settings: any;
    };
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const tenant = user.tenant;
  const settings = tenant?.settings;

  const [saved, setSaved] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // New Branch Modal state
  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    businessName: "",
    slug: "",
    legalName: "",
    gstin: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    street: "",
    pincode: "",
    invoicePrefix: "FZ",
  });
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await fetch("/api/v1/tenants");
      const json = await res.json();
      if (json.success && json.data) {
        setBranches(json.data);
      }
    } catch (e) {
      console.error("Failed to load branches:", e);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSwitchGym = async (branchId: string) => {
    setSwitchingId(branchId);
    try {
      const res = await fetch("/api/v1/auth/switch-gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: branchId }),
      });
      const json = await res.json();
      if (json.success) {
        window.location.reload();
      } else {
        alert(json.error?.message || "Failed to switch branch");
      }
    } catch (e) {
      alert("Error switching branch");
    } finally {
      setSwitchingId(null);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBranch(true);
    setBranchError(null);

    try {
      const res = await fetch("/api/v1/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create branch");
      }

      setNewBranchOpen(false);
      setBranchForm({
        businessName: "",
        slug: "",
        legalName: "",
        gstin: "",
        phone: "",
        email: "",
        city: "",
        state: "",
        street: "",
        pincode: "",
        invoicePrefix: "FZ",
      });
      fetchBranches();
    } catch (err: any) {
      setBranchError(err.message);
    } finally {
      setCreatingBranch(false);
    }
  };

  const [profileForm, setProfileForm] = useState({
    businessName: tenant?.businessName || "Be Free Fitness",
    legalName: tenant?.legalName || "Be Free Fitness Private Limited",
    gstin: tenant?.gstin || "07AAAAF1234F1Z5",
    phone: tenant?.phone || "+91 9876543210",
    invoicePrefix: settings?.invoicePrefix || "BFF",
    gstRatePercentage: settings?.gstRatePercentage ? Number(settings.gstRatePercentage) : 18.0,
    attendanceDuplicateWindowMin: settings?.attendanceDuplicateWindowMin || 5,
    autoWhatsappBirthdays: settings?.autoWhatsappBirthdays ?? true,
    autoWhatsappReminders: settings?.autoWhatsappReminders ?? true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/v1/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update settings");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveUpi = async (upiId: string, upiMerchantName: string) => {
    const res = await fetch("/api/v1/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upiId, upiMerchantName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Failed to update UPI settings");
    fetchBranches();
  };

  const isOwnerOrAdmin = user.role === "GYM_OWNER" || user.role === "SUPER_ADMIN";

  return (
    <AppLayout user={user}>
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Chain & System Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage multi-branch gym locations, statutory GST parameters (SAC 999723), and automated communication triggers
            </p>
          </div>

          {saved && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 shadow-xs animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Settings updated successfully</span>
            </div>
          )}
        </div>

        {/* 1. Multi-Branch Gym Network (For Large Gym Chains) */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Gym Chain Branch Network</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                    {branches.length} Locations
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Switch active management context or expand to new branch locations
                </p>
              </div>
            </div>

            {isOwnerOrAdmin && (
              <button
                onClick={() => setNewBranchOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Register New Branch</span>
              </button>
            )}
          </div>

          {/* Branch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {loadingBranches && branches.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Loading chain network...</span>
              </div>
            ) : branches.map((b) => {
              const isCurrent = b.isCurrent || b.id === tenant?.id;
              const isSwitching = switchingId === b.id;
              const city = b.address?.city || "India";

              return (
                <div
                  key={b.id}
                  className={`rounded-xl p-4 border transition-all relative flex flex-col justify-between ${
                    isCurrent
                      ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{city}</span>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          Active Context
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">
                          Branch
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1">{b.businessName}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mb-2">
                      GSTIN: {b.gstin || "Not Registered"}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3 pt-2 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Users className="h-3 w-3 text-slate-400" />
                        <strong>{b.memberCount || 0}</strong> Members
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Prefix: <strong className="font-mono text-slate-700">{b.invoicePrefix}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60">
                    {isCurrent ? (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        <span>Currently Managing This Branch</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSwitchGym(b.id)}
                        disabled={isSwitching}
                        className="w-full py-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                      >
                        {isSwitching ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                            <span>Switching...</span>
                          </>
                        ) : (
                          <>
                            <span>Switch to This Branch</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form for current branch settings */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Active Branch Profile */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Active Branch Profile ({tenant?.businessName})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Registered Entity</label>
                <input
                  type="text"
                  value={profileForm.legalName}
                  onChange={(e) => setProfileForm({ ...profileForm, legalName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number (India)</label>
                <input
                  type="text"
                  value={profileForm.gstin}
                  onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 2. Branch Counter UPI ID & Printable Standee QR Generator */}
          <UpiStandeeCard
            initialUpiId={settings?.upiId}
            initialMerchantName={settings?.upiMerchantName || tenant?.businessName || "Be Free Fitness"}
            gymName={tenant?.businessName || "Be Free Fitness"}
            onSave={handleSaveUpi}
          />

          {/* Invoicing & GST */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60">
                <Receipt className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Invoicing & Tax Configuration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Invoice Prefix</label>
                <input
                  type="text"
                  value={profileForm.invoicePrefix}
                  onChange={(e) => setProfileForm({ ...profileForm, invoicePrefix: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">E.g., BFF-DELHI/26-27/0001</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                <input
                  type="number"
                  value={profileForm.gstRatePercentage}
                  onChange={(e) => setProfileForm({ ...profileForm, gstRatePercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">SAC 999723 standard rate</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Punch Dedup Window (Mins)</label>
                <input
                  type="number"
                  value={profileForm.attendanceDuplicateWindowMin}
                  onChange={(e) => setProfileForm({ ...profileForm, attendanceDuplicateWindowMin: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Drop turnstile echo punches</span>
              </div>
            </div>
          </div>

          {/* Automation Rules */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                <Bell className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">WhatsApp & Notification Rules</h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">Automated WhatsApp Birthday Greetings</div>
                  <div className="text-[11px] text-slate-500">Dispatch celebratory greetings at 06:00 AM IST to birthday members</div>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.autoWhatsappBirthdays}
                  onChange={(e) => setProfileForm({ ...profileForm, autoWhatsappBirthdays: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">Automated Expiry & Renewal Reminders</div>
                  <div className="text-[11px] text-slate-500">Notify members 7 days, 3 days, and 1 day before membership expiry</div>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.autoWhatsappReminders}
                  onChange={(e) => setProfileForm({ ...profileForm, autoWhatsappReminders: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600 rounded"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{savingSettings ? "Saving Changes..." : "Save Configuration"}</span>
          </button>
        </form>

        {/* Modal to Register New Gym Branch */}
        {newBranchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Register New Gym Branch</h2>
                    <p className="text-xs text-slate-500">Expand your gym chain with an additional location</p>
                  </div>
                </div>
                <button
                  onClick={() => setNewBranchOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="p-6 space-y-4">
                {branchError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{branchError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Be Free Fitness (Hyderabad)"
                      value={branchForm.businessName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                        setBranchForm({ ...branchForm, businessName: name, slug: autoSlug });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">URL Identifier (Slug) *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. fitzone-hyderabad"
                      value={branchForm.slug}
                      onChange={(e) => setBranchForm({ ...branchForm, slug: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={branchForm.city}
                      onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Telangana"
                      value={branchForm.state}
                      onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      placeholder="+91 98490 11223"
                      value={branchForm.phone}
                      onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="hyderabad@fitzone.in"
                      value={branchForm.email}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN (India)</label>
                    <input
                      type="text"
                      placeholder="36AAAAF1234F1Z1"
                      value={branchForm.gstin}
                      onChange={(e) => setBranchForm({ ...branchForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix *</label>
                    <input
                      required
                      type="text"
                      placeholder="FZ-HYD"
                      value={branchForm.invoicePrefix}
                      onChange={(e) => setBranchForm({ ...branchForm, invoicePrefix: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Street</label>
                  <input
                    type="text"
                    placeholder="e.g. Road No 36, Jubilee Hills"
                    value={branchForm.street}
                    onChange={(e) => setBranchForm({ ...branchForm, street: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBranchOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBranch}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {creatingBranch && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{creatingBranch ? "Registering..." : "Register Branch"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
