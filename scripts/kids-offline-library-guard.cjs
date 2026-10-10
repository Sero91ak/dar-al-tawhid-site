#!/usr/bin/env node
"use strict";
// KIDS_OFFLINE_LIBRARY_RELEASE_GUARD_V1 — scope, instant artwork and offline playback.
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pages=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
const sw=read("kids/sw.js"),ver=JSON.parse(read("kids/version.json"));
function ok(cond,msg){if(!cond)throw Error("KIDS_OFFLINE_GUARD: "+msg);}
new vm.Script(sw,{filename:"kids/sw.js"});
new vm.Script(read("kids/offline-library-v1.js"),{filename:"kids/offline-library-v1.js"});
ok(pages.every(x=>x===pages[0]),"Kids entry pages must match byte for byte");
ok(/const CACHE_NAME="dar-al-tawhid-kids-v1313"/.test(sw),"new SW cache version missing");
ok(ver.visualSystem.serviceWorkerCache==="v1313","Kids version JSON SW cache mismatch");
ok(!sw.includes('key.indexOf("dar-al-tawhid-kids-")===0'),"offline cache may be purged on activate");
ok(sw.includes("const keep=new Set([CACHE_NAME,...versions.slice(0,2)])"),"previous shell cache rescue must stay available");
ok(sw.includes('KIDS_RESUMABLE_OFFLINE_LIBRARY_V1'),"persistent package absent");
ok(sw.includes('KIDS_FAST_FIRST_PAINT_V1313'),"fast install marker missing");
ok(sw.includes('kidsCachedAudio(request,event)'),"audio cache bypass must be replaced");
ok(sw.includes('Content-Range')&&sw.includes('status:206'),"offline Safari Range handling missing");
ok(sw.includes('"/kids/akademie/index.html"'),"academy must have offline entry");
for(const academyDep of [
  "/kids/akademie/curriculum-v1.js?v=20261010-01",
  "/kids/akademie/curriculum-v2.js?v=20261010-09",
  "/kids/akademie/school-progress-v11.js?v=20261010-11",
  "/kids/owner-voice.js?v=academy-serhat-v1-20261010",
  "/kids/data/academy-audio.json?v=1"
])ok(sw.includes('"'+academyDep+'"'),"academy first-start asset missing: "+academyDep);
ok(sw.includes("CORE_PRECACHE.filter")&&sw.includes("KIDS_OFFLINE_SEEDS"),"offline library asset inventory missing");
ok(sw.includes('"/kids/data/dua-word-audio.json"'),"V4 Dua word clips must be discoverable");
ok(sw.includes('"/kids/data/academy-audio.json"'),"academy audio manifest must be discoverable");
ok(!/if\(url.pathname.indexOf\("\/kids\/assets\/prophet-story-audio\/".{0,800}event.respondWith\(fetch\(request\)\)/s.test(sw),"story audio fetch-only bypass remains");
for(const page of pages){
  ok(page.includes('<link rel="preload" as="image" href="/kids/assets/kids-salah-v1272/hero-home.png?v=1274" fetchpriority="high">'),"correct hero preload missing");
  ok(page.includes("/kids/offline-library-v1.css?v=1")&&page.includes("/kids/offline-library-v1.js?v=1"),"offline controls missing");
  ok(page.includes('navigator.serviceWorker.register("/kids/sw.js?v=1313"'),"SW registration stale");
}
ok(sw.includes('"/kids/assets/kids-salah-v1272/hero-home.png?v=1274"'),"current final hero URL not precached");
ok(sw.includes("KIDS_OFFLINE_SEEDS")&&sw.includes("KIDS_OFFLINE_START"),"offline package downloader missing");
for(const file of ["kids/data/dua-word-audio.json","kids/data/dua-audio.json","kids/data/prophet-stories.json","kids/data/mubashshirun-stories.json","kids/data/sahabiyyat-stories.json","kids/data/academy-audio.json"]){
  const raw=JSON.parse(read(file));ok(raw&&typeof raw==="object",file+" invalid");
}
console.log("KIDS_OFFLINE_GUARD OK: aligned shell, current hero image, offline audio range, preserved offline library and academy assets.");
