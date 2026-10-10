#!/usr/bin/env node
/**
 * PUBLIC_WEBSITE_ISOLATION_GUARD
 * Hard separation: public website and Android PWA must never share root control.
 */
const fs=require("fs");
const path=require("path");
const ROOT=path.join(__dirname,"..");
const M="PUBLIC_WEBSITE_ISOLATION_GUARD";
let failed=0;
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
function check(ok,msg){if(ok)console.log(M+" OK: "+msg);else{failed++;console.error(M+" FAIL: "+msg)}}

const rootSw=read("service-worker.js");
const pwaSw=read("pwa/service-worker.js");
const router=read("cloudflare/site-router.js");
const desktop=read("desktop-preview/index.html");
const desktopJs=read("desktop-preview/desktop-overhaul.js");
const manifest=JSON.parse(read("manifest.json"));

check(rootSw.includes("PUBLIC_WEBSITE_NETWORK_ONLY_V1"),"legacy root SW serves website navigation network-only");
check(!desktop.includes('navigator.serviceWorker.register("/service-worker.js",{scope:"/"})'),"public website never registers root SW");
check(!router.includes('navigator.serviceWorker.register("/service-worker.js",{scope:"/"})'),"router public addon never registers root SW");
check(router.includes('navigator.serviceWorker.register("/pwa/service-worker.js",{scope:"/pwa/"})'),"Android PWA registers dedicated worker");
check(manifest.scope==="/pwa/"&&String(manifest.start_url||"").startsWith("/pwa/"),"manifest scope is isolated to /pwa/");
check(pwaSw.includes("CACHE_PREFIX='dar-al-tawhid-pwa-'"),"PWA uses dedicated cache namespace");
check(pwaSw.includes("if(!u.pathname.startsWith('/pwa'))return"),"PWA worker rejects out-of-scope navigation");
check(!pwaSw.includes("'/index.html'"),"PWA has no public website fallback");

check(router.includes('headers.set("X-Dar-Surface", "public-website")'),"public website has explicit surface header");
check(router.includes('const target = new URL("/desktop-preview/", url.origin);'),"browser root resolves to public website shell");
check(router.includes("isRoot && wantsPublicWebsite(request)"),"public root route remains active");
check(desktop.length>200000,"public website main HTML is complete");
check(desktop.includes("DĀR AL TAWḤĪD"),"website branding present");
check(desktop.includes("desktop-overhaul.js"),"website interaction bundle present");

const openScripts=(desktop.match(/<script\b/gi)||[]).length;
const closeScripts=(desktop.match(/<\/script>/gi)||[]).length;
check(openScripts===closeScripts,"website script tags balanced");
for(const m of desktop.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/\bsrc\s*=/.test(m[1]||"")||!(m[2]||"").trim())continue;
  try{new Function(m[2])}catch(e){failed++;console.error(M+" FAIL: inline JS: "+e.message)}
}
try{new Function(desktopJs);console.log(M+" OK: desktop-overhaul.js syntax")}catch(e){failed++;console.error(M+" FAIL: desktop-overhaul.js: "+e.message)}

if(failed)process.exit(1);
console.log(M+": hard website/PWA isolation active");
