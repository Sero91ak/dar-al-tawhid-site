#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const schedulerPath = path.join(root, "cloudflare", "prayer-push-scheduler.js");
const adminPath = path.join(root, "cloudflare", "prayer-push-admin.js");

function replaceRequired(source, oldText, newText, label) {
  if (source.includes(newText)) return source;
  if (!source.includes(oldText)) throw new Error(`Patchstelle fehlt: ${label}`);
  return source.replace(oldText, newText);
}

function patchScheduler(source) {
  let out = source;

  out = replaceRequired(
    out,
    'import { pickPrayerEntryVariant, buildAdvancePushBody } from "./prayer-push-copy.js";',
    'import { PRAYER_PUSH_COPY_VERSION, pickPrayerEntryVariant, buildAdvancePushBody } from "./prayer-push-copy.js";',
    "copy version import"
  );

  out = replaceRequired(
    out,
    'const SCHEDULE_LOOKAHEAD_MINUTES = 26 * 60;\nconst SCHEDULE_GRACE_MINUTES = 15;',
    'const SCHEDULE_LOOKAHEAD_MINUTES = 90;\nconst SCHEDULE_GRACE_MINUTES = 15;\nconst PRAYER_COPY_MIGRATION_UNTIL = Date.parse("2026-07-22T00:00:00Z");\nconst PRAYER_PUSH_EMOJI = Object.freeze({ fajr: "✨", dhuhr: "☀️", asr: "🌤️", maghrib: "🌥️", isha: "🌙", tahajjud: "🌙" });',
    "scheduler constants"
  );

  out = replaceRequired(
    out,
    'function notifyTitle(prayer, mode, group) {\n  if (prayer.key === "tahajjud") return mode === "advance" ? "Taḥajjud-Erinnerung" : "Taḥajjud-Erinnerung";\n  const m = normAdvance(group.advanceMinutes);\n  return mode === "advance" ? `${prayer.name} in ${m} Min` : `${prayer.name} ist eingetreten`;\n}',
    'function notifyTitle(prayer, mode, group) {\n  const emoji = PRAYER_PUSH_EMOJI[prayer.key] || "🔔";\n  if (prayer.key === "tahajjud") return `${emoji} Taḥajjud-Erinnerung`;\n  const m = normAdvance(group.advanceMinutes);\n  return mode === "advance" ? `${emoji} ${prayer.name} in ${m} Min` : `${emoji} ${prayer.name} ist eingetreten`;\n}',
    "advance title emojis"
  );

  out = replaceRequired(
    out,
    'function schedId(group, prayer, sendAfter, mode) {\n  return ["prayer", mode, prayer.key, sendAfter.toISOString(), group.lat.toFixed(3), group.lon.toFixed(3), group.timeZone].join("|");\n}',
    'function schedId(group, prayer, sendAfter, mode) {\n  return ["prayer", PRAYER_PUSH_COPY_VERSION, mode, prayer.key, sendAfter.toISOString(), group.lat.toFixed(3), group.lon.toFixed(3), group.timeZone].join("|");\n}\n\nfunction legacySchedId(group, prayer, sendAfter, mode) {\n  return ["prayer", mode, prayer.key, sendAfter.toISOString(), group.lat.toFixed(3), group.lon.toFixed(3), group.timeZone].join("|");\n}',
    "idempotency version"
  );

  out = replaceRequired(
    out,
    'async function sendPush(env, group, prayer, sendAfter, mode, stats, sentInRun) {\n  const ids = group.subscriptionIds.slice(0, 2000);\n  if (!ids.length) return;\n  const idKey = schedId(group, prayer, sendAfter, mode);',
    'async function cancelOneSignal(env, notificationId, appId) {\n  if (!notificationId) return false;\n  const key = oneSignalApiKey(env);\n  const url = `https://api.onesignal.com/notifications/${encodeURIComponent(notificationId)}?app_id=${encodeURIComponent(appId)}`;\n  const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Key ${key}` } });\n  if (res.ok || res.status === 404) return true;\n  const text = await res.text();\n  throw new Error(`OneSignal cancel ${res.status}: ${text.slice(0, 200)}`);\n}\n\nasync function sendPush(env, group, prayer, sendAfter, mode, stats, sentInRun) {\n  const ids = group.subscriptionIds.slice(0, 2000);\n  if (!ids.length) return;\n  const idKey = schedId(group, prayer, sendAfter, mode);\n  const oldIdKey = legacySchedId(group, prayer, sendAfter, mode);',
    "legacy cancellation helper"
  );

  out = replaceRequired(
    out,
    '  const result = await postOneSignal(env, body);\n  stats.scheduled += 1;',
    '  if (Date.now() < PRAYER_COPY_MIGRATION_UNTIL && body.send_after) {\n    try {\n      const legacyBody = { ...body, idempotency_key: await uuidFrom(oldIdKey) };\n      const legacyResult = await postOneSignal(env, legacyBody);\n      const legacyNotificationId = String(legacyResult.parsed?.id || "").trim();\n      if (legacyNotificationId) await cancelOneSignal(env, legacyNotificationId, body.app_id);\n    } catch (migrationError) {\n      stats.errorDetails.push(`Migration ${prayer.name}: ${migrationError.message || migrationError}`);\n    }\n  }\n\n  const result = await postOneSignal(env, body);\n  stats.scheduled += 1;',
    "replace scheduled legacy message"
  );

  out = replaceRequired(
    out,
    '  const lookahead = Number(env.PRAYER_SCHEDULE_LOOKAHEAD_MINUTES || SCHEDULE_LOOKAHEAD_MINUTES);',
    '  const configuredLookahead = Number(env.PRAYER_SCHEDULE_LOOKAHEAD_MINUTES || SCHEDULE_LOOKAHEAD_MINUTES);\n  const lookahead = Math.min(90, Math.max(15, Number.isFinite(configuredLookahead) ? configuredLookahead : SCHEDULE_LOOKAHEAD_MINUTES));',
    "lookahead clamp"
  );

  out = replaceRequired(
    out,
    '    schedulerEngine: "cloudflare-worker-cron-v2",\n    userSource: "supabase-only",',
    '    schedulerEngine: "cloudflare-worker-cron-v3",\n    prayerCopyVersion: PRAYER_PUSH_COPY_VERSION,\n    migrationActive: Date.now() < PRAYER_COPY_MIGRATION_UNTIL,\n    userSource: "supabase-only",',
    "status version"
  );

  return out;
}

