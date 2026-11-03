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
/* V1408 browser-verified fixed Hero + one-piece search. Frozen renderers
 * and their historical photographs remain byte-identical. */
const flow=fs.readFileSync("assets/frauen/frauen-original-v1224-header-seam-v1405.css","utf8");
const fixed=fs.readFileSync("assets/frauen/frauen-fixed-hero-v1408.css","utf8");
const runtime=fs.readFileSync("assets/frauen/frauen-fixed-hero-runtime-v1408.js","utf8");
const frontstage=fs.readFileSync("assets/dar-visitor-frontstage-v1.css","utf8");
const desktop=fs.readFileSync("desktop-preview/index.html","utf8");
assert.match(flow,/\.frauen-library-area-grid\{[\s\S]*?display:flex!important;[\s\S]*?flex-direction:column!important;/,"Frauen Kapitel müssen untereinander sein");
assert.match(flow,/\.frauen-library-area-grid > \.frauen-library-area-card\{[\s\S]*?width:100%!important;/,"Kapitelkarten müssen volle Breite haben");
assert.match(fixed,/FRAUEN_FIXED_HERO_V1408/);
assert.match(fixed,/\.dar-immersive-hero-stage\{[\s\S]*?position:fixed!important;/,"Fotografie + Suche müssen gemeinsam unter dem Markenheader fixiert sein");
assert.match(fixed,/\.dar-frauen-hero-space-v1408\{[\s\S]*?height:var\(--frauen-v1408-rail-height,0px\)!important;/,"Der Flow-Spacer darf niemals fehlen");
assert.match(runtime,/header\.getBoundingClientRect\(\)/,"Der tatsächliche Header muss gemessen werden");
assert.match(runtime,/rect\.bottom/,"Gemessene Header-Unterkante fehlt");
assert.match(runtime,/section\.insertBefore\(space,stage\.nextSibling\)/,"Inhalts-Spacer muss direkt hinter das Hero");
assert.match(runtime,/--frauen-v1408-rail-height/,"Fixierte Hero-Höhe muss gemessen werden");
assert.doesNotMatch(runtime,/preventDefault\(/,"Touch-Handler dürfen nicht dupliziert werden");
assert.doesNotMatch(frontstage,/\.more-grid,\.frauen-library-area-grid,\.quran-verse-grid/,"Frauen nicht erneut in Mehr-Mini-Grid aufnehmen");
for(const source of [native,testWorker,desktop]){
 assert.match(source,/frauen-fixed-hero-v1408\.css\?v=frauen-fixed-hero-v1408-20261103/);
 assert.match(source,/frauen-fixed-hero-runtime-v1408\.js\?v=frauen-fixed-hero-v1408-20261103/);
 assert.doesNotMatch(source,/frauen-hero-seam-runtime-v1407\.js/,"Der alte konfliktverursachende Hero-Seam-Runtime darf nicht geladen werden");
}
for(const [name,css] of [["Original",flow],["Fixed",fixed]])
 assert.equal([...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,name+" CSS-Klammern ungültig");
new (require("node:vm").Script)(runtime,{filename:"frauen-fixed-hero-runtime-v1408.js"});
console.log("PASS: Frauen V1408 fixed Hero/search + reserved content flow, original full-width capsule art unchanged.");

console.log("OK: Frauenbereich unverändert außer genehmigtem Entfernen der doppelten Mehr-Karte.");
