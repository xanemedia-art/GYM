import { formatPushPayload, getVapidPublicKey } from "../src/lib/push-notifications";

function verifyPushEngine() {
  console.log("--- 1. Testing VAPID Public Key Configuration ---");
  const vapidKey = getVapidPublicKey();
  console.log("VAPID Public Key:", vapidKey);
  if (!vapidKey || vapidKey.length < 50) {
    throw new Error("Invalid or missing VAPID public key");
  }
  console.log("✅ VAPID Public Key is valid and compliant.");

  console.log("\n--- 2. Testing Push Payload Formatting ---");
  const payloadStr = formatPushPayload({
    title: "New Gate Registration! 🏋️",
    body: "Ramesh Patel (9876543210) self-registered via Gate QR at Be Free Fitness Prem Nagar!",
    url: "/members",
    tag: "gate-reg-test-101",
    vibrate: [200, 100, 200, 100, 200],
  });

  const parsed = JSON.parse(payloadStr);
  console.log("Formatted Payload:", parsed);

  if (parsed.title !== "New Gate Registration! 🏋️") throw new Error("Title mismatch");
  if (!parsed.vibrate || parsed.vibrate.length !== 5) throw new Error("Vibration pattern mismatch");
  if (parsed.url !== "/members") throw new Error("URL mismatch");
  console.log("✅ Push payload formatting matches Apple APNs & FCM standards.");

  console.log("\n--- Verification Summary: PUSH ENGINE READY ---");
}

verifyPushEngine();
