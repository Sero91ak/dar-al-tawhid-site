const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const DEFAULT_POST_PUSH_LOG_PATH = "content/admin/post-push-log.json";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
const ONESIGNAL_BATCH_SIZE = 2000;

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || env.ONESIGNAL_APP_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function supabaseApiKey(env) {
  return String(env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY).trim();
}

function siteOrigin(env) {
  return String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
}

export function buildPostPushUrl(env, postId, cacheVersion) {
  const site = siteOrigin(env);
  const slug = String(postId || "").trim();
  const v = cacheVersion || Date.now();
  return `${site}/?post=${encodeURIComponent(slug)}&v=${encodeURIComponent(v)}#post/${encodeURIComponent(slug)}`;
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function chunkValues(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

async function loadPostPushSubscriptionIds(env) {
  const key = supabaseApiKey(env);
  if (!key) return [];
  const base = `${SUPABASE_URL}/rest/v1/prayer_push_registrations`;
  const queries = [
    "subscription_id=not.is.null&push_opted_in=eq.true&select=subscription_id,last_synced_at",
    "subscription_id=not.is.null&select=subscription_id,last_synced_at"
  ];

  for (const query of queries) {
    try {
      const res = await fetch(`${base}?${query}`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json"
        }
      });
      const text = await res.text();
      if (!res.ok) {
        if (res.status === 400 && query.includes("push_opted_in")) continue;
        throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
      }
      const rows = text ? JSON.parse(text) : [];
      return uniqueValues((Array.isArray(rows) ? rows : []).map((row) => row.subscription_id));
    } catch (error) {
      if (!query.includes("push_opted_in")) return [];
    }
  }

  return [];
}

export function parseOneSignalResponse(text, httpStatus) {
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (error) {
    parsed = { parseError: error.message || String(error) };
  }

  const invalidSubs = parsed.invalid_subscription_ids || parsed.invalid_player_ids || null;
  const errors = parsed.errors || null;

  return {
    httpStatus,
    notificationId: parsed.id || null,
    recipients: typeof parsed.recipients === "number" ? parsed.recipients : null,
    errors,
    invalidSubscriptions: invalidSubs,
    raw: parsed,
    text: String(text || "").slice(0, 2000)
  };
}

function describeTarget(payload) {
  if (payload.include_subscription_ids?.length) {
    const count = payload.include_subscription_ids.length;
    return count === 1
      ? `subscription:${payload.include_subscription_ids[0]}`
      : `supabase-subscriptions:${count}`;
  }
  if (payload.included_segments?.length) return `segment:${payload.included_segments[0]}`;
  if (payload.filters?.length) {
    const filter = payload.filters[0];
    return `tag:${filter.key}=${filter.value}`;
  }
  return "unknown";
}

function classifyPushFailure(httpStatus, parsed, targetLabel) {
  if (httpStatus === 401 || httpStatus === 403) return "OneSignal API-Key ungültig oder App-ID falsch";

  const errText = JSON.stringify(parsed.errors || parsed.raw?.errors || "");
  if (/segment/i.test(errText) || /not found/i.test(errText)) {
    return `Segment existiert nicht (${targetLabel})`;
  }
  if (parsed.invalidSubscriptions?.length) return "Subscription-ID ungültig";
  if (parsed.recipients === 0) return `Empfängeranzahl 0 (${targetLabel})`;
  if (httpStatus === 400) {
    return `OneSignal 400: ${parsed.text?.slice(0, 240) || errText.slice(0, 240) || "Ungültige Anfrage"}`;
  }
  if (httpStatus >= 500) return `OneSignal Serverfehler ${httpStatus}`;
  return parsed.text?.slice(0, 240) || "Unbekannter OneSignal-Fehler";
}

