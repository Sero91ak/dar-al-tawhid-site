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
const installSw=read("public-pwa-install-sw.js");
const router=read("cloudflare/site-router.js");
const desktop=read("desktop-preview/index.html");
const desktopJs=read("desktop-preview/desktop-overhaul.js");
const manifest=JSON.parse(read("manifest.json"));

check(rootSw.includes("PUBLIC_WEBSITE_NETWORK_ONLY_V1"),"legacy root SW serves website navigation network-only");
check(!desktop.includes('navigator.serviceWorker.register("/service-worker.js",{scope:"/"})'),"public website never registers root SW");
check(desktop.includes('rel="manifest" href="/install-manifest.json"'),"public website uses install manifest with root scope");
check(desktop.includes('navigator.serviceWorker.register("/public-pwa-install-sw.js",{scope:"/"'),"public website registers isolated, network-only install bridge");
check(installSw.includes('event.respondWith(fetch(event.request))'),"public installer always fetches navigation from network");
check(installSw.includes('if(url.pathname!=="/"&&url.pathname!=="/desktop-preview/")return;'),"public installer intercepts only public website navigations");
check(!installSw.includes("caches.open(")&&!installSw.includes("caches.put(")&&!installSw.includes("caches.match("),"public installer cannot cache website/app data");
check(router.includes('scope: url.pathname === "/install-manifest.json" ? "/" : "/pwa/"'),"root install manifest scope widened only on installation endpoint");
check(!router.includes('navigator.serviceWorker.register("/service-worker.js",{scope:"/"})'),"router public addon never registers root SW");
check(router.includes('navigator.serviceWorker.register("/pwa/service-worker.js",{scope:"/pwa/"})'),"Android PWA registers dedicated worker");
check(manifest.scope==="/pwa/"&&String(manifest.start_url||"").startsWith("/pwa/"),"manifest scope is isolated to /pwa/");
check(pwaSw.includes("CACHE_PREFIX='dar-al-tawhid-pwa-'"),"PWA uses dedicated cache namespace");
check(pwaSw.includes("if(!u.pathname.startsWith('/pwa'))return"),"PWA worker rejects out-of-scope navigation");
check(!pwaSw.includes("'/index.html'"),"PWA has no public website fallback");

// iOS rule: browser links must render the WEBSITE, never the Android visitor PWA.
// Do not disable the App Store WKWebView or Android PWA.
check(router.includes("IOS_PUBLIC_WEBSITE_ONLY_V1"),"iOS visitor-PWA routing rule is installed");
check(router.includes("isAppleMobileBrowserRequest(ua)"),"iOS browsers recognized independently of native shells");
check(router.includes('appleMobileBrowser && (url.searchParams.get("pwa") === "1" || legacyPwaLaunch)'),"legacy iOS PWA root links are intercepted");
check(router.includes('if (appleMobileBrowser) {')&&router.includes('"X-Dar-Surface": "ios-website-only"'),"iOS /pwa route redirects to website");
check(router.includes("darIosWebsiteOnlyPwaGuardV1"),"desktop-class iPadOS fallback runs before PWA boot");
check(pwaSw.includes("IOS_PWA_BLOCK_V1"),"legacy iOS cached visitor shell is bypassed");
check(router.includes('if ((request.method === "GET" || request.method === "HEAD") && isRoot && nativeApp)'),"official App Store shell route preserved");
check(router.includes('headers.set("X-Dar-Surface", "android-pwa-app")'),"Android PWA shell route preserved");


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
