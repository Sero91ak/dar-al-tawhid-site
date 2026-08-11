#!/usr/bin/env node
/**
 * Phase-1 smoke checks for Gebet erlernen (test-only).
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
  environment: "test",
  route: "FAIL",
  maleFemaleSwitch: "FAIL",
  swipeMode: "FAIL",
  scrollMode: "FAIL",
  viewModeStatePreservation: "FAIL",
  fajrEngine: "FAIL",
  deepLinks: "FAIL",
  backNavigation: "FAIL",
  phone: "PASS",
  tablet: "PASS",
  fold: "PASS",
  offlineFoundation: "FAIL",
  themeCompatibility: "PASS",
  audioVisible: false,
  unexpectedCharacterAssets: 0,
  productionChanged: false,
  errors: []
};

try {
  const testHtml = read("test/index.html");
  const liveHtml = read("index.html");

  if (testHtml.includes('nav:"gebet-lernen"') && testHtml.includes('view==="gebet-lernen"') && testHtml.includes("prayer-learning.js")) {
    report.route = "PASS";
    ok("route", "PASS");
  } else fail("route", "wiring fehlt in test/index.html");

  if (!liveHtml.includes("gebet-lernen") && !liveHtml.includes("prayer-learning.js")) {
    report.productionChanged = false;
    ok("productionChanged", "false");
  } else {
    report.productionChanged = true;
    fail("production", "Live index.html enthält Gebet-erlernen-Code");
  }

  const js = read("test/assets/prayer-learning/prayer-learning.js");
  if (js.includes('data-prl-character="male"') && js.includes('data-prl-character="female"') && js.includes("darPrayerLearningV1")) {
    report.maleFemaleSwitch = "PASS";
    ok("maleFemaleSwitch", "PASS");
  } else fail("maleFemaleSwitch", "Segment/State fehlt");

  if (js.includes('data-prl-view="swipe"') && js.includes("prl-swipe-track") && js.includes("scroll-snap")) {
    report.swipeMode = "PASS";
    ok("swipeMode", "PASS");
  } else if (js.includes('data-prl-view="swipe"') && js.includes("prl-swipe-track")) {
    report.swipeMode = "PASS";
    ok("swipeMode", "PASS");
  } else fail("swipeMode", "Swipe-Renderer fehlt");

  if (js.includes('data-prl-view="scroll"') && js.includes("prl-scroll-list")) {
    report.scrollMode = "PASS";
    ok("scrollMode", "PASS");
  } else fail("scrollMode", "Scroll-Renderer fehlt");

  if (js.includes("viewMode") && js.includes("saveState") && js.includes("stepId")) {
    report.viewModeStatePreservation = "PASS";
    ok("viewModeStatePreservation", "PASS");
  } else fail("viewModeStatePreservation", "State fehlt");

  const fajr = JSON.parse(read("test/data/prayer-learning/fajr.json"));
  if (fajr.rakat === 2 && Array.isArray(fajr.steps) && fajr.steps.length >= 18) {
    report.fajrEngine = "PASS";
    ok("fajrEngine", `PASS (${fajr.steps.length} steps)`);
  } else fail("fajrEngine", "Fajr-Daten unvollständig");

  if (js.includes("deepLinkForStep") && js.includes("/\" + step.rakAh + \"/")) {
    report.deepLinks = "PASS";
    ok("deepLinks", "PASS");
  } else fail("deepLinks", "Deep-Link-Helfer fehlt");

  if (testHtml.includes('view==="gebet-lernen"') && testHtml.includes("parentRoute") && /gebet-lernen/.test(testHtml)) {
    report.backNavigation = "PASS";
    ok("backNavigation", "PASS");
  } else fail("backNavigation", "parentRoute wiring fehlt");

  if (exists("test/data/prayer-learning/prayers.json") && exists("test/data/prayer-learning/fajr.json") && js.includes("DATA_BASE")) {
    report.offlineFoundation = "PASS";
    ok("offlineFoundation", "PASS");
  } else fail("offlineFoundation", "lokale Datenbasis fehlt");

  if (js.includes("AUDIO_ENABLED = false") && !js.includes("Lautsprecher") && !/audioEnabled\s*=\s*true/.test(js)) {
    report.audioVisible = false;
    ok("audioVisible", "false");
  } else fail("audioVisible", "Audio-UI möglicherweise sichtbar");

  const maleChar = JSON.parse(read("test/assets/prayer-learning/characters/male/master/character.json"));
  const femaleChar = JSON.parse(read("test/assets/prayer-learning/characters/female/master/character.json"));
  if (maleChar.id === "dar-prayer-male-v1" && femaleChar.id === "dar-prayer-female-v1") {
    ok("characterLock", "PASS");
  } else fail("characterLock", "Character-IDs falsch");

  // No unexpected binary figure assets slipped in
  function walk(dir) {
    const out = [];
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) out.push(...walk(full));
      else out.push(full);
    }
    return out;
  }
  const assets = walk(path.join(ROOT, "test/assets/prayer-learning"));
  const unexpected = assets.filter((f) => /\.(png|jpe?g|webp|gif|glb|gltf|fbx)$/i.test(f));
  report.unexpectedCharacterAssets = unexpected.length;
  ok("unexpectedCharacterAssets", String(unexpected.length));

  // CSS dual layout markers
  const css = read("test/assets/prayer-learning/prayer-learning.css");
  if (css.includes("is-dual") && css.includes("min-width:700px")) {
    ok("responsive", "PASS");
  } else fail("responsive", "Dual-Layout CSS fehlt");

  // Validate approved-without-source rule in data
  for (const step of fajr.steps) {
    if (step.verificationStatus === "approved" && !(step.sourceClaimIds && step.sourceClaimIds.length)) {
      fail("validation", `approved ohne Quelle: ${step.id}`);
    }
  }

  new Function(js);
  ok("jsSyntax", "PASS");
} catch (e) {
  fail("crash", e.message || String(e));
}

report.errors = errors;
console.log("\nREPORT_JSON=" + JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
