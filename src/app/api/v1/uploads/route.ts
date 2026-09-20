import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { apiError, apiSuccess } from "@/lib/api-response";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB upload limit

// Allowed MIME types mapped strictly to their canonical safe file extension
const ALLOWED_MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

/**
 * Validate image buffer against known binary magic numbers.
 * Prevents disguised executable scripts (.php, .html, .js) from spoofing image MIME types.
 */
function verifyImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // GIF: GIF87a or GIF89a
  if (mimeType === "image/gif") {
    const header = buffer.toString("ascii", 0, 6);
    return header === "GIF87a" || header === "GIF89a";
  }

  // WEBP: RIFF....WEBP
  if (mimeType === "image/webp") {
    const riff = buffer.toString("ascii", 0, 4);
    const webp = buffer.toString("ascii", 8, 12);
    return riff === "RIFF" && webp === "WEBP";
  }

  // AVIF: ....ftyp (avif / avis)
  if (mimeType === "image/avif") {
    const ftyp = buffer.toString("ascii", 4, 8);
    const brand = buffer.toString("ascii", 8, 12);
    return ftyp === "ftyp" && (brand === "avif" || brand === "avis" || brand === "mif1");
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce authentication
    const session = await getSession();
    if (!session) {
      return apiError("Authentication required to upload assets", "UNAUTHORIZED", 401);
    }

    // 2. Enforce Rate Limiting (max 10 uploads per minute per user/ip)
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`upload:${session.id || ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return apiError(
        `Upload limit exceeded. Please wait ${rateLimit.resetSeconds}s before uploading again.`,
        "RATE_LIMITED",
        429
      );
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return apiError("Invalid multipart form data", "BAD_REQUEST", 400);
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return apiError("No image file uploaded", "BAD_REQUEST", 400);
    }

    // 3. Enforce 2 MB upload limit
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return apiError(
        `Image size (${sizeMB} MB) exceeds the maximum allowed limit of 2 MB. Please compress or choose a smaller image.`,
        "FILE_TOO_LARGE",
        400
      );
    }

    // 4. Validate MIME Type against whitelist
    const normalizedMime = file.type.toLowerCase().trim();
    const safeExtension = ALLOWED_MIME_EXT_MAP[normalizedMime];
    if (!safeExtension) {
      return apiError(
        "Invalid file format. Only JPEG, PNG, WEBP, AVIF, and GIF are allowed.",
        "INVALID_FILE_TYPE",
        400
      );
    }

    // 5. Binary magic byte inspection
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isGenuineImage = verifyImageMagicBytes(buffer, normalizedMime);
    if (!isGenuineImage) {
      return apiError(
        "Corrupted or invalid image file content. File header did not match image specification.",
        "INVALID_FILE_SIGNATURE",
        400
      );
    }

    // 6. Prepare safe storage in public/uploads/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 7. Generate safe randomized filename (Never use user-provided extension)
    const safeBase = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `bff_${safeBase}_${timestamp}_${randomSuffix}${safeExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // 8. Write to disk
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return apiSuccess({
      url: publicUrl,
      fileName,
      sizeBytes: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
      storageLocation: "public/uploads",
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return apiError("Failed to upload image: " + (error.message || "Server error"), "SERVER_ERROR", 500);
  }
}
