#!/usr/bin/env node
/* DAR AL TAWḤID – tägliche Inhalts-Pushs
   Plant Duʿāʾ/Empfehlung über OneSignal-Zeitzone-Zustellung ohne Player-API. */

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
const DEFAULT_DUA_HOUR = Number(process.env.DAILY_DUA_HOUR || 9);
const DEFAULT_RECOMMENDATION_HOUR = Number(process.env.DAILY_RECOMMENDATION_HOUR || 12);
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "content/admin/daily-push.json");

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

function stripMarkdown(text) {
  return String(text || "")
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrontMatter(markdown, filename) {
  const text = String(markdown || "");
  const data = { id: filename.replace(/\.md$/i, ""), title: "", statement: "", category: "", scholar: "" };
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

  if (match) {
    match[1].split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!m) return;
      data[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    });
  }

  data.statement = stripMarkdown(text.slice(match ? match[0].length : 0));
  if (!data.title) data.title = filename.replace(/[-_]+/g, " ").replace(/\.md$/i, "");
  if (!data.id) data.id = filename.replace(/\.md$/i, "");

  return data;
}

function loadDuas() {
  const duas = readJson(path.join(ROOT, "content/duas/duas.json"), []);
  return Array.isArray(duas)
    ? duas.filter((d) => d && d.id && d.title && (d.de || d.occasion))
    : [];
}

function loadPosts() {
  const index = readJson(path.join(ROOT, "content/posts/posts-index.json"), { files: [] });
  const files = Array.isArray(index.files) ? index.files : [];
  const posts = [];

  for (const file of files) {
    const name = typeof file === "string" ? file : file && file.name;
    if (!name || !name.endsWith(".md")) continue;
    const full = path.join(ROOT, "content/posts", name);
    if (!fs.existsSync(full)) continue;
    posts.push(parseFrontMatter(fs.readFileSync(full, "utf8"), name));
  }

  return posts.filter((p) => p.id && p.title && p.statement);
}

function dayKey(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function stablePick(items, dateKey, multiplier) {
  if (!items.length) return null;
  const n = Number(dateKey.replaceAll("-", ""));
  return items[Math.abs(n * multiplier) % items.length];
}

function dailyConfig() {
  const fallback = {
    automatic: true,
    dailyDua: { enabled: true, hour: DEFAULT_DUA_HOUR },
    recommendation: { enabled: true, hour: DEFAULT_RECOMMENDATION_HOUR }
  };
  return { ...fallback, ...readJson(CONFIG_PATH, {}) };
}

function pickDailyDua(duas, config, dateKey) {
  const manualId = config?.dailyDua?.id;
  const manual = manualId ? duas.find((d) => String(d.id) === String(manualId)) : null;
  return manual || stablePick(duas, dateKey, 3);
}

function pickRecommendation(posts, config, dateKey) {
  const manualId = config?.recommendation?.id;
  const manual = manualId ? posts.find((p) => String(p.id) === String(manualId)) : null;
  return manual || stablePick(posts, dateKey, 7);
}

function formatDeliveryTime(hour24) {
  const hour = Number(hour24);
  if (hour === 0) return "12:00AM";
  if (hour === 12) return "12:00PM";
  if (hour < 12) return `${hour}:00AM`;
  return `${hour - 12}:00PM`;
}

function shouldScheduleDailyNotifications(now) {
  if (process.env.FORCE_DAILY_SCHEDULE === "1") return true;
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  return hour === 0 && minute < 30;
}

async function scheduleDailyNotification(kind, item, config, now) {
  const isDua = kind === "dua";
  const section = isDua ? config.dailyDua : config.recommendation;
  if (section?.enabled === false || !item) return;

  const tagName = isDua ? "daily_dua_notifications" : "daily_recommendation_notifications";
  const title = isDua ? "Duʿāʾ des Tages" : "Heute empfohlen";
  const body = isDua
    ? String(section?.body || "Eine kurze Erinnerung aus Qurʾān & Sunnah – öffne die App und lies die heutige Duʿāʾ.")
    : String(section?.body || "Ein ausgewählter Beitrag für dich – Wissen aus Qurʾān, Sunnah und den Āthār.");
  const hour = Number(section?.hour || (isDua ? DEFAULT_DUA_HOUR : DEFAULT_RECOMMENDATION_HOUR));
  const deliveryTime = formatDeliveryTime(hour);
  const date = dayKey(now, "UTC");
  const url = isDua
    ? `${SITE_ORIGIN}/#dua/${encodeURIComponent(item.id)}`
    : `${SITE_ORIGIN}/#post/${encodeURIComponent(item.id)}`;
  const idempotency = `dar-${kind}-${date}`;

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
    idempotency_key: idempotency,
    data: {
      type: isDua ? "daily_dua" : "daily_recommendation",
      date,
      content_id: item.id,
      source: "dar-daily-content-push"
    }
  }, SITE_ORIGIN);

  if (DRY_RUN) {
    console.log(`[DRY_RUN] geplant: ${title} | ${deliveryTime} Ortszeit | ${item.id}`);
    return;
  }

  try {
    const result = await postOneSignalNotification(payload, API_KEY, { retries: 3 });
    console.log(`Geplant: ${title} | ${deliveryTime} Ortszeit | ${item.id} → ${result.text}`);
  } catch (error) {
    console.warn(`Planung fehlgeschlagen (${title}): ${error.message || error}`);
  }
}

(async function main() {
  const now = process.env.NOW ? new Date(process.env.NOW) : new Date();
  const config = dailyConfig();
  const duas = loadDuas();
  const posts = loadPosts();
  const berlinDate = dayKey(now, "Europe/Berlin");
  const dailyDua = pickDailyDua(duas, config, berlinDate);
  const recommendation = pickRecommendation(posts, config, berlinDate);

  console.log(`Tägliche Push-Prüfung: ${now.toISOString()} | Duʿāʾ=${duas.length} | Beiträge=${posts.length}`);

  if (!shouldScheduleDailyNotifications(now)) {
    console.log(`Tages-Push-Planung übersprungen (${now.toISOString()} – Planung nur 00:00 UTC).`);
    return;
  }

  if (!dailyDua) console.log("Keine gültige Duʿāʾ gefunden.");
  if (!recommendation) console.log("Kein gültiger Empfehlungs-Beitrag gefunden.");

  if (config.dailyDua?.enabled !== false && dailyDua) {
    await scheduleDailyNotification("dua", dailyDua, config, now);
  }

  if (config.recommendation?.enabled !== false && recommendation) {
    await scheduleDailyNotification("recommendation", recommendation, config, now);
  }
})().catch((error) => {
  console.error(error.message || error);
});
