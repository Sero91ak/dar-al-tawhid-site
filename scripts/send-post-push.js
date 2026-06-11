#!/usr/bin/env node
/* DAR AL TAWḤID – OneSignal push for new posts (GitHub Action + manual). */

const fs = require("fs");
const path = require("path");
const {
  withNotificationIcons,
  postOneSignalNotification
} = require("./lib/onesignal-push");

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de";
const EVENT_NAME = process.env.GITHUB_EVENT_NAME || "";
const RUN_ID = process.env.GITHUB_RUN_ID || "manual";

function frontmatterValue(text, key) {
  const pattern = new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m");
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function changedPostFiles() {
  const listFile = path.join(process.cwd(), "changed-posts.txt");
  if (!fs.existsSync(listFile)) return [];

  return fs.readFileSync(listFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "manual" && line.endsWith(".md") && fs.existsSync(line));
}

function buildMessage(files) {
  const site = SITE_URL.replace(/\/$/, "");

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
    const url = postId ? `${site}/#post/${encodeURIComponent(postId)}` : `${site}/#recent`;
    return {
      title: "Neuer Beitrag online",
      message: postTitle,
      url,
      postId
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

  const payload = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    headings: { en: copy.title, de: copy.title },
    contents: { en: copy.message, de: copy.message },
    url: copy.url,
    web_url: copy.url,
    data: { url: copy.url, post_id: copy.postId || "" },
    name: `github-posts-auto-${RUN_ID}`
  }, SITE_URL);

  await sendWithFallbacks(payload);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
