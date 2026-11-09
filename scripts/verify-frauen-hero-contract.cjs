"use strict";
/* DAR_FRAUEN_NOON_ROLLBACK_CONTRACT_20261017
 * Exact restored working files from 2026-10-16 14:59:29 Europe/Berlin.
 * Approved scoped exception: suppress only the redundant Frauen tile in Mehr while keeping the Frauen route unchanged. Other app lanes untouched. */
const fs=require("node:fs");
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const frozen={
  "assets/frauen/frauen-authority-v1292.css": "6bb786de1ecb1b0d3ed5d01ec511cc10c9b3da86",
  "assets/frauen/frauen-fiqh.js": "d3dc946bcdad475450cddc9b338a6f3ed3f94f2b",
  "assets/frauen/frauen-live-adapter.js": "6fa99a123e92afd98b9b7a63d864cf1f9d7175a0",
  "test/assets/frauen/frauen-authority-v1292.css": "07b9fa32585de8fcb57aad13b13ab2c67167ee4b",
  "test/assets/frauen/frauen-fiqh.js": "e050fcd3d7ebef6771cea55631ea628359df10b6"
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
assert.match(adapter,/FRAUEN_RENDER_IDEMPOTENT_V1410/,
 "Nur geaenderte Frauen-Inhalte duerfen den DOM neu aufbauen");
assert.match(adapter,/sameRoute&&present&&lastFrauenMarkup===markup\)return false/,
 "Unveraenderter Frauen-Router darf weder Bild noch Suche neu montieren");
