#!/usr/bin/env node
/* Adult visitor + installed Android PWA must share one language runtime.
 * Static parity gate; never reads users or changes religious content.
 */
"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const root=read("index.html");
const picker=read("assets/i18n/adult-language-picker-v1.js");
const more=read("assets/dar-more-v15.js");
const translate=read("assets/i18n/adult-ui-translate.js");
const sw=read("pwa/service-worker.js");
const router=read("cloudflare/site-router.js");
const langs=Object.keys(JSON.parse(read("desktop-preview/i18n-core-v1/locales.json")).locales);
assert.deepEqual(langs.slice().sort(),["de","tr","en","ar","ku","ckb","bs","fr","es"].sort());
for(const code of langs)
  assert.ok(picker.includes('code:"'+code+'"'),"Language missing from adult shared picker: "+code);
assert.ok(root.includes("/assets/i18n/adult-language-picker-v1.js?v="),"Adult root has no common picker script");
assert.ok(root.includes("/assets/dar-more-v15.js?v="),"Adult root has no Mehr runtime");
assert.ok(more.includes('data-dar-language-entry="quick"'),"Mehr does not mount shared picker");
assert.ok(translate.includes('data-dar-language-entry","settings"'),"Settings does not mount shared picker");
for(const file of [picker,more,translate])
  assert.ok(file.includes("darAdultPreferredLocaleV1"),"Locale preference diverges");
assert.ok(router.includes('const target = new URL("/", url.origin)'),"PWA no longer reuses canonical adult root HTML");
assert.ok(router.includes('X-Dar-Surface", "android-pwa-app"'),"Dedicated PWA surface missing");
assert.ok(sw.includes("freshShellWithOfflineFallback(request,event)"),"PWA keeps stale language HTML");
assert.ok(sw.includes("liveLocaleAsset(u)"),"PWA might pin old language JS in immutable cache");
assert.ok(sw.includes("fetch(request,{cache:'no-store'})"),"PWA does not request current shell");
assert.ok(sw.includes("const CACHE_VERSION=CACHE_PREFIX+'v3'"),"PWA offline cache key must stay stable");
assert.ok(!sw.includes("caches.delete(CACHE_VERSION)"),"PWA erases saved offline content");
assert.ok(picker.includes("Demnächst verfügbar")&&picker.includes("available(code)"),"Unreleased language fallback missing");
for(const path of ["index.html","assets/dar-more-v15.js","assets/i18n/adult-ui-translate.js","assets/i18n/adult-language-picker-v1.js","pwa/service-worker.js"])
  assert.ok(fs.existsSync(path),"Missing required visitor/PWA asset: "+path);
new Function(sw);new Function(picker);
console.log("PASS adult visitor / Android PWA shared locale, 9 languages, offline-safe update.");
