#!/usr/bin/env node
"use strict";

/**
 * DAR CORE SENSITIVE CHANGE LOCK — DEFAULT DENY.
 * See .github/CORE_SECURITY_LOCK.md for required GitHub ruleset.
 * This guard NEVER handles, accepts, prints or stores a password.
 */
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const assert = require("node:assert/strict");

const EXACT = new Set([
  ".github/CODEOWNERS",
  ".github/CORE_SECURITY_LOCK.md",
  ".github/workflows/core-sensitive-change-lock.yml",
  "scripts/core-sensitive-change-lock.cjs",
  "assets/dar-setup-hub.js",
  "test/assets/dar-setup-hub.js",
  "ios/DarAlTawhid/DarAlTawhid/DarNativePermissions.swift",
  "ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift",
  "ios/DarAlTawhid/DarAlTawhid/WebAppView.swift",
  "ios/DarAlTawhid/DarAlTawhid/Info.plist",
  "ios/DarAlTawhid/Shared/DarPrayerEngine.swift",
  "ios/DarAlTawhid/Shared/DarDailyContent.swift",
  "ios/DarAlTawhid/Shared/DarWidgetTheme.swift",
  "ios/DarAlTawhid/DarAlTawhid/Widgets/DarAlTawhidWidgets.swift"
]);

const SENSITIVE_FILE = /^(?:(?:assets|test\/assets)\/[^/]*(?:prayer|qibla|geoloc|location|gps)[^/]*\.(?:js|mjs|ts)|(?:cloudflare|scripts)\/[^/]*(?:prayer|qibla|geoloc|location|gps)[^/]*\.(?:js|mjs|cjs|ts)|ios\/DarAlTawhid\/[^/]+\/[^/]*(?:Prayer|Qibla|Location|Permission)[^/]*\.swift)$/i;
const HTML_FILES = new Set(["index.html", "test/index.html"]);
const SENSITIVE_CHANGE = /\b(?:getPrayerSettings|savePrayerSettings|hasPrayerLocation|updatePrayerCountdowns|updateHeaderPrayerStatus|syncPrayerPushTags|syncPrayerPush|requestGeolocationPermissionFor|navigator\.geolocation|geolocation|dar-native-location|DAR_SETUP_HUB|qiblaDegrees|qiblaHeading|qiblaCompass|prayerTimes|prayerSettings|locationGranted|requestBrowserPosition|detectLocation)\b/i;

function protectedFile(name) {
  return EXACT.has(name) || SENSITIVE_FILE.test(name);
}

function sensitiveHtmlChange(patch) {
  if (typeof patch !== "string" || !patch) return true; // Fail closed on truncated GitHub patches.
  return patch.split("\n").some(function (line) {
    return /^[+-](?![+-])/.test(line) && SENSITIVE_CHANGE.test(line.slice(1));
  });
}

function classify(record) {
  const file = typeof record === "string" ? record : record.filename;
  if (typeof file !== "string" || !file) throw new Error("Invalid change-file record");
  const oldFile = typeof record === "string" ? null : record.previous_filename;
  if (protectedFile(file) || (oldFile && protectedFile(oldFile))) return file;
  if (HTML_FILES.has(file) || (oldFile && HTML_FILES.has(oldFile))) {
    if (sensitiveHtmlChange(typeof record === "string" ? null : record.patch)) return file;
  }
  return null;
}

function verify(changes) {
  if (!Array.isArray(changes)) throw new Error("Expected an array of GitHub changed files");
  const blocked = [...new Set(changes.map(classify).filter(Boolean))];
  if (blocked.length) {
    console.error("DAR CORE LOCK — BLOCKED. No location/Qibla/prayer/native security change without the repository owner's explicit approval.");
    blocked.forEach(function (f) { console.error("  - " + f); });
    console.error("This lock cannot be bypassed by a PR label, text marker, commit message or a password in a file.");
    process.exitCode = 1;
    return;
  }
  console.log("DAR CORE LOCK — OK. No protected file or protected HTML logic changed.");
}

function git(args) {
  return cp.execFileSync("git", args, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
}

function verifyPush() {
  const base = process.env.DAR_CORE_BASE || "";
  const head = process.env.DAR_CORE_HEAD || "HEAD";
  if (!/^[a-f0-9]{40}$/.test(base) || /^0+$/.test(base)) throw new Error("Missing valid push base — default deny");
  // Only the first installation may initialize the lock without blocking itself.
  try { git(["cat-file", "-e", base + ":.github/workflows/core-sensitive-change-lock.yml"]); }
  catch (_) { console.log("DAR CORE LOCK — first-time installation; self-test required."); return; }
  const names = git(["diff", "--name-only", "--diff-filter=ACDMRT", "-z", base, head]).split("\0").filter(Boolean);
  const changes = names.map(function (filename) {
    const patch = HTML_FILES.has(filename) ? git(["diff", "--unified=0", base, head, "--", filename]) : "";
    return { filename: filename, patch: patch };
  });
  verify(changes);
}

function selfTest() {
  assert.equal(protectedFile("assets/dar-setup-hub.js"), true);
  assert.equal(protectedFile("ios/DarAlTawhid/Shared/DarPrayerEngine.swift"), true);
  assert.equal(protectedFile(".github/workflows/core-sensitive-change-lock.yml"), true);
  assert.equal(protectedFile("assets/fake-gps-bridge.js"), true);
  assert.equal(protectedFile("content/q/314.json"), false);
  assert.equal(classify({ filename: "index.html", patch: "@@ -9 +9 @@\n-function getPrayerSettings() {}\n+function getPrayerSettings() { return {}; }\n" }), "index.html");
  assert.equal(classify({ filename: "index.html", patch: "@@ -9 +9 @@\n-<p>Old editorial paragraph</p>\n+<p>New editorial paragraph</p>\n" }), null);
  assert.equal(classify({ filename: "index.html" }), "index.html");
  assert.equal(classify({ filename: "test/assets/dar-setup-hub.js", patch: "" }), "test/assets/dar-setup-hub.js");
  console.log("DAR CORE LOCK self-test: 9/9 passed");
}

try {
  if (process.argv.includes("--self-test")) selfTest();
  else if (process.argv.includes("--push")) verifyPush();
  else {
    const i = process.argv.indexOf("--input");
    if (i === -1 || !process.argv[i + 1]) throw new Error("Missing --input JSON change list");
    verify(JSON.parse(fs.readFileSync(path.resolve(process.argv[i + 1]), "utf8")));
  }
} catch (err) {
  console.error("DAR CORE LOCK FAIL CLOSED:", err.message);
  process.exitCode = 1;
}
