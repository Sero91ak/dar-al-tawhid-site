/* DAR AL TAWḤID – Offline Light Service Worker
   Ziel: Startseite/App-Hülle offline nutzbar machen, ohne viel Speicher zu belegen.
   Hinweis: OneSignal nutzt eigenen Service Worker unter /push/onesignal/ und wird hier nicht verändert.
*/

const CACHE_VERSION = 'dar-al-tawhid-offline-light-v300';
const OFFLINE_META_KEY = '/__offline_meta_v1__';
const OFFLINE_PREP_PENDING_KEY = '/__offline_prep_pending_v1__';
const OFFLINE_PREP_PROGRESS_KEY = '/__offline_prep_progress_v1__';
const OFFLINE_FETCH_TIMEOUT_MS = 22000;
const OFFLINE_BATCH_SIZE = 10;
const APP_SHELL = [
  '/',
  '/index.html',
  '/test/',
  '/test/index.html',
  '/manifest.json',
  '/manifest-staging.json',
  '/test/manifest.json',
  '/version.json',
  '/data/quran-search-keywords.json',
  '/data/quran-search-index.json',
  '/data/offline-content-manifest.json',
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
let offlinePrepareRunning = false;

async function postToClients(payload) {
  try {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    list.forEach((client) => {
      try { client.postMessage(payload); } catch (e) {}
    });
  } catch (e) {}
}

function normalizeOfflineUrls(urls) {
  const out = new Set();
  (Array.isArray(urls) ? urls : []).forEach((raw) => {
    const value = String(raw || '').trim();
    if (!value) return;
    try {
      const u = new URL(value, self.location.origin);
      if (u.origin !== self.location.origin) return;
      out.add(u.pathname + (u.search || ''));
    } catch (e) {}
  });
  return Array.from(out);
}

async function readJsonCacheEntry(cache, key) {
  try {
    const res = await cache.match(key);
    if (!res) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function writeJsonCacheEntry(cache, key, data) {
  await cache.put(
    key,
    new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  );
}

async function isOfflineUrlCached(cache, url) {
  try {
    const res = await cache.match(url);
    return !!(res && res.ok);
  } catch (e) {
    return false;
  }
}

async function cacheOfflineUrl(cache, url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OFFLINE_FETCH_TIMEOUT_MS);
  try {
    const req = new Request(url, { cache: 'reload', signal: controller.signal });
    const response = await fetch(req);
    if (!response || !response.ok) throw new Error(`HTTP ${response ? response.status : 0}`);
    await cache.put(req, response.clone());
    return Number(response.headers.get('content-length') || 0);
  } finally {
    clearTimeout(timer);
  }
}

async function persistOfflineProgress(cache, payload) {
  await writeJsonCacheEntry(cache, OFFLINE_PREP_PROGRESS_KEY, payload);
}

function offlinePrepareSucceeded(total, loaded, failed) {
  const success = Math.max(0, Number(loaded || 0) - Number(failed || 0));
  if (!total) return true;
  if (success >= total) return true;
  return success / total >= 0.9;
}

async function prepareOfflineBundle(urls, requestedBy = 'user', options = {}) {
  const resume = options.resume === true;
  if (offlinePrepareRunning) {
    await postToClients({ type: 'OFFLINE_PREPARE_BUSY' });
    return;
  }
  offlinePrepareRunning = true;
  const startedAt = new Date().toISOString();
  let normalized = normalizeOfflineUrls(urls);
  const cache = await caches.open(CACHE_VERSION);

  if (!normalized.length && resume) {
    const pending = await readJsonCacheEntry(cache, OFFLINE_PREP_PENDING_KEY);
    normalized = normalizeOfflineUrls(pending?.urls || []);
  }

  if (!normalized.length) {
    offlinePrepareRunning = false;
    await postToClients({ type: 'OFFLINE_PREPARE_DONE', ok: false, total: 0, loaded: 0, failed: 0, bytes: 0, partial: false });
    return;
  }

  await writeJsonCacheEntry(cache, OFFLINE_PREP_PENDING_KEY, { urls: normalized, startedAt, requestedBy });

  const toFetch = [];
  let skipped = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    const url = normalized[i];
    if (await isOfflineUrlCached(cache, url)) skipped += 1;
    else toFetch.push(url);
  }

  const total = normalized.length;
  let loaded = skipped;
  let bytes = 0;
  let failed = 0;

  await postToClients({
    type: 'OFFLINE_PREPARE_START',
    total,
    loaded,
    failed,
    bytes,
    startedAt,
    requestedBy,
    resumed: resume || skipped > 0
  });

  const reportProgress = async (url) => {
    const percent = total ? Math.round((loaded / total) * 100) : 100;
    const payload = {
      total,
      loaded,
      failed,
      bytes,
      percent,
      url,
      updatedAt: new Date().toISOString()
    };
    await postToClients({ type: 'OFFLINE_PREPARE_PROGRESS', ...payload });
    await persistOfflineProgress(cache, payload);
  };

  try {
    for (let i = 0; i < toFetch.length; i += OFFLINE_BATCH_SIZE) {
      const batch = toFetch.slice(i, i + OFFLINE_BATCH_SIZE);
      await Promise.all(batch.map(async (url) => {
        try {
          bytes += await cacheOfflineUrl(cache, url);
        } catch (e) {
          failed += 1;
        } finally {
          loaded += 1;
          await reportProgress(url);
        }
      }));
    }

    const completedAt = new Date().toISOString();
    const ok = offlinePrepareSucceeded(total, loaded, failed);
    const partial = failed > 0 && ok;
    const meta = {
      version: CACHE_VERSION,
      total,
      loaded,
      failed,
      bytes,
      startedAt,
      completedAt,
      requestedBy,
      ok,
      partial
    };

    await writeJsonCacheEntry(cache, OFFLINE_META_KEY, meta);
    if (ok) await cache.delete(OFFLINE_PREP_PENDING_KEY);

    await postToClients({
      type: 'OFFLINE_PREPARE_DONE',
      ok,
      partial,
      ...meta
    });
  } finally {
    offlinePrepareRunning = false;
  }
}

function refreshBypassActive() {
  return Date.now() < hardRefreshUntil || Date.now() < bypassPostCacheUntil;
}

function isFeedAssetRequest(url) {
  return url.pathname === '/assets/premium-feed-app.js'
    || url.pathname === '/assets/focus-feed-app.js'
    || url.pathname === '/assets/html2canvas.min.js'
    || url.pathname.startsWith('/assets/posts/');
}

function isAppShellRequest(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname === '/' || url.pathname === '/index.html') return true;
  if (url.pathname === '/test/' || url.pathname === '/test/index.html') return true;
  if (url.pathname === '/version.json' || url.pathname === '/test/version.json') return true;
  return false;
}

