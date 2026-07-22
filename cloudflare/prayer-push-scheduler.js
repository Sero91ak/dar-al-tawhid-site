/**
 * Gebetszeiten-Push – einziger produktiver Scheduler.
 * Nutzerquelle: Supabase prayer_push_registrations.
 */

import { PRAYER_PUSH_COPY_VERSION, pickPrayerEntryVariant, buildAdvancePushBody } from "./prayer-push-copy.js";
import { writePrayerStatusToStore } from "./prayer-status-store.js";

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de/#prayer";
const DEFAULT_PRAYER_STATUS_PATH = "content/admin/prayer-push-status.json";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

const DEFAULT_PRAYER_ADVANCE_MINUTES = 15;
const SCHEDULE_LOOKAHEAD_BASE_MINUTES = 90;
const SCHEDULE_CRON_BUFFER_MINUTES = 5;
// Vorab-Erinnerung liegt 15 Min vor der Gebetszeit – Planungsfenster muss das abdecken.
const SCHEDULE_LOOKAHEAD_MINUTES = SCHEDULE_LOOKAHEAD_BASE_MINUTES + DEFAULT_PRAYER_ADVANCE_MINUTES + SCHEDULE_CRON_BUFFER_MINUTES;
const SCHEDULE_LOOKAHEAD_MAX_MINUTES = 120;
const SCHEDULE_GRACE_MINUTES = 15;
const PRAYER_COPY_MIGRATION_UNTIL = Date.parse("2026-07-24T23:59:59Z");
const PREVIOUS_COPY_VERSIONS = Object.freeze(["v3"]);
const PRAYER_PUSH_EMOJI = Object.freeze({
  fajr: "✨",
  dhuhr: "☀️",
  asr: "🌤️",
  maghrib: "🌥️",
  isha: "🌙",
  tahajjud: "🌙"
});
const REFERENCE = { lat: 50.6256, lon: 6.9491, city: "Rheinbach", timeZone: "Europe/Berlin" };

let lastStatusReport = null;

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function siteOrigin(env) {
  return String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
}

function withIcons(payload, env) {
  const origin = siteOrigin(env);
  return {
    ...payload,
    chrome_web_icon: `${origin}/notification-icon-192.png?v=2`,
    chrome_web_badge: `${origin}/notification-badge-96.png?v=2`,
    firefox_icon: `${origin}/notification-icon-192.png?v=2`
  };
}

function toRad(value) { return value * Math.PI / 180; }
function toDeg(value) { return value * 180 / Math.PI; }
function fixAngle(value) { return ((value % 360) + 360) % 360; }
function fixHour(value) { return ((value % 24) + 24) % 24; }

function getLocalParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const result = {};
  for (const part of parts) result[part.type] = part.value;
  return {
    year: Number(result.year),
    month: Number(result.month),
    day: Number(result.day),
    hour: Number(result.hour),
    minute: Number(result.minute),
    second: Number(result.second)
  };
}

function tzOffsetMin(date, timeZone) {
  const local = getLocalParts(date, timeZone);
  const utc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  return Math.round((utc - date.getTime()) / 60000);
}

function utcFromLocal(localDate, hourDecimal, timeZone) {
  const hour = Math.floor(fixHour(hourDecimal));
  const minute = Math.round((fixHour(hourDecimal) - hour) * 60);
  const minutes = hour * 60 + minute;
  const midnight = Date.UTC(localDate.year, localDate.month - 1, localDate.day);
  const guess = new Date(midnight + minutes * 60000);
  return new Date(midnight + minutes * 60000 - tzOffsetMin(guess, timeZone) * 60000);
}

function todayLocal(timeZone) {
  const parts = getLocalParts(new Date(), timeZone);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function dayOfYear(date) {
  const start = Date.UTC(date.year, 0, 0);
  return Math.floor((Date.UTC(date.year, date.month - 1, date.day) - start) / 86400000);
}

function addDays(date, count) {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + count));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

