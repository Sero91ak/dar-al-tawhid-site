#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
function fail(msg) { console.error("HERO_SCROLL_STANDARD FAIL: " + msg); process.exit(1); }
function ok(msg) { console.log("HERO_SCROLL_STANDARD OK: " + msg); }
const cssPath = "assets/dar-hero-scroll-standard-v1.css";
const css = fs.readFileSync(path.join(root, cssPath), "utf8");
const required = [
  '[data-hero-kind="landing"]',
  '[data-hero-kind="category"]',
  '[data-hero-kind="post"]',
  'data-hero-scroll="sticky"',
  'data-hero-scroll="normal"',
  ".dar-hero-stage",
  ".dar-hero-content",
  ".dar-hero-search",
  ".dar-page-content",
  "background-size:cover",
  "background-repeat:no-repeat"
];
for (const token of required) {
  if (!css.includes(token)) fail(cssPath + " fehlt " + token);
}
if (/frauen-library-hero|touchmove|preventDefault|scrollTo\(0,\s*0\)|width:\s*100vw/.test(css)) {
  fail(cssPath + " greift in den Frauen-Hero ein oder sperrt den Scroll");
}
ok("Vertrag enthält die drei Hero-Typen ohne Frauen-Override");
const frauen = fs.readFileSync(path.join(root, "test/assets/frauen/frauen-authority-v1292.css"), "utf8");
if (!frauen.includes(".frauen-library-hero{") || !frauen.includes("--frauen-hero-img")) {
  fail("Frauen-Hero-Vertrag fehlt in der Test-Autorität");
}
ok("Frauen-Hero bleibt in der bestehenden Autorität");
for (const file of ["index.html", "test/index.html"]) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  if (!html.includes("/assets/dar-hero-scroll-standard-v1.css")) fail(file + " bindet den Hero-Standard nicht ein");
  ok(file + " bindet den Hero-Standard ein");
}


/* DAR_HERO_V1402_CONTRACT: matching visitor/test geometry and no Frauen image loss. */
const visitorResponsive=fs.readFileSync(path.join(root,"assets/adult-responsive-viewport-v1381.css"),"utf8");
const testResponsive=fs.readFileSync(path.join(root,"test/assets/test-global-edge-width-v1372.css"),"utf8");
const marker="/* DAR_ADULT_HERO_COMPACT_STICKY_AXIS_V1402";
const vPart=visitorResponsive.split(marker)[1];
const tPart=testResponsive.split(marker)[1];
if(!vPart||!tPart||vPart.trim()!==tPart.trim()){
 fail("Besucher und Test dürfen keine unterschiedlichen Hero/Sticky-Geometrien ausliefern");
}
for(const token of [
 "position:sticky!important", "background-size:cover,cover,cover!important",
 "min-height:clamp(148px,18svh,210px)!important",
 "top:var(--dar-immersive-hero-height,190px)!important",
 ".search-panel,.search-pro-panel,.main-search,#homeSearchBlock",
 ".frauen-library-hero","@media(min-width:768px)","@media(max-height:540px)"
]){
 if(!vPart.includes(token))fail("Hero v1402 fehlt: "+token);
}
if(/\.frauen-library-hero[^{]*\{[^}]*background-image\s*:/.test(vPart) ||
  /\.frauen-library-hero[^{]*\{[^}]*display\s*:\s*none/.test(vPart)){
 fail("Frauen-Hero-Motiv würde entfernt oder unsichtbar gemacht");
}
if(!css.includes("DAR_RESPONSIVE_HERO_RAIL_V1402") ||
   !css.includes("min-height:var(--dar-hero-smart-category)") ||
   !css.includes("min-height:var(--dar-hero-smart-post)")){
 fail("Future opt-in Hero Standard nicht responsiv");
}
for(const jsPath of [
 "assets/adult-immersive-hero-v1.js",
 "test/assets/adult-immersive-hero-v1.js"
]){
 const js=fs.readFileSync(path.join(root,jsPath),"utf8");
 if(!js.includes("#appView .dua-hub") || !js.includes("stage.appendChild(hero)") ||
    !js.includes("--dar-immersive-hero-height")){
   fail(jsPath+" darf Frauen-Hero nicht verlieren und muss Suche dynamisch messen");
 }
}
ok("Kompakter Hero mit angehefteter Suche, responsive, gleiche Regeln Besucher/Test, Frauen-Hintergrund geschützt");
