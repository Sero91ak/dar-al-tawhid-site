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
assert.match(flow,/DAR_FRAUEN_ONE_DOCUMENT_SCROLL_V1409/,"Frauen Scroll-Root Reparatur fehlt");
assert.match(flow,/html\[data-theme\] body\.is-frauen-route\{\s*overflow-x:clip!important;\s*overflow-y:visible!important;/,
 "Frauen braucht einen HTML-Dokument-Scroller, sonst scrollt Sticky-Hero in Test weg");
assert.match(flow,/\.dar-immersive-hero-stage\{[\s\S]*?position:sticky!important;[\s\S]*?top:var\(--frauen-fixed-brand-bottom,80px\)!important;/,"Bild und Suche müssen direkt unter dem Header fixiert sein");
assert.match(seam,/getBoundingClientRect\(\)\.bottom/,"Gemessene feste Headerunterkante fehlt");
assert.match(seam,/--frauen-fixed-brand-bottom/,"Gemessener Header-Sticky-Offset fehlt");
assert.match(seam,/setProperty\("margin-top","var\(--frauen-flow-seam-shift\)","important"\)/,"Der Hero-Spalt muss zuverlässig korrigiert werden");

assert.match(seam,/--frauen-flow-seam-shift/,"Automatische Korrektur des oberen Spalts fehlt");

/* V1409: a cold Frauen route must recover the ORIGINAL photographed hero and
   ORIGINAL search before a native/test brand gets attached to the DOM. */
assert.match(seam,/function restoreMissingSurface\(\)/,
 "Wenn der Live-Shell beide Originalelemente verliert, fehlt der gezielte Wiederhersteller");
assert.match(seam,/if\(!hero\|\|missingSearch\)hero=restoreMissingSurface\(\)\|\|hero/,
 "Fehlendes Hero-Bild muss aus dem eingefrorenen Frauenrenderer wiederhergestellt werden");
assert.match(seam,/tpl\.content\.querySelector\("\.frauen-library-hero"\)/,
 "Hero darf nur aus der kanonischen Originalvorlage rekonstruiert werden");
assert.doesNotMatch(seam,/#appView\.innerHTML|app\.innerHTML/,
 "Hero-Reparatur darf die vorhandenen Beiträge nicht überschreiben");
assert.ok(
 seam.indexOf("var stage=shell.querySelector")<seam.indexOf("if(!header)return"),
 "Frauen Hero/Suche darf nicht auf den verzögerten Markenheader warten"
);
assert.match(seam,/if\(stage&&looseSearch\)stage\.appendChild\(looseSearch\)/,
 "Original-Suche muss auch nach einem Route-Rerender in derselben Stage bleiben");
assert.match(seam,/new MutationObserver\(schedule\)\.observe\(appShell,\{childList:true\}\)/,
 "Frauen muss nachträgliches Einfügen des Markenheaders in die App-Shell erkennen");
assert.match(seam,/new MutationObserver\(schedule\)\.observe\(document\.body,\{/,
 "Frauen muss nachträglichen Markenheader und Routenstatus erkennen");
assert.match(seam,/stage\.style\.setProperty\("top",fixedTop,"important"\)/,
 "Gemessener Headerabstand muss auch nach spätem Markenheader gesetzt werden");

assert.match(seam,/maxGap=Math.max\(480,Math.min\(900/,"Große native Header-Doppelabstände dürfen nicht bei 240px abgewiesen werden");
assert.doesNotMatch(seam,/Math.abs\(gap\)>240|Math.max\(-220/,"Alte 240px/220px-Grenze unterdrückt die Reparatur");
assert.doesNotMatch(seam,/scrollTo\(|preventDefault\(/,"Hero-Seam darf Scrollen nicht abfangen");
assert.doesNotMatch(frontstage,/\.more-grid,\.frauen-library-area-grid,\.quran-verse-grid/,"Generischer Mini-Raster-Konflikt wieder eingeführt");
for(const source of [native,testWorker,desktop]){
 assert.match(source,/frauen-sticky-hero-v1407-20261103/,"V1407 Auslieferung fehlt");
 assert.match(source,/frauen-hero-seam-runtime-v1407\.js/,"V1406 dynamischer Spaltabgleich fehlt");
 assert.match(source,/frauen-gap-guard-v1408-20261105/,"Frauen-Header-Fix muss cache-frisch ausgeliefert werden");
}
assert.equal([...flow].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,"Frauen V1407 CSS unvollständig");
new (require("node:vm").Script)(seam,{filename:"frauen-hero-seam-runtime-v1407.js"});
console.log("PASS: V1407 original photos, one-column chapters, pinned Hero/search, and under-scrolling card area.");

console.log("OK: Frauenbereich unverändert außer genehmigtem Entfernen der doppelten Mehr-Karte.");
