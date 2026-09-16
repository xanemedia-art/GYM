"use client";

import React, { useState, useEffect } from "react";
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
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
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
  const selectedDayEvents = events.filter((e) => e.eventDate === selectedDateStr);

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

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500" />
            <div className="h-12 w-12 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
              <Cake className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">{birthdayCount}</div>
              <div className="text-xs text-slate-500 font-medium">Member Birthdays this Month</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">{expiryCount}</div>
              <div className="text-xs text-slate-500 font-medium">Memberships Expiring</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">{occasionCount}</div>
              <div className="text-xs text-slate-500 font-medium">Gym Events & Occasions</div>
            </div>
          </div>
        </div>

        {/* Main Grid & Details Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Month Calendar Grid (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            {/* Month Nav Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                {loading && <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToday}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Today
                </button>
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
                const dayEvents = events.filter((e) => e.eventDate === dayStr);
                const isSelected = isSameDay(day, selectedDay);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[90px] p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                          isToday
                            ? "bg-emerald-600 text-white"
                            : isSelected
                            ? "text-emerald-700 bg-emerald-100 font-black"
                            : "text-slate-700"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold">
                          {dayEvents.length}
                        </span>
                      )}
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
                  No events or birthdays scheduled for this date.
                </div>
              ) : (
                selectedDayEvents.map((ev) => {
                  const badge = getEventBadge(ev.eventType);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-md border text-xs ${badge.bg}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="text-xs font-bold text-slate-900 truncate flex-1">
                          {ev.title}
                        </div>
                      </div>

                      {ev.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {ev.description}
                        </p>
                      )}

                      {/* Action buttons for birthdays / reminders */}
                      {ev.phone && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                          <a
                            href={`https://wa.me/91${ev.phone.replace(/\D/g, "").slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all active:scale-95 shadow-xs"
                          >
                            <Send className="h-3 w-3" />
                            WhatsApp
                          </a>
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
