#!/usr/bin/env node
/* DAR AL TAWḤID – tägliche Pushs (09:00 Duʿāʾ · 12:00 Empfehlung)
   Einfachster Weg: 1× nachts bei OneSignal einplanen → jeder Nutzer bekommt
   Push zur Ortszeit (delayed_option: timezone). Kein 5-Minuten-Cron nötig. */

const fs = require("node:fs");
const path = require("node:path");
const {
  withNotificationIcons,
  postOneSignalNotification
} = require("./lib/onesignal-push");

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_API_KEY_NEW || process.env.ONESIGNAL_APP_API_KEY || process.env.ONESIGNAL_API_KEY;
const SITE_ORIGIN = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/#.*$/, "").replace(/\/$/, "");
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const TZ = "Europe/Berlin";
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "content/admin/daily-push.json");
const DAILY_JSON_PATH = path.join(ROOT, "content/updates/daily.json");

if (!API_KEY && !DRY_RUN) {
  console.error("Fehlt: GitHub Secret ONESIGNAL_APP_API_KEY");
  process.exit(1);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function dayKey(date, timeZone = TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dailyConfig() {
  const fallback = {
    automatic: true,
    deliveryMode: "onesignal-timezone",
    dailyDua: { enabled: true, hour: 9, title: "Duʿāʾ des Tages" },
    recommendation: { enabled: true, hour: 12, title: "Heute empfohlen" }
  };
  return { ...fallback, ...readJson(CONFIG_PATH, {}) };
}

function formatDeliveryTime(hour24) {
  const hour = Number(hour24);
  if (hour === 0) return "12:00AM";
  if (hour === 12) return "12:00PM";
  if (hour < 12) return `${hour}:00AM`;
  return `${hour - 12}:00PM`;
}

function buildBody(item, fallback) {
  const title = String(item?.title || "").trim();
  const snippet = String(item?.snippet || item?.statement || item?.de || "").trim();
  const line = [title, snippet].filter(Boolean).join(snippet ? " – " : "");
  return line || fallback;
}

function loadDailyItems(dateKey) {
  const daily = readJson(DAILY_JSON_PATH, null);
  if (daily?.date === dateKey) {
    return {
      dua: daily.dua?.id ? daily.dua : null,
      recommendation: daily.recommendation?.id ? daily.recommendation : null
    };
  }
  return { dua: null, recommendation: null };
}

async function scheduleDailyNotification(kind, item, config, dateKey) {
  const isDua = kind === "dua";
  const section = isDua ? config.dailyDua : config.recommendation;
  if (section?.enabled === false || !item?.id) return { ok: false, skipped: true, kind };

  const tagName = isDua ? "daily_dua_notifications" : "daily_recommendation_notifications";
  const title = String(section?.title || (isDua ? "Duʿāʾ des Tages" : "Heute empfohlen"));
  const fallbackBody = isDua
    ? "Eine kurze Erinnerung aus Qurʾān & Sunnah – öffne die App und lies die heutige Duʿāʾ."
    : "Ein ausgewählter Beitrag für dich – Wissen aus Qurʾān, Sunnah und den Āthār.";
  const body = buildBody(item, fallbackBody);
  const hour = Number(section?.hour ?? (isDua ? 9 : 12));
  const deliveryTime = formatDeliveryTime(hour);
  const url = isDua
    ? `${SITE_ORIGIN}/#dua/${encodeURIComponent(item.id)}`
    : `${SITE_ORIGIN}/#post/${encodeURIComponent(item.id)}`;

  const payload = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    filters: [{ field: "tag", key: tagName, relation: "=", value: "true" }],
    headings: { de: title, en: title },
    contents: { de: body, en: body },
    url,
    isAnyWeb: true,
    delayed_option: "timezone",
    delivery_time_of_day: deliveryTime,
    idempotency_key: `dar-${kind}-${dateKey}`,
    data: {
      type: isDua ? "daily_dua" : "daily_recommendation",
      date: dateKey,
      content_id: item.id,
      source: "dar-daily-onesignal-timezone"
    }
  }, SITE_ORIGIN);

  if (DRY_RUN) {
    console.log(`[DRY_RUN] ${title} · ${deliveryTime} Ortszeit · ${item.id}`);
    return { ok: true, dryRun: true, kind, deliveryTime, contentId: item.id };
  }

  const result = await postOneSignalNotification(payload, API_KEY, { retries: 3 });
  console.log(`Geplant: ${title} · ${deliveryTime} Ortszeit · ${item.id} → ${result.text}`);
  return { ok: true, kind, deliveryTime, contentId: item.id, result: result.text };
}

async function runDailyContentPushSchedule(options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const config = dailyConfig();
  const dateKey = dayKey(now, TZ);
  const { dua, recommendation } = loadDailyItems(dateKey);
  const results = [];

  console.log(`OneSignal-Tagesplanung: ${now.toISOString()} · Datum ${dateKey} · Modus ${config.deliveryMode || "onesignal-timezone"}`);

  if (!dua) console.warn("Hinweis: Kein Duʿāʾ in content/updates/daily.json für heute – Planung übersprungen.");
  if (!recommendation) console.warn("Hinweis: Keine Empfehlung in daily.json für heute – Planung übersprungen.");

  if (config.dailyDua?.enabled !== false && dua) {
    results.push(await scheduleDailyNotification("dua", dua, config, dateKey));
  }
  if (config.recommendation?.enabled !== false && recommendation) {
    results.push(await scheduleDailyNotification("recommendation", recommendation, config, dateKey));
  }

  return { ok: results.some((r) => r.ok), dateKey, results };
}

if (require.main === module) {
  runDailyContentPushSchedule()
    .then((out) => {
      if (!out.ok) {
        console.error("Keine Pushs geplant – daily.json für heute prüfen.");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(error.message || error);
      process.exit(1);
    });
}

module.exports = { runDailyContentPushSchedule };
