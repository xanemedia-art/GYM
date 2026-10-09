"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            registration.update().catch(() => {});
          })
          .catch((error) => {
            console.warn("[PWA] Service worker registration error:", error);
          });
      });
    }
  }, []);

  return null;
}
