/**
 * Tägliche Pushs: Duʿāʾ des Tages und „Heute empfohlen“.
 * Einziger produktiver Pfad: Cloudflare Worker Cron + Supabase production registrations.
 * Versand wird pro Subscription isoliert, damit ein ungültiges Abo niemals den ganzen Batch blockiert.
 */

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const DEFAULT_DAILY_STATUS_PATH = "content/admin/daily-push-status.json";
const DEFAULT_DAILY_CONFIG_PATH = "content/admin/daily-push.json";
const DAILY_CONTENT_PATH = "content/updates/daily.json";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

const DAILY_PUSH_ENGINE = "cloudflare-worker-daily-v4-isolated";
const DAILY_PUSH_ID_VERSION = "v4";
const DUA_HOUR = 9;
const REC_HOUR = 12;
const SEND_WINDOW_MINUTES = 15;
const DUA_CATCHUP_UNTIL_HOUR = 14;
const REC_CATCHUP_UNTIL_HOUR = 20;

let lastDailyStatusReport = null;

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function siteOrigin(env) {
  return String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
}

function supabaseKey(env) {
  return String(env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY).trim();
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
  const values = {};
  for (const part of parts) values[part.type] = part.value;
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function dayKey(date, timeZone) {
  const parts = getLocalParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function dayOfYearInTz(date, timeZone) {
  const parts = getLocalParts(date, timeZone);
  return Math.floor((Date.UTC(parts.year, parts.month - 1, parts.day) - Date.UTC(parts.year, 0, 0)) / 86400000);
}

function isSendWindow(localParts, hour) {
  return localParts.hour === hour && localParts.minute < SEND_WINDOW_MINUTES;
}

function isCatchupWindow(localParts, hour, untilHour) {
  if (localParts.hour < hour || localParts.hour >= untilHour) return false;
  if (localParts.hour === hour) return localParts.minute >= SEND_WINDOW_MINUTES;
  return true;
}

function deliveryMode(config) {
  return String(config?.deliveryMode || "worker-local").trim();
}

/** Marker für den bestehenden Push-System-Guard: onesignal-timezone */
function duaDeliveryWindow(localParts, duaHour, config) {
  if (deliveryMode(config) === "onesignal-timezone") {
    return isCatchupWindow(localParts, duaHour + 1, DUA_CATCHUP_UNTIL_HOUR);
  }
  return isSendWindow(localParts, duaHour) || isCatchupWindow(localParts, duaHour, DUA_CATCHUP_UNTIL_HOUR);
}

function recDeliveryWindow(localParts, recHour, config) {
  if (deliveryMode(config) === "onesignal-timezone") {
    return isCatchupWindow(localParts, recHour + 1, REC_CATCHUP_UNTIL_HOUR);
  }
  return isSendWindow(localParts, recHour) || isCatchupWindow(localParts, recHour, REC_CATCHUP_UNTIL_HOUR);
}

async function supabaseFetch(env, path, options = {}) {
  const key = supabaseKey(env);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  return { ok: response.ok, status: response.status, text, json };
}

function dedupeRegistrations(rows) {
  const bySubscription = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const subscriptionId = String(row?.subscription_id || "").trim();
    if (!subscriptionId) continue;
    const existing = bySubscription.get(subscriptionId);
    const currentTime = Date.parse(row.last_synced_at || row.created_at || "") || 0;
    const existingTime = Date.parse(existing?.last_synced_at || existing?.created_at || "") || 0;
    if (!existing || currentTime >= existingTime) bySubscription.set(subscriptionId, row);
  }
  return Array.from(bySubscription.values());
}

async function loadDailyRegistrations(env) {
  const select = [
    "device_id",
    "subscription_id",
    "timezone",
    "daily_dua_enabled",
    "daily_recommendation_enabled",
    "last_dua_push_date",
    "last_recommendation_push_date",
    "push_opted_in",
    "enabled",
    "app_environment",
    "last_synced_at"
  ].join(",");
  const query = [
    "subscription_id=not.is.null",
    "enabled=eq.true",
    "push_opted_in=eq.true",
    "app_environment=eq.production",
    "or=(daily_dua_enabled.eq.true,daily_recommendation_enabled.eq.true)",
    `select=${select}`
  ].join("&");
  const result = await supabaseFetch(env, `prayer_push_registrations?${query}`);
  if (!result.ok) throw new Error(`Supabase ${result.status}: ${result.text.slice(0, 240)}`);
  const rawRows = Array.isArray(result.json) ? result.json : [];
  return { rawRows, rows: dedupeRegistrations(rawRows) };
}

async function fetchJsonUrl(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Fetch ${response.status}: ${url}`);
  return response.json();
}

async function readGithubJson(env, deps, path) {
  if (!deps?.githubGet || !deps?.base64ToUtf8) return null;
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const file = await deps.githubGet(env, owner, repo, path, branch);
  if (!file?.content) return null;
  return { data: JSON.parse(deps.base64ToUtf8(file.content)), sha: file.sha, owner, repo, branch };
}

async function loadDailyConfig(env, deps = {}) {
  const origin = siteOrigin(env);
  try {
    const data = await fetchJsonUrl(`${origin}/${DEFAULT_DAILY_CONFIG_PATH}?v=${Date.now()}`);
    return { config: data, sha: null, source: "site" };
  } catch (_) {
    const github = await readGithubJson(env, deps, env.DAILY_PUSH_CONFIG_PATH || DEFAULT_DAILY_CONFIG_PATH);
    if (github) return { config: github.data, sha: github.sha, source: "github", ...github };
    return {
      config: {
        automatic: true,
        deliveryMode: "worker-local",
        dailyDua: { enabled: true, hour: DUA_HOUR },
        recommendation: { enabled: true, hour: REC_HOUR }
      },
      sha: null,
      source: "fallback"
    };
  }
}

async function loadDailyContentFile(env, deps, dateKey) {
  const origin = siteOrigin(env);
  let data = null;
  try {
    data = await fetchJsonUrl(`${origin}/${DAILY_CONTENT_PATH}?v=${Date.now()}`);
  } catch (_) {
    const github = await readGithubJson(env, deps, DAILY_CONTENT_PATH);
    data = github?.data || null;
  }
  if (!data || data.date !== dateKey) return null;
  if (!data.dua?.id && !data.recommendation?.id) return null;
  return data;
}

function parseFrontMatterId(markdown, filename) {
  const text = String(markdown || "");
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  const idLine = match?.[1]?.match(/^id:\s*["']?([^"'\n]+)["']?/m);
  return idLine?.[1]?.trim() || String(filename || "").replace(/\.md$/i, "");
}

function extractPostSnippet(markdown) {
  const body = String(markdown || "").replace(/^---[\s\S]*?---/, "").trim();
  const quote = (body.match(/^>\s*(.+)$/m) || [])[1] || body.split(/\n\s*\n/).find(value => value.trim());
  return String(quote || "").replace(/^#+\s*/, "").replace(/[*_>`]/g, "").trim().slice(0, 220);
}

