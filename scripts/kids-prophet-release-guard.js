#!/usr/bin/env node
"use strict";
// V1.06 redeploy trigger after explicit rollback scope unlock

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
function assertMasterStory(item, id, group, minimumWords = 0) {
  const scripts = item && item.scripts && typeof item.scripts === "object" ? item.scripts : {};
  const values = ["4-5","6-8","9-10"].map(age => String(scripts[age] || "").trim());
  if (values.some(v => !v)) {
    error(group + " " + id + " muss für alle Altersstufen denselben vollständigen Mastertext besitzen");
    return;
  }
  if (new Set(values).size !== 1) error(group + " " + id + " enthält gekürzte oder abweichende Altersfassungen");
  const explicitMaster = String(item && item.masterStoryText || "").trim();
  if (explicitMaster && values.some(v => v !== explicitMaster)) error(group + " " + id + " weicht vom Voice-Mastertext ab");
  if (minimumWords > 0) {
    const words = (values[0].match(/\S+/g) || []).length;
    if (words < minimumWords) error(group + " " + id + " ist mit " + words + " Wörtern zu kurz; mindestens " + minimumWords + " Wörter erforderlich");
  }
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
const buildMatch = build.match(/^kids-shell-v(\d+)-([a-z][a-z0-9-]*?)(\d+)$/);
if (!buildMatch) {
  console.error("::error::Kids Prophet release guard: ungültige Kids buildId: " + build);
  process.exit(1);
}
const buildMajor = buildMatch[1];
const buildTrack = buildMatch[2];
const buildNumber = buildMatch[3];

const visual = version.visualSystem || {};
const prophetSystem = String(visual.prophetStories || "");
const visualMatch = prophetSystem.match(/v(\d+)$/);
if (!visualMatch) {
  console.error("::error::Kids Prophet release guard: visualSystem.prophetStories muss mit vNN enden: " + prophetSystem);
  process.exit(1);
}
const assetVersion = visualMatch[1];
const prophetBundleVersion = String(Number(visual.prophetStoriesBundleVersion || 0) || assetVersion);

// V1.06 ist ein historischer, damals veröffentlichter Snapshot. Seine sichtbare
// Release-ID blieb tab106, während die intern cache-gebusteten Story-/SW-Dateien
// bereits v31/v117 trugen. Beim exakten Rollback darf der Guard diesen bekannten
// Snapshot nicht auf heutige 1:1-Versionierung umschreiben.
const exactV106Snapshot = build === "kids-shell-v12-tab106" && label === "KIDS · V1.06";
const htmlCssVersion = exactV106Snapshot ? "21" : prophetBundleVersion;
const htmlJsVersion = exactV106Snapshot ? "31" : prophetBundleVersion;
const swVersion = exactV106Snapshot ? "117" : buildNumber;
const prophetArtVersion = exactV106Snapshot ? "21" : assetVersion;

const expectedIds = [
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","ishaq","yaqub",
  "yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman",
  "ilyas","alyasa","yunus","zakariyya","yahya","isa","muhammad"
];

const expectedMubashshirunIds = [
  "abu-bakr","umar","uthman","ali","talha","zubayr","abd-ar-rahman","sad","said","abu-ubaydah"
];
const mubBundleVersion = String(Number(visual.mubashshirunBundleVersion || 0) || "");
const mubDataVersion = Number(visual.mubashshirunDataVersion || 0);
const expectedSahabiyyatIds = [
  "khadijah","aishah","fatimah","umm-salamah","hafsah","sawdah","zaynab",
  "asma","umm-sulaym","umm-atiyyah","umm-habibah","juwayriyyah","safiyyah","maymunah"
];
const sahabiyyatCssVersion = String(Number(visual.sahabiyyatCssVersion || visual.sahabiyyatBundleVersion || 0) || "");
const sahabiyyatJsVersion = String(Number(visual.sahabiyyatJsVersion || 0) || "");


function assertOnlyCurrentBuild(rel) {
  const text = read(rel);
  const refs = uniqueMatches(text, /kids-shell-v\d+-[a-z][a-z0-9-]*\d+/g);
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
  requireMatch(text, "/kids/prophet-stories.css?v=" + htmlCssVersion, rel);
  requireMatch(text, "/kids/prophet-stories.js?v=" + htmlJsVersion, rel);
  requireMatch(text, "/kids/sw.js?v=" + swVersion, rel);
  requireMatch(text, "/kids/story-policy.js?v=" + String(Number(visual.storyPolicyVersion || 0)), rel);
  if (mubBundleVersion) {
    requireMatch(text, "/kids/mubashshirun-stories.css?v=" + mubBundleVersion, rel);
    requireMatch(text, "/kids/mubashshirun-stories.js?v=" + mubBundleVersion, rel);
  }
  if (visual.sahabiyyatOwnLibrary) {
    if (!sahabiyyatCssVersion || !sahabiyyatJsVersion) error("Ṣaḥābiyyāt CSS/JS Versionsmarker fehlen in visualSystem");
    if (sahabiyyatCssVersion) requireMatch(text, "/kids/sahabiyyat-stories.css?v=" + sahabiyyatCssVersion, rel);
    if (sahabiyyatJsVersion) requireMatch(text, "/kids/sahabiyyat-stories.js?v=" + sahabiyyatJsVersion, rel);
    requireMatch(text, 'id="syEntry"', rel);
    requireMatch(text, 'class="stories-world-head stories-hero"', rel);
    requireMatch(text, 'id="storiesHeroTitle"', rel);
    if (text.includes('class="stories-area-jump"') || text.includes('data-story-area=')) {
      error(rel + " enthält wieder die entfernte Geschichten-Kapselnavigation");
    }
  }
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
requireMatch(sw, 'const CACHE_NAME="dar-al-tawhid-kids-v' + swVersion + '";', "kids/sw.js");
requireMatch(sw, "/kids/prophet-stories.css?v=" + htmlCssVersion, "kids/sw.js");
requireMatch(sw, "/kids/story-policy.js?v=" + String(Number(visual.storyPolicyVersion || 0)), "kids/sw.js");
requireMatch(sw, "/kids/prophet-stories.js?v=" + htmlJsVersion, "kids/sw.js");
if (mubBundleVersion) {
  requireMatch(sw, "/kids/mubashshirun-stories.css?v=" + mubBundleVersion, "kids/sw.js");
  requireMatch(sw, "/kids/mubashshirun-stories.js?v=" + mubBundleVersion, "kids/sw.js");
  requireMatch(sw, "/kids/data/mubashshirun-stories.json", "kids/sw.js");
}
if (visual.sahabiyyatOwnLibrary) {
  if (sahabiyyatCssVersion) requireMatch(sw, "/kids/sahabiyyat-stories.css?v=" + sahabiyyatCssVersion, "kids/sw.js");
  if (sahabiyyatJsVersion) requireMatch(sw, "/kids/sahabiyyat-stories.js?v=" + sahabiyyatJsVersion, "kids/sw.js");
  requireMatch(sw, "/kids/data/sahabiyyat-stories.json", "kids/sw.js");
  requireMatch(sw, 'event.respondWith(networkFirst(request,"/kids/start"))', "kids/sw.js");
}

const prophetJs = read("kids/prophet-stories.js");
const prophetData = JSON.parse(read("kids/data/prophet-stories.json"));
for (const item of (Array.isArray(prophetData.items) ? prophetData.items : [])) assertMasterStory(item, String(item.id || ""), "Propheten");
const storyRegistry = JSON.parse(read("kids/data/story-hub.json"));
if (storyRegistry.policy?.masterStoryTextAcrossAges !== true || storyRegistry.policy?.storyTextAgeAdaptive !== false) {
  error("Story-Hub Mastertext-Policy fehlt oder erlaubt gekürzte Altersfassungen");
}
for (const source of (Array.isArray(storyRegistry.sources) ? storyRegistry.sources : [])) {
  const raw = String(source.dataUrl || "").split("?")[0].replace(/^\//, "");
  if (!raw || !exists(raw)) continue;
  try {
    const payload = JSON.parse(read(raw));
    for (const item of (Array.isArray(payload.items) ? payload.items : [])) {
      if (item && item.scripts) assertMasterStory(item, String(item.id || ""), String(source.title || source.id || "Story"));
    }
  } catch (err) {
    error("Story-Quelle kann für Mastertext-Regel nicht geprüft werden: " + raw + " · " + err.message);
  }
}
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

if (mubDataVersion) {
  let mub;
  try {
    mub = JSON.parse(read("kids/data/mubashshirun-stories.json"));
  } catch (err) {
    error("Mubaschschirūn-Daten ungültig: " + err.message);
  }
  if (mub) {
    if (Number(mub.version || 0) !== mubDataVersion) {
      error("Mubaschschirūn-Datenversion stimmt nicht mit visualSystem überein");
    }
    const rows = Array.isArray(mub.items) ? mub.items : [];
    if (rows.length !== 10) error("Erwartet 10 Mubaschschirūn-Geschichten, gefunden " + rows.length);
    const ids = rows.map(x => String(x && x.id || ""));
    for (const id of expectedMubashshirunIds) {
      if (!ids.includes(id)) error("Mubaschschirūn-Geschichte fehlt: " + id);
      const item = rows.find(x => String(x && x.id || "") === id) || {};
      for (const age of ["4-5","6-8","9-10"]) {
        if (!String((item.scripts || {})[age] || "").trim()) error(id + " Text fehlt für Alter " + age);
      }
      assertMasterStory(item, id, "Ṣaḥābah");
      const rel = "kids/assets/sahaba-mubashshirun/" + id + ".jpg";
      if (!exists(rel)) error("Ṣaḥābah-Asset fehlt: " + rel);
      else if (size(rel) < 50000) error("Ṣaḥābah-Asset ist verdächtig klein: " + rel + " (" + size(rel) + " Bytes)");
    }
  }
}


if (visual.sahabiyyatOwnLibrary) {
  let sy;
  try {
    sy = JSON.parse(read("kids/data/sahabiyyat-stories.json"));
  } catch (err) {
    error("Ṣaḥābiyyāt-Daten ungültig: " + err.message);
  }
  if (sy) {
    const rows = Array.isArray(sy.items) ? sy.items : [];
    if (rows.length !== 14) error("Erwartet 14 Ṣaḥābiyyāt-Geschichten, gefunden " + rows.length);
    const ids = rows.map(x => String(x && x.id || ""));
    for (const id of expectedSahabiyyatIds) {
      if (!ids.includes(id)) {
        error("Ṣaḥābiyyāt-Geschichte fehlt: " + id);
        continue;
      }
      const item = rows.find(x => String(x && x.id || "") === id) || {};
      for (const age of ["4-5","6-8","9-10"]) {
        if (!String((item.scripts || {})[age] || "").trim()) error(id + " Ṣaḥābiyyāt-Text fehlt für Alter " + age);
      }
      assertMasterStory(item, id, "Ṣaḥābiyyāt", Number(sy.storyPolicy?.minimumMasterWords || 850));
      if (!Array.isArray(item.sourceRefs) || !item.sourceRefs.length) error(id + " Ṣaḥābiyyāt-Quellen fehlen");
      if (!String(item.cover || "").trim()) error(id + " Ṣaḥābiyyāt-Bild fehlt");
    }
  }
}

const sahabiyyatJs = read("kids/sahabiyyat-stories.js");
const storyHubJs = read("kids/story-hub.js");
if (sahabiyyatJs.includes("sy-image-name")) error("Ṣaḥābiyyāt Kartenname darf nicht doppelt im Bild stehen");
if (sahabiyyatJs.includes("syHeroName")) error("Ṣaḥābiyyāt Detailansicht darf den Namen nicht doppelt im Hero zeigen");
if (storyHubJs.includes("gh-story-art-name")) error("Story-Hub Kartenname darf nicht doppelt im Bild stehen");
if (storyHubJs.includes("ghPlayerImageName")) error("Universal-Player darf den Namen nicht doppelt im Hero zeigen");
if (failed) process.exit(1);
console.log("Kids release guard OK:", build, label, exactV106Snapshot ? "exact-v106-legacy-snapshot" : ("assets v" + assetVersion), "25 Propheten-Karten + 10 Ṣaḥābah + 14 Ṣaḥābiyyāt");
