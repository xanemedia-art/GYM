"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Cake,
  Clock,
  Sparkles,
  PartyPopper,
  Dumbbell,
  Wrench,
  Send,
  User,
  Loader2,
  X,
  Phone,
  Trash2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";

interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  eventType: "ANNIVERSARY" | "HOLIDAY" | "WORKOUT_CHALLENGE" | "MAINTENANCE" | "SPECIAL_OCCASION" | "BIRTHDAY" | "EXPIRY";
  isRecurringYearly: boolean;
  memberId?: string;
  phone?: string;
}

interface CalendarClientProps {
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

export default function CalendarClient({ user }: CalendarClientProps) {
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventType, setEventType] = useState<string>("SPECIAL_OCCASION");
  const [isRecurringYearly, setIsRecurringYearly] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "EXPIRY" | "BIRTHDAY" | "OCCASION">("ALL");

  const today = new Date();
  const upcomingMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const isViewingUpcomingMonth =
    currentDate.getFullYear() === upcomingMonthDate.getFullYear() &&
    currentDate.getMonth() === upcomingMonthDate.getMonth();
  const isViewingCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();

  // Sync with query params if user navigated with ?year=2026&month=10
  useEffect(() => {
    const yearParam = searchParams?.get("year");
    const monthParam = searchParams?.get("month");
    if (yearParam && monthParam) {
      const y = parseInt(yearParam, 10);
      const m = parseInt(monthParam, 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        const d = new Date(y, m, 1);
        setCurrentDate(d);
        setSelectedDay(d);
      }
    }
  }, [searchParams]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/calendar?year=${year}&month=${month}`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.events || []);
      }
    } catch (err) {
      console.error("Failed to load calendar events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(today);
    setSelectedDay(today);
  };

  const handleGoToUpcomingMonth = () => {
    setCurrentDate(upcomingMonthDate);
    setSelectedDay(upcomingMonthDate);
  };

  const handleGoToCurrentMonth = () => {
    setCurrentDate(today);
    setSelectedDay(today);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled occasion?")) return;
    try {
      const res = await fetch(`/api/v1/calendar?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to delete event");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleSendWhatsApp = (ev: CalendarEventItem) => {
    if (!ev.phone) return;
    const cleanPhone = ev.phone.replace(/\D/g, "").slice(-10);
    let msg = "";
    if (ev.eventType === "EXPIRY") {
      msg = `Hi ${ev.title}! Your gym membership at ${user?.tenant?.businessName || "Be Free Fitness"} is scheduled for renewal on ${ev.eventDate}. Please renew on time to continue workouts without interruption. Reply here to renew!`;
    } else if (ev.eventType === "BIRTHDAY") {
      msg = `Happy Birthday ${ev.title} from all of us at ${user?.tenant?.businessName || "Be Free Fitness"}! 🎂 Wishing you a wonderful year ahead filled with health and energy!`;
    } else {
      msg = `Hi from ${user?.tenant?.businessName || "Be Free Fitness"} regarding ${ev.title} on ${ev.eventDate}.`;
    }
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          eventDate,
          eventType,
          isRecurringYearly,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setIsRecurringYearly(false);
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to create event");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar grid calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = getDay(monthStart); // 0 (Sun) to 6 (Sat)

  const selectedDateStr = format(selectedDay, "yyyy-MM-dd");
  const selectedDayEvents = events.filter((e) => {
    if (e.eventDate !== selectedDateStr) return false;
    if (filterType === "ALL") return true;
    if (filterType === "EXPIRY") return e.eventType === "EXPIRY";
    if (filterType === "BIRTHDAY") return e.eventType === "BIRTHDAY";
    if (filterType === "OCCASION") return !["EXPIRY", "BIRTHDAY"].includes(e.eventType);
    return true;
  });

  const birthdayCount = events.filter((e) => e.eventType === "BIRTHDAY").length;
  const expiryCount = events.filter((e) => e.eventType === "EXPIRY").length;
  const occasionCount = events.filter(
    (e) => !["BIRTHDAY", "EXPIRY"].includes(e.eventType)
  ).length;

  const getEventBadge = (type: string) => {
    switch (type) {
      case "BIRTHDAY":
        return {
          bg: "bg-pink-50 text-pink-700 border-pink-200",
          icon: Cake,
          label: "Birthday",
        };
      case "EXPIRY":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          label: "Plan Expiry",
        };
      case "ANNIVERSARY":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: PartyPopper,
          label: "Anniversary",
        };
      case "WORKOUT_CHALLENGE":
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: Dumbbell,
          label: "Challenge",
        };
      case "MAINTENANCE":
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: Wrench,
          label: "Maintenance",
        };
      default:
        return {
          bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
          icon: Sparkles,
          label: "Special Event",
        };
    }
  };

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <CalendarIcon className="h-6 w-6 text-emerald-600" />
              Special Occasions & Calendar
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Member birthdays, subscription renewals, bootcamps, and gym anniversary campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEventDate(format(selectedDay, "yyyy-MM-dd"));
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm shadow-emerald-600/30 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Schedule Event
            </button>
          </div>
        </div>

        {/* Upcoming Month Outlook Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              🚀
            </div>
            <div>
              <div className="text-xs font-black text-emerald-950 flex items-center gap-2">
                <span>
                  {isViewingUpcomingMonth
                    ? `Upcoming Month Forecast: ${format(upcomingMonthDate, "MMMM yyyy")}`
                    : `Upcoming Month Outlook (${format(upcomingMonthDate, "MMMM yyyy")})`}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 font-bold">
                  {isViewingUpcomingMonth ? "Active View" : "1-Click Switch"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {isViewingUpcomingMonth
                  ? "Showing all anticipated membership expirations, renewals, and birthdays for next month."
                  : "Plan ahead! Check which members are expiring next month and send them WhatsApp renewal notices."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isViewingUpcomingMonth ? (
              <button
                onClick={handleGoToCurrentMonth}
                className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-bold shadow-2xs transition-all active:scale-95"
              >
                ← Back to Current Month
              </button>
            ) : (
              <button
                onClick={handleGoToUpcomingMonth}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>View Upcoming Month</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setFilterType(filterType === "BIRTHDAY" ? "ALL" : "BIRTHDAY")}
            className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              filterType === "BIRTHDAY" ? "border-pink-500 ring-2 ring-pink-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500" />
            <div className="h-12 w-12 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600 shrink-0">
              <Cake className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">{birthdayCount}</div>
              <div className="text-xs text-slate-500 font-medium">
                Member Birthdays in {format(currentDate, "MMM")}
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterType(filterType === "EXPIRY" ? "ALL" : "EXPIRY")}
            className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              filterType === "EXPIRY" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">{expiryCount}</div>
              <div className="text-xs text-slate-500 font-medium">
                Memberships Expiring in {format(currentDate, "MMM")}
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterType(filterType === "OCCASION" ? "ALL" : "OCCASION")}
            className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              filterType === "OCCASION" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200/80"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">{occasionCount}</div>
              <div className="text-xs text-slate-500 font-medium">
                Gym Events & Occasions
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid & Details Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Month Calendar Grid (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Month Nav Bar & Quick Switchers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                {loading && <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />}
              </div>

              {/* Month Jump Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleGoToCurrentMonth}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isViewingCurrentMonth
                      ? "bg-emerald-600 text-white shadow-2xs font-bold"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={handleGoToUpcomingMonth}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    isViewingUpcomingMonth
                      ? "bg-emerald-600 text-white shadow-2xs font-bold"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <span>Upcoming Month</span>
                  <span className="text-[10px] opacity-80">({format(upcomingMonthDate, "MMM")})</span>
                </button>

                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 ml-1">
                  <button
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    title="Next Month"
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Event Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterType === "ALL"
                    ? "bg-slate-900 text-white font-bold shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Items ({events.length})
              </button>
              <button
                onClick={() => setFilterType("EXPIRY")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  filterType === "EXPIRY"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-2xs"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>Expiring Plans ({expiryCount})</span>
              </button>
              <button
                onClick={() => setFilterType("BIRTHDAY")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  filterType === "BIRTHDAY"
                    ? "bg-pink-500 text-white font-bold shadow-2xs"
                    : "bg-pink-50 text-pink-800 hover:bg-pink-100 border border-pink-200/60"
                }`}
              >
                <Cake className="h-3 w-3" />
                <span>Birthdays ({birthdayCount})</span>
              </button>
              <button
                onClick={() => setFilterType("OCCASION")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  filterType === "OCCASION"
                    ? "bg-emerald-600 text-white font-bold shadow-2xs"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Gym Events ({occasionCount})</span>
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty leading offset cells */}
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div
                  key={`offset-${i}`}
                  className="min-h-[90px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40"
                />
              ))}

              {/* Day cells */}
              {daysInMonth.map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const allDayEvents = events.filter((e) => e.eventDate === dayStr);
                const dayEvents = allDayEvents.filter((e) => {
                  if (filterType === "ALL") return true;
                  if (filterType === "EXPIRY") return e.eventType === "EXPIRY";
                  if (filterType === "BIRTHDAY") return e.eventType === "BIRTHDAY";
                  if (filterType === "OCCASION") return !["EXPIRY", "BIRTHDAY"].includes(e.eventType);
                  return true;
                });
                const isSelected = isSameDay(day, selectedDay);
                const isToday = isSameDay(day, new Date());
                const hasExpiry = allDayEvents.some((e) => e.eventType === "EXPIRY");
                const hasBirthday = allDayEvents.some((e) => e.eventType === "BIRTHDAY");

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[90px] p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                          isToday
                            ? "bg-emerald-600 text-white shadow-2xs font-black"
                            : isSelected
                            ? "text-emerald-700 bg-emerald-100 font-black"
                            : "text-slate-700"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasExpiry && (
                          <span
                            className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-100"
                            title="Membership Expiry on this day"
                          />
                        )}
                        {hasBirthday && (
                          <span
                            className="h-2 w-2 rounded-full bg-pink-500 ring-2 ring-pink-100"
                            title="Member Birthday on this day"
                          />
                        )}
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mini event tags */}
                    <div className="mt-1.5 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const badge = getEventBadge(ev.eventType);
                        return (
                          <div
                            key={ev.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md truncate border font-medium ${badge.bg}`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-slate-400 text-right font-medium">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details Panel (1 col) */}
          <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col h-full">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Selected Day
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {format(selectedDay, "EEEE, MMMM d, yyyy")}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedDayEvents.length} scheduled item{selectedDayEvents.length === 1 ? "" : "s"}
              </p>
            </div>

            {/* List of events on this day */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Sparkles className="h-8 w-8 mx-auto text-slate-300 mb-2 opacity-70" />
                  No events or birthdays matching filter for this date.
                </div>
              ) : (
                selectedDayEvents.map((ev) => {
                  const badge = getEventBadge(ev.eventType);
                  const Icon = badge.icon;
                  const isCustom = !ev.id.startsWith("bday-") && !ev.id.startsWith("exp-");

                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2 relative group"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-md border text-xs ${badge.bg}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="text-xs font-bold text-slate-900 truncate flex-1">
                          {ev.title}
                        </div>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-white transition-colors"
                            title="Delete Occasion"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {ev.description}
                        </p>
                      )}

                      {/* Action buttons for birthdays / reminders */}
                      {ev.phone && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(ev)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all active:scale-95 shadow-xs"
                          >
                            <Send className="h-3 w-3" />
                            {ev.eventType === "EXPIRY"
                              ? "WhatsApp Reminder"
                              : ev.eventType === "BIRTHDAY"
                              ? "Wish Birthday"
                              : "WhatsApp"}
                          </button>
                          <a
                            href={`tel:${ev.phone}`}
                            className="flex items-center justify-center p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors border border-slate-200"
                            title="Call Phone"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => {
                setEventDate(format(selectedDay, "yyyy-MM-dd"));
                setIsModalOpen(true);
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2.5 rounded-xl border border-slate-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event on this Date
            </button>
          </div>
        </div>

        {/* Schedule Event Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  Schedule Calendar Occasion
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 5th Gym Anniversary, Republic Day Bootcamp"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Event Category
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="SPECIAL_OCCASION">Special Occasion</option>
                      <option value="ANNIVERSARY">Gym Anniversary</option>
                      <option value="HOLIDAY">Gym Holiday / Closed</option>
                      <option value="WORKOUT_CHALLENGE">Fitness Challenge</option>
                      <option value="MAINTENANCE">Equipment Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Promotion Details
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details, member discounts, or special operational hours..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurringYearly}
                    onChange={(e) => setIsRecurringYearly(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="recurring" className="text-xs text-slate-600 cursor-pointer">
                    Repeat annually on this date (e.g. Annual Anniversary)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Occasion
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