function sunTime(localDate, lat, lon, angle, morning, timeZone) {
  const day = dayOfYear(localDate);
  const longitudeHour = lon / 15;
  const t = day + (((morning ? 6 : 18) - longitudeHour) / 24);
  const meanAnomaly = (0.9856 * t) - 3.289;
  let longitude = meanAnomaly
    + (1.916 * Math.sin(toRad(meanAnomaly)))
    + (0.020 * Math.sin(toRad(2 * meanAnomaly)))
    + 282.634;
  longitude = fixAngle(longitude);
  let rightAscension = fixAngle(toDeg(Math.atan(0.91764 * Math.tan(toRad(longitude)))));
  rightAscension = (
    rightAscension
    + (Math.floor(longitude / 90) * 90 - Math.floor(rightAscension / 90) * 90)
  ) / 15;
  const sinDeclination = 0.39782 * Math.sin(toRad(longitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHour = (
    Math.cos(toRad(90 + angle))
    - sinDeclination * Math.sin(toRad(lat))
  ) / (cosDeclination * Math.cos(toRad(lat)));
  if (cosHour > 1 || cosHour < -1) return null;
  const hourAngle = (
    morning ? 360 - toDeg(Math.acos(cosHour)) : toDeg(Math.acos(cosHour))
  ) / 15;
  const localMeanTime = hourAngle + rightAscension - (0.06571 * t) - 6.622;
  const noon = utcFromLocal(localDate, 12, timeZone);
  return fixHour((localMeanTime - longitudeHour) + tzOffsetMin(noon, timeZone) / 60);
}

function solarNoon(localDate, lat, lon, timeZone) {
  const sunrise = sunTime(localDate, lat, lon, 0.833, true, timeZone);
  const sunset = sunTime(localDate, lat, lon, 0.833, false, timeZone);
  return sunrise == null || sunset == null ? 12 : fixHour((sunrise + sunset) / 2);
}

function asrTime(localDate, lat, lon, factor, timeZone) {
  const noon = solarNoon(localDate, lat, lon, timeZone);
  const declination = 23.45 * Math.sin(toRad((360 / 365) * (284 + dayOfYear(localDate))));
  const angle = toDeg(Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - declination))))));
  const cosHour = (
    Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(declination))
  ) / (Math.cos(toRad(lat)) * Math.cos(toRad(declination)));
  if (cosHour > 1 || cosHour < -1) return fixHour(noon + 4);
  return fixHour(noon + toDeg(Math.acos(cosHour)) / 15);
}

