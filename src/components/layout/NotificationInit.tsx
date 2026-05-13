"use client";

import { useEffect, useRef } from "react";
import { requestFCMToken } from "@/lib/firebase/messaging";

export default function NotificationInit() {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    )
      return;

    async function init() {
      const token = await requestFCMToken();
      if (!token) return;
      tokenRef.current = token;

      await fetch("/api/fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }

    init();

    function handleUnload() {
      const token = tokenRef.current;
      if (!token) return;
      navigator.sendBeacon(
        "/api/fcm-token/unregister",
        new Blob([JSON.stringify({ token })], { type: "application/json" })
      );
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return null;
}
