#!/usr/bin/env node
/* DAR AL TAWḤID – OneSignal push for new posts (GitHub Action + manual). */

const fs = require("fs");
const path = require("path");
const {
  withNotificationIcons,
  postOneSignalNotification,
  siteOriginFromEnv
} = require("./lib/onesignal-push");

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_API_KEY_NEW || process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
const EVENT_NAME = process.env.GITHUB_EVENT_NAME || "";
const RUN_ID = process.env.GITHUB_RUN_ID || "manual";
const POSTS_DIR = process.env.POSTS_DIR || "content/posts";
const LIVE_CHECK_SCHEDULE_MS = [0, 10000, 30000, 60000, 120000, 180000, 240000, 300000];
const ONESIGNAL_BATCH_SIZE = 2000;

function frontmatterValue(text, key) {
  const pattern = new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m");
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function buildPostPushUrl(postId, cacheVersion) {
  const site = siteOriginFromEnv(SITE_URL);
  const slug = String(postId || "").trim();
  const v = cacheVersion || Date.now();
  return `${site}/?post=${encodeURIComponent(slug)}&v=${encodeURIComponent(v)}#post/${encodeURIComponent(slug)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

async function fetchRegisteredSubscriptionIds() {
  const key = String(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || "").trim();
  if (!SUPABASE_URL || !key) return [];
  const base = `${String(SUPABASE_URL).replace(/\/$/, "")}/rest/v1/prayer_push_registrations`;
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
    } catch (err) {
      console.warn("Supabase Subscription-Liste nicht lesbar:", err.message || err);
      if (!query.includes("push_opted_in")) return [];
    }
  }
  return [];
}

function changedPostFiles() {
  const listFile = path.join(process.cwd(), "changed-posts.txt");
  if (!fs.existsSync(listFile)) return [];

  return fs.readFileSync(listFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "manual" && line.endsWith(".md") && fs.existsSync(line));
}

function diagnoseLiveFailure(steps) {
  if (!steps.indexFoundPublic) return "Indexdatei öffentlich nicht gefunden – Cloudflare Deployment evtl. noch nicht fertig.";
  if (!steps.postInIndex) return "Beitrag ist nicht im öffentlichen Index enthalten.";
  if (!steps.postFilePublic) return "Beitrag-Datei öffentlich nicht erreichbar – evtl. alte Cache-Version.";
  if (!steps.visitorUrlOk) return "Besucher-URL (?post=…) noch nicht erreichbar.";
  return "Beitrag noch nicht live erreichbar.";
}

async function fetchLiveResources({ filename, postId }) {
  const site = siteOriginFromEnv(SITE_URL);
  const bust = Date.now();
  const postPath = `${POSTS_DIR}/${filename}`;
  const result = {
    indexFoundPublic: false,
    postInIndex: false,
    postFilePublic: false,
    visitorUrlOk: false,
    visitorUrl: postId ? buildPostPushUrl(postId, bust) : null
  };

  try {
    const indexRes = await fetch(`${site}/${POSTS_DIR}/posts-index.json?v=${bust}`, { cache: "no-store" });
    if (indexRes.ok) {
      result.indexFoundPublic = true;
      const indexData = await indexRes.json();
      const files = Array.isArray(indexData.files) ? indexData.files : [];
      result.postInIndex = files.some((file) => file && (file.name === filename || String(file.name).replace(/\.md$/, "") === String(postId)));
    } else {
      result.indexHttpStatus = indexRes.status;
    }
  } catch (err) {
    result.indexError = err.message || String(err);
  }

  try {
    const postRes = await fetch(`${site}/${postPath}?v=${bust}`, { cache: "no-store" });
    result.postFilePublic = postRes.ok;
    if (!postRes.ok) result.postHttpStatus = postRes.status;
  } catch (err) {
    result.postError = err.message || String(err);
  }

  if (result.visitorUrl) {
    try {
      const navRes = await fetch(result.visitorUrl.split("#")[0], { cache: "no-store", redirect: "follow" });
      result.visitorUrlOk = navRes.ok;
    } catch (err) {
      result.visitorError = err.message || String(err);
    }
  }

  return result;
}

async function verifyPostLive({ filename, postId }) {
  let lastResult = null;
  let elapsed = 0;

  for (let i = 0; i < LIVE_CHECK_SCHEDULE_MS.length; i++) {
    const target = LIVE_CHECK_SCHEDULE_MS[i];
    const waitMs = target - elapsed;
    if (waitMs > 0) await sleep(waitMs);
    elapsed = target;

    const live = await fetchLiveResources({ filename, postId });
    const steps = {
      indexFoundPublic: live.indexFoundPublic,
      postInIndex: live.postInIndex,
      postFilePublic: live.postFilePublic,
      visitorUrlOk: live.visitorUrlOk
    };
    const ok = steps.indexFoundPublic && steps.postInIndex && steps.postFilePublic;
    lastResult = {
      ok,
      steps,
      indexOk: steps.postInIndex,
      postOk: steps.postFilePublic,
      attempts: i + 1,
      diagnosis: ok ? "" : diagnoseLiveFailure(steps),
      ...live
    };
    if (ok) return lastResult;
  }

  return lastResult;
}

function buildMessage(files) {
  const site = siteOriginFromEnv(SITE_URL);

  if (EVENT_NAME === "workflow_dispatch") {
    return {
      title: "Test-Push",
      message: "DAR AL TAWḤID Push funktioniert.",
      url: `${site}/#recent`
    };
  }

  if (files.length === 1) {
    const text = fs.readFileSync(files[0], "utf8");
    const postTitle = frontmatterValue(text, "title") || "Neuer Beitrag";
    const postId = frontmatterValue(text, "id");
    const filename = path.basename(files[0]);
    const cacheVersion = Date.now();
    return {
      title: "Neuer Beitrag online",
      message: postTitle,
      postId,
      filename,
      publishedAt: frontmatterValue(text, "date") || new Date().toISOString(),
      cacheVersion,
      url: postId ? buildPostPushUrl(postId, cacheVersion) : `${site}/#recent`
    };
  }

  if (files.length > 1) {
    return {
      title: "Neue Beiträge online",
      message: `${files.length} neue Beiträge auf DAR AL TAWḤID verfügbar.`,
      url: `${site}/#recent`
    };
  }

  return null;
}

