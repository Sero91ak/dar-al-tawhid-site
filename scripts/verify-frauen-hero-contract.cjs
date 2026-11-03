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
/* User-authorized 2026-11-03 V1406 vertical cards + natural scroll regression.
 * Frozen 2026-10-16 renderers remain unchanged; only presentation is updated. */
const flow=fs.readFileSync("assets/frauen/frauen-original-v1224-header-seam-v1405.css","utf8");
const seam=fs.readFileSync("assets/frauen/frauen-hero-seam-runtime-v1406.js","utf8");
const frontstage=fs.readFileSync("assets/dar-visitor-frontstage-v1.css","utf8");
const desktop=fs.readFileSync("desktop-preview/index.html","utf8");
assert.match(flow,/\.frauen-library-area-grid\{[\s\S]*?display:flex!important;[\s\S]*?flex-direction:column!important;/,"Frauen Kapitel müssen untereinander sein");
assert.match(flow,/\.frauen-library-area-grid > \.frauen-library-area-card\{[\s\S]*?width:100%!important;/,"Kapitelkarten müssen volle Breite haben");
assert.doesNotMatch(flow,/position:sticky!important/,"Frauen Hero darf beim Scrollen nicht fixiert sein");
assert.match(flow,/\.dar-immersive-hero-stage[\s\S]*?position:relative!important;/,"Hero muss hinter den festen Header scrollen");
assert.match(seam,/getBoundingClientRect\(\)\.bottom/,"Gemessene feste Headerunterkante fehlt");
assert.match(seam,/--frauen-flow-seam-shift/,"Automatische Korrektur des oberen Spalts fehlt");
assert.doesNotMatch(seam,/scrollTo\(|preventDefault\(/,"Hero-Seam darf Scrollen nicht abfangen");
assert.doesNotMatch(frontstage,/\.more-grid,\.frauen-library-area-grid,\.quran-verse-grid/,"Generischer Mini-Raster-Konflikt wieder eingeführt");
for(const source of [native,testWorker,desktop]){
 assert.match(source,/frauen-single-column-flow-v1406-20261103/,"V1406 Auslieferung fehlt");
 assert.match(source,/frauen-hero-seam-runtime-v1406\.js/,"V1406 dynamischer Spaltabgleich fehlt");
}
assert.equal([...flow].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,"Frauen V1406 CSS unvollständig");
new (require("node:vm").Script)(seam,{filename:"frauen-hero-seam-runtime-v1406.js"});
console.log("PASS: V1406 original photos, full-width chapters, natural Hero scroll and measured seam, frozen renderers unchanged.");

console.log("OK: Frauenbereich unverändert außer genehmigtem Entfernen der doppelten Mehr-Karte.");
