#!/usr/bin/env node
/**
 * Strenger Schutz für Push-System (Gebet + Tages-Duʿāʾ/Empfehlung + Beitrags-Push).
 * Blockiert Deploy/PR wenn Scheduler, Endpunkte oder App-Sync entfernt wurden.
 *
 * Usage: node scripts/push-system-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function runPushSystemGuard() {
  let failed = 0;

  function fail(msg) {
    console.error("PUSH-GUARD FAIL:", msg);
    failed += 1;
  }

  function ok(msg) {
    console.log("PUSH-GUARD OK:", msg);
  }

  function mustInclude(label, content, needles) {
    for (const needle of needles) {
      if (!content.includes(needle)) {
        fail(`${label}: fehlt „${needle}“`);
        return false;
      }
    }
    ok(`${label}: alle Pflicht-Marker (${needles.length})`);
    return true;
  }

  function mustNotMatch(label, content, pattern, reason) {
    if (pattern.test(content)) {
      fail(`${label}: ${reason}`);
      return false;
    }
    ok(`${label}: Verbotsmuster nicht gefunden`);
    return true;
  }

  function mustExist(file) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) {
      fail(`Datei fehlt: ${file}`);
      return false;
    }
    ok(`Datei vorhanden: ${file}`);
    return true;
  }

  const workerPath = "cloudflare/worker.js";
  const worker = read(workerPath);
  const workerLines = worker.split("\n").length;

  if (workerLines < 1200) {
    fail(`worker.js hat nur ${workerLines} Zeilen – Push-Scheduler wurde vermutlich entfernt (min. 1200)`);
  } else {
    ok(`worker.js Größe (${workerLines} Zeilen)`);
  }

  mustInclude("worker.js Imports", worker, [
    'from "./prayer-push-admin.js"',
    'from "./daily-push-admin.js"',
    'from "./jummah-push-admin.js"',
    "ensurePrayerSchedulerFresh",
    "ensureDailyPushSchedulerFresh",
    "ensureJummahPushSchedulerFresh"
  ]);

  mustInclude("worker.js Cron scheduled()", worker, [
    "async scheduled(event, env, ctx)",
    "ctx.waitUntil(ensurePrayerSchedulerFresh",
    "ctx.waitUntil(ensureDailyPushSchedulerFresh",
    "ctx.waitUntil(ensureJummahPushSchedulerFresh"
  ]);

  mustNotMatch(
    "worker.js scheduled()",
    worker,
    /async scheduled\(event, env, ctx\)\s*\{\s*ctx\.waitUntil\(runScheduledPublishes\(env\)\);\s*\}/,
    "scheduled() darf nicht NUR runScheduledPublishes enthalten – Push-Cron fehlt"
  );

  mustInclude("worker.js Öffentliche Push-API", worker, [
    'url.pathname === "/api/prayer/status"',
    'url.pathname === "/api/daily/status"',
    'url.pathname === "/api/jummah/status"',
    'url.pathname === "/api/prayer/test"',
    'url.pathname === "/api/daily/test"',
    'url.pathname === "/api/jummah/test"',
    'url.pathname === "/api/push/welcome"'
  ]);

  mustInclude("worker.js Health Push-Metadaten", worker, [
    'prayerScheduler: "cloudflare-worker-cron"',
    'dailyPushScheduler: "cloudflare-worker-daily-v1"',
    'jummahPushScheduler: "cloudflare-worker-jummah-v1"',
    'prayerCron: "*/5 * * * *"',
    'dailyPushCron: "*/5 * * * *"',
    'jummahPushCron: "*/5 * * * *"'
  ]);

  mustInclude("worker.js PUSH_SYSTEM_GUARD Marker", worker, [
    "PUSH_SYSTEM_GUARD"
  ]);

  const wrangler = read("cloudflare/wrangler.toml");
  mustInclude("wrangler.toml", wrangler, ["[triggers]", 'crons = ["*/5 * * * *"]']);

  [
    "cloudflare/prayer-push-scheduler.js",
    "cloudflare/prayer-push-admin.js",
    "cloudflare/prayer-push-copy.js",
    "cloudflare/daily-push-scheduler.js",
    "cloudflare/daily-push-admin.js",
    "cloudflare/jummah-push-scheduler.js",
    "cloudflare/jummah-push-admin.js"
  ].forEach((file) => mustExist(file));

  mustInclude("prayer-push-scheduler.js", read("cloudflare/prayer-push-scheduler.js"), [
    "export async function runPrayerPushScheduler"
  ]);

  mustInclude("daily-push-scheduler.js", read("cloudflare/daily-push-scheduler.js"), [
    "export async function runDailyPushScheduler",
    "regenerateDailyContent",
    "sendDailyPushBatch",
    "include_subscription_ids",
    "onesignal-timezone",
    "duaDeliveryWindow"
  ]);

  mustInclude("daily-push.json", read("content/admin/daily-push.json"), [
    '"deliveryMode": "onesignal-timezone"'
  ]);

  mustExist(".github/workflows/daily-push-schedule.yml");
  mustExist("scripts/send-daily-content-push.js");

  mustInclude("send-daily-content-push.js", read("scripts/send-daily-content-push.js"), [
    "delayed_option",
    "delivery_time_of_day",
    "runDailyContentPushSchedule"
  ]);

  mustInclude("jummah-push-scheduler.js", read("cloudflare/jummah-push-scheduler.js"), [
    "export async function runJummahPushScheduler",
    "solarNoon",
    "isFridayLocal"
  ]);

  for (const htmlFile of ["index.html", "test/index.html"]) {
    const html = read(htmlFile);
    mustInclude(`${htmlFile} Push-Sync`, html, [
      "function syncPrayerPushTags",
      "function syncDailyPushTags",
      "function syncJummahPushTags",
      "function savePushRegistration",
      "function buildDailyPushTags",
      "function buildJummahPushTags",
      "function syncPushRegistrationAndWelcome",
      "function sendWelcomePushIfNeeded",
      "function repairPushConnection",
      "jummah-push-panel",
      "enableJummahPushBtn",
      "daily-push-panel",
      "enableDailyDuaPushBtn",
      "enableDailyRecommendationPushBtn",
      "testPrayerReminderBtn"
    ]);
  }

  mustExist("content/updates/daily.json");
  mustExist("content/admin/daily-push.json");
  mustExist("content/admin/daily-push-schema.sql");
  mustExist("content/admin/jummah-push-schema.sql");

  const daily = JSON.parse(read("content/updates/daily.json"));
  if (!daily?.dua?.id || !daily?.recommendation?.id) {
    fail("daily.json: dua.id und recommendation.id müssen gesetzt sein");
  } else {
    ok("daily.json: dua + recommendation");
  }

  if (!daily?.date || !/^\d{4}-\d{2}-\d{2}$/.test(daily.date)) {
    fail("daily.json: gültiges date-Feld fehlt");
  } else {
    ok(`daily.json: Datum ${daily.date}`);
  }

  const deployWorkflow = read(".github/workflows/deploy-admin-publisher.yml");
  mustInclude("deploy-admin-publisher.yml", deployWorkflow, [
    "cloudflare/prayer-push-*.js",
    "cloudflare/daily-push-*.js",
    "cloudflare/jummah-push-*.js"
  ]);

  return failed;
}

if (require.main === module) {
  const failed = runPushSystemGuard();
  if (failed) {
    console.error(`\n${failed} Push-Guard-Prüfung(en) fehlgeschlagen – Deploy/PR blockiert.`);
    console.error("Siehe scripts/push-system-guard.js und cloudflare/worker.js (PUSH_SYSTEM_GUARD).");
    process.exit(1);
  }
  console.log("\nPush-System-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runPushSystemGuard };
