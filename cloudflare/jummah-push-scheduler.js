/**
 * Jumuʿah-Push – separater Freitags-Scheduler
 * Nutzt vorhandene Dhuhr-Berechnung (solarNoon) oder manuelle Moschee-Zeit.
 * Berührt prayer-push-scheduler.js nicht.
 */

import { jummahCopyForMode } from "./jummah-push-copy.js";

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de/#prayer";
const DEFAULT_JUMMAH_STATUS_PATH = "content/admin/jummah-push-status.json";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

const DEFAULT_JUMMAH_ADVANCE_MINUTES = 30;
const DEFAULT_JUMMAH_MORNING_TIME = "09:00";
const SCHEDULE_LOOKAHEAD_MINUTES = 26 * 60;
const SCHEDULE_GRACE_MINUTES = 15;

let lastJummahStatusReport = null;

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

/** Gleiche Dhuhr-Logik wie Besucher-App und prayer-push-scheduler */
function solarNoon(localDate, lat, lon, timeZone) {
  const sr = sunTime(localDate, lat, lon, 0.833, true, timeZone);
  const ss = sunTime(localDate, lat, lon, 0.833, false, timeZone);
  return sr == null || ss == null ? 12 : fixHour((sr + ss) / 2);
}

function formatHour(h) {
  let t = Math.round(fixHour(h) * 60);
  t = ((t % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function parseTimeHHMM(value, fallback = "09:00") {
  const m = String(value || fallback).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return parseTimeHHMM(fallback, "09:00");
  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return fixHour(hh + mm / 60);
}

function normJummahAdvance(v) {
  const n = Number(v);
  return [15, 30, 45, 60].includes(n) ? n : DEFAULT_JUMMAH_ADVANCE_MINUTES;
}

function isFridayLocal(localDate, timeZone) {
  const dt = utcFromLocal(localDate, 12, timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(dt);
  return weekday === "Fri";
}

function jummahMainHour(group, localDate) {
  if (group.jummahUseManualTime) {
    return parseTimeHHMM(group.jummahManualTime, "13:30");
  }
  return solarNoon(localDate, group.lat, group.lon, group.timeZone);
}

function jummahSlotsForDay(localDate, group) {
  if (!isFridayLocal(localDate, group.timeZone)) return [];

  const mainHour = jummahMainHour(group, localDate);
  if (mainHour == null || Number.isNaN(mainHour)) return [];

  const morningHour = parseTimeHHMM(group.jummahMorningTime, DEFAULT_JUMMAH_MORNING_TIME);
  const advanceMin = normJummahAdvance(group.jummahAdvanceMinutes);
  const mainAt = utcFromLocal(localDate, mainHour, group.timeZone);
  const morningAt = utcFromLocal(localDate, morningHour, group.timeZone);
  const advanceAt = new Date(mainAt.getTime() - advanceMin * 60000);

  return [
    { mode: "morning", sendAfter: morningAt, timeLabel: formatHour(morningHour) },
    { mode: "advance", sendAfter: advanceAt, timeLabel: formatHour(mainHour - advanceMin / 60) },
    { mode: "entry", sendAfter: mainAt, timeLabel: formatHour(mainHour) }
  ];
}

async function loadJummahRegistrations() {
  const select = [
    "device_id", "subscription_id", "lat", "lon", "timezone", "method_angle",
    "jummah_notifications", "jummah_use_manual_time", "jummah_manual_time",
    "jummah_morning_time", "jummah_advance_minutes", "city", "last_synced_at"
  ].join(",");
  const url = `${SUPABASE_URL}/rest/v1/prayer_push_registrations?jummah_notifications=eq.true&subscription_id=not.is.null&select=${select}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json"
    }
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 400 && /column/i.test(text)) {
      throw new Error("Supabase-Spalten fehlen – bitte jummah-push-schema.sql ausführen");
    }
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  }
  const rows = text ? JSON.parse(text) : [];
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r.subscription_id);
}

function groupJummahRegistrations(rows, onlySubId = "") {
  const map = new Map();
  for (const row of rows) {
    const sid = String(row.subscription_id || "").trim();
    if (!sid) continue;
    if (onlySubId && sid !== onlySubId) continue;

    const tz = String(row.timezone || "Europe/Berlin");
    const useManual = Boolean(row.jummah_use_manual_time);
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    if (!useManual && (!Number.isFinite(lat) || !Number.isFinite(lon))) continue;

    const jummahManualTime = String(row.jummah_manual_time || "13:30");
    const jummahMorningTime = String(row.jummah_morning_time || DEFAULT_JUMMAH_MORNING_TIME);
    const jummahAdvanceMinutes = normJummahAdvance(row.jummah_advance_minutes);

    const key = [
      useManual ? "manual" : "auto",
      useManual ? jummahManualTime : `${lat.toFixed(3)}|${lon.toFixed(3)}`,
      tz, jummahMorningTime, jummahAdvanceMinutes
    ].join("|");

    if (!map.has(key)) {
      map.set(key, {
        lat: useManual ? null : lat,
        lon: useManual ? null : lon,
        timeZone: tz,
        jummahUseManualTime: useManual,
        jummahManualTime,
        jummahMorningTime,
        jummahAdvanceMinutes,
        subscriptionIds: []
      });
    }
    if (!map.get(key).subscriptionIds.includes(sid)) {
      map.get(key).subscriptionIds.push(sid);
    }
  }
  return Array.from(map.values());
}

async function uuidFrom(seed) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  const b = new Uint8Array(hash.slice(0, 16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function schedId(group, mode, sendAfter) {
  const loc = group.jummahUseManualTime
    ? `manual:${group.jummahManualTime}`
    : `${group.lat?.toFixed(3)}|${group.lon?.toFixed(3)}`;
  return ["jummah", mode, sendAfter.toISOString(), loc, group.timeZone].join("|");
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

async function sendJummahPush(env, group, slot, stats, sentInRun) {
  const ids = group.subscriptionIds.slice(0, 2000);
  if (!ids.length) return;

  const idKey = schedId(group, slot.mode, slot.sendAfter);
  if (sentInRun.has(idKey)) {
    stats.duplicates += 1;
    return;
  }
  sentInRun.add(idKey);

  const copy = jummahCopyForMode(slot.mode);
  const body = withIcons({
    app_id: String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim(),
    target_channel: "push",
    include_subscription_ids: ids,
    headings: { de: copy.title, en: copy.title },
    contents: { de: copy.body, en: copy.body },
    url: String(env.SITE_URL || DEFAULT_SITE_URL),
    isAnyWeb: true,
    data: { type: "jummah-push", mode: slot.mode, test: false },
    idempotency_key: await uuidFrom(idKey)
  }, env);

  if (slot.sendAfter.getTime() - Date.now() > 30 * 1000) {
    body.send_after = slot.sendAfter.toISOString();
  }

  const result = await postOneSignal(env, body);
  stats.scheduled += 1;
  stats.recipients += ids.length;
  stats.planned.push({
    prayer: "Jumuʿah",
    key: "jummah",
    mode: slot.mode,
    time: slot.timeLabel,
    sendAfter: slot.sendAfter.toISOString(),
    recipients: ids.length,
    timeZone: group.timeZone,
    timeSource: group.jummahUseManualTime ? "manual" : "dhuhr-auto"
  });
  stats.oneSignalResponses.push({
    mode: slot.mode,
    recipients: ids.length,
    response: String(result.text || "").slice(0, 200)
  });
}

function nextJummahPlanned(groups, now = new Date()) {
  const out = { morning: null, advance: null, entry: null };
  for (const g of groups) {
    const local = todayLocal(g.timeZone);
    for (const day of [local, addDays(local, 1), addDays(local, 2), addDays(local, 3), addDays(local, 4), addDays(local, 5), addDays(local, 6)]) {
      for (const slot of jummahSlotsForDay(day, g)) {
        if (slot.sendAfter <= now) continue;
        const cur = out[slot.mode];
        if (!cur || slot.sendAfter < new Date(cur.sendAfter)) {
          out[slot.mode] = {
            mode: slot.mode,
            sendAfter: slot.sendAfter.toISOString(),
            time: slot.timeLabel,
            timeZone: g.timeZone,
            timeSource: g.jummahUseManualTime ? "manual" : "dhuhr-auto"
          };
        }
      }
    }
  }
  return out;
}

async function writeStatusGithub(env, report, deps) {
  if (!env.GITHUB_TOKEN || !deps?.githubGet || !deps?.githubPut) return { saved: false };
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.JUMMAH_STATUS_PATH || DEFAULT_JUMMAH_STATUS_PATH;
  try {
    const existing = await deps.githubGet(env, owner, repo, path, branch);
    await deps.githubPut(env, owner, repo, path, `${JSON.stringify(report, null, 2)}\n`, `Jumuʿah push ${report.updatedAt}`, branch, existing?.sha);
    return { saved: true, path };
  } catch (err) {
    return { saved: false, reason: err.message || String(err) };
  }
}

export function readJummahPushStatusFromKv() {
  return lastJummahStatusReport;
}

export async function runJummahPushScheduler(env, options = {}, deps = {}) {
  const onlySub = String(options.subscriptionId || options.subscription_id || "").trim();
  const dryRun = Boolean(options.dryRun);
  const lookahead = Number(env.JUMMAH_SCHEDULE_LOOKAHEAD_MINUTES || SCHEDULE_LOOKAHEAD_MINUTES);
  const grace = Number(env.JUMMAH_SCHEDULE_GRACE_MINUTES || SCHEDULE_GRACE_MINUTES);

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
  try {
    rows = await loadJummahRegistrations();
  } catch (err) {
    return {
      ok: false, triggered: true, schedulerStatus: "error",
      reason: `Supabase nicht lesbar: ${err.message || err}`,
      lastError: err.message || String(err),
      usersWithJummah: 0, scheduled: 0
    };
  }

  const groups = groupJummahRegistrations(rows, onlySub);
  const userCount = rows.filter((r) => !onlySub || String(r.subscription_id) === onlySub).length;

  for (const group of groups) {
    const local = todayLocal(group.timeZone);
    const days = [addDays(local, -1), local, addDays(local, 1), addDays(local, 2)];

    for (const day of days) {
      for (const slot of jummahSlotsForDay(day, group)) {
        if (slot.sendAfter < windowStart) {
          stats.skippedPast += 1;
          stats.skippedPastDetails.push({ mode: slot.mode, sendAfter: slot.sendAfter.toISOString(), timeZone: group.timeZone });
          continue;
        }
        if (slot.sendAfter > windowEnd) {
          stats.skippedWindow += 1;
          continue;
        }
        try {
          if (dryRun) {
            const ids = group.subscriptionIds.slice(0, 2000);
            if (ids.length) {
              stats.scheduled += 1;
              stats.recipients += ids.length;
              stats.planned.push({
                prayer: "Jumuʿah",
                key: "jummah",
                mode: slot.mode,
                time: slot.timeLabel,
                sendAfter: slot.sendAfter.toISOString(),
                recipients: ids.length,
                timeZone: group.timeZone,
                timeSource: group.jummahUseManualTime ? "manual" : "dhuhr-auto",
                dryRun: true
              });
            }
          } else {
            await sendJummahPush(env, group, slot, stats, sentInRun);
          }
        } catch (err) {
          stats.errors += 1;
          stats.errorDetails.push(`${slot.mode} Jumuʿah: ${err.message || err}`);
        }
      }
    }
  }

  const nextPlanned = nextJummahPlanned(groups, now);
  const lastPlanned = stats.planned.length ? stats.planned[stats.planned.length - 1] : null;

  const statusReport = {
    updatedAt: new Date().toISOString(),
    ok: stats.errors === 0 && userCount > 0,
    schedulerStatus: stats.errors ? "error" : userCount ? "success" : "warning",
    schedulerEngine: "cloudflare-worker-jummah-v1",
    dryRun,
    userSource: "supabase-only",
    cronIntervalMinutes: 5,
    lastCronRun: new Date().toISOString(),
    subscriptionsTotal: userCount,
    usersWithJummah: userCount,
    locationGroups: groups.length,
    timeSource: groups.some((g) => g.jummahUseManualTime) && groups.some((g) => !g.jummahUseManualTime)
      ? "mixed"
      : groups[0]?.jummahUseManualTime ? "manual" : "dhuhr-auto",
    nextMorningPush: nextPlanned.morning,
    nextAdvancePush: nextPlanned.advance,
    nextMainPush: nextPlanned.entry,
    nextPlannedPush: [nextPlanned.morning, nextPlanned.advance, nextPlanned.entry]
      .filter(Boolean)
      .sort((a, b) => new Date(a.sendAfter) - new Date(b.sendAfter))[0] || null,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    skippedPast: stats.skippedPast,
    skippedWindow: stats.skippedWindow,
    duplicates: stats.duplicates,
    errors: stats.errors,
    lastPush: lastPlanned,
    lastRecipients: lastPlanned?.recipients || 0,
    lastOneSignalResponse: stats.oneSignalResponses.length
      ? stats.oneSignalResponses[stats.oneSignalResponses.length - 1]
      : null,
    lastError: stats.errors
      ? stats.errorDetails[0]
      : (userCount === 0 ? "Keine Nutzer mit Jumuʿah-Push in Supabase." : null),
    planned: stats.planned.slice(0, 80),
    skippedPastDetails: stats.skippedPastDetails.slice(0, 40),
    oneSignalResponses: stats.oneSignalResponses.slice(0, 20),
    errorDetails: stats.errorDetails.slice(0, 10)
  };

  lastJummahStatusReport = statusReport;
  const statusWrite = await writeStatusGithub(env, statusReport, deps);

  const reason = stats.errors
    ? `Fehler: ${stats.errorDetails[0]} (${stats.scheduled} geplant, ${stats.errors} Fehler)`
    : userCount === 0
      ? "Keine Jumuʿah-Registrierungen in Supabase gefunden."
      : dryRun
        ? `Trockenlauf: ${stats.scheduled} Jumuʿah-Pushs für ${stats.recipients} Empfänger geplant (kein Versand).`
        : `Erfolgreich: ${stats.scheduled} Jumuʿah-Pushs für ${stats.recipients} Empfänger geplant.`;

  return {
    ok: stats.errors === 0 && userCount > 0,
    triggered: true,
    schedulerStatus: statusReport.schedulerStatus,
    reason,
    status: statusReport,
    statusWrite,
    usersWithJummah: userCount,
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    errors: stats.errors,
    lastError: statusReport.lastError
  };
}
