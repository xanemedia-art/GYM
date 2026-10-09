"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushNotificationState {
  isSupported: boolean;
  isStandalonePWA: boolean;
  isIOS: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  subscribing: boolean;
  sendingTest: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestPush: () => Promise<{ success: boolean; message: string }>;
}

export function usePushNotifications(): PushNotificationState {
  const [isSupported, setIsSupported] = useState(false);
  const [isStandalonePWA, setIsStandalonePWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalonePWA(isStandalone);

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (!supported) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Verify if subscription applicationServerKey matches current server key
          try {
            const keyRes = await fetch("/api/v1/notifications/push/vapid-key");
            const keyJson = await keyRes.json();
            const serverKey = keyJson.data?.publicKey;
            if (serverKey && (subscription as any).options?.applicationServerKey) {
              const currentKeyArray = new Uint8Array((subscription as any).options.applicationServerKey);
              const expectedKeyArray = urlBase64ToUint8Array(serverKey);
              const isMatch =
                currentKeyArray.length === expectedKeyArray.length &&
                currentKeyArray.every((val, i) => val === expectedKeyArray[i]);
              if (!isMatch) {
                console.warn("[Push] Subscription registered with outdated VAPID key. Cleaning up stale subscription.");
                await subscription.unsubscribe();
                setIsSubscribed(false);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn("[Push] VAPID key sync check:", e);
          }
          setIsSubscribed(true);
        } else {
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      console.warn("[Push] Error checking subscription status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported by this browser.");
      return false;
    }

    setSubscribing(true);
    setError(null);

    try {
      // 1. Request user permission (must be triggered from an explicit user tap)
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError(
          perm === "denied"
            ? "Notification permission was blocked. Please enable notifications in your device/browser settings."
            : "Notification permission was dismissed."
        );
        return false;
      }

      // 2. Register service worker at root scope
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // 3. Clean up any existing subscription first to prevent InvalidStateError or stale keys
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        try {
          await existing.unsubscribe();
        } catch (unsubErr) {
          console.warn("[Push] Cleanup prior subscription:", unsubErr);
        }
      }

      // 4. Fetch VAPID Public Key from server
      const keyRes = await fetch("/api/v1/notifications/push/vapid-key");
      const keyJson = await keyRes.json();
      if (!keyJson.success || !keyJson.data?.publicKey) {
        throw new Error("Failed to retrieve public push key from server.");
      }

      const applicationServerKey = urlBase64ToUint8Array(keyJson.data.publicKey);

      // 5. Subscribe to browser push service with latest key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });

      const subscriptionJSON = subscription.toJSON();

      if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
        throw new Error("Malformed push subscription returned by browser.");
      }

      // 6. Send subscription to gym backend
      const deviceType = isStandalonePWA
        ? "MOBILE_PWA"
        : isIOS
        ? "IOS_SAFARI"
        : "BROWSER";

      const subRes = await fetch("/api/v1/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
          keys: {
            p256dh: subscriptionJSON.keys.p256dh,
            auth: subscriptionJSON.keys.auth,
          },
          deviceType,
        }),
      });

      const subJson = await subRes.json();
      if (!subRes.ok || !subJson.success) {
        throw new Error(subJson.error?.message || "Failed to save push subscription.");
      }

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      console.error("[Push] Subscription failed:", err);
      setError(err.message || "Failed to activate push notifications.");
      return false;
    } finally {
      setSubscribing(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setSubscribing(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();

          // Inform server
          await fetch("/api/v1/notifications/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          });
        }
      }

      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      console.error("[Push] Unsubscribe failed:", err);
      setError(err.message || "Failed to remove push subscription.");
      return false;
    } finally {
      setSubscribing(false);
    }
  };

  const sendTestPush = async (): Promise<{ success: boolean; message: string }> => {
    setSendingTest(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      const bodyPayload = subscription
        ? {
            endpoint: subscription.endpoint,
            keys: subscription.toJSON().keys,
          }
        : {};

      let res = await fetch("/api/v1/notifications/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      let json = await res.json();

      // If push service reports stale/mismatched subscription, auto-heal by refreshing subscription
      if (!res.ok || !json.success) {
        const errorDetails = json.error?.details || {};
        const errorMsg = (json.error?.message || "").toLowerCase();
        const shouldAutoResubscribe =
          errorDetails.expired ||
          errorDetails.statusCode === 400 ||
          errorDetails.statusCode === 403 ||
          errorDetails.statusCode === 404 ||
          errorDetails.statusCode === 410 ||
          errorMsg.includes("key mismatch") ||
          errorMsg.includes("re-enable") ||
          errorMsg.includes("refresh");

        if (shouldAutoResubscribe) {
          console.log("[Push] Subscription stale/mismatched, auto-refreshing device subscription with latest VAPID key...");
          const reSubSuccess = await subscribe();
          if (reSubSuccess) {
            const freshRegistration = await navigator.serviceWorker.getRegistration("/sw.js");
            const freshSub = await freshRegistration?.pushManager.getSubscription();
            if (freshSub) {
              const retryPayload = {
                endpoint: freshSub.endpoint,
                keys: freshSub.toJSON().keys,
              };
              res = await fetch("/api/v1/notifications/push/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(retryPayload),
              });
              json = await res.json();
            }
          }
        }
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to send test push notification.");
      }

      return {
        success: true,
        message: json.data?.message || "Test alert delivered to your device!",
      };
    } catch (err: any) {
      console.error("[Push] Test push failed:", err);
      const errMsg = err.message || "Test notification delivery failed.";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setSendingTest(false);
    }
  };

  return {
    isSupported,
    isStandalonePWA,
    isIOS,
    permission,
    isSubscribed,
    loading,
    subscribing,
    sendingTest,
    error,
    subscribe,
    unsubscribe,
    sendTestPush,
  };
}
