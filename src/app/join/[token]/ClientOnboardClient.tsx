"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dumbbell,
  CheckCircle2,
  CalendarCheck,
  User,
  HeartHandshake,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

interface ClientOnboardClientProps {
  token: string;
}

export default function ClientOnboardClient({ token }: ClientOnboardClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1=KYC, 2=Plan, 3=Review, 4=Success
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  // Form fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    gender: "MALE",
    dateOfBirth: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    planId: "",
    notes: "",
    agreedToTerms: true,
  });

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/public/self-register?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Invalid or expired registration link");
        }

        setTenant(json.data.tenant);
        setPlans(json.data.plans || []);
        if (json.data.plans?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            planId: json.data.plans[0].id,
            firstName: json.data.prefill?.clientName?.split(" ")[0] || prev.firstName,
            lastName: json.data.prefill?.clientName?.split(" ").slice(1).join(" ") || prev.lastName,
            phone: json.data.prefill?.clientPhone || prev.phone,
            whatsappNumber: json.data.prefill?.clientPhone || prev.whatsappNumber,
          }));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const selectedPlan = plans.find((p) => p.id === formData.planId);
  const basePrice = selectedPlan ? Number(selectedPlan.basePrice) : 0;
  const joiningFee = selectedPlan ? Number(selectedPlan.joiningFee || 0) : 0;
  const taxableValue = basePrice + joiningFee;
  const gstAmount = Math.round(taxableValue * 0.18 * 100) / 100;
  const totalAmount = taxableValue + gstAmount;

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      alert("Please fill in all mandatory fields (Name and Phone).");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/public/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber || formData.phone,
          email: formData.email || undefined,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || undefined,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyContactPhone: formData.emergencyContactPhone || undefined,
          planId: formData.planId,
          notes: formData.notes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to complete self-registration");
      }

      setSubmitResult(json.data);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
        <div className="text-sm font-bold text-slate-800">Verifying your invitation...</div>
        <div className="text-xs text-slate-500 mt-1">Connecting to gym network</div>
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Registration Link Expired</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || "This temporary self-registration invitation has either expired or already been utilized."}
          </p>
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200">
              Please contact the front-desk reception to receive a new registration link.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gymCity = tenant?.address?.city || tenant?.address?.area || "India";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Gym Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-auto mb-1">
            <Image
              src="/bff-logo.png"
              alt="Be Free Fitness"
              width={180}
              height={60}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {tenant?.businessName || "Be Free Fitness"}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {gymCity}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {tenant?.phone}
            </span>
          </div>
        </div>

        {/* Progress Bar (Steps 1 to 3) */}
        {step < 4 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs flex items-center justify-between">
            {[
              { num: 1, label: "Your Profile" },
              { num: 2, label: "Select Plan" },
              { num: 3, label: "Confirm & Join" },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-2 text-xs font-bold ${
                  step === s.num
                    ? "text-emerald-700"
                    : step > s.num
                    ? "text-slate-700"
                    : "text-slate-400"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] shrink-0 font-mono ${
                    step === s.num
                      ? "bg-emerald-600 text-white"
                      : step > s.num
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Client KYC Profile */}
        {step === 1 && (
          <form
            onSubmit={handleNextFromStep1}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-5"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500">Enter your details for your gym membership profile</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ramesh"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sharma"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  required
                  type="tel"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      phone: val,
                      whatsappNumber: formData.whatsappNumber === formData.phone ? val : formData.whatsappNumber,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="Same as phone"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Emergency Contact */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4 text-emerald-600" />
                <span>Emergency Contact (Optional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                <input
                  type="tel"
                  placeholder="Contact Phone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Continue to Plan Selection</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Choose Membership Plan */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Select Membership Plan</h2>
                  <p className="text-xs text-slate-500">Pick the fitness package that aligns with your goal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((p) => {
                const isSelected = formData.planId === p.id;
                const price = Number(p.basePrice);
                return (
                  <div
                    key={p.id}
                    onClick={() => setFormData({ ...formData, planId: p.id })}
                    className={`rounded-2xl p-5 border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/30 shadow-md ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                          {p.durationDays} DAYS
                        </span>
                        {isSelected && (
                          <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                      {p.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="text-2xl font-black text-slate-900 font-mono">
                          {formatINR(price)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          + 18% GST (SAC 999723)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Back to Profile
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Terms */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Review & Confirmation</h2>
                  <p className="text-xs text-slate-500">Confirm your membership details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Applicant Details Review */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/90 space-y-2 text-xs">
              <div className="font-bold text-slate-800 pb-1 border-b border-slate-200/80">
                Applicant Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>
                  Name: <strong className="text-slate-900">{formData.firstName} {formData.lastName}</strong>
                </div>
                <div>
                  Phone: <strong className="text-slate-900">{formData.phone}</strong>
                </div>
                <div>
                  Gender: <strong className="text-slate-900">{formData.gender}</strong>
                </div>
                {formData.email && (
                  <div>
                    Email: <strong className="text-slate-900">{formData.email}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Plan & Tax Summary */}
            {selectedPlan && (
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/90 space-y-2 text-xs">
                <div className="font-bold text-slate-800 pb-1 border-b border-slate-200/80 flex items-center justify-between">
                  <span>Selected Package: {selectedPlan.name}</span>
                  <span className="font-mono text-emerald-700">{selectedPlan.durationDays} Days</span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Base Plan Fee</span>
                  <span className="font-mono">{formatINR(basePrice)}</span>
                </div>

                {joiningFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Joining Fee</span>
                    <span className="font-mono">{formatINR(joiningFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST (18%) SAC 999723</span>
                  <span className="font-mono">{formatINR(gstAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Amount Payable</span>
                  <span className="font-mono text-emerald-700 text-base">{formatINR(totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                className="h-4 w-4 mt-0.5 accent-emerald-600 rounded"
              />
              <span>
                I agree to the club etiquette, health declaration, and gym rules of{" "}
                <strong>{tenant?.businessName}</strong>.
              </span>
            </label>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Back to Plans
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !formData.agreedToTerms}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{submitting ? "Processing Registration..." : "Complete Registration"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success Screen */}
        {step === 4 && submitResult && (
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center shadow-lg space-y-5 animate-in fade-in zoom-in-95">
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Welcome to {tenant?.businessName}!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your membership has been activated successfully.
              </p>
            </div>

            <div className="max-w-md mx-auto rounded-2xl bg-slate-50 p-5 border border-slate-200 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Member ID Code:</span>
                <span className="font-mono font-black text-sm text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200">
                  {submitResult.memberCode}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Member Name:</span>
                <span className="font-bold text-slate-900">{submitResult.fullName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Membership Plan:</span>
                <span className="font-bold text-slate-900">{submitResult.planName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-bold text-slate-900">{formatDate(submitResult.endDate)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono font-semibold text-slate-800">{submitResult.invoiceNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Invoice Total:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(submitResult.totalAmount)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              📲 A digital welcome package and tax invoice have been dispatched to your phone number via WhatsApp.
            </div>

            <div className="text-xs text-slate-500 pt-2">
              For any assistance or biometric registration on your first visit, simply present your Member ID (
              <strong className="text-slate-800">{submitResult.memberCode}</strong>) at the front counter.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