function isPinnedLiveBootRequest(url) {
  return url.hostname === 'cdn.jsdelivr.net' && /\/gh\/Sero91ak\/dar-al-tawhid-site@.+\/assets\/live-boot\.js$/i.test(url.pathname);
}

function isPostDataRequest(url) {
  return url.pathname.includes('/content/posts/') || url.pathname.endsWith('/posts-index.json') || url.pathname.includes('/content/staging/posts/') || url.pathname.includes('/content/stories/') || url.pathname.includes('/content/staging/stories/') || url.pathname.includes('/content/focus-feed/') || url.pathname.includes('/content/staging/focus-feed/') || url.pathname.includes('/content/feed-backgrounds/') || url.pathname.includes('/content/staging/feed-backgrounds/') || url.pathname.includes('/assets/feed-backgrounds/') || url.pathname.includes('/content/updates/') || url.pathname.includes('/content/staging/updates/');
}

function navigationShellKey(url) {
  return url.pathname.startsWith('/test') ? '/test/index.html' : '/index.html';
}

function storeShellResponse(shellKey, response) {
  if (!response || !response.ok) return Promise.resolve(response);
  const copy = response.clone();
  return caches.open(CACHE_VERSION)
    .then((cache) => cache.put(shellKey, copy))
    .catch(() => null)
    .then(() => response);
}

function fetchNavigationShell(request, shellKey) {
  return fetch(request, { cache: 'no-store' })
    .then((response) => storeShellResponse(shellKey, response));
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
  if (data.type === 'OFFLINE_PREPARE_RESET') {
    offlinePrepareRunning = false;
    return;
  }
  if (data.type === 'OFFLINE_PREPARE') {
    event.waitUntil(prepareOfflineBundle(data.urls, data.requestedBy || 'user', { resume: data.resume === true }));
    return;
  }
  if (data.type === 'OFFLINE_PREPARE_RESUME') {
    event.waitUntil(prepareOfflineBundle(data.urls || [], data.requestedBy || 'resume', { resume: true }));
    return;
  }
  if (data.type === 'OFFLINE_PREPARE_STATUS') {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CACHE_VERSION);
        const meta = await readJsonCacheEntry(cache, OFFLINE_META_KEY);
        const progress = await readJsonCacheEntry(cache, OFFLINE_PREP_PROGRESS_KEY);
        const pending = await readJsonCacheEntry(cache, OFFLINE_PREP_PENDING_KEY);
        await postToClients({
          type: 'OFFLINE_PREPARE_STATUS',
          running: offlinePrepareRunning,
          meta: meta || null,
          progress: progress || null,
          pending: pending || null
        });
      } catch (e) {
        await postToClients({
          type: 'OFFLINE_PREPARE_STATUS',
          running: offlinePrepareRunning,
          meta: null,
          progress: null,
          pending: null
        });
      }
    })());
    return;
  }
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
  if (data.type === 'APP_REPAIR') {
    hardRefreshUntil = Date.now() + 15 * 60 * 1000;
    bypassPostCacheUntil = Math.max(bypassPostCacheUntil, hardRefreshUntil);
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith('dar-al-tawhid-offline-light-')).map((key) => caches.delete(key))))
        .then(() => self.skipWaiting())
        .catch(() => null)
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

  // Fest gepinnte CDN-Bootdatei auf die aktuelle Origin-Datei umbiegen.
  if (isPinnedLiveBootRequest(url)) {
    event.respondWith(
      fetch('/assets/live-boot.js', { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) return response;
          return fetch('/assets/live-boot.js', { cache: 'reload' });
        })
        .catch(() => fetch('/assets/live-boot.js'))
    );
    return;
  }

  // App-Hülle und Version: immer zuerst vom Netz (kein veralteter Quiz-Tab/Fokus).
  if (isAppShellRequest(url)) {
    const shellKey = navigationShellKey(url);
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => storeShellResponse(shellKey, response))
        .catch(() => caches.match(shellKey))
        .then((response) => response || caches.match('/index.html'))
    );
    return;
  }

  // Navigation: network-first, damit beim erneuten Oeffnen der App
  // nicht zuerst eine veraltete App-Huelle angezeigt wird.
  if (request.mode === 'navigate') {
    const shellKey = navigationShellKey(url);
    event.respondWith(
      fetchNavigationShell(request, shellKey)
        .catch(() => caches.match(shellKey))
        .then((response) => response || caches.match('/index.html'))
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
  if (isPostDataRequest(url) || isFeedAssetRequest(url) || Date.now() < bypassPostCacheUntil) {
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
