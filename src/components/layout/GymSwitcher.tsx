"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Check, Plus, MapPin, Users, Loader2 } from "lucide-react";

interface TenantBranch {
  id: string;
  slug: string;
  businessName: string;
  phone: string;
  address?: {
    city?: string;
    state?: string;
    area?: string;
  };
  memberCount?: number;
  isCurrent?: boolean;
}

interface GymSwitcherProps {
  currentTenant?: {
    businessName: string;
    slug: string;
  };
  userRole?: string;
}

export function GymSwitcher({ currentTenant, userRole }: GymSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<TenantBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/tenants");
      const json = await res.json();
      if (json.success && json.data) {
        setBranches(json.data);
      }
    } catch (e) {
      console.error("Failed to load branches:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = async (branch: TenantBranch) => {
    if (branch.isCurrent) {
      setOpen(false);
      return;
    }

    setSwitchingId(branch.id);
    try {
      const res = await fetch("/api/v1/auth/switch-gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: branch.id }),
      });

      const json = await res.json();
      if (json.success) {
        setOpen(false);
        // Force full refresh to reload all server data
        window.location.reload();
      } else {
        alert(json.error?.message || "Failed to switch gym branch");
      }
    } catch (e) {
      console.error("Switch gym error:", e);
      alert("Network error switching branch");
    } finally {
      setSwitchingId(null);
    }
  };

  const isOwnerOrAdmin = userRole === "GYM_OWNER" || userRole === "SUPER_ADMIN";

  // For Staff / Trainers / Front-Desk: Strictly lock to their assigned gym workspace
  if (!isOwnerOrAdmin) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs">
        <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900 leading-tight">
            {currentTenant?.businessName || "My Gym Branch"}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Assigned Branch</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-800 transition-all shadow-2xs group text-left max-w-full"
        title="Switch active gym location (Owner Only)"
      >
        <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1 truncate max-w-[95px] sm:max-w-[160px]">
            <span className="truncate">{currentTenant?.businessName || "Select Gym"}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium truncate">Owner Workspace</span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 transition-transform ml-0.5 shrink-0" />
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-16 sm:top-auto sm:mt-2 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Gym Chain Network</div>
              <div className="text-[10px] text-slate-500">Select active branch to manage</div>
            </div>
            {isOwnerOrAdmin && (
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>New Branch</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {loading && branches.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Loading chain locations...</span>
              </div>
            ) : branches.length > 0 ? (
              branches.map((b) => {
                const isSelected = b.isCurrent || b.businessName === currentTenant?.businessName;
                const isSwitching = switchingId === b.id;
                const city = b.address?.city || b.address?.area || "India";

                return (
                  <button
                    key={b.id}
                    onClick={() => handleSwitch(b)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-emerald-50 border border-emerald-200/80 text-emerald-900"
                        : "hover:bg-slate-50 border border-transparent text-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          <span>{b.businessName}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-2">
                          <span>{city}</span>
                          {b.memberCount !== undefined && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              • <Users className="h-2.5 w-2.5" /> {b.memberCount} members
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isSwitching ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      ) : isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-600">
                          Switch
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">No branches found.</div>
            )}
          </div>

          {isOwnerOrAdmin && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Manage All Gym Locations in Settings →</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
