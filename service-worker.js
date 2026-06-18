/* DAR AL TAWḤID – Offline Light Service Worker
   Ziel: Startseite/App-Hülle offline nutzbar machen, ohne viel Speicher zu belegen.
   Hinweis: OneSignal nutzt eigenen Service Worker unter /push/onesignal/ und wird hier nicht verändert.
*/

const CACHE_VERSION = 'dar-al-tawhid-offline-light-v111';
const APP_SHELL = [
  '/',
  '/index.html',
  '/test/',
  '/test/index.html',
  '/manifest.json',
  '/manifest-staging.json',
  '/test-apple-touch-icon.png',
  '/test-app-icon-192.png',
  '/test-app-icon-512.png',
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

let bypassPostCacheUntil = 0;
let hardRefreshUntil = 0;

function refreshBypassActive() {
  return Date.now() < hardRefreshUntil || Date.now() < bypassPostCacheUntil;
}

function isPostDataRequest(url) {
  return url.pathname.includes('/content/posts/') || url.pathname.endsWith('/posts-index.json');
}

function parsePostIdFromUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const fromQuery = url.searchParams.get('post');
    if (fromQuery) return decodeURIComponent(fromQuery);
    const pathMatch = url.pathname.match(/^\/post\/([^/?#]+)/i);
    if (pathMatch) return decodeURIComponent(pathMatch[1]);
    const hash = decodeURIComponent((url.hash || '').replace(/^#/, ''));
    const hashMatch = hash.match(/^post\/(.+)$/);
    if (hashMatch) return hashMatch[1];
  } catch (e) {}
  return '';
}

function buildPostLaunchUrl(postId, cacheVersion) {
  const slug = String(postId || '').trim();
  const v = cacheVersion || Date.now();
  const origin = self.location.origin;
  return `${origin}/?post=${encodeURIComponent(slug)}&v=${encodeURIComponent(v)}#post/${encodeURIComponent(slug)}`;
}

async function focusClientToPost(clientList, targetUrl, postId) {
  const targetUrlObj = new URL(targetUrl);
  for (const client of clientList) {
    const clientUrl = new URL(client.url);
    if (clientUrl.origin !== targetUrlObj.origin) continue;
    await client.focus();
    client.postMessage({
      type: 'NAVIGATE_POST',
      postId: postId || parsePostIdFromUrl(targetUrl),
      url: targetUrl
    });
    if (typeof client.navigate === 'function') {
      try {
        await client.navigate(targetUrl);
        return true;
      } catch (e) {}
    }
    return true;
  }
  return false;
}

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'BYPASS_POST_CACHE') {
    bypassPostCacheUntil = Date.now() + 5 * 60 * 1000;
    return;
  }
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'HARD_REFRESH') {
    hardRefreshUntil = Date.now() + 15 * 60 * 1000;
    bypassPostCacheUntil = Math.max(bypassPostCacheUntil, hardRefreshUntil);
    const respond = () => {
      const client = event.source;
      if (client && typeof client.postMessage === 'function') {
        try { client.postMessage({ type: 'HARD_REFRESH_DONE' }); } catch (e) {}
      }
    };
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(
          keys.filter((key) => key.startsWith('dar-al-tawhid-offline-light-'))
            .map((key) => caches.delete(key))
        ))
        .then(() => self.skipWaiting())
        .then(respond)
        .catch(respond)
    );
    return;
  }
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

  const data = event.notification.data || {};
  const postId = String(data.postId || data.slug || parsePostIdFromUrl(data.url || '')).trim();
  const targetUrl = data.url
    || event.notification.data?.launchURL
    || (event.notification.data?.buttons?.[0]?.url)
    || event.notification.data?.additionalData?.launchURL
    || (postId ? buildPostLaunchUrl(postId, data.cacheVersion || Date.now()) : 'https://dar-al-tawhid.de/');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const focused = await focusClientToPost(clientList, targetUrl, postId);
      if (focused) return;
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
      fetch(request, { cache: refreshBypassActive() ? 'no-store' : 'no-cache' })
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

  // Nach App-Aktualisieren: kurz alles frisch vom Netz laden.
  if (refreshBypassActive()) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => null);
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Beitragsdaten und Index: Network-first, damit neue Beiträge nicht blockiert werden.
  if (isPostDataRequest(url) || Date.now() < bypassPostCacheUntil) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => null);
          }
          return response;
        })
        .catch(() => caches.match(request))
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
