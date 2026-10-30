#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
function fail(msg) { console.error("HERO_SCROLL_STANDARD FAIL: " + msg); process.exit(1); }
function ok(msg) { console.log("HERO_SCROLL_STANDARD OK: " + msg); }
const cssPath = "assets/dar-hero-scroll-standard-v1.css";
const css = fs.readFileSync(path.join(root, cssPath), "utf8");
const required = [
  '[data-hero-kind="landing"]',
  '[data-hero-kind="category"]',
  '[data-hero-kind="post"]',
  'data-hero-scroll="sticky"',
  'data-hero-scroll="normal"',
  ".dar-hero-stage",
  ".dar-hero-content",
  ".dar-hero-search",
  ".dar-page-content",
  "background-size:cover",
  "background-repeat:no-repeat"
];
for (const token of required) {
  if (!css.includes(token)) fail(cssPath + " fehlt " + token);
}
if (/frauen-library-hero|touchmove|preventDefault|scrollTo\(0,\s*0\)|width:\s*100vw/.test(css)) {
  fail(cssPath + " greift in den Frauen-Hero ein oder sperrt den Scroll");
}
ok("Vertrag enthält die drei Hero-Typen ohne Frauen-Override");
const frauen = fs.readFileSync(path.join(root, "test/assets/frauen/frauen-authority-v1292.css"), "utf8");
if (!frauen.includes(".frauen-library-hero{") || !frauen.includes("--frauen-hero-img")) {
  fail("Frauen-Hero-Vertrag fehlt in der Test-Autorität");
}
ok("Frauen-Hero bleibt in der bestehenden Autorität");
for (const file of ["index.html", "test/index.html"]) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  if (!html.includes("/assets/dar-hero-scroll-standard-v1.css")) fail(file + " bindet den Hero-Standard nicht ein");
  ok(file + " bindet den Hero-Standard ein");
}


