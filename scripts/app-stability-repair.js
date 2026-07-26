#!/usr/bin/env node
/**
 * APP_STABILITY_REPAIR
 * Zentrale autonome Reparatur — führt alle Domain-Repairs aus app-stability-lock.json aus.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "APP_STABILITY_REPAIR";
const LOCK_FILE = "content/admin/app-stability-lock.json";

function loadMasterLock() {
  const lockPath = path.join(ROOT, LOCK_FILE);
  if (!fs.existsSync(lockPath)) return null;
  return JSON.parse(fs.readFileSync(lockPath, "utf8"));
}

function runDomainRepair(domain, snapshots) {
  if (!domain.repairModule || !domain.repairExport) return 0;
  const modPath = path.join(__dirname, domain.repairModule);
  if (!fs.existsSync(modPath)) {
    console.warn(`${MARKER}: Repair-Modul fehlt: ${domain.repairModule}`);
    return 0;
  }
  const mod = require(modPath);
  const fn = mod[domain.repairExport];
  if (typeof fn !== "function") {
    console.warn(`${MARKER}: ${domain.repairExport} nicht gefunden in ${domain.repairModule}`);
    return 0;
  }
  console.log(`${MARKER}: Domain „${domain.label || domain.id}“ reparieren …`);
  return fn(snapshots) || 0;
}

function runBuildSyncRepair() {
  const { execFileSync } = require("child_process");
  try {
    const visitor = JSON.parse(fs.readFileSync(path.join(ROOT, "version.json"), "utf8"));
    const test = JSON.parse(fs.readFileSync(path.join(ROOT, "test/version.json"), "utf8"));
    const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const testHtml = fs.readFileSync(path.join(ROOT, "test/index.html"), "utf8");
    const visitorOk = indexHtml.includes(visitor.buildId);
    const testOk = testHtml.includes(test.buildId);
    if (visitorOk && testOk) {
      console.log(`${MARKER}: Build-IDs in HTML synchron`);
      return 0;
    }
    console.log(`${MARKER}: Build-ID-Drift erkannt — sync-app-build-ids ausführen`);
    execFileSync("node", ["scripts/sync-app-build-ids.js"], { cwd: ROOT, stdio: "inherit" });
    return 1;
  } catch (e) {
    console.warn(`${MARKER}: Build-Sync-Reparatur fehlgeschlagen: ${e.message}`);
    return 0;
  }
}

function runAppStabilityRepair(snapshots) {
  const lock = loadMasterLock();
  if (!lock?.locked) return 0;

  let repaired = 0;
  const domains = Array.isArray(lock.domains) ? lock.domains : [];
  const seenRepairs = new Set();

  for (const domain of domains) {
    const key = domain.repairModule;
    if (!key || seenRepairs.has(key)) continue;
    seenRepairs.add(key);
    repaired += runDomainRepair(domain, snapshots);
  }

  for (const domain of domains) {
    if (domain.parityKind === "build-sync") {
      repaired += runBuildSyncRepair();
    }
  }

  if (repaired) {
    console.log(`${MARKER}: ${repaired} Reparatur(en) ausgeführt`);
  } else {
    console.log(`${MARKER}: keine Reparatur nötig`);
  }
  return repaired;
}

if (require.main === module) {
  runAppStabilityRepair();
}

module.exports = { MARKER, runAppStabilityRepair };
