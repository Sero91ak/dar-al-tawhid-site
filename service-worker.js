const CACHE_NAME="dar-al-tawhid-cache-safe-clean-share-v4";
const CORE_ASSETS=[
  "/",
  "/index.html",
  "/manifest.json",
  "/watermark-my-logo-full.png",
  "/watermark-circle-soft.png",
  "/app-icon-192.png",
  "/app-icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS).catch(()=>null)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const isPostData=req.url.includes("api.github.com/repos/")||req.url.includes("raw.githubusercontent.com/");
  if(isPostData){
    event.respondWith(fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
      return res;
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(fetch(req).then(res=>{
    const copy=res.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
    return res;
  }).catch(()=>caches.match(req).then(cached=>cached||caches.match("/index.html"))));
});
