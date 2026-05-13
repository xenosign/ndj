importScripts(
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js',
);

// 설치 즉시 활성화 (구버전 SW가 대기하지 않도록)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// 초기화 Promise — SW 재시작 시에도 push 이벤트 전에 완료되도록 모듈 최상위에서 실행
const initPromise = fetch('/api/firebase-sw-config')
  .then((res) => res.json())
  .then((config) => {
    if (!firebase.apps.length) firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.data?.title ?? '알림';
      const body = payload.data?.body ?? '';
      const url = payload.data?.url ?? '/';

      self.registration.showNotification(title ?? '알림', {
        body: body ?? '',
        icon: '/icons/WEGOBE-logo-192.png',
        badge: '/icons/WEGOBE-badge-72.png',
        data: { url },
      });
    });
  })
  .catch((err) => console.error('[SW] Firebase 초기화 실패:', err));

// push 이벤트 도착 시 초기화가 완료될 때까지 대기
self.addEventListener('push', (event) => {
  event.waitUntil(initPromise);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    }),
  );
});
