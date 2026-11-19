/* DĀR AL TAWḤĪD ʿUmrah scope-only offline cache. No tracking or data uploads. */
const CACHE_NAME='dar-umrah-guide-v3-20261119';
const PREFIX='dar-umrah-guide-';
const OFFLINE_DOCUMENT=new URL('./index.html',self.registration.scope).toString();
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.add(OFFLINE_DOCUMENT)).then(()=>self.skipWaiting()).catch(()=>{}));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.mode!=='navigate')return;
  const u=new URL(request.url);
  if(u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(OFFLINE_DOCUMENT,copy)).catch(()=>{}));}
    return response;
  }).catch(()=>caches.match(OFFLINE_DOCUMENT).then(cached=>cached||Response.error())));
});