"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardMemberModal } from "@/components/members/OnboardMemberModal";
import { Search, UserPlus, Phone, MessageCircle, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
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

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/members?limit=50`;
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

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Member Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage gym enrollments, KYC details, fitness metrics, and subscriptions</p>
          </div>

          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-2 self-start sm:self-auto transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Onboard Member</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone (+91), or member code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs font-medium"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-600 shadow-xs cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Members</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Member</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Gender</th>
                  <th className="px-5 py-3.5">Trainer</th>
                  <th className="px-5 py-3.5">Joined On</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length > 0 ? (
                  members.map((member) => (
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
                        {member.email && <div className="text-[11px] text-slate-500">{member.email}</div>}
                      </td>
                      <td className="px-5 py-3.5 capitalize font-medium text-slate-600">{member.gender.toLowerCase()}</td>
                      <td className="px-5 py-3.5">
                        {member.assignedTrainer?.fullName ? (
                          <span className="font-semibold text-slate-800">{member.assignedTrainer.fullName}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium">{formatDate(member.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        {member.status === "ACTIVE" ? (
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
                        <a
                          href={`https://wa.me/91${member.phone.replace(/\D/g, "").slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 text-[11px] font-bold transition-all shadow-xs"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-xs">
                      {loading ? "Loading member records..." : "No members found matching your search."}
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
    </AppLayout>
  );
}
