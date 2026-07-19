/**
 * Tägliche Pushs: Duʿāʾ des Tages (09:00) & Heute empfohlen (12:00)
 * Nutzerquelle: Supabase prayer_push_registrations
 */

import { evaluateOneSignalDelivery } from "./onesignal-delivery.js";

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const DEFAULT_DAILY_STATUS_PATH = "content/admin/daily-push-status.json";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

const DUA_HOUR = 9;
const REC_HOUR = 12;
const SEND_WINDOW_MINUTES = 15;
const DUA_CATCHUP_UNTIL_HOUR = 14;
const REC_CATCHUP_UNTIL_HOUR = 20;
const BATCH_CHUNK_SIZE = 200;

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
  const o = siteOrigin(env);
  return {
    ...payload,
    chrome_web_icon: `${o}/notification-icon-192.png?v=2`,
    chrome_web_badge: `${o}/notification-badge-96.png?v=2`,
    firefox_icon: `${o}/notification-icon-192.png?v=2`
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
  const o = {};
  for (const p of parts) o[p.type] = p.value;
  return {
    year: +o.year,
    month: +o.month,
    day: +o.day,
    hour: +o.hour,
    minute: +o.minute
  };
}

function dayKey(date, timeZone) {
  const p = getLocalParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function dayOfYearInTz(date, timeZone) {
  const p = getLocalParts(date, timeZone);
  const start = Date.UTC(p.year, 0, 0);
  const current = Date.UTC(p.year, p.month - 1, p.day);
  return Math.floor((current - start) / 86400000);
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
  return String(config?.deliveryMode || "onesignal-timezone").trim();
}

/** OneSignal plant 09:00/12:00 – Worker sendet nur Nachhol-Pushs, keine Duplikate. */
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
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
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, json: text ? JSON.parse(text) : null };
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
    "push_opted_in"
  ].join(",");
  const query = `prayer_push_registrations?subscription_id=not.is.null&push_opted_in=eq.true&or=(daily_dua_enabled.eq.true,daily_recommendation_enabled.eq.true)&select=${select}`;
  const res = await supabaseFetch(env, query);
  if (!res.ok) {
    if (res.status === 400 && /column/i.test(res.text)) {
      throw new Error("Supabase-Spalten fehlen – bitte daily-push-schema.sql ausführen");
    }
    throw new Error(`Supabase ${res.status}: ${res.text.slice(0, 200)}`);
  }
  return (Array.isArray(res.json) ? res.json : []).filter((r) => r.subscription_id);
}

async function fetchJsonUrl(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Fetch ${res.status}: ${url}`);
  return res.json();
}

async function loadDailyConfig(env, deps = {}) {
  const origin = siteOrigin(env);
  try {
    return await fetchJsonUrl(`${origin}/content/admin/daily-push.json?v=${Date.now()}`);
  } catch (e) {
    if (deps.githubGet) {
      const owner = env.GITHUB_OWNER || "Sero91ak";
      const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
      const branch = env.GITHUB_BRANCH || "main";
      const file = await deps.githubGet(env, owner, repo, "content/admin/daily-push.json", branch);
      if (file?.content) return JSON.parse(deps.base64ToUtf8(file.content));
    }
    return {
      automatic: true,
      dailyDua: { enabled: true, hour: DUA_HOUR },
      recommendation: { enabled: true, hour: REC_HOUR }
    };
  }
}

async function loadDuas(env) {
  const origin = siteOrigin(env);
  const duas = await fetchJsonUrl(`${origin}/content/duas/duas.json`);
  return (Array.isArray(duas) ? duas : []).filter((d) => d && d.id && d.title);
}

function parseFrontMatterId(markdown, filename) {
  const text = String(markdown || "");
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (m) {
    const idLine = m[1].match(/^id:\s*["']?([^"'\n]+)["']?/m);
    if (idLine) return idLine[1].trim();
  }
  return String(filename || "").replace(/\.md$/i, "");
}

async function loadPostFiles(env) {
  const origin = siteOrigin(env);
  const index = await fetchJsonUrl(`${origin}/content/posts/posts-index.json`);
  return (Array.isArray(index?.files) ? index.files : [])
    .map((f) => (typeof f === "string" ? f : f?.name))
    .filter((n) => n && String(n).endsWith(".md"));
}

async function loadPostMeta(file, env) {
  const origin = siteOrigin(env);
  const md = await fetch(`${origin}/content/posts/${encodeURIComponent(file)}`).then((r) => r.text());
  const id = parseFrontMatterId(md, file);
  const titleMatch = md.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1].trim().replace(/^📖\s*/, "") : id;
  const category = (md.match(/^category:\s*["']?(.+?)["']?\s*$/m) || [])[1] || "";
  const scholar = (md.match(/^scholar:\s*["']?(.+?)["']?\s*$/m) || [])[1] || "";
  return { id, title, file, category, scholar, snippet: extractPostSnippet(md) };
}

function extractPostSnippet(markdown) {
  const body = String(markdown || "").replace(/^---[\s\S]*?---/, "").trim();
  const quote = (body.match(/^>\s*(.+)$/m) || [])[1] || body.split(/\n\s*\n/).find((x) => x.trim());
  return String(quote || "").replace(/^#+\s*/, "").replace(/[*_>`]/g, "").trim().slice(0, 220);
}

