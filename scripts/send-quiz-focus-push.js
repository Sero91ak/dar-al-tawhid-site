#!/usr/bin/env node
/* DAR AL TAWḤID – OneSignal broadcast: Din-Quiz 84h Fokus (live). */

const {
  withNotificationIcons,
  postOneSignalNotification,
  siteOriginFromEnv
} = require("./lib/onesignal-push");

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_API_KEY_NEW || process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de";
const RUN_ID = process.env.GITHUB_RUN_ID || "manual";
const ONESIGNAL_BATCH_SIZE = 2000;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

function buildQuizPushUrl() {
  const site = siteOriginFromEnv(SITE_URL);
  const v = Date.now();
  return `${site}/?focus=quiz&v=${encodeURIComponent(v)}#quiz`;
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
    "subscription_id=not.is.null&push_opted_in=eq.true&select=subscription_id",
    "subscription_id=not.is.null&select=subscription_id"
  ];
  for (const query of queries) {
    try {
      const res = await fetch(`${base}?${query}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" }
      });
      const text = await res.text();
      if (!res.ok) {
        if (res.status === 400 && query.includes("push_opted_in")) continue;
        throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
      }
      const rows = text ? JSON.parse(text) : [];
      return uniqueValues((Array.isArray(rows) ? rows : []).map((row) => row.subscription_id));
    } catch (err) {
      if (!query.includes("push_opted_in")) return [];
    }
  }
  return [];
}

async function sendWithFallbacks(basePayload) {
  if (!API_KEY) throw new Error("OneSignal API-Key fehlt");

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
    }
  ];

  let lastError = null;
  for (const payload of attempts) {
    try {
      const result = await postOneSignalNotification(payload, API_KEY, { retries: 2 });
      const target = payload.include_subscription_ids
        ? `supabase-subscriptions:${payload.include_subscription_ids.length}`
        : payload.included_segments?.[0] || "tag-filter";
      console.log(`Quiz-Fokus-Push gesendet (${target}):`, result.text);
      return result;
    } catch (err) {
      lastError = err;
      console.warn("Quiz-Push Versuch fehlgeschlagen:", err.message || err);
    }
  }
  throw lastError || new Error("Quiz-Fokus-Push fehlgeschlagen");
}

(async function main() {
  const url = buildQuizPushUrl();
  const title = "🧠 Din-Quiz jetzt online";
  const message = "84 Std. im Fokus · Geprüfte Fragen aus Qurʾān, Ḥadīth und Wissen · direkt in der Tab-Leiste. Tippe hier zum Öffnen.";

  const payload = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    headings: { en: title, de: title },
    contents: { en: message, de: message },
    url,
    data: {
      type: "quiz",
      nav: "quiz",
      url,
      focus: "quiz-84h",
      badge: "84 Std. im Fokus"
    },
    name: `quiz-focus-live-${RUN_ID}`
  }, SITE_URL);

  await sendWithFallbacks(payload);
})().catch((err) => {
  console.error("OneSignal Fehler:", err.message || err);
  process.exit(1);
});
