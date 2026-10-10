/* DAR PUBLIC PWA INSTALL BRIDGE V1 — installation eligibility only.
   This worker never caches anything, never serves the app shell and never
   handles /pwa/, /kids/, /test/, /admin/ or /push/ navigation.
   The installed Android app keeps its independent /pwa/ service worker.
*/
self.addEventListener("install",event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim())});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET"||event.request.mode!=="navigate")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname!=="/"&&url.pathname!=="/desktop-preview/")return;
  // Network-only. Never read or write CacheStorage; never redirect to app.
  event.respondWith(fetch(event.request));
});
