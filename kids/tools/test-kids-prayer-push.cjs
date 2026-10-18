"use strict";
// Mock-only tests: no Cloudflare calls, no real OneSignal delivery.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const source = fs.readFileSync(path.resolve(__dirname, "../../cloudflare/kids-prayer-push.js"), "utf8")
  .replace(/^import .*;\s*$/m, "")
  .replace(/\bexport\s+/g, "");
const KIDS_APP_ID = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766";
const ADULT_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const sid = "7d18b907-6275-4e96-8ff8-bd49c38b4337";
const row = {
  onesignal_subscription_id: sid,
  prayer_lat: 50.6256, prayer_lon: 6.9491,
  prayer_timezone: "Europe/Berlin",
  prayer_angle: 12, prayer_asr_factor: 1
};
const sampleTimes = {
  fajr: { time: "05:00" }, dhuhr: { time: "13:00" },
  asr: { time: "16:00" }, maghrib: { time: "18:00" },
  isha: { time: "20:00" }
};
let calculationCalls = 0;
const context = {
  Date, URL, Intl, TextEncoder, crypto: webcrypto,
  computePublicPrayerTimes: args => {
    calculationCalls++;
    assert.equal(args.lat, row.prayer_lat);
    assert.equal(args.lon, row.prayer_lon);
    assert.equal(args.angle, 12);
    assert.equal(args.asrFactor, 1);
    return { ok: true, date: args.date, times: sampleTimes };
  }
};
vm.createContext(context);
vm.runInContext(source + "\nthis.testAPI = { dueKidsPrayers, runKidsPrayerPush };", context, { timeout: 5000 });
const { dueKidsPrayers, runKidsPrayerPush } = context.testAPI;

function fakeAPI({ rows = [row], dbStatus = 200, pushStatus = 200 } = {}) {
  const calls = [];
  async function request(url, options) {
    if (url.includes("supabase.co")) {
      calls.push({ type: "supabase", url, options });
      return { ok: dbStatus === 200, status: dbStatus, json: async () => rows };
    }
    assert.equal(url, "https://api.onesignal.com/notifications");
    const payload = JSON.parse(options.body);
    calls.push({ type: "onesignal", payload });
    return {
      ok: pushStatus === 200, status: pushStatus,
      json: async () => pushStatus === 200 ? { id: "mock-message-id", recipients: 1 } : { errors: ["mock"] }
    };
  }
  return { calls, request };
}

const approvedEnv = {
  KIDS_PRAYER_PUSH_ENABLED: "true",
  ONESIGNAL_KIDS_APP_ID: KIDS_APP_ID,
  ONESIGNAL_KIDS_API_KEY: "FAKE_TEST_KEY",
  SUPABASE_KIDS_SERVICE_ROLE_KEY: "FAKE_TEST_KEY"
};

async function main() {
  const now = new Date("2026-10-18T03:03:00.000Z"); // 05:03 CEST.
  assert.deepEqual(Array.from(dueKidsPrayers(row, now), x => x.key), ["fajr"]);
  assert.equal(dueKidsPrayers(row, new Date("2026-10-18T02:59:00Z")).length, 0);
  assert.equal(dueKidsPrayers(row, new Date("2026-10-18T03:08:00Z")).length, 0);
  assert.deepEqual(Array.from(dueKidsPrayers(row, new Date("2026-12-18T04:03:00Z")), x => x.key), ["fajr"]);
  assert.deepEqual(Array.from(dueKidsPrayers(row, new Date("2026-03-29T03:03:00Z")), x => x.key), ["fajr"]);
  assert.equal(dueKidsPrayers({ ...row, prayer_timezone: "Not/a-Timezone" }, now).length, 0);
  assert.ok(calculationCalls > 0);

  let mock = fakeAPI();
  let result = await runKidsPrayerPush({}, { now, request: mock.request });
  assert.equal(result.enabled, false);
  assert.equal(mock.calls.length, 0, "default disabled must not make requests");

  mock = fakeAPI();
  result = await runKidsPrayerPush({ ...approvedEnv, ONESIGNAL_KIDS_APP_ID: ADULT_APP_ID },
    { now, request: mock.request });
  assert.equal(result.enabled, false);
  assert.equal(mock.calls.length, 0, "adult app ID never allowed");

  mock = fakeAPI({ rows: [] });
  result = await runKidsPrayerPush(approvedEnv, { now, request: mock.request });
  assert.equal(result.sent, 0);
  assert.equal(mock.calls.filter(c => c.type === "onesignal").length, 0);

  mock = fakeAPI({ dbStatus: 401 });
  result = await runKidsPrayerPush(approvedEnv, { now, request: mock.request });
  assert.equal(result.sent, 0);
  assert.equal(mock.calls.filter(c => c.type === "onesignal").length, 0);

  mock = fakeAPI({ rows: Array(201).fill(row) });
  result = await runKidsPrayerPush(approvedEnv, { now, request: mock.request });
  assert.equal(result.sent, 0, "no partial audience sends");

  mock = fakeAPI({ rows: [row, row] });
  result = await runKidsPrayerPush(approvedEnv, { now, request: mock.request });
  assert.equal(result.sent, 1, "duplicate device rows must be deduplicated");
  const query = mock.calls.find(x => x.type === "supabase").url;
  for (const filter of [
    "prayer_enabled=eq.true", "parent_consent_verified_at=not.is.null",
    "guardian_auth_id=not.is.null", "consent_revoked_at=is.null"
  ]) assert.ok(query.includes(filter), "missing mandatory server filter " + filter);
  const push = mock.calls.find(x => x.type === "onesignal").payload;
  assert.equal(push.app_id, KIDS_APP_ID);
  assert.equal(push.include_subscription_ids[0], sid);
  assert.equal(push.include_subscription_ids.length, 1);
  assert.match(push.idempotency_key, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(push.data.prayer, "fajr");

  const repeat = fakeAPI();
  result = await runKidsPrayerPush(approvedEnv, { now, request: repeat.request });
  assert.equal(result.sent, 1);
  assert.equal(push.idempotency_key,
    repeat.calls.find(x => x.type === "onesignal").payload.idempotency_key,
    "retry must use the exact same OneSignal idempotency key");

  const failed = fakeAPI({ pushStatus: 401 });
  result = await runKidsPrayerPush(approvedEnv, { now, request: failed.request });
  assert.equal(result.sent, 0);
  assert.equal(result.failed, 1);

  console.log("PASS: 13+ Kids Salah push safety scenarios, timezone/DST, idempotency and consent");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
