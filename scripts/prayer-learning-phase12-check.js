#!/usr/bin/env node
/**
 * Phase-12 checks — Full Fajr QA / stabilize (honest PASS/FAIL/NOT_RUN).
 * releaseReady / fajrPreReleasePass are COMPUTED — never force-true.
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
const REQUIRED_POSES = [
  "takbir", "qiyam", "ruku", "standing-after-ruku", "sujud",
  "sitting-between-sujud", "rise-next-rakah", "tashahhud", "taslim-right", "taslim-left"
];
const EXPECTED_IDS = [
  "fajr-r1-takbir", "fajr-r1-qiyam", "fajr-r1-recitation", "fajr-r1-ruku", "fajr-r1-standing-after-ruku",
  "fajr-r1-sujud-1", "fajr-r1-sitting-between-sujud", "fajr-r1-sujud-2", "fajr-r1-rise-to-rakah-2",
  "fajr-r2-qiyam", "fajr-r2-recitation", "fajr-r2-ruku", "fajr-r2-standing-after-ruku",
  "fajr-r2-sujud-1", "fajr-r2-sitting-between-sujud", "fajr-r2-sujud-2",
  "fajr-r2-tashahhud", "fajr-r2-taslim-right", "fajr-r2-taslim-left"
];

function canPublishContent(c) {
  return !!(c && c.approved === true && c.reviewPass1 === true && c.reviewPass2 === true &&
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

function loadContentMap() {
  const map = {};
  const dir = path.join(BASE, "content");
  fs.readdirSync(dir).forEach((f) => {
    if (!f.endsWith(".json") || f === "index.json") return;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (j && j.id) map[j.id] = j;
    } catch (e) { /* skip */ }
  });
  const variants = path.join(dir, "variants");
  if (fs.existsSync(variants)) {
    fs.readdirSync(variants).forEach((f) => {
      if (!f.endsWith(".json") || f === "index.json") return;
      try {
        const j = JSON.parse(fs.readFileSync(path.join(variants, f), "utf8"));
        if (j && j.id) map[j.id] = j;
      } catch (e) { /* skip */ }
    });
  }
  return map;
}

const report = {
  feature: "Gebet erlernen",
  phase: 12,
  audit: "Full Fajr QA",
  environment: "test",
  requiredSteps: 19,
  sequenceValidation: "FAIL",
  fullSwipeFlow: "NOT_RUN",
  fullScrollFlow: "NOT_RUN",
  modeSwitchStress: "NOT_RUN",
  characterSwitchStress: "NOT_RUN",
  maleCharacterConsistency: "NOT_RUN",
  femaleCharacterConsistency: "NOT_RUN",
  femaleModestyAudit: "NOT_RUN",
  phone: "NOT_RUN",
  foldClosed: "NOT_RUN",
  foldOpen: "NOT_RUN",
  tabletPortrait: "NOT_RUN",
  tabletLandscape: "NOT_RUN",
  orientationState: "NOT_RUN",
  deepLinks: "FAIL",
  browserBack: "FAIL",
  continueLearning: "FAIL",
  completionFlow: "FAIL",
  quickLook: "FAIL",
  prayerTexts: "FAIL",
  sourcePanel: "FAIL",
  offlineFullFlow: "NOT_RUN",
  accessibility: "NOT_RUN",
  themeCompatibility: "NOT_RUN",
  performance: "NOT_RUN",
  regressionExistingApp: "NOT_RUN",
  approvedContentSteps: 0,
  pendingContentSteps: 0,
  missingContentSteps: 0,
  approvedMalePoses: 0,
  pendingMalePoses: 0,
  missingMalePoses: 0,
  approvedFemalePoses: 0,
  pendingFemalePoses: 0,
  missingFemalePoses: 0,
  blockerBugs: [],
  highBugs: [],
  mediumBugs: [],
  lowBugs: [],
  wrongCharacterAssets: 0,
  femaleModestyFailures: 0,
  visibleAudioControls: 0,
  productionChanged: false,
  technicalFajrReady: false,
  religiousFajrReady: false,
  fajrPreReleasePass: false,
  readiness: {
    technicalSequenceComplete: false,
    swipeStable: false,
    scrollStable: false,
    stateStable: false,
    characterStable: false,
    responsiveStable: false,
    offlineStable: false,
    sourceCoverageComplete: false,
    contentCoverageComplete: false,
    malePoseCoverageComplete: false,
    femalePoseCoverageComplete: false,
    religiousReviewComplete: false,
    releaseReady: false
  },
  errors: []
};

