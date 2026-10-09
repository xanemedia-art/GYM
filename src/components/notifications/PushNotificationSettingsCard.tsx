"use client";

import React, { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Bell,
  BellRing,
  BellOff,
  Send,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Share,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export function PushNotificationSettingsCard() {
  const {
    isSupported,
    isStandalonePWA,
    isIOS,
    permission,
    isSubscribed,
    loading,
    subscribing,
    sendingTest,
    error,
    subscribe,
    unsubscribe,
    sendTestPush,
  } = usePushNotifications();

  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleEnable = async () => {
    setFeedbackMsg(null);
    const success = await subscribe();
    if (success) {
      setFeedbackMsg({
        type: "success",
        text: "Push notifications successfully enabled on this device! Tap 'Send Test Push Alert' below to test.",
      });
    }
  };

  const handleDisable = async () => {
    setFeedbackMsg(null);
    const success = await unsubscribe();
    if (success) {
      setFeedbackMsg({
        type: "success",
        text: "Push notifications disabled on this device.",
      });
    }
  };

  const handleTest = async () => {
    setFeedbackMsg(null);
    const res = await sendTestPush();
    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: "Test alert dispatched! Look for the notification banner on your phone screen.",
      });
    } else {
      setFeedbackMsg({
        type: "error",
        text: res.message || "Failed to dispatch test notification.",
      });
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Device Push Notifications</span>
              {isStandalonePWA && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Installed PWA
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              Receive native device alerts for walk-in leads, member check-ins, and reminders even when the app is closed.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Detecting...</span>
            </span>
          ) : isSubscribed ? (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active on This Device</span>
            </span>
          ) : permission === "denied" ? (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span>Blocked in Browser</span>
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 font-medium">
              Not Enabled Yet
            </span>
          )}
        </div>
      </div>

      {/* iOS Safari Standalone Helper */}
      {isIOS && !isStandalonePWA && (
        <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
          <Share className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">iPhone / iOS Web Push Requirement:</span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Apple requires web apps to be installed to your Home Screen to deliver background push alerts. Tap the <strong>Share</strong> button in Safari, select <strong>&quot;Add to Home Screen&quot;</strong>, and then open GymOS from your home screen.
            </p>
          </div>
        </div>
      )}

      {/* Unsupported Browser Warning */}
      {!isSupported && !loading && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Web Push is not supported by your current browser. Please use Chrome, Edge, or install as PWA on mobile.</span>
        </div>
      )}

      {/* Feedback Messages */}
      {feedbackMsg && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 transition-all ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {error && !feedbackMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {!isSubscribed ? (
          <button
            type="button"
            disabled={!isSupported || subscribing}
            onClick={handleEnable}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {subscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            <span>Enable Push Notifications on This Device</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={sendingTest}
              onClick={handleTest}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {sendingTest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Send Test Push Alert to My Phone</span>
            </button>

            <button
              type="button"
              disabled={subscribing || sendingTest}
              onClick={handleEnable}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all active:scale-95"
              title="Refresh and re-sync device push registration with current server key"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${subscribing ? "animate-spin" : ""}`} />
              <span>Re-sync Key</span>
            </button>

            <button
              type="button"
              disabled={subscribing}
              onClick={handleDisable}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all active:scale-95"
            >
              <BellOff className="h-4 w-4 text-slate-500" />
              <span>Disable on This Device</span>
            </button>
          </>
        )}
      </div>

      {/* Feature Bullet Points */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50/80 border border-slate-200/60">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Instant Gate Walk-in alerts</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50/80 border border-slate-200/60">
          <Smartphone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Rings when app is closed</span>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50/80 border border-slate-200/60">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Vibration & sound alert</span>
        </div>
      </div>
    </div>
  );
}
