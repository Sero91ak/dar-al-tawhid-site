const CACHE_VERSION = 'dar-admin-stats-v78';
/* live-verify: dar-admin-single-mode-v67 */
const SHELL = [
  '/admin/manifest.json',
  '/admin/admin-icon-192.png',
  '/admin/admin-icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(
        SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      ))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('dar-admin-stats-') && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/push/onesignal/')) return;
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/admin')) return;

  // Safari/iOS: never serve navigation or admin HTML via SW (307 redirect on index.html).
  if (request.mode === 'navigate') return;
  if (url.pathname === '/admin/' || url.pathname === '/admin/index.html') return;

  // App code is network-first. Never prefer an outdated CSS/JS bundle while online.
  // Navigations, HTML, API-like responses and private data are NEVER cached here.
  const staticAsset=/\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);
  if(!staticAsset)return;
  event.respondWith((async()=>{
    let cached=await caches.match(request);
    try{
      const response=await fetch(request,{cache:"no-store"});
      if(response&&response.ok&&response.status===200&&response.type==="basic"){
        const copy=response.clone();
        const cache=await caches.open(CACHE_VERSION);
        await cache.put(request,copy).catch(()=>{});
      }
      return response;
    }catch(error){
      if(cached)return cached;
      throw error;
    }
  })());
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
