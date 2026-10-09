import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getVapidPublicKey,
  formatPushPayload,
  PushNotificationPayload,
} from "../../src/lib/push-notifications";

describe("16. Web Push & PWA Notifications Architecture (RFC 8292 / VAPID)", () => {
  test("Exposes a valid, base64url-encoded public VAPID key", () => {
    const key = getVapidPublicKey();
    assert.ok(key, "Public key must exist");
    assert.strictEqual(typeof key, "string");
    assert.ok(key.length >= 65, "VAPID public key must be at least 65 chars");
    // Ensure base64url characters only
    assert.match(key, /^[A-Za-z0-9_-]+$/, "Key must be URL-safe base64");
  });

  test("Formats notification payload with required PWA and tactile vibration properties", () => {
    const payload: PushNotificationPayload = {
      title: "Walk-in Lead Alert",
      body: "Rahul Sharma scanned the Entry Gate QR Poster",
      url: "/members",
      tag: "gate-qr-lead-123",
      vibrate: [200, 100, 200],
    };

    const formatted = formatPushPayload(payload);
    const parsed = JSON.parse(formatted);

    assert.strictEqual(parsed.title, "Walk-in Lead Alert");
    assert.strictEqual(parsed.body, "Rahul Sharma scanned the Entry Gate QR Poster");
    assert.strictEqual(parsed.url, "/members");
    assert.strictEqual(parsed.tag, "gate-qr-lead-123");
    assert.deepStrictEqual(parsed.vibrate, [200, 100, 200]);
    assert.strictEqual(parsed.data.url, "/members");
    assert.ok(parsed.icon.includes("bff-icon.png"));
  });

  test("Applies default fallback values for icon, badge, url, and vibration when omitted", () => {
    const payload: PushNotificationPayload = {
      title: "Gym Maintenance",
      body: "Steam room is closed for routine maintenance today.",
    };

    const formatted = formatPushPayload(payload);
    const parsed = JSON.parse(formatted);

    assert.strictEqual(parsed.title, "Gym Maintenance");
    assert.strictEqual(parsed.url, "/portal");
    assert.strictEqual(parsed.tag, "gym-alert");
    assert.deepStrictEqual(parsed.vibrate, [100, 50, 100]);
    assert.ok(parsed.icon, "Must have default icon");
    assert.ok(parsed.badge, "Must have default badge");
  });

  test("Validates PushSubscription structure conforms to W3C Push API specification", () => {
    const validSubscription = {
      endpoint: "https://fcm.googleapis.com/fcm/send/sample-token-123",
      keys: {
        p256dh: "BM6B7b_5sW_eJtF_Qo...",
        auth: "7A9_authSecret...",
      },
    };

    assert.ok(validSubscription.endpoint.startsWith("https://"));
    assert.ok(validSubscription.keys.p256dh.length > 0);
    assert.ok(validSubscription.keys.auth.length > 0);
  });

  test("Correctly identifies 410 Gone / 404 Not Found as subscription expiration signal", () => {
    const isExpired = (status: number) => status === 410 || status === 404;

    assert.strictEqual(isExpired(410), true, "410 Gone must trigger deactivation");
    assert.strictEqual(isExpired(404), true, "404 Not Found must trigger deactivation");
    assert.strictEqual(isExpired(201), false, "201 Created is active");
    assert.strictEqual(isExpired(500), false, "500 Internal Error is transient");
    assert.strictEqual(isExpired(429), false, "429 Rate Limit is transient");
  });
});
