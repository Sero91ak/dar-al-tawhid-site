#!/usr/bin/env node
/* DAR AL TAWḤID – OneSignal broadcast für Fokus-News (live Besucher). */

const {
  withNotificationIcons,
  postOneSignalNotification,
  siteOriginFromEnv
} = require("./lib/onesignal-push");

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_API_KEY_NEW || process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de";
const RUN_ID = process.env.GITHUB_RUN_ID || "manual";

function newsPushBody(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Neu im Fokus auf DAR AL TAWḤID.";
  return raw.length > 180 ? `${raw.slice(0, 177)}…` : raw;
}

function buildNewsPushUrl({ newsId, nav, value }) {
  const site = siteOriginFromEnv(SITE_URL);
  const id = String(newsId || "").trim();
  const targetNav = String(nav || "").trim();
  const targetValue = String(value || "").trim();
  if (targetNav === "zakat") return `${site}/#zakat`;
  if (targetNav && targetValue && targetNav !== "news-detail") {
    return `${site}/#${targetNav}/${encodeURIComponent(targetValue)}`;
  }
  return `${site}/#news-detail/${encodeURIComponent(id || "news")}`;
}

(async function main() {
  const title = String(process.env.NEWS_TITLE || "Neu im Fokus").trim();
  const text = String(process.env.NEWS_TEXT || "").trim();
  const newsId = String(process.env.NEWS_ID || `news-${Date.now()}`).trim();
  const nav = String(process.env.NEWS_NAV || "news-detail").trim();
  const value = String(process.env.NEWS_VALUE || "").trim();
  const pushType = nav === "zakat" ? "zakat" : "news";

  if (!API_KEY) throw new Error("OneSignal API-Key fehlt");

  const url = buildNewsPushUrl({ newsId, nav, value });
  const message = newsPushBody(text);

  const payload = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    headings: { en: title, de: title },
    contents: { en: message, de: message },
    url,
    data: {
      type: pushType,
      newsId,
      nav: nav || "news-detail",
      value,
      url,
      publishedAt: new Date().toISOString()
    },
    name: `admin-news-live-${RUN_ID}`
  }, SITE_URL);

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
    for (const authMode of ["Key", "Basic"]) {
      try {
        const result = await postOneSignalNotification(body, API_KEY, { retries: 2 });
        console.log(`News-Push gesendet (${body.included_segments?.[0] || "filter"}):`, result.text);
        return;
      } catch (err) {
        lastError = err;
      }
    }
  }
  throw lastError || new Error("News-Push fehlgeschlagen");
})().catch((err) => {
  console.error("OneSignal Fehler:", err.message || err);
  process.exit(1);
});