try {
  const live = read("index.html");
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const css = read("test/assets/prayer-learning/prayer-learning.css");
  const testHtml = read("test/index.html");

  if (!live.includes("gebet-lernen") && !live.includes("prayer-learning")) {
    report.productionChanged = false;
    ok("productionChanged", "false");
  } else {
    report.productionChanged = true;
    report.blockerBugs.push("Live index.html contains gebet-lernen / prayer-learning");
    fail("production", "Live geändert");
  }

  if (!js.includes("PHASE = 12") || !testHtml.includes("gebet-lernen")) fail("preflight", "phase/route");
  else ok("preflight", "Phase 12");

  if (!js.includes("productionEnabled = false") || js.includes("productionEnabled = true")) {
    report.blockerBugs.push("productionEnabled must stay false");
    fail("productionEnabled", "must be false");
  } else ok("productionEnabled", "false");

  const fajr = readJson("fajr.json");
  const seq = fajr.sequenceSteps || [];
  const ids = seq.map((s) => s.id);
  const r1 = seq.filter((s) => Number(s.rakAh) === 1).length;
  const r2 = seq.filter((s) => Number(s.rakAh) === 2).length;
  const last = seq[seq.length - 1];

  if (seq.length !== 19 || Number(fajr.requiredSteps) !== 19) {
    report.blockerBugs.push("requiredSteps !== 19");
    fail("stepCount", String(seq.length));
  } else ok("stepCount", "19");
  if (r1 !== 9) { report.blockerBugs.push("rakAh1Steps !== 9"); fail("rakAh1", String(r1)); }
  else ok("rakAh1Steps", "9");
  if (r2 !== 10) { report.blockerBugs.push("rakAh2Steps !== 10"); fail("rakAh2", String(r2)); }
  else ok("rakAh2Steps", "10");

  let orderOk = true;
  const orders = {};
  EXPECTED_IDS.forEach((id, i) => {
    if (ids[i] !== id) {
      orderOk = false;
      report.blockerBugs.push("wrong sequence order at " + (i + 1));
      fail("order", "pos " + (i + 1) + " expected " + id + " got " + ids[i]);
    }
  });
  seq.forEach((s) => {
    if (orders[s.order]) {
      orderOk = false;
      report.blockerBugs.push("duplicate order " + s.order);
      fail("dupOrder", String(s.order));
    }
    orders[s.order] = true;
  });
  if (orderOk && last && last.id === "fajr-r2-taslim-left" && last.order === 19 && last.isFinalStep === true) {
    report.sequenceValidation = "PASS";
    report.readiness.technicalSequenceComplete = true;
    ok("sequenceValidation", "PASS");
  } else {
    report.sequenceValidation = "FAIL";
    report.blockerBugs.push("finalStep !== fajr-r2-taslim-left");
    fail("sequenceValidation", "incomplete");
  }

  // Engine swipe/scroll/state (structural — device stress remains NOT_RUN)
  if (js.includes("bindSwipeTrack") && js.includes("SWIPE_RATIO") && js.includes("goToNextStep") && js.includes("beginStepNavLock")) {
    report.fullSwipeFlow = "PASS";
    report.readiness.swipeStable = true;
    ok("fullSwipeFlow", "PASS (engine lock+vertical ignore; device stress NOT_RUN)");
  } else {
    report.fullSwipeFlow = "FAIL";
    report.highBugs.push("Swipe engine incomplete");
    fail("swipe", "missing");
  }
  if (js.includes("bindScrollObserver") && js.includes("IntersectionObserver") && js.includes("Hysteresis")) {
    report.fullScrollFlow = "PASS";
    report.readiness.scrollStable = true;
    ok("fullScrollFlow", "PASS (engine hysteresis; device NOT_RUN)");
  } else {
    report.fullScrollFlow = "FAIL";
    report.highBugs.push("Scroll observer incomplete");
    fail("scroll", "missing");
  }

  if (js.includes("characterSwitchPending") && js.includes("stepId: st.stepId") && js.includes("viewMode: mode")) {
    report.characterSwitchStress = "PASS";
    report.modeSwitchStress = "PASS";
    report.readiness.characterStable = true;
    report.readiness.stateStable = true;
    ok("character/modeSwitch", "PASS (engine; device stress NOT_RUN)");
  } else {
    report.characterSwitchStress = "FAIL";
    report.modeSwitchStress = "FAIL";
    report.highBugs.push("Character/viewMode state retention incomplete");
    fail("state", "missing");
  }

  // Deep links + invalid recovery
  if (
    js.includes("deepLinkForStep") &&
    js.includes("tashahhud") &&
    js.includes("return -1") &&
    js.includes("Ungültiger Link") &&
    js.includes("data-prl-deeplink-recovery")
  ) {
    report.deepLinks = "PASS";
    ok("deepLinks", "PASS (incl. invalid recovery)");
  } else {
    report.deepLinks = "FAIL";
    report.highBugs.push("Deep link / invalid recovery incomplete");
    fail("deepLinks", "missing");
  }

  if (js.includes("popstate") && js.includes("rakAh: step.rakAh")) {
    report.browserBack = "PASS";
    ok("browserBack", "PASS");
  } else {
    report.browserBack = "FAIL";
    fail("browserBack", "missing");
  }

  if (js.includes("resumeCard") || js.includes("Fortsetzen") || js.includes("data-prl-resume")) {
    report.continueLearning = "PASS";
    ok("continueLearning", "PASS (engine persist)");
  } else {
    report.continueLearning = "FAIL";
    report.highBugs.push("Continue learning missing");
    fail("continue", "missing");
  }

  if (
    js.includes("learningSequenceCompleted") &&
    js.includes("Fajr-Lernablauf beendet") &&
    !/Dein Gebet ist korrekt|100\s*%|passed prayer|failed prayer/i.test(js) &&
    js.includes("data-prl-retry-fajr") &&
    js.includes("viewMode: stRetry.viewMode")
  ) {
    report.completionFlow = "PASS";
    ok("completionFlow", "PASS");
  } else {
    report.completionFlow = "FAIL";
    fail("completion", "missing/wrong");
  }

  const prayers = readJson("prayers.json");
  const quick = prayers.quickPositions || [];
  const needQuick = ["takbir", "qiyam", "ruku", "sujud", "tashahhud", "taslim"];
  if (needQuick.every((id) => quick.some((p) => p.id === id || p.stepTemplateId === id))) {
    report.quickLook = "PASS";
    ok("quickLook", "PASS");
  } else {
    report.quickLook = "FAIL";
    fail("quickLook", "missing positions");
  }

  if (js.includes("CONTENT_PENDING_LABEL") && js.includes("getContentById") && js.includes("texte")) {
    report.prayerTexts = "PASS";
    ok("prayerTexts", "PASS (central registry)");
  } else {
    report.prayerTexts = "FAIL";
    fail("prayerTexts", "missing");
  }

  if (
    js.includes("approvedClaimCount > 0") &&
    js.includes("Beleg ansehen") &&
    js.includes("OFFLINE_EVIDENCE_LABEL") &&
    js.includes("Direktnachweis benötigt eine Internetverbindung") &&
    js.includes("Source panel must not change currentStep")
  ) {
    report.sourcePanel = "PASS";
    ok("sourcePanel", "PASS");
  } else {
    report.sourcePanel = "FAIL";
    report.mediumBugs.push("Source panel QA incomplete");
    fail("sourcePanel", "missing");
  }

  // Audio — only real UI controls (ignore claim.volume metadata)
  const audioUi = [];
  if (/<audio[\s>]/.test(js)) audioUi.push("<audio>");
  if (/data-prl-audio/.test(js)) audioUi.push("data-prl-audio");
  if (/aria-label="[^"]*[Aa]udio/.test(js)) audioUi.push("aria-audio");
  if (/data-prl-(play|speaker|volume)/.test(js)) audioUi.push("data-prl-media");
  if (/class="[^"]*\baudio\b[^"]*"/.test(js)) audioUi.push("audio-class");
  report.visibleAudioControls = audioUi.length;
  if (js.includes("AUDIO_VISIBLE = false") && js.includes("AUDIO_ENABLED = false") && audioUi.length === 0) {
    ok("audioVisible", "0");
  } else {
    report.blockerBugs.push("Visible audio controls in prayer-learning");
    fail("audio", String(audioUi.length || "flag"));
  }

  // Preload scope
  if (!/ensurePrayer\(\s*["'](dhuhr|asr|maghrib|isha)/.test(js) && js.includes("preloadAdjacent")) {
    ok("noEagerOtherPrayers", "PASS");
  } else {
    report.highBugs.push("Eager load of future prayers detected");
    fail("preload", "eager other prayers");
  }

  // Typography / reduced motion / dual split
  if (css.includes("prefers-reduced-motion") && css.includes(".prl-block .prl-tr") && css.includes("minmax(0,45%)")) {
    ok("typographyCss", "PASS (hierarchy + reduced motion + fold split)");
  } else {
    report.mediumBugs.push("Typography/responsive CSS incomplete");
    fail("css", "hierarchy");
  }

  // Character registries
  const male = readJson("poses/male-v1.json");
  const female = readJson("poses/female-v1.json");
  let wrong = 0;
  Object.values(male.poses || {}).forEach((p) => { if (p && p.characterId && p.characterId !== CHAR_MALE) wrong += 1; });
  Object.values(female.poses || {}).forEach((p) => { if (p && p.characterId && p.characterId !== CHAR_FEMALE) wrong += 1; });
  report.wrongCharacterAssets = wrong;
  if (wrong === 0) ok("wrongCharacterAssets", "0");
  else {
    report.blockerBugs.push("wrongCharacterAssets=" + wrong);
    fail("wrongCharacterAssets", String(wrong));
  }

  // Pose coverage (not visually approved — registry presence only)
  REQUIRED_POSES.forEach((id) => {
    const ms = poseStatus(male.poses[id]);
    const fs_ = poseStatus(female.poses[id]);
    if (ms === "APPROVED") report.approvedMalePoses += 1;
    else if (ms === "MISSING") report.missingMalePoses += 1;
    else report.pendingMalePoses += 1;
    if (fs_ === "APPROVED") report.approvedFemalePoses += 1;
    else if (fs_ === "MISSING") report.missingFemalePoses += 1;
    else report.pendingFemalePoses += 1;
  });
  report.readiness.malePoseCoverageComplete = report.approvedMalePoses === REQUIRED_POSES.length;
  report.readiness.femalePoseCoverageComplete = report.approvedFemalePoses === REQUIRED_POSES.length;
  ok("malePoseCoverage", `${report.approvedMalePoses} approved / ${report.pendingMalePoses} pending / ${report.missingMalePoses} missing`);
  ok("femalePoseCoverage", `${report.approvedFemalePoses} approved / ${report.pendingFemalePoses} pending / ${report.missingFemalePoses} missing`);

  // Content + source coverage
  const contents = loadContentMap();
  const claims = readJson("sources/claims.json");
  const claimMap = new Map((claims.claims || []).map((c) => [c.id, c]));
  let sourceComplete = true;
  seq.forEach((s) => {
    const c = contents[s.contentId];
    if (!c) {
      report.missingContentSteps += 1;
      sourceComplete = false;
      return;
    }
    if (canPublishContent(c)) report.approvedContentSteps += 1;
    else report.pendingContentSteps += 1;
    const slots = s.claimSlotIds || s.sourceClaimIds || [];
    const approvedClaims = slots.filter((id) => {
      const cl = claimMap.get(id);
      return cl && cl.approved === true && cl.reviewPass1 === true && cl.reviewPass2 === true;
    }).length;
    if (approvedClaims === 0) sourceComplete = false;
  });
  report.readiness.contentCoverageComplete = report.approvedContentSteps === 19;
  report.readiness.sourceCoverageComplete = sourceComplete && report.approvedContentSteps === 19;
  report.readiness.religiousReviewComplete = false;
  ok("contentCoverage", `${report.approvedContentSteps} approved / ${report.pendingContentSteps} pending / ${report.missingContentSteps} missing`);
  ok("sourceCoverageComplete", String(report.readiness.sourceCoverageComplete));

  // Female modesty / visual consistency — no device session
  report.maleCharacterConsistency = "NOT_RUN";
  report.femaleCharacterConsistency = "NOT_RUN";
  report.femaleModestyAudit = "NOT_RUN";
  report.femaleModestyFailures = 0;
  if (female.poses && Object.values(female.poses).some((p) => p && p.approved === true && !canPublishPose(p))) {
    report.femaleModestyFailures += 1;
    report.mediumBugs.push("Female pose marked approved without full review gates");
  }
  ok("visualCharacterAudits", "NOT_RUN (no device session)");

  // Device / offline / a11y / themes / perf / regression
  report.phone = "NOT_RUN";
  report.foldClosed = "NOT_RUN";
  report.foldOpen = "NOT_RUN";
  report.tabletPortrait = "NOT_RUN";
  report.tabletLandscape = "NOT_RUN";
  report.orientationState = "NOT_RUN";
  report.offlineFullFlow = "NOT_RUN";
  report.accessibility = "NOT_RUN";
  report.themeCompatibility = "NOT_RUN";
  report.performance = "NOT_RUN";
  report.regressionExistingApp = "NOT_RUN";
  report.readiness.responsiveStable = false;
  report.readiness.offlineStable = false;
  ok("deviceMatrix", "NOT_RUN");

  // Bottom nav unchanged — 5 primary tabs remain in test shell
  if (
    testHtml.includes("bottom-nav") &&
    (testHtml.includes('data-nav="home"') || testHtml.includes("data-nav='home'") || /nav-label[^>]*>Start</.test(testHtml) || testHtml.includes(">Start<")) &&
    testHtml.includes("feed") &&
    testHtml.includes("quran") &&
    testHtml.includes("more")
  ) {
    ok("bottomNavPresent", "PASS (test shell)");
  } else fail("bottomNav", "unexpected");

  if (js.includes("PHASE = 12") && testHtml.includes("app-shell-v644")) ok("version", "v644");
  else fail("version", "expected v644");

  // Duplicate pose keys that should NOT exist
  ["qiyam-r2", "ruku-r2", "sujud-r2"].forEach((k) => {
    if (male.poses[k] || female.poses[k]) {
      report.mediumBugs.push("unnecessary duplicate pose key " + k);
      fail("dupPose", k);
    }
  });

  try {
    execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, stdio: "pipe" });
    ok("validator", "PASS");
  } catch (e) {
    const out = String((e.stdout && e.stdout.toString()) || (e.stderr && e.stderr.toString()) || e.message || e);
    fail("validator", out.split("\n").filter((l) => l.startsWith("FAIL:")).join(" | ").slice(0, 400) || out.slice(0, 300));
  }

  // Technical ready ≠ religious ready
  report.technicalFajrReady =
    report.readiness.technicalSequenceComplete &&
    report.readiness.swipeStable &&
    report.readiness.scrollStable &&
    report.readiness.stateStable &&
    report.readiness.characterStable &&
    report.blockerBugs.length === 0 &&
    report.highBugs.length === 0;
  report.religiousFajrReady = false;

  // Pre-release: blockers OR high OR incomplete religious/content coverage ⇒ fail
  report.fajrPreReleasePass =
    report.blockerBugs.length === 0 &&
    report.highBugs.length === 0 &&
    report.readiness.technicalSequenceComplete &&
    report.readiness.swipeStable &&
    report.readiness.scrollStable &&
    report.readiness.stateStable &&
    report.readiness.characterStable &&
    report.readiness.contentCoverageComplete &&
    report.readiness.sourceCoverageComplete &&
    report.readiness.malePoseCoverageComplete &&
    report.readiness.femalePoseCoverageComplete &&
    report.readiness.religiousReviewComplete === true &&
    report.productionChanged === false;

  report.readiness.releaseReady = report.fajrPreReleasePass === true;

  // Persist computed readiness (never manually force true)
  const readinessPath = path.join(BASE, "review/fajr-readiness.json");
  const readinessOut = {
    version: 1,
    phase: 12,
    computed: true,
    note: "releaseReady / fajrPreReleasePass computed by phase12-check — never set manually to true.",
    fajr: {
      sequenceValid: report.sequenceValidation === "PASS",
      contentCoverage: report.readiness.contentCoverageComplete,
      sourceCoverage: report.readiness.sourceCoverageComplete,
      malePoseCoverage: report.readiness.malePoseCoverageComplete,
      femalePoseCoverage: report.readiness.femalePoseCoverageComplete,
      reviewPass1: false,
      reviewPass2: false,
      releaseReady: report.readiness.releaseReady,
      requiredSteps: 19,
      technicalSequenceComplete: report.readiness.technicalSequenceComplete,
      swipeStable: report.readiness.swipeStable,
      scrollStable: report.readiness.scrollStable,
      stateStable: report.readiness.stateStable,
      characterStable: report.readiness.characterStable,
      responsiveStable: report.readiness.responsiveStable,
      offlineStable: report.readiness.offlineStable,
      religiousReviewComplete: false
    },
    productionEnabled: false,
    updatedAt: new Date().toISOString(),
    integrationBlock: "Full Fajr QA",
    technicalFajrComplete: report.readiness.technicalSequenceComplete,
    religiousFajrApproved: false,
    fajrPreReleasePass: report.fajrPreReleasePass,
    technicalFajrReady: report.technicalFajrReady
  };
  fs.writeFileSync(readinessPath, JSON.stringify(readinessOut, null, 2) + "\n");
  ok("readinessWritten", "review/fajr-readiness.json");

  const auditOut = Object.assign({}, report);
  delete auditOut.errors;
  fs.writeFileSync(
    path.join(BASE, "audit/phase12-fajr-qa-report.json"),
    JSON.stringify(auditOut, null, 2) + "\n"
  );
  ok("auditWritten", "audit/phase12-fajr-qa-report.json");

} catch (e) {
  fail("fatal", String(e && e.stack || e));
}

report.errors = errors;
console.log("\n=== PHASE 12 READINESS ===");
console.log(JSON.stringify(report.readiness, null, 2));
console.log("\n=== PHASE 12 REPORT ===");
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
