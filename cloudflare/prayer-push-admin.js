import {
  runPrayerPushScheduler,
  readPrayerPushStatusFromKv
} from "./prayer-push-scheduler.js";
import { pickPrayerEntryVariant, buildAdvancePushBody } from "./prayer-push-copy.js";
import { evaluateOneSignalDelivery } from "./onesignal-delivery.js";

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de/#prayer";
const DEFAULT_PRAYER_STATUS_PATH = "content/admin/prayer-push-status.json";

const PRAYER_NAMES = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "ʿAṣr",
  maghrib: "Maghrib",
  isha: "ʿIshāʾ",
  tahajjud: "Taḥajjud"
};

export function buildPrayerTestCopy(prayerKey, mode, advanceMinutes = 15) {
  const key = String(prayerKey || "maghrib").toLowerCase();
  const name = PRAYER_NAMES[key] || "Maghrib";
  const minutes = [5, 10, 15].includes(Number(advanceMinutes)) ? Number(advanceMinutes) : 15;
  const timeLabel = "21:46";
  if (mode === "advance") {
    const title = key === "tahajjud" ? `Taḥajjud in ${minutes} Min` : `${name} in ${minutes} Min`;
    return { title: `[Test] ${title}`, body: buildAdvancePushBody(key, minutes, timeLabel), key, mode };
  }
  const variant = pickPrayerEntryVariant(key, timeLabel);
  return { title: `[Test] ${variant.title}`, body: variant.body, key, mode };
}

export async function readPrayerPushStatus(env, githubGet, base64ToUtf8) {
  const cached = readPrayerPushStatusFromKv();
  if (cached?.updatedAt) {
    return { ok: true, status: cached, source: "worker" };
  }

  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const statusPath = env.PRAYER_STATUS_PATH || DEFAULT_PRAYER_STATUS_PATH;
  try {
    const file = await githubGet(env, owner, repo, statusPath, branch);
    if (!file?.content) return { ok: false, error: "Status-Datei fehlt" };
    const status = JSON.parse(base64ToUtf8(file.content));
    if (!status?.updatedAt) {
      return { ok: false, error: "Noch kein Scheduler-Lauf gespeichert", status: null };
    }
    return { ok: true, status, source: "github" };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

async function postOneSignal(env, payload) {
  const apiKey = String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
  if (!apiKey) throw new Error("OneSignal API Key fehlt am Worker");

  let lastError = "Unbekannter Fehler";
  for (const authMode of ["Key", "Basic"]) {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `${authMode} ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    if (res.ok) {
      let parsed = {};
      try { parsed = text ? JSON.parse(text) : {}; } catch (e) {}
      return { ok: true, status: res.status, text, parsed, recipients: parsed.recipients || parsed.id || null };
    }
    lastError = `OneSignal ${res.status} (${authMode}): ${text}`;
  }
  throw new Error(lastError);
}

export async function sendPrayerTestPush(env, input = {}) {
  const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
  if (!subscriptionId) {
    return { ok: true, sent: false, reason: "Subscription-ID fehlt" };
  }

  const prayerKey = String(input.prayer || input.prayerKey || "maghrib").toLowerCase();
  const mode = String(input.mode || "entry").toLowerCase() === "advance" ? "advance" : "entry";
  const advanceMinutes = Number(input.advanceMinutes || 15);
  const copy = buildPrayerTestCopy(prayerKey, mode, advanceMinutes);
  const site = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  const icon = `${site}/notification-icon-192.png?v=2`;
  const badge = `${site}/notification-badge-96.png?v=2`;

  const payload = {
    app_id: appId,
    target_channel: "push",
    include_subscription_ids: [subscriptionId],
    headings: { de: copy.title, en: copy.title },
    contents: { de: copy.body, en: copy.body },
    url: `${site}/#prayer`,
    data: { type: "prayer-test", prayer: prayerKey, mode, test: true },
    chrome_web_icon: icon,
    chrome_web_badge: badge,
    firefox_icon: icon,
    name: `prayer-test-${prayerKey}-${mode}-${Date.now()}`
  };

  try {
    const result = await postOneSignal(env, payload);
    const delivery = evaluateOneSignalDelivery(result.parsed);
    return {
      ok: true,
      sent: delivery.delivered,
      delivered: delivery.delivered,
      prayer: prayerKey,
      mode,
      title: copy.title,
      body: copy.body,
      subscriptionId,
      notificationId: delivery.notificationId || null,
      reason: delivery.reason || null,
      oneSignal: result
    };
  } catch (err) {
    return {
      ok: true,
      sent: false,
      delivered: false,
      prayer: prayerKey,
      mode,
      subscriptionId,
      reason: err.message || String(err)
    };
  }
}

function schedulerDeps(githubGet, githubPut, base64ToUtf8, utf8ToBase64) {
  return { githubGet, githubPut, base64ToUtf8, utf8ToBase64 };
}

export async function triggerPrayerWorkflowForSubscription(env, subscriptionId, deps = {}) {
  const sid = String(subscriptionId || "").trim();
  if (!sid) return { triggered: false, reason: "Subscription-ID fehlt" };

  const result = await runPrayerPushScheduler(
    env,
    { subscriptionId: sid, force: true },
    schedulerDeps(deps.githubGet, deps.githubPut, deps.base64ToUtf8, deps.utf8ToBase64)
  );

  return {
    triggered: result.triggered,
    ok: result.ok,
    schedulerStatus: result.schedulerStatus,
    reason: result.reason,
    scheduled: result.scheduled,
    recipients: result.recipients,
    usersWithLocation: result.usersWithLocation,
    status: result.status
  };
}

export async function runPrayerSchedulerNow(env, deps = {}, options = {}) {
  return runPrayerPushScheduler(
    env,
    { force: Boolean(options.force), subscriptionId: options.subscriptionId || "" },
    schedulerDeps(deps.githubGet, deps.githubPut, deps.base64ToUtf8, deps.utf8ToBase64)
  );
}

export async function ensurePrayerSchedulerFresh(env, githubGet, base64ToUtf8, githubPut, utf8ToBase64, options = {}) {
  if (options.force) {
    return runPrayerSchedulerNow(env, { githubGet, githubPut, base64ToUtf8, utf8ToBase64 }, { force: true });
  }

  return runPrayerSchedulerNow(env, { githubGet, githubPut, base64ToUtf8, utf8ToBase64 }, { force: true });
}
