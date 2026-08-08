#!/usr/bin/env node
/**
 * Phase 07 production guard for prophets.
 * After explicit visitor ship: production=enabled is allowed.
 * Still requires test=enabled and research profiles reachable.
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
    console.warn("PHASE07: production enabled (visitor ship active) — allowed");
  }
  if (!(idx.env && (idx.env.test === true || idx.env.test === "enabled"))) {
    console.error("PHASE07 GUARD FAIL: test must be enabled");
    process.exit(1);
  }
  const disputed = idx.disputed || [];
  for (const p of disputed) {
    const file = path.join(ROOT, "test/data/prophets", p.profileFile || "");
    if (!fs.existsSync(file)) {
      console.error("PHASE07 GUARD FAIL: missing research profile", p.profileFile);
      process.exit(1);
    }
  }
  console.log(
    "PHASE07_PRODUCTION_GUARD OK: test=enabled production=" +
      String(prod) +
      " researchFiles=" +
      disputed.length
  );
}

main();
