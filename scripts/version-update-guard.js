#!/usr/bin/env node
/**
 * VERSION_UPDATE_GUARD: blockiert Deploy wenn App-Update-/Push-Sync-Schutz entfernt wurde.
 * Verhindert Wiederkehr von Versions-Banner-Schleife und fehlendem Willkommens-Push.
 *
 * Usage: node scripts/version-update-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function runVersionUpdateGuard() {
  let failed = 0;

  function fail(msg) {
    console.error("VERSION-GUARD FAIL:", msg);
    failed += 1;
  }

  function ok(msg) {
    console.log("VERSION-GUARD OK:", msg);
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

  for (const htmlFile of ["index.html", "test/index.html"]) {
    const html = read(htmlFile);
    mustInclude(`${htmlFile} VERSION_UPDATE_GUARD`, html, [
      "VERSION_UPDATE_GUARD",
      "showVersionBanner",
      "shouldSuppressVersionBanner",
      "VERSION_UPDATE_KEY",
      "markVersionUpdatePending",
      "requestHardShellRefresh",
      'type:"HARD_REFRESH"',
      "repairPushConnection({silent:true})",
      "syncPushRegistrationAndWelcome",
      "WELCOME_PUSH_SENT_KEY",
      "sendWelcomePushIfNeeded"
    ]);
  }

  const indexHtml = read("index.html");
  const buildMatch = indexHtml.match(/const APP_BUILD_ID="(app-shell-v\d+)"/);
  const version = JSON.parse(read("version.json"));
  if (!buildMatch) {
    fail("index.html: APP_BUILD_ID fehlt");
  } else if (buildMatch[1] !== version.buildId) {
    fail(`APP_BUILD_ID (${buildMatch[1]}) stimmt nicht mit version.json (${version.buildId}) überein`);
  } else {
    ok(`Build-ID synchron: ${version.buildId}`);
  }

  const sw = read("service-worker.js");
  if (!/HARD_REFRESH/.test(sw) || !/hardRefreshUntil/.test(sw)) {
    fail("service-worker.js: HARD_REFRESH Handler fehlt");
  } else {
    ok("service-worker.js: HARD_REFRESH Handler");
  }

  const admin = read("admin/index.html");
  mustInclude("admin/index.html Sammel-Paket ZIP", admin, [
    "bulkZipFileInput",
    "importBulkZipFile",
    "renderBulkPackPanel",
    "bulkPackPanel"
  ]);

  return failed;
}

if (require.main === module) {
  const failed = runVersionUpdateGuard();
  if (failed) {
    console.error(`\n${failed} Version-Guard-Prüfung(en) fehlgeschlagen – Deploy blockiert.`);
    process.exit(1);
  }
  console.log("\nVersion-Update-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runVersionUpdateGuard };