async function loadPostMeta(file, env) {
  const origin = siteOrigin(env);
  const response = await fetch(`${origin}/content/posts/${encodeURIComponent(file)}`);
  if (!response.ok) throw new Error(`Beitrag nicht lesbar: ${file}`);
  const markdown = await response.text();
  const id = parseFrontMatterId(markdown, file);
  const title = (markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m) || [])[1]?.trim().replace(/^📖\s*/, "") || id;
  const category = (markdown.match(/^category:\s*["']?(.+?)["']?\s*$/m) || [])[1] || "";
  const scholar = (markdown.match(/^scholar:\s*["']?(.+?)["']?\s*$/m) || [])[1] || "";
  return { id, title, file, category, scholar, snippet: extractPostSnippet(markdown) };
}

export async function regenerateDailyContent(env, deps, dateKey, timeZone = "Europe/Berlin") {
  const origin = siteOrigin(env);
  const dayIndex = dayOfYearInTz(new Date(), timeZone);
  let recommendation = null;
  let dua = null;

  try {
    const index = await fetchJsonUrl(`${origin}/content/posts/posts-index.json?v=${Date.now()}`);
    const files = (Array.isArray(index?.files) ? index.files : [])
      .map(item => typeof item === "string" ? item : item?.name)
      .filter(name => name && String(name).endsWith(".md"));
    if (files.length) recommendation = await loadPostMeta(files[Math.abs(dayIndex * 7) % files.length], env);
  } catch (_) {}

  try {
    const pool = await fetchJsonUrl(`${origin}/content/duas/daily-dua-combined-pool.json?v=${Date.now()}`);
    const items = Array.isArray(pool) ? pool : Array.isArray(pool?.items) ? pool.items : [];
    if (items.length) {
      const item = items[Math.abs(dayIndex) % items.length];
      dua = {
        id: item.id,
        title: item.title || "Duʿāʾ des Tages",
        snippet: String(item.de || item.german || item.snippet || "").trim(),
        category: item.category || item.cat || ""
      };
    }
  } catch (_) {}

  if (!recommendation && !dua) return null;
  const data = {
    date: dateKey,
    timezone: timeZone,
    generated: new Date().toISOString(),
    source: "dar-daily-scheduler-regenerated-v4",
    recommendation,
    dua
  };

  if (deps?.githubPut) {
    try {
      const owner = env.GITHUB_OWNER || "Sero91ak";
      const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
      const branch = env.GITHUB_BRANCH || "main";
      const existing = deps.githubGet ? await deps.githubGet(env, owner, repo, DAILY_CONTENT_PATH, branch) : null;
      await deps.githubPut(env, owner, repo, DAILY_CONTENT_PATH, `${JSON.stringify(data, null, 2)}\n`, `Daily content ${dateKey}`, branch, existing?.sha);
    } catch (error) {
      data.writeError = error.message || String(error);
    }
  }
  return data;
}

async function uuidFrom(seed) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  const bytes = new Uint8Array(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function postOneSignal(env, payload) {
  const key = oneSignalApiKey(env);
  if (!key) throw new Error("OneSignal API Key fehlt");
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${key}`
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!response.ok) throw new Error(`OneSignal ${response.status}: ${text.slice(0, 240)}`);
  return { parsed, status: response.status };
}

async function patchRegistration(env, row, fields) {
  const deviceId = String(row?.device_id || "").trim();
  const subscriptionId = String(row?.subscription_id || "").trim();
  const filter = deviceId
    ? `device_id=eq.${encodeURIComponent(deviceId)}`
    : `subscription_id=eq.${encodeURIComponent(subscriptionId)}`;
  const result = await supabaseFetch(env, `prayer_push_registrations?${filter}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ ...fields, last_synced_at: new Date().toISOString() })
  });
  return result.ok;
}

function invalidSubscriptionIds(parsed = {}) {
  const errors = parsed?.errors;
  const ids = errors?.invalid_subscription_ids || errors?.invalid_player_ids || [];
  return new Set((Array.isArray(ids) ? ids : []).map(String));
}

function buildDailyPushPayload(env, kind, item, config, dateKey, subscriptionId, forceToken = "") {
  const isDua = kind === "dua";
  const section = isDua ? config.dailyDua : config.recommendation;
  const title = String(section?.title || (isDua ? "Duʿāʾ des Tages" : "Heute empfohlen"));
  const itemTitle = String(item?.title || "").trim();
  const snippet = String(item?.snippet || "").trim();
  const body = [itemTitle, snippet].filter(Boolean).join(snippet ? " – " : "") ||
    (isDua ? "Heutige Duʿāʾ aus Qurʾān & Sunnah." : "Heute empfohlener Beitrag.");
  const origin = siteOrigin(env);
  const url = isDua
    ? `${origin}/#dua/${encodeURIComponent(item.id)}`
    : `${origin}/#post/${encodeURIComponent(item.id)}`;

  return withIcons({
    app_id: String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim(),
    target_channel: "push",
    include_subscription_ids: [subscriptionId],
    headings: { de: title, en: title },
    contents: { de: body, en: body },
    url,
    isAnyWeb: true,
    data: {
      type: isDua ? "daily_dua" : "daily_recommendation",
      content_id: item.id,
      date: dateKey,
      source: "dar-daily-push-scheduler-v4",
      forceToken: forceToken || undefined
    }
  }, env);
}

function forceSettings(config, dateKey) {
  const force = config?.forceSend;
  if (!force || force.enabled === false || String(force.date || "") !== dateKey) {
    return { active: false, kinds: new Set(), token: "" };
  }
  const kinds = new Set((Array.isArray(force.kinds) ? force.kinds : ["dua", "recommendation"])
    .map(value => String(value).toLowerCase())
    .filter(value => value === "dua" || value === "recommendation"));
  return {
    active: kinds.size > 0,
    kinds,
    token: String(force.token || `force-${dateKey}`).trim()
  };
}

async function clearForceSend(env, deps, expectedToken) {
  if (!deps?.githubGet || !deps?.githubPut || !deps?.base64ToUtf8) return { cleared: false, reason: "GitHub-Schreibzugriff fehlt" };
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.DAILY_PUSH_CONFIG_PATH || DEFAULT_DAILY_CONFIG_PATH;
  try {
    const file = await deps.githubGet(env, owner, repo, path, branch);
    if (!file?.content) return { cleared: false, reason: "Konfiguration fehlt" };
    const config = JSON.parse(deps.base64ToUtf8(file.content));
    if (String(config?.forceSend?.token || "") !== String(expectedToken || "")) {
      return { cleared: false, reason: "Force-Token bereits geändert" };
    }
    config.forceSend = {
      ...config.forceSend,
      enabled: false,
      completedAt: new Date().toISOString()
    };
    await deps.githubPut(env, owner, repo, path, `${JSON.stringify(config, null, 2)}\n`, `Daily push force completed ${expectedToken}`, branch, file.sha);
    return { cleared: true };
  } catch (error) {
    return { cleared: false, reason: error.message || String(error) };
  }
}

export async function sendDailyPushBatch(env, rows, kind, item, config, dateKey, stats, options = {}) {
  const isDua = kind === "dua";
  const section = isDua ? config.dailyDua : config.recommendation;
  if (section?.enabled === false || !item?.id || !rows.length) return;

  for (const row of rows) {
    const subscriptionId = String(row.subscription_id || "").trim();
    if (!subscriptionId) continue;
    const idempotencyKey = await uuidFrom([
      "daily",
      DAILY_PUSH_ID_VERSION,
      kind,
      dateKey,
      item.id,
      subscriptionId,
      options.forceToken || "normal"
    ].join("|"));
    const payload = buildDailyPushPayload(env, kind, item, config, dateKey, subscriptionId, options.forceToken || "");
    payload.idempotency_key = idempotencyKey;
    payload.name = `daily-${kind}-${dateKey}-${DAILY_PUSH_ID_VERSION}${options.forceToken ? "-force" : ""}`.slice(0, 128);

    try {
      const result = await postOneSignal(env, payload);
      const invalid = invalidSubscriptionIds(result.parsed);
      const invalidCurrent = invalid.has(subscriptionId);
      const notificationId = String(result.parsed?.id || "").trim();

      if (invalidCurrent || !notificationId) {
        stats.invalid += 1;
        stats.errors += 1;
        await patchRegistration(env, row, {
          daily_dua_enabled: false,
          daily_recommendation_enabled: false,
          daily_push_error: invalidCurrent
            ? "OneSignal-Subscription ungültig – Push in der App erneut aktivieren."
            : "OneSignal hat keine Nachricht erstellt – Subscription nicht erreichbar."
        });
        continue;
      }

      const sentPatch = isDua
        ? { last_dua_push_date: dateKey, last_dua_content_id: item.id, daily_push_error: null }
        : { last_recommendation_push_date: dateKey, last_recommendation_content_id: item.id, daily_push_error: null };
      await patchRegistration(env, row, sentPatch);
      stats.sent += 1;
      stats.accepted[kind] += 1;
    } catch (error) {
      stats.errors += 1;
      await patchRegistration(env, row, { daily_push_error: String(error.message || error).slice(0, 240) });
    }
  }
}

export function readDailyPushStatusFromKv() {
  return lastDailyStatusReport;
}

async function writeStatusGithub(env, status, deps) {
  if (!deps?.githubPut || !deps?.githubGet) return { saved: false };
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.DAILY_PUSH_STATUS_PATH || DEFAULT_DAILY_STATUS_PATH;
  try {
    const existing = await deps.githubGet(env, owner, repo, path, branch);
    await deps.githubPut(env, owner, repo, path, `${JSON.stringify(status, null, 2)}\n`, `Daily push ${status.updatedAt}`, branch, existing?.sha);
    return { saved: true, path };
  } catch (error) {
    return { saved: false, reason: error.message || String(error) };
  }
}

export async function runDailyPushScheduler(env, options = {}, deps = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const canonicalTimeZone = "Europe/Berlin";
  const canonicalDateKey = dayKey(now, canonicalTimeZone);
  const stats = {
    checked: 0,
    duaCandidates: 0,
    recCandidates: 0,
    sent: 0,
    skipped: 0,
    duplicates: 0,
    errors: 0,
    invalid: 0,
    accepted: { dua: 0, recommendation: 0 }
  };

  let config;
  let rawRows = [];
  let rows = [];
  let dailyContent;
  let force = { active: false, kinds: new Set(), token: "" };

  try {
    const [configResult, registrations] = await Promise.all([
      loadDailyConfig(env, deps),
      loadDailyRegistrations(env)
    ]);
    config = configResult.config;
    rawRows = registrations.rawRows;
    rows = registrations.rows;
    force = forceSettings(config, canonicalDateKey);
    dailyContent = await loadDailyContentFile(env, deps, canonicalDateKey);
    if (!dailyContent?.dua?.id && !dailyContent?.recommendation?.id) {
      dailyContent = await regenerateDailyContent(env, deps, canonicalDateKey, canonicalTimeZone);
    }
  } catch (error) {
    const status = {
      ok: false,
      schedulerEngine: DAILY_PUSH_ENGINE,
      deliveryMode: deliveryMode(config),
      schedulerStatus: "error",
      updatedAt: now.toISOString(),
      lastError: error.message || String(error),
      ...stats
    };
    lastDailyStatusReport = status;
    status.statusWrite = await writeStatusGithub(env, status, deps);
    return { ok: false, triggered: true, reason: status.lastError, status };
  }

  const duaItem = dailyContent?.dua?.id ? dailyContent.dua : null;
  const recommendationItem = dailyContent?.recommendation?.id ? dailyContent.recommendation : null;
  if (!duaItem && !recommendationItem) {
    const status = {
      ok: false,
      schedulerEngine: DAILY_PUSH_ENGINE,
      deliveryMode: deliveryMode(config),
      schedulerStatus: "warning",
      updatedAt: now.toISOString(),
      lastError: "Kein Tagesinhalt für heute vorhanden.",
      dailyContentDate: dailyContent?.date || null,
      ...stats
    };
    lastDailyStatusReport = status;
    status.statusWrite = await writeStatusGithub(env, status, deps);
    return { ok: false, triggered: true, reason: status.lastError, status };
  }

  const duaQueue = [];
  const recommendationQueue = [];
  const onlySubscriptionId = String(options.subscriptionId || options.subscription_id || "").trim();

  for (const row of rows) {
    const subscriptionId = String(row.subscription_id || "").trim();
    if (onlySubscriptionId && subscriptionId !== onlySubscriptionId) continue;
    stats.checked += 1;
    const local = getLocalParts(now, String(row.timezone || canonicalTimeZone));
    const duaHour = Number(config?.dailyDua?.hour ?? DUA_HOUR);
    const recommendationHour = Number(config?.recommendation?.hour ?? REC_HOUR);
    const forceDua = force.active && force.kinds.has("dua");
    const forceRecommendation = force.active && force.kinds.has("recommendation");
    const duaWindow = forceDua || duaDeliveryWindow(local, duaHour, config);
    const recommendationWindow = forceRecommendation || recDeliveryWindow(local, recommendationHour, config);

    if (row.daily_dua_enabled !== false && duaItem && config?.dailyDua?.enabled !== false && duaWindow) {
      if (!forceDua && row.last_dua_push_date === canonicalDateKey) stats.duplicates += 1;
      else {
        stats.duaCandidates += 1;
        duaQueue.push(row);
      }
    }

    if (row.daily_recommendation_enabled !== false && recommendationItem && config?.recommendation?.enabled !== false && recommendationWindow) {
      if (!forceRecommendation && row.last_recommendation_push_date === canonicalDateKey) stats.duplicates += 1;
      else {
        stats.recCandidates += 1;
        recommendationQueue.push(row);
      }
    }
  }

  await sendDailyPushBatch(env, duaQueue, "dua", duaItem, config, canonicalDateKey, stats, { forceToken: force.kinds.has("dua") ? force.token : "" });
  await sendDailyPushBatch(env, recommendationQueue, "recommendation", recommendationItem, config, canonicalDateKey, stats, { forceToken: force.kinds.has("recommendation") ? force.token : "" });

  let forceClear = null;
  if (force.active && stats.errors === 0) {
    forceClear = await clearForceSend(env, deps, force.token);
  }

  const status = {
    ok: stats.errors === 0,
    schedulerEngine: DAILY_PUSH_ENGINE,
    idVersion: DAILY_PUSH_ID_VERSION,
    deliveryMode: deliveryMode(config),
    schedulerStatus: stats.errors ? "error" : "success",
    updatedAt: now.toISOString(),
    usersChecked: stats.checked,
    registrationsRead: rawRows.length,
    uniqueSubscriptions: rows.length,
    duplicateRegistrationsDropped: Math.max(0, rawRows.length - rows.length),
    appEnvironment: "production",
    duaCandidates: stats.duaCandidates,
    recCandidates: stats.recCandidates,
    sent: stats.sent,
    accepted: stats.accepted,
    invalidSubscriptionsDisabled: stats.invalid,
    skipped: stats.skipped,
    duplicates: stats.duplicates,
    errors: stats.errors,
    forceSend: force.active ? { token: force.token, kinds: Array.from(force.kinds), cleared: Boolean(forceClear?.cleared), clearError: forceClear?.reason || null } : null,
    dailyContentDate: dailyContent?.date || null,
    currentRecommendation: recommendationItem ? {
      id: recommendationItem.id,
      title: recommendationItem.title,
      category: recommendationItem.category || "",
      scholar: recommendationItem.scholar || ""
    } : null,
    currentDua: duaItem ? {
      id: duaItem.id,
      title: duaItem.title,
      category: duaItem.category || ""
    } : null,
    configAutomatic: config?.automatic !== false
  };

  lastDailyStatusReport = status;
  status.statusWrite = await writeStatusGithub(env, status, deps);

  return {
    ok: status.ok,
    triggered: true,
    schedulerStatus: status.schedulerStatus,
    reason: `Geprüft: ${stats.checked} · Akzeptiert: ${stats.sent} · Ungültig deaktiviert: ${stats.invalid}`,
    status
  };
}
