"use strict";
// Regression checks intentionally use a fake OneSignal/Supabase network.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "../..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const kidsId = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766";
const adultId = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const subscriptionA = "d8f11300-1234-4234-8234-123456789abc";
const subscriptionB = "ba224400-1111-4111-8111-123456789bcd";

function buildSender({ dbRows = [], dbStatus = 200 } = {}) {
  const requests = [];
  const sandbox = {
    URL, TextEncoder, crypto: webcrypto,
    fetch: async (url, options = {}) => {
      const pathname = String(url);
      if (pathname.includes("/rest/v1/kids_push_subscriptions")) {
        requests.push({ type: "supabase", url: pathname, headers: options.headers });
        return {
          ok: dbStatus >= 200 && dbStatus < 300, status: dbStatus,
          json: async () => dbRows
        };
      }
      assert.equal(pathname, "https://api.onesignal.com/notifications");
      const body = JSON.parse(options.body);
      requests.push({ type: "onesignal", body });
      return { ok: true, status: 200, json: async () => ({
        id: "fake-notification-id", recipients: body.include_subscription_ids.length
      }) };
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(read("cloudflare/kids-content-push.js").replace(/\bexport\s+/g, ""), sandbox, { timeout: 1000 });
  return { requests, send: sandbox.sendKidsContentPush, preview: sandbox.kidsPushPreview };
}

async function main() {
  const source = read("cloudflare/kids-content-push.js");
  assert.ok(!source.includes(adultId), "Adult app ID must never be used in Kids sender");
  assert.ok(!source.includes("env.ONESIGNAL_API_KEY"), "No shared adult key fallback");
  assert.ok(source.includes("env.ONESIGNAL_KIDS_APP_ID"));
  assert.ok(source.includes("env.ONESIGNAL_KIDS_API_KEY"));
  assert.ok(source.includes("env.SUPABASE_KIDS_SERVICE_ROLE_KEY"));
  assert.ok(source.includes("parent_consent_verified_at"));
  assert.ok(source.includes("consent_revoked_at"));
  assert.ok(!source.includes("audienceFilters("), "Never trust client-controlled OneSignal tag filters");
  const item = { id: "lesson-1", ageMin: 4, ageMax: 10, kind: "lesson", revision: 1 };

  let sender = buildSender();
  let res = await sender.send({}, item);
  assert.equal(res.sent, false);
  assert.equal(sender.requests.length, 0, "No secret = no external reads or sends");

  sender = buildSender();
  res = await sender.send({
    ONESIGNAL_KIDS_APP_ID: adultId, ONESIGNAL_KIDS_API_KEY: "FAKE"
  }, item);
  assert.equal(res.sent, false);
  assert.equal(sender.requests.length, 0, "Wrong app ID must not fetch/send");

  const validEnv = {
    ONESIGNAL_KIDS_APP_ID: kidsId,
    ONESIGNAL_KIDS_API_KEY: "FAKE",
    SUPABASE_KIDS_SERVICE_ROLE_KEY: "FAKE"
  };

  sender = buildSender();
  res = await sender.send(validEnv, item);
  assert.equal(res.sent, false);
  assert.equal(sender.requests.filter(x => x.type === "onesignal").length, 0,
    "Without verified Kids devices, do not send");
  assert.equal(sender.requests.filter(x => x.type === "supabase").length, 1);

  sender = buildSender({ dbStatus: 401 });
  res = await sender.send(validEnv, item);
  assert.equal(res.sent, false);
  assert.equal(sender.requests.filter(x => x.type === "onesignal").length, 0,
    "Unauthorized DB read must fail closed");

  sender = buildSender({ dbRows: [
    { onesignal_subscription_id: subscriptionA },
    { onesignal_subscription_id: subscriptionB },
    { onesignal_subscription_id: subscriptionB } // duplicate must be removed
  ] });
  res = await sender.send(validEnv, item);
  assert.equal(res.sent, true);
  assert.equal(res.recipients, 2);
  const dbRequest = sender.requests.find(x => x.type === "supabase");
  assert.ok(dbRequest.url.includes("content_enabled=eq.true"));
  assert.ok(dbRequest.url.includes("parent_consent_verified_at=not.is.null"));
  assert.ok(dbRequest.url.includes("consent_revoked_at=is.null"));
  assert.ok(dbRequest.url.includes("kids_age_band=in."));
  assert.ok(dbRequest.headers.apikey === "FAKE");
  const osRequests = sender.requests.filter(x => x.type === "onesignal");
  assert.equal(osRequests.length, 1);
  assert.equal(osRequests[0].body.app_id, kidsId);
  assert.equal(osRequests[0].body.filters, undefined);
  assert.deepEqual(Array.from(osRequests[0].body.include_subscription_ids),
    [subscriptionA, subscriptionB]);
  assert.ok(osRequests[0].body.idempotency_key);

  const web = read("kids/kids-push-parent-v1.js");
  new Function(web);
  assert.ok(web.includes('DEDICATED_WEB_HOST = "kids.dar-al-tawhid.de"'));
  assert.ok(web.includes("if (!WEB_HOST_SAFE) throw"));
  assert.ok(web.includes('dar-kids-push-permission'));
  assert.ok(web.includes("kids/push/onesignal/OneSignalSDKWorker.js"));
  for (const page of ["kids/index.html", "kids/start.html"]) {
    assert.ok(read(page).includes("/kids/kids-push-parent-v1.js?v=1"));
  }
  const native = read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsPushNotifications.swift");
  const project = read("ios/DarAlTawhidKids/DarAlTawhidKids.xcodeproj/project.pbxproj");
  assert.ok(native.includes(kidsId));
  assert.ok(!native.includes(adultId));
  assert.ok(native.includes("OneSignal.setConsentRequired(true)"));
  assert.ok(native.includes(".deviceOwnerAuthentication"));
  assert.ok(native.includes("takePendingNotificationURL"));
  assert.ok(native.includes("#if KIDS_CREATOR_TEST"));
  assert.ok(project.includes("OneSignalFramework"));
  assert.ok(project.includes("version = 5.5.6"));
  console.log("PASS: Kids OneSignal/Supabase isolation, mandatory DB consent, iOS and web static checks");
}

main().catch(e => { console.error(e); process.exitCode = 1; });
