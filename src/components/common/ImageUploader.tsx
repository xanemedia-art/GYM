"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  X,
  HardDrive,
} from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onOpenPresets?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
  placeholderText?: string;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB upload limit

export function ImageUploader({
  value,
  onChange,
  onOpenPresets,
  label,
  className = "",
  aspectRatio = "video",
  placeholderText = "Drag & drop image or browse (Max 2 MB)",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // 1. Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP, AVIF).");
      return;
    }

    // 2. Check 2 MB upload limit
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`Image is ${sizeMB} MB. Maximum allowed size is 2 MB.`);
      return;
    }

    // 3. Upload to /api/v1/uploads
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to upload image");
      }

      onChange(json.data.url);
      setUrlInput(json.data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const heightClass =
    aspectRatio === "square"
      ? "h-40"
      : aspectRatio === "wide"
      ? "h-48"
      : "h-36";

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700">{label}</label>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <HardDrive className="h-3 w-3 text-slate-400" />
            <span>Stored in /public/uploads (2 MB Limit)</span>
          </div>
        </div>
      )}

      {/* Preview and Action Box */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 transition-all">
        {value ? (
          <div className={`relative ${heightClass} w-full group`}>
            <Image
              src={value}
              alt="Uploaded Preview"
              fill
              className="object-cover"
              unoptimized
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center backdrop-blur-xs">
              <span className="text-xs font-bold text-white">Change Image</span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>
                {onOpenPresets && (
                  <button
                    type="button"
                    onClick={onOpenPresets}
                    className="py-1.5 px-3 rounded-lg bg-white/90 hover:bg-white text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-lime-600" />
                    <span>Presets</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMode(mode === "url" ? "upload" : "url")}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white font-medium text-xs transition-colors"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State Dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`${heightClass} flex flex-col items-center justify-center p-4 border-2 border-dashed transition-all cursor-pointer ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-emerald-700">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs font-bold">Uploading to /public/uploads...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Click to upload or drag image here
                </div>
                <div className="text-[11px] text-slate-500">
                  PNG, JPG, WEBP • Max 2 MB
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* URL or Presets Actions Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Image (Max 2MB)</span>
          </button>

          {onOpenPresets && (
            <>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={onOpenPresets}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Presets</span>
              </button>
            </>
          )}

          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => setMode(mode === "url" ? "upload" : "url")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <LinkIcon className="h-3 w-3" />
            <span>{mode === "url" ? "Hide URL" : "Paste URL"}</span>
          </button>
        </div>

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setUrlInput("");
            }}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
          >
            Remove
          </button>
        )}
      </div>

      {/* Manual URL input drawer if expanded */}
      {mode === "url" && (
        <div className="flex gap-2 pt-1">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/... or /uploads/..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-emerald-500"
          />
          <button
            type="button"
            onClick={() => {
              if (urlInput.trim()) {
                onChange(urlInput.trim());
              }
            }}
            className="py-1.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