const DAILY_CONTENT_PATH = "content/updates/daily.json";

async function loadDailyContentFile(env, deps) {
  const origin = siteOrigin(env);
  try {
    return await fetchJsonUrl(`${origin}/${DAILY_CONTENT_PATH}?v=${Date.now()}`);
  } catch (e) {
    if (deps?.githubGet) {
      const owner = env.GITHUB_OWNER || "Sero91ak";
      const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
      const branch = env.GITHUB_BRANCH || "main";
      const file = await deps.githubGet(env, owner, repo, DAILY_CONTENT_PATH, branch);
      if (file?.content) return JSON.parse(deps.base64ToUtf8(file.content));
    }
    return null;
  }
}

async function regenerateDailyContent(env, deps, dateKey, tz) {
  const origin = siteOrigin(env);
  const doy = dayOfYearInTz(new Date(), tz);
  let recommendation = null;
  let dua = null;
  try {
    const postFiles = await loadPostFiles(env);
    if (postFiles.length) {
      const file = postFiles[Math.abs(doy * 7) % postFiles.length];
      recommendation = await loadPostMeta(file, env);
    }
  } catch (e) {}
  try {
    const pool = await fetchJsonUrl(`${origin}/content/duas/duas.json?v=${Date.now()}`);
    if (Array.isArray(pool) && pool.length) {
      const d = pool[Math.abs(doy) % pool.length];
      dua = {
        id: d.id,
        title: d.title,
        snippet: String(d.de || d.snippet || "").trim(),
        category: d.cat || ""
      };
    }
  } catch (e) {}
  if (!recommendation && !dua) return null;
  const data = {
    date: dateKey,
    timezone: tz,
    generated: new Date().toISOString(),
    source: "dar-daily-scheduler-regenerated",
    recommendation,
    dua
  };
  if (deps?.githubPut) {
    try {
      const owner = env.GITHUB_OWNER || "Sero91ak";
      const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
      const branch = env.GITHUB_BRANCH || "main";
      const existing = deps.githubGet ? await deps.githubGet(env, owner, repo, DAILY_CONTENT_PATH, branch) : null;
      await deps.githubPut(
        env,
        owner,
        repo,
        DAILY_CONTENT_PATH,
        `${JSON.stringify(data, null, 2)}\n`,
        `Daily content ${dateKey}`,
        branch,
        existing?.sha
      );
    } catch (e) {
      data.writeError = e.message || String(e);
    }
  }
  return data;
}

async function loadDailyContentForPush(env, deps, dateKey) {
  const data = await loadDailyContentFile(env, deps);
  if (!data || data.date !== dateKey) return null;
  if (!data.dua?.id && !data.recommendation?.id) return null;
  return data;
}

