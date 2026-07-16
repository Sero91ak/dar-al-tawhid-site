import {
  runDailyPushScheduler,
  readDailyPushStatusFromKv
} from "./daily-push-scheduler.js";
import { evaluateOneSignalDelivery } from "./onesignal-delivery.js";

const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const DEFAULT_DAILY_STATUS_PATH = "content/admin/daily-push-status.json";
const DEFAULT_DAILY_CONFIG_PATH = "content/admin/daily-push.json";

export async function readDailyPushStatus(env, githubGet, base64ToUtf8) {
  const cached = readDailyPushStatusFromKv();
  if (cached?.updatedAt) {
    return { ok: true, status: cached, source: "worker" };
  }
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const statusPath = env.DAILY_PUSH_STATUS_PATH || DEFAULT_DAILY_STATUS_PATH;
  try {
    const file = await githubGet(env, owner, repo, statusPath, branch);
    if (!file?.content) return { ok: false, error: "Status-Datei fehlt" };
    const status = JSON.parse(base64ToUtf8(file.content));
    return status?.updatedAt ? { ok: true, status, source: "github" } : { ok: false, error: "Noch kein Lauf" };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

export async function readDailyPushConfig(env, githubGet, base64ToUtf8) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.DAILY_PUSH_CONFIG_PATH || DEFAULT_DAILY_CONFIG_PATH;
  try {
    const file = await githubGet(env, owner, repo, path, branch);
    if (!file?.content) return { ok: false, config: null, sha: null };
    return { ok: true, config: JSON.parse(base64ToUtf8(file.content)), sha: file.sha };
  } catch (err) {
    return { ok: false, error: err.message || String(err), config: null, sha: null };
  }
}

export async function saveDailyPushConfig(env, config, sha, githubPut, utf8ToBase64) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = env.DAILY_PUSH_CONFIG_PATH || DEFAULT_DAILY_CONFIG_PATH;
  await githubPut(
    env,
    owner,
    repo,
    path,
    JSON.stringify(config, null, 2) + "\n",
    `Admin: tägliche Push-Konfiguration ${new Date().toISOString()}`,
    branch,
    sha || undefined
  );
  return { ok: true };
}

function schedulerDeps(githubGet, githubPut, base64ToUtf8, utf8ToBase64) {
  return { githubGet, githubPut, base64ToUtf8, utf8ToBase64 };
}

export async function runDailySchedulerNow(env, deps = {}, options = {}) {
  return runDailyPushScheduler(
    env,
    { now: options.now, subscriptionId: options.subscriptionId || "" },
    schedulerDeps(deps.githubGet, deps.githubPut, deps.base64ToUtf8, deps.utf8ToBase64)
  );
}

export async function ensureDailyPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, options = {}) {
  return runDailySchedulerNow(
    env,
    { githubGet, githubPut, base64ToUtf8, utf8ToBase64 },
    { force: Boolean(options?.force), now: options?.now }
  );
}

async function postOneSignal(env, payload) {
  const apiKey = String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
  if (!apiKey) throw new Error("OneSignal API Key fehlt");
  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OneSignal ${res.status}: ${text.slice(0, 240)}`);
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch (e) {}
  return { text, parsed, recipients: parsed.recipients ?? parsed.id ?? null };
}

export async function sendWelcomePush(env, input = {}) {
  const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
  if (!subscriptionId) return { ok: true, sent: false, reason: "Subscription-ID fehlt" };

  const site = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
  const appId = String(env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e").trim();
  const title = "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh";
  const body = "Willkommen bei DAR AL TAWḤID. Du erhältst neue Beiträge aus Qurʾān, Sunnah und Āthār direkt als Benachrichtigung.";
  const url = `${site}/#home`;

  const payload = {
    app_id: appId,
    target_channel: "push",
    include_subscription_ids: [subscriptionId],
    headings: { de: title, en: title },
    contents: { de: body, en: body },
    url,
    data: { type: "welcome", source: "dar-welcome-push" },
    chrome_web_icon: `${site}/notification-icon-192.png?v=2`,
    chrome_web_badge: `${site}/notification-badge-96.png?v=2`
  };

  try {
    const result = await postOneSignal(env, payload);
    const delivery = evaluateOneSignalDelivery(result.parsed);
    return {
      ok: true,
      sent: delivery.delivered,
      delivered: delivery.delivered,
      subscriptionId,
      notificationId: delivery.notificationId || null,
      reason: delivery.reason || null,
      oneSignal: result
    };
  } catch (err) {
    return { ok: true, sent: false, delivered: false, subscriptionId, reason: err.message || String(err) };
  }
}

