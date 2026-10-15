#!/usr/bin/env node
"use strict";
/* KIDS Salaf visual contract: deterministic structural/asset guard.
 * Human visual review is mandatory; tests cannot identify faces alone. */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const policy=JSON.parse(read("kids/salaf-art-contract-v1380.json"));
const js=read("kids/salaf-library-v1.js");
const css=read("kids/salaf-open-world-v1353.css");
const globalCss=read("kids/global-detail-dock-v1247.css");
const globalJs=read("kids/global-detail-dock-v1247.js");
const heroSeam=read("kids/global-hero-seam-v1412.css");
const navigation=read("kids/navigation-v1182.js");
const doc=read("kids/KIDS-DESIGN.md");
const sw=read("kids/sw.js");
const html=read("kids/index.html");
const id="kids-shell-v1421-learn-center-dua-fourth-salaf-in-hoeren";
assert.equal(policy.policyVersion,"KIDS_SALAF_NO_PEOPLE_V1380");
assert.equal(Object.keys(policy.allowlistedAssets).length,8,"Exactly eight reviewed topics");
for(const [topic,asset] of Object.entries(policy.allowlistedAssets)){
  const bytes=fs.readFileSync(path.join(root,asset.path));
  assert.ok(bytes.length>90000&&bytes.length<650000,`Unexpected art size ${topic}`);
  assert.ok(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff,`Invalid JPEG ${topic}`);
  const raw=Buffer.concat([Buffer.from("blob "+bytes.length+String.fromCharCode(0)),bytes]);
  const sha=crypto.createHash("sha1").update(raw).digest("hex");
  assert.equal(sha,asset.gitBlobSha,`Artwork changed without manual review: ${topic}`);
  assert.ok(js.includes("/"+asset.path),`Missing category art ${topic}`);
  assert.ok(sw.includes("/"+asset.path),`Missing offline pre-cache art ${topic}`);
  assert.equal(asset.visualReview,"reviewed-no-people-no-faces-no-letters");
}
assert.ok(!js.includes("topics-v1370/"),"Old face-containing artwork must not be referenced");
assert.ok(js.includes('id="salafTopicAppbar"'),"One permanent topic header must be direct root child");
assert.ok(js.includes("salaf-topic-nav kids-detail-appbar kids-subpage-nav"),"Reuse global detail header components");
assert.ok(js.includes("appbar.hidden=!detailOpen"),"Top rail must only show in category mode");
assert.ok(js.includes('root.classList.toggle("kids-detail-page",detailOpen)'),"Opt into global detail-page contract");
assert.ok(js.includes("salaf-topic-stage kids-detail-hero"),"Use shared unboxed hero contract");
assert.ok(!js.includes("pane.innerHTML=\u0027<nav"),"No moving, nested topic appbar allowed");
assert.ok(js.includes("salaf-story-nav kids-detail-appbar"),"Story needs global top navigation");
assert.ok(js.includes("kids-detail-dock-back"),"Standard back arrow required");
assert.ok(!js.includes('class="salaf-topic-back"'),"Do not reintroduce floating back pill");
assert.ok(css.includes("SALAF_DESIGN_GUARD_V1380"),"Missing visual theme and layout safeguards");
assert.ok(css.includes("SALAF_STICKY_DETAIL_ROOT_V1390"),"Missing pinned Salaf header on root");
assert.ok(globalCss.includes("KIDS_GLOBAL_DETAIL_PAGE_ARCHITECTURE_V1390"),"Missing permanent global detail-page contract");
for(const rule of ["position:sticky!important","top:var(--safe-top","margin-inline:calc(50% - 50vw)","border-radius:0!important","background:var(--kids-detail-head-bg"]){
 assert.ok(globalCss.includes(rule),"Global detail architecture CSS rule missing: "+rule);
}
assert.ok(doc.includes("KIDS_GLOBAL_DETAIL_PAGE_ARCHITECTURE_V1390"),"New Kids detail-page rules must be documented");
/* KIDS_GLOBAL_PINNED_DETAIL_V1400: reject moving headers and overview duplicates
 * at the existing mandatory App Health gate, not a new unrestricted workflow. */
