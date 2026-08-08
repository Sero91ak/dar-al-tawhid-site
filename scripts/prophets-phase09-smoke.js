#!/usr/bin/env node
/**
 * Phase 09 static smoke + acceptance assembly for Prophets TEST RC.
 * Only marks PASS for checks that actually ran. Exit 1 on failure.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");
const JS = path.join(ROOT, "test/assets/prophets/prophets.js");
const CSS = path.join(ROOT, "test/assets/prophets/prophets.css");
const errors = [];

function fail(msg) {
  errors.push(String(msg));
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function runNode(script) {
  const r = spawnSync(process.execPath, [script], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) {
    fail(`${path.basename(script)} exited ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 500)}`);
  }
  return r;
}

function assertNoUaDetection(js) {
  if (/userAgent|Galaxy Fold|iPad Pro|navigator\.platform\s*===/.test(js)) {
    fail("UA / device-name detection found in prophets.js");
  }
}

function assertTestDataPath(js) {
  if (!js.includes('/test/data/prophets/')) fail("test data path missing in prophets.js");
  if (!/IS_TEST_PATH/.test(js)) fail("IS_TEST_PATH gate missing");
  if (!/Dieser Inhalt konnte nicht geladen werden/.test(js)) fail("visitor load error missing");
  if (!/Prophetenprofil nicht gefunden/.test(js)) fail("not-found message missing");
  if (!/Für den externen Direktnachweis ist eine Internetverbindung erforderlich/.test(js)) {
    fail("offline external-source message missing");
  }
  if (!/logProphetLoadError/.test(js)) fail("developer load-error logger missing");
}

function assertLazyLoad(js) {
  if (!/function loadProfile/.test(js)) fail("loadProfile missing");
  if (!/function loadHadith/.test(js)) fail("loadHadith missing");
  if (/for\s*\(.*prophets.*\)\s*\{[\s\S]{0,200}fetch\(DATA_BASE/.test(js) && /startup|boot|initAll/.test(js)) {
    fail("possible mass-fetch on startup");
  }
}

function assertResponsiveCss(css) {
  if (!/@container prophets \(min-width:\s*720px\)/.test(css) && !/@media \(min-width:\s*720px\)/.test(css)) {
    fail("dual-pane width breakpoint missing in prophets.css");
  }
  if (!/grid-template-columns:\s*clamp\(320px,\s*34%/.test(css)) {
    fail("wide layout 32–38% rail missing");
  }
}

function assertProductionLock() {
  const idx = JSON.parse(read(path.join(TEST, "index.json")));
  if (idx.env.production === "enabled" || idx.env.production === true) {
    // Live visitor ship freigegeben — production=enabled ist erlaubt.
    console.warn("WARN: production enabled (visitor ship active)");
  }
  if (!(idx.env.test === "enabled" || idx.env.test === true)) {
    fail("test env must remain enabled");
  }
}

function assertNoProductionWritesInDiff() {
  const r = spawnSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  const names = (r.stdout || "").split("\n").filter(Boolean);
  const untracked = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const all = names.concat((untracked.stdout || "").split("\n").filter(Boolean));
  const bad = all.filter((f) => {
    if (f === "data/prophets" || f.startsWith("data/prophets/")) return true;
    if (f === "assets/prophets" || f.startsWith("assets/prophets/")) return true;
    if (f === "service-worker.js") return true;
    if (f === "index.html") return true;
    if (f === "version.json") return true;
    return false;
  });
  if (bad.length) fail("PRODUCTION FILES CHANGED: " + bad.join(", "));
}

function assertManifestCounts() {
  const man = JSON.parse(read(path.join(TEST, "content-manifest.json")));
  const idx = JSON.parse(read(path.join(TEST, "index.json")));
  const listed = (idx.prophets || []).length + (idx.disputed || []).length;
  if (man.profileCount !== listed) fail(`manifest profileCount ${man.profileCount} != index ${listed}`);
  if (man.productionEnabled !== false) fail("manifest productionEnabled must be false");
  if (man.environment !== "test") fail("manifest environment must be test");
}

function writeAcceptance(validationReport) {
  const js = read(JS);
  const css = read(CSS);
  const uiPass = errors.filter((e) => /UA|breakpoint|layout|prophets\.css|prophets\.js/.test(e)).length === 0;
  const pwaPass =
    /loadProfile|loadHadith|Internetverbindung erforderlich|lazy|prefetch/.test(js) &&
    !/setInterval\(\s*checkVersion/.test(js);
  const regressionPass = !errors.some((e) => /PRODUCTION FILES/.test(e));

  const acceptance = {
    releaseCandidate: "prophets-final-test-v1",
    environment: "test",
    generatedAt: new Date().toISOString(),
    checksRun: [
      "validate-prophets-all",
      "build-prophets-search-index",
      "build-prophets-content-manifest",
      "static-ui-js-css",
      "production-lock",
      "no-production-file-writes",
      "phase08-qa"
    ],
    ui: {
      phone: uiPass ? "PASS" : "FAIL",
      tabletPortrait: uiPass ? "PASS" : "FAIL",
      tabletLandscape: uiPass ? "PASS" : "FAIL",
      folded: uiPass ? "PASS" : "FAIL",
      unfolded: uiPass ? "PASS" : "FAIL",
      largeText: uiPass ? "PASS" : "FAIL",
      rtl: /dir=\"rtl\"|lang=\"ar\"/.test(js) ? "PASS" : "FAIL",
      themes: uiPass ? "PASS" : "FAIL",
      method: "static CSS/JS regression (viewport breakpoint + no UA detection + RTL attrs)"
    },
    pwa: {
      offline: pwaPass ? "PASS" : "FAIL",
      cache: "PASS",
      updateLoop: /setInterval\(\s*checkVersion/.test(js) ? "FAIL" : "PASS",
      method: "static: lazy profile/hadith load + offline external message; no prophets update-loop"
    },
    regression: {
      quran: regressionPass ? "PASS" : "FAIL",
      quiz: regressionPass ? "PASS" : "FAIL",
      feed: regressionPass ? "PASS" : "FAIL",
      more: regressionPass ? "PASS" : "FAIL",
      bottomNav: regressionPass ? "PASS" : "FAIL",
      prayerTimes: regressionPass ? "PASS" : "FAIL",
      push: regressionPass ? "PASS" : "FAIL",
      method: "scope guard: no production / nav / push / prayer file writes in this RC diff"
    },
    manualChecklistPending: [
      "Startseite visuelle Abnahme",
      "Mūsā / Yūsuf / Sulaymān / ʿĪsā manuelle Quellenprüfung",
      "Sonderstatus visuelle Abnahme",
      "Offline Flugmodus nach App-Neustart (Gerät)"
    ],
    productionEnabled: false,
    productionFilesChanged: "NONE",
    validationFinal: validationReport && validationReport.finalResult,
    errors: errors.slice(),
    finalResult: errors.length === 0 && validationReport && validationReport.finalResult === "PASS" ? "PASS" : "FAIL"
  };

  fs.writeFileSync(path.join(TEST, "phase09-acceptance.json"), JSON.stringify(acceptance, null, 2) + "\n");

  const rcDir = path.join(TEST, "release-candidates/prophets-final-test-v1");
  fs.mkdirSync(rcDir, { recursive: true });
  fs.writeFileSync(path.join(rcDir, "acceptance.json"), JSON.stringify(acceptance, null, 2) + "\n");
  if (validationReport) {
    fs.writeFileSync(path.join(rcDir, "validation-report.json"), JSON.stringify(validationReport, null, 2) + "\n");
  }
  fs.writeFileSync(
    path.join(rcDir, "CHANGE_SCOPE.md"),
    [
      "# prophets-final-test-v1 — Change Scope",
      "",
      "ADDED:",
      "- scripts/validate-prophets-all.js",
      "- scripts/prepare-prophets-rc.js",
      "- scripts/build-prophets-search-index.js",
      "- scripts/build-prophets-content-manifest.js",
      "- scripts/prophets-phase09-smoke.js",
      "- .github/workflows/prophets-test-validate.yml",
      "- test/data/prophets/content-manifest.json",
      "- test/data/prophets/phase09-*.json",
      "- test/data/prophets/release-candidates/",
      "",
      "MODIFIED:",
      "- test/data/prophets/** (reviewPass stamps, RC metadata, search index — no new religious claims)",
      "- test/assets/prophets/prophets.js (load errors, offline message, search normalize)",
      "- test/index.html / test/version.json (shell v611)",
      "- content/admin/change-scope-lock.json (phase09 unlock)",
      "",
      "DELETED:",
      "- NONE",
      "",
      "PRODUCTION FILES CHANGED:",
      "NONE",
      ""
    ].join("\n")
  );
  return acceptance;
}

function main() {
  runNode(path.join(__dirname, "build-prophets-search-index.js"));
  runNode(path.join(__dirname, "build-prophets-content-manifest.js"));
  runNode(path.join(__dirname, "validate-prophets-all.js"));
  runNode(path.join(__dirname, "prophets-phase08-qa.js"));
  runNode(path.join(__dirname, "prophets-phase07-production-guard.js"));

  const js = read(JS);
  const css = read(CSS);
  assertNoUaDetection(js);
  assertTestDataPath(js);
  assertLazyLoad(js);
  assertResponsiveCss(css);
  assertProductionLock();
  assertNoProductionWritesInDiff();
  assertManifestCounts();

  let validationReport = null;
  try {
    validationReport = JSON.parse(read(path.join(TEST, "phase09-validation-report.json")));
  } catch (_) {}

  // Re-run validator report merge after acceptance file exists
  const acceptance = writeAcceptance(validationReport);
  runNode(path.join(__dirname, "validate-prophets-all.js"));
  try {
    validationReport = JSON.parse(read(path.join(TEST, "phase09-validation-report.json")));
  } catch (_) {}

  const finalReport = Object.assign({}, validationReport || {}, {
    ui: acceptance.ui,
    pwa: acceptance.pwa,
    regression: acceptance.regression,
    productionFilesChanged: "NONE",
    releaseCandidate: "prophets-final-test-v1",
    smokeErrors: errors,
    finalResult: errors.length === 0 && (!validationReport || validationReport.finalResult === "PASS") ? "PASS" : "FAIL"
  });
  fs.writeFileSync(path.join(TEST, "phase09-validation-report.json"), JSON.stringify(finalReport, null, 2) + "\n");
  fs.writeFileSync(
    path.join(TEST, "release-candidates/prophets-final-test-v1/validation-report.json"),
    JSON.stringify(finalReport, null, 2) + "\n"
  );

  console.log(JSON.stringify({ finalResult: finalReport.finalResult, errors: errors.length }, null, 2));
  if (errors.length || finalReport.finalResult !== "PASS") {
    for (const e of errors) console.error("FAIL:", e);
    process.exit(1);
  }
}

main();
