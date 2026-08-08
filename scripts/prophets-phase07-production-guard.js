#!/usr/bin/env node
/**
 * Phase 07 production guard for prophets test integration.
 * Fails if production is enabled during prophets-test-integration work.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "test/data/prophets/index.json");

function main() {
  const raw = fs.readFileSync(INDEX, "utf8");
  const idx = JSON.parse(raw);
  const prod = idx && idx.env && idx.env.production;
  if (prod === true || prod === "enabled") {
    console.error("PRODUCTION RELEASE BLOCKED — prophets-test-integration");
    process.exit(1);
  }
  if (!(idx.env && (idx.env.test === true || idx.env.test === "enabled"))) {
    console.error("PHASE07 GUARD FAIL: test must be enabled");
    process.exit(1);
  }
  // research paths must resolve
  const disputed = idx.disputed || [];
  for (const p of disputed) {
    const file = path.join(ROOT, "test/data/prophets", p.profileFile || "");
    if (!fs.existsSync(file)) {
      console.error("PHASE07 GUARD FAIL: missing research profile", p.profileFile);
      process.exit(1);
    }
  }
  console.log("PHASE07_PRODUCTION_GUARD OK: test=enabled production=disabled researchFiles=" + disputed.length);
}

main();
