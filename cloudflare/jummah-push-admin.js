import {
  runJummahPushScheduler,
  readJummahPushStatusFromKv
} from "./jummah-push-scheduler.js";
import { jummahCopyForMode } from "./jummah-push-copy.js";
import { evaluateOneSignalDelivery } from "./onesignal-delivery.js";

const DEFAULT_SITE_URL = "https://dar-al-tawhid.de/#prayer";
const DEFAULT_JUMMAH_STATUS_PATH = "content/admin/jummah-push-status.json";
const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";

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

export async function readJummahPushStatus(env, githubGet, base64ToUtf8) {
  const cached = readJummahPushStatusFromKv();
  if (cached?.updatedAt) {
    return { ok: true, status: cached, source: "worker" };
  }
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const statusPath = env.JUMMAH_STATUS_PATH || DEFAULT_JUMMAH_STATUS_PATH;
  try {
    const file = await githubGet(env, owner, repo, statusPath, branch);
    if (!file?.content) return { ok: false, error: "Jumuʿah-Status-Datei fehlt" };
    const status = JSON.parse(base64ToUtf8(file.content));
    return status?.updatedAt ? { ok: true, status, source: "github" } : { ok: false, error: "Noch kein Jumuʿah-Lauf" };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

function schedulerDeps(githubGet, githubPut, base64ToUtf8, utf8ToBase64) {
  return { githubGet, githubPut, base64ToUtf8, utf8ToBase64 };
}

export async function runJummahSchedulerNow(env, deps = {}, options = {}) {
  return runJummahPushScheduler(
    env,
    {
      subscriptionId: options.subscriptionId || "",
      dryRun: Boolean(options.dryRun)
    },
    schedulerDeps(deps.githubGet, deps.githubPut, deps.base64ToUtf8, deps.utf8ToBase64)
  );
}

export async function ensureJummahPushSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, options = {}) {
  return runJummahSchedulerNow(
    env,
    { githubGet, githubPut, base64ToUtf8, utf8ToBase64 },
    { force: Boolean(options?.force), subscriptionId: options.subscriptionId || "", dryRun: Boolean(options?.dryRun) }
  );
}

export async function sendJummahTestPush(env, input = {}) {
  const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
  const mode = String(input.mode || "entry").toLowerCase();
  const key = oneSignalApiKey(env);
  if (!key) return { sent: false, error: "OneSignal API Key fehlt" };
  if (!subscriptionId) return { sent: false, error: "subscriptionId fehlt" };

  const copy = jummahCopyForMode(["morning", "advance", "entry"].includes(mode) ? mode : "entry");
  const body = withIcons({
    app_id: String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim(),
    target_channel: "push",
    include_subscription_ids: [subscriptionId],
    headings: { de: copy.title, en: copy.title },
    contents: { de: copy.body, en: copy.body },
    url: String(env.SITE_URL || DEFAULT_SITE_URL),
    isAnyWeb: true,
    data: { type: "jummah-test", mode, test: true }
  }, env);

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${key}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    return { sent: false, error: `OneSignal ${res.status}: ${text.slice(0, 240)}`, mode };
  }
  let parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch (e) {}
  const delivery = evaluateOneSignalDelivery(parsed);
  return {
    sent: delivery.delivered,
    delivered: delivery.delivered,
    mode,
    notificationId: delivery.notificationId || null,
    reason: delivery.reason || null,
    recipients: parsed.recipients ?? (delivery.delivered ? 1 : 0),
    response: text.slice(0, 200)
  };
}
