"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardMemberModal } from "@/components/members/OnboardMemberModal";
import { RenewMembershipModal } from "@/components/members/RenewMembershipModal";
import {
  Search,
  UserPlus,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  QrCode,
  Users,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MembersClientProps {
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

export default function MembersClient({ user }: MembersClientProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [selectedMemberForRenew, setSelectedMemberForRenew] = useState<any | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const handleDeleteMember = async (member: any) => {
    const fullName = `${member.firstName} ${member.lastName}`;
    const confirmed = confirm(
      `Are you sure you want to remove and delete member "${fullName}" (${member.memberCode})?\n\nThis will remove their profile and deactivate their gym pass.`
    );
    if (!confirmed) return;

    setDeletingMemberId(member.id);
    try {
      const res = await fetch(`/api/v1/members/${member.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to delete member");
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      fetchMembers();
    } catch (err: any) {
      alert(err.message || "Failed to delete member");
    } finally {
      setDeletingMemberId(null);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/members?limit=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setMembers(json.data);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const leadCount = members.filter((m) => m.status === "LEAD").length;

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Member Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record active members, verify Gate QR walk-in inquiries, and manage offline renewals
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/gate-qr"
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <QrCode className="h-4 w-4 text-emerald-600" />
              <span>Gate QR Poster</span>
            </Link>

            <button
              onClick={() => setIsOnboardOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="-mx-3.5 px-3.5 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: "", label: "All Members" },
            { id: "ACTIVE", label: "Active" },
            { id: "EXPIRING_SOON", label: "Expiring Soon" },
            { id: "EXPIRED", label: "Expired" },
            { id: "LEAD", label: "Gate Inquiries (Walk-ins)", badge: leadCount > 0 ? leadCount : undefined },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 shrink-0 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member name, phone, or ID code..."
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  fetchMembers();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Mobile View: Dedicated Member Cards (md:hidden) */}
        <div className="md:hidden space-y-3">
          {members.length > 0 ? (
            members.map((member) => {
              const activeMembership = member.memberships?.[0];
              const isLead = member.status === "LEAD";
              const cleanPhone = member.phone.replace(/\D/g, "").slice(-10);

              return (
                <div
                  key={member.id}
                  className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs space-y-3"
                >
                  {/* Card Header: Avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/members/${member.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center font-black text-sm text-emerald-800 shrink-0">
                        {member.firstName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1 truncate">
                          <span className="truncate">{member.firstName} {member.lastName}</span>
                          <ArrowUpRight className="h-3 w-3 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{member.memberCode}</div>
                      </div>
                    </Link>

                    <div className="shrink-0">
                      {isLead ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Sparkles className="h-3 w-3" />
                          Gate Inquiry
                        </span>
                      ) : member.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : member.status === "EXPIRING_SOON" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="h-3 w-3" />
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Details: Phone + Plan Pill */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 gap-2">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-mono font-bold"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{member.phone}</span>
                    </a>

                    <div className="text-right">
                      {isLead ? (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          Walk-in Lead
                        </span>
                      ) : activeMembership ? (
                        <div className="text-[11px]">
                          <span className="font-bold text-slate-800">
                            {activeMembership.planVersion?.plan?.name || "Active Plan"}
                          </span>
                          <span className="text-slate-400 font-mono block text-[10px]">
                            Ends: {formatDate(activeMembership.endDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">No Plan</span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions: Full Width Ergonomic Tap Targets */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://wa.me/91${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 px-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </a>

                    {isLead ? (
                      <button
                        onClick={() =>
                          setSelectedMemberForRenew({
                            id: member.id,
                            fullName: `${member.firstName} ${member.lastName}`,
                            memberCode: member.memberCode,
                            status: member.status,
                          })
                        }
                        className="flex-1 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Activate Pass</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setSelectedMemberForRenew({
                            id: member.id,
                            fullName: `${member.firstName} ${member.lastName}`,
                            memberCode: member.memberCode,
                            status: member.status,
                            currentPlanName: activeMembership?.planVersion?.plan?.name,
                            currentEndDate: activeMembership?.endDate,
                          })
                        }
                        className="flex-1 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <RefreshCw className="h-4 w-4 text-slate-600" />
                        <span>Renew Plan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={deletingMemberId === member.id}
                      onClick={() => handleDeleteMember(member)}
                      className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-all flex items-center justify-center shrink-0 active:scale-90"
                      title="Delete Member"
                      aria-label={`Delete ${member.firstName} ${member.lastName}`}
                    >
                      {deletingMemberId === member.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-400 text-xs">
              {loading ? "Loading member records..." : "No members found matching your filter."}
            </div>
          )}
        </div>

        {/* Desktop View: Full Members Table (hidden md:block) */}
        <div className="hidden md:block rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Member</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Package / Plan</th>
                  <th className="px-5 py-3.5">Joined On</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length > 0 ? (
                  members.map((member) => {
                    const activeMembership = member.memberships?.[0];
                    const isLead = member.status === "LEAD";

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link href={`/members/${member.id}`} className="flex items-center gap-3 group">
                            <div className="h-9 w-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center font-black text-xs text-emerald-800 shrink-0">
                              {member.firstName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                                {member.firstName} {member.lastName}
                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">{member.memberCode}</div>
                            </div>
                          </Link>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{member.phone}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {isLead ? (
                            <span className="text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                              Gate Walk-in Inquiry
                            </span>
                          ) : activeMembership ? (
                            <div>
                              <span className="font-semibold text-slate-800">
                                {activeMembership.planVersion?.plan?.name || "Active Plan"}
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Ends: {formatDate(activeMembership.endDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">No Active Plan</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 font-medium">
                          {formatDate(member.createdAt)}
                        </td>

                        <td className="px-5 py-3.5">
                          {isLead ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Sparkles className="h-3 w-3" />
                              Gate Inquiry
                            </span>
                          ) : member.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : member.status === "EXPIRING_SOON" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="h-3 w-3" />
                              Expiring Soon
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="h-3 w-3" />
                              Expired
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isLead ? (
                              <button
                                onClick={() =>
                                  setSelectedMemberForRenew({
                                    id: member.id,
                                    fullName: `${member.firstName} ${member.lastName}`,
                                    memberCode: member.memberCode,
                                    status: member.status,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-xs"
                                title="Collect fee offline and activate membership"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Activate Pass</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setSelectedMemberForRenew({
                                    id: member.id,
                                    fullName: `${member.firstName} ${member.lastName}`,
                                    memberCode: member.memberCode,
                                    status: member.status,
                                    currentPlanName: activeMembership?.planVersion?.plan?.name,
                                    currentEndDate: activeMembership?.endDate,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 transition-all shadow-2xs"
                                title="Renew plan with offline cash/UPI payment"
                              >
                                <RefreshCw className="h-3 w-3 text-slate-600" />
                                <span>Renew</span>
                              </button>
                            )}

                            <a
                              href={`https://wa.me/91${member.phone.replace(/\D/g, "").slice(-10)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 text-[11px] font-bold transition-all shadow-2xs"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>

                            <button
                              type="button"
                              disabled={deletingMemberId === member.id}
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shadow-2xs"
                              title="Delete Member"
                              aria-label={`Delete ${member.firstName} ${member.lastName}`}
                            >
                              {deletingMemberId === member.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                      {loading ? "Loading member records..." : "No members found matching your filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OnboardMemberModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSuccess={fetchMembers}
      />

      <RenewMembershipModal
        isOpen={!!selectedMemberForRenew}
        onClose={() => setSelectedMemberForRenew(null)}
        member={selectedMemberForRenew}
        onSuccess={fetchMembers}
      />
    </AppLayout>
  );
}
