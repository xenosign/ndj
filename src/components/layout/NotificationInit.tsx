"use client";

import { useEffect, useRef } from "react";
import { requestFCMToken } from "@/lib/firebase/messaging";
import { createClient } from "@/lib/supabase/client";

export default function NotificationInit() {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    )
      return;

    async function registerToken() {
      const token = await requestFCMToken();
      if (!token) return;
      tokenRef.current = token;

      await fetch("/api/fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) registerToken();
    });

    // 로그인/로그아웃 이벤트 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        registerToken();
      } else if (event === "SIGNED_OUT") {
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
