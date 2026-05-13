"use client";

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";
import app from "./client";

export function getFirebaseMessaging() {
  return getMessaging(app);
}

export async function requestFCMToken(): Promise<string | null> {
  try {
    console.log("[FCM] 권한 상태:", Notification.permission);

    if (Notification.permission === "denied") {
      console.log("[FCM] 권한 차단됨, 요청 생략");
      return null;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      console.log("[FCM] 권한 요청 결과:", permission);
      if (permission !== "granted") return null;
    }

    console.log("[FCM] SW 등록 시도");
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    console.log("[FCM] SW 등록 완료, active:", !!registration.active, "installing:", !!registration.installing, "waiting:", !!registration.waiting);

    await new Promise<void>((resolve) => {
      if (registration.active) { resolve(); return; }
      const target = registration.installing ?? registration.waiting;
      if (!target) { resolve(); return; }
      target.addEventListener("statechange", function handler() {
        console.log("[FCM] SW state:", this.state);
        if (this.state === "activated") {
          this.removeEventListener("statechange", handler);
          resolve();
        }
      });
    });
    console.log("[FCM] SW active 완료");

    const messaging = getFirebaseMessaging();
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("[FCM] 토큰 발급:", token ? "성공" : "실패(빈값)");
    return token;
  } catch (error) {
    console.error("[FCM] 토큰 발급 실패:", error);
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
) {
  const messaging = getFirebaseMessaging();
  return onMessage(messaging, callback);
}
