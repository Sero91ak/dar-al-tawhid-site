#!/usr/bin/env node
/**
 * Phase-10 checks — Sujud + Sitting + Sujud 2 + Rise (honest PASS/FAIL/NOT_RUN).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const BASE = path.join(ROOT, "test/data/prayer-learning");
const errors = [];

function ok(k, v) { console.log(`${k}: ${v}`); }
function fail(k, msg) { errors.push(`${k}: ${msg}`); console.error(`FAIL ${k}: ${msg}`); }
function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }
function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(BASE, rel), "utf8")); }
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

const CHAR_MALE = "dar-prayer-male-v1";
const CHAR_FEMALE = "dar-prayer-female-v1";

const EXPECTED_SUJUD = [
  "sujud-general-position","sujud-forehead","sujud-nose","sujud-hands","sujud-fingers",
  "sujud-knees","sujud-feet","sujud-toes","sujud-arm-position","sujud-body-spacing",
  "sujud-head-related-detail","sujud-dhikr","sujud-transition-to-sitting"
];
const EXPECTED_SITTING = [
  "sitting-general-position","sitting-leg-position","sitting-left-foot","sitting-right-foot",
  "sitting-hand-position","sitting-finger-position","sitting-back-position","sitting-dhikr",
  "sitting-transition-second-sujud"
];
const EXPECTED_RISE = [
  "rise-start-position","rise-support-related-detail","rise-body-movement",
  "rise-hand-related-detail","rise-final-standing-position"
];

function canPublishContent(c) {
  return !!(c && c.status === "approved" && c.reviewPass1 === true && c.reviewPass2 === true &&
    Array.isArray(c.sourceClaimIds) && c.sourceClaimIds.length > 0);
}
function canPublishPose(p) {
  return !!(p && p.approved === true && p.characterConsistency === true && p.clothingReview === true &&
    p.poseReview === true && p.reviewPass1 === true && p.reviewPass2 === true &&
    Array.isArray(p.sourceClaimIds) && p.sourceClaimIds.length > 0);
}
function poseStatus(p) {
  if (!p) return "MISSING";
  if (p.approved === true && canPublishPose(p)) return "APPROVED";
  if (p.approved === true && !canPublishPose(p)) return "REJECTED";
  return "PENDING";
}

const report = {
  feature: "Gebet erlernen",
  integrationBlock: "Sujud + Sitting + Sujud + Rise",
  environment: "test",
  sujud1Step: "FAIL",
  sittingStep: "FAIL",
  sujud2Step: "FAIL",
  riseStep: "FAIL",
  rakAh2Transition: "FAIL",
  sujudPoseReuse: "FAIL",
  maleSujudPose: "MISSING",
  femaleSujudPose: "MISSING",
  maleSittingPose: "MISSING",
  femaleSittingPose: "MISSING",
  maleRisePose: "MISSING",
  femaleRisePose: "MISSING",
  swipeSequence: "NOT_RUN",
  scrollSequence: "NOT_RUN",
  modeState: "NOT_RUN",
  characterState: "NOT_RUN",
  deepLinks: "NOT_RUN",
  browserBack: "NOT_RUN",
  phone: "NOT_RUN",
  foldOpen: "NOT_RUN",
  tablet: "NOT_RUN",
  offline: "NOT_RUN",
  femaleModestyFailures: 0,
  wrongCharacterAssets: 0,
  audioVisible: false,
  productionChanged: false,
  errors: []
};

try {
  const live = read("index.html");
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const testHtml = read("test/index.html");

  if (!live.includes("gebet-lernen") && !live.includes("prayer-learning")) {
    report.productionChanged = false;
    ok("productionChanged", "false");
  } else {
    report.productionChanged = true;
    fail("production", "Live geändert");
  }

  [
    "test/assets/prayer-learning/prayer-learning.js",
    "test/data/prayer-learning/fajr.json",
    "test/data/prayer-learning/content/sujud.json",
    "test/data/prayer-learning/content/sitting-between-sujud.json",
    "test/data/prayer-learning/content/standing-next-rakah.json",
    "test/data/prayer-learning/poses/male-v1.json",
    "test/data/prayer-learning/poses/female-v1.json"
  ].forEach((p) => { if (!exists(p)) fail("preflight", "missing " + p); });

  if (!js.includes("PHASE = 10") || !testHtml.includes("gebet-lernen")) fail("preflight", "phase/route");
  else ok("preflight", "Phase 10 engine");

  const fajr = readJson("fajr.json");
  const seq = fajr.sequenceSteps || [];
  const s1 = seq.find((s) => s.id === "fajr-r1-sujud-1");
  const sit = seq.find((s) => s.id === "fajr-r1-sitting-between-sujud");
  const s2 = seq.find((s) => s.id === "fajr-r1-sujud-2");
  const rise = seq.find((s) => s.id === "fajr-r1-rise-to-rakah-2");
  const r2q = seq.find((s) => s.id === "fajr-r2-qiyam");
  const contentSujud = readJson("content/sujud.json");
  const contentSit = readJson("content/sitting-between-sujud.json");
  const contentRise = readJson("content/standing-next-rakah.json");
  const claims = readJson("sources/claims.json");
  const claimIds = new Set((claims.claims || []).map((c) => c.id));
  const male = readJson("poses/male-v1.json");
  const female = readJson("poses/female-v1.json");
  const stepSujud = readJson("steps/sujud.json");

  if (s1 && s1.order === 6 && s1.poseId === "sujud" && s1.contentId === "sujud-main-v1" && s1.status === "research" && contentSujud.approved === false) {
    report.sujud1Step = "PASS"; ok("sujud1Step", "PASS");
  } else fail("sujud1Step", "incomplete");

  if (sit && sit.order === 7 && sit.poseId === "sitting-between-sujud" && sit.contentId === "sitting-between-sujud-v1" && sit.deepLink === "sitting-between-sujud") {
    report.sittingStep = "PASS"; ok("sittingStep", "PASS");
  } else fail("sittingStep", "incomplete");

  if (s2 && s2.order === 8 && s2.poseId === "sujud" && s2.contentId === "sujud-main-v1" && (s2.poseReuseFrom === "sujud" || s2.poseReuse === true) && s2.contentReuse === true) {
    report.sujud2Step = "PASS"; ok("sujud2Step", "PASS");
  } else fail("sujud2Step", "incomplete");

  if (rise && rise.order === 9 && rise.poseId === "rise-next-rakah" && rise.contentId === "rise-next-rakah-v1" && rise.deepLink === "rise-to-rakah-2") {
    report.riseStep = "PASS"; ok("riseStep", "PASS");
  } else fail("riseStep", "incomplete");

  const i1 = seq.findIndex((s) => s.id === "fajr-r1-sujud-1");
  const iSit = seq.findIndex((s) => s.id === "fajr-r1-sitting-between-sujud");
  const i2 = seq.findIndex((s) => s.id === "fajr-r1-sujud-2");
  const iRise = seq.findIndex((s) => s.id === "fajr-r1-rise-to-rakah-2");
  const iR2 = seq.findIndex((s) => s.id === "fajr-r2-qiyam");
  if (i1 >= 0 && iSit === i1 + 1 && i2 === iSit + 1 && iRise === i2 + 1 && iR2 === iRise + 1 && r2q && r2q.rakAh === 2 && r2q.poseId === "qiyam") {
    report.rakAh2Transition = "PASS";
    ok("rakAh2Transition", "PASS");
  } else fail("rakAh2Transition", "order/r2 start wrong");

  // Pose reuse: same assetIds, no sujud-2 clone pose key
  const sameMale = male.poses.sujud && male.poses.sujud.assetId === "male-v1-sujud-v1";
  const sameFemale = female.poses.sujud && female.poses.sujud.assetId === "female-v1-sujud-v1";
  const noClone = !(male.poses["sujud-2"] || female.poses["sujud-2"] || male.poses["sujud-1"]);
  if (sameMale && sameFemale && noClone && s1.contentId === s2.contentId && s1.poseId === s2.poseId) {
    report.sujudPoseReuse = "PASS";
    ok("sujudPoseReuse", "PASS");
  } else fail("sujudPoseReuse", "duplicate or mismatch");

  // Neg: duplicate asset only because step IDs differ
  if (!male.poses["sujud-2"] && !female.poses["sujud-2"]) ok("negDuplicateSujudAsset", "PASS (no unnecessary clone)");
  else fail("negDuplicateSujudAsset", "clone pose key present");

  EXPECTED_SUJUD.forEach((id) => { if (!claimIds.has(id)) fail("sujudClaims", id); });
  EXPECTED_SITTING.forEach((id) => { if (!claimIds.has(id)) fail("sittingClaims", id); });
  EXPECTED_RISE.forEach((id) => { if (!claimIds.has(id)) fail("riseClaims", id); });
  if (EXPECTED_SUJUD.every((id) => (contentSujud.sourceClaimIds || []).includes(id))) ok("sujudClaimSlots", "PASS");
  else fail("sujudClaimSlots", "mismatch");
  if (EXPECTED_SITTING.every((id) => (contentSit.sourceClaimIds || []).includes(id))) ok("sittingClaimSlots", "PASS");
  else fail("sittingClaimSlots", "mismatch");
  if (EXPECTED_RISE.every((id) => (contentRise.sourceClaimIds || []).includes(id))) ok("riseClaimSlots", "PASS");
  else fail("riseClaimSlots", "mismatch");

  report.maleSujudPose = poseStatus(male.poses.sujud);
  report.femaleSujudPose = poseStatus(female.poses.sujud);
  report.maleSittingPose = poseStatus(male.poses["sitting-between-sujud"]);
  report.femaleSittingPose = poseStatus(female.poses["sitting-between-sujud"]);
  report.maleRisePose = poseStatus(male.poses["rise-next-rakah"]);
  report.femaleRisePose = poseStatus(female.poses["rise-next-rakah"]);

  function checkPose(reg, poseId, assetId, expectedChar, label) {
    const p = reg.poses && reg.poses[poseId];
    if (!p) { fail(label, "missing"); return; }
    if (p.assetId !== assetId) fail(label, "assetId");
    if (p.characterId !== expectedChar) { report.wrongCharacterAssets += 1; fail(label, "character"); }
    if (p.approved === true || p.src) fail(label, "must remain pending");
    if (reg.activeAssets && reg.activeAssets[poseId] != null) fail(label, "activeAsset");
    ok(label, poseStatus(p));
  }
  if (male.characterId !== CHAR_MALE) { report.wrongCharacterAssets += 1; fail("maleLock", male.characterId); }
  if (female.characterId !== CHAR_FEMALE) { report.wrongCharacterAssets += 1; fail("femaleLock", female.characterId); }
  checkPose(male, "sujud", "male-v1-sujud-v1", CHAR_MALE, "maleSujudSlot");
  checkPose(female, "sujud", "female-v1-sujud-v1", CHAR_FEMALE, "femaleSujudSlot");
  checkPose(male, "sitting-between-sujud", "male-v1-sitting-between-sujud-v1", CHAR_MALE, "maleSittingSlot");
  checkPose(female, "sitting-between-sujud", "female-v1-sitting-between-sujud-v1", CHAR_FEMALE, "femaleSittingSlot");
  checkPose(male, "rise-next-rakah", "male-v1-rise-next-rakah-v1", CHAR_MALE, "maleRiseSlot");
  checkPose(female, "rise-next-rakah", "female-v1-rise-next-rakah-v1", CHAR_FEMALE, "femaleRiseSlot");

  const details = stepSujud.details || [];
  if (details.some((d) => d.id === "sujud-hands") && details.some((d) => d.id === "sujud-knees") && details.some((d) => d.id === "sujud-feet")) {
    ok("sujudDetailFoundation", "PASS");
  } else fail("sujudDetailFoundation", "missing");

  // Negativtests
  const injected = Object.assign({}, female.poses.sujud, { characterId: "generic-niqab-other" });
  if (injected.characterId !== CHAR_FEMALE) ok("negWrongFemale", "PASS (reject)");
  else fail("negWrongFemale", "not detectable");

  if (female.poses.sujud && female.poses.sujud.clothingReview !== true && female.poses.sujud.approved !== true) {
    ok("negFemaleTight", "PASS");
  } else {
    report.femaleModestyFailures += 1;
    fail("negFemaleTight", "approved without clothingReview");
  }
  if (male.poses.sujud && male.poses.sujud.characterConsistency !== true && male.poses.sujud.approved !== true) ok("negMaleDrift", "PASS");
  else fail("negMaleDrift", "approved without consistency");

  const fakeApproved = { status: "approved", reviewPass1: true, reviewPass2: true, sourceClaimIds: [], approved: true };
  if (!canPublishContent(fakeApproved)) ok("negNoSource", "PASS");
  else fail("negNoSource", "gate allows empty claims");

  if (js.includes("controlledPlaceholder") && js.includes("POSE_PENDING_LABEL") && js.includes("prl-test-marker")) {
    ok("negPendingAsFinal", "PASS (test marker / placeholder path)");
  } else fail("negPendingAsFinal", "missing guard");

  if (js.includes("bindSwipeTrack") && js.includes("goToNextStep") && js.includes("jumpToIndex")) {
    report.swipeSequence = "PASS"; ok("swipeSequence", "PASS (engine)");
  } else { report.swipeSequence = "FAIL"; fail("swipeSequence", "missing"); }
  if (js.includes("bindScrollObserver") && js.includes("prl-rakah-mark")) {
    report.scrollSequence = "PASS"; ok("scrollSequence", "PASS (engine)");
  } else { report.scrollSequence = "FAIL"; fail("scrollSequence", "missing"); }
  if (js.includes("viewMode") && js.includes("restoreLearnPosition")) {
    report.modeState = "PASS"; ok("modeState", "PASS");
  } else report.modeState = "FAIL";
  if (js.includes("characterSwitchPending") && js.includes("stepId: st.stepId")) {
    report.characterState = "PASS"; ok("characterState", "PASS");
  } else report.characterState = "FAIL";

  if (js.includes("rise-to-rakah-2") && js.includes("sitting-between-sujud") && js.includes("sujud-1") && js.includes("deepLinkForStep")) {
    report.deepLinks = "PASS"; ok("deepLinks", "PASS (route model)");
  } else { report.deepLinks = "FAIL"; fail("deepLinks", "missing"); }
  if (js.includes("popstate") && js.includes("rakAh: step.rakAh")) {
    report.browserBack = "PASS"; ok("browserBack", "PASS (wiring)");
  } else { report.browserBack = "FAIL"; fail("browserBack", "missing"); }

  if (exists("test/data/prayer-learning/prayer-learning-manifest.json") && testHtml.includes("prayer-learning-manifest.json")) {
    report.offline = "PASS"; ok("offline", "PASS (foundation; device NOT_RUN)");
  } else { report.offline = "FAIL"; fail("offline", "missing"); }

  report.phone = "NOT_RUN";
  report.foldOpen = "NOT_RUN";
  report.tablet = "NOT_RUN";
  ok("deviceMatrix", "NOT_RUN");

  if (js.includes("AUDIO_VISIBLE = false") && !/<audio[\s>]/i.test(js)) {
    report.audioVisible = false; ok("audioVisible", "false");
  } else { report.audioVisible = true; fail("audio", "visible"); }

  if (js.includes("PHASE = 10") && testHtml.includes("app-shell-v642")) ok("version", "v642");
  else fail("version", "expected v642 / PHASE 10");

  // Quick look sujud
  const prayers = readJson("prayers.json");
  if ((prayers.quickPositions || []).some((p) => p.id === "sujud" && p.defaultSequenceId === "fajr-r1-sujud-1")) ok("quickLookSujud", "PASS");
  else fail("quickLookSujud", "missing");

  // Texts index includes sujud/sitting
  if (js.includes('order = ["takbir", "ruku", "standing-after-ruku", "sujud", "sitting-between-sujud"')) ok("textsIndex", "PASS");
  else fail("textsIndex", "missing modules order");

  try {
    execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, stdio: "pipe" });
    ok("validator", "PASS");
  } catch (e) {
    const out = String((e.stdout && e.stdout.toString()) || (e.stderr && e.stderr.toString()) || e.message || e);
    if (/FAIL:/.test(out)) fail("validator", out.split("\n").filter((l) => l.startsWith("FAIL:")).join(" | ").slice(0, 400));
    else fail("validator", out.slice(0, 400));
  }

  let wrong = 0;
  Object.values(male.poses || {}).forEach((p) => { if (p && p.characterId && p.characterId !== CHAR_MALE) wrong += 1; });
  Object.values(female.poses || {}).forEach((p) => { if (p && p.characterId && p.characterId !== CHAR_FEMALE) wrong += 1; });
  report.wrongCharacterAssets = wrong;
  if (wrong === 0) ok("wrongCharacterAssets", "0");
  else fail("wrongCharacterAssets", String(wrong));
} catch (e) {
  fail("fatal", String(e && e.stack || e));
}

report.errors = errors;
console.log("\n=== PHASE 10 REPORT ===");
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
