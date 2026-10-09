import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB max payload

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`upload_avatar:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return apiError(`Upload rate limit exceeded. Please wait ${rateLimit.resetSeconds}s.`, "RATE_LIMITED", 429);
    }

    const contentType = req.headers.get("content-type") || "";
    let buffer: Buffer | null = null;
    let extension = "webp";
    let targetTenantId = "common";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      targetTenantId = body.tenantId || targetTenantId;
      const dataUrl = body.dataUrl || body.image;
      if (!dataUrl || typeof dataUrl !== "string") {
        return apiError("Missing or invalid image data", "VALIDATION_ERROR", 400);
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return apiError("Invalid data URL image format", "VALIDATION_ERROR", 400);
      }

      const mimeType = matches[1];
      if (!mimeType.startsWith("image/")) {
        return apiError("File must be an image", "INVALID_FILE_TYPE", 400);
      }

      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        extension = "jpg";
      } else if (mimeType.includes("png")) {
        extension = "png";
      } else {
        extension = "webp";
      }

      buffer = Buffer.from(matches[2], "base64");
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      targetTenantId = (formData.get("tenantId") as string) || targetTenantId;
      const file = formData.get("file") || formData.get("image");

      if (!file || !(file instanceof Blob)) {
        return apiError("Missing image file in form data", "VALIDATION_ERROR", 400);
      }

      const mimeType = file.type;
      if (!mimeType.startsWith("image/")) {
        return apiError("Uploaded file must be an image", "INVALID_FILE_TYPE", 400);
      }

      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        extension = "jpg";
      } else if (mimeType.includes("png")) {
        extension = "png";
      } else {
        extension = "webp";
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      return apiError("Unsupported content type. Use application/json or multipart/form-data.", "UNSUPPORTED_MEDIA", 415);
    }

    if (!buffer || buffer.length === 0) {
      return apiError("Empty image file received", "EMPTY_FILE", 400);
    }

    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return apiError("Image exceeds 3MB limit. Please compress before uploading.", "FILE_TOO_LARGE", 400);
    }

    // 1. Attempt upload to Supabase Storage (member-avatars bucket)
    try {
      const mimeType = extension === "jpg" ? "image/jpeg" : extension === "png" ? "image/png" : "image/webp";
      const { uploadMemberAvatar } = await import("@/lib/storage");
      const storageResult = await uploadMemberAvatar(buffer, targetTenantId, mimeType);

      return apiSuccess({
        url: storageResult.url,
        path: storageResult.path,
        sizeBytes: storageResult.sizeBytes,
        storage: "supabase",
      }, undefined, 201);
    } catch (storageErr) {
      console.warn("[UPLOAD_AVATAR] Supabase storage upload deferred, using local storage fallback:", storageErr);
    }

    // 2. Fallback to local disk storage: public/uploads/avatars
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueId = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const filename = `avatar_${uniqueId}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);
    const publicUrl = `/uploads/avatars/${filename}`;

    return apiSuccess({
      url: publicUrl,
      filename,
      sizeBytes: buffer.length,
      storage: "local",
    }, undefined, 201);
  } catch (error: any) {
    console.error("Upload Avatar API Error:", error);
    return apiError(error?.message || "Failed to upload profile picture", "SERVER_ERROR", 500);
  }
}
