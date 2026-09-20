"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Globe,
  Save,
  CheckCircle2,
  ExternalLink,
  Building2,
  Image as ImageIcon,
  Phone,
  Clock,
  Dumbbell,
  UserCheck,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Eye,
  Sliders,
  Award,
} from "lucide-react";
import { Branch } from "@/data/branches";
import {
  WebsiteContent,
  IMAGE_PRESETS,
  DEFAULT_WEBSITE_CONTENT,
} from "@/types/website-content";
import { ImageUploader } from "@/components/common/ImageUploader";

export default function WebsiteCmsClient({ user }: { user?: any }) {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_WEBSITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"branches" | "general" | "sections">("branches");
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetTargetField, setPresetTargetField] = useState<{
    type: "branch-cover" | "branch-gallery" | "hero" | "about" | "franchise";
    galleryIndex?: number;
  } | null>(null);

  // Fetch current website content
  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch("/api/v1/website-content");
        const json = await res.json();
        if (json.success && json.data) {
          setContent(json.data);
        }
      } catch (err) {
        console.error("Failed to load website content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/v1/website-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert("Failed to save changes: " + (json.error?.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentBranch = content.branches[selectedBranchIndex] || content.branches[0];

  const updateCurrentBranch = (updates: Partial<Branch>) => {
    setContent((prev) => {
      const updatedBranches = [...prev.branches];
      updatedBranches[selectedBranchIndex] = {
        ...updatedBranches[selectedBranchIndex],
        ...updates,
      };
      return { ...prev, branches: updatedBranches };
    });
  };

  const applyPreset = (presetUrl: string) => {
    if (!presetTargetField) return;
    if (presetTargetField.type === "branch-cover") {
      updateCurrentBranch({ image: presetUrl });
    } else if (presetTargetField.type === "branch-gallery") {
      const gallery = [...(currentBranch.gallery || [])];
      if (presetTargetField.galleryIndex !== undefined) {
        gallery[presetTargetField.galleryIndex] = presetUrl;
      } else {
        gallery.push(presetUrl);
      }
      updateCurrentBranch({ gallery });
    } else if (presetTargetField.type === "hero") {
      setContent((prev) => ({
        ...prev,
        sections: {
          ...prev.sections,
          hero: { ...prev.sections.hero, heroImage: presetUrl },
        },
      }));
    } else if (presetTargetField.type === "about") {
      setContent((prev) => ({
        ...prev,
        sections: {
          ...prev.sections,
          about: { ...prev.sections.about, image: presetUrl },
        },
      }));
    } else if (presetTargetField.type === "franchise") {
      setContent((prev) => ({
        ...prev,
        sections: {
          ...prev.sections,
          franchise: { ...prev.sections.franchise, image: presetUrl },
        },
      }));
    }
    setShowPresetModal(false);
  };

  if (loading) {
    return (
      <AppLayout user={user}>
        <div className="p-8 flex items-center justify-center min-h-[500px]">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            <span>Loading Website CMS details...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
              <Globe className="h-4 w-4" />
              <span>Website Studio & CMS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Website & Branch Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live configuration for gym facility photos, branch contact numbers, and website sections.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>View Website</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all active:scale-95 flex items-center gap-2 shadow-sm shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Success Alert Banner */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xs transition-all">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Website changes successfully published to disk! All public visitors will see updated details instantly.
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("branches")}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "branches"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Gym Branches (6 Locations)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "general"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
            <span>General & Contact Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "sections"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            <span>Section Details & Hero Images</span>
          </button>
        </div>

        {/* TAB 1: GYM BRANCHES */}
        {activeTab === "branches" && currentBranch && (
          <div className="space-y-6">
            {/* Branch Selector Pills */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
              {content.branches.map((b, idx) => (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => setSelectedBranchIndex(idx)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                    selectedBranchIndex === idx
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-lime-300" />
                  <span>{b.shortName || b.name}</span>
                </button>
              ))}
            </div>

            {/* Branch Content Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-8">
              {/* Branch Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                    Editing Branch • {currentBranch.city} ({currentBranch.region})
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-0.5">{currentBranch.name}</h2>
                  <p className="text-xs text-slate-500">{currentBranch.address}</p>
                </div>

                <Link
                  href={`/locations/${currentBranch.slug}`}
                  target="_blank"
                  className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Preview Page</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </Link>
              </div>

              {/* 1. Facility Imagery */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    <span>Gym Photos & Cover Image</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Cover Photo Preview & Input */}
                  <div className="md:col-span-1 space-y-2">
                    <ImageUploader
                      value={currentBranch.image}
                      onChange={(url) => updateCurrentBranch({ image: url })}
                      onOpenPresets={() => {
                        setPresetTargetField({ type: "branch-cover" });
                        setShowPresetModal(true);
                      }}
                      label="Primary Cover Photo"
                      placeholderText="Upload gym photo (Max 2 MB)"
                      aspectRatio="wide"
                    />
                  </div>

                  {/* Gallery Photos */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Facility Gallery Photos ({currentBranch.gallery?.length || 0}/6)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPresetTargetField({ type: "branch-gallery" });
                          setShowPresetModal(true);
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Pick Preset</span>
                      </button>
                    </div>

                    {/* Existing Gallery Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(currentBranch.gallery || []).map((imgUrl, gIdx) => (
                        <div key={gIdx} className="space-y-1.5">
                          <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                            <Image
                              src={imgUrl}
                              alt={`Gallery ${gIdx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setPresetTargetField({
                                    type: "branch-gallery",
                                    galleryIndex: gIdx,
                                  });
                                  setShowPresetModal(true);
                                }}
                                className="p-1 rounded bg-white text-slate-900 hover:bg-slate-100"
                                title="Pick from Presets"
                              >
                                <Sparkles className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const gallery = currentBranch.gallery.filter((_, i) => i !== gIdx);
                                  updateCurrentBranch({ gallery });
                                }}
                                className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500"
                                title="Remove photo"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">
                            {imgUrl.startsWith("/uploads/") ? "📁 Local Upload" : "🌐 External"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Image Upload for Gallery */}
                    <div className="pt-2">
                      <ImageUploader
                        value=""
                        onChange={(url) => {
                          const gallery = [...(currentBranch.gallery || [])];
                          gallery.push(url);
                          updateCurrentBranch({ gallery });
                        }}
                        label="Upload New Gallery Image"
                        placeholderText="Upload & add to gallery (Max 2 MB)"
                        aspectRatio="video"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Branch Details & Tagline */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span>General Information & Location</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Branch Official Name
                    </label>
                    <input
                      type="text"
                      value={currentBranch.name}
                      onChange={(e) => updateCurrentBranch({ name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Short Name
                    </label>
                    <input
                      type="text"
                      value={currentBranch.shortName}
                      onChange={(e) => updateCurrentBranch({ shortName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={currentBranch.tagline}
                      onChange={(e) => updateCurrentBranch({ tagline: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Full Address
                    </label>
                    <input
                      type="text"
                      value={currentBranch.address}
                      onChange={(e) => updateCurrentBranch({ address: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={currentBranch.landmark}
                      onChange={(e) => updateCurrentBranch({ landmark: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Training Area (Sq.Ft)
                    </label>
                    <input
                      type="number"
                      value={currentBranch.areaSqFt}
                      onChange={(e) =>
                        updateCurrentBranch({ areaSqFt: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={currentBranch.pincode}
                      onChange={(e) => updateCurrentBranch({ pincode: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Established Year
                    </label>
                    <input
                      type="number"
                      value={currentBranch.establishedYear}
                      onChange={(e) =>
                        updateCurrentBranch({ establishedYear: parseInt(e.target.value) || 2020 })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Contact & WhatsApp */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>Contact Numbers & WhatsApp</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Phone Number (Display)
                    </label>
                    <input
                      type="text"
                      value={currentBranch.phone}
                      onChange={(e) => updateCurrentBranch({ phone: e.target.value })}
                      placeholder="+91 98160 12001"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      WhatsApp Target (No +, with country code)
                    </label>
                    <input
                      type="text"
                      value={currentBranch.whatsapp}
                      onChange={(e) => updateCurrentBranch({ whatsapp: e.target.value })}
                      placeholder="919816012001"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Branch Email
                    </label>
                    <input
                      type="email"
                      value={currentBranch.email}
                      onChange={(e) => updateCurrentBranch({ email: e.target.value })}
                      placeholder="dhalpur@befreefitness.in"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Operating Hours */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Operating Timings</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Monday – Friday
                    </label>
                    <input
                      type="text"
                      value={currentBranch.timings?.weekdays || ""}
                      onChange={(e) =>
                        updateCurrentBranch({
                          timings: { ...currentBranch.timings, weekdays: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Saturday
                    </label>
                    <input
                      type="text"
                      value={currentBranch.timings?.saturday || ""}
                      onChange={(e) =>
                        updateCurrentBranch({
                          timings: { ...currentBranch.timings, saturday: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Sunday
                    </label>
                    <input
                      type="text"
                      value={currentBranch.timings?.sunday || ""}
                      onChange={(e) =>
                        updateCurrentBranch({
                          timings: { ...currentBranch.timings, sunday: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Equipment Line Highlights */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-emerald-600" />
                    <span>Featured Equipment Highlights</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(currentBranch.equipmentHighlights || [])];
                      list.push("New Olympic Station");
                      updateCurrentBranch({ equipmentHighlights: list });
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentBranch.equipmentHighlights || []).map((eq, eqIdx) => (
                    <div key={eqIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={eq}
                        onChange={(e) => {
                          const list = [...currentBranch.equipmentHighlights];
                          list[eqIdx] = e.target.value;
                          updateCurrentBranch({ equipmentHighlights: list });
                        }}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = currentBranch.equipmentHighlights.filter((_, i) => i !== eqIdx);
                          updateCurrentBranch({ equipmentHighlights: list });
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Head Strength Coach */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Head Strength Coach Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Coach Name
                    </label>
                    <input
                      type="text"
                      value={currentBranch.headTrainer?.name || ""}
                      onChange={(e) =>
                        updateCurrentBranch({
                          headTrainer: { ...currentBranch.headTrainer, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={currentBranch.headTrainer?.title || ""}
                      onChange={(e) =>
                        updateCurrentBranch({
                          headTrainer: { ...currentBranch.headTrainer, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Experience
                    </label>
                    <input
                      type="text"
                      value={currentBranch.headTrainer?.experience || ""}
                      onChange={(e) =>
                        updateCurrentBranch({
                          headTrainer: {
                            ...currentBranch.headTrainer,
                            experience: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Coach Biography
                    </label>
                    <textarea
                      rows={2}
                      value={currentBranch.headTrainer?.bio || ""}
                      onChange={(e) =>
                        updateCurrentBranch({
                          headTrainer: { ...currentBranch.headTrainer, bio: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GENERAL & CONTACT DETAILS */}
        {activeTab === "general" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">Brand Identity & Central Contact Lines</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These details populate the global website navbar, footer, contact page, and meta links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name</label>
                <input
                  type="text"
                  value={content.general.brandName}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      general: { ...prev.general, brandName: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={content.general.tagline}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      general: { ...prev.general, tagline: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Central Phone</label>
                <input
                  type="text"
                  value={content.general.phone}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      general: { ...prev.general, phone: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Central WhatsApp (With country code)
                </label>
                <input
                  type="text"
                  value={content.general.whatsapp}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      general: { ...prev.general, whatsapp: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Support Email</label>
                <input
                  type="email"
                  value={content.general.email}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      general: { ...prev.general, email: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Headquarters Address
                </label>
                <input
                  type="text"
                  value={content.general.headquarters}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      general: { ...prev.general, headquarters: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Social Media Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={content.general.socialLinks?.instagram || ""}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          socialLinks: {
                            ...prev.general.socialLinks,
                            instagram: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={content.general.socialLinks?.facebook || ""}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          socialLinks: {
                            ...prev.general.socialLinks,
                            facebook: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={content.general.socialLinks?.youtube || ""}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        general: {
                          ...prev.general,
                          socialLinks: {
                            ...prev.general.socialLinks,
                            youtube: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECTIONS & HERO IMAGES */}
        {activeTab === "sections" && (
          <div className="space-y-6">
            {/* HERO SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                    Home Page
                  </div>
                  <h3 className="text-base font-black text-slate-900">Hero Section & Headline</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPresetTargetField({ type: "hero" });
                    setShowPresetModal(true);
                  }}
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-lime-400" />
                  <span>Choose Hero Image</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hero Badge Text</label>
                  <input
                    type="text"
                    value={content.sections.hero.badge}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          hero: { ...prev.sections.hero, badge: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Headline</label>
                    <input
                      type="text"
                      value={content.sections.hero.headline}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            hero: { ...prev.sections.hero, headline: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Accent Word (Lime Glow)
                    </label>
                    <input
                      type="text"
                      value={content.sections.hero.headlineAccent}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            hero: { ...prev.sections.hero, headlineAccent: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-emerald-700 font-bold"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subtitle</label>
                  <textarea
                    rows={2}
                    value={content.sections.hero.subtitle}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          hero: { ...prev.sections.hero, subtitle: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUploader
                    value={content.sections.hero.heroImage}
                    onChange={(url) =>
                      setContent((prev) => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          hero: { ...prev.sections.hero, heroImage: url },
                        },
                      }))
                    }
                    onOpenPresets={() => {
                      setPresetTargetField({ type: "hero" });
                      setShowPresetModal(true);
                    }}
                    label="Hero Featured Background Image"
                    placeholderText="Upload hero background (Max 2 MB)"
                    aspectRatio="wide"
                  />
                </div>
              </div>
            </div>

            {/* ABOUT & FRANCHISE SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* About Us Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">About Page Media & Title</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setPresetTargetField({ type: "about" });
                      setShowPresetModal(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    Pick Preset
                  </button>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                  <input
                    type="text"
                    value={content.sections.about.title}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          about: { ...prev.sections.about, title: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <ImageUploader
                    value={content.sections.about.image}
                    onChange={(url) =>
                      setContent((prev) => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          about: { ...prev.sections.about, image: url },
                        },
                      }))
                    }
                    onOpenPresets={() => {
                      setPresetTargetField({ type: "about" });
                      setShowPresetModal(true);
                    }}
                    label="About Page Photo"
                    placeholderText="Upload photo (Max 2 MB)"
                    aspectRatio="wide"
                  />
                </div>
              </div>

              {/* Franchise Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">Franchise Metrics & Media</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setPresetTargetField({ type: "franchise" });
                      setShowPresetModal(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    Pick Preset
                  </button>
                </div>
                <div>
                  <ImageUploader
                    value={content.sections.franchise.image}
                    onChange={(url) =>
                      setContent((prev) => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          franchise: { ...prev.sections.franchise, image: url },
                        },
                      }))
                    }
                    onOpenPresets={() => {
                      setPresetTargetField({ type: "franchise" });
                      setShowPresetModal(true);
                    }}
                    label="Franchise Showcase Photo"
                    placeholderText="Upload photo (Max 2 MB)"
                    aspectRatio="wide"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Capex Needed</label>
                    <input
                      type="text"
                      value={content.sections.franchise.capex}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            franchise: { ...prev.sections.franchise, capex: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ROI Horizon</label>
                    <input
                      type="text"
                      value={content.sections.franchise.roiMonths}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            franchise: { ...prev.sections.franchise, roiMonths: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={content.sections.franchise.image}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          franchise: { ...prev.sections.franchise, image: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Image Library Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Select From Fitness Image Library</h3>
                <p className="text-xs text-slate-500">
                  Tap any curated high-resolution fitness photo to assign it instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {IMAGE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset.url)}
                  className="group relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20 transition-all text-left"
                >
                  <div className="relative h-28 w-full">
                    <Image
                      src={preset.url}
                      alt={preset.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      {preset.category}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {preset.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
