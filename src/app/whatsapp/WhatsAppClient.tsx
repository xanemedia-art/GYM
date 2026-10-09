"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Zap,
  Cake,
  Clock,
  RefreshCw,
  Settings2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Copy,
  Check,
  Power,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface WhatsAppClientProps {
  user: {
    fullName: string;
    role: string;
    email: string;
    tenant?: {
      businessName: string;
      slug: string;
      phone: string;
    };
  };
}

export default function WhatsAppClient({ user }: WhatsAppClientProps) {
  // Config state
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [togglingConnect, setTogglingConnect] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Custom API form state
  const [apiForm, setApiForm] = useState({
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
  });
  const [savingApi, setSavingApi] = useState(false);

  // Messages state
  const [messagesData, setMessagesData] = useState<{
    recentLogs: any[];
    pendingBirthdays: any[];
    pendingExpiries: any[];
  }>({ recentLogs: [], pendingBirthdays: [], pendingExpiries: [] });
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [dispatchingBatch, setDispatchingBatch] = useState(false);

  // Custom message composer state
  const [customForm, setCustomForm] = useState({
    recipientPhone: "",
    recipientName: "",
    message: "",
  });
  const [sendingCustom, setSendingCustom] = useState(false);
  const [customSuccessMessage, setCustomSuccessMessage] = useState<string | null>(null);
  const [lastWaMeUrl, setLastWaMeUrl] = useState<string | null>(null);

  // Fetch Config
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/v1/whatsapp/config");
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data);
        setApiForm({
          phoneNumberId: json.data.phoneNumberId || "",
          accessToken: "",
          businessAccountId: json.data.businessAccountId || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp config:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Fetch Messages
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/v1/whatsapp/messages");
      const json = await res.json();
      if (json.success && json.data) {
        setMessagesData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchMessages();
  }, []);

  // 1-Click Connect Toggle
  const handleOneClickConnect = async () => {
    setTogglingConnect(true);
    const action = config?.isConnected ? "disconnect" : "one_click_connect";

    try {
      const res = await fetch("/api/v1/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        fetchConfig();
      } else {
        alert(json.error?.message || "Failed to update connection");
      }
    } catch (e) {
      alert("Network error updating WhatsApp connection");
    } finally {
      setTogglingConnect(false);
    }
  };

  // Save Custom API Credentials
  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingApi(true);

    try {
      const res = await fetch("/api/v1/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_credentials",
          phoneNumberId: apiForm.phoneNumberId,
          accessToken: apiForm.accessToken,
          businessAccountId: apiForm.businessAccountId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("WhatsApp API credentials saved successfully!");
        setShowApiSettings(false);
        fetchConfig();
      } else {
        alert(json.error?.message || "Failed to save credentials");
      }
    } catch (e) {
      alert("Network error saving credentials");
    } finally {
      setSavingApi(false);
    }
  };

  // Dispatch All Pending Birthdays & Reminders
  const handleDispatchAllPending = async () => {
    setDispatchingBatch(true);
    try {
      const res = await fetch("/api/v1/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispatch_all_pending" }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Automated scan and dispatch completed for all pending member alerts!");
        fetchMessages();
      } else {
        alert(json.error?.message || "Failed to dispatch pending alerts");
      }
    } catch (e) {
      alert("Network error running alert scanner");
    } finally {
      setDispatchingBatch(false);
    }
  };

  // Quick message template insertion
  const applyTemplate = (templateType: string, recipientName = "") => {
    const gym = user.tenant?.businessName || "our gym";
    const name = recipientName || "Member";

    switch (templateType) {
      case "birthday":
        setCustomForm((prev) => ({
          ...prev,
          message: `🎉 Happy Birthday ${name}! The team at ${gym} wishes you supreme health, strength, and happiness on your special day. Keep crushing your fitness goals! 💪🎂`,
        }));
        break;
      case "expiry":
        setCustomForm((prev) => ({
          ...prev,
          message: `👋 Hi ${name}, gentle reminder from ${gym}: your gym membership pass is expiring shortly. Please visit the front desk to renew your pass and keep your workout routine unbroken! 🏋️`,
        }));
        break;
      case "welcome":
        setCustomForm((prev) => ({
          ...prev,
          message: `🏋️ Welcome to the ${gym} family, ${name}! Your pass is now active. We look forward to seeing you on the training floor. Feel free to contact our front desk for any assistance!`,
        }));
        break;
      case "general":
        setCustomForm((prev) => ({
          ...prev,
          message: `📢 Important Update from ${gym}: `,
        }));
        break;
    }
  };

  // Send Custom Message
  const handleSendCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.recipientPhone.trim() || !customForm.message.trim()) {
      alert("Please enter a recipient phone number and message.");
      return;
    }

    setSendingCustom(true);
    setCustomSuccessMessage(null);
    setLastWaMeUrl(null);

    try {
      const res = await fetch("/api/v1/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientPhone: customForm.recipientPhone,
          message: customForm.message,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCustomSuccessMessage("Message sent successfully!");
        setLastWaMeUrl(json.data?.waMeUrl || null);
        setCustomForm({ recipientPhone: "", recipientName: "", message: "" });
        fetchMessages();
      } else {
        alert(json.error?.message || "Failed to send WhatsApp message");
      }
    } catch (e) {
      alert("Network error sending WhatsApp message");
    } finally {
      setSendingCustom(false);
    }
  };

  const isConnected = Boolean(config?.isConnected);
  const pendingTotal = (messagesData.pendingBirthdays?.length || 0) + (messagesData.pendingExpiries?.length || 0);

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                WhatsApp Desk & Automation Hub
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="h-3 w-3" />
                Branch Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              1-click WhatsApp connection, automated birthday & expiry alerts, and direct member communication
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchConfig();
                fetchMessages();
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Refresh Desk</span>
            </button>
          </div>
        </div>

        {/* 1. Connection Card (1-Click Connect Button for Gym Owner) */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-xs transition-colors ${
                  isConnected
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                <MessageSquare className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    WhatsApp Cloud Gateway
                  </h2>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected & Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isConnected
                    ? `Active for ${user.tenant?.businessName || "Gym"}. Automated alerts and custom messages enabled.`
                    : "Connect your WhatsApp with 1-click to enable instant automated birthday & expiry alerts."}
                </p>
              </div>
            </div>

            {/* 1-Click Connect Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleOneClickConnect}
                disabled={togglingConnect || loadingConfig}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                  isConnected
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                }`}
              >
                {togglingConnect ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isConnected ? (
                  <Power className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                <span>
                  {togglingConnect
                    ? "Updating Connection..."
                    : isConnected
                    ? "Disconnect WhatsApp"
                    : "Connect WhatsApp (1-Click)"}
                </span>
              </button>

              <button
                onClick={() => setShowApiSettings(!showApiSettings)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                title="Configure Meta Cloud API Credentials"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Meta API Credentials Panel */}
          {showApiSettings && (
            <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Custom Meta Cloud API Credentials (Optional)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Use your custom Meta Business Phone Number ID & Access Token if you have an official verified WhatsApp account.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveApi} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104857392817293"
                    value={apiForm.phoneNumberId}
                    onChange={(e) => setApiForm({ ...apiForm, phoneNumberId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Permanent Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="EAAB..."
                    value={apiForm.accessToken}
                    onChange={(e) => setApiForm({ ...apiForm, accessToken: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Business Account ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 948372615283948"
                    value={apiForm.businessAccountId}
                    onChange={(e) => setApiForm({ ...apiForm, businessAccountId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span>Webhook URL:</span>
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700">
                      {config?.webhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(config?.webhookUrl || "");
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      {copiedWebhook ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={savingApi}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {savingApi && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Credentials</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 2. Pending Messages Section & Dispatch Queue */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Pending Automated Messages
                  </h2>
                  {pendingTotal > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                      {pendingTotal} Pending Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Birthdays and membership expiry warnings ready for automated dispatch
                </p>
              </div>
            </div>

            {pendingTotal > 0 && (
              <button
                onClick={handleDispatchAllPending}
                disabled={dispatchingBatch}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
              >
                {dispatchingBatch ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Dispatch All ({pendingTotal}) Now</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Today's Pending Birthdays */}
            <div className="rounded-xl border border-slate-200/80 p-4 space-y-3 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Cake className="h-4 w-4 text-pink-500" />
                  <span>Today&apos;s Member Birthdays</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  {messagesData.pendingBirthdays?.length || 0}
                </span>
              </div>

              {messagesData.pendingBirthdays?.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No birthdays pending dispatch today.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {messagesData.pendingBirthdays.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{b.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{b.phone}</div>
                      </div>
                      <button
                        onClick={() => {
                          setCustomForm({
                            recipientPhone: b.phone,
                            recipientName: b.fullName,
                            message: "",
                          });
                          applyTemplate("birthday", b.fullName);
                        }}
                        className="px-2.5 py-1 rounded-md bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-[11px] font-bold"
                      >
                        Wish on WA
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Expiry Warnings */}
            <div className="rounded-xl border border-slate-200/80 p-4 space-y-3 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Expiring Passes (Next 7 Days)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {messagesData.pendingExpiries?.length || 0}
                </span>
              </div>

              {messagesData.pendingExpiries?.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No memberships expiring in the next 7 days.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {messagesData.pendingExpiries.map((exp) => (
                    <div
                      key={exp.membershipId}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{exp.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {exp.planName} • <span className="font-bold text-amber-700">{exp.daysRemaining}d left</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCustomForm({
                            recipientPhone: exp.phone,
                            recipientName: exp.fullName,
                            message: "",
                          });
                          applyTemplate("expiry", exp.fullName);
                        }}
                        className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold"
                      >
                        Send Alert
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Send Custom WhatsApp Message Section */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Compose & Send Custom Message
              </h2>
              <p className="text-xs text-slate-500">
                Send a personalized message to any client, member, or phone number
              </p>
            </div>
          </div>

          {customSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{customSuccessMessage}</span>
              </div>
              {lastWaMeUrl && (
                <a
                  href={lastWaMeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Open WhatsApp Web</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <form onSubmit={handleSendCustom} className="space-y-4">
            {/* Quick Templates */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Quick Preset Templates
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => applyTemplate("birthday")}
                  className="px-3 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-semibold transition-colors"
                >
                  🎂 Birthday Greeting
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("expiry")}
                  className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold transition-colors"
                >
                  ⏳ Expiry Reminder
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("welcome")}
                  className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold transition-colors"
                >
                  🏋️ Welcome Pass Activation
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("general")}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold transition-colors"
                >
                  📢 Gym Announcement
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Mobile Number *
                </label>
                <input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customForm.recipientPhone}
                  onChange={(e) => setCustomForm({ ...customForm, recipientPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Member Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customForm.recipientName}
                  onChange={(e) => setCustomForm({ ...customForm, recipientName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Message Content *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Type your message here..."
                value={customForm.message}
                onChange={(e) => setCustomForm({ ...customForm, message: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>Standard WhatsApp message encoding (UTF-8)</span>
                <span>{customForm.message.length} characters</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {customForm.recipientPhone && (
                <a
                  href={`https://wa.me/91${customForm.recipientPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                    customForm.message
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Open directly in WhatsApp Web</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <button
                type="submit"
                disabled={sendingCustom || !customForm.recipientPhone || !customForm.message}
                className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {sendingCustom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Send via WhatsApp API</span>
              </button>
            </div>
          </form>
        </div>

        {/* 4. Recent WhatsApp Communication Logs */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Recent WhatsApp Activity Logs
            </h2>
            <span className="text-[11px] text-slate-400">
              Showing last {messagesData.recentLogs?.length || 0} messages
            </span>
          </div>

          {messagesData.recentLogs?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No WhatsApp messages recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {messagesData.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {log.member?.fullName || log.recipient}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{log.recipient}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          log.status === "DELIVERED" || log.status === "SENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1 max-w-xl">
                      {log.messageContent}
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
