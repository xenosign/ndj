// Firebase Messaging Service Worker
// 백그라운드 푸시 알림 처리

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

// 환경변수를 Service Worker에서 직접 사용 불가 → 빌드 시 주입하거나 아래처럼 placeholder 사용
// 실제 값은 클라이언트에서 messaging.ts를 통해 처리됨
firebase.initializeApp({
  apiKey: self.__FIREBASE_CONFIG__?.apiKey,
  authDomain: self.__FIREBASE_CONFIG__?.authDomain,
  projectId: self.__FIREBASE_CONFIG__?.projectId,
  storageBucket: self.__FIREBASE_CONFIG__?.storageBucket,
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId,
  appId: self.__FIREBASE_CONFIG__?.appId,
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] 백그라운드 메시지 수신:", payload);

  const { title, body, icon } = payload.notification ?? {};

  self.registration.showNotification(title ?? "알림", {
    body: body ?? "",
    icon: icon ?? "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: payload.data,
  });
});

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
