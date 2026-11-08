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
  "assets/frauen/frauen-live-adapter.js": "2c5704b164da160e463b5accabb50d9a21e0abce",
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
assert.ok(native.includes("/test/assets/frauen/frauen-fiqh.js?v=frauen-rollback-20261016-1500"),"Alten iOS Frauen renderer wiederherstellen");
assert.ok(native.includes("/assets/frauen/frauen-live-adapter.js?v=frauen-native-scroll-no-reset-v1411-20261108"),"Idempotenten Frauen-Adapter mit neuem Cache-Key ausliefern");
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
assert.match(flow,/html\[data-theme\]\.dar-test-premium-header-v2 body\.has-bottom-nav\.is-area-route\.is-frauen-route,[\s\S]*?overflow-x:clip!important;\s*overflow-y:visible!important;/,
 "Frauen braucht einen HTML-Dokument-Scroller, sonst scrollt Sticky-Hero in Test weg");
assert.match(seam,/function frauenDocumentScroll\(body\)/,
 "Body overflow muss im laufenden Frauenbereich browserfest vereinheitlicht werden");
assert.match(seam,/function restoreBodyOverflow\(\)/,
 "Urspruengliche Body-Styles muessen beim Verlassen des Frauenbereichs zurueckkehren");
assert.match(seam,/body\.style\.setProperty\("overflow-x","clip","important"\)/,
 "Frauen darf keinen stummen body Overflow-Y-Auto Scrollcontainer behalten");
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
/* FRAUEN_NATIVE_TOUCH_RENDER_SMOKE_V1410: repeated global render ticks
 * MUST NOT replace the native scroll surface, detach search or jump to top. */
{
 const vm=require("node:vm"),domEvents={};
 let htmlPaints=0,scrollCalls=0,focusRetained=0,inputSource="stable";
 const classes={add(){},remove(){}};
 const app={
  _html:"",
  get innerHTML(){return this._html},
  set innerHTML(next){this._html=next;htmlPaints++},
  querySelector(selector){
   if(selector.indexOf(":scope")===0)return this._html.includes("dar-frauen-production-root")?{}:null;
   if(selector==="[data-frauen-q]")return {focus(opts){if(opts?.preventScroll)focusRetained++},setSelectionRange(){}};
   return null;
  },scrollTop:0
 };
 const styles={};
 const doc={
  readyState:"loading",
  body:{classList:classes,removeAttribute(){}},
  documentElement:{classList:classes},
  head:{appendChild(el){styles[el.id]=el}},
  activeElement:{matches:()=>false},
  getElementById(id){return id==="appView"?app:styles[id]||null},
  createElement(){return {}},
  addEventListener(k,fn){(domEvents[k]||(domEvents[k]=[])).push(fn)},
  dispatchEvent(){}
 };
 const loc={hash:"#frauen"};
 const win={
  scrollY:0,addEventListener(){},
  render(){},
  scrollTo(x,y){scrollCalls++;this.scrollY=y},
  DARFrauenFiqh:{render(v){return '<article data-id="'+String(v)+'">'+inputSource+'</article>'},bind(){}}
 };
 vm.runInNewContext(adapter,{
  window:win,document:doc,location:loc,
  setInterval:()=>1,clearInterval(){},setTimeout(){},
  CustomEvent:class{},MutationObserver:class{observe(){}},
  console
 },{timeout:1000,filename:"frauen-live-adapter-v1410.js"});
 assert.equal(domEvents.DOMContentLoaded.length,1);
 domEvents.DOMContentLoaded[0]();
 assert.equal(htmlPaints,1,"Initial Frauen route must paint once");
 assert.equal(scrollCalls,1,"Initial route must start at top exactly once");
 win.scrollY=240;
 for(let i=0;i<50;i++)win.render();
 assert.equal(htmlPaints,1,"Fifty identical render ticks must preserve DOM and scroll");
 assert.equal(scrollCalls,1,"Identical render ticks must never reset native scroll");
 doc.activeElement={matches:selector=>selector==="[data-frauen-q]",selectionStart:4};
 inputSource="updated";
 win.render();
 assert.equal(htmlPaints,2,"Real source update must repaint");
 assert.equal(win.scrollY,240,"Source update must preserve reader scroll");
 assert.equal(focusRetained,1,"Search caret must stay focused after content update");
 loc.hash="#frauen/group/din";
 win.render();
 assert.equal(htmlPaints,3,"Navigation to a new group must repaint");
 assert.equal(win.scrollY,0,"Navigation must start new Frauen route at top");
}
console.log("PASS: V1407 original photos, one-column chapters, pinned Hero/search, and under-scrolling card area.");

console.log("OK: Frauenbereich unverändert außer genehmigtem Entfernen der doppelten Mehr-Karte.");
