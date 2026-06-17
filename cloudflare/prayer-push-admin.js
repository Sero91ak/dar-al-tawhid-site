import {
  runPrayerPushScheduler,
  readPrayerPushStatusFromKv
} from "./prayer-push-scheduler.js";

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

const PRAYER_MESSAGES = {
  default: [
    "Das Gebet zu seiner Zeit gehört zu den liebsten Taten bei Allah.",
    "Nimm dir jetzt bewusst Zeit für dein Gebet.",
    "Bewahre dein Gebet und erinnere dich an Allah."
  ],
  fajr: [
    "Beginne deinen Tag mit dem Gebet und dem Gedenken an Allah.",
    "Der Tag beginnt mit einer großen Gelegenheit zum Gebet."
  ],
  dhuhr: [
    "Halte am Mittagsgebet fest und ordne deinen Tag um Allah.",
    "Das Gebet zu seiner Zeit gehört zu den liebsten Taten bei Allah."
  ],
  asr: [
    "Bewahre dieses Gebet – verliere nicht deine gewaltige Gelegenheit.",
    "Achte besonders auf dieses Gebet."
  ],
  maghrib: [
    "Schließe den Tagabschnitt mit Gehorsam gegenüber Allah ab.",
    "Nimm dir jetzt bewusst Zeit für dein Gebet."
  ],
  isha: [
    "Schließe deinen Tag mit Gehorsam gegenüber Allah ab.",
    "Beende den Tag mit Gebet und Ruhe."
  ],
  tahajjud: [
    "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah.",
    "Nutze die Stille der Nacht für Bittgebet und Nähe zu Allah."
  ]
};

function pickPrayerMessage(key, seed = "") {
  const list = PRAYER_MESSAGES[key] || PRAYER_MESSAGES.default;
  let hash = 0;
  const text = `${key}-${seed}-${new Date().toISOString().slice(0, 10)}`;
  for (let i = 0; i < text.length; i++) hash = (hash + text.charCodeAt(i)) % 9973;
  return list[hash % list.length];
}

export function buildPrayerTestCopy(prayerKey, mode, advanceMinutes = 15) {
  const key = String(prayerKey || "maghrib").toLowerCase();
  const name = PRAYER_NAMES[key] || "Maghrib";
  const minutes = [5, 10, 15].includes(Number(advanceMinutes)) ? Number(advanceMinutes) : 15;
  const timeLabel = "21:46";
  const title = mode === "advance"
    ? (key === "tahajjud" ? `Taḥajjud in ${minutes} Min` : `${name} in ${minutes} Min`)
    : (key === "tahajjud" ? "Taḥajjud-Erinnerung" : `${name} ist eingetreten`);
  const body = mode === "advance"
    ? (key === "tahajjud" ? "Taḥajjud-Erinnerung ist bald." : `In ${minutes} Min · ${timeLabel} Uhr.`)
    : pickPrayerMessage(key, mode);
  return { title: `[Test] ${title}`, body, key, mode };
}

export async function readPrayerPushStatus(env, githubGet, base64ToUtf8) {
  const kvStatus = await readPrayerPushStatusFromKv(env);
  if (kvStatus?.updatedAt) {
    return { ok: true, status: kvStatus, source: "kv" };
  }

  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const statusPath = env.PRAYER_STATUS_PATH || DEFAULT_PRAYER_STATUS_PATH;
  try {
    const file = await githubGet(env, owner, repo, statusPath, branch);
    if (!file?.content) return { ok: false, error: "Status-Datei fehlt" };
    return { ok: true, status: JSON.parse(base64ToUtf8(file.content)), source: "github" };
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
    return {
      ok: true,
      sent: true,
      prayer: prayerKey,
      mode,
      title: copy.title,
      body: copy.body,
      subscriptionId,
      oneSignal: result
    };
  } catch (err) {
    return {
      ok: true,
      sent: false,
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
