"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Key,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Search,
  Filter,
  Check,
  X,
  Phone,
  Mail,
  Building2,
  RefreshCw,
} from "lucide-react";

interface BranchOption {
  id: string;
  slug: string;
  businessName: string;
}

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  tenantId: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tenant?: {
    id: string;
    slug: string;
    businessName: string;
  };
}

interface StaffManagementSectionProps {
  branches: BranchOption[];
  currentTenantId?: string;
}

const ROLE_INFO: Record<string, { label: string; badgeClass: string; desc: string }> = {
  GYM_OWNER: {
    label: "Gym Owner",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    desc: "Complete master control across all gym branches & financial ledger",
  },
  MANAGER: {
    label: "Branch Manager",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    desc: "Manage members, operational plans, refunds, and daily staff shift",
  },
  FRONT_DESK: {
    label: "Front Desk Reception",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    desc: "Onboard new walk-in members, record counter cash/UPI fees, manual check-in",
  },
  TRAINER: {
    label: "Personal Trainer",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    desc: "View assigned training clients, workout assessments & progress tracking",
  },
  ACCOUNTANT: {
    label: "Accountant",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    desc: "GST invoices, payment ledgers, daily register reconciliation & reports",
  },
};

export function StaffManagementSection({ branches, currentTenantId }: StaffManagementSectionProps) {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");

  // Create Staff Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "FRONT_DESK",
    tenantId: currentTenantId || (branches[0]?.id || ""),
  });

  // Edit / Reassign Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    role: "FRONT_DESK",
    tenantId: "",
    newPassword: "",
    isActive: true,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/v1/staff?";
      if (selectedBranch !== "ALL") url += `tenantId=${encodeURIComponent(selectedBranch)}&`;
      if (selectedRole !== "ALL") url += `role=${encodeURIComponent(selectedRole)}&`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load staff list");
      }
      setStaffList(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [selectedBranch, selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch("/api/v1/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to create staff login");
      }

      setCreateSuccess(`✓ Account for ${json.data.fullName} created successfully!`);
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateSuccess(null);
        setCreateForm({
          fullName: "",
          email: "",
          password: "",
          phone: "",
          role: "FRONT_DESK",
          tenantId: currentTenantId || (branches[0]?.id || ""),
        });
        fetchStaff();
      }, 1200);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setEditForm({
      fullName: staff.fullName,
      phone: staff.phone || "",
      role: staff.role,
      tenantId: staff.tenantId,
      newPassword: "",
      isActive: staff.isActive,
    });
    setEditModalOpen(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setUpdating(true);

    try {
      const payload: any = {
        fullName: editForm.fullName,
        phone: editForm.phone,
        role: editForm.role,
        tenantId: editForm.tenantId,
        isActive: editForm.isActive,
      };

      if (editForm.newPassword && editForm.newPassword.trim() !== "") {
        payload.password = editForm.newPassword.trim();
      }

      const res = await fetch(`/api/v1/staff/${editingStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update staff account");
      }

      setEditModalOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffUser) => {
    if (staff.role === "GYM_OWNER") {
      alert("The Gym Owner master account cannot be deleted.");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to remove the staff login for "${staff.fullName}" (${staff.email})?\n\nThey will no longer be able to log in to this gym branch.`
    );
    if (!confirmed) return;

    setDeletingId(staff.id);
    try {
      const res = await fetch(`/api/v1/staff/${staff.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to remove staff member");
      }
      fetchStaff();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Staff Logins & Branch Permissions</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                {staffList.length} Accounts
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Create staff accounts, assign work branches, and configure operational access roles
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register New Staff Login</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold whitespace-nowrap">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.businessName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold whitespace-nowrap">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Roles</option>
              <option value="MANAGER">Branch Manager</option>
              <option value="FRONT_DESK">Front Desk</option>
              <option value="TRAINER">Trainer</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="GYM_OWNER">Owner</option>
            </select>
          </div>

          <button
            onClick={fetchStaff}
            title="Refresh staff list"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Staff Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned Gym Branch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && staffList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span>Loading staff directory...</span>
                  </div>
                </td>
              </tr>
            ) : staffList.length > 0 ? (
              staffList.map((staff) => {
                const roleMeta = ROLE_INFO[staff.role] || {
                  label: staff.role,
                  badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
                  desc: "",
                };
                const branchName = staff.tenant?.businessName || "Multi-Branch Owner";
                const isOwner = staff.role === "GYM_OWNER";

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isOwner
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {staff.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{staff.fullName}</span>
                            {isOwner && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                Master Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                            <span>{staff.email}</span>
                            {staff.phone && <span>• {staff.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badgeClass}`}
                        title={roleMeta.desc}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{branchName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(staff)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 text-slate-500 transition-colors"
                          title="Edit staff details, role, or reassign branch"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {!isOwner && (
                          <button
                            onClick={() => handleDeleteStaff(staff)}
                            disabled={deletingId === staff.id}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                            title="Remove staff account"
                          >
                            {deletingId === staff.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No staff accounts found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Register New Staff Login */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Register Staff Login</h2>
                  <p className="text-xs text-slate-500">Create staff credentials and assign to a gym branch</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98160 00000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Email (Login ID) *</label>
                  <input
                    required
                    type="email"
                    placeholder="suresh@befreefitness.in"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    required
                    type="text"
                    placeholder="Min 6 characters (e.g. Staff@123)"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Gym Branch *</label>
                <div className="relative">
                  <select
                    required
                    value={createForm.tenantId}
                    onChange={(e) => setCreateForm({ ...createForm, tenantId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.businessName}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Staff will be automatically scoped and locked to this gym branch upon login
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operational Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "FRONT_DESK", title: "Front Desk", desc: "Member check-ins, onboarding & counter fee collection" },
                    { id: "MANAGER", title: "Branch Manager", desc: "Operations, plans, reports & shift management" },
                    { id: "TRAINER", title: "Trainer", desc: "Assigned member workouts & progress assessments" },
                    { id: "ACCOUNTANT", title: "Accountant", desc: "Invoicing, GST ledgers & reconciliation" },
                  ].map((r) => {
                    const isSelected = createForm.role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setCreateForm({ ...createForm, role: r.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-purple-50 border-purple-400 ring-1 ring-purple-500/20 shadow-2xs"
                            : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>{r.title}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-purple-600" />}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{creating ? "Creating Account..." : "Create Staff Login"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit / Reassign Staff */}
      {editModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Manage Staff Account</h2>
                  <p className="text-xs text-slate-500">{editingStaff.fullName} ({editingStaff.email})</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reassign Gym Branch</label>
                <select
                  value={editForm.tenantId}
                  onChange={(e) => setEditForm({ ...editForm, tenantId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.businessName}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Switching this immediately updates the staff member's working branch
                </span>
              </div>

              {editingStaff.role !== "GYM_OWNER" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operational Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  >
                    <option value="FRONT_DESK">Front Desk Reception</option>
                    <option value="MANAGER">Branch Manager</option>
                    <option value="TRAINER">Trainer</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Password (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty to keep existing password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              {editingStaff.role !== "GYM_OWNER" && (
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Account Status</div>
                    <div className="text-[11px] text-slate-500">Allow this staff member to log in to the console</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="h-4 w-4 accent-purple-600 rounded"
                  />
                </label>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{updating ? "Saving Changes..." : "Save Staff Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
