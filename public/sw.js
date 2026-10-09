// ==============================================================================
// Be Free Fitness OS - Web Push & PWA Service Worker (RFC 8292 Compatible)
// Handles native device push delivery on Android, iOS (16.4+ standalone), & Desktop
// ==============================================================================

const CACHE_NAME = "befree-cache-v1";
const STATIC_ASSETS = [
  "/bff-icon.png",
  "/manifest.json",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      ),
    ])
  );
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
    vibrate: [200, 100, 200, 100, 200],
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
        vibrate: payload.vibrate || [200, 100, 200, 100, 200],
        data: payload.data || { url: payload.url || "/portal" },
      };
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data || { url: notificationData.url },
    tag: notificationData.tag,
    vibrate: [200, 100, 200, 100, 200],
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
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Cache-First strategy for static assets, network-first for pages
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache-first for icons and manifest
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
