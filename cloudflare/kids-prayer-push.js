/**
 * TAWḤĪD KIDS · isolated, fail-closed prayer reminders.
 *
 * Deliberately NOT wired into the adults' Cloudflare scheduled() handler.
 * Requires a separate cron invocation and KIDS_PRAYER_PUSH_ENABLED=true.
 * Reuses the exact public calculation used by the Kids prayer screen.
 */
import { computePublicPrayerTimes } from "./prayer-push-scheduler.js";

const KIDS_APP_ID = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const LABELS = {
  fajr: "Fajr", dhuhr: "Ẓuhr", asr: "ʿAṣr", maghrib: "Maġrib", isha: "ʿIšāʾ"
};
const MAX_DEVICES_PER_TICK = 200;
const MAX_AFTER_START_MS = 7 * 60 * 1000;

function isUuid(value) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
    .test(String(value || ""));
}

function zoneDate(date, tz) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const get = name => parts.find(part => part.type === name)?.value || "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

function localPrayerMillis(day, hm, tz) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(hm)) return NaN;
  const [y, m, d] = day.split("-").map(Number);
  const [hour, minute] = hm.split(":").map(Number);
  if (hour > 23 || minute > 59) return NaN;
  const target = Date.UTC(y, m - 1, d, hour, minute);
  let epoch = target;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });
  for (let i = 0; i < 4; i++) {
    const parts = fmt.formatToParts(new Date(epoch));
    const p = n => Number(parts.find(part => part.type === n)?.value || 0);
    const displayed = Date.UTC(p("year"), p("month") - 1, p("day"), p("hour"), p("minute"));
    epoch += target - displayed;
  }
  return epoch;
}

/** Deterministic unique send window; OneSignal idempotency prevents retries duplicating a prayer. */
async function idempotencyKey(seed) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  const hex = [...new Uint8Array(raw)].slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8), hex.slice(8, 12), "5" + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hex.slice(18, 20),
    hex.slice(20, 32)
  ].join("-");
}

/** Compute due times from the same method, coordinates and timezone as Kids Salah. */
export function dueKidsPrayers(row, at = new Date()) {
  const now = at instanceof Date ? at : new Date(at);
  if (!Number.isFinite(now.getTime())) return [];
  const tz = String(row?.prayer_timezone || "");
  const lat = Number(row?.prayer_lat), lon = Number(row?.prayer_lon);
  const angle = Number(row?.prayer_angle || 12);
  const asr = Number(row?.prayer_asr_factor || 1);
  if (!tz || !Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180 ||
      !(angle > 0 && angle <= 30) || ![1, 2].includes(asr)) return [];
  try {
    const localDate = zoneDate(now, tz);
    const result = computePublicPrayerTimes({
      lat, lon, timeZone: tz, angle, asrFactor: asr, date: localDate
    });
    if (!result.ok || !result.times) return [];
    return PRAYERS.flatMap(key => {
      const hm = result.times[key]?.time;
      if (!hm || !/^\d{2}:\d{2}$/.test(hm)) return [];
      const timeMs = localPrayerMillis(localDate, hm, tz);
      const ageMs = now.getTime() - timeMs;
      return ageMs >= 0 && ageMs <= MAX_AFTER_START_MS
        ? [{ key, day: localDate, label: LABELS[key], timeMs }]
        : [];
    });
  } catch (_) {
    return [];
  }
}

/** No operation with missing permissions/secrets, even if accidentally invoked. */
export async function runKidsPrayerPush(env, { now = new Date(), request = fetch } = {}) {
  if (env?.KIDS_PRAYER_PUSH_ENABLED !== "true") {
    return { enabled: false, sent: 0, reason: "Kids prayer scheduler disabled" };
  }
  if (env?.ONESIGNAL_KIDS_APP_ID !== KIDS_APP_ID ||
      !env?.ONESIGNAL_KIDS_API_KEY ||
      !env?.SUPABASE_KIDS_SERVICE_ROLE_KEY) {
    return { enabled: false, sent: 0, reason: "Kids-only credentials unavailable" };
  }
  const secret = String(env.SUPABASE_KIDS_SERVICE_ROLE_KEY).trim();
  const apiKey = String(env.ONESIGNAL_KIDS_API_KEY).trim();
  if (!secret || !apiKey) return { enabled: false, sent: 0, reason: "Credentials unavailable" };

  // Entire audience must fit the cap; do not send only a subset.
  const url = new URL(SUPABASE_URL + "/rest/v1/kids_push_subscriptions");
  url.searchParams.set("select", "onesignal_subscription_id,prayer_lat,prayer_lon,prayer_timezone,prayer_angle,prayer_asr_factor");
  url.searchParams.set("prayer_enabled", "eq.true");
  url.searchParams.set("parent_consent_verified_at", "not.is.null");
  url.searchParams.set("guardian_auth_id", "not.is.null");
  url.searchParams.set("consent_revoked_at", "is.null");
  url.searchParams.set("limit", String(MAX_DEVICES_PER_TICK + 1));
  const dbHeaders = { apikey: secret, Accept: "application/json" };
  if (secret.startsWith("eyJ")) dbHeaders.Authorization = "Bearer " + secret;
  const response = await request(url.toString(), { headers: dbHeaders, cache: "no-store" })
    .catch(() => null);
  if (!response?.ok) return { enabled: true, sent: 0, reason: "Kids audience unavailable" };
  const rows = await response.json().catch(() => null);
  if (!Array.isArray(rows) || rows.length > MAX_DEVICES_PER_TICK) {
    return { enabled: true, sent: 0, reason: "Kids audience invalid or over safety cap" };
  }
  let sent = 0;
  let failed = 0;
  const attempted = new Set();
  for (const row of rows) {
    const subscription = String(row.onesignal_subscription_id || "");
    if (!isUuid(subscription)) continue;
    for (const prayer of dueKidsPrayers(row, now)) {
      const event = `${subscription}:${prayer.day}:${prayer.key}`;
      if (attempted.has(event)) continue;
      attempted.add(event);
      const landing = "https://dar-al-tawhid.de/kids/start?view=prayer";
      const body = {
        app_id: KIDS_APP_ID,
        target_channel: "push",
        include_subscription_ids: [subscription],
        headings: { de: `Zeit für ${prayer.label}`, en: `Zeit für ${prayer.label}` },
        contents: {
          de: `Das Gebet ${prayer.label} hat begonnen.`,
          en: `Das Gebet ${prayer.label} hat begonnen.`
        },
        url: landing,
        data: { type: "kids_prayer", prayer: prayer.key, url: landing },
        idempotency_key: await idempotencyKey("kids-prayer-v1:" + event),
        ios_sound: "default",
        chrome_web_icon: "https://dar-al-tawhid.de/kids/icons/icon-192.png?v=logo28",
        name: `kids-prayer-${prayer.key}-${prayer.day}`
      };
      // Never log or return subscription identifiers, credentials or coordinates.
      const result = await request("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          Authorization: "Key " + apiKey,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(body)
      }).catch(() => null);
      if (!result?.ok) { failed++; continue; }
      const feedback = await result.json().catch(() => null);
      if (!feedback?.id || feedback.errors) { failed++; continue; }
      sent++;
    }
  }
  return { enabled: true, sent, failed, checkedDevices: rows.length };
}
