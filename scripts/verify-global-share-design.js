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
  requireToken(globalRel, globalShare, "GENERAL_SHARE_IMAGE_POOL", "curated general image pool");
  requireToken(globalRel, globalShare, "generalPoolBackground", "random curated background loader");
  requireToken(globalRel, globalShare, "randomIndex", "random pool selection");
  requireToken(globalRel, globalShare, "adaptiveBodyLayout", "adaptive body typography");
  requireToken(globalRel, globalShare, 'fillText("AUSSAGE"', "AUSSAGE hierarchy");
  requireToken(globalRel, globalShare, 'fillText("QUELLE"', "QUELLE hierarchy");
  if (!/__DAR_GLOBAL_SHARE_V1250=true/.test(globalShare)) failures.push(globalRel + ": singleton/version flag mismatch");
  forbidToken(globalRel, globalShare, "/api/share-image/background", "AI share endpoint");
  forbidToken(globalRel, globalShare, "generateFreshBackground", "AI background generator");
  forbidToken(globalRel, globalShare, "GENERIC_SCENES", "legacy app-image scene pool");
  forbidToken(globalRel, globalShare, "share-background-library", "legacy share-image manifest");
  forbidToken(globalRel, globalShare, "Folgt für mehr Wissen aus Qurʾān & Sunnah", "legacy promo footer");
  forbidToken(globalRel, globalShare, "app-store-badge-de-official.svg", "legacy App Store footer badge");
}

for (const rel of ["assets/premium-feed-app.js", "test/assets/premium-feed-app.js"]) {
  const src = read(rel);
  requireToken(rel, src, "FEED_HISTORICAL_STATIC", "curated feed image pool");
  requireToken(rel, src, "feedSharePoolImage", "random feed pool loader");
  requireToken(rel, src, "feedShareRandomIndex", "random feed pool selection");
  requireToken(rel, src, "shareFreshPostFeedItem", "post-feed share renderer");
  forbidToken(rel, src, "/api/share-image/background", "AI share endpoint");
  forbidToken(rel, src, "SHARE_IMAGE_API", "AI share API variable");
  forbidToken(rel, src, "feedShareFreshImage", "AI feed generator");
  forbidToken(rel, src, "shareOriginalFeedImage", "direct reuse of linked post image");
  forbidToken(rel, src, "data-original-image", "linked original image passed into share action");
  forbidToken(rel, src, "data-feed-preview-image", "linked preview image passed into share action");
  forbidToken(rel, src, "feedShareBrandFooter", "legacy feed promo footer");
  forbidToken(rel, src, "app-store-badge-de-official.svg", "legacy App Store footer badge");
}

const frauenRel = "assets/frauen/frauen-fiqh.js";
const frauen = read(frauenRel);
if (frauen) {
  requireToken(frauenRel, frauen, "FRAUEN_SHARE_IMAGE_POOL", "separate curated women image pool");
  requireToken(frauenRel, frauen, "frauenRandomPoolBackground", "random women pool loader");
  requireToken(frauenRel, frauen, "frauenShareRandomIndex", "random women pool selection");
  requireToken(frauenRel, frauen, "frauenAdaptiveBodyLayout", "adaptive body typography");
  requireToken(frauenRel, frauen, 'fillText("AUSSAGE"', "AUSSAGE hierarchy");
  requireToken(frauenRel, frauen, 'fillText("QUELLE"', "QUELLE hierarchy");
  forbidToken(frauenRel, frauen, "/api/share-image/background", "AI share endpoint");
  forbidToken(frauenRel, frauen, "FRAUEN_SHARE_IMAGE_API", "AI women share API variable");
  forbidToken(frauenRel, frauen, "frauenFreshShareBackground", "AI women generator");
  forbidToken(frauenRel, frauen, "frauenNextShareScene", "legacy existing-image rotation");
  forbidToken(frauenRel, frauen, 'ctx.fillText("Folgt für mehr Wissen aus Qurʾān & Sunnah"', "legacy promo footer draw");
  forbidToken(frauenRel, frauen, "app-store-badge-de-official.svg", "legacy App Store footer badge");
}

if (failures.length) {
  console.error("Curated Bildbeitrag design verification FAILED:");
  failures.forEach((item) => console.error(" - " + item));
  process.exit(1);
}
console.log("Curated Bildbeitrag design verification passed · AI disabled · random local pools only.");
