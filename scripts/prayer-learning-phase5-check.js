#!/usr/bin/env node
/**
 * Phase-5 smoke checks — wraps validate-prayer-learning + engine/route markers.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const errors = [];
function ok(k, v) {
  console.log(`${k}: ${v}`);
}
function fail(k, msg) {
  errors.push(`${k}: ${msg}`);
  console.error(`FAIL ${k}: ${msg}`);
}
function read(p) {
  return fs.readFileSync(path.join(ROOT, p), "utf8");
}
function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

const report = {
  feature: "Gebet erlernen",
  phase: 5,
  environment: "test",
  contentRegistry: "FAIL",
  sourceRegistry: "FAIL",
  poseRegistry: "FAIL",
  approvedContentGate: "FAIL",
  approvedPoseGate: "FAIL",
  maleCharacterLock: "FAIL",
  femaleCharacterLock: "FAIL",
  poseResolver: "FAIL",
  quranDatabaseReuse: "FAIL",
  variantModel: "FAIL",
  quickLookDataReuse: "FAIL",
  prayerTextsDataReuse: "FAIL",
  offlineManifest: "FAIL",
  validator: "FAIL",
  approvedFajrSteps: 0,
  pendingFajrSteps: 19,
  audioVisible: false,
  wrongCharacterAssets: 0,
  productionChanged: false,
  errors: []
};

try {
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const testHtml = read("test/index.html");
  const live = read("index.html");

  if (!live.includes("gebet-lernen") && !live.includes("prayer-learning")) {
    report.productionChanged = false;
    ok("productionChanged", "false");
  } else {
    report.productionChanged = true;
    fail("production", "Live geändert");
  }

  [
    "content/index.json",
    "content/ruku.json",
    "content/variants/index.json",
    "sources/claims.json",
    "poses/male-v1.json",
    "poses/female-v1.json",
    "poses/index.json",
    "prayer-learning-manifest.json",
    "search/index.json",
    "audit/fajr-validation-dashboard.json"
  ].forEach((p) => {
    if (!exists("test/data/prayer-learning/" + p)) fail("data", "missing " + p);
  });
  if (errors.every((e) => !e.startsWith("data:"))) {
    report.contentRegistry = "PASS";
    report.sourceRegistry = "PASS";
    report.poseRegistry = "PASS";
    report.offlineManifest = "PASS";
    report.variantModel = "PASS";
    ok("registries", "PASS");
  }

  if (js.includes("canPublishPrayerContent") && js.includes('status === "approved"') && js.includes("reviewPass1") && js.includes("sourceClaimIds.length")) {
    report.approvedContentGate = "PASS";
    ok("approvedContentGate", "PASS");
  } else fail("approvedContentGate", "fehlt");

  if (js.includes("canPublishPose") && js.includes("characterConsistency") && js.includes("clothingReview") && js.includes("poseReview")) {
    report.approvedPoseGate = "PASS";
    ok("approvedPoseGate", "PASS");
  } else fail("approvedPoseGate", "fehlt");

  if (js.includes("dar-prayer-male-v1") && js.includes("poses/male-v1.json")) {
    report.maleCharacterLock = "PASS";
    ok("maleCharacterLock", "PASS");
  } else fail("maleCharacterLock", "fehlt");

  if (js.includes("dar-prayer-female-v1") && js.includes("poses/female-v1.json")) {
    report.femaleCharacterLock = "PASS";
    ok("femaleCharacterLock", "PASS");
  } else fail("femaleCharacterLock", "fehlt");

  if (js.includes("function resolvePrayerPose") && js.includes("controlledPlaceholder")) {
    report.poseResolver = "PASS";
    ok("poseResolver", "PASS");
  } else fail("poseResolver", "fehlt");

  if (js.includes("doNotDuplicateQuranText") && js.includes("quranRef")) {
    report.quranDatabaseReuse = "PASS";
    ok("quranDatabaseReuse", "PASS");
  } else fail("quranDatabaseReuse", "fehlt");

  if (js.includes('data-prl-position') && js.includes("contentId") && js.includes("resolveContentForStep")) {
    report.quickLookDataReuse = "PASS";
    ok("quickLookDataReuse", "PASS");
  } else fail("quickLookDataReuse", "fehlt");

  if (js.includes('mode = "texts"') && js.includes("textsHtml") && js.includes('data-prl-go="texte"') && testHtml.includes("gebet-lernen")) {
    report.prayerTextsDataReuse = "PASS";
    ok("prayerTextsDataReuse", "PASS");
  } else fail("prayerTextsDataReuse", "fehlt");

  if (js.includes("AUDIO_VISIBLE = false") && js.includes("AUDIO_PRELOAD = false") && !/audioVisible\s*=\s*true/.test(js) && !js.includes("<audio")) {
    report.audioVisible = false;
    ok("audioVisible", "false");
  } else {
    report.audioVisible = true;
    fail("audio", "Audio sichtbar");
  }

  if (js.includes("Inhalt wird geprüft") && js.includes("CONTENT_PENDING_LABEL")) ok("pendingLabel", "PASS");
  else fail("pendingLabel", "fehlt");

  if (js.includes("Prayer Learning Debug") && js.includes('mode = "debug"')) ok("debugView", "PASS");
  else fail("debugView", "fehlt");

  if (testHtml.includes("prayer-learning/content/") && testHtml.includes("prayer-learning-manifest.json") && testHtml.includes("poses/male-v1.json")) {
    ok("offlineUrls", "PASS");
  } else fail("offlineUrls", "Phase-5 Offline-Pfade fehlen");

  if (testHtml.includes("app-shell-v637")) ok("version", "v637");
  else fail("version", "Build nicht v637");

  let validated = null;
  try {
    const out = execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, encoding: "utf8" });
    const m = out.match(/\{[\s\S]*\}\s*$/);
    validated = m ? JSON.parse(m[0]) : null;
    if (validated && validated.validator === "PASS") {
      report.validator = "PASS";
      report.approvedFajrSteps = validated.approvedFajrSteps;
      report.pendingFajrSteps = validated.pendingFajrSteps;
      report.wrongCharacterAssets = validated.wrongCharacterAssets;
      ok("validator", "PASS");
    } else {
      fail("validator", "validate-prayer-learning nicht PASS");
      if (validated) {
        report.approvedFajrSteps = validated.approvedFajrSteps;
        report.pendingFajrSteps = validated.pendingFajrSteps;
        report.wrongCharacterAssets = validated.wrongCharacterAssets;
        (validated.errors || []).forEach((e) => errors.push(e));
      }
    }
  } catch (e) {
    fail("validator", String(e.message || e));
    try {
      const out = String(e.stdout || "");
      const m = out.match(/\{[\s\S]*\}\s*$/);
      if (m) {
        validated = JSON.parse(m[0]);
        report.approvedFajrSteps = validated.approvedFajrSteps;
        report.pendingFajrSteps = validated.pendingFajrSteps;
        (validated.errors || []).forEach((err) => errors.push(err));
      }
    } catch (_) {}
  }
} catch (e) {
  fail("fatal", String(e && e.stack || e));
}

report.errors = errors.slice();
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