function patchAdmin(source) {
  let out = source;

  out = replaceRequired(
    out,
    'const PRAYER_NAMES = {\n  fajr: "Fajr",\n  dhuhr: "Dhuhr",\n  asr: "ʿAṣr",\n  maghrib: "Maghrib",\n  isha: "ʿIshāʾ",\n  tahajjud: "Taḥajjud"\n};',
    'const PRAYER_NAMES = {\n  fajr: "Fajr",\n  dhuhr: "Dhuhr",\n  asr: "ʿAṣr",\n  maghrib: "Maghrib",\n  isha: "ʿIshāʾ",\n  tahajjud: "Taḥajjud"\n};\nconst PRAYER_PUSH_EMOJI = Object.freeze({ fajr: "✨", dhuhr: "☀️", asr: "🌤️", maghrib: "🌥️", isha: "🌙", tahajjud: "🌙" });',
    "admin emoji map"
  );

  out = replaceRequired(
    out,
    '    const title = key === "tahajjud" ? `Taḥajjud in ${minutes} Min` : `${name} in ${minutes} Min`;',
    '    const emoji = PRAYER_PUSH_EMOJI[key] || "🔔";\n    const title = key === "tahajjud" ? `${emoji} Taḥajjud-Erinnerung` : `${emoji} ${name} in ${minutes} Min`;',
    "test push advance emoji"
  );

  return out;
}

const schedulerBefore = fs.readFileSync(schedulerPath, "utf8");
const adminBefore = fs.readFileSync(adminPath, "utf8");
const schedulerAfter = patchScheduler(schedulerBefore);
const adminAfter = patchAdmin(adminBefore);

fs.writeFileSync(schedulerPath, schedulerAfter, "utf8");
fs.writeFileSync(adminPath, adminAfter, "utf8");

console.log("Gebets-Push-Runtime v3 angewendet: neue Emojis, 90-Minuten-Fenster und Ablösung alter OneSignal-Planungen.");
