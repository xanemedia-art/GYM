"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Fingerprint,
  Plus,
  Wifi,
  WifiOff,
  Activity,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Server,
} from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";

interface DevicesClientProps {
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

export default function DevicesClient({ user }: DevicesClientProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Form State
  const [deviceName, setDeviceName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [ipAddress, setIpAddress] = useState("192.168.1.201");
  const [port, setPort] = useState(4370);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredCreds, setRegisteredCreds] = useState<any | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/devices");
      const json = await res.json();
      if (json.success && json.data) {
        setDevices(json.data);
      }
    } catch (err) {
      console.error("Failed to load devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName,
          serialNumber,
          ipAddress,
          port: Number(port),
          protocol: "ZK_LAN_DIRECT",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to register device");
      }

      setRegisteredCreds(json.data.credentials);
      fetchDevices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Biometric Hardware & Gateways</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ESSL & ZKTeco access control terminals, local GymSync edge agents, and turnstile sync status
            </p>
          </div>

          <button
            onClick={() => {
              setRegisteredCreds(null);
              setIsRegisterOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 flex items-center gap-2 self-start sm:self-auto transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Register Biometric Terminal</span>
          </button>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.length > 0 ? (
            devices.map((device) => {
              const isOnline = device.isOnline;
              return (
                <div
                  key={device.id}
                  className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm space-y-4 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold">
                        <Fingerprint className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{device.deviceName}</h3>
                        <p className="text-[11px] font-mono text-slate-400">{device.serialNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isOnline ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Standby / Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-100 pt-1">
                    <div className="pt-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">LAN IP & Port</span>
                      <span className="font-mono text-slate-800 text-xs font-semibold">{device.ipAddress}:{device.port}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Protocol</span>
                      <span className="text-slate-800 text-xs font-semibold">{device.protocol}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Enrolled Members</span>
                      <span className="text-slate-900 font-bold">{device._count?.deviceUsers || 0} Members</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Punches Ingested</span>
                      <span className="text-emerald-600 font-bold">{device._count?.attendanceRecords || 0}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Last Heartbeat: {device.lastHeartbeatAt ? formatTime(device.lastHeartbeatAt) : "Never"}</span>
                    <span className="font-mono font-medium text-slate-500">Direction: {device.deviceDirection}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              {loading ? "Loading hardware devices..." : "No biometric devices configured. Register your first device above."}
            </div>
          )}
        </div>
      </div>

      {/* Register Device Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Register ESSL Terminal</h2>
                  <p className="text-xs text-slate-500">Add biometric turnstile to branch</p>
                </div>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {registeredCreds ? (
              <div className="p-6 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Device Successfully Registered!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Copy the following credentials to your local GymSync Edge Agent's environment configuration:
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">DEVICE_SERIAL</label>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 font-semibold select-all mt-1">
                      {registeredCreds.deviceSerial}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">DEVICE_API_KEY (Keep confidential)</label>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-emerald-700 font-bold select-all break-all mt-1">
                      {registeredCreds.deviceApiKey}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsRegisterOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterDevice} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Terminal Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Front Entrance Turnstile"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hardware Serial Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. ESSL-E990-DELHI-01"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Local LAN IP</label>
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(parseInt(e.target.value) || 4370)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {formLoading ? "Generating Key..." : "Register & Generate API Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
