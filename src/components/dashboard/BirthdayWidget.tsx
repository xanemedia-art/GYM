"use client";

import React, { useState } from "react";
import { Cake, MessageCircle, Check, Send } from "lucide-react";

interface BirthdayMember {
  id: string;
  firstName: string;
  lastName: string;
  memberCode: string;
  phone: string;
}

interface BirthdayWidgetProps {
  birthdays: {
    today: BirthdayMember[];
    tomorrow: BirthdayMember[];
  };
}

export function BirthdayWidget({ birthdays }: BirthdayWidgetProps) {
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleSendWish = async (member: BirthdayMember) => {
    setLoadingMap((prev) => ({ ...prev, [member.id]: true }));
    try {
      // Simulate / send WhatsApp wish
      await new Promise((r) => setTimeout(r, 600));
      setSentMap((prev) => ({ ...prev, [member.id]: true }));
    } catch (err) {
      console.error("Failed to send birthday wish:", err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  const hasBirthdays = birthdays.today.length > 0 || birthdays.tomorrow.length > 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
            <Cake className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Member Birthdays</h3>
            <p className="text-[11px] text-slate-500 font-medium">Celebration alerts & WhatsApp wishes</p>
          </div>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 font-bold border border-pink-200">
          {birthdays.today.length} Today
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {birthdays.today.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              🎉 Today&apos;s Birthdays
            </div>
            <div className="space-y-2">
              {birthdays.today.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-pink-200 hover:bg-pink-50/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-pink-100 text-pink-700 font-black text-xs flex items-center justify-center">
                      {member.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{member.memberCode} • {member.phone}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendWish(member)}
                    disabled={sentMap[member.id] || loadingMap[member.id]}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sentMap[member.id]
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    }`}
                  >
                    {sentMap[member.id] ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Sent</span>
                      </>
                    ) : loadingMap[member.id] ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp Wish</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {birthdays.tomorrow.length > 0 && (
          <div className="pt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tomorrow&apos;s Birthdays
            </div>
            <div className="space-y-2">
              {birthdays.tomorrow.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 border border-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {member.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{member.memberCode}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasBirthdays && (
          <div className="py-6 text-center text-xs text-slate-400">
            No member birthdays scheduled for today or tomorrow.
          </div>
        )}
      </div>
    </div>
  );
}
