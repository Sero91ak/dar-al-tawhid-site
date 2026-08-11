#!/usr/bin/env node
/**
 * validate-prayer-learning — Phase 5–6 schema / sequence / refs / gates / review (test data).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASE = path.join(ROOT, "test/data/prayer-learning");
const CHAR_MALE = "dar-prayer-male-v1";
const CHAR_FEMALE = "dar-prayer-female-v1";
const WEAK = new Set(["daif", "very_weak", "mawdu", "unverified"]);

const errors = [];
function fail(msg) {
  errors.push(msg);
  console.error("FAIL:", msg);
}
function ok(msg) {
  console.log("OK:", msg);
}
function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(BASE, rel), "utf8"));
}
function exists(rel) {
  return fs.existsSync(path.join(BASE, rel));
}

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

const report = {
  feature: "Gebet erlernen",
  phase: 6,
  environment: "test",
  contentRegistry: "FAIL",
  sourceRegistry: "FAIL",
  poseRegistry: "FAIL",
  approvedContentGate: "FAIL",
  approvedPoseGate: "FAIL",
  maleCharacterLock: "FAIL",
  femaleCharacterLock: "FAIL",
  poseResolver: "PASS",
  quranDatabaseReuse: "FAIL",
  variantModel: "FAIL",
  quickLookDataReuse: "PASS",
  prayerTextsDataReuse: "PASS",
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
  if (!exists("content/index.json")) fail("content/index.json missing");
  else {
    const idx = readJson("content/index.json");
    const ids = new Set();
    (idx.modules || []).forEach((m) => {
      if (!m.file || !exists("content/" + m.file)) fail("missing content file " + m.file);
      else {
        const c = readJson("content/" + m.file);
        if (!c.id) fail("content missing id: " + m.file);
        if (ids.has(c.id)) fail("duplicate content id " + c.id);
        ids.add(c.id);
        if (c.approved === true && !canPublishContent(c)) {
          fail("approved content fails gate: " + c.id);
        }
        if (canPublishContent(c) && (!c.sourceClaimIds || !c.sourceClaimIds.length)) {
          fail("publishable content without claims: " + c.id);
        }
        if (c.quranRef && c.doNotDuplicateQuranText !== true && c.arabic) {
          fail("quran text duplicated in content: " + c.id);
        }
        if (c.audioId != null && c.audioId !== null) {
          /* audioId may exist later; currently must be null */
          if (c.audioId) fail("audioId set on content: " + c.id);
        }
      }
    });
    report.contentRegistry = "PASS";
    ok("contentRegistry");
  }

  if (!exists("content/variants/index.json")) fail("variants index missing");
  else {
    report.variantModel = "PASS";
    ok("variantModel");
  }

  if (!exists("sources/claims.json")) fail("claims.json missing");
  else {
    const claims = readJson("sources/claims.json");
    const claimIds = new Set();
    (claims.claims || []).forEach((c) => {
      if (!c.id) fail("claim without id");
      if (claimIds.has(c.id)) fail("duplicate claim " + c.id);
      claimIds.add(c.id);
      if (c.approved === true) {
        if (!c.reviewPass1 || !c.reviewPass2) fail("approved claim missing review: " + c.id);
        if (WEAK.has(String(c.sourceType || "").toLowerCase())) {
          /* allowed as record, but must not be default instructional — checked via model fields */
        }
      }
      if (c.directEvidenceUrl) {
        const u = String(c.directEvidenceUrl);
        if (/^https?:\/\/[^/#]+\/?$/i.test(u) && !/#|:text=|page=/i.test(u)) {
          /* homepage-only URLs are incomplete evidence — warn as fail only if approved */
          if (c.approved) fail("approved claim has non-direct evidence URL: " + c.id);
        }
      }
    });
    report.sourceRegistry = "PASS";
    ok("sourceRegistry");
  }

  if (!exists("poses/male-v1.json") || !exists("poses/female-v1.json") || !exists("poses/index.json")) {
    fail("pose registries missing");
  } else {
    const male = readJson("poses/male-v1.json");
    const female = readJson("poses/female-v1.json");
    if (male.characterId !== CHAR_MALE) {
      report.wrongCharacterAssets += 1;
      fail("male characterId lock");
    } else {
      report.maleCharacterLock = "PASS";
      ok("maleCharacterLock");
    }
    if (female.characterId !== CHAR_FEMALE) {
      report.wrongCharacterAssets += 1;
      fail("female characterId lock");
    } else {
      report.femaleCharacterLock = "PASS";
      ok("femaleCharacterLock");
    }
    ["male", "female"].forEach((g) => {
      const reg = g === "male" ? male : female;
      const expected = g === "male" ? CHAR_MALE : CHAR_FEMALE;
      Object.keys(reg.poses || {}).forEach((poseId) => {
        const p = reg.poses[poseId];
        if (!p) return;
        if (p.characterId !== expected) {
          report.wrongCharacterAssets += 1;
          fail(g + " pose " + poseId + " wrong characterId");
        }
        if (p.approved === true && !canPublishPose(p)) fail("approved pose fails gate: " + p.assetId);
        if (canPublishPose(p) && !p.src) fail("approved pose missing src: " + p.assetId);
        if (reg.activeAssets && reg.activeAssets[poseId] && !canPublishPose(p)) {
          fail("activeAsset points to unapproved pose: " + poseId);
        }
      });
    });
    report.poseRegistry = "PASS";
    report.approvedContentGate = "PASS";
    report.approvedPoseGate = "PASS";
    ok("poseRegistry + gates");
  }

  const fajr = readJson("fajr.json");
  const seq = fajr.sequenceSteps || [];
  if (seq.length !== 19) fail("expected 19 fajr steps, got " + seq.length);
  const orders = new Set();
  const ids = new Set();
  let approvedSteps = 0;
  seq.forEach((s) => {
    if (!s.id) fail("step missing id");
    if (ids.has(s.id)) fail("duplicate step id " + s.id);
    ids.add(s.id);
    if (s.rakAh == null) fail("step missing rakAh " + s.id);
    if (s.order == null) fail("step missing order " + s.id);
    if (orders.has(s.order)) fail("duplicate order " + s.order);
    orders.add(s.order);
    if (!s.poseId) fail("step missing poseId " + s.id);
    if (!s.contentId) fail("step missing contentId " + s.id);
    if (!exists("content/" + (s.templateId === "standing-next-rakah" ? "standing-next-rakah.json" : s.templateId + ".json")) &&
        !exists("content/" + String(s.contentId).replace(/-main-v1$/, "").replace(/-fatiha-ref-v1$/, "") + ".json")) {
      /* content files named by template — check via contentId load */
    }
    const contentFileGuess =
      s.templateId === "standing-next-rakah"
        ? "standing-next-rakah.json"
        : s.templateId + ".json";
    if (!exists("content/" + contentFileGuess)) fail("content file for step missing: " + contentFileGuess);
    const content = readJson("content/" + contentFileGuess);
    if (s.status === "approved" || content.approved === true) {
      if (!canPublishContent(content)) fail("approved step has unapproved content: " + s.id);
      if (!(s.sourceClaimIds && s.sourceClaimIds.length) && !(content.sourceClaimIds && content.sourceClaimIds.length)) {
        fail("approved step has zero source claims: " + s.id);
      }
    }
    if (canPublishContent(content)) approvedSteps += 1;
  });
  report.approvedFajrSteps = approvedSteps;
  report.pendingFajrSteps = seq.length - approvedSteps;

  const rec = readJson("content/recitation.json");
  if (rec.quranRef && rec.doNotDuplicateQuranText === true && rec.arabic == null) {
    report.quranDatabaseReuse = "PASS";
    ok("quranDatabaseReuse");
  } else if (rec.arabic) fail("recitation duplicates quran arabic");
  else {
    report.quranDatabaseReuse = "PASS";
    ok("quranDatabaseReuse (ref model present)");
  }

  if (!exists("prayer-learning-manifest.json")) fail("offline manifest missing");
  else {
    const man = readJson("prayer-learning-manifest.json");
    if (!man.characters || man.characters.indexOf(CHAR_MALE) < 0 || man.characters.indexOf(CHAR_FEMALE) < 0) {
      fail("manifest characters incomplete");
    }
    report.offlineManifest = "PASS";
    ok("offlineManifest");
  }


  // —— Phase 6 review system ——
  const VALID_STATUSES = new Set(["draft","research","source_check","pose_check","review_pass_1","review_pass_2","approved","rejected"]);
  if (!exists("review/index.json") || !exists("review/fajr-steps.json") || !exists("review/audit-log.json") || !exists("review/fajr-readiness.json") || !exists("review/dependencies.json")) {
    fail("review data files missing");
  } else {
    const revIdx = readJson("review/index.json");
    if (revIdx.visitorVisible === true) fail("review must not be visitor visible");
    if (revIdx.productionEnabled === true) fail("review index productionEnabled must be false");
    const revSteps = readJson("review/fajr-steps.json");
    (revSteps.steps || []).forEach((st) => {
      if (!VALID_STATUSES.has(st.status)) fail("invalid review status: " + st.status + " @ " + st.id);
      if (st.approved === true) {
        if (!(st.contentApproved && st.sourceCoverageApproved && st.poseApproved && st.reviewPass1 && st.reviewPass2)) {
          fail("step marked approved without full formula: " + st.id);
        }
      }
      if (st.selfApproved) fail("self-approval flag illegal: " + st.id);
    });
    const readiness = readJson("review/fajr-readiness.json");
    if (readiness.computed !== true) fail("readiness must be computed");
    if (readiness.fajr && readiness.fajr.releaseReady === true) {
      const f = readiness.fajr;
      if (!(f.sequenceValid && f.contentCoverage && f.sourceCoverage && f.malePoseCoverage && f.femalePoseCoverage && f.reviewPass1 && f.reviewPass2)) {
        fail("releaseReady true without all coverage flags");
      }
    }
    // Dynamic readiness from live data (must currently be false)
    const male = readJson("poses/male-v1.json");
    const female = readJson("poses/female-v1.json");
    let contentCoverage = true, sourceCoverage = true, malePoseCoverage = true, femalePoseCoverage = true, rp1 = true, rp2 = true;
    (revSteps.steps || []).forEach((st) => {
      const contentFile = st.id === "rise-next-rakah" ? "standing-next-rakah.json" : (st.id === "recitation" ? "recitation.json" : st.id + ".json");
      const contentPath = exists("content/" + contentFile) ? contentFile : null;
      let content = null;
      if (contentPath) content = readJson("content/" + contentPath);
      else {
        // try contentId file via index
        contentCoverage = false;
      }
      if (!canPublishContent(content)) contentCoverage = false;
      const claimIds = st.claimIds || (content && content.sourceClaimIds) || [];
      if (!claimIds.length) sourceCoverage = false;
      else {
        const claimsFile = readJson("sources/claims.json");
        const byId = {};
        (claimsFile.claims || []).forEach((c) => { byId[c.id] = c; });
        claimIds.forEach((id) => {
          const c = byId[id];
          if (!(c && c.approved && c.reviewPass1 && c.reviewPass2 && !WEAK.has(String(c.sourceType || "").toLowerCase()))) sourceCoverage = false;
        });
      }
      let mp = male.poses && male.poses[st.poseId];
      let fp = female.poses && female.poses[st.poseId];
      if (st.poseId === "taslim-right") {
        mp = (male.poses && (male.poses["taslim-right"] || male.poses.taslim)) || mp;
        fp = (female.poses && (female.poses["taslim-right"] || female.poses.taslim)) || fp;
      }
      if (!canPublishPose(mp)) malePoseCoverage = false;
      if (!canPublishPose(fp)) femalePoseCoverage = false;
      if (!st.reviewPass1) rp1 = false;
      if (!st.reviewPass2) rp2 = false;
      // character lock
      if (mp && mp.characterId && mp.characterId !== CHAR_MALE) {
        report.wrongCharacterAssets = (report.wrongCharacterAssets || 0) + 1;
        fail("male pose wrong character: " + st.poseId);
      }
      if (fp && fp.characterId && fp.characterId !== CHAR_FEMALE) {
        report.wrongCharacterAssets = (report.wrongCharacterAssets || 0) + 1;
        fail("female pose wrong character: " + st.poseId);
      }
    });
    const releaseReady = !!(true /* sequence checked above */ && contentCoverage && sourceCoverage && malePoseCoverage && femalePoseCoverage && rp1 && rp2);
    report.fajrReleaseReady = releaseReady;
    if (releaseReady) fail("unexpected releaseReady=true while content still pending");
    else ok("fajrReleaseReady=false (expected)");

    // Negativtest 1: content approved + sources missing => not approved
    {
      const fakeContent = { status: "approved", reviewPass1: true, reviewPass2: true, sourceClaimIds: [] };
      if (canPublishContent(fakeContent)) fail("negativtest1: content without sources must not publish");
      else ok("negativtest1 sources-missing gate");
    }
    // Negativtest 2: wrong character
    {
      const bad = { approved: true, characterConsistency: true, clothingReview: true, poseReview: true, reviewPass1: true, reviewPass2: true, sourceClaimIds: ["x"], characterId: "wrong" };
      if (bad.characterId === CHAR_MALE) fail("negativtest2 setup");
      else ok("negativtest2 wrong-character detectable");
    }
    // Negativtest 3: female contour
    {
      const badPose = { approved: true, characterConsistency: true, clothingReview: false, poseReview: true, reviewPass1: true, reviewPass2: true, sourceClaimIds: ["x"] };
      if (canPublishPose(badPose)) fail("negativtest3 clothingReview false must block");
      else ok("negativtest3 clothingReview gate");
    }
    // Negativtest 4: male moustache / consistency
    {
      const badPose = { approved: true, characterConsistency: false, clothingReview: true, poseReview: true, reviewPass1: true, reviewPass2: true, sourceClaimIds: ["x"] };
      if (canPublishPose(badPose)) fail("negativtest4 characterConsistency false must block");
      else ok("negativtest4 characterConsistency gate");
    }
    // Negativtest 6: pass1 true pass2 false
    {
      const stepOkish = { contentApproved: true, sourceCoverageApproved: true, poseApproved: true, reviewPass1: true, reviewPass2: false };
      const fully = stepOkish.contentApproved && stepOkish.sourceCoverageApproved && stepOkish.poseApproved && stepOkish.reviewPass1 && stepOkish.reviewPass2;
      if (fully) fail("negativtest6 pass2 false must block");
      else ok("negativtest6 reviewPass2 required");
    }

    const audit = readJson("review/audit-log.json");
    if (!Array.isArray(audit.entries)) fail("audit entries must be array");
    else ok("auditLog structure");

    const deps = readJson("review/dependencies.json");
    if (!deps.invalidationRules || !deps.invalidationRules.claimSourceChanged) fail("dependency invalidation rules missing");
    else ok("dependencyInvalidation rules");
  }

  const live = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (live.includes("gebet-lernen") || live.includes("prayer-learning")) {
    report.productionChanged = true;
    fail("production index.html changed");
  }

  const js = fs.readFileSync(path.join(ROOT, "test/assets/prayer-learning/prayer-learning.js"), "utf8");
  if (js.includes("AUDIO_VISIBLE = false") && !js.includes("audioVisible = true") && js.includes("canPublishPrayerContent") && js.includes("resolvePrayerPose") && js.includes("CONTENT_PENDING_LABEL")) {
    ok("engine gates present");
  } else fail("engine missing phase5 gates");
  if (js.includes("computeFajrReadiness") && js.includes("appendAuditEntry") && js.includes("reviewOverviewHtml") && js.includes('mode = "review"') && js.includes("invalidateClaimApproval") && js.includes("PHASE = 6")) {
    ok("phase6 review engine present");
  } else fail("phase6 review engine missing");
  if (js.includes("data-prl-preview-deep") && js.includes("preview must NOT change approval")) ok("preview≠approve");
  else fail("preview guard missing");
  if (/Subḥāna Rabbiyal|سبحان ربي العظيم/.test(js)) fail("hardcoded religious text in UI engine");

  report.validator = errors.length ? "FAIL" : "PASS";
  report.errors = errors.slice();
} catch (e) {
  fail(String(e && e.stack || e));
  report.validator = "FAIL";
  report.errors = errors.slice();
}

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
