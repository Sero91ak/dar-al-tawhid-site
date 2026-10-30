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
// Guard broad security boundaries against accidental AI edits, automation
// workflows and direct pushes. CODEOWNERS + an active ruleset protect ALL paths.
const CRITICAL_CONFIG = /^(?:\.github\/workflows\/|\.github\/(?:CODEOWNERS|CORE_SECURITY_LOCK\.md|dependabot\.ya?ml)$|(?:ios|android|apps)\/.*(?:Info\.plist|\.entitlements|AndroidManifest\.xml|\.xcodeproj\/project\.pbxproj|\/build\.gradle(?:\.kts)?)$|(?:scripts)\/[^/]*(?:security|integrity|guard|lock)[^/]*\.(?:js|cjs|mjs|ts)$)/i;
const HTML_FILES = new Set(["index.html", "test/index.html"]);
const SENSITIVE_CHANGE = /\b(?:getPrayerSettings|savePrayerSettings|hasPrayerLocation|updatePrayerCountdowns|updateHeaderPrayerStatus|syncPrayerPushTags|syncPrayerPush|requestGeolocationPermissionFor|navigator\.geolocation|geolocation|dar-native-location|DAR_SETUP_HUB|qiblaDegrees|qiblaHeading|qiblaCompass|prayerTimes|prayerSettings|locationGranted|requestBrowserPosition|detectLocation)\b/i;

function protectedFile(name) {
  return EXACT.has(name) || SENSITIVE_FILE.test(name) || CRITICAL_CONFIG.test(name);
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

// Scoped one-time migration approved by repository owner on 30.10.2026.
// Exact baseline and reviewed file hashes; no password or generic bypass.
function approvedGpsSecurityMigration(base, head) {
  if (base !== "42165bc603ea702da4752a04dd42d0f4c87c6454") return false;
  const expected = {
    ".github/CODEOWNERS": "cddbb44c335cdc017240e82c6baa8c10e45cccef",
    ".github/CORE_SECURITY_LOCK.md": "1f9b6f0ae86efa9f5c53066fc8fdee5557453f94",
    "assets/dar-setup-hub.js": "24cf7aaf0f02b942b76873ca9f72bc1fbf6d3bfc",
    "scripts/test-mobile-location-fresh-fix.cjs": "9aeb2d3b3384ae901775e126fb0a270532d79210",
    "test/assets/dar-setup-hub.js": "04ae186538199da67465054b275b5944866f80ad"
  };
  const guardPath = "scripts/core-sensitive-change-lock.cjs";
  const actual = git(["diff", "--name-only", "--diff-filter=ACDMRT", "-z", base, head])
    .split("\0").filter(Boolean).sort();
  const allowed = [...Object.keys(expected), guardPath].sort();
  if (JSON.stringify(actual) !== JSON.stringify(allowed)) return false;
  for (const [file, sha] of Object.entries(expected)) {
    if (git(["rev-parse", head + ":" + file]).trim() !== sha) return false;
  }
  if (!/^[a-f0-9]{40}$/.test(git(["rev-parse", head + ":" + guardPath]).trim())) return false;
  console.log("DAR CORE LOCK: owner-approved PR #1561 migration accepted exactly once.");
  return true;
}

// One-time owner-approved Qibla quick-capsule rollout, 30.10.2026 PR #1567.
// Exactly one immutable main baseline and precisely reviewed blob hashes.
// A PR title, password or future generic marker cannot bypass this boundary.
function approvedQiblaCapsuleMigration(base, head) {
  if (base !== "74f6114faba12eb8abd5eb0f4e0aea0699e5f4ea") return false;
  const expected = {
    "assets/qibla-quick-view.js": "1298bd614325366963806ffb3751535329917444",
    "assets/qibla-quick-view.css": "3d54e15436b50f8a9a51e26f9f4d6ad58956803d",
    "assets/dar-home-v31-visitor.js": "8918b29ef7e676c2830a665ced0dee6962f96178",
    "assets/dar-home-v31-visitor.css": "2bf3e9cd554c930e2fb2d1c2ba9c456e71652a12",
    "test/assets/dar-home-html-parity-v1.js": "8ae661b0f454b32f8aa5c345f13519c415e8ed2d",
    "scripts/test-qibla-native-bridge.cjs": "b2a102216fd7354bdda29b2a02c1677c946bec6a",
    "scripts/app-health-check.js": "f171402dc277c2345345b16d1633988b2db6be74",
    "content/admin/change-scope-lock.json": "6623093240da4ec57aa095c18d2702480debcdca"
  };
  const guardPath = "scripts/core-sensitive-change-lock.cjs";
  const actual = git(["diff", "--name-only", "--diff-filter=ACDMRT", "-z", base, head])
    .split("\0").filter(Boolean).sort();
  const allowed = [...Object.keys(expected), guardPath].sort();
  if (JSON.stringify(actual) !== JSON.stringify(allowed)) return false;
  for (const [file, sha] of Object.entries(expected)) {
    if (git(["rev-parse", head + ":" + file]).trim() !== sha) return false;
  }
  if (!/^[a-f0-9]{40}$/.test(git(["rev-parse", head + ":" + guardPath]).trim())) return false;
  console.log("DAR CORE LOCK: one-time reviewed owner approval for Qibla capsule PR #1567.");
  return true;
}

// Scoped 30.10.2026: owner-approved wiring of adult Home capsules to
// the already existing fullscreen Qibla focus; no sensor/engine changes.
// The old mini-popup-specific regression test is updated in the same PR.
function approvedFullscreenQiblaEntryMigration(base, head) {
  if (base !== "e958fad53ededa0e467bd1841d5f30f946c0c830") return false;
  const expected = {
    "assets/dar-home-v31-visitor.js": "0dca696af0f52d5c25212eb37b81f6da3a29fbc2",
    "test/assets/dar-home-html-parity-v1.js": "5bf5ff12f7c26822e088011f36647f837c03ce2f",
    "test/tools/check-smart-profile-v1.cjs": "d764724e268b401fa7740bbb2dfba96924bba7d8",
    "test/tools/test-adult-fullscreen-entrypoints.cjs": "081ea992366060afb70959fdb15ddf44d9a45271",
    "scripts/test-qibla-native-bridge.cjs": "af41467419e8f4f14fd6e8bc6729075eeeda1ede",
    "scripts/app-health-check.js": "dd51b552def4b1b907bf4ddfda85c7d66f14e5a7",
    "content/admin/change-scope-lock.json": "3b904003087f10921778bb53c5b7674b1062de64"
  };
  const guardPath = "scripts/core-sensitive-change-lock.cjs";
  const actual = git(["diff","--name-only","--diff-filter=ACDMRT","-z",base,head])
    .split("\0").filter(Boolean).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...Object.keys(expected),guardPath].sort()))
    return false;
  for (const [file,sha] of Object.entries(expected)) {
    if (git(["rev-parse",head+":"+file]).trim() !== sha) return false;
  }
  if (!/^[a-f0-9]{40}$/.test(git(["rev-parse",head+":"+guardPath]).trim())) return false;
  console.log("DAR CORE LOCK: one-time owner-approved fullscreen Qibla focus PR.");
  return true;
}

