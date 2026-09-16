"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Calendar,
  CreditCard,
  Fingerprint,
  Snowflake,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  Activity,
  HeartHandshake,
  Edit2,
  Plus,
} from "lucide-react";
import { formatINR, formatDate, formatTime } from "@/lib/utils";
import { AllocateMembershipModal } from "@/components/members/AllocateMembershipModal";
import { EditMemberModal } from "@/components/members/EditMemberModal";

interface MemberDetailClientProps {
  memberId: string;
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

export default function MemberDetailClient({ memberId, user }: MemberDetailClientProps) {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "memberships" | "billing" | "attendance" | "comms">("overview");

  // Freeze action state
  const [freezeReason, setFreezeReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchMember = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/members/${memberId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMember(json.data);
      }
    } catch (err) {
      console.error("Failed to load member profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [memberId]);

  const handleFreeze = async (membershipId: string) => {
    if (!freezeReason.trim()) {
      alert("Please provide a reason for freezing membership (e.g., Medical Injury, Travel).");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/memberships/${membershipId}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: freezeReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Freeze failed");
      setFreezeReason("");
      fetchMember();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreeze = async (membershipId: string) => {
    if (!confirm("Unfreeze this membership today and automatically extend the expiry date?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/memberships/${membershipId}/unfreeze`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Unfreeze failed");
      fetchMember();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout user={user}>
        <div className="py-20 text-center text-xs text-slate-400">Loading member 360° profile...</div>
      </AppLayout>
    );
  }

  if (!member) {
    return (
      <AppLayout user={user}>
        <div className="py-20 text-center text-xs text-rose-500 font-medium">Member profile not found.</div>
      </AppLayout>
    );
  }

  const activeMembership = member.memberships?.find((m: any) => m.status === "ACTIVE" || m.status === "FROZEN");

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-6xl">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/members")}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Member Directory</span>
          </button>
        </div>

        {/* Member Header Profile Card */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-2xl flex items-center justify-center shrink-0">
                {member.firstName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-slate-900">
                    {member.firstName} {member.lastName}
                  </h1>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                    {member.memberCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      member.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : member.status === "FROZEN"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium mt-2">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {member.phone}
                  </span>
                  {member.email && <span>{member.email}</span>}
                  <span>Enrolled on {formatDate(member.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
              <button
                onClick={() => setEditOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Edit Details</span>
              </button>

              <button
                onClick={() => setAllocateOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                <span>Allocate Plan</span>
              </button>

              <a
                href={`https://wa.me/91${member.phone.replace(/\D/g, "").slice(-10)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto text-xs font-bold">
          {[
            { id: "overview", label: "Overview & Health", icon: User },
            { id: "memberships", label: "Memberships & Freeze", icon: Calendar },
            { id: "billing", label: "Invoices & Receipts", icon: Receipt },
            { id: "attendance", label: "Attendance Punch Logs", icon: Fingerprint },
            { id: "comms", label: "WhatsApp & Alerts Log", icon: MessageCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                  isSelected
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-emerald-600" />
                <span>Personal & Emergency Details</span>
              </h3>
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Gender</span>
                  <span className="text-slate-900 font-semibold capitalize">{member.gender.toLowerCase()}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Date of Birth</span>
                  <span className="text-slate-900 font-semibold">{formatDate(member.dateOfBirth)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Assigned Trainer</span>
                  <span className="text-slate-900 font-semibold">{member.assignedTrainer?.fullName || "None assigned"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Emergency Contact</span>
                  <span className="text-slate-900 font-semibold">{member.emergencyContactName || "Not specified"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Emergency Phone</span>
                  <span className="text-slate-900 font-semibold">{member.emergencyContactPhone || "Not specified"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Fitness & Health Profiling</span>
              </h3>
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Primary Fitness Goal</span>
                  <span className="text-slate-900 font-semibold">{member.healthMetrics?.goal || "General Fitness"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Weight (kg)</span>
                  <span className="text-slate-900 font-semibold">{member.healthMetrics?.weightKg ? `${member.healthMetrics.weightKg} kg` : "-"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Height (cm)</span>
                  <span className="text-slate-900 font-semibold">{member.healthMetrics?.heightCm ? `${member.healthMetrics.heightCm} cm` : "-"}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Medical Clearances</span>
                  <span className="text-slate-900 font-semibold">{member.healthMetrics?.medicalNotes || "Normal / None"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "memberships" && (
          <div className="space-y-6">
            {/* Active Membership Status Banner */}
            {activeMembership ? (
              <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 font-mono">
                      {activeMembership.planVersion?.plan?.name}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      {activeMembership.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 mt-1">
                    Valid from <strong className="text-slate-900">{formatDate(activeMembership.startDate)}</strong> to{" "}
                    <strong className="text-slate-900">{formatDate(activeMembership.endDate)}</strong>
                  </div>
                  {activeMembership.frozenDaysTotal > 0 && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      ❄️ Extended by {activeMembership.frozenDaysTotal} frozen days (Original expiry was {formatDate(activeMembership.originalEndDate)})
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeMembership.status === "ACTIVE" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Freeze reason..."
                        value={freezeReason}
                        onChange={(e) => setFreezeReason(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        onClick={() => handleFreeze(activeMembership.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Snowflake className="h-3.5 w-3.5" />
                        <span>Freeze</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUnfreeze(activeMembership.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Unfreeze Today</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No active membership plan on record. Assign a membership plan to activate access.
              </div>
            )}

            {/* Historical Subscriptions Table */}
            <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">Subscription History</span>
                <button
                  onClick={() => setAllocateOpen(true)}
                  className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Allocate New Plan</span>
                </button>
              </div>
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Start Date</th>
                    <th className="px-5 py-3">End Date</th>
                    <th className="px-5 py-3">Frozen Days</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {member.memberships?.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-slate-900">{m.planVersion?.plan?.name}</td>
                      <td className="px-5 py-3 text-slate-500 font-medium">{formatDate(m.startDate)}</td>
                      <td className="px-5 py-3 text-slate-500 font-medium">{formatDate(m.endDate)}</td>
                      <td className="px-5 py-3 text-blue-600 font-semibold">{m.frozenDaysTotal} days</td>
                      <td className="px-5 py-3 capitalize font-semibold">{m.status.toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-800">
              Tax Invoices & Payment Ledger
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Issued Date</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Paid Amount</th>
                  <th className="px-5 py-3">Balance Due</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {member.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-emerald-700 font-bold">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-slate-500 font-medium">{formatDate(inv.issuedAt)}</td>
                    <td className="px-5 py-3 font-bold font-mono text-slate-900">{formatINR(inv.totalAmount)}</td>
                    <td className="px-5 py-3 font-mono text-emerald-700 font-semibold">{formatINR(inv.paidAmount)}</td>
                    <td className="px-5 py-3 font-mono font-bold">
                      {Number(inv.balanceAmount) > 0 ? (
                        <span className="text-rose-600">{formatINR(inv.balanceAmount)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-800">
              Recent Biometric & Front-Desk Punches
            </div>
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Punch Type</th>
                  <th className="px-5 py-3">Mode / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {member.attendanceRecords?.map((att: any) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900">
                      {formatDate(att.punchTime)} at {formatTime(att.punchTime)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          att.punchType === "CHECK_IN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {att.punchType === "CHECK_IN" ? "🟢 Check In" : "🟠 Check Out"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 capitalize font-medium">
                      {att.device?.deviceName || att.verificationMode.toLowerCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "comms" && (
          <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-800">
              WhatsApp & Email Communication Log
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {member.communicationLogs?.length > 0 ? (
                member.communicationLogs.map((log: any) => (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-emerald-700 uppercase text-[10px] tracking-wider font-mono">
                          {log.channel}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 text-[11px] font-medium">{formatDate(log.createdAt)} at {formatTime(log.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 font-medium">{log.messageContent}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {log.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No automated messages recorded for this member.</div>
              )}
            </div>
          </div>
        )}
        {/* Allocate Membership Modal */}
        <AllocateMembershipModal
          isOpen={allocateOpen}
          onClose={() => setAllocateOpen(false)}
          onSuccess={() => fetchMember()}
          member={member}
        />

        {/* Edit Member Profile Modal */}
        <EditMemberModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => fetchMember()}
          member={member}
        />
      </div>
    </AppLayout>
  );
}
