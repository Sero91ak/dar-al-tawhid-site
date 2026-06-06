/* DAR AL TAWḤID – leichter Offline-Service-Worker
   Ziel: App-Shell offline verfügbar machen, ohne viel Speicher auf Smartphones zu belegen.
   Wichtig: index.html bleibt unverändert. Push/OneSignal bleibt unverändert. */

const SW_VERSION = 'dar-al-tawhid-offline-light-v1';
const SHELL_CACHE = `${SW_VERSION}-shell`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const MAX_RUNTIME_ENTRIES = 45;

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16.png',
  '/favicon-32.png',
  '/favicon-48.png',
  '/apple-touch-icon.png',
  '/app-icon-192.png',
  '/app-icon-512.png',
  '/watermark-my-logo-full.png',
  '/watermark-circle-soft.png'
];

async function safeCacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.allSettled(
    APP_SHELL_URLS.map(async (url) => {
      try {
        const request = new Request(url, { cache: 'reload' });
        const response = await fetch(request);
        if (response && response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (error) {
        // Fehlende Dateien dürfen die Installation nicht kaputtmachen.
      }
    })
  );
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  const deleteCount = keys.length - maxItems;
  await Promise.all(keys.slice(0, deleteCount).map((request) => cache.delete(request)));
}

function isSameOrigin(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isStaticAsset(request) {
  return ['style', 'script', 'font', 'image', 'manifest'].includes(request.destination);
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch (error) {
    const cachedIndex = await caches.match('/index.html');
    if (cachedIndex) return cachedIndex;

    const cachedRoot = await caches.match('/');
    if (cachedRoot) return cachedRoot;

    return new Response('DAR AL TAWḤID ist offline. Bitte einmal online öffnen, damit die App gespeichert wird.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        await cache.put(request, response.clone());
        await trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || fetch(request);
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(safeCacheShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('dar-al-tawhid-offline-light-') && ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!request || request.method !== 'GET') return;

  const requestUrl = new URL(request.url);

  // App-Seiten offline öffnen.
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Nur eigene App-Dateien speichern, damit Smartphones nicht voll laufen.
  if (isSameOrigin(requestUrl)) {
    const isShellFile = APP_SHELL_URLS.includes(requestUrl.pathname);

    if (isShellFile) {
      event.respondWith(cacheFirst(request));
      return;
    }

    if (isStaticAsset(request)) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }
  }

  // Externe APIs, OneSignal, GitHub-Raw usw. nicht dauerhaft cachen.
  // Deine index.html speichert geladene Beiträge bereits in localStorage.
});
