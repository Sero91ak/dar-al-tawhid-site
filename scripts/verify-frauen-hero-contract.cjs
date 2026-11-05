"use strict";
/* DAR_FRAUEN_NOON_ROLLBACK_CONTRACT_20261017
 * Exact restored working files from 2026-10-16 14:59:29 Europe/Berlin.
 * Approved scoped exception: suppress only the redundant Frauen tile in Mehr while keeping the Frauen route unchanged. Other app lanes untouched. */
const fs=require("node:fs");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const frozen={
  "assets/frauen/frauen-authority-v1292.css": "6bb786de1ecb1b0d3ed5d01ec511cc10c9b3da86",
  "assets/frauen/frauen-fiqh.js": "2eeb486a100ad3e433860a9bb1c09e225edd5a4c",
  "assets/frauen/frauen-live-adapter.js": "da20c378536d4ce0b6cdc891b0e32a8d026708e4",
  "test/assets/frauen/frauen-authority-v1292.css": "07b9fa32585de8fcb57aad13b13ab2c67167ee4b",
  "test/assets/frauen/frauen-fiqh.js": "d2abb88d444de8879046e4edc58ca659b1eb94e8"
};
function gitBlobSha(content){
  const data=Buffer.from(content,"utf8");
  return crypto.createHash("sha1").update("blob "+data.length+"\0").update(data).digest("hex");
}
for(const [path,sha] of Object.entries(frozen)){
  const got=gitBlobSha(fs.readFileSync(path,"utf8"));
  assert.equal(got,sha,"Frauen-Renderer weicht vom geprüften Stand einschließlich genehmigter Mehr-Dubletten-Korrektur ab: "+path);
}
const adapter=fs.readFileSync("assets/frauen/frauen-live-adapter.js","utf8");
assert.ok(adapter.includes("function paint()"),"Original live Frauen adapter fehlt");
assert.ok(adapter.includes("MEHR_DUPLICATE_FRAUEN_ROW_REMOVED_V1"),"Doppelte Frauen-Mehr-Karte darf nicht automatisch eingefügt werden");
assert.ok(!adapter.includes("target.appendChild(btn)"),"Veraltete zusätzliche Frauen-Karte bleibt aktiv");
const native=fs.readFileSync("cloudflare/site-router.js","utf8");
assert.ok(native.includes("/test/assets/frauen/frauen-fiqh.js?v=frauen-rollback-20261016-1500"),"Alten iOS Frauen renderer wiederherstellen");
assert.ok(native.includes("/assets/frauen/frauen-live-adapter.js?v=mehr-frauen-duplicate-fix-20261019"),"Alten Frauen adapter ausliefern");
const testWorker=fs.readFileSync("cloudflare/test-app-worker.js","utf8");
assert.ok(testWorker.includes("frauen-authority-v1292.css?v=frauen-rollback-20261016-1500"),"Test CSS cache key fehlt");
for(const prefix of ["assets/frauen/library-v1224/","test/assets/frauen/library-v1224/"]){
  for(const image of ["01-grundlagen-din.jpg","02-fiqh-frauen.jpg","03-erste-generationen.jpg","04-familie-erziehung.jpg","05-wissen-adab-dawah.jpg","06-alltag-schutz.jpg","07-lebensphasen.jpg"]){
    assert.ok(fs.existsSync(prefix+image),"Original Frauen-Hero-Motiv fehlt: "+prefix+image);
  }
}
/* User-authorized 2026-11-03 V1407 vertical cards + pinned Hero regression.
 * Frozen 2026-10-16 renderers remain unchanged; only presentation is updated. */
