#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
let failures = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  failures += 1;
  console.error(`PRAYER-PUSH-GUARD FAIL: ${message}`);
}

function pass(message) {
  console.log(`PRAYER-PUSH-GUARD OK: ${message}`);
}

function requireText(label, source, values) {
  for (const value of values) {
    if (!source.includes(value)) fail(`${label}: Pflichttext fehlt: ${value}`);
  }
}

function forbidText(label, source, values) {
  for (const value of values) {
    if (source.includes(value)) fail(`${label}: verbotener Altpfad gefunden: ${value}`);
  }
}

const copy = read("cloudflare/prayer-push-copy.js");
const scheduler = read("cloudflare/prayer-push-scheduler.js");
const admin = read("cloudflare/prayer-push-admin.js");
const worker = read("cloudflare/worker.js");
const deploy = read(".github/workflows/deploy-admin-publisher.yml");
const watchdog = read(".github/workflows/prayer-push.yml");
const legacySender = read("scripts/send-prayer-push.js");
const tags = read("assets/prayer-push-tags.js");

if (fs.existsSync(path.join(root, "scripts/patch-prayer-push-runtime.js"))) {
  fail("Veraltetes Runtime-Patchskript existiert noch");
} else {
  pass("Kein Runtime-Patchskript vorhanden");
}

requireText("Copy", copy, [
  "export const PRAYER_ADVANCE_PUSH_VARIANTS",
  "export const PRAYER_ENTRY_PUSH_VARIANTS",
  "export function sanitizePrayerPushText",
  "export function hasBlockedPrayerPhrase",
  "export function clampPrayerAdvanceMinutes",
  "ruft\\s+dich",
  "ʿAṣr-Zeit ist eingetreten"
]);

requireText("Scheduler", scheduler, [
  "dedupeRegistrations",
  "enforcePrayerCopyGuard",
  "hasBlockedPrayerPhrase",
  'userSource: "supabase-only"',
  'schedulerEngine: "cloudflare-worker-cron-v2"',
  "loadRegistrations",
  "sendPush(",
  "ADVANCE_COPY_VERSION",
  "cancelQueuedBadAdvancePushes"
]);

const loopGuard = read("scripts/prayer-push-loop-guard.js");
requireText("Loop-Guard", loopGuard, [
  "PRAYER_PUSH_LOOP_GUARD",
  "FORBIDDEN_PATTERNS"
]);

if (!fs.existsSync(path.join(root, "content/admin/prayer-push-scheduler-lock.json"))) {
  fail("content/admin/prayer-push-scheduler-lock.json fehlt – Scheduler-Schloss nicht gesetzt");
} else {
  pass("Scheduler-Schloss-Datei vorhanden");
}
forbidText("Scheduler", scheduler, [
  "SCHEDULE_LOOKAHEAD_MINUTES = 26 * 600"
]);

requireText("Admin", admin, [
  "runPrayerSchedulerWithAutoRepair",
  "sendPrayerTestPush",
  "readPrayerPushStatus"
]);

requireText("Worker", worker, [
  "/api/admin/prayer/run",
  "/api/admin/telegram/route-last",
  "ctx.waitUntil(routeLatestTelegramChannelPost",
  "ensurePrayerSchedulerFresh"
]);

forbidText("Deploy", deploy, [
  'patch-prayer-push-runtime.js',
  'Apply prayer push runtime migration'
]);
requireText("Deploy", deploy, [
  'node ../scripts/prayer-push-integrity-guard.js',
  "Deploy worker"
]);

forbidText("Watchdog", watchdog, [
  'node scripts/send-prayer-push.js',
  "Send scheduled prayer notifications"
]);
requireText("Watchdog", watchdog, [
  '/api/prayer/status',
  '/api/admin/prayer/run',
  'ageMinutes <= 12'
]);

requireText("Legacy-Sender", legacySender, [
  'Der alte direkte Gebets-Push-Sender ist deaktiviert.',
  'process.exit(1)'
]);
forbidText("Legacy-Sender", legacySender, [
  'fetch("https://api.onesignal.com',
  'postOneSignalNotification('
]);

requireText("App-Umgebung", tags, [
  'prayer_environment',
  'prayer_app_name',
  'prayer_installation_id',
  'app_environment: appEnvironment',
  'currentEnvironment()'
]);

if (failures > 0) {
  console.error(`\n${failures} Gebets-Push-Integritätsprüfung(en) fehlgeschlagen.`);
  process.exit(1);
}

console.log("\nGebets-Push-Integrität vollständig bestätigt: ein produktiver Scheduler, Produktionsfilter, Copy v4 und dauerhafter Status.");