assert.match(adapter,/if\(!sameRoute\)\{[\s\S]*?global\.scrollTo\(0,0\)/,
 "Scroll zurueck zu Null ist nur beim Routewechsel erlaubt");
assert.match(adapter,/current\.focus\(\{preventScroll:true\}\)/,
 "Search-Fokus muss auf echten Inhaltswechseln erhalten bleiben");
assert.ok(!/global\.scrollTo\(0,0\)\s*\}catch\(e\)\{\}\s*try\{document\.dispatchEvent/.test(adapter),
 "Alte bedingungslose Frauen-Scrollsperre darf nicht wiederkehren");
assert.ok(adapter.includes("MEHR_DUPLICATE_FRAUEN_ROW_REMOVED_V1"),"Doppelte Frauen-Mehr-Karte darf nicht automatisch eingefügt werden");
assert.ok(!adapter.includes("target.appendChild(btn)"),"Veraltete zusätzliche Frauen-Karte bleibt aktiv");
const native=fs.readFileSync("cloudflare/site-router.js","utf8");
assert.ok(native.includes("/test/assets/frauen/frauen-fiqh.js?v=frauen-input-focus-stable-v1416-20261109"),"iOS Frauen renderer wiederherstellen");
assert.ok(native.includes("/assets/frauen/frauen-live-adapter.js?v=frauen-herodock-mount-v1416-20261109"),"Idempotenten Frauen-Adapter mit neuem Cache-Key ausliefern");
const testWorker=fs.readFileSync("cloudflare/test-app-worker.js","utf8");
assert.ok(testWorker.includes("frauen-authority-v1292.css?v=frauen-rollback-20261016-1500"),"Test CSS cache key fehlt");
for(const prefix of ["assets/frauen/library-v1224/","test/assets/frauen/library-v1224/"]){
  for(const image of ["01-grundlagen-din.jpg","02-fiqh-frauen.jpg","03-erste-generationen.jpg","04-familie-erziehung.jpg","05-wissen-adab-dawah.jpg","06-alltag-schutz.jpg","07-lebensphasen.jpg"]){
    assert.ok(fs.existsSync(prefix+image),"Original Frauen-Hero-Motiv fehlt: "+prefix+image);
  }
}
/* HERODOCK_V1416: the original photo/search live under BODY, outside the
 * 1080px library and outside scroll ancestors. A single measured flow spacer
 * carries the height. Do not add a second sticky Header or width breakout. */
const flow=fs.readFileSync("assets/frauen/frauen-original-v1224-header-seam-v1405.css","utf8");
const seam=fs.readFileSync("assets/frauen/frauen-hero-seam-runtime-v1407.js","utf8");
const immersiveCss=fs.readFileSync("assets/adult-immersive-hero-v1.css","utf8");
const frontstage=fs.readFileSync("assets/dar-visitor-frontstage-v1.css","utf8");
const desktop=fs.readFileSync("desktop-preview/index.html","utf8");
const immersive=fs.readFileSync("assets/adult-immersive-hero-v1.js","utf8");
const testImmersive=fs.readFileSync("test/assets/adult-immersive-hero-v1.js","utf8");
const edge=fs.readFileSync("assets/dar-adult-top-scroll-boundary-v1.js","utf8");
const testEdge=fs.readFileSync("test/assets/dar-adult-top-scroll-boundary-v1.js","utf8");
const originalRenderer=fs.readFileSync("test/assets/frauen/frauen-fiqh.js","utf8");
assert.match(flow,/\.frauen-library-area-grid\{[\s\S]*?display:flex!important;[\s\S]*?flex-direction:column!important;/,
 "Original chapters remain one column");
assert.match(flow,/\.frauen-library-area-grid > \.frauen-library-area-card\{[\s\S]*?width:100%!important;/,
 "Chapter cards remain full width");
assert.match(flow,/DAR_FRAUEN_FULL_BLEED_HERODOCK_V1416/);
assert.match(flow,/#darFrauenHeroDockV1416\{[\s\S]*?position:fixed!important;/);
assert.match(flow,/#darFrauenHeroDockV1416 > \.frauen-library-hero\{[\s\S]*?width:100%!important;/);
assert.match(flow,/#appView \.dar-frauen-dock-spacer\{[\s\S]*?height:var\(--frauen-dock-reserved,0px\)!important;/);
assert.doesNotMatch(flow,/--frauen-flow-seam-shift|DAR_FRAUEN_ONE_STAGE_NATIVE_SCROLL_V1415|\.dar-immersive-hero-stage/,
 "Old sticky/seam system must not remain in Frauen flow CSS");
assert.match(seam,/DAR_FRAUEN_HERO_SEAM_RETIRED_V1416/);
assert.doesNotMatch(seam,/MutationObserver|requestAnimationFrame|ResizeObserver\(/,
 "Dead runtime must not measure header or move elements");
assert.match(adapter,/FRAUEN_RENDER_IDEMPOTENT_V1410 \+ HERODOCK_V1416/);
assert.match(adapter,/function prepareFrauenMarkup\(markup\)/);
assert.match(adapter,/function patchFrauenContent\(present,prepared\)/);
assert.match(adapter,/document\.body\.appendChild\(prepared\.stage\)/,
 "Hero must be a real BODY sibling, not nested in content");
assert.match(adapter,/stage\.appendChild\(hero\)/);
assert.match(adapter,/if\(search\)stage\.appendChild\(search\)/);
assert.match(adapter,/if\(child!==nextSpacer\)current\.appendChild\(child\)/);
assert.match(adapter,/var incremental=!!\(sameRoute&&present&&patchFrauenContent\(present,prepared\)\)/);
assert.match(adapter,/previousScroll>0&&!incremental/);
assert.doesNotMatch(adapter,/addEventListener\("scroll"|--frauen-flow-seam-shift|100vw|margin-top.*-/,
 "No scroll-driven or negative-margin Hero control");
assert.doesNotMatch(immersiveCss,/#appView \.dar-immersive-hero-stage > \.frauen-library-hero/,
 "Global CSS must not resize relocated original photo");
assert.doesNotMatch(immersive,/function women\(\)|women\(\);/);
assert.equal(testImmersive,immersive,"Visitor/Test general hero JS must match");
assert.equal(edge,testEdge,"Visitor/Test touch boundaries must match");
assert.match(edge,/Women V1415: native document scrolling/);
assert.match(originalRenderer,/document\.activeElement !== again/);
assert.match(originalRenderer,/again\.focus\(\{ preventScroll: true \}\)/);
assert.doesNotMatch(originalRenderer,/^\s*again\.focus\(\);\s*$/m,
 "Original search must not force WebKit focus per key");
assert.doesNotMatch(frontstage,/\.more-grid,\.frauen-library-area-grid,\.quran-verse-grid/);
for(const source of [native,testWorker,desktop]){
 assert.match(source,/frauen-full-bleed-herodock-v1416-20261109/);
 assert.doesNotMatch(source,/frauen-header-measure-only-v1415-20261109/,
  "Second Frauen header owner must not be loaded");
}
assert.match(native,/frauen-herodock-mount-v1416-20261109/);
assert.equal([...flow].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,
 "Full-bleed Frauen flow CSS braces");
new (require("node:vm").Script)(seam,{filename:"frauen-hero-seam-runtime-v1407.js"});

/* DAR_FRAUEN_HTML5_DOCUMENT_SCROLL_V1413
 * The Cloudflare Worker must NEVER insert styles before <!doctype html>.
 * The native iOS/Android root index has no literal </head> (legacy shell),
 * so old "css + html" fallback made mobile Chromium run in BackCompat with
 * BODY as the scroll root. This broke sticky Hero, search and finger pan. */
{
 const vm=require("node:vm");
 const start=native.indexOf("function addStyleWithoutMovingDoctype(");
 const end=native.indexOf("function activateAdultCompactHero(",start);
 assert.ok(start>0&&end>start,"HTML5-Dokumentbarriere muss im Cloudflare-Router vorhanden sein");
 const isolate=native.slice(start,end);
 const addStyle=vm.runInNewContext(isolate+";addStyleWithoutMovingDoctype",{});
 assert.equal(typeof addStyle,"function");
 for(const path of ["index.html","test/index.html"]){
  const source=fs.readFileSync(path,"utf8");
  const stylesheet='<link rel="stylesheet" id="doctypeRegressionCssV1413" href="/assets/doctypetest.css">';
  const corrected=addStyle(source,stylesheet);
  assert.match(source,/^<!doctype html>/i,path+" muss mit HTML5 doctype beginnen");
  assert.match(corrected,/^<!doctype html>/i,path+": die Doctype-Deklaration darf nicht verrueckt werden");
  assert.ok(corrected.indexOf(stylesheet)>corrected.indexOf("<head>"),path+": CSS innerhalb HEAD");
  assert.equal(corrected.slice(0,source.indexOf("<head>")),source.slice(0,source.indexOf("<head>")),
   path+": Source vor HEAD bytegenau erhalten");
  assert.equal((corrected.match(/doctype html/gi)||[]).length,(source.match(/doctype html/gi)||[]).length,
   path+": keine zusaetzliche Doctype erzeugen");
 }
 assert.match(native,/addStyleWithoutMovingDoctype\(html, css\)/,
  "Besucher/CSS-Inject muss durch HTML5-sichere Einfuegung gehen");
 assert.match(native,/addStyleWithoutMovingDoctype\(html, v3Styles\)/,
  "Test-App/CSS-Inject muss ebenfalls HTML5-sicher sein");
 assert.ok(!native.includes(": css + html")&&!native.includes(": v3Styles + html"),
  "Keine Stylesheets mehr vor <!doctype html> setzen");
}
console.log("PASS: V1416 original photographs, one fixed BODY HeroDock + exact spacer + stable search; no sticky competitors.");

console.log("OK: Frozen Frauen content and sources retained; only approved layout and focus handling changed.");
