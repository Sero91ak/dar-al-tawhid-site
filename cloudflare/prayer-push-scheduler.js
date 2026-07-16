/**
 * Gebetszeiten-Push – Cloudflare Worker Cron
 * Nutzerquelle: Supabase prayer_push_registrations (1 Request).
 * Kein OneSignal-User-Scan (verursachte „Too many subrequests“).
 */

import { pickPrayerEntryVariant, buildAdvancePushBody } from "./prayer-push-copy.js";

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de/#prayer";
const DEFAULT_PRAYER_STATUS_PATH = "content/admin/prayer-push-status.json";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

const DEFAULT_PRAYER_ADVANCE_MINUTES = 15;
const SCHEDULE_LOOKAHEAD_MINUTES = 26 * 60;
const SCHEDULE_GRACE_MINUTES = 15;
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
  const o = siteOrigin(env);
  return {
    ...payload,
    chrome_web_icon: `${o}/notification-icon-192.png?v=2`,
    chrome_web_badge: `${o}/notification-badge-96.png?v=2`,
    firefox_icon: `${o}/notification-icon-192.png?v=2`
  };
}

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }
function fixAngle(a) { return ((a % 360) + 360) % 360; }
function fixHour(h) { return ((h % 24) + 24) % 24; }

function getLocalParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).formatToParts(date);
  const o = {};
  for (const p of parts) o[p.type] = p.value;
  return {
    year: +o.year, month: +o.month, day: +o.day,
    hour: +o.hour, minute: +o.minute, second: +o.second
  };
}

function tzOffsetMin(date, timeZone) {
  const l = getLocalParts(date, timeZone);
  const utc = Date.UTC(l.year, l.month - 1, l.day, l.hour, l.minute, l.second);
  return Math.round((utc - date.getTime()) / 60000);
}

function utcFromLocal(localDate, hourDec, timeZone) {
  const h = Math.floor(fixHour(hourDec));
  const m = Math.round((fixHour(hourDec) - h) * 60);
  const mins = h * 60 + m;
  const midnight = Date.UTC(localDate.year, localDate.month - 1, localDate.day);
  const guess = new Date(midnight + mins * 60000);
  return new Date(midnight + mins * 60000 - tzOffsetMin(guess, timeZone) * 60000);
}

function todayLocal(timeZone) {
  const p = getLocalParts(new Date(), timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

function dayOfYear(d) {
  const s = Date.UTC(d.year, 0, 0);
  return Math.floor((Date.UTC(d.year, d.month - 1, d.day) - s) / 86400000);
}

function addDays(d, n) {
  const x = new Date(Date.UTC(d.year, d.month - 1, d.day + n));
  return { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate() };
}

function sunTime(localDate, lat, lon, angle, morning, timeZone) {
  const N = dayOfYear(localDate);
  const lngHour = lon / 15;
  const t = N + (((morning ? 6 : 18) - lngHour) / 24);
  const M = (0.9856 * t) - 3.289;
  let L = M + (1.916 * Math.sin(toRad(M))) + (0.020 * Math.sin(toRad(2 * M))) + 282.634;
  L = fixAngle(L);
  let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
  RA = fixAngle(RA);
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
  const sinDec = 0.39782 * Math.sin(toRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(toRad(90 + angle)) - sinDec * Math.sin(toRad(lat))) / (cosDec * Math.cos(toRad(lat)));
  if (cosH > 1 || cosH < -1) return null;
  let H = (morning ? 360 - toDeg(Math.acos(cosH)) : toDeg(Math.acos(cosH))) / 15;
  const T = H + RA - (0.06571 * t) - 6.622;
  const noon = utcFromLocal(localDate, 12, timeZone);
  return fixHour((T - lngHour) + tzOffsetMin(noon, timeZone) / 60);
}

function solarNoon(localDate, lat, lon, timeZone) {
  const sr = sunTime(localDate, lat, lon, 0.833, true, timeZone);
  const ss = sunTime(localDate, lat, lon, 0.833, false, timeZone);
  return sr == null || ss == null ? 12 : fixHour((sr + ss) / 2);
}

function asrTime(localDate, lat, lon, factor, timeZone) {
  const noon = solarNoon(localDate, lat, lon, timeZone);
  const dec = 23.45 * Math.sin(toRad((360 / 365) * (284 + dayOfYear(localDate))));
  const ang = toDeg(Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - dec))))));
  const cosH = (Math.sin(toRad(ang)) - Math.sin(toRad(lat)) * Math.sin(toRad(dec))) / (Math.cos(toRad(lat)) * Math.cos(toRad(dec)));
  if (cosH > 1 || cosH < -1) return fixHour(noon + 4);
  return fixHour(noon + toDeg(Math.acos(cosH)) / 15);
}

