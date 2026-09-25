const CACHE="dar-voice-studio-v4";
const SHELL=[
  "/voice-studio/",
  "/voice-studio/index.html",
  "/voice-studio/manifest.webmanifest",
  "/voice-studio/version.json",
  "/voice-studio/install-mac.command",
  "/voice-studio/DAR-Voice-Studio-Setup.app.zip",
  "/voice-studio/local-engine.py",
  "/data/pronunciation/pronunciation-rules.json",
  "/watermark-my-logo-full.png",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/apple-touch-icon.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  const isFresh=
    url.pathname==="/data/pronunciation/pronunciation-rules.json"||
    url.pathname==="/voice-studio/version.json"||
    url.pathname==="/voice-studio/index.html"||
    url.pathname==="/voice-studio/";
  if(isFresh){
    event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
      return res;
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
    return res;
  })));
});
