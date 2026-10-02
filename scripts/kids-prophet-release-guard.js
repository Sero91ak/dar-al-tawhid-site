#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
let failed = false;

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function size(rel) { return fs.statSync(path.join(ROOT, rel)).size; }
function error(message) {
  failed = true;
  console.error("::error::Kids Prophet release guard: " + message);
}
function requireMatch(text, needle, file) {
  if (!text.includes(needle)) error(file + " fehlt: " + needle);
}
function uniqueMatches(text, re) {
  return [...new Set(text.match(re) || [])];
}

let version;
try {
  version = JSON.parse(read("kids/version.json"));
} catch (err) {
  console.error("::error::Kids Prophet release guard: kids/version.json ungültig: " + err.message);
  process.exit(1);
}

const build = String(version.buildId || "").trim();
const label = String(version.label || "").trim();
const buildMatch = build.match(/^kids-shell-v12-tab(\d+)$/);
if (!buildMatch) {
  console.error("::error::Kids Prophet release guard: ungültige Kids buildId: " + build);
  process.exit(1);
}
const buildNumber = buildMatch[1];

const visual = version.visualSystem || {};
const prophetSystem = String(visual.prophetStories || "");
const visualMatch = prophetSystem.match(/v(\d+)$/);
if (!visualMatch) {
  console.error("::error::Kids Prophet release guard: visualSystem.prophetStories muss mit vNN enden: " + prophetSystem);
  process.exit(1);
}
const assetVersion = visualMatch[1];

const expectedIds = [
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","ishaq","yaqub",
  "yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman",
  "ilyas","alyasa","yunus","zakariyya","yahya","isa","muhammad"
];

function assertOnlyCurrentBuild(rel) {
  const text = read(rel);
  const refs = uniqueMatches(text, /kids-shell-v12-tab\d+/g);
  if (!refs.length) {
    error(rel + " enthält keine Kids buildId");
    return;
  }
  const stale = refs.filter(x => x !== build);
  if (stale.length) error(rel + " enthält fremde/stale buildIds: " + stale.join(", "));
}

for (const rel of ["kids/index.html", "kids/start.html", "kids/shell.html"]) {
  const text = read(rel);
  assertOnlyCurrentBuild(rel);
  requireMatch(text, "/kids/prophet-stories.css?v=" + assetVersion, rel);
  requireMatch(text, "/kids/prophet-stories.js?v=" + assetVersion, rel);
  requireMatch(text, "/kids/sw.js?v=" + buildNumber, rel);
}

const manifest = read("kids/manifest.webmanifest");
assertOnlyCurrentBuild("kids/manifest.webmanifest");
requireMatch(manifest, '"start_url": "/kids/start?kv=' + build + '"', "kids/manifest.webmanifest");

const router = read("cloudflare/site-router.js");
assertOnlyCurrentBuild("cloudflare/site-router.js");
requireMatch(router, 'const KIDS_BUILD = "' + build + '";', "cloudflare/site-router.js");
if (label) requireMatch(router, 'const KIDS_LABEL = "' + label + '";', "cloudflare/site-router.js");

const testWorker = read("cloudflare/test-app-worker.js");
assertOnlyCurrentBuild("cloudflare/test-app-worker.js");
requireMatch(testWorker, 'buildId: "' + build + '"', "cloudflare/test-app-worker.js");
if (label) requireMatch(testWorker, 'label: "' + label + '"', "cloudflare/test-app-worker.js");

const alive = read("kids/v12-alive.txt").trim();
const aliveExpected = [build, label].filter(Boolean).join("\n");
if (alive !== aliveExpected) error("kids/v12-alive.txt stimmt nicht mit kids/version.json überein");

requireMatch(read("_headers"), "X-Kids-Build: " + build, "_headers");

const sw = read("kids/sw.js");
requireMatch(sw, 'const CACHE_NAME="dar-al-tawhid-kids-v' + buildNumber + '";', "kids/sw.js");
requireMatch(sw, "/kids/prophet-stories.css?v=" + assetVersion, "kids/sw.js");
requireMatch(sw, "/kids/prophet-stories.js?v=" + assetVersion, "kids/sw.js");

const prophetJs = read("kids/prophet-stories.js");
requireMatch(prophetJs, '-card.jpg?v=' + assetVersion, "kids/prophet-stories.js");
requireMatch(prophetJs, '-hero.jpg?v=' + assetVersion, "kids/prophet-stories.js");
requireMatch(prophetJs, "const DEDICATED_HERO=new Set(PROPHET_ORDER);", "kids/prophet-stories.js");

for (const id of expectedIds) {
  for (const kind of ["card", "hero"]) {
    const rel = "kids/assets/prophets-v2/" + id + "-" + kind + ".jpg";
    if (!exists(rel)) {
      error("Asset fehlt: " + rel);
      continue;
    }
    if (size(rel) < 50000) error("Asset ist verdächtig klein: " + rel + " (" + size(rel) + " Bytes)");
  }
}

const artDir = path.join(ROOT, "kids/assets/prophets-v2");
if (fs.existsSync(artDir)) {
  const names = fs.readdirSync(artDir);
  const cards = names.filter(x => /-card\.jpg$/.test(x));
  const heroes = names.filter(x => /-hero\.jpg$/.test(x));
  if (cards.length !== 25) error("Erwartet 25 Prophet-Karten, gefunden " + cards.length);
  if (heroes.length !== 25) error("Erwartet 25 Prophet-Heroes, gefunden " + heroes.length);
}

if (Number(visual.individualHighResolutionCards) !== 25) {
  error("visualSystem.individualHighResolutionCards muss 25 sein");
}
if (Number(visual.premiumDetailHeroes) !== 25 && Number(visual.dedicatedHighResolutionHeroes) !== 25) {
  error("visualSystem muss 25 dedizierte Detail-Heroes ausweisen");
}
if (visual.visibleFaces !== false) error("visualSystem.visibleFaces muss false bleiben");

if (failed) process.exit(1);
console.log("Kids Prophet release guard OK:", build, label, "assets v" + assetVersion, "25 Karten + 25 Heroes");
