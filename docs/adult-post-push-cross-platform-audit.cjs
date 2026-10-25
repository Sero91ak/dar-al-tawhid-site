#!/usr/bin/env node
"use strict";
/**
 * Read-only adult post push repair diagnostic (2026-10-13).
 * Does not send push, modify GitHub, connect to a DB, or modify files.
 * Run from repo root: node docs/adult-post-push-cross-platform-audit.cjs
 * Option: --require-ready (exit 2 while blockers exist).
 */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const worker = read("cloudflare/post-push-admin.js");
const action = read("scripts/send-post-push.js");
const native = read("ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift");
const iosWorker = read("cloudflare/ios-native-push-register.js");
const android = read("android/app/src/main/java/de/daraltawhid/app/DarPush.kt");
const lock = JSON.parse(read("content/admin/push-lanes-lock.json"));
const pending = JSON.parse(read("content/admin/pending-pushes.json"));
const noBroadAudience = (source) =>
  !/included_segments\s*:\s*\[\s*["'](?:Subscribed Users|Total Subscriptions|DAR_PUSH)["']\s*\]/.test(source);
const results = {
  mode: "READ_ONLY_NO_PUSH_NO_DEPLOY",
  scoped: ["adult-site", "adult-pwa", "adult-ios-native", "adult-android-native"],
  unrelatedAppsTouched: false,
  lockActive: lock.locked === true && lock.passwordRequired === true,
  lastReleasedPost: pending.pushes?.["quran-24-22-vergeben-und-nachsicht-20261012"]?.status || "missing",
  checks: {
    workerHasNoBroadAudienceFallback: noBroadAudience(worker),
    githubHasNoBroadAudienceFallback: noBroadAudience(action),
    githubSenderDoesNotUseRandomSendIdempotency: !action.includes("idempotency_key: crypto.randomUUID()"),
    iosRegistrationUsesExistingPrayerColumns: !native.includes('body["prayer_\\(key)_enabled"]'),
    iosRegistrationChecksHttpResult: (() => {
      const method = native.split("private static func saveSupabaseRegistration")[1]?.split("#if !targetEnvironment(macCatalyst)")[0] || "";
      return method.includes("HTTPURLResponse") && method.includes("200..<300");
    })(),
    iosWorkerHasExplicitPostPreference: iosWorker.includes("post_notifications"),
    iosSdkUsesPostPreference: native.includes('"post_notifications": "true"'),
    androidSdkUsesPostPreference: android.includes('"post_notifications" to "true"'),
    nativeIosDoesNotMisreportPermission: true // Must additionally be checked on real device.
  }
};
const gateNames = [
  "workerHasNoBroadAudienceFallback",
  "githubHasNoBroadAudienceFallback",
  "githubSenderDoesNotUseRandomSendIdempotency",
  "iosRegistrationUsesExistingPrayerColumns",
  "iosRegistrationChecksHttpResult",
  "iosWorkerHasExplicitPostPreference",
  "iosSdkUsesPostPreference",
  "androidSdkUsesPostPreference"
];
results.blockers = gateNames.filter(k => !results.checks[k]);
results.codeReady = results.lockActive && results.blockers.length === 0;
results.productionSafe = false; // Cannot certify actual iOS/Android/Web subscriptions offline.
results.next = "Require protected password unlock, independent one-device opt-in test per channel, live deploy check, idempotent send. Do NOT rerun old post.";
console.log("DAR_ADULT_POST_PUSH_AUDIT " + JSON.stringify(results, null, 2));
if (process.argv.includes("--require-ready") && !results.codeReady) process.exitCode = 2;
