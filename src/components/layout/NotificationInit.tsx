"use client";

import { useEffect, useRef } from "react";
import { requestFCMToken } from "@/lib/firebase/messaging";
import { createClient } from "@/lib/supabase/client";
import { initMobileLogger } from "@/lib/mobile-logger";

export default function NotificationInit() {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    )
      return;

    initMobileLogger();

    async function registerToken() {
      console.log("[NI] registerToken 시작");
      const token = await requestFCMToken();
      if (!token) { console.warn("[NI] 토큰 없음"); return; }
      tokenRef.current = token;

      const res = await fetch("/api/fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      console.log("[NI] fcm-token 응답:", res.status);
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[NI] getSession:", session ? "세션있음" : "세션없음");
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
