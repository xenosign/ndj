"use client";

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";
import app from "./client";

export function getFirebaseMessaging() {
  return getMessaging(app);
}

/**
 * FCM 토큰 발급
 * - 브라우저 알림 권한 요청 후 토큰 반환
 * - 서버에 토큰을 저장해 푸시 발송에 사용
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("알림 권한이 거부되었습니다.");
      return null;
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );

    // SW가 active 상태가 될 때까지 대기
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

/**
 * 포그라운드 메시지 수신 리스너
 */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
) {
  const messaging = getFirebaseMessaging();
  return onMessage(messaging, callback);
}