export async function sendDailyTestPush(env, input = {}) {
  const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
  const kind = String(input.kind || "dua").toLowerCase() === "recommendation" ? "recommendation" : "dua";
  if (!subscriptionId) return { ok: true, sent: false, reason: "Subscription-ID fehlt" };

  const site = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
  const appId = String(env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e").trim();
  const isDua = kind === "dua";
  const title = isDua ? "Duʿāʾ des Tages" : "Heute empfohlen";

  let daily = null;
  try {
    const res = await fetch(`${site}/content/updates/daily.json?v=${Date.now()}`, { headers: { Accept: "application/json" } });
    if (res.ok) daily = await res.json();
  } catch (e) {}
  const item = isDua ? daily?.dua : daily?.recommendation;
  if (!item || !item.id) {
    return { ok: true, sent: false, kind, subscriptionId, reason: "Kein aktiver Tagesinhalt gefunden – Push nicht gesendet" };
  }

  const itemTitle = String(item.title || "").trim();
  const snippet = String(item.snippet || "").trim();
  const body = [itemTitle, snippet].filter(Boolean).join(snippet ? " – " : "") ||
    (isDua ? "Heutige Duʿāʾ aus Qurʾān & Sunnah." : "Heute empfohlener Beitrag.");
  const url = isDua
    ? `${site}/#dua/${encodeURIComponent(item.id)}`
    : `${site}/#post/${encodeURIComponent(item.id)}`;

  const payload = {
    app_id: appId,
    target_channel: "push",
    include_subscription_ids: [subscriptionId],
    headings: { de: `[Test] ${title}`, en: `[Test] ${title}` },
    contents: { de: body, en: body },
    url,
    data: {
      type: isDua ? "daily_dua" : "daily_recommendation",
      content_id: item.id,
      date: daily?.date || "",
      test: true,
      source: "admin-test"
    },
    chrome_web_icon: `${site}/notification-icon-192.png?v=2`,
    chrome_web_badge: `${site}/notification-badge-96.png?v=2`
  };

  try {
    const result = await postOneSignal(env, payload);
    const delivery = evaluateOneSignalDelivery(result.parsed);
    return {
      ok: true,
      sent: delivery.delivered,
      delivered: delivery.delivered,
      kind,
      subscriptionId,
      notificationId: delivery.notificationId || null,
      reason: delivery.reason || null,
      oneSignal: result
    };
  } catch (err) {
    return { ok: true, sent: false, delivered: false, kind, subscriptionId, reason: err.message || String(err) };
  }
}

export function buildDailyPushPreview(config, kind) {
  const isDua = kind === "dua";
  const section = isDua ? config?.dailyDua : config?.recommendation;
  return {
    title: section?.title || (isDua ? "Duʿāʾ des Tages" : "Heute empfohlen"),
    body:
      section?.body ||
      (isDua
        ? "Eine kurze Erinnerung aus Qurʾān & Sunnah – öffne die App und lies die heutige Duʿāʾ."
        : "Ein ausgewählter Beitrag für dich – Wissen aus Qurʾān, Sunnah und den Āthār."),
    hour: Number(section?.hour || (isDua ? 9 : 12)),
    id: section?.id || "",
    enabled: section?.enabled !== false
  };
}
