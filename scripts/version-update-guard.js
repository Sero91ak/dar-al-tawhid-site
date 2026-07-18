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
const VISITOR_FILES = ["index.html", "test/index.html"];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function extractFunctionBody(content, fnName) {
  const startRe = new RegExp(`(?:async )?function ${fnName}\\(`);
  const m = content.match(startRe);
  if (!m || m.index == null) return null;
  let i = m.index + m[0].length;
  let pDepth = 1;
  let inStr = null;
  let esc = false;
  for (; i < content.length && pDepth > 0; i++) {
    const ch = content[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "(") pDepth += 1;
    else if (ch === ")") pDepth -= 1;
  }
  if (pDepth !== 0) return null;
  while (i < content.length && content[i] !== "{") i += 1;
  if (i >= content.length) return null;
  let depth = 0;
  const start = m.index;
  inStr = null;
  esc = false;
  for (; i < content.length; i++) {
    const ch = content[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(start, i + 1);
    }
  }
  return null;
}

function extractGuardBlock(content) {
  const start = content.indexOf("/* VERSION_UPDATE_GUARD:");
  if (start < 0) return "";
  const end = content.indexOf("window.DAR_AUTO_REFRESH = {", start);
  if (end < 0) return content.slice(start);
  const close = content.indexOf("})();", end);
  return close < 0 ? content.slice(start, end + 400) : content.slice(start, close);
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

  function mustNotInclude(label, content, needles, reason) {
    for (const needle of needles) {
      if (content.includes(needle)) {
        fail(`${label}: ${reason} (gefunden: „${needle}“)`);
        return false;
      }
    }
    ok(`${label}: keine verbotenen Muster (${needles.length})`);
    return true;
  }

  const visitorHtml = {};

  for (const htmlFile of VISITOR_FILES) {
    const html = read(htmlFile);
    visitorHtml[htmlFile] = html;

    mustInclude(`${htmlFile} VERSION_UPDATE_GUARD`, html, [
      "VERSION_UPDATE_GUARD",
      "showVersionBanner",
      "shouldSuppressVersionBanner",
      "VERSION_UPDATE_KEY",
      "markVersionUpdatePending",
      "requestHardShellRefresh",
      'type:"HARD_REFRESH"',
      "maybeAutoApplyShellUpdate",
      "syncPushRegistrationOnly",
      "syncPushRegistrationAndWelcome",
      "WELCOME_PUSH_SENT_KEY",
      "sendWelcomePushIfNeeded"
    ]);

    const guardBlock = extractGuardBlock(html);
    if (!guardBlock) {
      fail(`${htmlFile}: VERSION_UPDATE_GUARD Block nicht gefunden`);
    } else {
      mustInclude(`${htmlFile} Auto-Refresh Block`, guardBlock, [
        "shouldSuppressVersionBanner(remoteBuildId)",
        "showVersionBanner()",
        "markVersionUpdatePending:",
        "hideAllBanners:",
        "hardRefreshApp",
        "maybeAutoApplyShellUpdate"
      ]);
    }

    const syncAppServices = extractFunctionBody(html, "syncAppServices");
    if (!syncAppServices) {
      fail(`${htmlFile}: syncAppServices() fehlt`);
    } else {
      mustInclude(`${htmlFile} syncAppServices`, syncAppServices, ["syncPushRegistrationOnly"]);
      mustNotInclude(
        `${htmlFile} syncAppServices`,
        syncAppServices,
        ["repairPushConnection", "maintainPushHealth"],
        "syncAppServices darf kein repairPushConnection/maintainPushHealth nutzen (Willkommens-Push-Schleife)"
      );
    }

    const hardRefresh = extractFunctionBody(html, "hardRefreshApp");
    if (!hardRefresh) {
      fail(`${htmlFile}: hardRefreshApp() fehlt`);
    } else {
      mustInclude(`${htmlFile} hardRefreshApp`, hardRefresh, [
        "requestHardShellRefresh",
        "markVersionUpdatePending"
      ]);
      mustNotInclude(
        `${htmlFile} hardRefreshApp`,
        hardRefresh,
        ["syncAppServices"],
        "hardRefreshApp darf syncAppServices nicht vor Reload aufrufen (Willkommens-Push + Verzögerung)"
      );
    }

    const maintainPush = extractFunctionBody(html, "maintainPushHealth");
    if (!maintainPush) {
      fail(`${htmlFile}: maintainPushHealth() fehlt`);
    } else {
      mustInclude(`${htmlFile} maintainPushHealth`, maintainPush, ["syncPushRegistrationAndWelcome"]);
      if (/syncPushRegistrationOnly\s*\(/.test(maintainPush)) {
        fail(`${htmlFile} maintainPushHealth: darf syncPushRegistrationOnly nicht statt syncPushRegistrationAndWelcome nutzen`);
      } else {
        ok(`${htmlFile} maintainPushHealth: kein syncPushRegistrationOnly`);
      }
    }

    const repairPush = extractFunctionBody(html, "repairPushConnection");
    if (!repairPush) {
      fail(`${htmlFile}: repairPushConnection() fehlt`);
    } else if (!/removeItem\s*\(\s*WELCOME_PUSH_SENT_KEY\s*\)/.test(repairPush)) {
      fail(`${htmlFile} repairPushConnection: WELCOME_PUSH_SENT_KEY muss bei manueller Reparatur gelöscht werden`);
    } else if (!/if\s*\(\s*!silent\s*\)/.test(repairPush)) {
      fail(`${htmlFile} repairPushConnection: Willkommens-Push-Reset nur bei !silent`);
    } else {
      ok(`${htmlFile} repairPushConnection: Willkommens-Push-Reset`);
    }
  }

  const indexGuard = extractGuardBlock(visitorHtml["index.html"]);
  const testGuard = extractGuardBlock(visitorHtml["test/index.html"]);
  const parityKeys = [
    "VERSION_UPDATE_KEY",
    "VERSION_UPDATE_COOLDOWN_MS",
    "shouldSuppressVersionBanner",
    "markVersionUpdatePending",
    "showVersionBanner",
    "hardRefreshApp",
    "maybeAutoApplyShellUpdate"
  ];
  for (const key of parityKeys) {
    const inIndex = indexGuard.includes(key);
    const inTest = testGuard.includes(key);
    if (inIndex !== inTest) {
      fail(`index/test Parität: „${key}“ nur in ${inIndex ? "index.html" : "test/index.html"}`);
    }
  }
  if (parityKeys.every((k) => indexGuard.includes(k) && testGuard.includes(k))) {
    ok("index.html ↔ test/index.html: Update-Schutz parity");
  }

  const indexHtml = visitorHtml["index.html"];
  const buildMatch = indexHtml.match(/const APP_BUILD_ID="(app-shell-v\d+)"/);
  const testBuildMatch = visitorHtml["test/index.html"].match(/const APP_BUILD_ID="(app-shell-v\d+)"/);
  const version = JSON.parse(read("version.json"));
  let testVersion = version;
  try {
    testVersion = JSON.parse(read("test/version.json"));
  } catch (error) {
    fail("test/version.json fehlt oder ist ungültig");
  }
  if (!buildMatch) {
    fail("index.html: APP_BUILD_ID fehlt");
  } else if (buildMatch[1] !== version.buildId) {
    fail(`APP_BUILD_ID (${buildMatch[1]}) stimmt nicht mit version.json (${version.buildId}) überein`);
  } else {
    ok(`Build-ID synchron: ${version.buildId}`);
  }
  if (!testBuildMatch) {
    fail("test/index.html: APP_BUILD_ID fehlt");
  } else if (!testVersion || testBuildMatch[1] !== testVersion.buildId) {
    fail(`test/index.html APP_BUILD_ID (${testBuildMatch[1]}) stimmt nicht mit test/version.json (${testVersion?.buildId || "unbekannt"}) überein`);
  } else {
    ok(`test/index.html Build-ID synchron: ${testVersion.buildId}`);
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
