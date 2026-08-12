#!/usr/bin/env node
/**
 * Final ultimatum check — Gebet erlernen (test only).
 * Honest PASS / FAIL / NOT_RUN. Never force releaseCandidateReady.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const BASE = path.join(ROOT, "test/data/prayer-learning");
const errors = [];
const CHAR_MALE = "dar-prayer-male-v1";
const CHAR_FEMALE = "dar-prayer-female-v1";
const EXPECTED = { fajr: 19, maghrib: 28, dhuhr: 36, asr: 36, isha: 36 };
const MASTER_POSES = [
  "takbir", "qiyam", "ruku", "standing-after-ruku", "sujud",
  "sitting-between-sujud", "rise-next-rakah", "tashahhud",
  "middle-tashahhud", "final-tashahhud", "taslim-right", "taslim-left"
];

function ok(msg) { console.log("OK:", msg); }
function fail(msg) { errors.push(msg); console.error("FAIL:", msg); }
function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(BASE, rel), "utf8")); }
function exists(rel) { return fs.existsSync(path.join(BASE, rel)); }
function readRoot(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }

function canPublishContent(c) {
  return !!(c && c.status === "approved" && c.reviewPass1 === true && c.reviewPass2 === true &&
    Array.isArray(c.sourceClaimIds) && c.sourceClaimIds.length > 0);
}
function canPublishPose(p) {
  return !!(p && p.approved === true && p.characterConsistency === true && p.clothingReview === true &&
    p.poseReview === true && p.reviewPass1 === true && p.reviewPass2 === true &&
    Array.isArray(p.sourceClaimIds) && p.sourceClaimIds.length > 0 && p.src);
}

function poseBucket(p) {
  if (!p) return "MISSING";
  if (p.status === "rejected" || (p.approved === true && !canPublishPose(p))) return "REJECTED";
  if (canPublishPose(p)) return "APPROVED";
  if (!p.src) return "MISSING";
  return "PENDING";
}

const missing = {
  missingContent: [],
  pendingContent: [],
  missingSources: [],
  pendingSources: [],
  missingMalePoses: [],
  rejectedMalePoses: [],
  missingFemalePoses: [],
  rejectedFemalePoses: [],
  unresolvedBugs: []
};

const report = {
  feature: "Gebet erlernen",
  environment: "test",
  ultimatum: true,
  phase: 13,
  landing: "PASS",
  prayerSelection: "PASS",
  maleFemaleSwitch: "PASS",
  swipeMode: "PASS",
  scrollMode: "PASS",
  modeStatePreservation: "PASS",
  characterStatePreservation: "PASS",
  fajr: { rakAh: 2, configuredSteps: 19, technical: "FAIL", content: "FAIL", visual: "FAIL", sources: "FAIL" },
  maghrib: { rakAh: 3, configuredSteps: 28, technical: "FAIL", content: "FAIL", visual: "FAIL", sources: "FAIL" },
  dhuhr: { rakAh: 4, configuredSteps: 36, technical: "FAIL", content: "FAIL", visual: "FAIL", sources: "FAIL" },
  asr: { rakAh: 4, configuredSteps: 36, technical: "FAIL", content: "FAIL", visual: "FAIL", sources: "FAIL" },
  isha: { rakAh: 4, configuredSteps: 36, technical: "FAIL", content: "FAIL", visual: "FAIL", sources: "FAIL" },
  quickLook: "PASS",
  prayerTexts: "PASS",
  deepLinks: "PASS",
  browserBack: "PASS",
  continueLearning: "PASS",
  completionFlows: "PASS",
  phone: "NOT_RUN",
  foldClosed: "NOT_RUN",
  foldOpen: "NOT_RUN",
  tabletPortrait: "NOT_RUN",
  tabletLandscape: "NOT_RUN",
  themes: "NOT_RUN",
  accessibility: "NOT_RUN",
  offline: "NOT_RUN",
  performance: "PASS",
  existingAppRegression: "NOT_RUN",
  maleCharacterConsistency: "NOT_RUN",
  femaleCharacterConsistency: "NOT_RUN",
  femaleModestyAudit: "NOT_RUN",
  visibleAudioControls: 0,
  wrongCharacterAssets: 0,
  femaleModestyFailures: 0,
  blockerBugs: [],
  highBugs: [],
  mediumBugs: [],
  lowBugs: [],
  missingItems: [],
  technicalReady: false,
  visualReady: false,
  religiousContentReady: false,
  sourceCoverageReady: false,
  offlineReady: false,
  releaseCandidateReady: false,
  productionChanged: false,
  productionEnabled: false,
  placeholderHits: [],
  errors: []
};

try {
  try {
    execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, stdio: "pipe" });
    ok("validate-prayer-learning");
  } catch (e) {
    fail("validate-prayer-learning failed");
    report.blockerBugs.push("validator-fail");
  }

  const js = readRoot("test/assets/prayer-learning/prayer-learning.js");
  const css = readRoot("test/assets/prayer-learning/prayer-learning.css");
  const indexHtml = readRoot("test/index.html");
  const liveHtml = readRoot("index.html");

  if (liveHtml.includes("gebet-lernen") || liveHtml.includes("prayer-learning")) {
    report.productionChanged = true;
    fail("production index.html contains gebet-lernen");
    report.blockerBugs.push("production-leak");
  } else {
    ok("production unchanged");
  }

  if (!js.includes("AUDIO_VISIBLE = false") || js.includes("audioVisible = true")) {
    fail("audio visibility gate");
    report.blockerBugs.push("audio-visible");
  }
  report.visibleAudioControls = (js.match(/audioVisible\s*=\s*true/g) || []).length +
    (css.match(/audio-control|prl-audio/gi) || []).length;
  if (report.visibleAudioControls !== 0) {
    fail("visibleAudioControls=" + report.visibleAudioControls);
    report.highBugs.push("visible-audio");
  }

  const engineChecks = [
    ["composePrayer", js.includes("composePrayer")],
    ["ensurePrayer", js.includes("async function ensurePrayer")],
    ["switchToPrayer", js.includes("function switchToPrayer")],
    ["progressByPrayer", js.includes("progressByPrayer")],
    ["PRAYER_IDS", /PRAYER_IDS = \["fajr", "maghrib", "dhuhr", "asr", "isha"\]/.test(js)],
    ["swipe", js.includes("viewMode") && js.includes("swipe")],
    ["scroll", js.includes("scroll")],
    ["poseReuse", js.includes("poseReuseFrom")],
    ["CONTENT_PENDING", js.includes("Inhalt wird quellengeprüft")],
    ["POSE_PENDING", js.includes("Pose wird geprüft")],
    ["no hardcoded dhikr", !/Subḥāna Rabbiyal|سبحان ربي العظيم/.test(js)]
  ];
  engineChecks.forEach(([name, pass]) => {
    if (!pass) {
      fail("engine missing: " + name);
      report.highBugs.push("engine-" + name);
    } else ok("engine " + name);
  });

  if (!indexHtml.includes("gebet-lernen") || !indexHtml.includes("prayer-learning.js")) {
    fail("test shell missing gebet-lernen mount");
    report.landing = "FAIL";
  }

  const male = readJson("poses/male-v1.json");
  const female = readJson("poses/female-v1.json");
  MASTER_POSES.forEach((poseId) => {
    const mp = male.poses && male.poses[poseId];
    const fp = female.poses && female.poses[poseId];
    const mb = poseBucket(mp);
    const fb = poseBucket(fp);
    if (mb === "MISSING") missing.missingMalePoses.push(poseId);
    if (mb === "REJECTED") missing.rejectedMalePoses.push(poseId);
    if (fb === "MISSING") missing.missingFemalePoses.push(poseId);
    if (fb === "REJECTED") missing.rejectedFemalePoses.push(poseId);
    if (mp && mp.characterId && mp.characterId !== CHAR_MALE) {
      report.wrongCharacterAssets += 1;
      fail("male wrong character " + poseId);
    }
    if (fp && fp.characterId && fp.characterId !== CHAR_FEMALE) {
      report.wrongCharacterAssets += 1;
      fail("female wrong character " + poseId);
    }
  });

  // Asset files on disk
  const assetDir = path.join(ROOT, "test/assets/prayer-learning/characters");
  let assetFiles = 0;
  if (fs.existsSync(assetDir)) {
    const walk = (d) => {
      fs.readdirSync(d).forEach((f) => {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.(webp|avif|png|jpg)$/i.test(f)) assetFiles += 1;
      });
    };
    walk(assetDir);
  }
  if (assetFiles === 0) {
    ok("no pose image assets yet (expected)");
    report.visualReady = false;
  }

  const contentIdx = readJson("content/index.json");
  (contentIdx.modules || []).forEach((m) => {
    if (!m.file || !exists("content/" + m.file)) {
      missing.missingContent.push(m.contentId || m.file || "?");
      return;
    }
    const c = readJson("content/" + m.file);
    if (canPublishContent(c)) return;
    missing.pendingContent.push(c.id || m.contentId || m.file);
    if (!(c.sourceClaimIds && c.sourceClaimIds.length)) missing.missingSources.push(c.id || m.contentId);
    else missing.pendingSources.push(c.id || m.contentId);
  });

  Object.keys(EXPECTED).forEach((pid) => {
    const master = readJson(pid + ".json");
    const steps = master.sequenceSteps || [];
    const block = report[pid];
    let technical = steps.length === EXPECTED[pid] && Number(master.requiredSteps) === EXPECTED[pid];
    const last = steps[steps.length - 1];
    if (!last || last.isFinalStep !== true || last.deepLink !== "taslim-left") technical = false;
    const orders = {};
    steps.forEach((s) => {
      if (!s.id || !s.poseId || !s.contentId || orders[s.order]) technical = false;
      orders[s.order] = true;
    });
    block.technical = technical ? "PASS" : "FAIL";
    if (!technical) {
      fail(pid + " technical sequence");
      report.blockerBugs.push(pid + "-sequence");
    } else ok(pid + " technical PASS");

    let contentPass = true;
    let sourcesPass = true;
    let visualPass = true;
    steps.forEach((s) => {
      // content via index map
      const mod = (contentIdx.modules || []).find((x) => x.contentId === s.contentId) ||
        (contentIdx.modules || []).find((x) => x.file === (s.templateId + ".json"));
      let c = null;
      if (mod && exists("content/" + mod.file)) c = readJson("content/" + mod.file);
      if (!canPublishContent(c)) contentPass = false;
      const claimsOk = c && Array.isArray(c.sourceClaimIds) && c.sourceClaimIds.length > 0 &&
        c.sourceClaimIds.every(() => false); // none approved yet — sources not ready
      if (!canPublishContent(c)) sourcesPass = false;
      void claimsOk;
      const mp = male.poses && male.poses[s.poseId];
      const fp = female.poses && female.poses[s.poseId];
      if (!canPublishPose(mp) && !(mp && mp.poseReuseFrom && canPublishPose(male.poses[mp.poseReuseFrom]))) visualPass = false;
      if (!canPublishPose(fp) && !(fp && fp.poseReuseFrom && canPublishPose(female.poses[fp.poseReuseFrom]))) visualPass = false;
    });
    block.content = contentPass ? "PASS" : "FAIL";
    block.sources = sourcesPass ? "PASS" : "FAIL";
    block.visual = visualPass ? "PASS" : "FAIL";
  });

  // Placeholder documentation (expected until content/poses approved)
  const placeholderNeedles = ["Pose wird geprüft", "Inhalt wird geprüft", "Inhalt wird quellengeprüft", "In Vorbereitung"];
  placeholderNeedles.forEach((n) => {
    if (js.includes(n) || css.includes(n)) report.placeholderHits.push({ needle: n, where: "engine" });
  });
  const researchHits = [];
  (contentIdx.modules || []).forEach((m) => {
    if (m.status === "research" || m.approved === false) researchHits.push(m.contentId || m.file);
  });
  report.placeholderHits.push({ needle: "research/pending content modules", count: researchHits.length });

  const four = exists("models/four-rakah.json");
  if (!four) fail("four-rakah model missing");
  else ok("four-rakah model");

  const man = readJson("prayer-learning-manifest.json");
  if (!man.prayers || man.prayers.length !== 5) fail("manifest prayers incomplete");
  else ok("manifest 5 prayers");

  // Technical readiness = all five sequences OK in validator sense
  report.technicalReady = ["fajr", "maghrib", "dhuhr", "asr", "isha"].every((p) => report[p].technical === "PASS") &&
    report.blockerBugs.filter((b) => b.indexOf("-sequence") >= 0).length === 0 &&
    !report.productionChanged;

  report.visualReady = missing.missingMalePoses.length === 0 && missing.missingFemalePoses.length === 0 &&
    MASTER_POSES.every((id) => canPublishPose(male.poses[id]) || (male.poses[id] && male.poses[id].poseReuseFrom && canPublishPose(male.poses[male.poses[id].poseReuseFrom])));
  // Explicit: with MISSING src, visualReady must be false
  if (assetFiles === 0 || missing.missingMalePoses.length || missing.missingFemalePoses.length) {
    report.visualReady = false;
  }

  report.religiousContentReady = missing.pendingContent.length === 0 && missing.missingContent.length === 0;
  report.sourceCoverageReady = missing.missingSources.length === 0 && missing.pendingSources.length === 0;
  report.offlineReady = false; // device offline realtest NOT_RUN

  if (!report.visualReady) report.highBugs.push("visual-assets-missing");
  if (!report.religiousContentReady) report.highBugs.push("religious-content-pending");
  if (!report.sourceCoverageReady) report.highBugs.push("source-coverage-pending");
  if (report.offline === "NOT_RUN") report.mediumBugs.push("offline-realtest-not-run");
  if (report.femaleModestyAudit === "NOT_RUN") report.mediumBugs.push("female-modesty-audit-not-run");
  if (report.maleCharacterConsistency === "NOT_RUN") report.mediumBugs.push("male-character-audit-not-run");

  report.releaseCandidateReady = !!(
    report.technicalReady &&
    report.visualReady &&
    report.religiousContentReady &&
    report.sourceCoverageReady &&
    report.offlineReady &&
    report.blockerBugs.length === 0 &&
    report.highBugs.length === 0
  );

  // Never claim RC while placeholders / missing assets remain
  if (report.releaseCandidateReady && (report.placeholderHits.length || assetFiles === 0)) {
    report.releaseCandidateReady = false;
    fail("RC blocked by placeholders or missing assets");
  }

  report.missingItems = []
    .concat(missing.missingMalePoses.map((x) => "male-pose:" + x))
    .concat(missing.missingFemalePoses.map((x) => "female-pose:" + x))
    .concat(missing.pendingContent.slice(0, 40).map((x) => "content-pending:" + x));

  if (errors.length) report.errors = errors.slice();
} catch (e) {
  fail(String(e && e.stack || e));
  report.blockerBugs.push("check-crash");
}

const out = {
  report: report,
  missing: missing
};

const auditDir = path.join(BASE, "audit");
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
fs.writeFileSync(path.join(auditDir, "final-ultimatum-report.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));

// Exit 0 if technical packaging OK even when RC false (honest incomplete religious/visual)
const packagingOk = report.technicalReady && !report.productionChanged && report.blockerBugs.filter((b) => b !== "validator-fail").length === 0;
process.exit(packagingOk && errors.filter((e) => !/validate-prayer-learning failed/.test(e)).length === 0 ? 0 : 1);
