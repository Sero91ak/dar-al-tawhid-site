#!/usr/bin/env node
/**
 * PUSH_AUTONOMOUS_HEAL_GUARD
 * Stellt sicher, dass Client-Autorepair + Worker-Secret-Watchdog nicht entfernt werden.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LOCK_PATH = "content/admin/push-autonomous-heal-lock.json";
const MARKER = "PUSH_AUTONOMOUS_HEAL_GUARD";

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  return 1;
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
  return 0;
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function runPushAutonomousHealGuard() {
  let failed = 0;
  const full = path.join(ROOT, LOCK_PATH);
  if (!fs.existsSync(full)) {
    return fail(`${LOCK_PATH} fehlt`);
  }
  let lock;
  try {
    lock = JSON.parse(read(LOCK_PATH));
  } catch (e) {
    return fail(`${LOCK_PATH} ungültig: ${e.message || e}`);
  }

  const required = lock.requiredMarkers || {};
  for (const [file, needles] of Object.entries(required)) {
    const fullFile = path.join(ROOT, file);
    if (!fs.existsSync(fullFile)) {
      failed += fail(`Datei fehlt: ${file}`);
      continue;
    }
    const content = read(file);
    for (const needle of needles) {
      if (!content.includes(needle)) {
        failed += fail(`${file}: fehlt „${needle}“`);
      }
    }
    ok(`${file}: Pflicht-Marker (${needles.length})`);
  }

  const forbidden = lock.forbiddenPatterns || {};
  for (const [file, patterns] of Object.entries(forbidden)) {
    const fullFile = path.join(ROOT, file);
    if (!fs.existsSync(fullFile)) continue;
    const content = read(file);
    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        failed += fail(`${file}: verbotenes Muster „${pattern}“`);
      }
    }
    ok(`${file}: Verbotsmuster geprüft`);
  }

  return failed;
}

if (require.main === module) {
  const failed = runPushAutonomousHealGuard();
  if (failed) {
    console.error(`\n${failed} Push-Autorepair-Guard-Prüfung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("\nPush-Autonomous-Heal-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runPushAutonomousHealGuard };