function formatHour(hour) {
  let total = Math.round(fixHour(hour) * 60);
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function normAdvance(value) {
  const number = Number(value);
  return [5, 10, 15].includes(number) ? number : DEFAULT_PRAYER_ADVANCE_MINUTES;
}

function slotDayKey(localDate) {
  return `${localDate.year}-${String(localDate.month).padStart(2, "0")}-${String(localDate.day).padStart(2, "0")}`;
}

function resolveScheduleLookahead(env) {
  const configured = Number(env.PRAYER_SCHEDULE_LOOKAHEAD_MINUTES || SCHEDULE_LOOKAHEAD_MINUTES);
  const base = Number.isFinite(configured) ? configured : SCHEDULE_LOOKAHEAD_MINUTES;
  return Math.min(SCHEDULE_LOOKAHEAD_MAX_MINUTES, Math.max(30, base));
}

function resolvePrayerSlotSendAfter(slot, entryAt, now, graceMinutes = SCHEDULE_GRACE_MINUTES) {
  if (slot.mode !== "advance" || !(entryAt instanceof Date) || entryAt <= now) return slot.sendAfter;
  const originalAdvance = slot.sendAfter;
  if (originalAdvance > now) return originalAdvance;
  // Vorab-Zeit vorbei, Gebetszeit noch nicht – höchstens einmal innerhalb der Grace nachholen.
  const graceEnd = new Date(originalAdvance.getTime() + graceMinutes * 60000);
  if (now <= graceEnd && now < entryAt) return new Date(now.getTime() + 1500);
  return null;
}

function normTahajjud(value) {
  const text = String(value || "off");
  if (text === "true") return "lastThird";
  return ["off", "before30", "before60", "before90", "lastThird"].includes(text) ? text : "off";
}

function tahajjudUtc(maghribUtc, fajrUtc, mode) {
  if (mode === "off" || !(fajrUtc > maghribUtc)) return null;
  if (mode === "before30") return new Date(fajrUtc.getTime() - 30 * 60000);
  if (mode === "before60") return new Date(fajrUtc.getTime() - 60 * 60000);
  if (mode === "before90") return new Date(fajrUtc.getTime() - 90 * 60000);
  return new Date(maghribUtc.getTime() + ((fajrUtc.getTime() - maghribUtc.getTime()) * 2 / 3));
}

function prayerTimes(localDate, lat, lon, timeZone, methodAngle, asrFactor, tahajjudMode) {
  const fajr = sunTime(localDate, lat, lon, methodAngle, true, timeZone);
  const dhuhr = solarNoon(localDate, lat, lon, timeZone);
  const asr = asrTime(localDate, lat, lon, asrFactor, timeZone);
  const maghrib = sunTime(localDate, lat, lon, 0.833, false, timeZone);
  const isha = sunTime(localDate, lat, lon, methodAngle, false, timeZone);
  const prayers = [
    { key: "fajr", name: "Fajr", time: fajr },
    { key: "dhuhr", name: "Dhuhr", time: dhuhr },
    { key: "asr", name: "ʿAṣr", time: asr },
    { key: "maghrib", name: "Maghrib", time: maghrib },
    { key: "isha", name: "ʿIshāʾ", time: isha }
  ];

  const normalizedTahajjud = normTahajjud(tahajjudMode);
  if (normalizedTahajjud !== "off" && maghrib != null) {
    const tomorrow = addDays(localDate, 1);
    const nextFajr = sunTime(tomorrow, lat, lon, methodAngle, true, timeZone);
    if (nextFajr != null) {
      const maghribUtc = utcFromLocal(localDate, maghrib, timeZone);
      const fajrUtc = utcFromLocal(tomorrow, nextFajr, timeZone);
      const start = tahajjudUtc(maghribUtc, fajrUtc, normalizedTahajjud);
      if (start) prayers.push({ key: "tahajjud", name: "Taḥajjud", time: null, sendAfter: start });
    }
  }

  return prayers;
}

function parseTimestamp(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function dedupeRegistrations(rows) {
  const bySubscription = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const subscriptionId = String(row?.subscription_id || "").trim();
    if (!subscriptionId) continue;
    if (!Number.isFinite(Number(row.lat)) || !Number.isFinite(Number(row.lon))) continue;
    const existing = bySubscription.get(subscriptionId);
    if (!existing || parseTimestamp(row.last_synced_at) >= parseTimestamp(existing.last_synced_at)) {
      bySubscription.set(subscriptionId, row);
    }
  }
  return Array.from(bySubscription.values());
}

async function loadRegistrations() {
  const query = [
    "enabled=eq.true",
    "push_opted_in=eq.true",
    "app_environment=eq.production",
    "select=device_id,subscription_id,lat,lon,timezone,method_angle,asr_factor,advance_minutes,tahajjud_mode,city,last_synced_at,app_environment,app_name,installation_id"
  ].join("&");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/prayer_push_registrations?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json"
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text.slice(0, 200)}`);
  const rawRows = text ? JSON.parse(text) : [];
  if (!Array.isArray(rawRows)) return { rawRows: [], rows: [] };
  return { rawRows, rows: dedupeRegistrations(rawRows) };
}

function groupRegistrations(rows, onlySubscriptionId = "") {
  const groups = new Map();
  for (const row of rows) {
    const subscriptionId = String(row.subscription_id || "").trim();
    if (!subscriptionId) continue;
    if (onlySubscriptionId && subscriptionId !== onlySubscriptionId) continue;
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    const timeZone = String(row.timezone || "Europe/Berlin");
    const methodAngle = Number(row.method_angle || 12);
    const asrFactor = Number(row.asr_factor || 1);
    const advanceMinutes = normAdvance(row.advance_minutes);
    const tahajjudMode = normTahajjud(row.tahajjud_mode);
    const key = [
      lat.toFixed(3),
      lon.toFixed(3),
      timeZone,
      methodAngle,
      asrFactor,
      advanceMinutes,
      tahajjudMode
    ].join("|");
    if (!groups.has(key)) {
      groups.set(key, {
        lat,
        lon,
        timeZone,
        methodAngle,
        asrFactor,
        advanceMinutes,
        tahajjudMode,
        subscriptionIds: []
      });
    }
    const group = groups.get(key);
    if (!group.subscriptionIds.includes(subscriptionId)) group.subscriptionIds.push(subscriptionId);
  }
  return Array.from(groups.values());
}

function notifyTitle(prayer, mode, group) {
  const emoji = PRAYER_PUSH_EMOJI[prayer.key] || "🔔";
  if (prayer.key === "tahajjud") return `${emoji} Taḥajjud-Erinnerung`;
  const minutes = normAdvance(group.advanceMinutes);
  return mode === "advance"
    ? `${emoji} ${prayer.name} in ${minutes} Min`
    : `${emoji} ${prayer.name} – Zeit ist eingetreten`;
}

function notifyCopy(prayer, mode, group) {
  const timeLabel = prayer.time == null ? "" : formatHour(prayer.time);
  const minutes = normAdvance(group.advanceMinutes);
  if (mode === "advance") {
    const title = notifyTitle(prayer, mode, group);
    const body = buildAdvancePushBody(prayer.key, minutes, timeLabel);
    return { headings: { de: title, en: title }, contents: { de: body, en: body } };
  }
  const variant = pickPrayerEntryVariant(prayer.key, timeLabel);
  return {
    headings: { de: variant.title, en: variant.title },
    contents: { de: variant.body, en: variant.body }
  };
}

async function uuidFrom(seed) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  const bytes = new Uint8Array(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function scheduleSeed(version, group, prayer, slotDay, mode) {
  return [
    "prayer",
    version,
    mode,
    prayer.key,
    slotDay,
    group.lat.toFixed(3),
    group.lon.toFixed(3),
    group.timeZone,
    group.methodAngle,
    group.asrFactor,
    group.advanceMinutes,
    group.tahajjudMode
  ].join("|");
}

function scheduleSeedBySendAfter(version, group, prayer, sendAfter, mode) {
  return [
    "prayer",
    version,
    mode,
    prayer.key,
    sendAfter.toISOString(),
    group.lat.toFixed(3),
    group.lon.toFixed(3),
    group.timeZone,
    group.methodAngle,
    group.asrFactor,
    group.advanceMinutes,
    group.tahajjudMode
  ].join("|");
}

function legacyScheduleSeed(group, prayer, sendAfter, mode) {
  return [
    "prayer",
    mode,
    prayer.key,
    sendAfter.toISOString(),
    group.lat.toFixed(3),
    group.lon.toFixed(3),
    group.timeZone
  ].join("|");
}

async function postOneSignal(env, body) {
  const key = oneSignalApiKey(env);
  if (!key) throw new Error("OneSignal API Key fehlt");
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${key}`
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`OneSignal ${response.status}: ${text.slice(0, 240)}`);
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch (_) {}
  return { parsed, status: response.status };
}

