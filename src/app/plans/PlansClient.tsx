"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  CalendarCheck,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  Globe,
  ExternalLink,
  Sparkles,
  Clock,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface PlansClientProps {
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

export default function PlansClient({ user }: PlansClientProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    durationDays: 30,
    basePrice: 2500,
    joiningFee: 0,
    description: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    durationDays: 30,
    basePrice: 2500,
    joiningFee: 0,
    description: "",
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirm state
  const [deletingPlan, setDeletingPlan] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast state
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/plans");
      const json = await res.json();
      if (json.success && json.data) {
        setPlans(json.data);
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/v1/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          durationDays: Number(createForm.durationDays),
          basePrice: Number(createForm.basePrice),
          joiningFee: Number(createForm.joiningFee),
          description: createForm.description || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create plan");
      }

      setIsCreateOpen(false);
      setCreateForm({ name: "", durationDays: 30, basePrice: 2500, joiningFee: 0, description: "" });
      showToast("Membership plan created successfully!");
      fetchPlans();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      durationDays: plan.durationDays,
      basePrice: Number(plan.basePrice),
      joiningFee: Number(plan.joiningFee || 0),
      description: plan.description || "",
      isActive: plan.isActive,
    });
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/v1/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          durationDays: Number(editForm.durationDays),
          basePrice: Number(editForm.basePrice),
          joiningFee: Number(editForm.joiningFee),
          description: editForm.description || null,
          isActive: editForm.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update plan");
      }

      setIsEditOpen(false);
      showToast("Membership plan updated successfully!");
      fetchPlans();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/v1/plans/${deletingPlan.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to remove plan");
      }

      setDeletingPlan(null);
      showToast("Plan deactivated / removed successfully!");
      fetchPlans();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isOwnerOrAdmin = user.role === "GYM_OWNER" || user.role === "SUPER_ADMIN" || user.role === "MANAGER";

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Membership Plans
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure fitness packages, duration, pricing versions, and statutory GST (SAC 999723)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {successToast && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 shadow-xs animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{successToast}</span>
              </div>
            )}

            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Multi-Channel Sync Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 border border-slate-700/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-lime-400/20 text-lime-400 flex items-center justify-center border border-lime-400/30 shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                <span>Multi-Channel Real-Time Sync</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Plans saved here publish immediately across the <strong>Be Free Fitness Website</strong>, <strong>Client Self-Registration (1-hour link)</strong>, and front-desk billing.
              </p>
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span>View Website Passes</span>
            <ExternalLink className="h-3 w-3 text-lime-400" />
          </a>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.length > 0 ? (
            plans.map((plan) => {
              const latestVersion = plan.versions?.[0];
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 group-hover:h-1.5 transition-all" />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                        {plan.durationDays} DAYS
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        v{latestVersion?.versionNumber || 1}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{plan.description}</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        {formatINR(plan.basePrice)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {Number(plan.joiningFee) > 0
                          ? `+ ${formatINR(plan.joiningFee)} Joining Fee`
                          : "Zero Joining Fee"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <Globe className="h-3 w-3 text-emerald-600" />
                        <span>Live on Web</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>

                    {isOwnerOrAdmin && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit Plan</span>
                        </button>
                        <button
                          onClick={() => setDeletingPlan(plan)}
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs transition-colors"
                          title="Remove or deactivate plan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>Loading plans...</span>
                </div>
              ) : (
                "No membership plans found for this branch. Click 'Create New Plan' above."
              )}
            </div>
          )}
        </div>

        {/* Create Plan Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Create Membership Plan</h2>
                    <p className="text-xs text-slate-500">Add a new plan with version tracking</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{createError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 3-Month Transformation Plan"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration (Days) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={createForm.durationDays}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, durationDays: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: "1D", days: 1 },
                        { label: "1 Mo", days: 30 },
                        { label: "3 Mo", days: 90 },
                        { label: "6 Mo", days: 180 },
                        { label: "1 Yr", days: 365 },
                      ].map((p) => (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, durationDays: p.days })}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                            createForm.durationDays === p.days
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Base Price (₹) *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={createForm.basePrice}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, basePrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    One-time Joining Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.joiningFee}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, joiningFee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Includes cardio, weights, steam, and locker access..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {createLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{createLoading ? "Saving..." : "Save Plan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Plan Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <Edit2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Edit Membership Plan</h2>
                    <p className="text-xs text-slate-500">Update rates and duration parameters</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditPlan} className="p-6 space-y-4">
                {editError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{editError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                  <input
                    required
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration (Days) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={editForm.durationDays}
                      onChange={(e) =>
                        setEditForm({ ...editForm, durationDays: parseInt(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { label: "1D", days: 1 },
                        { label: "1 Mo", days: 30 },
                        { label: "3 Mo", days: 90 },
                        { label: "6 Mo", days: 180 },
                        { label: "1 Yr", days: 365 },
                      ].map((p) => (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, durationDays: p.days })}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                            editForm.durationDays === p.days
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Base Price (₹) *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.basePrice}
                      onChange={(e) =>
                        setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    One-time Joining Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.joiningFee}
                    onChange={(e) =>
                      setEditForm({ ...editForm, joiningFee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {editLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editLoading ? "Updating..." : "Update Plan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Membership Plan?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to deactivate or remove <strong>{deletingPlan.name}</strong>?
                  Active member subscriptions will be safely preserved.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingPlan(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs flex items-center gap-1.5"
                >
                  {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{deleteLoading ? "Removing..." : "Yes, Remove Plan"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
