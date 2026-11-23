'use strict';
/* DĀR AL TAWḤĪD ʿUmrah cache; scope /umrah/ only. */
const CACHE='dar-umrah-v11-4-book-app-assets-20261123';
const CORE=['./index.html','./offline.html','./erinnerungsbuch-v11.html','./enhancements.css','./enhancements.js','./quellen.html'];
const BOOK_ASSETS=[
 './illustrations/v11-makkah.jpg','./illustrations/v11-madinah.jpg',
 '/assets/app-icons/emblem-creme-petrol/icon-192.png','/assets/app-icons/emblem-creme-petrol/icon-512.png',
 '/app-logo-original.png',
 '/assets/fonts/cormorant-garamond-latin-500-normal.woff2',
 '/assets/fonts/cormorant-garamond-latin-600-normal.woff2',
 '/assets/fonts/instrument-serif-latin-400-normal.woff2',
 '/assets/fonts/instrument-serif-latin-ext-400-normal.woff2',
 '/assets/fonts/cinzel-latin-500-normal.woff2',
 '/assets/fonts/amiri-arabic-400-normal.woff2',
 '/assets/fonts/amiri-arabic-700-normal.woff2',
 '/assets/fonts/noto-naskh-arabic-arabic-400-normal.woff2',
 '/assets/fonts/manrope-latin.woff2','/assets/fonts/manrope-latin-ext.woff2'
];
const BRAND=['/assets/app-icons/type-creme-ar/icon-512.png','/assets/dar-3d-icons/home.png','/assets/dar-3d-icons/qibla.png','/assets/dar-3d-icons/compass.png','/assets/dar-3d-icons/image.png','/assets/dar-3d-icons/library.png','/assets/dar-3d-icons/mosque.png'];
const BRAND_PATHS=new Set(BRAND);
const PREFIX=new URL(self.registration.scope).pathname;
self.addEventListener('install',ev=>ev.waitUntil((async()=>{
 const c=await caches.open(CACHE);
 await Promise.all([...CORE,...BOOK_ASSETS].map(async p=>{try{const response=await fetch(p,{cache:'reload'});if(response.ok)await c.put(p,response)}catch(_){}}));
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