const flow=fs.readFileSync("assets/frauen/frauen-original-v1224-header-seam-v1405.css","utf8");
const seam=fs.readFileSync("assets/frauen/frauen-hero-seam-runtime-v1407.js","utf8");
const frontstage=fs.readFileSync("assets/dar-visitor-frontstage-v1.css","utf8");
const desktop=fs.readFileSync("desktop-preview/index.html","utf8");
assert.match(flow,/\.frauen-library-area-grid\{[\s\S]*?display:flex!important;[\s\S]*?flex-direction:column!important;/,"Frauen Kapitel müssen untereinander sein");
assert.match(flow,/\.frauen-library-area-grid > \.frauen-library-area-card\{[\s\S]*?width:100%!important;/,"Kapitelkarten müssen volle Breite haben");
assert.match(flow,/DAR_FRAUEN_PINNED_HERO_UNDER_SCROLL_V1407/,"Sticky-Frauen-Hero V1407 fehlt");
assert.match(flow,/\.dar-immersive-hero-stage\{[\s\S]*?position:sticky!important;[\s\S]*?top:var\(--frauen-fixed-brand-bottom,80px\)!important;/,"Bild und Suche müssen direkt unter dem Header fixiert sein");
assert.match(seam,/getBoundingClientRect\(\)\.bottom/,"Gemessene feste Headerunterkante fehlt");
assert.match(seam,/--frauen-fixed-brand-bottom/,"Gemessener Header-Sticky-Offset fehlt");
assert.match(seam,/setProperty\("margin-top","var\(--frauen-flow-seam-shift\)","important"\)/,"Der Hero-Spalt muss zuverlässig korrigiert werden");

assert.match(seam,/--frauen-flow-seam-shift/,"Automatische Korrektur des oberen Spalts fehlt");
assert.doesNotMatch(seam,/scrollTo\(|preventDefault\(/,"Hero-Seam darf Scrollen nicht abfangen");
assert.doesNotMatch(frontstage,/\.more-grid,\.frauen-library-area-grid,\.quran-verse-grid/,"Generischer Mini-Raster-Konflikt wieder eingeführt");
for(const source of [native,testWorker,desktop]){
 assert.match(source,/frauen-sticky-hero-v1407-20261103/,"V1407 Auslieferung fehlt");
 assert.match(source,/frauen-hero-seam-runtime-v1407\.js/,"V1406 dynamischer Spaltabgleich fehlt");
}
assert.equal([...flow].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,"Frauen V1407 CSS unvollständig");
new (require("node:vm").Script)(seam,{filename:"frauen-hero-seam-runtime-v1407.js"});
console.log("PASS: V1407 original photos, one-column chapters, pinned Hero/search, and under-scrolling card area.");

/* V1409: native iOS must not interfere with the working Android Hero.
 * Match wide cards to the existing floating navigation across adult routes. */
const iosRuntime=fs.readFileSync("assets/frauen/frauen-ios-hero-v1409.js","utf8");
const iosCss=fs.readFileSync("assets/frauen/frauen-ios-hero-v1409.css","utf8");
const navWidth=fs.readFileSync("assets/dar-adult-navwidth-content-v1409.css","utf8");
assert.match(iosRuntime,/if\(!isIOS\)return/,"Android darf keine neue Hero-Logik erhalten");
assert.match(iosRuntime,/__DAR_FRAUEN_HERO_SEAM_V1407=true/,"Der doppelte iOS-Margin-Shim muss deaktiviert werden");
assert.doesNotMatch(iosRuntime,/appendChild\(|insertBefore\(|createElement\(|replaceChildren\(/,"Der laufende Renderer muss alleiniger DOM-Besitzer bleiben");
assert.match(iosRuntime,/--dar-ios-frauen-rail-height/,"Der originalen Seite muss Höhe unter dem fixierten Hero zugewiesen werden");
assert.match(iosRuntime,/brand\.getBoundingClientRect\(\)\.bottom/,"Headerunterkante muss tatsächlich gemessen werden");
assert.doesNotMatch(iosRuntime,/preventDefault\(/,"Kein zweiter Touch-Handler erlaubt");
assert.match(iosCss,/html\.dar-ios-frauen-hero-v1409 body\.is-frauen-route/,"iOS-Hero-Styling muss plattformspezifisch bleiben");
assert.match(iosCss,/position:fixed!important/,"iOS-Hero muss an der Headerunterkante fixiert sein");
assert.match(navWidth,/var\(--dar-nav-width,100%\)/,"Seitenbreite muss die echte Navigationsbreite verwenden");
assert.match(navWidth,/flex-direction:column!important/,"Kapitelkapseln müssen immer untereinander stehen");
assert.match(navWidth,/\.frauen-library-grid,\.frauen-library-area-grid/,"Haupt- und Unterseiten einspaltig");
for(const source of [native,testWorker,desktop]){
 assert.match(source,/dar-adult-navwidth-content-v1409\.css/,"Navigationsbreite nicht global eingebunden");
 assert.match(source,/frauen-ios-hero-v1409\.css/,"iOS-Hero-Styling fehlt");
 assert.match(source,/frauen-ios-hero-v1409\.js/,"iOS-Hero-Runtime fehlt");
 assert.ok(source.indexOf("frauen-ios-hero-v1409.js")<source.indexOf("frauen-hero-seam-runtime-v1407.js"),
   "iOS muss vor dem alten V1407-Margin-Shim initialisieren");
}
for(const [name,textCss] of [["iOS",iosCss],["Adult Nav Width",navWidth]]){
 assert.equal([...textCss].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,name+" CSS nicht vollständig");
}
new (require("node:vm").Script)(iosRuntime,{filename:"frauen-ios-hero-v1409.js"});
console.log("PASS: iOS-only Hero, Android parity and navigation-aligned wide capsules.");

console.log("OK: Frauenbereich unverändert außer genehmigtem Entfernen der doppelten Mehr-Karte.");
