// ==============================================================================
// Be Free Fitness OS - Web Push & PWA Service Worker (RFC 8292 Compatible)
// Handles native device push delivery on Android, iOS (16.4+ standalone), & Desktop
// ==============================================================================

self.addEventListener("install", (event) => {
  // Immediately activate service worker without waiting
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim all active client tabs immediately
  event.waitUntil(clients.claim());
});

// Push Event Listener: Triggered when APNs or Google FCM pushes encrypted payload
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Be Free Fitness OS",
    body: "You have a new gym operational alert.",
    icon: "/bff-icon.png",
    badge: "/bff-icon.png",
    url: "/portal",
    tag: "gym-alert-" + Date.now(),
    vibrate: [150, 50, 150, 50, 150],
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        url: payload.url || (payload.data && payload.data.url) || notificationData.url,
        tag: payload.tag || notificationData.tag,
        vibrate: payload.vibrate || notificationData.vibrate,
        data: payload.data || { url: payload.url || "/portal" },
      };
    } catch (e) {
      // Fallback for plain text payload
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data || { url: notificationData.url },
    tag: notificationData.tag,
    vibrate: notificationData.vibrate,
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification Click Listener: Focuses existing open window or opens target URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/portal";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If an app window is already open, focus it and navigate
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // If no app window is open, open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
