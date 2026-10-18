"use strict";
// Isolated regression test — no real OneSignal network requests.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "../..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const appId = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766";
const adultId = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";

async function main() {
  const source = read("cloudflare/kids-content-push.js");
  assert.ok(!source.includes(adultId), "Kids sender must never contain adult app ID");
  assert.ok(!source.includes("env.ONESIGNAL_API_KEY"), "Kids sender must never use shared adult keys");
  assert.ok(source.includes("env.ONESIGNAL_KIDS_API_KEY"));
  assert.ok(source.includes("env.ONESIGNAL_KIDS_APP_ID"));
  assert.ok(source.includes('key: "kids_parent_push_consent"'));
  assert.ok(source.includes('key: "kids_content_push"'));
  assert.ok(source.includes('relation: "in_array"'), "Age filtering must not bypass consent through OR");
  const calls = [];
  const sandbox = {
    URL, TextEncoder, crypto: webcrypto,
    fetch: async (url, options) => {
      calls.push({ url, options, body: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ id: "test-id", recipients: 1 }) };
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(source.replace(/\bexport\s+/g, ""), sandbox, { timeout: 1000 });
  const item = { id: "lesson-1", ageMin: 4, ageMax: 10, kind: "lesson", revision: 1 };
  let result = await sandbox.sendKidsContentPush({}, item);
  assert.equal(result.sent, false);
  assert.equal(calls.length, 0, "Unconfigured push must not send");
  result = await sandbox.sendKidsContentPush({
    ONESIGNAL_KIDS_APP_ID: adultId, ONESIGNAL_KIDS_API_KEY: "test-only"
  }, item);
  assert.equal(result.sent, false);
  assert.equal(calls.length, 0, "Even a configured adult ID must never send");
  result = await sandbox.sendKidsContentPush({
    ONESIGNAL_KIDS_APP_ID: appId, ONESIGNAL_KIDS_API_KEY: "test-only"
  }, item);
  assert.equal(result.sent, true);
  assert.equal(calls.length, 1);
  const request = calls[0].body;
  assert.equal(request.app_id, appId);
  assert.ok(request.filters.some(f => f.key === "kids_parent_push_consent" && f.value === "yes"));
  assert.ok(request.filters.some(f => f.key === "kids_content_push" && f.value === "yes"));
  assert.equal(request.filters.filter(f => f.operator === "OR").length, 0);
  assert.ok(request.filters.some(f => f.key === "kids_age" && f.relation === "in_array"));

  const native = read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsPushNotifications.swift");
  const project = read("ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj/project.pbxproj");
  assert.ok(native.includes(appId));
  assert.ok(!native.includes(adultId));
  assert.ok(native.includes("#if KIDS_CREATOR_TEST"));
  assert.ok(native.includes(".deviceOwnerAuthentication"));
  assert.ok(native.includes("OneSignal.User.pushSubscription.optOut()"));
  assert.ok(project.includes("OneSignalFramework"));
  assert.ok(project.includes("version = 5.5.6"));
  assert.ok(read("ios/DarAlTawhidKids/DarAlTawhidKids/DarAlTawhidKidsApp.swift").includes("KidsPushAppDelegate"));
  const web = read("kids/kids-push-parent-v1.js");
  new Function(web);
  assert.ok(web.includes('DEDICATED_WEB_HOST = "kids.dar-al-tawhid.de"'));
  assert.ok(web.includes("if (!WEB_HOST_SAFE) throw"));
  assert.ok(web.includes("kids/push/onesignal/OneSignalSDKWorker.js"));
  for (const name of ["kids/index.html", "kids/start.html"])
    assert.ok(read(name).includes("/kids/kids-push-parent-v1.js?v=1"));
  console.log("Kids push isolation checks passed — simulated requests only.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
