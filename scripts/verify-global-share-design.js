#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`missing: ${rel}`);
    return "";
  }
  return fs.readFileSync(abs, "utf8");
}
function requireToken(rel, src, token, label) {
  if (src && !src.includes(token)) failures.push(`${rel}: missing ${label || token}`);
}
function forbidToken(rel, src, token, label) {
  if (src && src.includes(token)) failures.push(`${rel}: forbidden ${label || token}`);
}

const globalRel = "assets/dar-global-share-v1225.js";
const globalShare = read(globalRel);
if (globalShare) {
  requireToken(globalRel, globalShare, "/api/share-image/background", "fresh AI share endpoint");
  requireToken(globalRel, globalShare, "generateFreshBackground", "fresh background generator");
  requireToken(globalRel, globalShare, "adaptiveBodyLayout", "adaptive body typography");
  requireToken(globalRel, globalShare, 'fillText("AUSSAGE"', "AUSSAGE hierarchy");
  requireToken(globalRel, globalShare, 'fillText("QUELLE"', "QUELLE hierarchy");
  if (!/__DAR_GLOBAL_SHARE_V1246=true/.test(globalShare)) failures.push(globalRel + ": singleton/version flag mismatch");
  forbidToken(globalRel, globalShare, "GENERIC_SCENES", "legacy app-image scene pool");
  forbidToken(globalRel, globalShare, "share-background-library", "legacy share-image manifest");
  forbidToken(globalRel, globalShare, "Folgt für mehr Wissen aus Qurʾān & Sunnah", "legacy promo footer");
  forbidToken(globalRel, globalShare, "app-store-badge-de-official.svg", "legacy App Store footer badge");
}

for (const rel of ["assets/premium-feed-app.js", "test/assets/premium-feed-app.js"]) {
  const src = read(rel);
  requireToken(rel, src, "/api/share-image/background", "fresh AI share endpoint");
  requireToken(rel, src, "feedShareFreshImage", "fresh feed-share generator");
  forbidToken(rel, src, "feedShareBrandFooter", "legacy feed promo footer");
  forbidToken(rel, src, "app-store-badge-de-official.svg", "legacy App Store footer badge");
}

const frauenRel = "test/assets/frauen/frauen-fiqh.js";
const frauen = read(frauenRel);
if (frauen) {
  requireToken(frauenRel, frauen, "/api/share-image/background", "fresh AI share endpoint");
  requireToken(frauenRel, frauen, "frauenFreshShareBackground", "fresh Frauen share generator");
  requireToken(frauenRel, frauen, "frauenAdaptiveBodyLayout", "adaptive body typography");
  requireToken(frauenRel, frauen, 'fillText("AUSSAGE"', "AUSSAGE hierarchy");
  requireToken(frauenRel, frauen, 'fillText("QUELLE"', "QUELLE hierarchy");
  forbidToken(frauenRel, frauen, "frauenNextShareScene", "legacy existing-image rotation");
  forbidToken(frauenRel, frauen, 'ctx.fillText("Folgt für mehr Wissen aus Qurʾān & Sunnah"', "legacy promo footer draw");
  forbidToken(frauenRel, frauen, "app-store-badge-de-official.svg", "legacy App Store footer badge");
}

if (failures.length) {
  console.error("Fresh AI share design verification FAILED:");
  failures.forEach((item) => console.error(" - " + item));
  process.exit(1);
}
console.log("Fresh AI share design verification passed.");
