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
const EVENT_NAME = process.env.GITHUB_EVENT_NAME || "";
const RUN_ID = process.env.GITHUB_RUN_ID || "manual";
const POSTS_DIR = process.env.POSTS_DIR || "content/posts";

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

function changedPostFiles() {
  const listFile = path.join(process.cwd(), "changed-posts.txt");
  if (!fs.existsSync(listFile)) return [];

  return fs.readFileSync(listFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "manual" && line.endsWith(".md") && fs.existsSync(line));
}

async function verifyPostLive({ filename, postId }) {
  const site = siteOriginFromEnv(SITE_URL);
  const maxAttempts = 8;
  const delayMs = 2000;
  const result = { ok: false, indexOk: false, postOk: false, attempts: 0 };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    result.attempts = attempt;
    const bust = Date.now();

    try {
      const indexRes = await fetch(`${site}/${POSTS_DIR}/posts-index.json?v=${bust}`, { cache: "no-store" });
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        const files = Array.isArray(indexData.files) ? indexData.files : [];
        result.indexOk = files.some((file) => file && (file.name === filename || String(file.name).replace(/\.md$/, "") === String(postId)));
      }
    } catch (err) {
      result.indexError = err.message || String(err);
    }

    try {
      const postPath = `${POSTS_DIR}/${encodeURIComponent(filename)}`;
      const postRes = await fetch(`${site}/${postPath}?v=${bust}`, { cache: "no-store" });
      result.postOk = postRes.ok;
    } catch (err) {
      result.postError = err.message || String(err);
    }

    if (result.indexOk && result.postOk) {
      result.ok = true;
      return result;
    }

    if (attempt < maxAttempts) await sleep(delayMs);
  }

  return result;
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
  const attempts = [
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
      console.log(`Post-Push gesendet (${payload.included_segments?.[0] || "tag-filter"}):`, result.text);
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
    const live = await verifyPostLive({ filename: copy.filename, postId: copy.postId });
    if (!live.ok) {
      console.error("Beitrag noch nicht live erreichbar. Push wurde nicht gesendet.", live);
      process.exit(1);
    }
    console.log("Live-Prüfung erfolgreich:", live);
  }

  const pushData = copy.postId ? {
    type: "post",
    postId: copy.postId,
    slug: copy.postId,
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
  console.error(err.message || err);
  process.exit(1);
});