async function postOneSignalAttempt(env, payload) {
  const apiKey = oneSignalApiKey(env);
  if (!apiKey) {
    return {
      ok: false,
      sent: false,
      reason: "OneSignal API-Key fehlt am Worker (ONESIGNAL_API_KEY_NEW)",
      oneSignal: null,
      target: describeTarget(payload),
      authMode: null
    };
  }

  const target = describeTarget(payload);
  let lastResult = null;

  for (const authMode of ["Key", "Basic"]) {
    try {
      const res = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `${authMode} ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      const oneSignal = parseOneSignalResponse(text, res.status);
      const hasInvalidSubs = Array.isArray(oneSignal.invalidSubscriptions) && oneSignal.invalidSubscriptions.length > 0;
      const hasErrors = oneSignal.errors && (Array.isArray(oneSignal.errors) ? oneSignal.errors.length : true);
      const zeroRecipients = oneSignal.recipients === 0;
      const hasNotificationId = !!oneSignal.notificationId;
      const success = res.ok && hasNotificationId && !zeroRecipients && !hasInvalidSubs && !hasErrors;

      lastResult = {
        ok: res.ok,
        sent: success,
        httpStatus: res.status,
        authMode,
        target,
        oneSignal,
        reason: success ? "" : classifyPushFailure(res.status, oneSignal, target)
      };

      if (res.ok && success) return lastResult;
      if (res.status === 401 || res.status === 403) return lastResult;
    } catch (error) {
      lastResult = {
        ok: false,
        sent: false,
        httpStatus: 0,
        authMode,
        target,
        oneSignal: null,
        reason: error.message || String(error)
      };
    }
  }

  return lastResult || { ok: false, sent: false, reason: "OneSignal-Aufruf fehlgeschlagen", target };
}

function buildPostPushPayload(env, { postTitle, postId, filename, publishedAt, cacheVersion, test = false }) {
  const site = siteOrigin(env);
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  const title = test ? "[Test] Neuer Beitrag online" : "Neuer Beitrag online";
  const message = String(postTitle || "Neuer Beitrag").trim();
  const slug = String(postId || "").trim();
  const version = cacheVersion || Date.now();
  const url = slug ? buildPostPushUrl(env, slug, version) : `${site}/#recent`;
  const icon = `${site}/notification-icon-192.png?v=2`;
  const badge = `${site}/notification-badge-96.png?v=2`;
  const pushData = {
    type: "post",
    postId: slug,
    slug,
    filename: String(filename || "").trim(),
    url,
    publishedAt: publishedAt || new Date().toISOString(),
    cacheVersion: String(version),
    test: test || undefined
  };

  return {
    payload: {
      app_id: appId,
      target_channel: "push",
      headings: { en: title, de: title },
      contents: { en: message, de: message },
      url,
      data: pushData,
      chrome_web_icon: icon,
      chrome_web_badge: badge,
      firefox_icon: icon,
      name: test ? `admin-post-test-${Date.now()}` : `admin-publish-${Date.now()}`
    },
    pushData,
    targetUrl: url,
    appId
  };
}

function buildPostPushAttempts(basePayload, subscriptionIds, { singleSubscriptionId = "" } = {}) {
  const sid = String(singleSubscriptionId || "").trim();
  if (sid) {
    return [{ ...basePayload, include_subscription_ids: [sid] }];
  }

  const attempts = [];
  for (const ids of chunkValues(subscriptionIds, ONESIGNAL_BATCH_SIZE)) {
    attempts.push({ ...basePayload, include_subscription_ids: ids });
  }
  attempts.push(
    { ...basePayload, included_segments: ["DAR_PUSH"] },
    { ...basePayload, included_segments: ["Subscribed Users"] },
    { ...basePayload, filters: [{ field: "tag", key: "dar_push", relation: "=", value: "true" }] },
    { ...basePayload, filters: [{ field: "tag", key: "post_notifications", relation: "=", value: "true" }] }
  );
  return attempts;
}

export async function sendNewPostPush(env, options = {}) {
  const apiKey = oneSignalApiKey(env);
  if (!apiKey) {
    return {
      sent: false,
      prepared: false,
      oneSignalCalled: false,
      reason: "OneSignal API-Key fehlt am Worker (ONESIGNAL_API_KEY_NEW)"
    };
  }

  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  if (!appId) {
    return { sent: false, prepared: false, oneSignalCalled: false, reason: "OneSignal App-ID fehlt" };
  }

  const { payload: basePayload, pushData, targetUrl } = buildPostPushPayload(env, options);
  const subscriptionIds = await loadPostPushSubscriptionIds(env);
  const attempts = buildPostPushAttempts(basePayload, subscriptionIds);
  const attemptLog = [];
  let lastFailure = "Kein Empfänger gefunden – alle Zielgruppen lieferten 0 Empfänger oder Fehler";

  for (const attemptPayload of attempts) {
    const result = await postOneSignalAttempt(env, attemptPayload);
    attemptLog.push({
      target: result.target,
      httpStatus: result.httpStatus,
      authMode: result.authMode,
      sent: result.sent,
      notificationId: result.oneSignal?.notificationId || null,
      recipients: result.oneSignal?.recipients ?? null,
      errors: result.oneSignal?.errors || null,
      invalidSubscriptions: result.oneSignal?.invalidSubscriptions || null,
      reason: result.reason || ""
    });

    if (result.sent) {
      return {
        sent: true,
        prepared: true,
        oneSignalCalled: true,
        target: result.target,
        authMode: result.authMode,
        targetUrl,
        data: pushData,
        appId,
        subscriptionCount: subscriptionIds.length,
        oneSignal: result.oneSignal,
        attempts: attemptLog,
        sentAt: new Date().toISOString()
      };
    }

    if (result.reason) lastFailure = result.reason;
    if (result.httpStatus === 401 || result.httpStatus === 403) {
      return {
        sent: false,
        prepared: true,
        oneSignalCalled: true,
        reason: result.reason,
        target: result.target,
        targetUrl,
        data: pushData,
        appId,
        subscriptionCount: subscriptionIds.length,
        oneSignal: result.oneSignal,
        attempts: attemptLog
      };
    }
  }

  return {
    sent: false,
    prepared: true,
    oneSignalCalled: true,
    reason: lastFailure,
    targetUrl,
    data: pushData,
    appId,
    subscriptionCount: subscriptionIds.length,
    attempts: attemptLog,
    oneSignal: attemptLog.length ? { httpStatus: attemptLog[attemptLog.length - 1].httpStatus, recipients: 0 } : null
  };
}

export async function sendPostPushTest(env, input = {}) {
  const subscriptionId = String(input.subscriptionId || input.subscription_id || "").trim();
  if (!subscriptionId) {
    return {
      ok: true,
      sent: false,
      reason: "Keine gültige Subscription-ID für dieses Gerät gefunden. Push neu aktivieren."
    };
  }

  const postTitle = String(input.postTitle || input.title || "Test-Beitrag").trim();
  const postId = String(input.postId || "test-post-push").trim();
  const filename = String(input.filename || "test-post.md").trim();
  const { payload: basePayload, pushData, targetUrl, appId } = buildPostPushPayload(env, {
    postTitle,
    postId,
    filename,
    publishedAt: new Date().toISOString(),
    cacheVersion: Date.now(),
    test: true
  });

  const attemptPayload = { ...basePayload, include_subscription_ids: [subscriptionId] };
  const result = await postOneSignalAttempt(env, attemptPayload);

  const response = {
    ok: true,
    sent: result.sent,
    subscriptionId,
    postTitle,
    postId,
    targetUrl,
    target: result.target,
    filter: `include_subscription_ids:[${subscriptionId}]`,
    segment: null,
    appId,
    sentAt: new Date().toISOString(),
    oneSignal: result.oneSignal,
    reason: result.sent ? "" : (result.reason || "OneSignal-Test fehlgeschlagen")
  };

  return response;
}

function postPushLogPath(env) {
  return String(env.POST_PUSH_LOG_PATH || DEFAULT_POST_PUSH_LOG_PATH).replace(/^\/+/, "");
}

export async function readPostPushLog(env, githubGet, base64ToUtf8) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = postPushLogPath(env);
  try {
    const file = await githubGet(env, owner, repo, path, branch);
    if (!file?.content) return { version: 1, lastPostPush: null, lastTestPush: null, history: [] };
    const data = JSON.parse(base64ToUtf8(file.content));
    return { ...data, sha: file.sha };
  } catch (error) {
    return { version: 1, lastPostPush: null, lastTestPush: null, history: [], error: error.message || String(error) };
  }
}

export async function appendPostPushLog(env, entry, { githubGet, githubPut, base64ToUtf8 }) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = postPushLogPath(env);
  const current = await readPostPushLog(env, githubGet, base64ToUtf8);
  const history = Array.isArray(current.history) ? [...current.history] : [];
  const stamped = { ...entry, loggedAt: new Date().toISOString() };
  history.unshift(stamped);
  const payload = {
    version: 1,
    generated: new Date().toISOString(),
    lastPostPush: entry.kind === "post" ? stamped : (current.lastPostPush || null),
    lastTestPush: entry.kind === "test" ? stamped : (current.lastTestPush || null),
    history: history.slice(0, 30)
  };
  await githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Update post push log (${entry.kind || "entry"})`,
    branch,
    current.sha
  );
  return payload;
}
