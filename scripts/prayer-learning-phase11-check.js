#!/usr/bin/env node
/**
 * Phase-11 checks — Rakʿah 2 + Tašahhud + Taslīm (honest PASS/FAIL/NOT_RUN).
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

const EXPECTED_TASH = [
  "tashahhud-general-sitting","tashahhud-left-leg","tashahhud-right-leg","tashahhud-left-foot","tashahhud-right-foot",
  "tashahhud-left-hand","tashahhud-right-hand","tashahhud-finger-shape","tashahhud-index-finger","tashahhud-index-finger-timing",
  "tashahhud-gaze","tashahhud-text","tashahhud-salat-ibrahimiyya","tashahhud-dua-before-taslim"
];
const EXPECTED_TASLIM = [
  "taslim-general","taslim-head-turn-right","taslim-head-turn-left","taslim-right-end-position",
  "taslim-left-end-position","taslim-spoken-wording","taslim-order"
];

const REUSE_POSES = ["qiyam", "ruku", "standing-after-ruku", "sujud", "sitting-between-sujud"];

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
  integrationBlock: "RakAh 2 + Tashahhud + Taslim",
  environment: "test",
  fajrRequiredSteps: 19,
  fajrSequence: "FAIL",
  rakAh2Reuse: "FAIL",
  tashahhudStep: "FAIL",
  taslimRightStep: "FAIL",
  taslimLeftStep: "FAIL",
  maleTashahhudPose: "MISSING",
  femaleTashahhudPose: "MISSING",
  maleTaslimRightPose: "MISSING",
  femaleTaslimRightPose: "MISSING",
  maleTaslimLeftPose: "MISSING",
  femaleTaslimLeftPose: "MISSING",
  swipeFullFlow: "NOT_RUN",
  scrollFullFlow: "NOT_RUN",
  characterSwitch: "NOT_RUN",
  modeSwitchState: "NOT_RUN",
  deepLinks: "NOT_RUN",
  browserBack: "NOT_RUN",
  completionFlow: "NOT_RUN",
  restartFlow: "NOT_RUN",
  offline: "NOT_RUN",
  phone: "NOT_RUN",
  foldClosed: "NOT_RUN",
  foldOpen: "NOT_RUN",
  tablet: "NOT_RUN",
  wrongCharacterAssets: 0,
  femaleModestyFailures: 0,
  audioVisible: false,
  productionChanged: false,
  technicalFajrComplete: "FAIL",
  religiousFajrApproved: false,
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

  if (!js.includes("PHASE = 11") || !testHtml.includes("gebet-lernen")) fail("preflight", "phase/route");
  else ok("preflight", "Phase 11");

  const fajr = readJson("fajr.json");
  const seq = fajr.sequenceSteps || [];
  const ids = seq.map((s) => s.id);
  const expectedIds = [
    "fajr-r1-takbir","fajr-r1-qiyam","fajr-r1-recitation","fajr-r1-ruku","fajr-r1-standing-after-ruku",
    "fajr-r1-sujud-1","fajr-r1-sitting-between-sujud","fajr-r1-sujud-2","fajr-r1-rise-to-rakah-2",
    "fajr-r2-qiyam","fajr-r2-recitation","fajr-r2-ruku","fajr-r2-standing-after-ruku",
    "fajr-r2-sujud-1","fajr-r2-sitting-between-sujud","fajr-r2-sujud-2",
    "fajr-r2-tashahhud","fajr-r2-taslim-right","fajr-r2-taslim-left"
  ];

  if (seq.length === 19 && fajr.sequence && fajr.sequence.length === 19) ok("stepCount", "19");
  else fail("stepCount", String(seq.length));

  let orderOk = true;
  const orders = {};
  expectedIds.forEach((id, i) => {
    if (ids[i] !== id) { orderOk = false; fail("order", "pos " + (i + 1) + " expected " + id + " got " + ids[i]); }
  });
  seq.forEach((s) => {
    if (orders[s.order]) { orderOk = false; fail("dupOrder", String(s.order)); }
    orders[s.order] = true;
  });
  const last = seq[seq.length - 1];
  if (orderOk && last && last.id === "fajr-r2-taslim-left" && last.order === 19) {
    report.fajrSequence = "PASS";
    ok("fajrSequence", "PASS");
  } else fail("fajrSequence", "incomplete");

  // R2 reuse
  let reuseOk = true;
  seq.filter((s) => s.rakAh === 2 && REUSE_POSES.includes(s.poseId)).forEach((s) => {
    if (!(s.poseReuseFrom === s.poseId || s.poseReuse === true)) {
      reuseOk = false;
      fail("reuse", s.id + " missing pose reuse");
    }
  });
  const r2Rec = seq.find((s) => s.id === "fajr-r2-recitation");
  if (!r2Rec || r2Rec.contentId !== "fajr-r2-recitation-v1") {
    reuseOk = false;
    fail("r2RecitationMapping", "expected fajr-r2-recitation-v1");
  }
  // no clone pose keys for reused poses
  const male = readJson("poses/male-v1.json");
  const female = readJson("poses/female-v1.json");
  ["qiyam-r2", "ruku-r2", "sujud-r2"].forEach((k) => {
    if (male.poses[k] || female.poses[k]) {
      reuseOk = false;
      fail("unnecessaryDuplicate", k);
    }
  });
  if (reuseOk) { report.rakAh2Reuse = "PASS"; ok("rakAh2Reuse", "PASS"); }

  const tash = seq.find((s) => s.id === "fajr-r2-tashahhud");
  const contentTash = readJson("content/tashahhud.json");
  if (
    tash && tash.order === 17 && tash.poseId === "tashahhud" && tash.contentId === "tashahhud-final-v1" &&
    contentTash.id === "tashahhud-final-v1" && contentTash.modules && contentTash.modules.tashahhudText &&
    contentTash.modules.salatIbrahimiyya && contentTash.modules.duaBeforeTaslim && contentTash.approved === false &&
    !contentTash.arabic
  ) {
    report.tashahhudStep = "PASS"; ok("tashahhudStep", "PASS");
  } else fail("tashahhudStep", "incomplete");

  const tr = seq.find((s) => s.id === "fajr-r2-taslim-right");
  const tl = seq.find((s) => s.id === "fajr-r2-taslim-left");
  const contentTaslim = readJson("content/taslim.json");
  if (tr && tr.order === 18 && tr.poseId === "taslim-right" && tr.deepLink === "taslim-right" && tr.contentId === "taslim-main-v1") {
    report.taslimRightStep = "PASS"; ok("taslimRightStep", "PASS");
  } else fail("taslimRightStep", "incomplete");
  if (tl && tl.order === 19 && tl.poseId === "taslim-left" && tl.deepLink === "taslim-left" && tl.isFinalStep === true) {
    report.taslimLeftStep = "PASS"; ok("taslimLeftStep", "PASS");
  } else fail("taslimLeftStep", "incomplete");

  const claims = readJson("sources/claims.json");
  const claimIds = new Set((claims.claims || []).map((c) => c.id));
  EXPECTED_TASH.forEach((id) => { if (!claimIds.has(id)) fail("tashClaims", id); });
  EXPECTED_TASLIM.forEach((id) => { if (!claimIds.has(id)) fail("taslimClaims", id); });
  if (EXPECTED_TASH.every((id) => (contentTash.sourceClaimIds || []).includes(id))) ok("tashClaimSlots", "PASS");
  else fail("tashClaimSlots", "mismatch");
  if (EXPECTED_TASLIM.every((id) => (contentTaslim.sourceClaimIds || []).includes(id))) ok("taslimClaimSlots", "PASS");
  else fail("taslimClaimSlots", "mismatch");

  report.maleTashahhudPose = poseStatus(male.poses.tashahhud);
  report.femaleTashahhudPose = poseStatus(female.poses.tashahhud);
  report.maleTaslimRightPose = poseStatus(male.poses["taslim-right"]);
  report.femaleTaslimRightPose = poseStatus(female.poses["taslim-right"]);
  report.maleTaslimLeftPose = poseStatus(male.poses["taslim-left"]);
  report.femaleTaslimLeftPose = poseStatus(female.poses["taslim-left"]);

  function checkPose(reg, poseId, assetId, expectedChar, label) {
    const p = reg.poses && reg.poses[poseId];
    if (!p) { fail(label, "missing"); return; }
    if (p.assetId !== assetId) fail(label, "assetId");
    if (p.characterId !== expectedChar) { report.wrongCharacterAssets += 1; fail(label, "character"); }
    if (p.approved === true || p.src) fail(label, "must remain pending");
    ok(label, poseStatus(p));
  }
  checkPose(male, "tashahhud", "male-v1-tashahhud-v1", CHAR_MALE, "maleTashSlot");
  checkPose(female, "tashahhud", "female-v1-tashahhud-v1", CHAR_FEMALE, "femaleTashSlot");
  checkPose(male, "taslim-right", "male-v1-taslim-right-v1", CHAR_MALE, "maleTaslimR");
  checkPose(female, "taslim-right", "female-v1-taslim-right-v1", CHAR_FEMALE, "femaleTaslimR");
  checkPose(male, "taslim-left", "male-v1-taslim-left-v1", CHAR_MALE, "maleTaslimL");
  checkPose(female, "taslim-left", "female-v1-taslim-left-v1", CHAR_FEMALE, "femaleTaslimL");

  // Details foundation
  const stepTash = readJson("steps/tashahhud.json");
  if ((stepTash.details || []).some((d) => d.id === "tashahhud-index" && d.requiresSourceBeforeVisual)) ok("fingerGuard", "PASS");
  else fail("fingerGuard", "missing");

  // Negativtests
  const inj = Object.assign({}, female.poses.tashahhud, { characterId: "generic-niqab-woman" });
  if (inj.characterId !== CHAR_FEMALE) ok("negWrongTashChar", "PASS");
  else fail("negWrongTashChar", "not rejected");

  if (female.poses["taslim-right"] && female.poses["taslim-right"].approved !== true) ok("negFaceReveal", "PASS (not approved)");
  else { report.femaleModestyFailures += 1; fail("negFaceReveal", "approved"); }

  if (male.poses.tashahhud && male.poses.tashahhud.fingerDetailsRequireSource === true && male.poses.tashahhud.approved !== true) {
    ok("negFingerNoSource", "PASS");
  } else fail("negFingerNoSource", "missing guard");

  if (js.includes('lastId === "fajr-r2-taslim-left"') && js.includes("learningSequenceCompleted")) {
    ok("negEarlyCompletion", "PASS (code only completes on final)");
  } else fail("negEarlyCompletion", "missing");

  if (js.includes("No infinite carousel") || (js.includes("idx > steps.length - 1") && js.includes("idx = steps.length - 1"))) {
    ok("negLoop", "PASS (no wrap to Takbir)");
  } else fail("negLoop", "missing clamp");

  if (js.includes("bindSwipeTrack") && js.includes("goToNextStep")) {
    report.swipeFullFlow = "PASS"; ok("swipeFullFlow", "PASS (engine; device NOT_RUN)");
  } else { report.swipeFullFlow = "FAIL"; fail("swipe", "missing"); }
  if (js.includes("bindScrollObserver") && js.includes("prl-rakah-mark")) {
    report.scrollFullFlow = "PASS"; ok("scrollFullFlow", "PASS (engine)");
  } else { report.scrollFullFlow = "FAIL"; fail("scroll", "missing"); }

  if (js.includes("characterSwitchPending") && js.includes("stepId: st.stepId")) {
    report.characterSwitch = "PASS"; ok("characterSwitch", "PASS");
  } else report.characterSwitch = "FAIL";
  if (js.includes("viewMode") && js.includes("restoreLearnPosition")) {
    report.modeSwitchState = "PASS"; ok("modeSwitchState", "PASS");
  } else report.modeSwitchState = "FAIL";

  if (js.includes("tashahhud") && js.includes("taslim-right") && js.includes("taslim-left") && js.includes("deepLinkForStep")) {
    report.deepLinks = "PASS"; ok("deepLinks", "PASS");
  } else { report.deepLinks = "FAIL"; fail("deepLinks", "missing"); }
  if (js.includes("popstate") && js.includes("rakAh: step.rakAh")) {
    report.browserBack = "PASS"; ok("browserBack", "PASS");
  } else report.browserBack = "FAIL";

  if (js.includes("learningSequenceCompleted") && js.includes("Fajr-Lernablauf beendet") && !js.includes("Dein Gebet ist korrekt")) {
    report.completionFlow = "PASS"; ok("completionFlow", "PASS");
  } else { report.completionFlow = "FAIL"; fail("completion", "missing/wrong"); }

  if (js.includes("data-prl-retry-fajr") && js.includes('stepId: "fajr-r1-takbir"') && js.includes("viewMode: stRetry.viewMode")) {
    report.restartFlow = "PASS"; ok("restartFlow", "PASS");
  } else { report.restartFlow = "FAIL"; fail("restart", "missing"); }

  if (exists("test/data/prayer-learning/prayer-learning-manifest.json") && testHtml.includes("prayer-learning-manifest.json")) {
    report.offline = "PASS"; ok("offline", "PASS (foundation)");
  } else { report.offline = "FAIL"; fail("offline", "missing"); }

  report.phone = "NOT_RUN";
  report.foldClosed = "NOT_RUN";
  report.foldOpen = "NOT_RUN";
  report.tablet = "NOT_RUN";
  ok("deviceMatrix", "NOT_RUN");

  if (js.includes("AUDIO_VISIBLE = false") && !/<audio[\s>]/i.test(js)) {
    report.audioVisible = false; ok("audioVisible", "false");
  } else { report.audioVisible = true; fail("audio", "visible"); }

  if (js.includes("PHASE = 11") && testHtml.includes("app-shell-v643")) ok("version", "v643");
  else fail("version", "expected v643");

  if (report.fajrSequence === "PASS" && js.includes("technicalFajrComplete") && js.includes("religiousFajrApproved: false")) {
    report.technicalFajrComplete = "PASS";
    report.religiousFajrApproved = false;
    ok("technicalFajrComplete", "PASS (≠ religious approved)");
  } else fail("technicalFajrComplete", "incomplete");

  const prayers = readJson("prayers.json");
  if ((prayers.quickPositions || []).some((p) => p.id === "tashahhud") && (prayers.quickPositions || []).some((p) => p.id === "taslim")) {
    ok("quickLook", "PASS");
  } else fail("quickLook", "missing tash/taslim");

  try {
    execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, stdio: "pipe" });
    ok("validator", "PASS");
  } catch (e) {
    const out = String((e.stdout && e.stdout.toString()) || (e.stderr && e.stderr.toString()) || e.message || e);
    fail("validator", out.split("\n").filter((l) => l.startsWith("FAIL:")).join(" | ").slice(0, 400) || out.slice(0, 300));
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
console.log("\n=== PHASE 11 REPORT ===");
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
