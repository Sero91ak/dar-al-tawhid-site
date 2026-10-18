/**
 * TAWḤĪD KIDS: separate, fail-closed prayer push Worker.
 * Imports only the canonical *calculation* function from the adult scheduler,
 * not the adult audience, app ID, credentials or scheduled senders.
 * Deployment stays disabled until explicitly enabled and device-tested.
 */
import { computePublicPrayerTimes } from "./prayer-push-scheduler.js";

const APP_ID = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const PRAYERS = [
  ["fajr", "Fajr"], ["dhuhr", "Ẓuhr"], ["asr", "ʿAṣr"],
  ["maghrib", "Maġrib"], ["isha", "ʿIšāʾ"]
];
const PAGE_SIZE = 100;
const MAX_DEVICES = 1000;
const LOOKAHEAD = 7.5 * 60 * 1000;
const GRACE = 75 * 1000;
const MAX_REGISTRATION_AGE = 30 * 24 * 60 * 60 * 1000;

function localDate(date, tz) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const p = key => parts.find(x => x.type === key)?.value || "";
  return p("year") + "-" + p("month") + "-" + p("day");
}

function localClockUTC(day, hm, tz) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(hm || ""));
  if (!match) return NaN;
  const [y, m, d] = day.split("-").map(Number);
  const wanted = Date.UTC(y, m - 1, d, +match[1], +match[2]);
  let value = wanted;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23"
  });
  for (let i = 0; i < 3; i++) {
    const p = fmt.formatToParts(new Date(value));
    const n = k => Number(p.find(x => x.type === k)?.value || 0);
    const actual = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"));
    value += wanted - actual;
  }
  return value;
}

