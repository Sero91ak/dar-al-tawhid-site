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
const navigation=read("kids/navigation-v1182.js");
const doc=read("kids/KIDS-DESIGN.md");
const sw=read("kids/sw.js");
const html=read("kids/index.html");
const id="kids-shell-v201-dua-v4-1306-listen-scroll-v18-salaf-visible-v1410";
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
assert.ok(doc.includes("KIDS_GLOBAL_STATUS_SAFE_AREA_V1410"),"Canonical documentation for status area missing");

assert.ok(css.includes("margin-inline:calc(50% - 50vw)!important"),"Full-bleed wrapper required");
assert.ok(css.includes("justify-content:flex-end!important"),"Stage heading must be bottom-aligned");
for(const p of ["kids/index.html","kids/shell.html","kids/start.html"]){
  assert.equal(read(p),html,"Kids HTML entrypoints must be identical");
  assert.ok(html.includes("salaf-library-v1.js?v=1410"),"JS cache bust missing");
  assert.ok(html.includes("global-detail-dock-v1247.css?v=1410"),"Global style contract must be current");
  assert.ok(html.includes("global-detail-dock-v1247.js?v=1410"),"Pinned global header runtime cache-bust missing");
  assert.ok(html.includes("navigation-v1182.js?v=1410"),"Navigation history refresh missing");
  assert.ok(html.includes("salaf-open-world-v1353.css?v=1410"),"CSS cache bust missing");
}
for(const p of ["kids/version.json","kids/manifest.webmanifest",
 "kids/v12-alive.txt","cloudflare/site-router.js",
 "cloudflare/test-app-worker.js","_headers"]){
 assert.ok(read(p).includes(id),`Build mismatch ${p}`);
}
assert.ok(sw.includes(id)&&sw.includes("dar-al-tawhid-kids-v1410"));
assert.ok(sw.includes("/kids/global-detail-dock-v1247.css?v=1410"));
assert.ok(sw.includes("/kids/global-detail-dock-v1247.js?v=1410"));
assert.ok(sw.includes("/kids/navigation-v1182.js?v=1410"));
assert.ok(sw.includes("/kids/salaf-library-v1.js?v=1410"));
assert.ok(sw.includes("/kids/salaf-open-world-v1353.css?v=1410"));
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
