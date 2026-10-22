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
for(const file of [picker,translate])
  assert.ok(file.includes("darAdultPreferredLocaleV1"),"Locale preference diverges");
assert.ok(!more.includes("localStorage.setItem(\"darAdultPreferredLocaleV1\""),"Mehr must use shared picker rather than a second preference writer");
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
const testIndex=read("test/index.html");
assert.ok(testIndex.includes('id="darTestAdultBrandHeaderShortcutV1"')&&
 testIndex.includes('id="darTestAdultBrandHeaderShortcutStyleV1"'),
 "DAR TEST /test/ must actually load the same interactive header as visitor mobile/PWA");
assert.ok(root.includes('id="darAdultGlobalBrandStyleV2"')&&root.includes('id="darAdultGlobalBrandScriptV2"'),
 "Adult visitor web-app root must load header even without native/PWA UA");
const headerJs=read("assets/dar-adult-brand-header-v2.js");
const headerCss=read("assets/dar-adult-brand-header-v2.css");
const vm=require("node:vm");
assert.ok(headerJs.includes('paletteTrigger.insertAdjacentHTML("beforebegin"')&&
 headerJs.includes('class="dtbh-shortcut dtbh-language-shortcut"')&&
 headerJs.includes('class="dtbh-shortcut dtbh-account-shortcut"'),
 "Header order must be language, account, existing palette");
assert.ok(headerCss.includes("DAR_ADULT_HEADER_SHORTCUTS_V1")&&
 headerCss.includes("grid-template-columns:40px minmax(0,1fr) repeat(3,39px)"),
 "Narrow-device three-button header grid is missing");
assert.ok(router.includes("dar-adult-brand-header-v2.js?v=20261022-header-shortcuts-v1"),
 "iOS/PWA header script was not cache-busted");
assert.ok(translate.includes('RELEASED_UI_LOCALES=new Set(["de"])')&&
 translate.includes('if(!RELEASED_UI_LOCALES.has(code))return false'),
 "Unreviewed Turkish visitor translation must be released explicitly");
assert.ok(picker.includes('if(!TEST)return false')&&
 picker.includes('ITEMS.filter(function(l){return available(l.code)}'),
 "Visitor picker must hide unreleased languages");
function mockPicker(path,chosen,runtime){
 const sandbox={
  window:{location:{pathname:path},localStorage:{getItem:()=>chosen},
   DarTestTurkishUI:runtime,__DarTestSevenLocalesReady:true,addEventListener(){}},
  document:{readyState:"loading",addEventListener(){}}
 };
 vm.runInNewContext(picker,sandbox,{timeout:1500});
 return sandbox.window.DARAdultLanguagePickerV1;
}
const ready={
 supportedLocales:["de","tr","en","ar","ku","ckb","bs","fr","es"],
 translatedKeys:167,translatedFor:(code)=>code==="de"?0:167
};
const guest=mockPicker("/pwa/","tr",ready),visitor=mockPicker("/","tr",ready),test=mockPicker("/test/","tr",ready);
for(const current of [guest,visitor]){
 assert.equal(current.read(),"de","Public language state must fall back to German");
 for(const code of langs.filter(l=>l!=="de"))
  assert.equal(current.available(code),false,"Unreleased visitor language visible: "+code);
}
assert.equal(test.read(),"tr","Staged Turkish must remain usable in DAR TEST");
assert.equal(test.available("en"),true,"Loaded test language pack must remain selectable");
new Function(sw);new Function(picker);new Function(headerJs);new Function(translate);
console.log("PASS adult header language/account/palette + TEST-only non-German + visitor/PWA German gate.");
