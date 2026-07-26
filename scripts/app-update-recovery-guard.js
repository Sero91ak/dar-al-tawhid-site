#!/usr/bin/env node
/**
 * APP_UPDATE_RECOVERY_GUARD
 * Blockiert Deploy wenn das Update/Reparatur-Banner wieder fälschlich erscheint,
 * automatisch repariert oder das blaue Update-Design entfernt wird.
 *
 * Usage: node scripts/app-update-recovery-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "APP_UPDATE_RECOVERY_GUARD";
const LOCK_FILE = "content/admin/app-update-recovery-lock.json";
const FILES = ["index.html", "test/index.html"];

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  return 1;
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
  return 0;
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function runAppUpdateRecoveryGuard() {
  if (!fs.existsSync(path.join(ROOT, LOCK_FILE))) {
    console.log(`${MARKER} OK: Lock-Datei fehlt – übersprungen`);
    return 0;
  }
  const lock = JSON.parse(read(LOCK_FILE));
  if (!lock.locked) {
    ok("Lock-Datei: nicht gesperrt");
    return 0;
  }

  const required = Array.isArray(lock.requiredMarkers) ? lock.requiredMarkers : [];
  const forbidden = Array.isArray(lock.forbiddenPatterns) ? lock.forbiddenPatterns : [];
  let failed = 0;

  for (const file of FILES) {
    const content = read(file);
    let fileFailed = false;
    for (const needle of required) {
      if (!content.includes(needle)) {
        failed += fail(`${file}: Pflicht-Marker fehlt: ${needle}`);
        fileFailed = true;
      }
    }
    for (const pattern of forbidden) {
      if (content.includes(pattern)) {
        failed += fail(`${file}: verbotenes Muster: ${pattern}`);
        fileFailed = true;
      }
    }
    if (!fileFailed) ok(`${file}: alle Pflicht-Marker (${required.length})`);
  }

  if (!failed) ok("App-Update/Reparatur-Banner geschützt");
  return failed;
}

if (require.main === module) {
  process.exit(runAppUpdateRecoveryGuard());
}

module.exports = { MARKER, LOCK_FILE, runAppUpdateRecoveryGuard };
