#!/usr/bin/env node
/**
 * APP_STABILITY_GUARD
 * Zentrale Sperre: führt alle Domain-Guards aus app-stability-lock.json aus
 * und blockiert Deploy bei Verstößen (Bibliothek, Overlay, App-Update, Workflow).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "APP_STABILITY_GUARD";
const LOCK_FILE = "content/admin/app-stability-lock.json";

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  return 1;
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
  return 0;
}

function loadMasterLock() {
  const lockPath = path.join(ROOT, LOCK_FILE);
  if (!fs.existsSync(lockPath)) throw new Error(`${LOCK_FILE} fehlt`);
  return JSON.parse(read(LOCK_FILE));
}

function runDeployWorkflowGuard(lock) {
  let failed = 0;
  const workflow = read(".github/workflows/cloudflare-pages-deploy.yml");
  const markers = Array.isArray(lock.deployWorkflowMarkers) ? lock.deployWorkflowMarkers : [];
  for (const needle of markers) {
    if (!workflow.includes(needle)) {
      failed += fail(`cloudflare-pages-deploy.yml: fehlt „${needle}“`);
    }
  }
  if (!failed) ok(`Deploy-Workflow: alle Stabilitäts-Schritte (${markers.length})`);

  const watchdog = String(lock.watchdog?.workflow || "");
  if (watchdog && !fs.existsSync(path.join(ROOT, watchdog))) {
    failed += fail(`Watchdog fehlt: ${watchdog}`);
  } else if (watchdog) {
    ok(`Watchdog vorhanden: ${watchdog}`);
  }
  return failed;
}

function runDomainGuard(domain) {
  if (!domain.guardModule || !domain.guardExport) return 0;
  const modPath = path.join(__dirname, domain.guardModule);
  if (!fs.existsSync(modPath)) {
    return fail(`Guard-Modul fehlt: ${domain.guardModule}`);
  }
  const mod = require(modPath);
  const fn = mod[domain.guardExport];
  if (typeof fn !== "function") {
    return fail(`${domain.guardModule}.${domain.guardExport} ist keine Funktion`);
  }
  console.log(`${MARKER}: Domain „${domain.label || domain.id}“ prüfen …`);
  const result = fn();
  return typeof result === "number" ? result : 0;
}

function runAppStabilityGuard() {
  if (!fs.existsSync(path.join(ROOT, LOCK_FILE))) {
    console.log(`${MARKER} OK: Master-Lock fehlt – übersprungen`);
    return 0;
  }

  const lock = loadMasterLock();
  if (!lock.locked) {
    ok("Master-Lock: nicht gesperrt");
    return 0;
  }

  let failed = 0;
  failed += runDeployWorkflowGuard(lock);

  const domains = Array.isArray(lock.domains) ? lock.domains : [];
  const seenGuards = new Set();
  for (const domain of domains) {
    const key = domain.guardModule;
    if (!key || seenGuards.has(key)) continue;
    seenGuards.add(key);
    failed += runDomainGuard(domain);
  }

  if (!failed) ok("App-weite Stabilitäts-Sperre aktiv");
  return failed;
}

if (require.main === module) {
  process.exit(runAppStabilityGuard());
}

module.exports = { MARKER, LOCK_FILE, runAppStabilityGuard, loadMasterLock };
