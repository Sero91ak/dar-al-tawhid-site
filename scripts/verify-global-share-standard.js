#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

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
  if (src && src.includes(token)) failures.push(rel + ": verbotener Bildbeitrag-Standard aktiv: " + token);
}
function syntax(rel, src) {
  if (!src) return;
  try {
    new Function(src);
  } catch (err) {
    failures.push(rel + ": JavaScript-Syntaxfehler: " + String(err && err.message || err));
  }
}

const obsoleteShareLibrary = path.join(root, "data/share-background-library.json");
if (fs.existsSync(obsoleteShareLibrary)) {
  failures.push("data/share-background-library.json darf nicht mehr existieren");
}

const forbiddenAiModule = path.join(root, "cloudflare/share-image.js");
if (fs.existsSync(forbiddenAiModule)) {
  failures.push("cloudflare/share-image.js darf nicht existieren: KI-Bildgenerierung für Bildbeiträge ist dauerhaft deaktiviert");
}

const globalRel = "assets/dar-global-share-v1225.js";
const globalShare = file(globalRel);
syntax(globalRel, globalShare);
for (const token of [
  "GENERAL_SHARE_IMAGE_POOL",
  "generalPoolBackground",
  "randomIndex",
  "share-pool=v1250",
  "adaptiveBodyLayout",
  "stripUiLabel",
  'fillText("AUSSAGE"',
  'fillText("QUELLE"',
  "[data-image-post-open]",
  "[data-image-dua-open]",
  "[data-image-ayah-open]",
  "[data-image-hadith-open]"
]) need(globalRel, globalShare, token);
for (const token of [
  "/api/share-image/background",
  "generateFreshBackground",
  "fetch(SHARE_IMAGE_API",
  "cloudflare-workers-ai",
  "fal-ai/",
  "GENERIC_SCENES",
  "share-background-library",
  "Folgt für mehr Wissen aus Qurʾān & Sunnah",
  "app-store-badge-de-official.svg"
]) forbid(globalRel, globalShare, token);

const liveRel = "assets/premium-feed-app.js";
const testRel = "test/assets/premium-feed-app.js";
const liveFeed = file(liveRel);
const testFeed = file(testRel);
syntax(liveRel, liveFeed);
syntax(testRel, testFeed);
for (const [rel, src] of [[liveRel, liveFeed], [testRel, testFeed]]) {
  for (const token of [
    "FEED_HISTORICAL_STATIC",
    "feedSharePoolImage",
    "feedShareRandomIndex",
    "share-pool=v1250",
    "shareFreshPostFeedItem"
  ]) need(rel, src, token);
  for (const token of [
    "/api/share-image/background",
    "SHARE_IMAGE_API",
    "feedShareFreshImage",
    "fetch(SHARE_IMAGE_API",
    "shareOriginalFeedImage",
    "data-original-image",
    "data-feed-preview-image",
    "feedShareBrandFooter"
  ]) forbid(rel, src, token);
}
if (liveFeed && testFeed && liveFeed !== testFeed) {
  failures.push("Live/Test Premium-Feed-Renderer sind nicht identisch");
}

const frauenRel = "assets/frauen/frauen-fiqh.js";
const frauen = file(frauenRel);
syntax(frauenRel, frauen);
for (const token of [
  "FRAUEN_SHARE_IMAGE_POOL",
  "frauenRandomPoolBackground",
  "frauenShareRandomIndex",
  "share-pool=v1250",
  'data-frauen-share="image"',
  "frauenAdaptiveBodyLayout",
  'fillText("AUSSAGE"',
  'fillText("QUELLE"'
]) need(frauenRel, frauen, token);
for (const token of [
  "/api/share-image/background",
  "FRAUEN_SHARE_IMAGE_API",
  "frauenFreshShareBackground",
  "fetch(FRAUEN_SHARE_IMAGE_API",
  'profile: "women-historical"',
  "cloudflare-workers-ai",
  "fal-ai/",
  "frauenNextShareScene",
  'ctx.fillText("Folgt für mehr Wissen aus Qurʾān & Sunnah"',
  "app-store-badge-de-official.svg"
]) forbid(frauenRel, frauen, token);

const workerRel = "cloudflare/worker.js";
const worker = file(workerRel);
for (const token of [
  'shareImageMode: "curated-pool-only"',
  "shareImageAi: false",
  'url.pathname === "/api/share-image/background"',
  "KI-Bildgenerierung für Bildbeiträge ist dauerhaft deaktiviert.",
  "}, cors, 410)"
]) need(workerRel, worker, token);
for (const token of [
  "handleShareImageBackground",
  'from "./share-image.js"'
]) forbid(workerRel, worker, token);

if (failures.length) {
  console.error("GLOBAL SHARE STANDARD: FEHLER");
  failures.forEach((msg) => console.error(" - " + msg));
  process.exit(1);
}
console.log("GLOBAL SHARE STANDARD: OK · curated local image pools only · random selection · AI generation disabled.");