async function uuid(seed) {
  const sha = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed)));
  const hex = [...sha.slice(0, 16)].map(x => x.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-4" +
    hex.slice(13, 16) + "-" +
    (((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hex.slice(18, 20)) +
    "-" + hex.slice(20, 32);
}

function secrets(env) {
  const appID = String(env.ONESIGNAL_KIDS_APP_ID || "");
  const pushKey = String(env.ONESIGNAL_KIDS_API_KEY || "").trim();
  const dbKey = String(env.SUPABASE_KIDS_SERVICE_ROLE_KEY || "").trim();
  if (env.KIDS_PRAYER_PUSH_ENABLED !== "true" || appID !== APP_ID || !pushKey || !dbKey)
    return null;
  return { pushKey, dbKey };
}

async function getRegistrations(dbKey) {
  const all = [];
  for (let offset = 0; offset < MAX_DEVICES; offset += PAGE_SIZE) {
    const url = new URL(SUPABASE_URL + "/rest/v1/kids_push_subscriptions");
    url.searchParams.set("select", [
      "onesignal_subscription_id", "client_platform", "prayer_lat", "prayer_lon", "prayer_city",
      "prayer_timezone", "prayer_angle", "prayer_asr_factor",
      "prayer_advance_minutes", "last_seen_at"
    ].join(","));
    url.searchParams.set("parent_consent_verified_at", "not.is.null");
    url.searchParams.set("guardian_auth_id", "not.is.null");
    url.searchParams.set("consent_revoked_at", "is.null");
    url.searchParams.set("prayer_enabled", "eq.true");
    url.searchParams.set("order", "onesignal_subscription_id.asc");
    const headers = {
      apikey: dbKey, Accept: "application/json",
      Range: offset + "-" + (offset + PAGE_SIZE - 1)
    };
    if (dbKey.startsWith("eyJ")) headers.Authorization = "Bearer " + dbKey;
    const response = await fetch(url.toString(), { headers, cache: "no-store" });
    if (!response.ok) throw new Error("Kids-Supabase-Abfrage fehlgeschlagen");
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Ungültige Kids-Geräteliste");
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
  // No truncated audience: stop rather than silently ignore registered guardians.
  throw new Error("Kids-Gerätelimit erreicht; Prüfung erforderlich");
}

function eligible(row, now) {
  if (!/^[0-9a-f-]{36}$/i.test(String(row.onesignal_subscription_id || ""))) return false;
  const { prayer_lat: lat, prayer_lon: lon } = row;
  if (lat === null || lon === null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return false;
  if (+lat < -90 || +lat > 90 || +lon < -180 || +lon > 180) return false;
  const seen = Date.parse(String(row.last_seen_at || ""));
  return Number.isFinite(seen) && (now - seen) >= 0 && (now - seen) <= MAX_REGISTRATION_AGE;
}

async function deliver(env, pushKey, subscriptionID, platform, prayerKey, prayerName, day, target, now) {
  const idempotency = await uuid("kids-prayer:v1:" + subscriptionID + ":" + day + ":" + prayerKey);
  const launch = (platform === "native_ios"
    ? "https://dar-al-tawhid.de" : "https://kids.dar-al-tawhid.de") + "/kids/start?view=prayer";
  const payload = {
    app_id: APP_ID,
    target_channel: "push",
    include_subscription_ids: [subscriptionID],
    headings: { de: "Zeit für " + prayerName, en: "Zeit für " + prayerName },
    contents: { de: "Es ist Zeit für dein Gebet.", en: "Es ist Zeit für dein Gebet." },
    data: { type: "kids_prayer", prayer: prayerKey, url: launch },
    url: launch,
    name: "kids-prayer-" + day + "-" + prayerKey,
    idempotency_key: idempotency,
    ttl: 900
  };
  if (target > now + 15000) payload.send_after = new Date(target).toISOString();
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: "Key " + pushKey,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Kids-OneSignal-Push fehlgeschlagen (" + response.status + ")");
  const result = await response.json().catch(() => ({}));
  if (!result.id) throw new Error("OneSignal hat keine Nachricht-ID geliefert");
}

export async function scheduledKidsPrayerPush(env, now = Date.now()) {
  const sec = secrets(env);
  if (!sec) return { skipped: true, reason: "Kids-Push deaktiviert oder Secrets fehlen" };
  const registrations = await getRegistrations(sec.dbKey);
  let planned = 0, errors = 0;
  const cache = new Map();
  for (const row of registrations) {
    if (!eligible(row, now)) continue;
    try {
      const tz = String(row.prayer_timezone || "");
      if (!tz) continue;
      const day = localDate(new Date(now), tz);
      const key = [
        day, tz, row.prayer_lat, row.prayer_lon,
        row.prayer_angle || 12, row.prayer_asr_factor || 1
      ].join("|");
      if (!cache.has(key)) {
        const times = computePublicPrayerTimes({
          lat: row.prayer_lat, lon: row.prayer_lon,
          timeZone: tz, angle: row.prayer_angle || 12,
          asrFactor: row.prayer_asr_factor || 1, date: day
        });
        cache.set(key, times);
      }
      const times = cache.get(key);
      if (!times?.ok) continue;
      const advance = Math.max(0, Math.min(30, Number(row.prayer_advance_minutes) || 0)) * 60000;
      for (const [prayerKey, prayerName] of PRAYERS) {
        const hm = times.times?.[prayerKey]?.time;
        if (!hm) continue; // Polar/high-latitude invalid times are never guessed.
        const when = localClockUTC(day, hm, tz) - advance;
        if (!Number.isFinite(when) || when < now - GRACE || when > now + LOOKAHEAD) continue;
        await deliver(env, sec.pushKey, row.onesignal_subscription_id, row.client_platform, prayerKey, prayerName, day, when, now);
        planned++;
      }
    } catch (_) {
      errors++;
    }
  }
  return { checked: registrations.length, scheduled: planned, errors };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" || url.pathname !== "/health")
      return new Response("Not found", { status: 404 });
    return Response.json({ app: "tawhid-kids-prayer", ready: Boolean(secrets(env)) });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scheduledKidsPrayerPush(env));
  }
};
