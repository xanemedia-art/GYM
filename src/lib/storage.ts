import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase storage is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or key.");
    }
    _supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return _supabaseClient;
}

export const AVATAR_BUCKET = "member-avatars";

export interface UploadAvatarResult {
  url: string;
  path: string;
  sizeBytes: number;
}

/**
 * Uploads an avatar image buffer or blob to Supabase Storage bucket 'member-avatars'
 * @param buffer Buffer or Uint8Array of the compressed image
 * @param tenantId Tenant ID for organizational folder structure
 * @param contentType MIME type (default image/webp)
 */
export async function uploadMemberAvatar(
  buffer: Buffer | Uint8Array,
  tenantId: string = "common",
  contentType: string = "image/webp"
): Promise<UploadAvatarResult> {
  const client = getSupabaseClient();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const ext = contentType === "image/png" ? "png" : contentType === "image/jpeg" ? "jpg" : "webp";
  const filePath = `tenants/${tenantId}/${timestamp}_${randomSuffix}.${ext}`;

  const { data, error } = await client.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000", // 1 year CDN cache
    });

  if (error) {
    console.error("Supabase avatar upload error:", error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  const { data: urlData } = client.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
    sizeBytes: buffer.byteLength,
  };
}
