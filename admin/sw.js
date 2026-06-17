const CACHE_VERSION = 'dar-admin-stats-v15';
const SHELL = [
  '/admin/manifest.json',
  '/admin/admin-icon-192.png',
  '/admin/admin-icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/push/onesignal/')) return;
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/admin')) return;

  const isAdminShell = request.mode === 'navigate'
    || url.pathname === '/admin/'
    || url.pathname === '/admin/index.html';

  if (isAdminShell) {
    event.respondWith(
      fetch(new Request('/admin/index.html', { cache: 'no-store' }))
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('/admin/index.html', copy)).catch(() => null);
          }
          return response;
        })
        .catch(() => caches.match('/admin/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => null);
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/admin/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes('/admin/'));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});
