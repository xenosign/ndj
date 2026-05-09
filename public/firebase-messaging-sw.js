// Firebase Messaging Service Worker
// 백그라운드 푸시 알림 처리

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

// /api/firebase-sw-config 에서 config를 가져와 Firebase 초기화
async function initFirebase() {
  const res = await fetch("/api/firebase-sw-config");
  const config = await res.json();
  firebase.initializeApp(config);

  const messaging = firebase.messaging();

  // 백그라운드 메시지 처리
  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification ?? {};

    self.registration.showNotification(title ?? "알림", {
      body: body ?? "",
      icon: icon ?? "/icons/WEGOBE-logo-192.png",
      badge: "/icons/WEGOBE-logo-192.png",
      data: payload.data,
    });
  });
}

initFirebase();

// PWA 설치 요건: fetch 이벤트 핸들러 필수
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
