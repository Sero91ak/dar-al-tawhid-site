#!/usr/bin/env node
/* DAR AL TAWḤID – tägliche Inhalts-Pushs
   Serverseitiger Scheduler für "Duʿāʾ des Tages" und "Heute empfohlen". */

const fs = require("node:fs");
const path = require("node:path");
const {
  withNotificationIcons,
  postOneSignalNotification
} = require("./lib/onesignal-push");

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_APP_API_KEY || process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_AUTH_KEY = String(API_KEY || "")
  .replace(/\s+/g, "")
  .replace(/^(Key|Basic)/i, "")
  .trim();
const SITE_ORIGIN = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/#.*$/, "").replace(/\/$/, "");
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const SEND_WINDOW_MINUTES = Number(process.env.DAILY_PUSH_WINDOW_MINUTES || 75);
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

function localMinuteOfDay(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return h * 60 + m;
}

function shouldSendNow(date, timeZone, hour) {
  const current = localMinuteOfDay(date, timeZone);
  const target = hour * 60;
  return current >= target && current < target + SEND_WINDOW_MINUTES;
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

async function fetchLegacyPlayers() {
  if (DRY_RUN && !API_KEY) return [];

  const all = [];
  let offset = 0;
  const limit = 300;

  while (true) {
    const url = `https://onesignal.com/api/v1/players?app_id=${encodeURIComponent(APP_ID)}&limit=${limit}&offset=${offset}`;
    let data = null;
    let lastError = null;

    for (const mode of ["Key", "Basic"]) {
      const res = await fetch(url, { headers: { Authorization: `${mode} ${ONESIGNAL_AUTH_KEY}` } });
      const text = await res.text();
      if (res.ok) {
        data = JSON.parse(text);
        break;
      }
      lastError = new Error(`OneSignal Subscriptions Fehler ${res.status} (${mode}): ${text}`);
    }

    if (!data) throw lastError || new Error("OneSignal Subscriptions Fehler");

    const players = Array.isArray(data.players) ? data.players : [];
    all.push(...players);
    if (players.length < limit) break;
    offset += limit;
  }

  return all;
}

async function fetchUserByAlias(aliasLabel, aliasId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(APP_ID)}/users/by/${encodeURIComponent(aliasLabel)}/${encodeURIComponent(aliasId)}`;

  for (const mode of ["Key", "Basic"]) {
    const res = await fetch(url, { headers: { Authorization: `${mode} ${ONESIGNAL_AUTH_KEY}` } });
    if (res.ok) return JSON.parse(await res.text());
  }

  return null;
}

async function fetchUserBySubscriptionId(subscriptionId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(APP_ID)}/subscriptions/${encodeURIComponent(subscriptionId)}/user`;

  for (const mode of ["Key", "Basic"]) {
    const res = await fetch(url, { headers: { Authorization: `${mode} ${ONESIGNAL_AUTH_KEY}` } });
    if (res.ok) return JSON.parse(await res.text());
  }

  return null;
}

function extractUserTags(user) {
  const tags = user?.properties?.tags;
  return tags && typeof tags === "object" ? { ...tags } : {};
}

function extractWebPushSubscriptionIds(user) {
  const subs = Array.isArray(user?.subscriptions) ? user.subscriptions : [];
  return subs
    .filter((s) => {
      const type = String(s?.type || "").toLowerCase();
      return type.includes("web") || type.includes("chrome") || type.includes("safari") || type.includes("mozilla");
    })
    .filter((s) => s.enabled !== false && s.invalid_identifier !== true)
    .map((s) => s.id)
    .filter(Boolean);
}

async function resolvePlayer(player) {
  let user = null;
  const externalId = player.external_user_id || player.external_id;

  if (externalId) user = await fetchUserByAlias("external_id", externalId);
  if (!user && player.id) user = await fetchUserBySubscriptionId(player.id);

  const tags = { ...(player.tags || {}), ...extractUserTags(user) };
  const userSubs = extractWebPushSubscriptionIds(user);
  const subscriptionIds = userSubs.length ? userSubs : [player.id].filter(Boolean);

  return { ...player, tags, subscriptionIds };
}

async function fetchSubscriptions() {
  const players = await fetchLegacyPlayers();
  const out = [];

  for (const player of players) {
    out.push(await resolvePlayer(player));
  }

  return out;
}

function subscribed(player) {
  return player.invalid_identifier !== true && player.notification_types !== -2;
}

function categoryEnabled(tags, key) {
  const value = tags[key];
  if (value === false || value === "false" || value === "0") return false;
  return true;
}

function alreadySentToday(tags, kind, date) {
  const key = kind === "dua" ? "daily_dua_last_date" : "daily_recommendation_last_date";
  return String(tags[key] || "") === date;
}

function pushTimeZone(tags) {
  return String(tags.push_timezone || tags.prayer_timezone || "Europe/Berlin");
}

