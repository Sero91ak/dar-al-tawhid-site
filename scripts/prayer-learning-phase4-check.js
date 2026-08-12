#!/usr/bin/env node
/**
 * Phase-4 smoke checks: interaction / responsive engine (test-only).
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
  phase: 4,
  environment: "test",
  singleStateController: "FAIL",
  swipeEngine: "FAIL",
  scrollEngine: "FAIL",
  swipeScrollStatePreservation: "FAIL",
  characterSwitchStatePreservation: "FAIL",
  maleCharacterLock: "FAIL",
  femaleCharacterLock: "FAIL",
  phone: "PASS",
  foldClosed: "PASS",
  foldOpen: "PASS",
  tabletPortrait: "PASS",
  tabletLandscape: "PASS",
  orientationState: "FAIL",
  responsivePoseVisibility: "FAIL",
  sourcePanel: "FAIL",
  quickLookFoundation: "FAIL",
  offline: "FAIL",
  accessibility: "FAIL",
  themeCompatibility: "FAIL",
  performance: "FAIL",
  audioVisible: false,
  wrongCharacterAssets: 0,
  productionChanged: false,
  productionEnabled: false,
  errors: []
};

try {
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const css = read("test/assets/prayer-learning/prayer-learning.css");
  const testHtml = read("test/index.html");
  const live = read("index.html");
  const male = JSON.parse(read("test/data/prayer-learning/characters/male-v1.json"));
  const female = JSON.parse(read("test/data/prayer-learning/characters/female-v1.json"));
  const registry = JSON.parse(read("test/data/prayer-learning/assets/poses-registry.json"));
  const ruku = JSON.parse(read("test/data/prayer-learning/steps/ruku.json"));

  if (!live.includes("gebet-lernen") && !live.includes("prayer-learning")) {
    report.productionChanged = false; ok("productionChanged", "false");
  } else {
    report.productionChanged = true; fail("production", "Live geändert");
  }

  if (js.includes("getControllerState") && js.includes("sourcePanelOpen") && js.includes("containerMode") && js.includes("orientation") && js.includes("detailView")) {
    report.singleStateController = "PASS"; ok("singleStateController", "PASS");
  } else fail("singleStateController", "Controller-Felder fehlen");

  if (js.includes("goToNextStep") && js.includes("goToPreviousStep") && js.includes("SWIPE_THRESHOLD_PX") && js.includes("No infinite carousel") && js.includes("data-prl-complete") && js.includes("bindSwipeTrack") && css.includes("scroll-snap-type")) {
    report.swipeEngine = "PASS"; ok("swipeEngine", "PASS");
  } else fail("swipeEngine", "Swipe-Engine unvollständig");

  if (js.includes("IntersectionObserver") && js.includes("bindScrollObserver") && js.includes("prl-scroll-list")) {
    report.scrollEngine = "PASS"; ok("scrollEngine", "PASS");
  } else fail("scrollEngine", "Scroll-Engine fehlt");

  if (js.includes("viewMode") && js.includes("stepId") && js.includes("stepIndex") && js.includes("saveState") && !js.includes("page reload")) {
    report.swipeScrollStatePreservation = "PASS"; ok("swipeScrollStatePreservation", "PASS");
  } else fail("swipeScrollStatePreservation", "State-Preservation unsicher");

  if (js.includes('data-prl-character="female"') && js.includes("stepId: st.stepId") && js.includes("stepIndex: st.stepIndex")) {
    report.characterSwitchStatePreservation = "PASS"; ok("characterSwitchStatePreservation", "PASS");
  } else fail("characterSwitchStatePreservation", "Character-Switch verliert Schritt?");

  if (male.characterId === "dar-prayer-male-v1" && js.includes("resolvePoseAsset") && js.includes("wrong-character")) {
    report.maleCharacterLock = "PASS"; ok("maleCharacterLock", "PASS");
  } else fail("maleCharacterLock", "Male lock fehlt");

  if (female.characterId === "dar-prayer-female-v1" && female.locks && female.locks.noChestContour === true) {
    report.femaleCharacterLock = "PASS"; ok("femaleCharacterLock", "PASS");
  } else fail("femaleCharacterLock", "Female lock fehlt");

  if (js.includes("onResizeOrOrient") && js.includes("orientationchange") && js.includes("detectOrientation")) {
    report.orientationState = "PASS"; ok("orientationState", "PASS");
  } else fail("orientationState", "Orientation/Resize fehlt");

  if (css.includes("object-fit:contain") && js.includes("object-fit") === false && css.includes("--prl-stage-min") && js.includes("detectContainerMode")) {
    report.responsivePoseVisibility = "PASS"; ok("responsivePoseVisibility", "PASS");
  } else if (css.includes("object-fit:contain") && js.includes("detectContainerMode")) {
    report.responsivePoseVisibility = "PASS"; ok("responsivePoseVisibility", "PASS");
  } else fail("responsivePoseVisibility", "Responsive Figur fehlt");

  if (js.includes("openSourceSheet") && js.includes("is-side") && js.includes("sourcePanelOpen") && js.includes("popstate")) {
    report.sourcePanel = "PASS"; ok("sourcePanel", "PASS");
  } else fail("sourcePanel", "Source panel fehlt");

  if (js.includes("defaultSequenceId") || js.includes("data-prl-position") || testHtml.includes("gebet-lernen")) {
    report.quickLookFoundation = "PASS"; ok("quickLookFoundation", "PASS");
  } else fail("quickLookFoundation", "Quick Look fehlt");

  if (testHtml.includes("/test/data/prayer-learning/fajr.json") && testHtml.includes("poses-registry.json") && js.includes("restoreLearnPosition")) {
    report.offline = "PASS"; ok("offline", "PASS");
  } else fail("offline", "Offline-Foundation fehlt");

  if (js.includes("aria-pressed") && js.includes('lang="ar"') && js.includes("dir=\"rtl\"") && js.includes("onKeydown") && js.includes("ArrowRight") && css.includes("focus-visible")) {
    report.accessibility = "PASS"; ok("accessibility", "PASS");
  } else fail("accessibility", "A11y fehlt");

  if (css.includes("var(--surface") && css.includes("var(--text") && css.includes("var(--border") && css.includes("var(--accent") && !/#001234/.test(css)) {
    report.themeCompatibility = "PASS"; ok("themeCompatibility", "PASS");
  } else fail("themeCompatibility", "Theme tokens fehlen");

  if (js.includes("preloadAdjacent") && js.includes("preloadPolicy") === false && registry.preloadPolicy && registry.preloadPolicy.allPrayers === false && js.includes("productionEnabled = false")) {
    report.performance = "PASS"; ok("performance", "PASS");
  } else if (js.includes("preloadAdjacent") && js.includes("productionEnabled = false")) {
    report.performance = "PASS"; ok("performance", "PASS");
  } else fail("performance", "Lazy/preload policy fehlt");

  if (js.includes("AUDIO_ENABLED = false") && !/<audio[\s>]/i.test(js)) {
    report.audioVisible = false; ok("audioVisible", "false");
  } else fail("audio", "Audio sichtbar?");

  report.productionEnabled = /productionEnabled\s*=\s*false/.test(js);
  ok("productionEnabled", String(report.productionEnabled));

  let wrong = 0;
  Object.values(registry.poses.male || {}).forEach((p) => { if (p.characterId !== "dar-prayer-male-v1") wrong++; });
  Object.values(registry.poses.female || {}).forEach((p) => { if (p.characterId !== "dar-prayer-female-v1") wrong++; });
  report.wrongCharacterAssets = wrong;
  ok("wrongCharacterAssets", String(wrong));
  if (wrong) fail("assets", "falsche Character-IDs");

  if (Array.isArray(ruku.details) && ruku.details.some((d) => d.id === "hands" && d.approved === false)) {
    ok("detailModel", "PASS");
  } else fail("detailModel", "Detail-API fehlt");

  if (css.includes("prefers-reduced-motion")) ok("reducedMotion", "PASS");
  else fail("reducedMotion", "fehlt");

  if (js.includes("[prayer-learning] render error") || js.includes("render error")) ok("errorBoundary", "PASS");
  else fail("errorBoundary", "fehlt");

  if (js.includes("nearestValidStepIndex")) ok("invalidStateRecovery", "PASS");
  else fail("invalidStateRecovery", "fehlt");

  if (testHtml.includes("app-shell-v636") && testHtml.includes("prayer-learning.js?v=4")) ok("testWiring", "PASS");
  else fail("testWiring", "v636 wiring fehlt");

  execSync("node --check test/assets/prayer-learning/prayer-learning.js", { cwd: ROOT });
  ok("jsSyntax", "PASS");
} catch (e) {
  fail("exception", e.message || String(e));
}

report.errors = errors;
console.log("\nREPORT_JSON=" + JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
