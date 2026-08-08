#!/usr/bin/env node
/**
 * Phase 12 FINAL freeze — prophets-final-test-v1
 * Hashes + manifest under test/data/prophets/release-candidates/
 * NEVER copies to data/prophets/. NEVER enables production.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");
const LIVE = path.join(ROOT, "data/prophets");
const RC_ID = "prophets-final-test-v1";
const RC_DIR = path.join(TEST, "release-candidates", RC_ID);

function sha256File(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "release-candidates") continue;
      walk(p, acc);
    } else if (name.endsWith(".json") || name.endsWith(".js") || name.endsWith(".css")) {
      acc.push(p);
    }
  }
  return acc;
}

function main() {
  if (process.env.PROPHETS_ALLOW_LIVE_WRITE === "1") {
    console.error("Refusing PROPHETS_ALLOW_LIVE_WRITE");
    process.exit(1);
  }
  const index = JSON.parse(fs.readFileSync(path.join(TEST, "index.json"), "utf8"));
  if (index.env && (index.env.production === "enabled" || index.env.production === true)) {
    console.error("production must be disabled for freeze");
    process.exit(1);
  }

  fs.mkdirSync(RC_DIR, { recursive: true });

  const hashTargets = [];
  hashTargets.push(path.join(TEST, "index.json"));
  hashTargets.push(path.join(TEST, "search-index.json"));
  for (const f of fs.readdirSync(TEST)) {
    if (f.endsWith(".json") && !/phase|report|manifest|BACKUP|endaudit|audit|search-index|content-manifest/i.test(f) && f !== "index.json") {
      hashTargets.push(path.join(TEST, f));
    }
  }
  const research = path.join(TEST, "research");
  if (fs.existsSync(research)) {
    for (const f of fs.readdirSync(research)) {
      if (f.endsWith(".json")) hashTargets.push(path.join(research, f));
    }
  }
  const hadith = path.join(TEST, "hadith");
  if (fs.existsSync(hadith)) {
    for (const f of fs.readdirSync(hadith)) {
      if (f.endsWith(".json")) hashTargets.push(path.join(hadith, f));
    }
  }
  const relations = path.join(TEST, "relations");
  if (fs.existsSync(relations)) {
    for (const f of fs.readdirSync(relations)) {
      if (f.endsWith(".json")) hashTargets.push(path.join(relations, f));
    }
  }
  // UI + validators
  for (const rel of [
    "test/assets/prophets/prophets.js",
    "test/assets/prophets/prophets.css",
    "scripts/validate-prophets-all.js",
    "scripts/prophets-phase12-final-audit.js",
    "scripts/prophets_phase12_final_build.py"
  ]) {
    const p = path.join(ROOT, rel);
    if (fs.existsSync(p)) hashTargets.push(p);
  }

  const hashes = {
    releaseCandidate: RC_ID,
    algorithm: "SHA-256",
    generatedAt: new Date().toISOString(),
    entries: []
  };
  for (const file of hashTargets.sort()) {
    hashes.entries.push({
      path: path.relative(ROOT, file).replace(/\\/g, "/"),
      sha256: sha256File(file)
    });
  }

  const freeze = {
    releaseCandidate: RC_ID,
    environment: "test",
    contentVersion: index.contentVersion || RC_ID,
    contentFrozen: true,
    productionEnabled: false,
    testEnabled: true,
    noLiveCopy: true,
    noProductionMerge: true,
    frozenAt: new Date().toISOString(),
    coreProfiles: 25,
    note: "Content freeze for FINAL TEST VERSION. PASS ≠ live. Explicit separate go-live required."
  };

  // safety: confirm live not written by this freeze
  const liveGuard = {
    livePathExists: fs.existsSync(LIVE),
    liveTouchedByThisFreeze: false,
    productionEnv: "disabled"
  };

  fs.writeFileSync(path.join(RC_DIR, "freeze.json"), JSON.stringify(freeze, null, 2) + "\n");
  fs.writeFileSync(path.join(RC_DIR, "hashes.json"), JSON.stringify(hashes, null, 2) + "\n");
  fs.writeFileSync(
    path.join(RC_DIR, "CHANGE_SCOPE.md"),
    [
      "# prophets-final-test-v1",
      "",
      "- TEST only",
      "- production = disabled",
      "- NO live copy to data/prophets/",
      "- NO public production deploy",
      ""
    ].join("\n")
  );

  // copy final report into RC if present
  const report = path.join(TEST, "phase12-final-report.json");
  if (fs.existsSync(report)) {
    fs.copyFileSync(report, path.join(RC_DIR, "validation-report.json"));
  }

  fs.writeFileSync(path.join(RC_DIR, "live-guard.json"), JSON.stringify(liveGuard, null, 2) + "\n");

  // stamp index
  index.contentVersion = RC_ID;
  index.releaseCandidate = RC_ID;
  index.env = { test: "enabled", production: "disabled" };
  index.finalFreeze = freeze;
  fs.writeFileSync(path.join(TEST, "index.json"), JSON.stringify(index, null, 2) + "\n");

  console.log(
    JSON.stringify(
      {
        releaseCandidate: RC_ID,
        hashedFiles: hashes.entries.length,
        productionEnabled: false,
        rcDir: path.relative(ROOT, RC_DIR)
      },
      null,
      2
    )
  );
}

main();
