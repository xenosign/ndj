"use client";

import { useEffect } from "react";
import { requestFCMToken } from "@/lib/firebase/messaging";

export default function NotificationInit() {
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

      await fetch("/api/fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }

    init();
  }, []);

  return null;
}
