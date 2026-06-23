// PWA 설치 가능 조건 충족 + 페이지를 닫아도 서비스 워커가 살아있는 동안
// push 이벤트를 받을 수 있게 함
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'SmartPantry';
  const options = {
    body: data.body || '',
    icon: data.icon || '/notif-icon-192.png',
    badge: data.badge || '/notif-badge-72.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