function formatHour(h) {
  let t = Math.round(fixHour(h) * 60);
  t = ((t % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function normAdvance(v) {
  const n = Number(v);
  return [5, 10, 15].includes(n) ? n : DEFAULT_PRAYER_ADVANCE_MINUTES;
}

function normTahajjud(v) {
  const s = String(v || "off");
  if (s === "true") return "lastThird";
  return ["off", "before30", "before60", "before90", "lastThird"].includes(s) ? s : "off";
}

function tahajjudUtc(maghribUtc, fajrUtc, mode) {
  if (mode === "off" || !(fajrUtc > maghribUtc)) return null;
  if (mode === "before30") return new Date(fajrUtc.getTime() - 30 * 60000);
  if (mode === "before60") return new Date(fajrUtc.getTime() - 60 * 60000);
  if (mode === "before90") return new Date(fajrUtc.getTime() - 90 * 60000);
  return new Date(maghribUtc.getTime() + ((fajrUtc.getTime() - maghribUtc.getTime()) * 2 / 3));
}

function prayerTimes(localDate, lat, lon, tz, methodAngle, asrFactor, tahajjudMode) {
  const fajr = sunTime(localDate, lat, lon, methodAngle, true, tz);
  const dhuhr = solarNoon(localDate, lat, lon, tz);
  const asr = asrTime(localDate, lat, lon, asrFactor, tz);
  const maghrib = sunTime(localDate, lat, lon, 0.833, false, tz);
  const isha = sunTime(localDate, lat, lon, methodAngle, false, tz);
  const list = [
    { key: "fajr", name: "Fajr", time: fajr },
    { key: "dhuhr", name: "Dhuhr", time: dhuhr },
    { key: "asr", name: "ʿAṣr", time: asr },
    { key: "maghrib", name: "Maghrib", time: maghrib },
    { key: "isha", name: "ʿIshāʾ", time: isha }
  ];
  const tm = normTahajjud(tahajjudMode);
  if (tm !== "off" && maghrib != null) {
    const tomorrow = addDays(localDate, 1);
    const fajrNext = sunTime(tomorrow, lat, lon, methodAngle, true, tz);
    if (fajrNext != null) {
      const mUtc = utcFromLocal(localDate, maghrib, tz);
      const fUtc = utcFromLocal(tomorrow, fajrNext, tz);
      const start = tahajjudUtc(mUtc, fUtc, tm);
      if (start) list.push({ key: "tahajjud", name: "Taḥajjud", time: null, sendAfter: start });
    }
  }
  return list;
}

async function loadRegistrations() {
  const url = `${SUPABASE_URL}/rest/v1/prayer_push_registrations?enabled=eq.true&select=device_id,subscription_id,lat,lon,timezone,method_angle,asr_factor,advance_minutes,tahajjud_mode,city,last_synced_at`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json"
    }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  const rows = text ? JSON.parse(text) : [];
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r.subscription_id && Number.isFinite(+r.lat) && Number.isFinite(+r.lon));
}

function groupRegistrations(rows, onlySubId = "") {
  const map = new Map();
  for (const row of rows) {
    const sid = String(row.subscription_id || "").trim();
    if (!sid) continue;
    if (onlySubId && sid !== onlySubId) continue;
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    const tz = String(row.timezone || "Europe/Berlin");
    const methodAngle = Number(row.method_angle || 12);
    const asrFactor = Number(row.asr_factor || 1);
    const advanceMinutes = normAdvance(row.advance_minutes);
    const tahajjudMode = normTahajjud(row.tahajjud_mode);
    const key = [lat.toFixed(3), lon.toFixed(3), tz, methodAngle, asrFactor, advanceMinutes, tahajjudMode].join("|");
    if (!map.has(key)) {
      map.set(key, { lat, lon, timeZone: tz, methodAngle, asrFactor, advanceMinutes, tahajjudMode, subscriptionIds: [] });
    }
    if (!map.get(key).subscriptionIds.includes(sid)) map.get(key).subscriptionIds.push(sid);
  }
  return Array.from(map.values());
}

function notifyTitle(prayer, mode, group) {
  if (prayer.key === "tahajjud") return mode === "advance" ? "Taḥajjud-Erinnerung" : "Taḥajjud-Erinnerung";
  const m = normAdvance(group.advanceMinutes);
  return mode === "advance" ? `${prayer.name} in ${m} Min` : `${prayer.name} ist eingetreten`;
}

function notifyCopy(prayer, mode, group) {
  const timeLabel = prayer.time == null ? "" : formatHour(prayer.time);
  const m = normAdvance(group.advanceMinutes);
  if (mode === "advance") {
    const title = notifyTitle(prayer, mode, group);
    const body = buildAdvancePushBody(prayer.key, m, timeLabel);
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
  const b = new Uint8Array(hash.slice(0, 16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function schedId(group, prayer, sendAfter, mode) {
  return ["prayer", mode, prayer.key, sendAfter.toISOString(), group.lat.toFixed(3), group.lon.toFixed(3), group.timeZone].join("|");
}

async function postOneSignal(env, body) {
  const key = oneSignalApiKey(env);
  if (!key) throw new Error("OneSignal API Key fehlt");
  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${key}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OneSignal ${res.status}: ${text.slice(0, 240)}`);
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch (e) {}
  return { text, parsed, recipients: parsed.recipients ?? parsed.id ?? null };
}

async function sendPush(env, group, prayer, sendAfter, mode, stats, sentInRun) {
  const ids = group.subscriptionIds.slice(0, 2000);
  if (!ids.length) return;
  const idKey = schedId(group, prayer, sendAfter, mode);
  if (sentInRun.has(idKey)) {
    stats.duplicates += 1;
    return;
  }
  sentInRun.add(idKey);

  const copy = notifyCopy(prayer, mode, group);

  const body = withIcons({
    app_id: String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim(),
    target_channel: "push",
    include_subscription_ids: ids,
    headings: copy.headings,
    contents: copy.contents,
    url: String(env.SITE_URL || DEFAULT_SITE_URL),
    isAnyWeb: true,
    idempotency_key: await uuidFrom(idKey)
  }, env);

  if (sendAfter.getTime() - Date.now() > 30 * 1000) {
    body.send_after = sendAfter.toISOString();
  }

  const result = await postOneSignal(env, body);
  stats.scheduled += 1;
  stats.recipients += ids.length;
  stats.planned.push({
    prayer: prayer.name,
    key: prayer.key,
    mode,
    time: prayer.time == null ? formatHour(0) : formatHour(prayer.time),
    sendAfter: sendAfter.toISOString(),
    recipients: ids.length,
    timeZone: group.timeZone
  });
  stats.oneSignalResponses.push({
    prayer: prayer.key,
    mode,
    recipients: ids.length,
    response: String(result.text || "").slice(0, 200)
  });
}

function buildOverview(planned, skippedPast, ref = REFERENCE) {
  const local = todayLocal(ref.timeZone);
  const dateKey = `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
  const times = prayerTimes(local, ref.lat, ref.lon, ref.timeZone, 12, 1, "off");
  const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"];
  const prayers = {};
  for (const key of keys) {
    const refP = times.find((p) => p.key === key);
    const time = refP?.time == null ? null : formatHour(refP.time);
    const adv = planned.filter((p) => p.key === key && p.mode === "advance");
    const ent = planned.filter((p) => p.key === key && p.mode === "entry");
    const sk = skippedPast.filter((p) => p.key === key);
    prayers[key] = {
      name: refP?.name || key,
      time,
      advance: {
        status: adv.length ? "geplant" : sk.some((s) => s.mode === "advance") ? "übersprungen" : "nicht geplant",
        recipients: adv.reduce((s, p) => s + (p.recipients || 0), 0)
      },
      entry: {
        status: ent.length ? "geplant" : sk.some((s) => s.mode === "entry") ? "übersprungen" : "nicht geplant",
        recipients: ent.reduce((s, p) => s + (p.recipients || 0), 0)
      }
    };
  }
  return { date: dateKey, reference: `${ref.city} · ${ref.timeZone}`, prayers };
}

function buildDiagnostics(overview) {
  const d = {};
  for (const [key, p] of Object.entries(overview.prayers || {})) {
    const ok = p.entry?.status === "geplant";
    const adv = p.advance?.status === "geplant";
    let answer;
    if (ok && adv) answer = `${p.name} ${p.time}: Vorab und Gebetszeit geplant.`;
    else if (ok) answer = `${p.name} ${p.time}: Gebetszeit geplant.`;
    else if (p.entry?.status === "übersprungen") answer = `${p.name} ${p.time}: übersprungen – Fenster vorbei.`;
    else answer = `${p.name} ${p.time || "--:--"}: noch nicht geplant.`;
    d[key] = { name: p.name, time: p.time, advance: p.advance, entry: p.entry, answer };
  }
  return d;
}

function nextPush(groups, now = new Date()) {
  let next = null;
  for (const g of groups) {
    const local = todayLocal(g.timeZone);
    for (const day of [local, addDays(local, 1)]) {
      for (const prayer of prayerTimes(day, g.lat, g.lon, g.timeZone, g.methodAngle, g.asrFactor, g.tahajjudMode)) {
        const entryAt = prayer.sendAfter || (prayer.time == null ? null : utcFromLocal(day, prayer.time, g.timeZone));
        if (!entryAt) continue;
        const slots = [{ mode: "entry", sendAfter: entryAt }];
        if (prayer.key !== "tahajjud") {
          slots.push({ mode: "advance", sendAfter: new Date(entryAt.getTime() - normAdvance(g.advanceMinutes) * 60000) });
        }
        for (const s of slots) {
          if (s.sendAfter <= now) continue;
          if (!next || s.sendAfter < new Date(next.sendAfter)) {
            next = { prayer: prayer.name, key: prayer.key, mode: s.mode, sendAfter: s.sendAfter.toISOString(), timeZone: g.timeZone };
          }
        }
      }
    }
  }
  return next;
}

async function writeStatusGithub(env, report, deps) {
  if (!env.GITHUB_TOKEN || !deps?.githubGet || !deps?.githubPut) return { saved: false };
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.PRAYER_STATUS_PATH || DEFAULT_PRAYER_STATUS_PATH;
  try {
    const existing = await deps.githubGet(env, owner, repo, path, branch);
    await deps.githubPut(env, owner, repo, path, `${JSON.stringify(report, null, 2)}\n`, `Prayer push ${report.updatedAt}`, branch, existing?.sha);
    return { saved: true, path };
  } catch (err) {
    return { saved: false, reason: err.message || String(err) };
  }
}

export function readPrayerPushStatusFromKv() {
  return lastStatusReport;
}

export async function runPrayerPushScheduler(env, options = {}, deps = {}) {
  const onlySub = String(options.subscriptionId || options.subscription_id || "").trim();
  const lookahead = Number(env.PRAYER_SCHEDULE_LOOKAHEAD_MINUTES || SCHEDULE_LOOKAHEAD_MINUTES);
  const grace = Number(env.PRAYER_SCHEDULE_GRACE_MINUTES || SCHEDULE_GRACE_MINUTES);

  if (!oneSignalApiKey(env)) {
    return { ok: false, triggered: false, schedulerStatus: "error", reason: "OneSignal API Key fehlt am Worker", lastError: "ONESIGNAL_API_KEY_NEW fehlt" };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - grace * 60000);
  const windowEnd = new Date(now.getTime() + lookahead * 60000);
  const stats = {
    scheduled: 0, skippedPast: 0, skippedWindow: 0, duplicates: 0, recipients: 0, errors: 0,
    planned: [], skippedPastDetails: [], oneSignalResponses: [], errorDetails: []
  };
  const sentInRun = new Set();

  let rows = [];
  let supabaseError = null;
  try {
    rows = await loadRegistrations();
  } catch (err) {
    supabaseError = err.message || String(err);
    return {
      ok: false, triggered: true, schedulerStatus: "error",
      reason: `Supabase nicht lesbar: ${supabaseError}`,
      lastError: supabaseError,
      usersWithLocation: 0, scheduled: 0
    };
  }

  const groups = groupRegistrations(rows, onlySub);
  const userCount = rows.filter((r) => !onlySub || String(r.subscription_id) === onlySub).length;

  for (const group of groups) {
    const local = todayLocal(group.timeZone);
    const days = [addDays(local, -1), local, addDays(local, 1), addDays(local, 2)];

    for (const day of days) {
      for (const prayer of prayerTimes(day, group.lat, group.lon, group.timeZone, group.methodAngle, group.asrFactor, group.tahajjudMode)) {
        const entryAt = prayer.sendAfter || (prayer.time == null ? null : utcFromLocal(day, prayer.time, group.timeZone));
        if (!entryAt) continue;

        const slots = [{ mode: "entry", sendAfter: entryAt }];
        if (prayer.key !== "sunrise" && prayer.key !== "tahajjud") {
          slots.push({ mode: "advance", sendAfter: new Date(entryAt.getTime() - normAdvance(group.advanceMinutes) * 60000) });
        }

        for (const slot of slots) {
          if (slot.sendAfter < windowStart) {
            stats.skippedPast += 1;
            stats.skippedPastDetails.push({ key: prayer.key, mode: slot.mode, sendAfter: slot.sendAfter.toISOString(), time: formatHour(prayer.time), timeZone: group.timeZone });
            continue;
          }
          if (slot.sendAfter > windowEnd) {
            stats.skippedWindow += 1;
            continue;
          }
          try {
            await sendPush(env, group, prayer, slot.sendAfter, slot.mode, stats, sentInRun);
          } catch (err) {
            stats.errors += 1;
            stats.errorDetails.push(`${slot.mode} ${prayer.name}: ${err.message || err}`);
          }
        }
      }
    }
  }

  const today = buildOverview(stats.planned, stats.skippedPastDetails);
  const prayerDiagnostics = buildDiagnostics(today);
  const mag = prayerDiagnostics.maghrib || null;

  const statusReport = {
    updatedAt: new Date().toISOString(),
    ok: stats.errors === 0 && userCount > 0,
    schedulerStatus: stats.errors ? "error" : userCount ? "success" : "warning",
    schedulerEngine: "cloudflare-worker-cron-v2",
    userSource: "supabase-only",
    cronIntervalMinutes: 5,
    lastCronRun: new Date().toISOString(),
    nextPlannedPush: nextPush(groups, now),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    graceMinutes: grace,
    lookaheadMinutes: lookahead,
    subscriptionsTotal: userCount,
    subscriptionsOneSignal: 0,
    subscriptionsSupabase: userCount,
    supabaseMeta: { ok: true, count: userCount, source: "supabase" },
    usersWithLocation: userCount,
    usersWithActivePush: userCount,
    locationGroups: groups.length,
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    skippedPast: stats.skippedPast,
    skippedWindow: stats.skippedWindow,
    duplicates: stats.duplicates,
    errors: stats.errors,
    lastError: stats.errors
      ? stats.errorDetails[0]
      : (userCount === 0 ? "Keine aktiven Registrierungen in Supabase. Besucher-App: Standort + Erinnerung aktivieren." : null),
    today,
    prayerDiagnostics,
    maghribDiagnostic: mag ? {
      plannedAdvance: mag.advance?.status,
      plannedEntry: mag.entry?.status,
      time: mag.time,
      answer: mag.answer || ""
    } : null,
    planned: stats.planned.slice(0, 80),
    skippedPastDetails: stats.skippedPastDetails.slice(0, 40),
    oneSignalResponses: stats.oneSignalResponses.slice(0, 20),
    userRegistry: rows.slice(0, 50).map((r) => ({
      subscriptionId: r.subscription_id,
      timezone: r.timezone,
      city: r.city,
      lastSyncedAt: r.last_synced_at
    }))
  };

  lastStatusReport = statusReport;
  const statusWrite = await writeStatusGithub(env, statusReport, deps);

  const reason = stats.errors
    ? `Fehler: ${stats.errorDetails[0]} (${stats.scheduled} geplant, ${stats.errors} Fehler)`
    : userCount === 0
      ? "Keine aktiven Registrierungen in Supabase gefunden."
      : `Erfolgreich: ${stats.scheduled} Pushs für ${stats.recipients} Empfänger in ${groups.length} Gruppen geplant.`;

  return {
    ok: stats.errors === 0 && userCount > 0,
    triggered: true,
    schedulerStatus: statusReport.schedulerStatus,
    reason,
    status: statusReport,
    statusWrite,
    usersWithLocation: userCount,
    usersWithActivePush: userCount,
    locationGroups: groups.length,
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    errors: stats.errors,
    lastError: statusReport.lastError
  };
}
