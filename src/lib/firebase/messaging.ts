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

    const messaging = getFirebaseMessaging();
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      ),
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