async function sendWithFallbacks(basePayload) {
  if (!API_KEY) {
    throw new Error("OneSignal API-Key fehlt (ONESIGNAL_API_KEY_NEW / ONESIGNAL_API_KEY / ONESIGNAL_APP_API_KEY)");
  }

  const subscriptionIds = await fetchRegisteredSubscriptionIds();
  const attempts = [
    ...chunk(subscriptionIds, ONESIGNAL_BATCH_SIZE).map((ids) => ({
      ...basePayload,
      include_subscription_ids: ids
    })),
    { ...basePayload, included_segments: ["DAR_PUSH"] },
    { ...basePayload, included_segments: ["Subscribed Users"] },
    {
      ...basePayload,
      filters: [{ field: "tag", key: "dar_push", relation: "=", value: "true" }]
    },
    {
      ...basePayload,
      filters: [{ field: "tag", key: "post_notifications", relation: "=", value: "true" }]
    }
  ];

  let lastError = null;

  for (const payload of attempts) {
    try {
      const result = await postOneSignalNotification(payload, API_KEY, { retries: 2 });
      const target = payload.include_subscription_ids ? `supabase-subscriptions:${payload.include_subscription_ids.length}` : (payload.included_segments?.[0] || "tag-filter");
      console.log(`Post-Push gesendet (${target}):`, result.text);
      return result;
    } catch (err) {
      lastError = err;
      console.warn("Post-Push Versuch fehlgeschlagen:", err.message || err);
    }
  }

  throw lastError || new Error("Post-Push fehlgeschlagen");
}

(async function main() {
  const files = changedPostFiles();
  const copy = buildMessage(files);

  if (!copy) {
    console.log("Keine neuen Markdown-Beiträge erkannt. Keine Push gesendet.");
    return;
  }

  if (copy.postId && copy.filename) {
    console.log("Warte auf Live-Verfügbarkeit (bis zu 5 Minuten) …");
    const live = await verifyPostLive({ filename: copy.filename, postId: copy.postId });
    if (!live.ok) {
      console.warn("Beitrag nach Wartezeit noch nicht live erreichbar.");
      console.warn("Diagnose:", live.diagnosis || "unbekannt");
      console.warn("Schritte:", JSON.stringify(live.steps || {}, null, 2));
      console.warn("Der Cloudflare Worker speichert den Push als pending und versucht automatisch nachzusenden.");
      console.warn("Alternativ in der Admin-App: „Live erneut prüfen & Push senden“.");
      return;
    }
    console.log("Live-Prüfung erfolgreich:", JSON.stringify(live, null, 2));
  }

  const pushData = copy.postId ? {
    type: "post",
    postId: copy.postId,
    slug: copy.postId,
    filename: copy.filename,
    url: copy.url,
    publishedAt: copy.publishedAt || new Date().toISOString(),
    cacheVersion: String(copy.cacheVersion || Date.now())
  } : undefined;

  const payload = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    headings: { en: copy.title, de: copy.title },
    contents: { en: copy.message, de: copy.message },
    url: copy.url,
    data: pushData,
    name: `github-posts-auto-${RUN_ID}`
  }, SITE_URL);

  await sendWithFallbacks(payload);
})().catch((err) => {
  console.error("OneSignal Fehler:", err.message || err);
  process.exit(1);
});
