"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCheck2,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

interface AuditLogsClientProps {
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

export default function AuditLogsClient({ user }: AuditLogsClientProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);
      params.set("limit", "100");

      const res = await fetch(`/api/v1/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs || []);
        setTotalCount(json.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes("PAYMENT")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.includes("FROZEN") || action.includes("CANCEL")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (action.includes("UNFROZEN") || action.includes("RENEW")) {
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    }
    if (action.includes("WEBHOOK")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    if (action.includes("MEMBER")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <Lock className="h-6 w-6 text-emerald-600" />
              Security & Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable forensic audit trail capturing all financial, member lifecycle, and system operations
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            Refresh Trail
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Operation:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent border-none text-emerald-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white text-slate-900">All Operations</option>
                <option value="MEMBER_CREATED" className="bg-white text-slate-900">MEMBER_CREATED</option>
                <option value="PAYMENT_RECORDED" className="bg-white text-slate-900">PAYMENT_RECORDED</option>
                <option value="MEMBERSHIP_FROZEN" className="bg-white text-slate-900">MEMBERSHIP_FROZEN</option>
                <option value="MEMBERSHIP_UNFROZEN" className="bg-white text-slate-900">MEMBERSHIP_UNFROZEN</option>
                <option value="ONLINE_PAYMENT_WEBHOOK_RECEIVED" className="bg-white text-slate-900">ONLINE_PAYMENT_WEBHOOK</option>
                <option value="CALENDAR_EVENT_CREATED" className="bg-white text-slate-900">CALENDAR_EVENT_CREATED</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-medium">
              <span>Entity:</span>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="bg-transparent border-none text-emerald-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white text-slate-900">All Entities</option>
                <option value="MEMBER" className="bg-white text-slate-900">MEMBER</option>
                <option value="PAYMENT" className="bg-white text-slate-900">PAYMENT</option>
                <option value="MEMBERSHIP" className="bg-white text-slate-900">MEMBERSHIP</option>
                <option value="INVOICE" className="bg-white text-slate-900">INVOICE</option>
                <option value="CALENDAR_EVENT" className="bg-white text-slate-900">CALENDAR_EVENT</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-bold">{logs.length}</strong> of{" "}
            <strong className="text-slate-900 font-bold">{totalCount}</strong> recorded events
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4 w-8"></th>
                  <th className="py-3.5 px-4">Timestamp (IST)</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Staff User</th>
                  <th className="py-3.5 px-4">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No audit logs match current filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const dateFormatted = format(new Date(log.createdAt), "dd MMM yyyy, hh:mm:ss a");

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">
                            {dateFormatted}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-semibold">
                            {log.entityType}
                          </td>
                          <td className="py-3.5 px-4">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                                  {log.user.fullName.charAt(0)}
                                </div>
                                <span className="text-slate-900 font-semibold">{log.user.fullName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({log.user.role})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">
                                System Daemon / Gateway
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                            {log.entityId}
                          </td>
                        </tr>

                        {/* Expanded detail row showing payload changes */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={6} className="p-4 pl-12 border-b border-slate-200/80">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                                    <Code2 className="h-3.5 w-3.5 text-emerald-600" />
                                    New State / Action Payload:
                                  </div>
                                  <pre className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-emerald-700 font-mono overflow-x-auto max-h-48 shadow-xs">
                                    {JSON.stringify(log.newValues || {}, null, 2)}
                                  </pre>
                                </div>

                                <div>
                                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    Previous State (If modified):
                                  </div>
                                  <pre className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 font-mono overflow-x-auto max-h-48 shadow-xs">
                                    {log.oldValues
                                      ? JSON.stringify(log.oldValues, null, 2)
                                      : "No previous state recorded (Creation event)"}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