async function cancelOneSignal(env, notificationId, appId) {
  if (!notificationId) return false;
  const key = oneSignalApiKey(env);
  const url = `https://api.onesignal.com/notifications/${encodeURIComponent(notificationId)}?app_id=${encodeURIComponent(appId)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Key ${key}` }
  });
  if (response.ok || response.status === 404) return true;
  const text = await response.text();
  throw new Error(`OneSignal cancel ${response.status}: ${text.slice(0, 200)}`);
}

async function cancelObsoleteSchedules(env, body, group, prayer, sendAfter, mode, stats) {
  if (!body.send_after || Date.now() >= PRAYER_COPY_MIGRATION_UNTIL) return;
  const obsoleteSeeds = [
    ...PREVIOUS_COPY_VERSIONS.map(version => scheduleSeedBySendAfter(version, group, prayer, sendAfter, mode)),
    legacyScheduleSeed(group, prayer, sendAfter, mode)
  ];
  for (const seed of obsoleteSeeds) {
    try {
      const obsoleteBody = { ...body, idempotency_key: await uuidFrom(seed) };
      const result = await postOneSignal(env, obsoleteBody);
      const notificationId = String(result.parsed?.id || "").trim();
      if (notificationId) {
        await cancelOneSignal(env, notificationId, body.app_id);
        stats.migratedSchedules += 1;
      }
    } catch (error) {
      stats.migrationErrors += 1;
      stats.errorDetails.push(`Migration ${prayer.name}: ${error.message || error}`);
    }
  }
}

