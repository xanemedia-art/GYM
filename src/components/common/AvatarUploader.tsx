"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Video,
  X,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
} from "lucide-react";
import { compressAndCropAvatar, formatBytes } from "@/lib/image-compression";

interface AvatarUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  tenantId?: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

export function AvatarUploader({
  value,
  onChange,
  tenantId,
  label = "Profile Photo",
  description = "Face photo required for gate pass and member verification",
  required = false,
  className = "",
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  // Webcam modal state
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value !== undefined) {
      setPreviewUrl(value);
    }
  }, [value]);

  // Handle local processing & upload
  const processAndUploadFile = async (fileOrBlob: File | Blob) => {
    setError(null);
    setUploading(true);

    try {
      // 1. In-browser instant crop & shrink (< 100ms)
      const compressed = await compressAndCropAvatar(fileOrBlob, 400, 0.82);
      setPreviewUrl(compressed.dataUrl);
      setCompressionInfo(`Optimized to ${formatBytes(compressed.sizeBytes)} (WebP 400×400)`);

      // 2. Background Upload to Supabase Storage
      const formData = new FormData();
      formData.append(
        "file",
        compressed.blob,
        `avatar-${Date.now()}.webp`
      );
      if (tenantId) {
        formData.append("tenantId", tenantId);
      }

      const res = await fetch("/api/v1/uploads/avatar", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to upload photo to storage");
      }

      onChange(json.data.url);
    } catch (err: any) {
      console.error("Avatar process/upload error:", err);
      setError(err.message || "Failed to process image");
      // Keep local preview if available or revert
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  // ---------------- Webcam Handlers ----------------
  const startWebcam = async () => {
    setIsWebcamOpen(true);
    setCameraLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCamera(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasCamera(false);
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser settings or upload a photo."
          : "Could not access camera. Please use file upload instead."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsWebcamOpen(false);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          stopWebcam();
          if (blob) {
            processAndUploadFile(blob);
          }
        },
        "image/jpeg",
        0.9
      );
    } catch (err: any) {
      console.error("Capture snapshot error:", err);
      setError("Failed to capture snapshot from webcam.");
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setCompressionInfo(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (selfieInputRef.current) selfieInputRef.current.value = "";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Info */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5 text-emerald-600" />
          <span>{label}</span>
          {required ? (
            <span className="text-rose-500 font-bold">*</span>
          ) : (
            <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
          )}
        </label>
        {compressionInfo && (
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
            {compressionInfo}
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-slate-500">{description}</p>}

      {/* Main Upload Box */}
      <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-slate-300">
        {previewUrl ? (
          /* Preview Mode */
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-400/80 shadow-sm bg-white">
              <img
                src={previewUrl}
                alt="Member Avatar Preview"
                className="h-full w-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-[9px] font-bold mt-1">Uploading</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Photo Ready</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Automatically centered & compressed for gate pass recognition.
              </p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100/70 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Capture Controls */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Add Member Photo</p>
                <p className="text-[11px] text-slate-500">
                  Take a selfie on mobile, use front-desk webcam, or select file.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {/* Mobile Quick Selfie (Front Camera) */}
              <button
                type="button"
                onClick={() => selfieInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Selfie / Camera</span>
              </button>

              {/* Desk Webcam Snap (For Counter/PC) */}
              <button
                type="button"
                onClick={startWebcam}
                disabled={uploading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
              >
                <Video className="h-3.5 w-3.5 text-slate-500" />
                <span>Webcam</span>
              </button>

              {/* File Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>Browse</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* Mobile camera capture trigger */}
        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Webcam Capture Modal */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Video className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Front Desk Photo Capture</h3>
                  <p className="text-[11px] text-slate-500">Center face in the circle</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopWebcam}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Camera Viewfinder */}
            <div className="relative bg-slate-950 aspect-4/3 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // mirror view
              />

              {/* Circular Face Alignment Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="h-48 w-48 rounded-full border-2 border-dashed border-emerald-400/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)] flex items-center justify-center">
                  <div className="text-[10px] text-emerald-200 font-bold bg-slate-900/70 px-2 py-0.5 rounded-full">
                    Position Face Here
                  </div>
                </div>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <span className="text-xs font-bold mt-2">Connecting to camera...</span>
                </div>
              )}
            </div>

            {/* Bottom Shutter Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={stopWebcam}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={captureWebcamSnapshot}
                disabled={cameraLoading || !hasCamera}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md transition-all"
              >
                <Camera className="h-4 w-4" />
                <span>Snap & Auto-Crop Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
