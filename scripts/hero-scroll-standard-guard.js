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
