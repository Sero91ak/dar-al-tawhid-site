/* DĀR AL TAWḤĪD — isolated Android PWA service worker. Scope /pwa/ only.
 * Cold-start v3: return navigation immediately; cache the app shell in the
 * background. In particular, NEVER fetch the 2.5 MB shell during install.
 * The public website, OneSignal, iOS and Kids workers are unaffected.
 */
const CACHE_PREFIX='dar-al-tawhid-pwa-';
const CACHE_VERSION=CACHE_PREFIX+'v3';
const SHELL_URL='/pwa/?pwa=1';

async function cacheShell(response) {
  if (!response || !response.ok) return;
  const cache=await caches.open(CACHE_VERSION);
  await cache.put(SHELL_URL,response);
}

self.addEventListener('install',event=>{
  // Pre-fetching the large app shell here can compete with the first launch.
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_VERSION).map(name=>caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  const type=String(event.data&&event.data.type||'');
  if(type==='SKIP_WAITING')self.skipWaiting();
  if(type==='CLEAR_PWA_CACHE')event.waitUntil(caches.keys().then(names=>
    Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)).map(name=>caches.delete(name)))));
});
function cacheable(url,request){
  if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('range'))return false;
  if(url.pathname.startsWith('/admin/')||url.pathname.startsWith('/kids/')||url.pathname.startsWith('/test/')||url.pathname.startsWith('/push/onesignal/'))return false;
  return /^(?:\/assets\/|\/content\/|\/data\/|\/q\/|\/quellen\/|\/widgets\/|\/apple-tv\/)/.test(url.pathname)||
    /\.(?:css|js|json|png|jpe?g|webp|svg|woff2?|mp3|m4a|aac|ogg)$/i.test(url.pathname);
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(request.mode==='navigate'){
    if(url.pathname==='/pwa/install'||url.pathname.startsWith('/pwa/install/'))return;
    if(!url.pathname.startsWith('/pwa'))return;
    event.respondWith((async()=>{
      try {
        const response=await fetch(request,{cache:'no-store'});
        if(response && response.ok){
          // Do not await CacheStorage.put: it must not block the first frame.
          const writing=cacheShell(response.clone()).catch(()=>null);
          event.waitUntil(writing);
        }
        return response;
      } catch(error) {
        const cache=await caches.open(CACHE_VERSION);
        return (await cache.match(SHELL_URL))||Response.error();
      }
    })());
    return;
  }
  if(url.pathname==='/manifest.json'||url.pathname==='/version.json'){
    event.respondWith(fetch(request,{cache:'no-store'}));
    return;
  }
  if(!cacheable(url,request))return;
  event.respondWith(fetch(request,{cache:'no-store'}).then(async response=>{
    if(response&&response.ok){
      const cache=await caches.open(CACHE_VERSION);
      cache.put(request,response.clone()).catch(()=>null);
    }
    return response;
  }).catch(()=>caches.open(CACHE_VERSION).then(cache=>cache.match(request))));
});
