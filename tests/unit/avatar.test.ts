import { test, describe } from "node:test";
import assert from "node:assert";
import { formatBytes } from "../../src/lib/image-compression";
import { uploadMemberAvatar, AVATAR_BUCKET } from "../../src/lib/storage";

describe("11. Member Profile Picture Optimization & Storage Pipeline", () => {
  test("formatBytes utility formats byte sizes correctly", () => {
    assert.strictEqual(formatBytes(0), "0 B");
    assert.strictEqual(formatBytes(1024), "1 KB");
    assert.strictEqual(formatBytes(35 * 1024), "35 KB");
    assert.strictEqual(formatBytes(5 * 1024 * 1024), "5 MB");
  });

  test("AVATAR_BUCKET is configured as member-avatars", () => {
    assert.strictEqual(AVATAR_BUCKET, "member-avatars");
  });

  test("Uploads test avatar to Supabase member-avatars storage bucket", async () => {
    const dummyWebpBuffer = Buffer.from("RIFF\x20\x00\x00\x00WEBPVP8 \x14\x00\x00\x00test-avatar-bytes");
    const result = await uploadMemberAvatar(dummyWebpBuffer, "unit-test-tenant", "image/webp");

    assert.ok(result.url, "Should return a public CDN URL");
    assert.ok(result.url.includes("member-avatars"), "URL should contain bucket name");
    assert.ok(result.path.startsWith("tenants/unit-test-tenant/"), "Path should be tenant scoped");
    assert.strictEqual(result.sizeBytes, dummyWebpBuffer.byteLength);
  });
});
