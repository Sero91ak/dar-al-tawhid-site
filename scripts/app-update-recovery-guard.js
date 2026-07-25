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
  process.exit(1);
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function runAppUpdateRecoveryGuard() {
  if (!fs.existsSync(path.join(ROOT, LOCK_FILE))) {
    fail(`${LOCK_FILE} fehlt`);
  }
  const lock = JSON.parse(read(LOCK_FILE));
  if (!lock.locked) {
    ok("Lock-Datei: nicht gesperrt");
    return;
  }

  const required = Array.isArray(lock.requiredMarkers) ? lock.requiredMarkers : [];
  const forbidden = Array.isArray(lock.forbiddenPatterns) ? lock.forbiddenPatterns : [];

  for (const file of FILES) {
    const content = read(file);
    for (const needle of required) {
      if (!content.includes(needle)) {
        fail(`${file}: Pflicht-Marker fehlt: ${needle}`);
      }
    }
    for (const pattern of forbidden) {
      if (content.includes(pattern)) {
        fail(`${file}: verbotenes Muster: ${pattern}`);
      }
    }
    ok(`${file}: alle Pflicht-Marker (${required.length})`);
  }

  ok("App-Update/Reparatur-Banner geschützt");
}

runAppUpdateRecoveryGuard();
