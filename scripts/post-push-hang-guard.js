#!/usr/bin/env node
/**
 * POST_PUSH_HANG_GUARD
 * Der Besucher-Beitrags-Push darf nicht hängen oder beschädigt bleiben.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "POST_PUSH_HANG_GUARD";
const LOCK_PATH = "content/admin/post-push-hang-lock.json";

let failures = 0;

function fail(msg) {
  failures += 1;
  console.error(`${MARKER} FAIL: ${msg}`);
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function runPostPushHangGuard() {
  failures = 0;

  if (!exists(LOCK_PATH)) {
    fail(`${LOCK_PATH} fehlt`);
    return failures;
  }

  let lock;
  try {
    lock = JSON.parse(read(LOCK_PATH));
  } catch (error) {
    fail(`${LOCK_PATH} ungültig: ${error.message || error}`);
    return failures;
  }

  if (lock.locked !== true) fail(`${LOCK_PATH}: locked muss true sein`);
  else ok("Hang-Sperre aktiv");

  if (lock.timezone !== "Europe/Berlin") fail("timezone muss Europe/Berlin sein");
  else ok("Anzeigen-Zeitzone Europe/Berlin");

  if (Number(lock.hangMaxWaitMs) > 180000) fail("hangMaxWaitMs darf höchstens 3 Minuten sein");
  else ok(`hangMaxWaitMs ${lock.hangMaxWaitMs}`);

  if (lock.requiredGuardMarker !== MARKER) fail("requiredGuardMarker fehlt");

  const requiredFiles = [
    "scripts/send-post-push.js",
    "scripts/post-push-hang-guard.js",
    ".github/workflows/post-push-hang-watchdog.yml",
    "cloudflare/post-push-admin.js",
    "content/admin/pending-pushes.json",
    "cloudflare/worker.js"
  ];
  for (const file of requiredFiles) {
    if (!exists(file)) fail(`Datei fehlt: ${file}`);
  }
  ok(`Pflicht-Dateien vorhanden (${requiredFiles.length})`);

  const send = read("scripts/send-post-push.js");
  for (const needle of [MARKER, "STUCK_REPAIR", "crypto.randomUUID", "Europe/Berlin"]) {
    if (!send.includes(needle)) fail(`send-post-push.js fehlt „${needle}“`);
  }
  if (send.includes("idempotency_key: collapse")) {
    fail("send-post-push.js darf keinen Slug als idempotency_key senden");
  } else {
    ok("OneSignal idempotency_key ist UUID-Pfad");
  }

  const worker = read("cloudflare/worker.js");
  for (const needle of [MARKER, "processPendingPushUntilLive", "processAllPendingPushes", "sendNewPostPush"]) {
    if (!worker.includes(needle)) fail(`worker.js fehlt „${needle}“`);
  }
  ok("Worker-Pending-Pfad vorhanden");

  const workflow = read(".github/workflows/post-push-hang-watchdog.yml");
  for (const needle of [MARKER, "STUCK_REPAIR", "POST_PUSH_NO_CF_POLL"]) {
    if (!workflow.includes(needle)) fail(`Watchdog-Workflow fehlt „${needle}“`);
  }
  if (/\n\s+schedule:/.test(workflow) || workflow.includes("*/5 * * * *") || workflow.includes("cron:")) {
    fail("Hang-Watchdog darf keinen GitHub-Cron haben (Cloudflare-Kostenfalle)");
  } else {
    ok("Kein 5-Minuten-GitHub-Cron");
  }
  if (workflow.includes("gh workflow run")) {
    fail("Hang-Watchdog darf keine extra Cloudflare-Deploys auslösen");
  } else {
    ok("Kein extra Cloudflare-Deploy aus dem Hang-Watchdog");
  }
  if (lock.autoHeal?.noCloudflarePoll !== true || lock.autoHeal?.noGithubIntervalCron !== true) {
    fail("Lock muss noCloudflarePoll + noGithubIntervalCron true haben");
  }
  ok("Hang-Watchdog nur ereignisgesteuert");

  const scope = JSON.parse(read("content/admin/change-scope-lock.json"));
  const always = Array.isArray(scope.alwaysAllowed) ? scope.alwaysAllowed : [];
  for (const needle of ["content/posts/", "content/admin/pending-pushes.json", "scripts/send-post-push.js", LOCK_PATH]) {
    if (!always.includes(needle)) fail(`alwaysAllowed fehlt ${needle} – Deploy/Queue würde wieder hängen`);
  }
  ok("Globalsperre lässt Beitrags-Deploy und Push-Queue durch");

  if (failures === 0) ok("Beitrags-Push-Hang-Schutz vollständig");
  return failures;
}

if (require.main === module) {
  const failed = runPostPushHangGuard();
  if (failed) {
    console.error(`\n${failed} ${MARKER}-Prüfung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("\nBeitrags-Push darf nicht hängen: alle Prüfungen bestanden.");
}

module.exports = { runPostPushHangGuard };
