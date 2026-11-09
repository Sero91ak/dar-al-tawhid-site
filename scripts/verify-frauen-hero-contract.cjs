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
  "assets/frauen/frauen-live-adapter.js": "ba1a7bd99e1be5bddd383f76b389af3b20eb6ae9",
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
assert.ok(native.includes("/assets/frauen/frauen-live-adapter.js?v=frauen-incremental-search-v1414-20261109"),"Idempotenten Frauen-Adapter mit neuem Cache-Key ausliefern");
const testWorker=fs.readFileSync("cloudflare/test-app-worker.js","utf8");
assert.ok(testWorker.includes("frauen-authority-v1292.css?v=frauen-rollback-20261016-1500"),"Test CSS cache key fehlt");
for(const prefix of ["assets/frauen/library-v1224/","test/assets/frauen/library-v1224/"]){
  for(const image of ["01-grundlagen-din.jpg","02-fiqh-frauen.jpg","03-erste-generationen.jpg","04-familie-erziehung.jpg","05-wissen-adab-dawah.jpg","06-alltag-schutz.jpg","07-lebensphasen.jpg"]){
    assert.ok(fs.existsSync(prefix+image),"Original Frauen-Hero-Motiv fehlt: "+prefix+image);
  }
}
/* Frauen V1414: the original photographs, chapter order, sources and frozen
 * women content renderers remain untouched. The explicitly authorized live
 * adapter update changes only search-result DOM reconciliation. */
const flow=fs.readFileSync("assets/frauen/frauen-original-v1224-header-seam-v1405.css","utf8");
const seam=fs.readFileSync("assets/frauen/frauen-hero-seam-runtime-v1407.js","utf8");
const frontstage=fs.readFileSync("assets/dar-visitor-frontstage-v1.css","utf8");
const desktop=fs.readFileSync("desktop-preview/index.html","utf8");
const otherHero=fs.readFileSync("assets/adult-immersive-hero-v1.js","utf8");
const otherHeroTest=fs.readFileSync("test/assets/adult-immersive-hero-v1.js","utf8");
const edge=fs.readFileSync("assets/dar-adult-top-scroll-boundary-v1.js","utf8");
const edgeTest=fs.readFileSync("test/assets/dar-adult-top-scroll-boundary-v1.js","utf8");
assert.match(flow,/\.frauen-library-area-grid\{[\s\S]*?display:flex!important;[\s\S]*?flex-direction:column!important;/,
 "Frauen Kapitel müssen untereinander sein");
assert.match(flow,/\.frauen-library-area-grid > \.frauen-library-area-card\{[\s\S]*?width:100%!important;/,
 "Kapitelkarten müssen die volle Breite behalten");
assert.match(flow,/DAR_FRAUEN_SINGLE_FIXED_HERO_V1414/);
assert.match(flow,/\.dar-immersive-hero-stage\{[\s\S]*?position:fixed!important;/,
 "Bild und Suche bilden genau eine viewport-feste Einheit");
assert.match(flow,/\.dar-frauen-hero-spacer\{[\s\S]*?height:var\(--frauen-pinned-stage-height/,
 "Inhalt braucht genau einen normalen Fluss-Abstand");
assert.match(flow,/DAR_FRAUEN_ONE_DOCUMENT_SCROLL_V1409/);
assert.doesNotMatch(flow,/--frauen-flow-seam-shift|position:sticky!important/,
 "Keine konkurrierende Sticky-Regel oder negative Laufzeitkorrektur");
assert.match(seam,/function frauenDocumentScroll\(body\)/);
assert.match(seam,/function restoreBodyOverflow\(\)/);
assert.match(seam,/function restoreMissingSurface\(\)/,
 "Originalbilder nach Verlust aus dem kanonischen Renderer nachziehen");
assert.match(seam,/tpl\.content\.querySelector\("\.frauen-library-hero"\)/);
assert.match(seam,/shell\.insertBefore\(spacer,stage\)/);
assert.match(seam,/resizeObserver\.observe\(stage\)/);
assert.match(seam,/header\.getBoundingClientRect\(\)\.bottom/);
assert.match(seam,/spacer\.style\.height=height/);
assert.doesNotMatch(seam,/addEventListener\("scroll"|--frauen-flow-seam-shift|preventDefault\(|scrollTo\(/,
 "Kein Hero-Scrollloop, keine Eingabe-/Touch-Interception");
assert.doesNotMatch(seam,/app\.innerHTML|#appView\.innerHTML/,
 "Hero-Controller darf kein Seiten-Rendering auslösen");
assert.doesNotMatch(otherHero,/function women\(\)|women\(\);/,
 "Zweiter globaler Hero-DOM-Eigentümer muss entfernt bleiben");
assert.equal(otherHeroTest,otherHero,"Test/Visitor global Hero parity");
assert.match(adapter,/FRAUEN_SEARCH_INCREMENTAL_V1414/);
assert.match(adapter,/oldShell\.appendChild\(child\)/);
assert.match(adapter,/if\(!incremental\)app\.innerHTML=/);
assert.match(adapter,/if\(searchFocus&&!incremental\)/);
assert.match(edge,/Frauen V1414: never cancel a normal page pan/);
assert.equal(edge,edgeTest,"Test/Visitor Touch parity");
assert.doesNotMatch(frontstage,/\.more-grid,\.frauen-library-area-grid,\.quran-verse-grid/,
 "Generischer Mini-Raster-Konflikt wieder eingeführt");
for(const source of [native,testWorker,desktop]){
 assert.match(source,/frauen-fixed-single-owner-v1414-20261109/);
 assert.match(source,/frauen-fixed-geometry-v1414-20261109/);
}
assert.match(native,/frauen-incremental-search-v1414-20261109/);
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
console.log("PASS: V1414 original photos, one-column chapters, one fixed Hero/search owner, and incremental search.");

console.log("OK: Frauenbereich unverändert außer genehmigtem Entfernen der doppelten Mehr-Karte.");
