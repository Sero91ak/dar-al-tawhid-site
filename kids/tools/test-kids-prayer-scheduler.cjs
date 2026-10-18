"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const script = fs.readFileSync(path.join(__dirname, "../../cloudflare/kids-prayer-worker.js"), "utf8")
  .replace(/import\s+\{\s*computePublicPrayerTimes\s*\}\s+from\s+"[^"]+";/, "")
  .replace(/export async function\s+/, "async function ")
  .replace(/export default\s+/, "const defaultHandler = ");

async function main() {
  assert.ok(!script.includes("786d7cd6"), "Must never use adult OneSignal ID");
  const now = Date.parse("2026-10-18T12:00:00.000Z");
  const subID = "ba224400-1111-4111-8111-123456789bcd";
  const calls = [];
  const ctx = {
    crypto: webcrypto, URL, TextEncoder, Date, Intl, Response,
    fetch: async (url, options) => {
      const target = String(url);
      if (target.includes("/rest/v1/kids_push_subscriptions")) {
        calls.push({ target: "db", url: target });
        return { ok: true, json: async () => [{
          onesignal_subscription_id: subID, client_platform: "native_ios",
          prayer_lat: 50.5, prayer_lon: 7, prayer_timezone: "Etc/UTC",
          prayer_angle: 12, prayer_asr_factor: 1, prayer_advance_minutes: 0,
          last_seen_at: new Date(now - 1000).toISOString()
        }] };
      }
      assert.equal(target, "https://api.onesignal.com/notifications");
      calls.push({ target: "push", payload: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ id: "fake" }) };
    },
    computePublicPrayerTimes: () => ({
      ok: true,
      times: {
        fajr: { time: "12:03" },
        dhuhr: { time: null }, asr: { time: null },
        maghrib: { time: null }, isha: { time: null }
      }
    })
  };
  vm.createContext(ctx);
  vm.runInContext(script, ctx, { timeout: 1500 });
  const send = vm.runInContext("scheduledKidsPrayerPush", ctx);
  let result = await send({ KIDS_PRAYER_PUSH_ENABLED: "false" }, now);
  assert.equal(result.skipped, true);
  assert.equal(calls.length, 0);

  const env = {
    KIDS_PRAYER_PUSH_ENABLED: "true",
    ONESIGNAL_KIDS_APP_ID: "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766",
    ONESIGNAL_KIDS_API_KEY: "FAKE",
    SUPABASE_KIDS_SERVICE_ROLE_KEY: "FAKE"
  };
  result = await send({ ...env, ONESIGNAL_KIDS_APP_ID: "786d7cd6-0455-4434-ab14-0c10a7bc6b1e" }, now);
  assert.equal(result.skipped, true);
  assert.equal(calls.length, 0);
  result = await send(env, now);
  assert.equal(result.scheduled, 1);
  assert.equal(calls.length, 2);
  const db = calls[0].url, payload = calls[1].payload;
  assert.ok(db.includes("parent_consent_verified_at=not.is.null"));
  assert.ok(db.includes("guardian_auth_id=not.is.null"));
  assert.ok(db.includes("consent_revoked_at=is.null"));
  assert.ok(db.includes("prayer_enabled=eq.true"));
  assert.equal(payload.app_id, env.ONESIGNAL_KIDS_APP_ID);
  assert.deepEqual(Array.from(payload.include_subscription_ids), [subID]);
  assert.equal(payload.send_after, "2026-10-18T12:03:00.000Z");
  assert.match(payload.idempotency_key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.ok(payload.url.includes("/kids/start?view=prayer"));
  console.log("PASS: Kids prayer cron disabled by default; filtered, exact UTC send simulated");
}
main().catch(e => { console.error(e); process.exitCode = 1; });
