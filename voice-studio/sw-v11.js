const CACHE="dar-voice-studio-v13";
const SHELL=[
  "/voice-studio/",
  "/voice-studio/index.html",
  "/voice-studio/content-studio.js",
  "/voice-studio/manifest.webmanifest",
  "/voice-studio/version.json",
  "/data/pronunciation/pronunciation-rules.json",
  "/data/pronunciation/voice-production-profile.json",
  "/watermark-my-logo-full.png",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith("dar-voice-studio-")&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("message",event=>{
  if(event.data==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;

  const fresh =
    url.pathname==="/voice-studio/" ||
    url.pathname==="/voice-studio/index.html" ||
    url.pathname==="/voice-studio/content-studio.js" ||
    url.pathname==="/voice-studio/version.json" ||
    url.pathname==="/voice-studio/service-worker.js" ||
    url.pathname==="/voice-studio/install-mac.command" ||
    url.pathname==="/voice-studio/local-engine.py" ||
    url.pathname==="/data/pronunciation/pronunciation-rules.json" ||
    url.pathname==="/data/pronunciation/voice-production-profile.json";

  if(fresh){
    event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{
      if(res.ok && !url.pathname.endsWith(".command")){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
      }
      return res;
    }).catch(()=>caches.match(req)));
    return;
  }

  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok){
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
    }
    return res;
  })));
});
