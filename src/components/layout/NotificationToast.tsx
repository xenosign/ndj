"use client";

import { useEffect, useState } from "react";
import { onForegroundMessage } from "@/lib/firebase/messaging";

interface Toast {
  id: number;
  title: string;
  body: string;
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onForegroundMessage((payload) => {
        const title = payload.notification?.title ?? "알림";
        const body = payload.notification?.body ?? "";
        const id = Date.now();

        setToasts((prev) => [...prev, { id, title, body }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
      });
    } catch (e) {
      console.warn("[NotificationToast] FCM 초기화 실패:", e);
    }

    return () => unsubscribe?.();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100%-32px)] max-w-[400px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg"
          style={{ backgroundColor: "#3D2510", border: "1px solid #7B4A2D" }}
        >
          <img
            src="/icons/WEGOBE-logo-192.png"
            alt=""
            className="w-8 h-8 rounded-full shrink-0 mt-0.5"
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#F2C14E" }}>
              {toast.title}
            </p>
            <p className="text-xs leading-snug" style={{ color: "#E8D5B0" }}>
              {toast.body}
            </p>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="shrink-0 text-xs leading-none mt-0.5"
            style={{ color: "#7B4A2D" }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
