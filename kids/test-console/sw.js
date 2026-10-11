/* Isolated KIDS TEST console offline shell.
 * Scope: /kids/test-console/ only. NEVER caches visitor website, native Kids
 * profiles, unpublished creator files, or other /kids pages.
 */
const CACHE="dar-kids-creator-console-v1-20261011";
const PREFIX="dar-kids-creator-console-";
const FILES=["/kids/test-console/","/kids/test-console/index.html",
 "/kids/test-console/catalogue-v1.json","/kids/test-console/studio-v1.js",
 "/kids/test-console/manifest.webmanifest"];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
   const cache=await caches.open(CACHE);
   for(const path of FILES){
     try{const r=await fetch(path,{cache:"reload",credentials:"omit",redirect:"follow"});if(r.ok&&r.type!=="opaque")await cache.put(path,r.clone())}catch(e){}
   }
   await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil((async()=>{
   const keys=await caches.keys();
   await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
   await self.clients.claim();
 })());
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith("/kids/test-console/"))return;
 if(url.pathname.includes("/../")||/%(?:2f|5c|00)/i.test(url.pathname))return;
 event.respondWith((async()=>{
   try{
     const result=await fetch(req,{redirect:"follow"});
     if(result.ok&&result.type!=="opaque"){
       const cache=await caches.open(CACHE);
       await cache.put(req,result.clone());
     }
     return result;
   }catch(_){
     const cached=await caches.match(req);
     if(cached)return cached;
     if(req.mode==="navigate")return (await caches.match("/kids/test-console/"))||
       new Response("<!doctype html><html lang=de><meta charset=utf-8><title>KIDS TEST offline</title><body><h1>KIDS TEST · offline</h1><p>Bitte die Web-App einmal mit Internet öffnen.</p></body></html>",{headers:{"Content-Type":"text/html; charset=utf-8"}});
     return new Response("Offline",{status:503});
   }
 })());
});
