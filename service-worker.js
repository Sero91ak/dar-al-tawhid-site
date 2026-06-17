/* DAR AL TAWḤID – Offline Light Service Worker
   Ziel: Startseite/App-Hülle offline nutzbar machen, ohne viel Speicher zu belegen.
   Hinweis: OneSignal nutzt eigenen Service Worker unter /push/onesignal/ und wird hier nicht verändert.
*/

const CACHE_VERSION = 'dar-al-tawhid-offline-light-v102';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/notification-icon-192.png',
  '/notification-icon-256.png',
  '/notification-badge-96.png',
  '/notification-badge-72.png',
  '/favicon.ico',
  '/favicon-16.png',
  '/favicon-32.png',
  '/favicon-48.png',
  '/apple-touch-icon.png',
  '/app-icon-192.png',
  '/app-icon-512.png',
  '/watermark-my-logo-full.png',
  '/watermark-circle-soft.png',
  '/content/duas/duas.json',
  '/content/quran/surahs.json',
  '/content/quran-athar/de/001.json',
  '/assets/site-analytics.js'
];

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'PRECACHE' || !Array.isArray(data.urls) || !data.urls.length) return;
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => Promise.allSettled(
      data.urls.map((url) => fetch(url, { cache: 'reload' })
        .then((response) => (response && response.ok ? cache.put(url, response) : null))
        .catch(() => null))
    ))
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('dar-al-tawhid-offline-light-') && key !== CACHE_VERSION)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Wenn Nutzer auf Push-Benachrichtigung klickt → Beitrag öffnen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url
    || event.notification.data?.launchURL
    || (event.notification.data?.buttons?.[0]?.url)
    || event.notification.data?.additionalData?.launchURL
    || 'https://dar-al-tawhid.de/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Schon ein Fenster offen? → fokussieren und zur URL navigieren
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrlObj = new URL(targetUrl);
        if (clientUrl.origin === targetUrlObj.origin) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Kein Fenster offen → neues öffnen
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Keine OneSignal-Dateien anfassen.
  if (url.pathname.startsWith('/push/onesignal/')) return;

  // Admin-App hat eigenen Service Worker unter /admin/ – nicht abfangen.
  if (url.pathname.startsWith('/admin')) return;

  // Navigation: online frisch laden, offline gecachte index.html anzeigen.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy)).catch(() => null);
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Nur eigene Dateien cachen, keine fremden großen API/CDN-Antworten.
  if (url.origin !== self.location.origin) return;

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
