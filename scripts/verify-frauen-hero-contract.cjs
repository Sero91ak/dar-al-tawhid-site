"use strict";
/* DAR_FRAUEN_HERO_CONTRACT_V1390
 * Regression guard for new adult women routes and both visitor/test apps.
 * No image re-creation, no audio/nav/card changes. */
const fs = require("node:fs");
const assert = require("node:assert/strict");
const read = p => fs.readFileSync(p,"utf8");
const imageNames = [
  "01-grundlagen-din.jpg",
  "02-fiqh-frauen.jpg",
  "03-erste-generationen.jpg",
  "04-familie-erziehung.jpg",
  "05-wissen-adab-dawah.jpg",
  "06-alltag-schutz.jpg",
  "07-lebensphasen.jpg"
];
for(const variant of ["", "test/"]){
  const cssPath = variant + "assets/frauen/frauen-authority-v1292.css";
  const jsPath = variant + "assets/frauen/frauen-fiqh.js";
  const css = read(cssPath), js = read(jsPath);
  const prefix = "/" + variant + "assets/frauen/library-v1224/";
  assert.match(css,/DAR_FRAUEN_HERO_RESTORE_V1390/,"Missing Frauen hero authority: "+cssPath);
  assert.ok(css.includes(".frauen-library-pinned-header.dar-hero-stage{") && css.includes("position:sticky!important;"),"Header must stay pinned: "+cssPath);
  assert.ok(css.includes(".frauen-library-pinned-header > .frauen-library-hero[data-hero-readable=\"true\"]{") && css.includes("display:block!important;"),"Hero must remain visible: "+cssPath);
  assert.ok(css.includes("background-image:var(--frauen-hero-img)!important;"),"Background image must be embedded: "+cssPath);
  assert.match(css,/overflow-x:clip!important/,"Prevent sideways clipping without creating scrolling ancestor");
  assert.ok(js.includes("function libraryHero("),"Shared hero renderer missing: "+jsPath);
  assert.match(js,/data-hero-readable=/,"Semantic hero flag missing: "+jsPath);
  assert.ok(js.includes("function pinnedLibraryHead("),"Shared pinned header missing: "+jsPath);
  if(variant===""){
    const safe=js.slice(js.indexOf("/* DAR_FRAUEN_HERO_SAFE_EVENTS_V1395"));
    assert.ok(safe.startsWith("/* DAR_FRAUEN_HERO_SAFE_EVENTS_V1395"),"Visitor safe hero runtime missing");
    assert.ok(!safe.includes("new MutationObserver(")&&!safe.includes("setInterval("),"Visitor must not poll DOM forever");
    assert.ok(safe.includes("syncScroll(value)")&&safe.includes('setProperty("overflow-y","visible","important")'),"Visitor iOS scrollport recovery missing");
  }else{
    assert.ok(js.includes("DAR_FRAUEN_HERO_DOM_INTEGRITY_V1392"),"Test hero guard must remain unchanged");
  }
  for(const view of ["renderHub", "renderLibraryGroup", "renderSectionHero"]){
    assert.ok(js.includes("function "+view+"("),"Missing "+view+": "+jsPath);
  }
  for(const image of imageNames){
    assert.ok(fs.existsSync(variant+"assets/frauen/library-v1224/"+image),"Missing local image "+variant+image);
    assert.ok(css.includes(prefix+image),"Hero theme lacks local picture "+variant+image);
  }
}
assert.ok(read("cloudflare/test-app-worker.js").includes("frauen-authority-v1292.css?v=frauen-hero-v1390"),"Test shell must bust Frauen CSS cache");
assert.ok(read("cloudflare/site-router.js").includes("frauen-authority-v1292.css?v=visitor-frauen-scroll-v1396"),"Visitor/iOS shell must bust Frauen CSS cache");
assert.ok(read("cloudflare/site-router.js").includes('/assets/frauen/frauen-fiqh.js?v=visitor-frauen-scroll-v1396'),"Visitor native must use its own Frauen renderer");
assert.ok(read("cloudflare/site-router.js").includes("VISITOR_FRAUEN_SINGLE_RENDERER_V1396"),"iOS visitor must remove legacy Test Frauen tags");
console.log("OK Frauen: hub/group/list heroes and all seven image assets in Test + Besucher.");
