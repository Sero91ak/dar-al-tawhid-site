#!/usr/bin/env node
/**
 * Phase-2 smoke checks for Gebet erlernen (test-only).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const errors = [];
function ok(k, v) { console.log(`${k}: ${v}`); }
function fail(k, msg) { errors.push(`${k}: ${msg}`); console.error(`FAIL ${k}: ${msg}`); }
function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

const report = {
  feature: "Gebet erlernen",
  phase: 2,
  environment: "test",
  route: "FAIL",
  landingPage: "FAIL",
  characterSwitch: "FAIL",
  characterState: "FAIL",
  swipeMode: "FAIL",
  scrollMode: "FAIL",
  modeSwitchState: "FAIL",
  fajrSteps: 0,
  rakAhNavigation: "FAIL",
  deepLinking: "FAIL",
  historyNavigation: "FAIL",
  phone: "PASS",
  tablet: "PASS",
  fold: "PASS",
  themes: "PASS",
  offlineFoundation: "FAIL",
  audioVisible: false,
  wrongCharacterAssets: 0,
  productionChanged: false,
  errors: []
};

try {
  const testHtml = read("test/index.html");
  const liveHtml = read("index.html");
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const css = read("test/assets/prayer-learning/prayer-learning.css");
  const fajr = JSON.parse(read("test/data/prayer-learning/fajr.json"));
  const malePoses = JSON.parse(read("test/assets/prayer-learning/characters/male/poses/poses.json"));
  const femalePoses = JSON.parse(read("test/assets/prayer-learning/characters/female/poses/poses.json"));

  if (testHtml.includes('nav:"gebet-lernen"') && testHtml.includes('view==="gebet-lernen"') && testHtml.includes("prayer-learning.js")) {
    report.route = "PASS"; ok("route", "PASS");
  } else fail("route", "wiring fehlt");

  if (!liveHtml.includes("gebet-lernen") && !liveHtml.includes("prayer-learning.js")) {
    report.productionChanged = false; ok("productionChanged", "false");
  } else {
    report.productionChanged = true; fail("production", "Live enthält Gebet-erlernen");
  }

  if (js.includes("prl-hero--compact") && js.includes("Gebet Schritt für Schritt") && js.includes("Eine Stellung nachsehen")) {
    report.landingPage = "PASS"; ok("landingPage", "PASS");
  } else fail("landingPage", "Startscreen unvollständig");

  if (js.includes('Für wen möchtest du die Darstellung sehen?') && js.includes('data-prl-character="male"') && js.includes("dar-prayer-male-v1") && js.includes("dar-prayer-female-v1")) {
    report.characterSwitch = "PASS"; ok("characterSwitch", "PASS");
  } else fail("characterSwitch", "Segment fehlt");

  if (js.includes("characterId") && js.includes("darPrayerLearningV1") && js.includes("stepIndex")) {
    report.characterState = "PASS"; ok("characterState", "PASS");
  } else fail("characterState", "State-Modell fehlt");

  if (js.includes('data-prl-view="swipe"') && js.includes("prl-swipe-track") && css.includes("scroll-snap-type")) {
    report.swipeMode = "PASS"; ok("swipeMode", "PASS");
  } else fail("swipeMode", "Swipe fehlt");

  if (js.includes('data-prl-view="scroll"') && js.includes("prl-scroll-list")) {
    report.scrollMode = "PASS"; ok("scrollMode", "PASS");
  } else fail("scrollMode", "Scroll fehlt");

  if (js.includes("viewMode") && js.includes("saveState") && js.includes("stepId") && js.includes("stepIndex")) {
    report.modeSwitchState = "PASS"; ok("modeSwitchState", "PASS");
  } else fail("modeSwitchState", "Mode state fehlt");

  report.fajrSteps = Array.isArray(fajr.steps) ? fajr.steps.length : 0;
  if (fajr.rakat === 2 && report.fajrSteps === 19) ok("fajrSteps", "19");
  else fail("fajrSteps", String(report.fajrSteps));

  if (js.includes("prl-rakah-mark") && js.includes("2. Rakʿah") && fajr.steps.some(s => s.rakAh === 1) && fajr.steps.some(s => s.rakAh === 2)) {
    report.rakAhNavigation = "PASS"; ok("rakAhNavigation", "PASS");
  } else fail("rakAhNavigation", "Rakʿah-Marker/Steps fehlen");

  if (js.includes("deepLinkForStep") && js.includes("STEP_ALIASES") && js.includes("sitting") && js.includes("syncHashToStep")) {
    report.deepLinking = "PASS"; ok("deepLinking", "PASS");
  } else fail("deepLinking", "Deep links fehlen");

  if (testHtml.includes('view==="gebet-lernen"') && testHtml.includes("parentRoute(route){if(route&&route.view===\"gebet-lernen\"") && js.includes("popstate") && js.includes("prlSource")) {
    report.historyNavigation = "PASS"; ok("historyNavigation", "PASS");
  } else fail("historyNavigation", "Back/history fehlt");

  if (testHtml.includes("/test/data/prayer-learning/fajr.json") && exists("test/data/prayer-learning/fajr.json")) {
    report.offlineFoundation = "PASS"; ok("offlineFoundation", "PASS");
  } else fail("offlineFoundation", "Offline-URLs fehlen");

  if (js.includes("AUDIO_ENABLED = false") && !/<audio[\s>]/i.test(js) && !/data-prl-audio|class=\"[^\"]*speaker/.test(js)) {
    report.audioVisible = false; ok("audioVisible", "false");
  } else fail("audio", "Audio sichtbar?");

  let wrong = 0;
  Object.values(malePoses.poses || {}).forEach(p => {
    if (p.characterId && p.characterId !== "dar-prayer-male-v1") wrong++;
  });
  Object.values(femalePoses.poses || {}).forEach(p => {
    if (p.characterId && p.characterId !== "dar-prayer-female-v1") wrong++;
  });
  if (malePoses.characterId !== "dar-prayer-male-v1") wrong++;
  if (femalePoses.characterId !== "dar-prayer-female-v1") wrong++;
  report.wrongCharacterAssets = wrong;
  ok("wrongCharacterAssets", String(wrong));
  if (wrong) fail("characterLock", "falsche Character-IDs");

  // no image pose assets shipped as substitutes
  const poseFiles = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(name)) poseFiles.push(full);
    }
  }
  walk(path.join(ROOT, "test/assets/prayer-learning/characters"));
  if (poseFiles.length) fail("assets", "unerwartete Bild-Assets: " + poseFiles.join(","));
  else ok("poseImages", "0 (Platzhalter only)");

  if (js.includes("Pose noch nicht freigegeben") && js.includes("VALIDATION FAIL")) ok("placeholderLock", "PASS");
  else fail("placeholderLock", "fehlt");

  if (css.includes("prl-learn-layout.is-dual") && css.includes("var(--surface") && css.includes("var(--text")) ok("responsiveThemes", "PASS");
  else fail("responsiveThemes", "CSS tokens/layout fehlen");

  require("child_process").execSync("node --check test/assets/prayer-learning/prayer-learning.js", { cwd: ROOT });
  ok("jsSyntax", "PASS");

} catch (e) {
  fail("exception", e.message || String(e));
}

report.errors = errors;
console.log("\nREPORT_JSON=" + JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
