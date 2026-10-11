/* DĀR AL TAWḤĪD — isolated Android PWA service worker. Scope /pwa/ only.
 * Fast return v4: preserve existing v3 cache, use local shell and immutable
 * assets on repeat launches. Update shell only periodically in background.
 * Mutable content stays online-first with offline fallback.
 * No root website, Kids, iOS or OneSignal handlers are changed.
 */
const CACHE_PREFIX='dar-al-tawhid-pwa-';
// IMPORTANT: Retain v3 storage key; upgrading must not erase users' offline data.
const CACHE_VERSION=CACHE_PREFIX+'v3';
const SHELL_URL='/pwa/?pwa=1';
const SHELL_META='/pwa/__cached_shell_freshness_v1';
const SHELL_REFRESH_MS=30*60*1000;

async function storeShell(response){
  if(!response||!response.ok||response.redirected)return;
  const cache=await caches.open(CACHE_VERSION);
  await cache.put(SHELL_URL,response);
  await cache.put(SHELL_META,new Response(String(Date.now()),{
    headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}
  }));
}
async function periodicallyRefreshShell(request){
  const cache=await caches.open(CACHE_VERSION);
  const meta=await cache.match(SHELL_META);
  const last=meta?Number(await meta.text()):0;
  if(last&&Date.now()-last<SHELL_REFRESH_MS)return;
  // Let the app paint before the large HTML is refreshed.
  await new Promise(resolve=>setTimeout(resolve,2000));
  try{
    const current=await fetch(request,{cache:'no-store'});
    if(current&&current.ok)await storeShell(current.clone());
  }catch(error){}
}
// Small background package for the first offline visit. Never prefetch
// streaming media, whole libraries or gigabytes of application projects.
const CORE_OFFLINE_URLS=[
  '/assets/app-soft-boot.css?v=668',
  '/assets/app-soft-boot.js?v=678',
  '/watermark-my-logo-full.png',
  '/content/quran/surahs.json',
  '/content/duas/duas.json',
  '/data/offline-content-manifest.json'
];
async function prewarmCore(){
  const cache=await caches.open(CACHE_VERSION);
  // Limit work and use cached copies whenever possible.
  for(const path of CORE_OFFLINE_URLS){
    try{
      if(await cache.match(path))continue;
      const live=await fetch(path,{cache:'no-store'});
      if(!live||!live.ok||live.redirected||live.type==='opaque')continue;
      const length=Number(live.headers&&live.headers.get('content-length')||0);
      if(length>1500000)continue;
      await cache.put(path,live.clone());
    }catch(error){}
  }
}
self.addEventListener('install',event=>{
  // Never prefetch the 2.5 MB shell during installation.
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
  // Do NOT wipe older caches here: preserve downloaded pages and audio.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message',event=>{
  const type=String(event.data&&event.data.type||'');
  if(type==='SKIP_WAITING')self.skipWaiting();
  if(type==='PWA_WARM_CORE')event.waitUntil(prewarmCore().catch(()=>null));
  if(type==='CLEAR_PWA_CACHE')event.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)).map(key=>caches.delete(key)))));
});
function cacheable(u,request){
  if(request.method!=='GET'||u.origin!==self.location.origin||request.headers.has('range'))return false;
  if(u.pathname.startsWith('/admin/')||u.pathname.startsWith('/kids/')||u.pathname.startsWith('/test/')||u.pathname.startsWith('/push/onesignal/'))return false;
  return /^(?:\/assets\/|\/content\/|\/data\/|\/q\/|\/quellen\/|\/widgets\/|\/apple-tv\/)/.test(u.pathname)||
    /\.(?:css|js|json|png|jpe?g|webp|svg|woff2?|mp3|m4a|aac|ogg)$/i.test(u.pathname);
}
function staticVersionedAsset(u){
  // Only cache-first assets with explicit version keys: a changed URL
  // receives fresh files. Mutable data and media remain network-first.
  if(!/\.(?:css|js|png|jpe?g|webp|svg|woff2?)$/i.test(u.pathname))return false;
  return u.searchParams.has('v')||u.searchParams.has('ver')||
    /\/assets\/app-icons\//.test(u.pathname)||
    /\/watermark-my-logo-full\.png$/.test(u.pathname);
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const u=new URL(request.url);
  if(request.mode==='navigate'){
    if(u.pathname==='/pwa/install'||u.pathname.startsWith('/pwa/install/'))return;
    if(!u.pathname.startsWith('/pwa'))return;
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_VERSION);
      const stored=await cache.match(SHELL_URL);
      if(stored){
        event.waitUntil(periodicallyRefreshShell(request).catch(()=>null));
        return stored;
      }
      try{
        const live=await fetch(request,{cache:'no-store'});
        if(live&&live.ok)event.waitUntil(storeShell(live.clone()).catch(()=>null));
        return live;
      }catch(error){
        return (await cache.match(SHELL_URL))||Response.error();
      }
    })());
    return;
  }
  if(u.pathname==='/manifest.json'||u.pathname==='/version.json'){
    event.respondWith(fetch(request,{cache:'no-store'}));
    return;
  }
  if(!cacheable(u,request))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    // Previously opened, versioned CSS, JS and images open immediately offline.
    const staticAsset=staticVersionedAsset(u);
    if(staticAsset){
      const stored=await cache.match(request);
      if(stored)return stored;
    }
    try{
      const live=await fetch(request,{cache:'no-store'});
      if(live&&live.ok&&live.type!=='opaque'){
        // A cache write must never hold up the returned resource.
        event.waitUntil(cache.put(request,live.clone()).catch(()=>null));
      }
      return live;
    }catch(error){
      return (await cache.match(request))||Response.error();
    }
  })());
});
