#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const obsoleteShareLibrary = path.join(root, "data/share-background-library.json");
if (fs.existsSync(obsoleteShareLibrary)) {
  failures.push("data/share-background-library.json darf nicht mehr existieren");
}

function file(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    failures.push(rel + " fehlt");
    return "";
  }
  return fs.readFileSync(abs, "utf8");
}
function need(rel, src, token) {
  if (src && !src.includes(token)) failures.push(rel + ": Pflichtstandard fehlt: " + token);
}
function forbid(rel, src, token) {
  if (src && src.includes(token)) failures.push(rel + ": alter Share-Standard noch aktiv: " + token);
}

const globalRel = "assets/dar-global-share-v1225.js";
const globalShare = file(globalRel);
for (const token of ["/api/share-image/background", "generateFreshBackground", "adaptiveBodyLayout", "stripUiLabel", 'fillText("AUSSAGE"', 'fillText("QUELLE"']) {
  need(globalRel, globalShare, token);
}
for (const token of ["GENERIC_SCENES", "share-background-library", "Folgt für mehr Wissen aus Qurʾān & Sunnah", "app-store-badge-de-official.svg"]) {
  forbid(globalRel, globalShare, token);
}

const liveRel = "assets/premium-feed-app.js";
const testRel = "test/assets/premium-feed-app.js";
const liveFeed = file(liveRel);
const testFeed = file(testRel);
for (const [rel, src] of [[liveRel, liveFeed], [testRel, testFeed]]) {
  need(rel, src, "/api/share-image/background");
  need(rel, src, "feedShareFreshImage");
  need(rel, src, "shareFreshPostFeedItem");
  forbid(rel, src, "shareOriginalFeedImage");
  forbid(rel, src, "data-original-image");
  forbid(rel, src, "data-feed-preview-image");
  forbid(rel, src, "feedShareBrandFooter");
}
if (liveFeed && testFeed && liveFeed !== testFeed) failures.push("Live/Test Premium-Feed-Renderer sind nicht identisch");

const frauenRel = "test/assets/frauen/frauen-fiqh.js";
const frauen = file(frauenRel);
for (const token of ["/api/share-image/background", "frauenFreshShareBackground", "frauenAdaptiveBodyLayout", 'fillText("AUSSAGE"', 'fillText("QUELLE"']) {
  need(frauenRel, frauen, token);
}
for (const token of ["frauenNextShareScene", 'ctx.fillText("Folgt für mehr Wissen aus Qurʾān & Sunnah"', "app-store-badge-de-official.svg"]) {
  forbid(frauenRel, frauen, token);
}

const workerRel = "cloudflare/share-image.js";
const worker = file(workerRel);
for (const token of ["completely new, unique", "randomSeed", "Cache-Control", "no people", "no App Store badge"]) {
  need(workerRel, worker, token);
}

if (failures.length) {
  console.error("GLOBAL SHARE STANDARD: FEHLER");
  failures.forEach((msg) => console.error(" - " + msg));
  process.exit(1);
}
console.log("GLOBAL SHARE STANDARD: OK · fresh AI image per share, no reused app artwork, no legacy promo footer.");