function verifyPush() {
  const base = process.env.DAR_CORE_BASE || "";
  const head = process.env.DAR_CORE_HEAD || "HEAD";
  if (!/^[a-f0-9]{40}$/.test(base) || /^0+$/.test(base)) throw new Error("Missing valid push base — default deny");
  // Only the first installation may initialize the lock without blocking itself.
  try { git(["cat-file", "-e", base + ":.github/workflows/core-sensitive-change-lock.yml"]); }
  catch (_) { console.log("DAR CORE LOCK — first-time installation; self-test required."); return; }
  if (approvedGpsSecurityMigration(base, head)) return;
  if (approvedQiblaCapsuleMigration(base, head)) return;
  if (approvedFullscreenQiblaEntryMigration(base, head)) return;
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
  assert.equal(approvedGpsSecurityMigration("0000000000000000000000000000000000000000", "HEAD"), false);
  assert.equal(approvedQiblaCapsuleMigration("0000000000000000000000000000000000000000", "HEAD"), false);
  assert.equal(approvedFullscreenQiblaEntryMigration("0000000000000000000000000000000000000000", "HEAD"), false);
  assert.equal(protectedFile(".github/workflows/visitor-deploy.yml"), true);
  assert.equal(protectedFile("ios/DarAlTawhid/DarAlTawhid/Info.plist"), true);
  assert.equal(protectedFile("ios/DarAlTawhid/DarAlTawhid.xcodeproj/project.pbxproj"), true);
  assert.equal(protectedFile("scripts/push-system-guard.js"), true);
  assert.equal(protectedFile("content/q/314.json"), false);
  assert.equal(classify({ filename: "index.html", patch: "@@ -9 +9 @@\n-function getPrayerSettings() {}\n+function getPrayerSettings() { return {}; }\n" }), "index.html");
  assert.equal(classify({ filename: "index.html", patch: "@@ -9 +9 @@\n-<p>Old editorial paragraph</p>\n+<p>New editorial paragraph</p>\n" }), null);
  assert.equal(classify({ filename: "index.html" }), "index.html");
  assert.equal(classify({ filename: "test/assets/dar-setup-hub.js", patch: "" }), "test/assets/dar-setup-hub.js");
  console.log("DAR CORE LOCK self-test: PASS");
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