async function sendPush(env, group, prayer, sendAfter, mode, stats, sentInRun, slotDay) {
  const subscriptionIds = group.subscriptionIds.slice(0, 2000);
  if (!subscriptionIds.length) return;
  const seed = scheduleSeed(PRAYER_PUSH_COPY_VERSION, group, prayer, slotDay, mode);
  if (sentInRun.has(seed)) {
    stats.duplicates += 1;
    return;
  }
  sentInRun.add(seed);

  const copy = notifyCopy(prayer, mode, group);
  const body = withIcons({
    app_id: String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim(),
    target_channel: "push",
    include_subscription_ids: subscriptionIds,
    headings: copy.headings,
    contents: copy.contents,
    url: String(env.SITE_URL || DEFAULT_SITE_URL),
    isAnyWeb: true,
    data: {
      type: "prayer",
      prayer: prayer.key,
      mode,
      copyVersion: PRAYER_PUSH_COPY_VERSION,
      environment: "production"
    },
    idempotency_key: await uuidFrom(seed)
  }, env);

  if (sendAfter.getTime() - Date.now() > 30 * 1000) {
    body.send_after = sendAfter.toISOString();
  }

  await cancelObsoleteSchedules(env, body, group, prayer, sendAfter, mode, stats);
  const result = await postOneSignal(env, body);
  stats.scheduled += 1;
  stats.recipients += subscriptionIds.length;
  stats.planned.push({
    prayer: prayer.name,
    key: prayer.key,
    mode,
    time: prayer.time == null ? null : formatHour(prayer.time),
    sendAfter: sendAfter.toISOString(),
    recipients: subscriptionIds.length,
    timeZone: group.timeZone
  });
  stats.oneSignalAccepted += result.status >= 200 && result.status < 300 ? 1 : 0;
}