/* DAR_HERO_V1402_CONTRACT: matching visitor/test geometry and no Frauen image loss. */
const visitorResponsive=fs.readFileSync(path.join(root,"assets/adult-responsive-viewport-v1381.css"),"utf8");
const testResponsive=fs.readFileSync(path.join(root,"test/assets/test-global-edge-width-v1372.css"),"utf8");
const marker="/* DAR_ADULT_HERO_COMPACT_STICKY_AXIS_V1402";
const vPart=(visitorResponsive.split(marker)[1]||"").split("/* DAR_VISITOR_HERO_RAIL_CONNECTED_V1403")[0];
const tPart=testResponsive.split(marker)[1];
if(!vPart||!tPart||vPart.trim()!==tPart.trim()){
 fail("Besucher und Test dürfen keine unterschiedlichen Hero/Sticky-Geometrien ausliefern");
}
for(const token of [
 "position:sticky!important", "background-size:cover,cover,cover!important",
 "min-height:clamp(148px,18svh,210px)!important",
 "top:var(--dar-immersive-hero-height,190px)!important",
 ".search-panel,.search-pro-panel,.main-search,#homeSearchBlock",
 ".frauen-library-hero","@media(min-width:768px)","@media(max-height:540px)"
]){
 if(!vPart.includes(token))fail("Hero v1402 fehlt: "+token);
}
if(/\.frauen-library-hero[^{]*\{[^}]*background-image\s*:/.test(vPart) ||
  /\.frauen-library-hero[^{]*\{[^}]*display\s*:\s*none/.test(vPart)){
 fail("Frauen-Hero-Motiv würde entfernt oder unsichtbar gemacht");
}
if(!css.includes("DAR_RESPONSIVE_HERO_RAIL_V1402") ||
   !css.includes("min-height:var(--dar-hero-smart-category)") ||
   !css.includes("min-height:var(--dar-hero-smart-post)")){
 fail("Future opt-in Hero Standard nicht responsiv");
}
for(const jsPath of [
 "assets/adult-immersive-hero-v1.js",
 "test/assets/adult-immersive-hero-v1.js"
]){
 const js=fs.readFileSync(path.join(root,jsPath),"utf8");
 if(!js.includes("#appView .dua-hub") || !js.includes("stage.appendChild(hero)") ||
    !js.includes("--dar-immersive-hero-height")){
   fail(jsPath+" darf Frauen-Hero nicht verlieren und muss Suche dynamisch messen");
 }
}
ok("Kompakter Hero mit angehefteter Suche, responsive, gleiche Regeln Besucher/Test, Frauen-Hintergrund geschützt");


/* DAR_VISITOR_HERO_ACTIVATION_V1403 - server-side route and safe DOM guard. */
const vm=require("node:vm");
const router=fs.readFileSync(path.join(root,"cloudflare/site-router.js"),"utf8");
const runtime=fs.readFileSync(path.join(root,"assets/adult-hero-height-runtime-v1403.js"),"utf8");
const v1403Css=(visitorResponsive.split("/* DAR_VISITOR_HERO_RAIL_CONNECTED_V1403")[1]||"").split("/* DAR_VISITOR_IOS_HERO_EDGE_SEARCH_V1404")[0];
if(!v1403Css)fail("Aktivierung V1403 fehlt im Besucher CSS");
for(const expected of [
 "position:sticky!important",
 "top:max(0px,calc(var(--dar-immersive-hero-height,220px) - 22px))!important",
 ".frauen-library-hero",
 "background-size:cover!important",
 ".frauen-library-search-wrap,.frauen-library-list-controls"
]){
 if(!v1403Css.includes(expected))fail("Besucher Hero-Verbindung V1403 fehlt: "+expected);
}
if(/--frauen-hero-img\s*:|background-image\s*:\s*none|\.frauen-library-hero[^{]*\{[^}]*display\s*:\s*none/.test(v1403Css)){
 fail("Visitor Hero-V1403 darf original Frauen-Bild nicht überschreiben");
}
for(const prohibited of [
 "appendChild(", "insertBefore(", "replaceChild(", "innerHTML=", "location.reload",
 "location.assign", "preventDefault(", "touchmove"
]){
 if(runtime.includes(prohibited))fail("Runtime bewegt DOM/lädt App: "+prohibited);
}
if(!runtime.includes('measure(section,hero)')||!runtime.includes('ResizeObserver(schedule)')){
 fail("Die tatsächliche Suchleisten-Position muss per ResizeObserver bestimmt werden");
}
const fnStart=router.indexOf("function adultCompactHeroAddon()");
const fnEnd=router.indexOf("function liveFrauenNativeAddon()",fnStart);
if(fnStart<0||fnEnd<0)fail("Cloudflare Hero-Addon nicht auffindbar");
const context={};
vm.runInNewContext(router.slice(fnStart,fnEnd),context,{timeout:1200});
const addon=context.adultCompactHeroAddon();
if(!addon.includes("visitor-hero-safearea-v1404-20261019")||
   !addon.includes("adult-hero-height-runtime-v1403.js")||
   !/<script\b[^>]*><\/script>/.test(addon)){
 fail("Cloudflare muss den neuen CSS-Stand und gültige Runtime-Script-Tags ausliefern");
}
const original='<html><body><link rel="stylesheet" id="darAdultHeroCompactEdgeV1396" href="/old.css"></body></html>';
const repaired=context.activateAdultCompactHero(original);
if(repaired.includes('id="darAdultHeroCompactEdgeV1396"') ||
 (repaired.match(/id="darAdultHeroCompactEdgeV1404"/g)||[]).length!==1 ||
 (repaired.match(/id="darAdultHeroHeightRuntimeV1404"/g)||[]).length!==1){
 fail("Hero HTML darf keine alte oder doppelte Stylesheet-Injektion enthalten");
}
if(context.activateAdultCompactHero(repaired)!==repaired){
 fail("Hero-Aktivierung muss idempotent sein");
}
for(const required of [
 "html = assetResponse.ok ? activateAdultCompactHero(html) : html;",
 "if (assetResponse.ok) html = activateAdultCompactHero(html);",
 "html = activateAdultCompactHero(html);"
]){
 if(!router.includes(required))fail("Nicht alle PWA/iOS/Website-Wege aktivieren V1404");
}
ok("V1404 wird ohne DOM-Verschiebung und mit eindeutigem Cache-Buster auf iOS, PWA und Web ausgeliefert");


/* DAR_VISITOR_HERO_SAFE_TOP_V1404
 * The previous screenshot failure was not an absent stylesheet: the
 * compiled official iOS WKWebView added its own higher-priority body padding.
 * Guard against reintroducing that pale strip on all photo-bearing routes. */
const nativeView=fs.readFileSync(path.join(root,"ios/DarAlTawhid/DarAlTawhid/WebAppView.swift"),"utf8");
const v1404Css=visitorResponsive.split("/* DAR_VISITOR_IOS_HERO_EDGE_SEARCH_V1404")[1];
if(!v1404Css)fail("Native Hero Safe-Area override V1404 fehlt");
if(!nativeView.includes("body.is-area-route:not(.is-feed-fullscreen)") ||
   !nativeView.includes("--dar-native-safe-top")){
 fail("Unbekannte native iOS Safe-Area CSS Herkunft: Hero zuerst erneut vermessen");
}
for(const required of [
 "body.has-bottom-nav.is-area-route:is(",
 ".is-topics-route,.is-topic-route,.is-post-route,.is-hadith-route",
 ".is-dua-route,.is-frauen-route",
 "padding-top:0!important",
 "padding-top:max(16px,calc(var(--dar-native-safe-top",
 "top:calc(var(--dar-immersive-hero-height,185px) - var(--dar-hero-join))!important",
 "width:100%!important",
 "background:var(--bg,#f4efec)!important",
 ":focus-within > :is(.search-panel,.search-pro-panel,.main-search,#homeSearchBlock)",
 "min-height:clamp(148px,17svh,207px)!important"
]){
 if(!v1404Css.includes(required))fail("V1404 Inhalt / responsiver Safe-Area Vertrag fehlt: "+required);
}
if(/--frauen-hero-img\s*:|\.frauen-library-hero[^{]*\{[^}]*background-image\s*:/.test(v1404Css)){
 fail("Frauen Bildquelle darf niemals aus neuem CSS neu vergeben werden");
}
const stale='<html><head></head><body><link rel="stylesheet" id="darAdultHeroCompactEdgeV1403" href="/old.css"><script defer id="darAdultHeroHeightRuntimeV1403" src="/old.js"></script></body></html>';
const replaced=context.activateAdultCompactHero(stale);
if(replaced.includes('id="darAdultHeroCompactEdgeV1403"') ||
   replaced.includes('id="darAdultHeroHeightRuntimeV1403"') ||
   (replaced.match(/id="darAdultHeroCompactEdgeV1404"/g)||[]).length!==1 ||
   (replaced.match(/id="darAdultHeroHeightRuntimeV1404"/g)||[]).length!==1){
 fail("V1404 muss alte Hero-Injektion durch genau eine frische Instanz ersetzen");
}
if(context.activateAdultCompactHero(replaced)!==replaced){
 fail("V1404 darf bei wiederholter Worker-Injektion keine doppelten Styles/JS erzeugen");
}
ok("V1404 native iOS Safe-Area Konflikt behoben, Hero/Sticky-Suche kompakt und korrekt gecacht");


/* DAR_GLOBAL_NO_DUPLICATED_HERO_REGRESSION_V1 · 20.10.2026
 * The iPhone video exposed a second blurry/fixed hero over the real hero.
 * Keep the adult gesture clamp, but NEVER resurrect the fixed photo clone.
 * This check runs with the existing hero-scroll-standard guard in CI.
 */
const edgeCodeFiles=[
 "assets/dar-adult-top-scroll-boundary-v1.js",
 "test/assets/dar-adult-top-scroll-boundary-v1.js"
];
const edgeStyleFiles=[
 "assets/dar-adult-top-scroll-boundary-v1.css",
 "test/assets/dar-adult-top-scroll-boundary-v1.css"
];
const edgeJs=edgeCodeFiles.map(file=>fs.readFileSync(path.join(root,file),"utf8"));
const edgeCss=edgeStyleFiles.map(file=>fs.readFileSync(path.join(root,file),"utf8"));
if(edgeJs[0]!==edgeJs[1]||edgeCss[0]!==edgeCss[1])
 fail("Test und Besucher müssen denselben globalen Scroll-Stopp ohne Hero-Kopie verwenden");
for(let i=0;i<edgeJs.length;i++){
 const js=edgeJs[i],css=edgeCss[i];
 if(!js.includes("DAR_ADULT_TOP_SCROLL_BOUNDARY_V4")||
    !js.includes("function canScroll(direction)")||
    !js.includes("touchmove")||
    !js.includes('if(!canScroll(stepY>0?"up":"down"))event.preventDefault()')||
    !js.includes('dy>0.15')||
    !js.includes('event.cancelable && !event.defaultPrevented && !canScroll("up")'))
  fail(edgeCodeFiles[i]+": beidseitige Scroll-Kantensperre fehlt");
 if(!css.includes("overscroll-behavior-y:none!important")||
    !css.includes("DAR_ADULT_SCROLL_EDGE_NO_OVERLAY_20261020"))
  fail(edgeStyleFiles[i]+": globaler No-Bounce-/No-Overlay-Vertrag fehlt");
 if(/darHeroSafeTopFill|dar-hero-edge-art|dar-hero-edge-active|__darAdultHeroEdgeBindingV4/.test(js+css))
  fail(edgeCodeFiles[i]+": verbotene geklonte/unscharfe Hero-Overlayfläche");
}
for(const hostFile of [
 "ios/DarAlTawhid/DarAlTawhid/WebAppView.swift",
 "ios/DarAlTawhid/DarAlTawhid/FreshWebAppView.swift"
]){
 const native=fs.readFileSync(path.join(root,hostFile),"utf8");
 if(!native.includes("webView.scrollView.bounces = false"))
  fail(hostFile+": nativen UIKit-Rubberband-Stopp wiederherstellen");
}
for(const hostFile of ["cloudflare/site-router.js","cloudflare/test-app-worker.js"]){
 const source=fs.readFileSync(path.join(root,hostFile),"utf8");
 if(!source.includes("20261030-no-pull-hero-v9")||
    !source.includes("20261020-no-overlay-v8")||
    !source.includes("dar-adult-top-scroll-boundary-v1.css")||
    !source.includes("dar-adult-top-scroll-boundary-v1.js"))
  fail(hostFile+": zentralen no-overlay-v8 Scroll-Stopp in der HTML-Auslieferung vermisst");
}
ok("No-duplicated-hero v9: original image once, scroll-clamp preserved, Test/Visitor parity and native bounce=false");