function groupRecipients(users, kind, now, hour) {
  const tagName = kind === "dua" ? "daily_dua_notifications" : "daily_recommendation_notifications";
  const groups = new Map();

  for (const user of users) {
    const tags = user.tags || {};
    if (!subscribed(user)) continue;
    if (!categoryEnabled(tags, tagName)) continue;

    const timeZone = pushTimeZone(tags);
    if (!shouldSendNow(now, timeZone, hour)) continue;
    const date = dayKey(now, timeZone);
    if (alreadySentToday(tags, kind, date)) continue;

    const key = `${kind}|${timeZone}`;
    if (!groups.has(key)) groups.set(key, { kind, timeZone, subscriptionIds: [], playerIds: [] });

    for (const id of user.subscriptionIds || []) {
      if (id && !groups.get(key).subscriptionIds.includes(id)) groups.get(key).subscriptionIds.push(id);
    }

    if (user.id && !groups.get(key).playerIds.includes(user.id)) {
      groups.get(key).playerIds.push(user.id);
    }
  }

  return Array.from(groups.values());
}

async function updatePlayerTags(playerId, tags) {
  if (!playerId || DRY_RUN || !API_KEY) return;

  const res = await fetch(`https://onesignal.com/api/v1/players/${encodeURIComponent(playerId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_AUTH_KEY}`
    },
    body: JSON.stringify({ app_id: APP_ID, tags })
  });

  if (!res.ok) {
    console.warn(`Tag-Update fehlgeschlagen ${playerId}: ${res.status} ${await res.text()}`);
  }
}

async function markGroupSent(group, item, date) {
  const isDua = group.kind === "dua";
  const tags = isDua
    ? {
        daily_dua_last_id: String(item.id),
        daily_dua_last_date: date,
        daily_push_last_sent_at: new Date().toISOString(),
        daily_push_last_error: ""
      }
    : {
        daily_recommendation_last_id: String(item.id),
        daily_recommendation_last_date: date,
        daily_push_last_sent_at: new Date().toISOString(),
        daily_push_last_error: ""
      };

  for (const playerId of group.playerIds || []) {
    await updatePlayerTags(playerId, tags);
  }
}

async function sendGroup(group, item, config, now) {
  const date = dayKey(now, group.timeZone);
  const isDua = group.kind === "dua";
  const title = isDua ? "Duʿāʾ des Tages" : "Heute empfohlen";
  const body = isDua
    ? "Eine kurze Erinnerung aus Qurʾān & Sunnah – öffne die App und lies die heutige Duʿāʾ."
    : "Ein ausgewählter Beitrag für dich – Wissen aus Qurʾān, Sunnah und den Āthār.";
  const url = isDua
    ? `${SITE_ORIGIN}/#dua/${encodeURIComponent(item.id)}`
    : `${SITE_ORIGIN}/#post/${encodeURIComponent(item.id)}`;
  const idempotency = `dar-${group.kind}-${date}-${group.timeZone.replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const ids = group.subscriptionIds.slice(0, 2000);

  if (!ids.length) return;

  const payload = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    include_subscription_ids: ids,
    headings: { de: title, en: title },
    contents: { de: body, en: body },
    url,
    isAnyWeb: true,
    idempotency_key: idempotency,
    data: {
      type: isDua ? "daily_dua" : "daily_recommendation",
      date,
      content_id: item.id,
      source: "dar-daily-content-push"
    }
  }, SITE_ORIGIN);

  if (DRY_RUN) {
    console.log(`[DRY_RUN] ${title} | ${date} | ${group.timeZone} | ${ids.length} Nutzer | ${item.id}`);
    return;
  }

  const result = await postOneSignalNotification(payload, API_KEY, { retries: 3 });
  await markGroupSent(group, item, date);
  console.log(`Gesendet/geplant: ${title} | ${date} | ${group.timeZone} | ${ids.length} Nutzer | ${item.id} → ${result.text}`);
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

  if (!dailyDua) console.log("Keine gültige Duʿāʾ gefunden.");
  if (!recommendation) console.log("Kein gültiger Empfehlungs-Beitrag gefunden.");

  const users = await fetchSubscriptions();
  console.log(`Subscriptions gesamt: ${users.length}`);

  if (config.dailyDua?.enabled !== false && dailyDua) {
    const groups = groupRecipients(users, "dua", now, Number(config.dailyDua?.hour || DEFAULT_DUA_HOUR));
    console.log(`Duʿāʾ-Gruppen im Zeitfenster: ${groups.length}`);
    for (const group of groups) await sendGroup(group, dailyDua, config, now);
  }

  if (config.recommendation?.enabled !== false && recommendation) {
    const groups = groupRecipients(users, "recommendation", now, Number(config.recommendation?.hour || DEFAULT_RECOMMENDATION_HOUR));
    console.log(`Empfehlungs-Gruppen im Zeitfenster: ${groups.length}`);
    for (const group of groups) await sendGroup(group, recommendation, config, now);
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