assert.ok(globalJs.includes("KIDS_GLOBAL_PINNED_DETAIL_PORTAL_V1400"),"Global pinned detail runtime missing");
assert.ok(globalJs.includes('document.body.appendChild(bar)'),"Appbar must escape scrolling shell into a viewport-pinned layer");
assert.ok(globalJs.includes('record.spacer.style.height'),"Header requires in-flow measured spacer");
assert.ok(globalJs.includes('dockSalafStoryHeader()'),"Full-screen story bar must be OUTSIDE its scrolling content");
assert.ok(globalCss.includes("KIDS_FIXED_DETAIL_PORTAL_CSS_V1400"),"Viewport-pinned global detail CSS missing");
assert.ok(globalCss.includes('body > .kids-detail-appbar.kids-portal-appbar'),"Fixed portal selector missing");
assert.ok(css.includes("SALAF_FIXED_DETAIL_AND_STORY_V1400"),"Salaf story scroll and appbar layout missing");
assert.ok(js.includes("SALAF_CATEGORIES_ONLY_V1400"),"Category-only overview contract missing");
assert.ok(!js.includes("<h3>Alle Geschichten</h3>"),"Duplicated overview stories forbidden");
assert.ok(js.includes("list.replaceChildren();"),"Overview must not render a second story list");
assert.ok(js.includes('q("#salafClear").addEventListener'),"Back button must retain listener outside scroll root");
assert.ok(navigation.includes('#salafClear,.salaf-back'),"Back/restore navigation contract missing");
assert.ok(doc.includes("KIDS_GLOBAL_FIXED_DETAIL_V1400"),"Global pinned appbar documented contract missing");
/* V1410: the iOS top safe-area must be part of the SAME opaque rail.
 * Previous v1400 left top:var(--safe-top) and showed the scrolling image
 * underneath the status bar. Validate the final overriding rule explicitly. */
