"use client";

import { useEffect, useRef } from "react";
import { requestFCMToken } from "@/lib/firebase/messaging";
import { createClient } from "@/lib/supabase/client";

export default function NotificationInit() {
  const tokenRef = useRef<string | null>(null);
  const registeringRef = useRef(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    )
      return;

    function getDeviceId(): string {
      const key = "fcm_device_id";
      let id = localStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
      }
      return id;
    }

    async function registerToken() {
      if (registeringRef.current || tokenRef.current) return;
      registeringRef.current = true;
      console.log("[NI] registerToken 시작");
      try {
        const token = await requestFCMToken();
        if (!token) { console.warn("[NI] 토큰 없음"); return; }
        tokenRef.current = token;

        const deviceId = getDeviceId();
        const res = await fetch("/api/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, deviceId }),
        });
        console.log("[NI] fcm-token 응답:", res.status);
      } finally {
        registeringRef.current = false;
      }
    }

    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[NI] auth event:", event);
      if (event === "INITIAL_SESSION" && session) {
        registerToken();
      } else if (event === "SIGNED_IN") {
        registerToken();
      } else if (event === "SIGNED_OUT") {
        registeringRef.current = false;
        const token = tokenRef.current;
        if (token) {
          fetch("/api/fcm-token", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          tokenRef.current = null;
        }
      }
    });

    function handleUnload() {
      const token = tokenRef.current;
      if (!token) return;
      navigator.sendBeacon(
        "/api/fcm-token/unregister",
        new Blob([JSON.stringify({ token })], { type: "application/json" })
      );
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return null;
}
