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
  assert.match(css,/\\.frauen-library-pinned-header\\.dar-hero-stage\\s*\\{[^}]*position:sticky!important/s,"Header must stay pinned: "+cssPath);
  assert.match(css,/\\.frauen-library-pinned-header\\s*>\\s*\\.frauen-library-hero\\[data-hero-readable="true"\\]\\s*\\{[^}]*display:block!important/s,"Hero must remain visible: "+cssPath);
  assert.match(css,/background-image:var\\(--frauen-hero-img\\)!important/,"Background image must be embedded: "+cssPath);
  assert.match(css,/overflow-x:clip!important/,"Prevent sideways clipping without creating scrolling ancestor");
  assert.match(js,/function libraryHero\\(/,"Shared hero renderer missing: "+jsPath);
  assert.match(js,/data-hero-readable=/,"Semantic hero flag missing: "+jsPath);
  assert.match(js,/function pinnedLibraryHead\\(/,"Shared pinned header missing: "+jsPath);
  for(const view of ["renderHub", "renderLibraryGroup", "renderSectionHero"]){
    assert.ok(js.includes("function "+view+"("),"Missing "+view+": "+jsPath);
  }
  for(const image of imageNames){
    assert.ok(fs.existsSync(variant+"assets/frauen/library-v1224/"+image),"Missing local image "+variant+image);
    assert.ok(css.includes(prefix+image),"Hero theme lacks local picture "+variant+image);
  }
}
assert.match(read("cloudflare/test-app-worker.js"),/frauen-authority-v1292\\.css\\?v=frauen-hero-v1390/,"Test shell must bust Frauen CSS cache");
assert.match(read("cloudflare/site-router.js"),/frauen-authority-v1292\\.css\\?v=frauen-hero-v1390/,"Visitor/iOS shell must bust Frauen CSS cache");
console.log("OK Frauen: hub/group/list heroes and all seven image assets in Test + Besucher.");