const v1410=globalCss.slice(globalCss.indexOf("/* KIDS_GLOBAL_SAFE_AREA_HEADER_V1410"));
assert.ok(v1410.length>1200,"Top safe-area must have a global CSS contract");
assert.match(v1410,/html body > \.kids-detail-appbar\.kids-portal-appbar\s*\{/);
assert.ok(v1410.includes("top:0!important"),"Body-pinned appbar must start at viewport y=0");
assert.ok(v1410.includes("inset-block-start:0!important"),"Logical top must equal 0");
assert.ok(v1410.includes("padding-top:calc(10px + env(safe-area-inset-top,0px))!important"),"Safe inset must be INSIDE opaque rail");
assert.ok(v1410.includes("min-height:calc(68px + env(safe-area-inset-top,0px))!important"),"Full rail must include status safe area");
assert.ok(v1410.includes("background:var(--kids-detail-head-bg,#092b3b)!important"),"Status and top rail must share opaque theme background");
assert.ok(v1410.includes("justify-content:flex-start!important"),"Back and title must align like the reference");
assert.ok(globalJs.includes('record.spacer.style.height=Math.max(68,Math.ceil(bar.getBoundingClientRect().height))'),"Content must start below measured full header");
assert.ok(globalJs.includes('window.visualViewport?.addEventListener("resize",queue'),"Header must handle mobile viewport/safe-area changes");
assert.ok(globalJs.includes('version:"1410"'),"Global controller version mismatch");
assert.ok(globalJs.includes("KIDS_GLOBAL_TOP_SCROLL_BOUNDARY_V1428"),"All Kids views must share the top-edge guard");
assert.ok(globalCss.includes("KIDS_GLOBAL_TOP_SCROLL_BOUNDARY_V1428"),"Global CSS top-edge stop missing");
assert.ok(globalJs.includes('rootSelector=".shell,'),"Overview views must be protected, not only detail pages");
assert.ok(html.includes("/kids/sw.js?v=1428"),"Offline shell release must load the fresh service worker");
assert.ok(globalJs.includes("KIDS_TOP_SCROLL_BOUNDARY_V1411"),"Global touch-boundary controller missing");
assert.ok(globalCss.includes("KIDS_TOP_SCROLL_BOUNDARY_V1411"),"Global top-edge overscroll containment missing");
assert.ok(globalJs.includes("touchmove")&&globalJs.includes("event.preventDefault()"),"Native iOS top rubber-band must be prevented");
assert.ok(globalJs.includes(".ps-modal.open")&&globalJs.includes(".ms-modal.open"),"Story reader overlays must be covered");
assert.ok(doc.includes("KIDS_GLOBAL_STATUS_SAFE_AREA_V1410"),"Canonical documentation for status area missing");

assert.ok(css.includes("margin-inline:calc(50% - 50vw)!important"),"Full-bleed wrapper required");
assert.ok(css.includes("justify-content:flex-end!important"),"Stage heading must be bottom-aligned");
for(const p of ["kids/index.html","kids/shell.html","kids/start.html"]){
  assert.equal(read(p),html,"Kids HTML entrypoints must be identical");
  assert.ok(html.includes("salaf-library-v1.js?v=1430"),"JS cache bust missing");
  assert.ok(html.includes("global-detail-dock-v1247.css?v=1428"),"Global style contract must be current");
  assert.ok(html.includes("global-detail-dock-v1247.js?v=1428"),"Pinned global header runtime cache-bust missing");
  assert.ok(html.includes("navigation-v1182.js?v=1425"),"Navigation history refresh missing");
  assert.ok(html.includes("salaf-open-world-v1353.css?v=1410"),"CSS cache bust missing");
}
for(const p of ["kids/version.json","kids/manifest.webmanifest",
 "kids/v12-alive.txt","cloudflare/site-router.js",
 "cloudflare/test-app-worker.js","_headers"]){
 assert.ok(read(p).includes(id),`Build mismatch ${p}`);
}
const kidsVersion=JSON.parse(read("kids/version.json"));
const expectedKidsCache="dar-al-tawhid-kids-"+String(kidsVersion.visualSystem.serviceWorkerCache||"");
assert.ok(/^dar-al-tawhid-kids-v[0-9]+$/.test(expectedKidsCache),"Kids version must define a numeric service-worker cache version");
assert.ok(sw.includes(id)&&sw.includes(expectedKidsCache),"Kids SW buildId and release cache must match kids/version.json");
assert.ok(sw.includes("/kids/global-detail-dock-v1247.css?v=1428"));
assert.ok(sw.includes("/kids/global-detail-dock-v1247.js?v=1428"));
assert.ok( heroSeam.includes("KIDS_GLOBAL_HEADER_HERO_SEAM_V1412"),"Global hero seam contract missing");
assert.ok( heroSeam.includes("padding-top:0!important"),"Detail shell must start at viewport top");
assert.ok( heroSeam.includes(".ps-modal.open")&&heroSeam.includes(".ms-modal.open"),"Hero seam must cover story reader modals");
assert.ok( html.includes("/kids/global-hero-seam-v1412.css?v=1413"),"Hero seam CSS must load after Salaf art");
assert.ok( sw.includes("/kids/global-hero-seam-v1412.css?v=1413"),"Hero seam offline precache missing");
assert.ok(sw.includes("/kids/navigation-v1182.js?v=1425"));
assert.ok(sw.includes("/kids/salaf-library-v1.js?v=1430"));
assert.ok(sw.includes("/kids/salaf-open-world-v1353.css?v=1410"));
/* KIDS_STORY_MODES_V1: keep all three real modes for every approved
 * Salaf narrative, even before its first paid master audio arrives. */
const modesCss=read("kids/salaf-master-v2.css");
const sharedReader=read("kids/story-follow-reader.js");
const storyLibraries=[
  ["Propheten","kids/prophet-stories.js","data-ps-mode"],
  ["Ṣaḥābah","kids/mubashshirun-stories.js","data-ms-mode"],
  ["Ṣaḥābiyyāt","kids/sahabiyyat-stories.js","data-sy-mode"],
  ["Salaf","kids/salaf-library-v1.js","data-salaf-mode"]
];
for(const [name,file,attribute] of storyLibraries){
  const body=read(file);
  for(const value of ["both","listen","read"]){
    assert.ok(body.includes(attribute+'="'+value+'"'),name+" missing "+value+" control");
  }
}
for(const method of ["openReadAlong","openListening","openReading"]){
  assert.ok(js.includes("reader."+method+"()"),"Salaf must use shared reader "+method);
}
assert.ok(js.includes("KIDS_STORY_MODES_V1"),"Missing canonical Salaf mode marker");
assert.ok(js.includes('MODE_KEY="kids.contentMode.v19"'),"Modes must reuse common story preference");
assert.ok(js.includes("btn.disabled=unavailable"),"No dead audio buttons before recording exists");
assert.ok(!js.includes('id="salafPlay"'),"Do not restore separate embedded audio player");
assert.ok(modesCss.includes("KIDS_STORY_MODES_V1"),"Shared mode CSS contract missing");
assert.ok(modesCss.includes('data-salaf-mode="both"'),"Wide primary action CSS missing");
assert.ok(sharedReader.includes('#salafDetail:not([hidden]) > .salaf-detail-scroll'),"Salaf Hören must scroll to the hero first");
assert.ok(doc.includes("KIDS_STORY_MODES_V1"),"Future story-mode contract must be documented");
assert.ok(html.includes("/kids/story-follow-reader.js?v=18-salaf1"),"Reader cache-bust missing");
assert.ok(html.includes("/kids/salaf-library-v1.js?v=1430"),"Salaf mode cache-bust missing");
assert.ok(sw.includes("/kids/story-follow-reader.js?v=18-salaf1"),"Reader offline precache missing");
assert.ok(sw.includes("/kids/salaf-library-v1.js?v=1430"),"Salaf mode offline precache missing");
assert.ok(sw.includes("/kids/salaf-master-v2.css?v=4"),"Shared three-mode stylesheet must be precached");

/* KIDS_SALAF_GIRL_PALETTE_V1415: all girl Salaf surfaces and art are
 * coloured by a final, girls-only stylesheet, not inherited boy blues. */
const girlCss=read("kids/salaf-girl-palette-v1415.css");
assert.ok(girlCss.includes("KIDS_SALAF_GIRL_PALETTE_V1415"),"Girl Salaf palette marker missing");
assert.ok(girlCss.includes('.app[data-gender="girl"]'),"Girl styling must stay profile-scoped");
for(const target of [
  "#view-salaf > .salaf-hero::before",
  "#view-salaf .salaf-topic::after",
  "#view-salaf .salaf-topic-image",
  "#view-salaf .salaf-topic-stage::before",
  "#view-salaf .salaf-topic-stage::after",
  "#view-salaf .salaf-story-art",
  "#salafDetail .salaf-detail-cover",
  "#kidsFollowReader-salaf-library .kfr-sheet",
  "#kidsFollowReader-salaf-library .kfr-read p.active",
  "#kidsFollowReader-salaf-library .kfr-progress > span",
  "> .kids-detail-appbar.kids-portal-appbar"
]){
  assert.ok(girlCss.includes(target),"Missing girls-only Salaf tint: "+target);
}
assert.ok(!girlCss.includes("background-blend-mode:luminosity"),"Do not monochrome girls\u0027 original full-colour story art");
assert.ok(girlCss.includes("KIDS_GIRLS_MULTICOLOR_PALETTE_V1417"),"Girls\u0027 full accent palette missing");
for(const token of ["--sl-rose:","--sl-blush:","--sl-lavender:","--sl-champagne:","--sl-cream:","--sl-mauve:"]){
  assert.ok(girlCss.includes(token),"Missing girls\u0027 profile colour: "+token);
}
const girlHex=[...girlCss.matchAll(/#[a-fA-F0-9]{6}\b/g)].map(m=>m[0]);
for(const hex of girlHex){
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const high=Math.max(r,g,b),low=Math.min(r,g,b),range=high-low;
  let hue=0;
  if(range>.001){
    if(high===r)hue=60*(((g-b)/range+6)%6);
    else if(high===g)hue=60*((b-r)/range+2);
    else hue=60*((r-g)/range+4);
  }
  const sat=high<.001?0:range/high;
  assert.ok(!(hue>=175&&hue<=260&&sat>.12),
    "Blue/teal hex in girls-only Salaf palette: "+hex);
}
/* Hex alone is insufficient: translucent gradients often carry petrol RGB. */
for(const hit of girlCss.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)){
  const [r,g,b]=[1,2,3].map(i=>Number(hit[i])/255);
  const high=Math.max(r,g,b),low=Math.min(r,g,b),range=high-low;
  let hue=0;
  if(range>.001){
    if(high===r)hue=60*(((g-b)/range+6)%6);
    else if(high===g)hue=60*((b-r)/range+2);
    else hue=60*((r-g)/range+4);
  }
  const sat=high<.001?0:range/high;
  assert.ok(!(hue>=175&&hue<=260&&sat>.12),
    "Blue/teal RGB in girls-only Salaf palette: "+hit[0]);
}
assert.ok(js.includes("KIDS_SALAF_GIRL_PALETTE_V1415"),"Girl cover inline gradient guard absent");
assert.ok(js.includes('var coverShade=isGirl?'),"Girl cover must use gender-aware gradient");
assert.ok(!/girl.*#0a202b/.test(js),"Girl hero must not use blue overlay");
/* KIDS_GIRLS_GLOBAL_CANVAS_SEAM_V1416: root rectangles must not return. */
const girlCanvas=read("kids/girls-profile-global-seam-v1416.css");
for(const needle of [
 "KIDS_GIRLS_GLOBAL_CANVAS_SEAM_V1416",
 'html body .app[data-gender="girl"]',
 'html body .app[data-gender="girl"] > .ambient',
 'html body .app[data-gender="girl"] > .shell',
 'background-image:none!important',
 'background-color:#2b2035!important'
]){
  assert.ok(girlCanvas.includes(needle),"Girl root canvas missing: "+needle);
}
assert.ok(!girlCanvas.includes('.app[data-gender="boy"]'),"Girl root seam must not touch boy mode");
assert.ok(!girlCanvas.includes('.kids-follow-reader\n'),"Keep reader overlays translucent");
assert.ok(html.includes("/kids/girls-profile-global-seam-v1416.css?v=1416"),"Girl root CSS must load in HTML");
assert.ok(sw.includes("/kids/girls-profile-global-seam-v1416.css?v=1416"),"Girl root CSS must be offline-cached");
assert.ok(html.indexOf("/kids/girls-profile-global-seam-v1416.css")>
  html.indexOf("/kids/salaf-girl-palette-v1415.css"),"Girl root canvas override must load last");

const girlCssUrl="/kids/salaf-girl-palette-v1415.css?v=1417";
const heroSeamUrl="/kids/global-hero-seam-v1412.css?v=1413";
assert.ok(html.includes(girlCssUrl),"Girl Salaf palette not loaded");
assert.ok(html.indexOf(girlCssUrl)>html.indexOf(heroSeamUrl),"Girl style must load after global seam");
assert.ok(sw.includes(girlCssUrl),"Girl palette not precached for PWA");

// Visitor source details must not show full isnād or web archive notes.
assert.ok(js.includes("KIDS_VISITOR_COMPACT_CITATIONS_V1430"),"Source display must use compact citations");
assert.ok(js.includes("compactSalafReference(s.reference)"),"Salaf reader must never dump full reference");
const content=JSON.parse(read("kids/data/salaf-library-v1.json"));
assert.ok(Array.isArray(content.items));
assert.equal(content.version,2,"Salaf one-master manifest version must be 2");
assert.equal(content.narrationPolicy?.oneMasterStoryForAllAges,true);
assert.equal(content.narrationPolicy?.oneMasterAudioForAllAges,true);
assert.ok(js.includes("i?.masterStoryText"),"Single master story text missing");
assert.ok(js.includes("i?.audioMaster"),"Single master recording missing");
assert.ok(!js.includes("i?.texts?.[age()]"),"Age-separated full stories prohibited");
assert.ok(!js.includes("i?.audio?.[age()]"),"Age-separated audio masters prohibited");
assert.ok(sw.includes("/kids/data/salaf-library-v1.json?v=2"),"Single-master catalog offline cache missing");
console.log("PASS: 8 reviewed assets locked, global pinned detail navigation, category-only overview, edge-to-edge layout and V1400 release IDs.");

/* V1413 regression guards: one continuous profile surface, no extra dock
   spacer, and the CSS remains independently available offline. */
assert.ok(heroSeam.includes("KIDS_SALAF_GLOBAL_SURFACE_AND_SCROLL_V1413"));
assert.ok(heroSeam.includes('html body .app[data-gender="girl"]:has(> .shell > #view-salaf.view.active)'));
assert.ok(heroSeam.includes('html body .app:has(> .shell > #view-salaf.view.active) > .shell'));
assert.ok(heroSeam.includes('scrollbar-width:none!important'));
assert.ok(heroSeam.includes('padding-bottom:0!important'));

/* V1414: Salaf source proof must remain internal. */
assert.ok(js.includes('KIDS_SOURCE_TEXT_ONLY_V1414'));
assert.ok(!js.includes('class="salaf-source-link"'));

/* All Salaf releases must also pass the strict Sunni subject + text gate. */
require("./check-salaf-sunni-editorial-v1.cjs");
require("./check-retired-quran-learning-v1418.cjs");
