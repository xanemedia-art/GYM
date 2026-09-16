"use client";

import React from "react";
import { Fingerprint, Clock, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface AttendanceRecordItem {
  id: string;
  punchTime: string;
  punchType: string;
  verificationMode: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    status: string;
    photoUrl?: string | null;
  };
}

interface LiveAttendanceFeedProps {
  records: AttendanceRecordItem[];
  onManualPunchClick: () => void;
}

export function LiveAttendanceFeed({ records, onManualPunchClick }: LiveAttendanceFeedProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Fingerprint className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Attendance Stream</h3>
            <p className="text-[11px] text-slate-500 font-medium">Real-time biometric & front-desk check-ins</p>
          </div>
        </div>

        <button
          onClick={onManualPunchClick}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 transition-all flex items-center gap-1 shadow-xs"
        >
          <span>Manual Punch</span>
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {records.length > 0 ? (
          records.map((record) => {
            const status = record.member.status;

            return (
              <div
                key={record.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center font-black text-xs text-emerald-800 shrink-0">
                    {record.member.firstName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {record.member.firstName} {record.member.lastName}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {record.member.memberCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                      <span className="capitalize">{record.verificationMode.toLowerCase()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatTime(record.punchTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {status === "ACTIVE" ? (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  ) : status === "EXPIRING_SOON" ? (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      <AlertTriangle className="h-3 w-3" />
                      Expiring
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      <XCircle className="h-3 w-3" />
                      Expired
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No check-in activity recorded today yet.
          </div>
        )}
      </div>
    </div>
  );
}
