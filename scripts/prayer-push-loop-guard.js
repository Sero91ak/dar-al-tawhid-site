#!/usr/bin/env node
/**
 * PRAYER_PUSH_LOOP_GUARD
 * Verhindert die Wiederkehr der Maghrib-15-Min-Push-Schleife.
 * Blockiert Deploy/PR wenn der Scheduler wieder dynamische Idempotency-Keys
 * oder Cron-Nachsende-Schleifen einführt.
 *
 * Unlock nur nach ausdrücklicher Nutzer-Freigabe + Anpassung dieses Guards.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SCHEDULER = "cloudflare/prayer-push-scheduler.js";
const LOCK_FILE = "content/admin/prayer-push-scheduler-lock.json";
const MARKER = "PRAYER_PUSH_LOOP_GUARD";

const REQUIRED_STRINGS = [
  MARKER,
  "function slotDayKey(localDate)",
  "function scheduleSeed(version, group, prayer, slotDay, mode)",
  "function scheduleSeedBySendAfter(version, group, prayer, sendAfter, mode)",
  "function resolvePrayerSlotSendAfter(slot, entryAt, now, graceMinutes = SCHEDULE_GRACE_MINUTES)",
  "return null;",
  "const slotDay = slotDayKey(day);",
  "if (plannedSendAfter == null)",
  "await sendPush(env, group, prayer, slot.sendAfter, slot.mode, stats, sentInRun, slotDay)"
];

const FORBIDDEN_PATTERNS = [
  {
    re: /if\s*\(\s*slot\.mode\s*===\s*["']advance["']\s*&&\s*entryAt\s*>\s*now\s*\)\s*\{[\s\S]*?slot\.sendAfter\s*=\s*new Date\(now\.getTime\(\)\s*\+\s*1500\)/,
    reason: "Cron-Nachsende-Schleife für Vorab-Pushs (Maghrib-Loop-Bug)"
  },
  {
    re: /function scheduleSeed\(version, group, prayer, sendAfter, mode\)/,
    reason: "Idempotency-Key darf nicht mehr auf dynamischem send_after basieren"
  },
  {
    re: /scheduleSeed\([^)]*sendAfter\.toISOString\(\)/,
    reason: "scheduleSeed muss slotDay verwenden, nicht sendAfter.toISOString()"
  }
];

let failures = 0;

function fail(msg) {
  failures += 1;
  console.error(`PRAYER-PUSH-LOOP-GUARD FAIL: ${msg}`);
}

function ok(msg) {
  console.log(`PRAYER-PUSH-LOOP-GUARD OK: ${msg}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function runPrayerPushLoopGuard() {
  if (!fs.existsSync(path.join(ROOT, SCHEDULER))) {
    fail(`${SCHEDULER} fehlt`);
    return failures;
  }

  const scheduler = read(SCHEDULER);

  for (const needle of REQUIRED_STRINGS) {
    if (!scheduler.includes(needle)) {
      fail(`Pflicht-Marker fehlt in ${SCHEDULER}: ${needle}`);
    }
  }
  if (failures === 0) ok(`Alle Pflicht-Marker in ${SCHEDULER} (${REQUIRED_STRINGS.length})`);

  for (const { re, reason } of FORBIDDEN_PATTERNS) {
    if (re.test(scheduler)) {
      fail(`Verbotenes Muster: ${reason}`);
    }
  }
  if (failures === 0) ok("Keine verbotenen Loop-Muster im Scheduler");

  if (!fs.existsSync(path.join(ROOT, LOCK_FILE))) {
    fail(`${LOCK_FILE} fehlt – Scheduler-Schloss nicht gesetzt`);
  } else {
    try {
      const lock = JSON.parse(read(LOCK_FILE));
      if (lock.locked !== true) fail(`${LOCK_FILE}: locked muss true sein`);
      else ok(`${LOCK_FILE}: Scheduler gesperrt`);
    } catch (e) {
      fail(`${LOCK_FILE}: ungültiges JSON (${e.message})`);
    }
  }

  const diffFiles = (() => {
    try {
      const base = process.env.INTEGRITY_BASE_REF || process.env.GITHUB_EVENT_BEFORE || "HEAD~1";
      if (!base || base === "0000000000000000000000000000000000000000") return [];
      return execSync(`git diff --name-only ${base} HEAD`, { cwd: ROOT, encoding: "utf8" })
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  })();

  const touchesScheduler = diffFiles.includes(SCHEDULER);
  const unlockEnv = String(process.env.PRAYER_PUSH_SCHEDULER_UNLOCK || "").trim() === "approved";
  const commitMsg = String(process.env.GITHUB_COMMIT_MESSAGE || process.env.COMMIT_MESSAGE || "").toLowerCase();
  const unlockCommit = commitMsg.includes("prayer-push-scheduler-freigabe");

  if (touchesScheduler && !unlockEnv && !unlockCommit) {
    fail(
      `${SCHEDULER} wurde geändert ohne Freigabe. Nur mit Nutzer-Auftrag + Commit „prayer-push-scheduler-freigabe“ oder CI-Env PRAYER_PUSH_SCHEDULER_UNLOCK=approved.`
    );
  } else if (touchesScheduler) {
    ok(`${SCHEDULER}-Änderung mit dokumentierter Freigabe`);
  } else {
    ok(`${SCHEDULER} unverändert im Diff`);
  }

  return failures;
}

if (require.main === module) {
  const failed = runPrayerPushLoopGuard();
  if (failed) {
    console.error(`\n${failed} Prayer-Push-Loop-Guard-Prüfung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("\nPrayer-Push-Loop-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runPrayerPushLoopGuard, MARKER };