function buildOverview(planned, skippedPast, reference = REFERENCE) {
  const local = todayLocal(reference.timeZone);
  const date = `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
  const times = prayerTimes(local, reference.lat, reference.lon, reference.timeZone, 12, 1, "off");
  const prayers = {};
  for (const key of ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"]) {
    const referencePrayer = times.find(prayer => prayer.key === key);
    const advances = planned.filter(item => item.key === key && item.mode === "advance");
    const entries = planned.filter(item => item.key === key && item.mode === "entry");
    const skipped = skippedPast.filter(item => item.key === key);
    prayers[key] = {
      name: referencePrayer?.name || key,
      time: referencePrayer?.time == null ? null : formatHour(referencePrayer.time),
      advance: {
        status: advances.length ? "geplant" : skipped.some(item => item.mode === "advance") ? "übersprungen" : "nicht geplant",
        recipients: advances.reduce((sum, item) => sum + Number(item.recipients || 0), 0)
      },
      entry: {
        status: entries.length ? "geplant" : skipped.some(item => item.mode === "entry") ? "übersprungen" : "nicht geplant",
        recipients: entries.reduce((sum, item) => sum + Number(item.recipients || 0), 0)
      }
    };
  }
  return { date, reference: `${reference.city} · ${reference.timeZone}`, prayers };
}

function buildDiagnostics(overview) {
  const diagnostics = {};
  for (const [key, prayer] of Object.entries(overview.prayers || {})) {
    const entryPlanned = prayer.entry?.status === "geplant";
    const advancePlanned = prayer.advance?.status === "geplant";
    let answer;
    if (entryPlanned && advancePlanned) answer = `${prayer.name} ${prayer.time}: Vorab und Gebetszeit geplant.`;
    else if (entryPlanned) answer = `${prayer.name} ${prayer.time}: Gebetszeit geplant.`;
    else if (prayer.entry?.status === "übersprungen") answer = `${prayer.name} ${prayer.time}: Fenster bereits vorbei.`;
    else answer = `${prayer.name} ${prayer.time || "--:--"}: noch nicht im 90-Minuten-Fenster.`;
    diagnostics[key] = { ...prayer, answer };
  }
  return diagnostics;
}

function nextPush(groups, now = new Date()) {
  let next = null;
  for (const group of groups) {
    const local = todayLocal(group.timeZone);
    for (const day of [local, addDays(local, 1)]) {
      for (const prayer of prayerTimes(day, group.lat, group.lon, group.timeZone, group.methodAngle, group.asrFactor, group.tahajjudMode)) {
        const entryAt = prayer.sendAfter || (prayer.time == null ? null : utcFromLocal(day, prayer.time, group.timeZone));
        if (!entryAt) continue;
        const slots = [{ mode: "entry", sendAfter: entryAt }];
        if (prayer.key !== "tahajjud") {
          slots.push({ mode: "advance", sendAfter: new Date(entryAt.getTime() - normAdvance(group.advanceMinutes) * 60000) });
        }
        for (const slot of slots) {
          if (slot.sendAfter <= now) continue;
          if (!next || slot.sendAfter < new Date(next.sendAfter)) {
            next = {
              prayer: prayer.name,
              key: prayer.key,
              mode: slot.mode,
              sendAfter: slot.sendAfter.toISOString(),
              timeZone: group.timeZone
            };
          }
        }
      }
    }
  }
  return next;
}

async function writeStatusGithub(env, report, deps) {
  if (!env.GITHUB_TOKEN || !deps?.githubGet || !deps?.githubPut) return { saved: false, source: "github-fallback" };
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.PRAYER_STATUS_PATH || DEFAULT_PRAYER_STATUS_PATH;
  try {
    const existing = await deps.githubGet(env, owner, repo, path, branch);
    await deps.githubPut(
      env,
      owner,
      repo,
      path,
      `${JSON.stringify(report, null, 2)}\n`,
      `Prayer push ${report.updatedAt}`,
      branch,
      existing?.sha
    );
    return { saved: true, source: "github-fallback", path };
  } catch (error) {
    return { saved: false, source: "github-fallback", reason: error.message || String(error) };
  }
}

export function readPrayerPushStatusFromKv() {
  return lastStatusReport;
}

function buildPrayerErrorStatus(lastError, extra = {}) {
  const now = new Date().toISOString();
  return {
    updatedAt: now,
    ok: false,
    schedulerStatus: "error",
    schedulerEngine: "cloudflare-worker-cron-v3",
    prayerCopyVersion: PRAYER_PUSH_COPY_VERSION,
    cronIntervalMinutes: 5,
    lastCronRun: now,
    lastError: lastError || "Unbekannter Scheduler-Fehler",
    scheduled: 0,
    recipients: 0,
    usersWithLocation: 0,
    ...extra
  };
}

async function persistPrayerStatus(env, statusReport, deps) {
  lastStatusReport = statusReport;
  const durable = await writePrayerStatusToStore(env, statusReport);
  return durable.saved ? durable : writeStatusGithub(env, statusReport, deps);
}

export async function runPrayerPushScheduler(env, options = {}, deps = {}) {
  const onlySubscriptionId = String(options.subscriptionId || options.subscription_id || "").trim();
  const lookahead = resolveScheduleLookahead(env);
  const configuredGrace = Number(env.PRAYER_SCHEDULE_GRACE_MINUTES || SCHEDULE_GRACE_MINUTES);
  const grace = Math.min(30, Math.max(0, Number.isFinite(configuredGrace) ? configuredGrace : SCHEDULE_GRACE_MINUTES));

  if (!oneSignalApiKey(env)) {
    const status = buildPrayerErrorStatus("ONESIGNAL_API_KEY_NEW fehlt");
    const statusWrite = await persistPrayerStatus(env, status, deps);
    return {
      ok: false,
      triggered: false,
      schedulerStatus: "error",
      reason: "OneSignal API Key fehlt am Worker",
      lastError: status.lastError,
      status,
      statusWrite
    };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - grace * 60000);
  const windowEnd = new Date(now.getTime() + lookahead * 60000);
  const stats = {
    scheduled: 0,
    skippedPast: 0,
    skippedWindow: 0,
    duplicates: 0,
    recipients: 0,
    errors: 0,
    migrationErrors: 0,
    migratedSchedules: 0,
    oneSignalAccepted: 0,
    planned: [],
    skippedPastDetails: [],
    errorDetails: []
  };
  const sentInRun = new Set();

  let rawRows = [];
  let rows = [];
  try {
    const registrations = await loadRegistrations();
    rawRows = registrations.rawRows;
    rows = registrations.rows;
  } catch (error) {
    const message = error.message || String(error);
    const status = buildPrayerErrorStatus(`Supabase nicht lesbar: ${message}`);
    const statusWrite = await persistPrayerStatus(env, status, deps);
    return {
      ok: false,
      triggered: true,
      schedulerStatus: "error",
      reason: status.lastError,
      lastError: message,
      usersWithLocation: 0,
      scheduled: 0,
      status,
      statusWrite
    };
  }

  const filteredRows = onlySubscriptionId
    ? rows.filter(row => String(row.subscription_id) === onlySubscriptionId)
    : rows;
  const groups = groupRegistrations(filteredRows, onlySubscriptionId);
  const userCount = filteredRows.length;

  for (const group of groups) {
    const local = todayLocal(group.timeZone);
    for (const day of [addDays(local, -1), local, addDays(local, 1), addDays(local, 2)]) {
      const prayers = prayerTimes(day, group.lat, group.lon, group.timeZone, group.methodAngle, group.asrFactor, group.tahajjudMode);
      for (const prayer of prayers) {
        const entryAt = prayer.sendAfter || (prayer.time == null ? null : utcFromLocal(day, prayer.time, group.timeZone));
        if (!entryAt) continue;
        const slots = [{ mode: "entry", sendAfter: entryAt }];
        if (prayer.key !== "tahajjud") {
          slots.push({ mode: "advance", sendAfter: new Date(entryAt.getTime() - normAdvance(group.advanceMinutes) * 60000) });
        }

        for (const slot of slots) {
          const slotDay = slotDayKey(day);
          const plannedSendAfter = resolvePrayerSlotSendAfter(slot, entryAt, now, grace);
          if (plannedSendAfter == null) {
            stats.skippedPast += 1;
            stats.skippedPastDetails.push({
              key: prayer.key,
              mode: slot.mode,
              sendAfter: slot.sendAfter.toISOString(),
              time: prayer.time == null ? null : formatHour(prayer.time),
              timeZone: group.timeZone
            });
            continue;
          }
          if (plannedSendAfter < windowStart) {
            stats.skippedPast += 1;
            stats.skippedPastDetails.push({
              key: prayer.key,
              mode: slot.mode,
              sendAfter: slot.sendAfter.toISOString(),
              time: prayer.time == null ? null : formatHour(prayer.time),
              timeZone: group.timeZone
            });
            continue;
          }
          slot.sendAfter = plannedSendAfter;
          if (slot.sendAfter > windowEnd) {
            stats.skippedWindow += 1;
            continue;
          }
          try {
            await sendPush(env, group, prayer, slot.sendAfter, slot.mode, stats, sentInRun, slotDay);
          } catch (error) {
            stats.errors += 1;
            stats.errorDetails.push(`${slot.mode} ${prayer.name}: ${error.message || error}`);
          }
        }
      }
    }
  }

  const today = buildOverview(stats.planned, stats.skippedPastDetails);
  const prayerDiagnostics = buildDiagnostics(today);
  const maghrib = prayerDiagnostics.maghrib || null;
  const status = {
    updatedAt: new Date().toISOString(),
    ok: stats.errors === 0 && userCount > 0,
    schedulerStatus: stats.errors ? "error" : userCount ? "success" : "warning",
    schedulerEngine: "cloudflare-worker-cron-v3",
    prayerCopyVersion: PRAYER_PUSH_COPY_VERSION,
    migrationActive: Date.now() < PRAYER_COPY_MIGRATION_UNTIL,
    userSource: "supabase-production-only",
    appEnvironment: "production",
    cronIntervalMinutes: 5,
    lastCronRun: new Date().toISOString(),
    nextPlannedPush: nextPush(groups, now),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    graceMinutes: grace,
    lookaheadMinutes: lookahead,
    registrationsRead: rawRows.length,
    uniqueSubscriptions: rows.length,
    duplicateRegistrationsDropped: Math.max(0, rawRows.length - rows.length),
    subscriptionsTotal: userCount,
    subscriptionsSupabase: userCount,
    usersWithLocation: userCount,
    usersWithActivePush: userCount,
    locationGroups: groups.length,
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    skippedPast: stats.skippedPast,
    skippedWindow: stats.skippedWindow,
    duplicates: stats.duplicates,
    migratedSchedules: stats.migratedSchedules,
    migrationErrors: stats.migrationErrors,
    oneSignalAccepted: stats.oneSignalAccepted,
    errors: stats.errors,
    lastError: stats.errors
      ? stats.errorDetails[0]
      : userCount === 0
        ? "Keine aktiven Produktions-Registrierungen mit Push-Einwilligung gefunden."
        : null,
    today,
    prayerDiagnostics,
    maghribDiagnostic: maghrib ? {
      plannedAdvance: maghrib.advance?.status,
      plannedEntry: maghrib.entry?.status,
      time: maghrib.time,
      answer: maghrib.answer || ""
    } : null,
    planned: stats.planned.slice(0, 80)
  };

  const statusWrite = await persistPrayerStatus(env, status, deps);
  const reason = stats.errors
    ? `Fehler: ${stats.errorDetails[0]} (${stats.scheduled} geplant, ${stats.errors} Fehler)`
    : userCount === 0
      ? "Keine aktiven Produktions-Registrierungen mit Push-Einwilligung gefunden."
      : `Erfolgreich: ${stats.scheduled} Pushs für ${stats.recipients} Empfänger in ${groups.length} Gruppen geplant.`;

  return {
    ok: stats.errors === 0 && userCount > 0,
    triggered: true,
    schedulerStatus: status.schedulerStatus,
    reason,
    status,
    statusWrite,
    usersWithLocation: userCount,
    usersWithActivePush: userCount,
    locationGroups: groups.length,
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    errors: stats.errors,
    lastError: status.lastError
  };
}
