"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Clock, Cake, Sparkles, ChevronRight, ArrowUpRight } from "lucide-react";

interface UpcomingMonthData {
  monthName: string;
  year: number;
  monthNumber: number;
  expiringMembers: number;
  birthdays: number;
  events: number;
}

interface UpcomingMonthCardProps {
  upcomingMonth?: UpcomingMonthData | null;
}

export function UpcomingMonthCard({ upcomingMonth }: UpcomingMonthCardProps) {
  if (!upcomingMonth) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
        <div className="h-5 bg-slate-200 rounded w-1/2"></div>
        <div className="h-16 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  const { monthName, year, expiringMembers, birthdays, events } = upcomingMonth;
  const totalUpcomingItems = expiringMembers + birthdays + events;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      {/* Decorative top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{monthName} {year} Forecast</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Upcoming
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Gym schedule & renewals</p>
          </div>
        </div>

        <Link
          href={`/calendar?year=${year}&month=${upcomingMonth.monthNumber}`}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
        >
          <span>View</span>
          <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-2.5 my-3">
        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Renewals</span>
          </div>
          <div className="text-xl font-black font-mono text-amber-950 mt-1">
            {expiringMembers}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-pink-50/70 border border-pink-200/70 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-pink-800">
            <Cake className="h-3 w-3 text-pink-600" />
            <span>Birthdays</span>
          </div>
          <div className="text-xl font-black font-mono text-pink-950 mt-1">
            {birthdays}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span>Events</span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-950 mt-1">
            {events}
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">
          {totalUpcomingItems} total event{totalUpcomingItems === 1 ? "" : "s"} scheduled
        </span>
        <Link
          href={`/calendar?year=${year}&month=${upcomingMonth.monthNumber}`}
          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 hover:underline"
        >
          Open Calendar
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
