#!/usr/bin/env node
/**
 * Phase-3 smoke checks: Fajr master + modular engine (test-only).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const errors = [];
function ok(k, v) { console.log(`${k}: ${v}`); }
function fail(k, msg) { errors.push(`${k}: ${msg}`); console.error(`FAIL ${k}: ${msg}`); }
function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }
function readJson(p) { return JSON.parse(read(p)); }
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

const report = {
  feature: "Gebet erlernen",
  phase: 3,
  environment: "test",
  fajrMaster: "FAIL",
  sequenceLength: 0,
  stepTemplates: 0,
  poseReuse: "FAIL",
  maleFemalePoseIds: "FAIL",
  characterLock: "FAIL",
  sourceClaims: "FAIL",
  fiqhVariantsModel: "FAIL",
  assetMetadata: "FAIL",
  assetApprovalProcess: "FAIL",
  swipeUsesCentralData: "FAIL",
  scrollUsesCentralData: "FAIL",
  audioVisible: false,
  productionChanged: false,
  sourceCoverage: null,
  poseStatus: null,
  wrongCharacterAssets: 0,
  errors: []
};

try {
  const live = read("index.html");
  const testHtml = read("test/index.html");
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const fajr = readJson("test/data/prayer-learning/fajr.json");
  const index = readJson("test/data/prayer-learning/index.json");
  const claims = readJson("test/data/prayer-learning/sources/claims.json");
  const registry = readJson("test/data/prayer-learning/assets/poses-registry.json");
  const coverage = readJson("test/data/prayer-learning/audit/fajr-source-coverage.json");
  const poseStatus = readJson("test/data/prayer-learning/audit/pose-status.json");
  const maleChar = readJson("test/data/prayer-learning/characters/male-v1.json");
  const femaleChar = readJson("test/data/prayer-learning/characters/female-v1.json");

  if (!live.includes("gebet-lernen") && !live.includes("prayer-learning.js")) {
    report.productionChanged = false; ok("productionChanged", "false");
  } else {
    report.productionChanged = true; fail("production", "Live geändert");
  }

  if (fajr.id === "fajr" && fajr.rakAhCount === 2 && Array.isArray(fajr.sequence) && fajr.sequence.length === 19 && Array.isArray(fajr.sequenceSteps)) {
    report.fajrMaster = "PASS";
    report.sequenceLength = fajr.sequence.length;
    ok("fajrMaster", "PASS (19)");
  } else fail("fajrMaster", "Master unvollständig");

  const stepFiles = [
    "takbir","qiyam","recitation","ruku","standing-after-ruku","sujud",
    "sitting-between-sujud","standing-next-rakah","tashahhud","taslim"
  ];
  let stepOk = 0;
  stepFiles.forEach((id) => {
    if (exists(`test/data/prayer-learning/steps/${id}.json`)) stepOk++;
    else fail("steps", id + " fehlt");
  });
  report.stepTemplates = stepOk;
  ok("stepTemplates", String(stepOk));

  const rec = readJson("test/data/prayer-learning/steps/recitation.json");
  const sujud = readJson("test/data/prayer-learning/steps/sujud.json");
  if (rec.poseReuseAllowed === true && rec.poseId === "qiyam" && sujud.poseReuseAllowed === true && fajr.sequenceSteps.some(s => s.poseReuseFrom === "sujud")) {
    report.poseReuse = "PASS"; ok("poseReuse", "PASS");
  } else fail("poseReuse", "Reuse fehlt");

  const ruku = readJson("test/data/prayer-learning/steps/ruku.json");
  if (ruku.malePoseId && ruku.femalePoseId && ruku.femalePoseStatus === "pending_review") {
    report.maleFemalePoseIds = "PASS"; ok("maleFemalePoseIds", "PASS");
  } else fail("maleFemalePoseIds", "Pose-IDs fehlen");

  if (maleChar.characterId === "dar-prayer-male-v1" && femaleChar.characterId === "dar-prayer-female-v1" && maleChar.locked && femaleChar.locked) {
    report.characterLock = "PASS"; ok("characterLock", "PASS");
  } else fail("characterLock", "Character lock fehlt");

  if (Array.isArray(claims.claims) && claims.claims.length >= 40 && claims.claims.every(c => c.verificationStatus === "research")) {
    report.sourceClaims = "PASS"; ok("sourceClaims", `PASS (${claims.claims.length})`);
  } else fail("sourceClaims", "Claims unvollständig oder already approved");

  if (ruku.variants && Array.isArray(ruku.variants) && claims.claims[0].variants && "primaryClaimId" in claims.claims[0]) {
    report.fiqhVariantsModel = "PASS"; ok("fiqhVariantsModel", "PASS");
  } else fail("fiqhVariantsModel", "Variantenmodell fehlt");

  const sample = registry.poses.male.ruku;
  if (sample && sample.assetId && sample.characterId === "dar-prayer-male-v1" && sample.visualReview && sample.approved === false && sample.status === "MISSING") {
    report.assetMetadata = "PASS"; ok("assetMetadata", "PASS");
  } else fail("assetMetadata", "Registry-Metadaten fehlen");

  if (sample.visualReview.characterConsistency === false && sample.visualReview.clothing === false && sample.visualReview.poseAccuracy === false && index.engine.productionApprovedAssetsOnly === true) {
    report.assetApprovalProcess = "PASS"; ok("assetApprovalProcess", "PASS");
  } else fail("assetApprovalProcess", "Freigabeprozess fehlt");

  if (js.includes("composeFajr") && js.includes("compose-from-templates") && js.includes("prl-swipe-track")) {
    report.swipeUsesCentralData = "PASS"; ok("swipeUsesCentralData", "PASS");
  } else fail("swipeUsesCentralData", "Compose/Swipe fehlt");

  if (js.includes("composeFajr") && js.includes("prl-scroll-list")) {
    report.scrollUsesCentralData = "PASS"; ok("scrollUsesCentralData", "PASS");
  } else fail("scrollUsesCentralData", "Compose/Scroll fehlt");

  if (js.includes("AUDIO_ENABLED = false") && !/<audio[\s>]/i.test(js)) {
    report.audioVisible = false; ok("audioVisible", "false");
  } else fail("audio", "Audio sichtbar?");

  // no unexpected character images
  let wrong = 0;
  Object.values(registry.poses.male).forEach(p => { if (p.characterId !== "dar-prayer-male-v1") wrong++; });
  Object.values(registry.poses.female).forEach(p => { if (p.characterId !== "dar-prayer-female-v1") wrong++; });
  report.wrongCharacterAssets = wrong;
  ok("wrongCharacterAssets", String(wrong));
  if (wrong) fail("characterAssets", "falsche IDs");

  // compose smoke: sequence steps resolve to templates
  fajr.sequenceSteps.forEach((s) => {
    if (!exists(`test/data/prayer-learning/steps/${s.templateId}.json`)) fail("compose", `template missing for ${s.id}`);
  });
  ok("composeTemplates", "PASS");

  // approved must never appear without sources in templates
  stepFiles.forEach((id) => {
    const st = readJson(`test/data/prayer-learning/steps/${id}.json`);
    if (st.verificationStatus === "approved") fail("approved", id + " already approved");
  });
  ok("noPrematureApproved", "PASS");

  report.sourceCoverage = coverage;
  report.poseStatus = poseStatus;
  ok("sourceCoveragePrepared", coverage.takbir);
  ok("poseStatusPrepared", poseStatus.male.ruku);

  if (testHtml.includes("prayer-learning.js?v=3") && testHtml.includes("app-shell-v635") && testHtml.includes("/test/data/prayer-learning/assets/poses-registry.json")) {
    ok("testWiring", "PASS");
  } else fail("testWiring", "index/offline wiring fehlt");

  require("child_process").execSync("node --check test/assets/prayer-learning/prayer-learning.js", { cwd: ROOT });
  ok("jsSyntax", "PASS");
} catch (e) {
  fail("exception", e.message || String(e));
}

report.errors = errors;
console.log("\nREPORT_JSON=" + JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
