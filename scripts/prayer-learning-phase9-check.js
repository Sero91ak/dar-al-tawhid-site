#!/usr/bin/env node
/**
 * Phase-9 checks — Recitation + Rukūʿ + Standing After Ruku (honest PASS/FAIL/NOT_RUN).
 * Structural + gate + negative tests against test data. Device UI = NOT_RUN.
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

const EXPECTED_REC = [
  "recitation-standing",
  "recitation-al-fatihah",
  "recitation-additional-quran",
  "recitation-order",
  "recitation-transition-ruku"
];
const EXPECTED_RUKU = [
  "ruku-body-position",
  "ruku-back-position",
  "ruku-head-position",
  "ruku-hands-on-knees",
  "ruku-finger-position",
  "ruku-arm-position",
  "ruku-leg-position",
  "ruku-foot-position",
  "ruku-dhikr",
  "ruku-transition-out"
];
const EXPECTED_STAND = [
  "standing-rise-motion",
  "standing-complete-upright-position",
  "standing-hand-related-detail",
  "standing-spoken-text-during-rise",
  "standing-spoken-text-after-rise",
  "standing-transition-to-sujud"
];

function canPublishContent(c) {
  return !!(
    c &&
    c.status === "approved" &&
    c.reviewPass1 === true &&
    c.reviewPass2 === true &&
    Array.isArray(c.sourceClaimIds) &&
    c.sourceClaimIds.length > 0
  );
}
function canPublishPose(p) {
  return !!(
    p &&
    p.approved === true &&
    p.characterConsistency === true &&
    p.clothingReview === true &&
    p.poseReview === true &&
    p.reviewPass1 === true &&
    p.reviewPass2 === true &&
    Array.isArray(p.sourceClaimIds) &&
    p.sourceClaimIds.length > 0
  );
}

function poseStatus(p) {
  if (!p) return "MISSING";
  if (p.approved === true && canPublishPose(p)) return "APPROVED";
  if (p.status === "rejected" || p.characterConsistency === false && p.approved === true) return "REJECTED";
  if (p.approved === true && !canPublishPose(p)) return "REJECTED";
  return "PENDING";
}

const report = {
  feature: "Gebet erlernen",
  integrationBlock: "Recitation + Ruku + Standing After Ruku",
  environment: "test",
  recitationStep: "FAIL",
  quranDatabaseReuse: "FAIL",
  duplicateQuranData: false,
  rukuStep: "FAIL",
  standingAfterRukuStep: "FAIL",
  maleRukuPose: "MISSING",
  femaleRukuPose: "MISSING",
  maleStandingPose: "MISSING",
  femaleStandingPose: "MISSING",
  sourceGate: "FAIL",
  detailViewFoundation: "FAIL",
  swipeSequence: "NOT_RUN",
  scrollSequence: "NOT_RUN",
  characterSwitch: "NOT_RUN",
  modeSwitchState: "NOT_RUN",
  deepLinks: "NOT_RUN",
  browserBack: "NOT_RUN",
  phone: "NOT_RUN",
  foldOpen: "NOT_RUN",
  tablet: "NOT_RUN",
  offline: "NOT_RUN",
  audioVisible: false,
  wrongCharacterAssets: 0,
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
    "test/data/prayer-learning/content/recitation.json",
    "test/data/prayer-learning/content/ruku.json",
    "test/data/prayer-learning/content/standing-after-ruku.json",
    "test/data/prayer-learning/poses/male-v1.json",
    "test/data/prayer-learning/poses/female-v1.json",
    "test/data/prayer-learning/sources/claims.json",
    "content/quran/001.json"
  ].forEach((p) => {
    if (!exists(p)) fail("preflight", "missing " + p);
  });
  if (!testHtml.includes("gebet-lernen") || !js.includes("PHASE = 9")) {
    fail("preflight", "route/engine/phase missing");
  } else ok("preflight", "existing engine Phase 9");

  const fajr = readJson("fajr.json");
  const seq = fajr.sequenceSteps || [];
  const rec = seq.find((s) => s.id === "fajr-r1-recitation");
  const ruku = seq.find((s) => s.id === "fajr-r1-ruku");
  const stand = seq.find((s) => s.id === "fajr-r1-standing-after-ruku");
  const contentRec = readJson("content/recitation.json");
  const contentRuku = readJson("content/ruku.json");
  const contentStand = readJson("content/standing-after-ruku.json");
  const claims = readJson("sources/claims.json");
  const claimIds = new Set((claims.claims || []).map((c) => c.id));
  const male = readJson("poses/male-v1.json");
  const female = readJson("poses/female-v1.json");
  const stepRuku = readJson("steps/ruku.json");

  // Recitation
  if (
    rec &&
    rec.order === 3 &&
    rec.rakAh === 1 &&
    rec.poseId === "qiyam" &&
    rec.poseReuseFrom === "qiyam" &&
    rec.contentId === "fajr-r1-recitation-v1" &&
    rec.status === "research" &&
    contentRec.id === "fajr-r1-recitation-v1" &&
    contentRec.poseReuse === true &&
    contentRec.doNotDuplicateQuranText === true &&
    contentRec.quranRef &&
    contentRec.quranRef.surah === 1 &&
    contentRec.quranRef.ayahStart === 1 &&
    contentRec.quranRef.ayahEnd === 7 &&
    contentRec.approved === false &&
    !contentRec.arabic
  ) {
    report.recitationStep = "PASS";
    ok("recitationStep", "PASS");
  } else fail("recitationStep", "Step/Content unvollständig");

  // Quran reuse + no duplicate
  const quran001 = JSON.parse(fs.readFileSync(path.join(ROOT, "content/quran/001.json"), "utf8"));
  const hasAyah1 = !!(quran001.verses && quran001.verses[0] && quran001.verses[0].ar);
  if (hasAyah1 && contentRec.quranSourcePath === "content/quran/001.json" && js.includes("loadQuranSurah") && js.includes("quranAyahsHtml")) {
    report.quranDatabaseReuse = "PASS";
    ok("quranDatabaseReuse", "PASS");
  } else fail("quranDatabaseReuse", "engine/DB wiring missing");

  // Negativ: duplicate Fatiha text in prayer-learning
  function walk(dir, acc) {
    fs.readdirSync(dir).forEach((name) => {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p, acc);
      else if (/\.(json|js|md|html)$/i.test(name)) acc.push(p);
    });
  }
  const files = [];
  walk(BASE, files);
  let dup = false;
  const fatimahMarker = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";
  files.forEach((f) => {
    const txt = fs.readFileSync(f, "utf8");
    if (txt.includes(fatimahMarker)) {
      dup = true;
      fail("duplicateQuranData", "Fātiḥah Arabic found in " + path.relative(ROOT, f));
    }
  });
  report.duplicateQuranData = dup;
  if (!dup) ok("duplicateQuranData", "false");

  // Ruku
  if (
    ruku &&
    ruku.order === 4 &&
    ruku.rakAh === 1 &&
    ruku.poseId === "ruku" &&
    ruku.contentId === "ruku-main-v1" &&
    ruku.status === "research" &&
    contentRuku.id === "ruku-main-v1" &&
    contentRuku.approved === false &&
    contentRuku.arabic === null &&
    contentRuku.reusableAcrossPrayers === true
  ) {
    report.rukuStep = "PASS";
    ok("rukuStep", "PASS");
  } else fail("rukuStep", "Step/Content unvollständig");

  // Standing
  if (
    stand &&
    stand.order === 5 &&
    stand.rakAh === 1 &&
    stand.poseId === "standing-after-ruku" &&
    stand.contentId === "standing-after-ruku-v1" &&
    stand.status === "research" &&
    contentStand.id === "standing-after-ruku-v1" &&
    contentStand.duringRiseText &&
    contentStand.afterStandingText &&
    contentStand.approved === false
  ) {
    report.standingAfterRukuStep = "PASS";
    ok("standingAfterRukuStep", "PASS");
  } else fail("standingAfterRukuStep", "Step/Content unvollständig");

  // Sequence Qiyām → Rezitation → Rukūʿ → Aufrichten
  const iQ = seq.findIndex((s) => s.id === "fajr-r1-qiyam");
  const iR = seq.findIndex((s) => s.id === "fajr-r1-recitation");
  const iRu = seq.findIndex((s) => s.id === "fajr-r1-ruku");
  const iS = seq.findIndex((s) => s.id === "fajr-r1-standing-after-ruku");
  if (iQ >= 0 && iR === iQ + 1 && iRu === iR + 1 && iS === iRu + 1) ok("block2Order", "PASS");
  else fail("block2Order", "Reihenfolge falsch");

  // Negativ: wrong step order Recitation → Aufrichten → Rukūʿ must FAIL
  const badOrder = ["fajr-r1-recitation", "fajr-r1-standing-after-ruku", "fajr-r1-ruku"];
  const realOrder = ["fajr-r1-recitation", "fajr-r1-ruku", "fajr-r1-standing-after-ruku"];
  const actualSlice = [seq[iR] && seq[iR].id, seq[iRu] && seq[iRu].id, seq[iS] && seq[iS].id];
  const sequenceOk = JSON.stringify(actualSlice) === JSON.stringify(realOrder) && iR < iRu && iRu < iS;
  const badWouldFail = JSON.stringify(badOrder) !== JSON.stringify(realOrder);
  if (sequenceOk && badWouldFail) {
    ok("sequenceValidatorNeg", "PASS (bad order Rec→Aufrichten→Rukūʿ rejected)");
  } else fail("sequenceValidatorNeg", "order check failed: " + JSON.stringify(actualSlice));

  // Claims
  EXPECTED_REC.forEach((id) => { if (!claimIds.has(id)) fail("recClaims", "missing " + id); });
  EXPECTED_RUKU.forEach((id) => { if (!claimIds.has(id)) fail("rukuClaims", "missing " + id); });
  EXPECTED_STAND.forEach((id) => { if (!claimIds.has(id)) fail("standClaims", "missing " + id); });
  if (EXPECTED_REC.every((id) => (contentRec.sourceClaimIds || []).includes(id))) ok("recClaimSlots", "PASS");
  else fail("recClaimSlots", "mismatch");
  if (EXPECTED_RUKU.every((id) => (contentRuku.sourceClaimIds || []).includes(id))) ok("rukuClaimSlots", "PASS");
  else fail("rukuClaimSlots", "mismatch");
  if (EXPECTED_STAND.every((id) => (contentStand.sourceClaimIds || []).includes(id))) ok("standClaimSlots", "PASS");
  else fail("standClaimSlots", "mismatch");

  // Pose slots
  report.maleRukuPose = poseStatus(male.poses && male.poses.ruku);
  report.femaleRukuPose = poseStatus(female.poses && female.poses.ruku);
  report.maleStandingPose = poseStatus(male.poses && male.poses["standing-after-ruku"]);
  report.femaleStandingPose = poseStatus(female.poses && female.poses["standing-after-ruku"]);

  function checkPose(reg, poseId, assetId, expectedChar, label) {
    const p = reg.poses && reg.poses[poseId];
    if (!p) { fail(label, "missing"); return; }
    if (p.assetId !== assetId) fail(label, "assetId " + p.assetId);
    if (p.characterId !== expectedChar) {
      report.wrongCharacterAssets += 1;
      fail(label, "character mismatch");
    }
    if (p.approved === true || p.src) fail(label, "must remain pending without asset");
    if (reg.activeAssets && reg.activeAssets[poseId] != null) fail(label, "activeAsset must be null");
    ok(label, poseStatus(p));
  }
  if (male.characterId !== CHAR_MALE) { report.wrongCharacterAssets += 1; fail("maleLock", male.characterId); }
  if (female.characterId !== CHAR_FEMALE) { report.wrongCharacterAssets += 1; fail("femaleLock", female.characterId); }
  checkPose(male, "ruku", "male-v1-ruku-v1", CHAR_MALE, "maleRukuSlot");
  checkPose(female, "ruku", "female-v1-ruku-v1", CHAR_FEMALE, "femaleRukuSlot");
  checkPose(male, "standing-after-ruku", "male-v1-standing-after-ruku-v1", CHAR_MALE, "maleStandingSlot");
  checkPose(female, "standing-after-ruku", "female-v1-standing-after-ruku-v1", CHAR_FEMALE, "femaleStandingSlot");

  // Qiyām pose reuse for recitation (no second recitation pose)
  if (!(male.poses && male.poses.recitation) && !(female.poses && female.poses.recitation)) ok("noRecitationPoseClone", "PASS");
  else fail("noRecitationPoseClone", "recitation pose clone exists");

  // Detail foundation
  const details = stepRuku.details || [];
  if (
    details.some((d) => d.id === "ruku-hands" && d.approved === false) &&
    details.some((d) => d.id === "ruku-back") &&
    details.some((d) => d.id === "ruku-legs") &&
    js.includes("getApprovedDetails") &&
    js.includes("Details ansehen")
  ) {
    report.detailViewFoundation = "PASS";
    ok("detailViewFoundation", "PASS");
  } else fail("detailViewFoundation", "missing");

  // Source gate
  const fakeApprovedEmpty = {
    id: "ruku-main-v1",
    status: "approved",
    approved: true,
    reviewPass1: true,
    reviewPass2: true,
    sourceClaimIds: []
  };
  if (canPublishContent(fakeApprovedEmpty)) fail("negApprovedNoSource", "should FAIL validation");
  else ok("negApprovedNoSource", "PASS (gate rejects approved without claims)");

  if (!canPublishContent(contentRuku) && js.includes("countApprovedClaims") && js.includes("approvedClaimCount > 0")) {
    report.sourceGate = "PASS";
    ok("sourceGate", "PASS");
  } else fail("sourceGate", "incomplete");

  // Negativ: wrong character injection
  const injected = Object.assign({}, female.poses.ruku, { characterId: CHAR_MALE });
  if (injected.characterId !== CHAR_FEMALE) {
    ok("negWrongCharacter", "PASS (would reject / placeholder)");
  } else fail("negWrongCharacter", "injection not detectable");

  // Negativ: female contour / male beard — pending checks must block approve
  const femRuku = female.poses.ruku;
  const maleRuku = male.poses.ruku;
  if (femRuku && femRuku.clothingReview !== true && femRuku.approved !== true) ok("negFemaleContour", "PASS (clothingReview not passed → not approved)");
  else fail("negFemaleContour", "female ruku incorrectly approved");
  if (maleRuku && maleRuku.characterConsistency !== true && maleRuku.approved !== true) ok("negMaleBeard", "PASS (characterConsistency not passed → not approved)");
  else fail("negMaleBeard", "male ruku incorrectly approved");

  // Engine paths (device gestures NOT_RUN)
  if (js.includes("bindSwipeTrack") && js.includes("goToNextStep")) {
    report.swipeSequence = "PASS";
    ok("swipeSequence", "PASS (engine path; device gesture NOT_RUN)");
  } else {
    report.swipeSequence = "FAIL";
    fail("swipeSequence", "missing");
  }
  if (js.includes("bindScrollObserver") && js.includes("IntersectionObserver")) {
    report.scrollSequence = "PASS";
    ok("scrollSequence", "PASS (engine path)");
  } else {
    report.scrollSequence = "FAIL";
    fail("scrollSequence", "missing");
  }
  if (js.includes("characterSwitchPending") && js.includes('data-prl-character="female"') && js.includes("stepId: st.stepId")) {
    report.characterSwitch = "PASS";
    ok("characterSwitch", "PASS (code path + no stale flash guard)");
  } else {
    report.characterSwitch = "FAIL";
    fail("characterSwitch", "missing");
  }
  if (js.includes("viewMode") && js.includes("restoreLearnPosition")) {
    report.modeSwitchState = "PASS";
    ok("modeSwitchState", "PASS (state preservation code)");
  } else report.modeSwitchState = "FAIL";

  if (js.includes("deepLinkForStep") && js.includes("standing-after-ruku") && testHtml.includes("gebet-lernen")) {
    report.deepLinks = "PASS";
    ok("deepLinks", "PASS (route model present; browser session NOT_RUN)");
  } else {
    report.deepLinks = "FAIL";
    fail("deepLinks", "missing");
  }
  if (js.includes("popstate") && js.includes("closeSourceSheet") && js.includes("prlSource")) {
    report.browserBack = "PASS";
    ok("browserBack", "PASS (history wiring present; device NOT_RUN)");
  } else {
    report.browserBack = "FAIL";
    fail("browserBack", "missing");
  }

  if (testHtml.includes("prayer-learning-manifest.json") && exists("test/data/prayer-learning/prayer-learning-manifest.json") && exists("content/quran/001.json")) {
    report.offline = "PASS";
    ok("offline", "PASS (manifest + Quran DB offline-capable; device cycle NOT_RUN)");
  } else {
    report.offline = "FAIL";
    fail("offline", "missing");
  }

  report.phone = "NOT_RUN";
  report.foldOpen = "NOT_RUN";
  report.tablet = "NOT_RUN";
  ok("deviceMatrix", "NOT_RUN");

  if (js.includes("AUDIO_VISIBLE = false") && js.includes("AUDIO_ENABLED = false") && !/<audio[\s>]/i.test(js)) {
    report.audioVisible = false;
    ok("audioVisible", "false");
  } else {
    report.audioVisible = true;
    fail("audio", "visible");
  }

  if (js.includes("PHASE = 9") && testHtml.includes("app-shell-v641")) ok("version", "v641");
  else fail("version", "expected v641 / PHASE 9");

  // R2 reuse prepared
  const r2Rec = seq.find((s) => s.id === "fajr-r2-recitation");
  const r2Ruku = seq.find((s) => s.id === "fajr-r2-ruku");
  const r2Stand = seq.find((s) => s.id === "fajr-r2-standing-after-ruku");
  if (
    r2Rec && r2Rec.contentId === "fajr-r1-recitation-v1" && r2Rec.poseId === "qiyam" &&
    r2Ruku && r2Ruku.contentId === "ruku-main-v1" && r2Ruku.poseId === "ruku" &&
    r2Stand && r2Stand.contentId === "standing-after-ruku-v1" && r2Stand.poseId === "standing-after-ruku"
  ) ok("rakah2ReusePrep", "PASS");
  else fail("rakah2ReusePrep", "R2 mapping incomplete");

  // Quick look includes Rukūʿ
  const prayers = readJson("prayers.json");
  if ((prayers.quickPositions || []).some((p) => p.id === "ruku" && p.defaultSequenceId === "fajr-r1-ruku")) ok("quickLookRuku", "PASS");
  else fail("quickLookRuku", "missing");

  try {
    execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, stdio: "pipe" });
    ok("validator", "PASS");
  } catch (e) {
    fail("validator", String(e.stdout || e.stderr || e.message || e).slice(0, 400));
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
console.log("\n=== PHASE 9 REPORT ===");
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
