#!/usr/bin/env node
/**
 * Phase-6 smoke checks — review dashboard, gates, invalidation, readiness.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const errors = [];
function ok(k, v) { console.log(`${k}: ${v}`); }
function fail(k, msg) { errors.push(`${k}: ${msg}`); console.error(`FAIL ${k}: ${msg}`); }
function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

const report = {
  feature: "Gebet erlernen",
  phase: 6,
  environment: "test",
  reviewDashboard: "FAIL",
  contentReviewWorkflow: "FAIL",
  sourceReviewWorkflow: "FAIL",
  poseReviewWorkflow: "FAIL",
  reviewPass1: "FAIL",
  reviewPass2: "FAIL",
  auditLog: "FAIL",
  dependencyInvalidation: "FAIL",
  dynamicReadiness: "FAIL",
  dynamicCounts: "FAIL",
  maleVisualReview: "FAIL",
  femaleVisualReview: "FAIL",
  sourceCoverageValidator: "FAIL",
  poseCoverageValidator: "FAIL",
  characterValidator: "FAIL",
  fajrReleaseReady: false,
  audioVisible: false,
  productionChanged: false,
  errors: []
};

try {
  const js = read("test/assets/prayer-learning/prayer-learning.js");
  const css = read("test/assets/prayer-learning/prayer-learning.css");
  const testHtml = read("test/index.html");
  const live = read("index.html");

  if (!live.includes("gebet-lernen") && !live.includes("prayer-learning")) {
    report.productionChanged = false; ok("productionChanged", "false");
  } else {
    report.productionChanged = true; fail("production", "Live geändert");
  }

  [
    "review/index.json",
    "review/fajr-steps.json",
    "review/fajr-readiness.json",
    "review/audit-log.json",
    "review/dependencies.json"
  ].forEach((p) => {
    if (!exists("test/data/prayer-learning/" + p)) fail("data", "missing " + p);
  });

  if (js.includes('mode = "review"') && js.includes("reviewOverviewHtml") && js.includes("reviewStepDetailHtml") && js.includes('data-prl-go="review"') && css.includes("prl-review-summary") && testHtml.includes("review/fajr-steps.json")) {
    report.reviewDashboard = "PASS"; ok("reviewDashboard", "PASS");
  } else fail("reviewDashboard", "fehlt");

  if (js.includes("contentReview") || (exists("test/data/prayer-learning/review/fajr-steps.json") && read("test/data/prayer-learning/review/fajr-steps.json").includes("contentReview"))) {
    report.contentReviewWorkflow = "PASS"; ok("contentReviewWorkflow", "PASS");
  } else fail("contentReviewWorkflow", "fehlt");

  if (read("test/data/prayer-learning/review/fajr-steps.json").includes("sourceReview") && js.includes("sourceCoverageApproved")) {
    report.sourceReviewWorkflow = "PASS"; ok("sourceReviewWorkflow", "PASS");
  } else fail("sourceReviewWorkflow", "fehlt");

  if (read("test/data/prayer-learning/review/fajr-steps.json").includes("poseReview") && js.includes("canPublishPose") && js.includes("maleVisualChecks")) {
    report.poseReviewWorkflow = "PASS"; ok("poseReviewWorkflow", "PASS");
  } else fail("poseReviewWorkflow", "fehlt");

  if (js.includes("reviewPass1") && read("test/data/prayer-learning/review/fajr-steps.json").includes("reviewPass1")) {
    report.reviewPass1 = "PASS"; ok("reviewPass1", "PASS");
  } else fail("reviewPass1", "fehlt");

  if (js.includes("reviewPass2") && read("test/data/prayer-learning/review/fajr-steps.json").includes("reviewPass2")) {
    report.reviewPass2 = "PASS"; ok("reviewPass2", "PASS");
  } else fail("reviewPass2", "fehlt");

  if (js.includes("appendAuditEntry") && exists("test/data/prayer-learning/review/audit-log.json")) {
    report.auditLog = "PASS"; ok("auditLog", "PASS");
  } else fail("auditLog", "fehlt");

  if (js.includes("invalidateClaimApproval") && js.includes("invalidatePoseApproval") && js.includes("invalidateContentAfterDependency") && read("test/data/prayer-learning/review/dependencies.json").includes("invalidationRules")) {
    report.dependencyInvalidation = "PASS"; ok("dependencyInvalidation", "PASS");
  } else fail("dependencyInvalidation", "fehlt");

  if (js.includes("computeFajrReadiness") && js.includes("releaseReady") && js.includes("computed: true")) {
    report.dynamicReadiness = "PASS"; ok("dynamicReadiness", "PASS");
  } else fail("dynamicReadiness", "fehlt");

  if (js.includes("computeMissingCounts") && js.includes("missingSources") && js.includes("Missing sources")) {
    report.dynamicCounts = "PASS"; ok("dynamicCounts", "PASS");
  } else fail("dynamicCounts", "fehlt");

  if (js.includes("maleVisualChecks") && js.includes("dar-prayer-male-v1") && read("test/data/prayer-learning/poses/male-v1.json").includes("visualChecks")) {
    report.maleVisualReview = "PASS"; ok("maleVisualReview", "PASS");
  } else fail("maleVisualReview", "fehlt");

  if (js.includes("femaleVisualChecks") && read("test/data/prayer-learning/review/fajr-steps.json").includes("niqabConsistent") && read("test/data/prayer-learning/poses/female-v1.json").includes("noChestContour")) {
    report.femaleVisualReview = "PASS"; ok("femaleVisualReview", "PASS");
  } else fail("femaleVisualReview", "fehlt");

  if (js.includes("sourceCoverageApproved") && js.includes("canPublishPrayerContent")) {
    report.sourceCoverageValidator = "PASS"; ok("sourceCoverageValidator", "PASS");
  } else fail("sourceCoverageValidator", "fehlt");

  if (js.includes("poseApproved") && js.includes("canPublishPose")) {
    report.poseCoverageValidator = "PASS"; ok("poseCoverageValidator", "PASS");
  } else fail("poseCoverageValidator", "fehlt");

  if (js.includes("VALIDATION FAIL") && js.includes("dar-prayer-male-v1") && js.includes("dar-prayer-female-v1")) {
    report.characterValidator = "PASS"; ok("characterValidator", "PASS");
  } else fail("characterValidator", "fehlt");

  if (js.includes("AUDIO_VISIBLE = false") && js.includes("AUDIO_PRELOAD = false") && !js.includes("<audio") && !/audioVisible\s*=\s*true/.test(js)) {
    report.audioVisible = false; ok("audioVisible", "false");
  } else {
    report.audioVisible = true; fail("audio", "sichtbar");
  }

  if (js.includes("preview must NOT change approval") && js.includes("data-prl-preview-deep")) ok("preview≠approve", "PASS");
  else fail("preview", "fehlt");

  if (js.includes("PHASE = 6") && testHtml.includes("app-shell-v638")) ok("version", "v638");
  else fail("version", "nicht v638");

  if (js.includes("data-prl-content-id") && js.includes("CONTENT_PENDING_LABEL")) ok("contentResolveUI", "PASS");
  else fail("contentResolveUI", "stepCopyHtml nicht registry-basiert");

  let out = "";
  try {
    out = execSync("node scripts/validate-prayer-learning.js", { cwd: ROOT, encoding: "utf8" });
  } catch (e) {
    out = String(e.stdout || "") + String(e.stderr || "");
    fail("validator", "validate-prayer-learning failed");
  }
  const m = out.match(/\{[\s\S]*\}\s*$/);
  if (m) {
    const validated = JSON.parse(m[0]);
    report.fajrReleaseReady = !!validated.fajrReleaseReady;
    if (validated.validator === "PASS" && validated.fajrReleaseReady === false) ok("validator", "PASS");
    else if (validated.validator !== "PASS") fail("validator", "not PASS");
    (validated.errors || []).forEach((err) => errors.push(err));
  }
} catch (e) {
  fail("fatal", String(e && e.stack || e));
}

report.errors = errors.slice();
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
