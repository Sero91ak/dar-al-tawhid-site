'use strict';
/* DĀR AL TAWḤĪD ʿUmrah cache; scope /umrah/ only. */
const CACHE='dar-umrah-v10-1-reading-ui-20261122';
const CORE=['./index.html','./offline.html','./manifest.webmanifest'];
const BRAND=['/assets/app-icons/type-creme-ar/icon-512.png','/assets/app-icons/type-creme-ar/icon-192.png','/assets/app-icons/type-creme-ar/icon-180.png','/assets/dar-3d-icons/home.png','/assets/dar-3d-icons/qibla.png','/assets/dar-3d-icons/compass.png','/assets/dar-3d-icons/image.png','/assets/dar-3d-icons/library.png','/assets/dar-3d-icons/mosque.png'];
const BRAND_PATHS=new Set(BRAND);
const PREFIX=new URL(self.registration.scope).pathname;
self.addEventListener('install',ev=>ev.waitUntil((async()=>{
 const c=await caches.open(CACHE);
 await Promise.all(CORE.map(async p=>{try{const response=await fetch(p,{cache:'reload'});if(response.ok)await c.put(p,response)}catch(_){}}));
 await Promise.all(BRAND.map(async p=>{try{await c.add(p)}catch(_){}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',ev=>ev.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith('dar-umrah-')&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',ev=>{
 const req=ev.request;
 if(req.method!=='GET')return;
 const u=new URL(req.url);
 if(u.origin!==self.location.origin)return;
 if(!u.pathname.startsWith(PREFIX)&&!BRAND_PATHS.has(u.pathname))return;
 ev.respondWith((async()=>{
   const cached=await caches.match(req);
   // Navigations: network-first, damit Korrekturen sichtbar bleiben; offline: lokaler Cache.
   if(req.mode!=='navigate'&&cached)return cached;
   try{const response=await fetch(req,req.mode==='navigate'?{cache:'no-store'}:undefined);
     if(response.ok){const c=await caches.open(CACHE);c.put(req,response.clone()).catch(()=>{});}
     return response;
   }catch(_){
     if(req.mode==='navigate')return cached||(await caches.match('./index.html'))||new Response('Offline nicht vorbereitet.',{status:503});
     return Response.error();
   }
 })());
});