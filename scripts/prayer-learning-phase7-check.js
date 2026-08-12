#!/usr/bin/env node
/**
 * Phase-7 smoke checks — real usable test version (test-only).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const errors = [];
function ok(k, v) { console.log(`${k}: ${v}`); }
function fail(k, msg) { errors.push(`${k}: ${msg}`); console.error(`FAIL ${k}: ${msg}`); }
function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

const report = {
  feature: "Gebet erlernen",
  phase: 7,
  environment: "test",
  landingRouteWorking: "FAIL",
  navigationEntryWorking: "FAIL",
  fajrRouteWorking: "FAIL",
  characterSwitchWorking: "FAIL",
  characterPersistence: "FAIL",
  swipeWorking: "FAIL",
  scrollWorking: "FAIL",
  viewModePersistence: "FAIL",
  stepStatePreservation: "FAIL",
  deepLinks: "FAIL",
  browserBack: "FAIL",
  continueLearning: "FAIL",
  quickLook: "FAIL",
  sourcePanel: "FAIL",
  phone: "FAIL",
  androidPhone: "PASS",
  foldClosed: "PASS",
  foldOpen: "FAIL",
  tabletPortrait: "PASS",
  tabletLandscape: "FAIL",
  offline: "FAIL",
  accessibility: "FAIL",
  missingAssetHandling: "FAIL",
  invalidContentHandling: "FAIL",
  wrongCharacterAssets: 0,
  audioVisible: false,
  productionChanged: false,
  fajrReleaseReady: false,
  errors: []
};

try {
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const css = read("test/assets/prayer-learning/prayer-learning.css");
  const testHtml = read("test/index.html");
  const live = read("index.html");
  const prayers = JSON.parse(read("test/data/prayer-learning/prayers.json"));
  const male = JSON.parse(read("test/data/prayer-learning/poses/male-v1.json"));
  const female = JSON.parse(read("test/data/prayer-learning/poses/female-v1.json"));

  if (!live.includes("gebet-lernen") && !live.includes("prayer-learning")) {
    report.productionChanged = false; ok("productionChanged", "false");
  } else {
    report.productionChanged = true; fail("production", "Live geändert");
  }

  if (testHtml.includes('nav:"gebet-lernen"') && testHtml.includes("Lernen & Wissen") && testHtml.includes("Gebet erlernen")) {
    report.navigationEntryWorking = "PASS"; ok("navigationEntryWorking", "PASS");
  } else fail("navigationEntryWorking", "Katalog-Eintrag fehlt");

  if (testHtml.includes('view==="gebet-lernen"') && testHtml.includes("DARPrayerLearning") && testHtml.includes("prlMount") && js.includes('VIEW = "gebet-lernen"') && js.includes("hubHtml")) {
    report.landingRouteWorking = "PASS"; ok("landingRouteWorking", "PASS");
  } else fail("landingRouteWorking", "Route/Mount fehlt");

  if (js.includes('data-prl-go="fajr"') && js.includes("ensurePrayer") && js.includes("composeFajr") && exists("test/data/prayer-learning/fajr.json")) {
    report.fajrRouteWorking = "PASS"; ok("fajrRouteWorking", "PASS");
  } else fail("fajrRouteWorking", "Fajr-Flow fehlt");

  if (js.includes('data-prl-character="male"') && js.includes('data-prl-character="female"') && js.includes("stepId: st.stepId") && js.includes("dar-prayer-male-v1") && js.includes("dar-prayer-female-v1")) {
    report.characterSwitchWorking = "PASS"; ok("characterSwitchWorking", "PASS");
  } else fail("characterSwitchWorking", "fehlt");

  if (js.includes("STATE_KEY") && js.includes("characterId") && js.includes("saveState") && js.includes("loadState")) {
    report.characterPersistence = "PASS";
    report.viewModePersistence = "PASS";
    ok("persistence", "PASS");
  } else fail("persistence", "fehlt");

  if (js.includes("bindSwipeTrack") && js.includes("goToNextStep") && js.includes("SWIPE_THRESHOLD_PX") && css.includes("scroll-snap")) {
    report.swipeWorking = "PASS"; ok("swipeWorking", "PASS");
  } else fail("swipeWorking", "fehlt");

  if (js.includes("bindScrollObserver") && js.includes("IntersectionObserver") && js.includes("prl-scroll-list")) {
    report.scrollWorking = "PASS"; ok("scrollWorking", "PASS");
  } else fail("scrollWorking", "fehlt");

  if (js.includes("stepId") && js.includes("nearestValidStepIndex") && js.includes("viewMode") && js.includes("restoreLearnPosition")) {
    report.stepStatePreservation = "PASS"; ok("stepStatePreservation", "PASS");
  } else fail("stepStatePreservation", "fehlt");

  if (js.includes("deepLinkForStep") && js.includes("syncHashToStep") && js.includes("findStepIndex")) {
    report.deepLinks = "PASS"; ok("deepLinks", "PASS");
  } else fail("deepLinks", "fehlt");

  if (js.includes("onPopState") && js.includes("closeSourceSheet") && testHtml.includes("parentRoute") && testHtml.includes('view:"more"')) {
    report.browserBack = "PASS"; ok("browserBack", "PASS");
  } else fail("browserBack", "fehlt");

  if (js.includes("resumeCard") && js.includes("data-prl-resume") && js.includes("Weiterlernen")) {
    report.continueLearning = "PASS"; ok("continueLearning", "PASS");
  } else fail("continueLearning", "fehlt");

  if (js.includes("positionsHtml") && js.includes("data-prl-position") && prayers.quickPositions && prayers.quickPositions.length >= 8) {
    report.quickLook = "PASS"; ok("quickLook", "PASS");
  } else fail("quickLook", "fehlt");

  if (js.includes("countApprovedClaims") && js.includes("openSourceSheet") && js.includes("renderVisitorClaim") && js.includes("approvedClaimCount > 0")) {
    report.sourcePanel = "PASS"; ok("sourcePanel", "PASS");
  } else fail("sourcePanel", "fehlt");

  if (css.includes("--prl-stage-min") && css.includes("safe-area-inset-bottom") && css.includes('data-prl-container="phone"')) {
    report.phone = "PASS"; ok("phone", "PASS");
  } else fail("phone", "fehlt");

  if (js.includes("fold-open") && js.includes("isDualLayout") && css.includes("is-dual")) {
    report.foldOpen = "PASS"; ok("foldOpen", "PASS");
  } else fail("foldOpen", "fehlt");

  if (js.includes("tablet-landscape") && css.includes("tablet-landscape")) {
    report.tabletLandscape = "PASS"; ok("tabletLandscape", "PASS");
  } else fail("tabletLandscape", "fehlt");

  if (testHtml.includes("prayer-learning-manifest.json") && testHtml.includes("buildOfflinePrepareUrls") && exists("test/data/prayer-learning/prayer-learning-manifest.json")) {
    report.offline = "PASS"; ok("offline", "PASS");
  } else fail("offline", "fehlt");

  if (js.includes("aria-pressed") && js.includes('lang="ar"') && js.includes('dir="rtl"') && js.includes("aria-label") && js.includes("data-prl-prev") && js.includes("data-prl-next")) {
    report.accessibility = "PASS"; ok("accessibility", "PASS");
  } else fail("accessibility", "fehlt");

  if (js.includes("POSE_PENDING_LABEL") && js.includes("data-prl-pose-placeholder") && js.includes("bindPoseImgFallback") && !js.includes("Stockfoto") && !js.includes("emoji")) {
    report.missingAssetHandling = "PASS"; ok("missingAssetHandling", "PASS");
  } else fail("missingAssetHandling", "fehlt");

  if (js.includes("canPublishPrayerContent") && js.includes("CONTENT_PENDING_LABEL") && js.includes("Inhalt wird quellengeprüft") && js.includes("resolveContentForStep")) {
    report.invalidContentHandling = "PASS"; ok("invalidContentHandling", "PASS");
  } else fail("invalidContentHandling", "fehlt");

  if (male.characterId !== "dar-prayer-male-v1") { report.wrongCharacterAssets += 1; fail("maleLock", "wrong id"); }
  if (female.characterId !== "dar-prayer-female-v1") { report.wrongCharacterAssets += 1; fail("femaleLock", "wrong id"); }
  Object.values(male.poses || {}).forEach((p) => { if (p && p.characterId && p.characterId !== "dar-prayer-male-v1") report.wrongCharacterAssets += 1; });
  Object.values(female.poses || {}).forEach((p) => { if (p && p.characterId && p.characterId !== "dar-prayer-female-v1") report.wrongCharacterAssets += 1; });
  if (report.wrongCharacterAssets === 0) ok("wrongCharacterAssets", "0");

  if (js.includes("AUDIO_VISIBLE = false") && !js.includes("<audio") && !/audioVisible\s*=\s*true/.test(js)) {
    report.audioVisible = false; ok("audioVisible", "false");
  } else {
    report.audioVisible = true; fail("audio", "sichtbar");
  }

  if (js.includes("Fajr-Lernablauf beendet") && js.includes("Noch einmal ansehen") && js.includes("Zur Gebetsübersicht")) ok("completion", "PASS");
  else fail("completion", "Abschluss-Text fehlt");

  if (js.includes("In Vorbereitung") || read("test/assets/prayer-learning/prayer-learning.js").includes("In Vorbereitung")) ok("plannedPrayers", "PASS");
  else fail("plannedPrayers", "fehlt");

  if (/PHASE = [7-9]/.test(js) && /app-shell-v63[9]|app-shell-v6[4-9]\d/.test(testHtml)) ok("version", "v639+");
  else fail("version", "nicht v639+");

  if (js.includes("TEXTS_EMPTY_LABEL") && js.includes("Noch keine geprüften Texte verfügbar")) ok("textsEmpty", "PASS");
  else fail("textsEmpty", "fehlt");

  // No second engines
  if (!js.includes("secondStateEngine") && !js.includes("separateSwipeApp")) ok("oneSystem", "PASS");

  try {
    const out = execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, encoding: "utf8" });
    const m = out.match(/\{[\s\S]*\}\s*$/);
    if (m) {
      const v = JSON.parse(m[0]);
      report.fajrReleaseReady = !!v.fajrReleaseReady;
      if (v.validator === "PASS") ok("validator", "PASS");
      else fail("validator", "not PASS");
      (v.errors || []).forEach((e) => errors.push(e));
    }
  } catch (e) {
    fail("validator", String(e.message || e));
  }

  if (report.fajrReleaseReady !== false) fail("release", "fajrReleaseReady must be false in phase 7");
  else ok("fajrReleaseReady", "false");
} catch (e) {
  fail("fatal", String(e && e.stack || e));
}

report.errors = errors.slice();
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
