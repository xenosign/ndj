"use client";

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";
import app from "./client";

export function getFirebaseMessaging() {
  return getMessaging(app);
}

export async function requestFCMToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );

    await new Promise<void>((resolve) => {
      if (registration.active) { resolve(); return; }
      const target = registration.installing ?? registration.waiting;
      if (!target) { resolve(); return; }
      target.addEventListener("statechange", function handler() {
        if (this.state === "activated") {
          this.removeEventListener("statechange", handler);
          resolve();
        }
      });
    });

    const messaging = getFirebaseMessaging();
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (error) {
    console.error("FCM 토큰 발급 실패:", error);
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
) {
  const messaging = getFirebaseMessaging();
  return onMessage(messaging, callback);
}
