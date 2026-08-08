#!/usr/bin/env node
/* DAR AL TAWḤĪD – OneSignal broadcast für Propheten 72h-Fokus (live Besucher). */

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
const RUN_ID = process.env.GITHUB_RUN_ID || "manual";
const TRIGGER = path.join(__dirname, "..", "content", "admin", "push-triggers", "prophets-fokus-live.json");

function readTrigger() {
  try {
    return JSON.parse(fs.readFileSync(TRIGGER, "utf8"));
  } catch (e) {
    return {};
  }
}

function newsPushBody(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Die Propheten jetzt online · 72 Std. im Fokus.";
  return raw.length > 180 ? `${raw.slice(0, 177)}…` : raw;
}

(async function main() {
  if (!API_KEY) throw new Error("OneSignal API-Key fehlt");
  const trig = readTrigger();
  const title = String(process.env.NEWS_TITLE || trig.title || "Die Propheten jetzt online").trim();
  const text = newsPushBody(
    process.env.NEWS_TEXT || trig.text || "72 Std. im Fokus · Qurʾān & Sunnah · tippe zum Öffnen"
  );
  const newsId = String(process.env.NEWS_ID || trig.id || "propheten-wissen-live-2026-08-08").trim();
  const site = siteOriginFromEnv(SITE_URL);
  const url = `${site}/#propheten`;

  const payload = withNotificationIcons(
    {
      app_id: APP_ID,
      target_channel: "push",
      headings: { en: title, de: title },
      contents: { en: text, de: text },
      url,
      data: {
        type: "news",
        newsId,
        nav: "propheten",
        value: "",
        url,
        focus: "prophets-72h",
        badge: "72 Std. im Fokus",
        publishedAt: new Date().toISOString()
      },
      name: `prophets-focus-live-${RUN_ID}`
    },
    SITE_URL
  );

  const attempts = [
    { ...payload, included_segments: ["DAR_PUSH"] },
    { ...payload, included_segments: ["Subscribed Users"] },
    {
      ...payload,
      filters: [{ field: "tag", key: "dar_push", relation: "=", value: "true" }]
    },
    {
      ...payload,
      filters: [{ field: "tag", key: "post_notifications", relation: "=", value: "true" }]
    }
  ];

  let lastError = null;
  for (const body of attempts) {
    try {
      const result = await postOneSignalNotification(body, API_KEY, { retries: 2 });
      const target = body.included_segments?.[0] || "tag-filter";
      console.log(`OK prophets focus push (${target}):`, result.text || result);
      return;
    } catch (err) {
      lastError = err;
      console.warn("attempt failed", err && err.message ? err.message : err);
    }
  }
  throw lastError || new Error("Propheten-Fokus-Push fehlgeschlagen");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