async function uuidFrom(seed) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  const b = new Uint8Array(hash.slice(0, 16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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

async function markSent(env, deviceId, fields) {
  if (!deviceId) return false;
  const res = await supabaseFetch(env, `prayer_push_registrations?device_id=eq.${encodeURIComponent(deviceId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ ...fields, last_synced_at: new Date().toISOString() })
  });
  return res.ok;
}

function buildDailyPushPayload(env, kind, item, config, dateKey, subscriptionIds, idSeed) {
  const isDua = kind === "dua";
  const section = isDua ? config.dailyDua : config.recommendation;
  const title = String(section?.title || (isDua ? "Duʿāʾ des Tages" : "Heute empfohlen"));
  const itemTitle = String(item.title || "").trim();
  const snippet = String(item.snippet || "").trim();
  const body = [itemTitle, snippet].filter(Boolean).join(snippet ? " – " : "") ||
    (isDua ? "Heutige Duʿāʾ aus Qurʾān & Sunnah." : "Heute empfohlener Beitrag.");
  const origin = siteOrigin(env);
  const url = isDua
    ? `${origin}/#dua/${encodeURIComponent(item.id)}`
    : `${origin}/#post/${encodeURIComponent(item.id)}`;

  return withIcons({
    app_id: String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim(),
    target_channel: "push",
    include_subscription_ids: subscriptionIds,
    headings: { de: title, en: title },
    contents: { de: body, en: body },
    url,
    isAnyWeb: true,
    idempotency_key: idSeed,
    data: {
      type: isDua ? "daily_dua" : "daily_recommendation",
      content_id: item.id,
      date: dateKey,
      source: "dar-daily-push-scheduler-batch"
    }
  }, env);
}

async function sendDailyPushBatch(env, rows, kind, item, config, dateKey, stats) {
  const isDua = kind === "dua";
  const section = isDua ? config.dailyDua : config.recommendation;
  if (section?.enabled === false || !item?.id || !rows.length) return;

  const patch = isDua
    ? { last_dua_push_date: dateKey, last_dua_content_id: item.id, daily_push_error: null }
    : { last_recommendation_push_date: dateKey, last_recommendation_content_id: item.id, daily_push_error: null };

  for (let offset = 0; offset < rows.length; offset += BATCH_CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + BATCH_CHUNK_SIZE);
    const subscriptionIds = chunk.map((row) => String(row.subscription_id)).filter(Boolean);
    if (!subscriptionIds.length) continue;

    const idSeed = await uuidFrom(`daily-${kind}-batch-${dateKey}-${offset}`);
    const payload = buildDailyPushPayload(env, kind, item, config, dateKey, subscriptionIds, idSeed);

    try {
      const result = await postOneSignal(env, payload);
      const delivery = evaluateOneSignalDelivery(result.parsed || {});
      const invalidRaw = delivery.invalidSubscriptionIds ||
        result.parsed?.errors?.invalid_subscription_ids ||
        [];
      const invalidSet = new Set((Array.isArray(invalidRaw) ? invalidRaw : []).map(String));

      await Promise.all(chunk.map(async (row) => {
        if (invalidSet.has(String(row.subscription_id))) {
          stats.errors += 1;
          await markSent(env, row.device_id, {
            daily_push_error: "Push-Gerät bei OneSignal ungültig – bitte in der App erneut aktivieren."
          });
          return;
        }
        if (delivery.delivered) {
          await markSent(env, row.device_id, patch);
          stats.sent += 1;
          return;
        }
        stats.errors += 1;
        await markSent(env, row.device_id, {
          daily_push_error: String(delivery.reason || "Push nicht zugestellt").slice(0, 240)
        });
      }));

      stats.responses.push({
        kind,
        batch: true,
        count: chunk.length,
        contentId: item.id,
        recipients: result.recipients,
        ok: delivery.delivered,
        invalid: invalidSet.size
      });
    } catch (err) {
      const msg = err.message || String(err);
      stats.errors += chunk.length;
      await Promise.all(chunk.map((row) =>
        markSent(env, row.device_id, { daily_push_error: msg.slice(0, 240) })
      ));
      stats.responses.push({ kind, batch: true, count: chunk.length, ok: false, error: msg });
    }
  }
}

export function readDailyPushStatusFromKv() {
  return lastDailyStatusReport;
}

async function writeStatusGithub(env, status, deps) {
  if (!deps?.githubPut) return;
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.DAILY_PUSH_STATUS_PATH || DEFAULT_DAILY_STATUS_PATH;
  try {
    const existing = await deps.githubGet(env, owner, repo, path, branch);
    await deps.githubPut(
      env,
      owner,
      repo,
      path,
      `${JSON.stringify(status, null, 2)}\n`,
      `Daily push ${status.updatedAt}`,
      branch,
      existing?.sha
    );
  } catch (e) {
    status.githubWriteError = e.message || String(e);
  }
}

export async function runDailyPushScheduler(env, options = {}, deps = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const stats = {
    checked: 0,
    duaCandidates: 0,
    recCandidates: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0,
    responses: []
  };

  let config;
  let rows;
  let dailyContent;
  const tzCanonical = "Europe/Berlin";
  const canonicalDateKey = dayKey(now, tzCanonical);

  try {
    [config, rows] = await Promise.all([
      loadDailyConfig(env, deps),
      loadDailyRegistrations(env)
    ]);
    dailyContent = await loadDailyContentForPush(env, deps, canonicalDateKey);
    if (!dailyContent?.dua?.id && !dailyContent?.recommendation?.id) {
      dailyContent = await regenerateDailyContent(env, deps, canonicalDateKey, tzCanonical);
    }
  } catch (err) {
    const status = {
      ok: false,
      schedulerEngine: "cloudflare-worker-daily-v3-catchup",
      deliveryMode: deliveryMode(config),
      schedulerStatus: "error",
      updatedAt: now.toISOString(),
      lastError: err.message || String(err),
      ...stats
    };
    lastDailyStatusReport = status;
    await writeStatusGithub(env, status, deps);
    return { ok: false, triggered: true, reason: status.lastError, status };
  }

  const duaItem = dailyContent?.dua?.id ? dailyContent.dua : null;
  const recItem = dailyContent?.recommendation?.id ? dailyContent.recommendation : null;

  if (!duaItem && !recItem) {
    const status = {
      ok: false,
      schedulerEngine: "cloudflare-worker-daily-v3-catchup",
      deliveryMode: deliveryMode(config),
      schedulerStatus: "warning",
      updatedAt: now.toISOString(),
      lastError: "Kein aktiver Tagesinhalt in content/updates/daily.json für heute – Push nicht gesendet (keine Zufallsauswahl)",
      dailyContentDate: dailyContent?.date || null,
      ...stats
    };
    lastDailyStatusReport = status;
    await writeStatusGithub(env, status, deps);
    return { ok: false, triggered: true, reason: status.lastError, status };
  }

  const duaQueue = [];
  const recQueue = [];

  for (const row of rows) {
    stats.checked += 1;
    const tz = String(row.timezone || "Europe/Berlin");
    const local = getLocalParts(now, tz);
    const dateKey = canonicalDateKey;

    if (row.push_opted_in === false) {
      stats.skipped += 1;
      continue;
    }

    const duaOn = row.daily_dua_enabled !== false;
    const recOn = row.daily_recommendation_enabled !== false;
    const duaHour = Number(config?.dailyDua?.hour ?? DUA_HOUR);
    const recHour = Number(config?.recommendation?.hour ?? REC_HOUR);

    const duaWindow = duaDeliveryWindow(local, duaHour, config);
    const recWindow = recDeliveryWindow(local, recHour, config);

    if (duaOn && duaItem && config?.dailyDua?.enabled !== false && duaWindow) {
      if (row.last_dua_push_date === dateKey) {
        stats.duplicates += 1;
      } else {
        stats.duaCandidates += 1;
        duaQueue.push(row);
      }
    }

    if (recOn && recItem && config?.recommendation?.enabled !== false && recWindow) {
      if (row.last_recommendation_push_date === dateKey) {
        stats.duplicates += 1;
      } else {
        stats.recCandidates += 1;
        recQueue.push(row);
      }
    }
  }

  await sendDailyPushBatch(env, duaQueue, "dua", duaItem, config, canonicalDateKey, stats);
  await sendDailyPushBatch(env, recQueue, "recommendation", recItem, config, canonicalDateKey, stats);

  const status = {
    ok: stats.errors === 0,
    schedulerEngine: "cloudflare-worker-daily-v3-catchup",
    deliveryMode: deliveryMode(config),
    schedulerStatus: stats.errors ? "error" : "success",
    updatedAt: now.toISOString(),
    usersChecked: stats.checked,
    duaCandidates: stats.duaCandidates,
    recCandidates: stats.recCandidates,
    sent: stats.sent,
    skipped: stats.skipped,
    duplicates: stats.duplicates,
    errors: stats.errors,
    dailyContentDate: dailyContent?.date || null,
    currentRecommendation: recItem ? { id: recItem.id, title: recItem.title, category: recItem.category || "", scholar: recItem.scholar || "" } : null,
    currentDua: dailyContent?.dua ? { id: dailyContent.dua.id, title: dailyContent.dua.title, category: dailyContent.dua.category || "" } : null,
    configAutomatic: config?.automatic !== false,
    responses: stats.responses.slice(0, 20)
  };

  lastDailyStatusReport = status;
  await writeStatusGithub(env, status, deps);

  return {
    ok: status.ok,
    triggered: true,
    schedulerStatus: status.schedulerStatus,
    reason: `Geprüft: ${stats.checked} · Gesendet: ${stats.sent}`,
    status
  };
}
