#!/usr/bin/env node
/* DAR AL TAWḤĪD – OneSignal: einzelnes Bibliothek-PDF an Besucher. */

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
const ONESIGNAL_BATCH_SIZE = 2000;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
const PENDING_PATH = path.join(__dirname, "..", "content/admin/pending-pushes.json");

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

function buildLibraryPushUrl(slug) {
  const site = siteOriginFromEnv(SITE_URL);
  const v = Date.now();
  const s = String(slug || "").trim();
  return s
    ? `${site}/?v=${encodeURIComponent(v)}#bibliothek/${encodeURIComponent(s)}`
    : `${site}/#bibliothek`;
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

function resolvePublication() {
  const publicationId = String(process.env.LIBRARY_PUBLICATION_ID || "").trim();
  const slug = String(process.env.LIBRARY_PUBLICATION_SLUG || "").trim();
  const title = String(process.env.LIBRARY_PUBLICATION_TITLE || "").trim();
  if (publicationId || slug || title) {
    return {
      publicationId: publicationId || slug,
      slug: slug || publicationId,
      publicationTitle: title || "Neues PDF in der Bibliothek"
    };
  }

  const registry = JSON.parse(fs.readFileSync(PENDING_PATH, "utf8"));
  const pending = Object.values(registry.pushes || {}).filter(
    (item) => item?.kind === "library" && item?.pushApproved === true && (item?.status === "pending" || item?.status === "failed")
  );
  pending.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  if (!pending.length) throw new Error("Keine freigegebene Bibliothek-Push-Queue gefunden");
  const item = pending[0];
  return {
    publicationId: item.publicationId,
    slug: item.slug,
    publicationTitle: item.publicationTitle || "Neues PDF in der Bibliothek"
  };
}

async function sendWithFallbacks(basePayload, subscriptionIds) {
  if (!API_KEY) throw new Error("OneSignal API-Key fehlt");

  const attempts = [
    ...subscriptionIds.slice(0, 40).map((id) => ({
      ...basePayload,
      include_subscription_ids: [id]
    })),
    ...(subscriptionIds.length > 40
      ? chunk(subscriptionIds, ONESIGNAL_BATCH_SIZE).map((ids) => ({
          ...basePayload,
          include_subscription_ids: ids
        }))
      : []),
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
  let delivered = 0;
  let lastOk = null;
  for (const payload of attempts) {
    try {
      const result = await postOneSignalNotification(payload, API_KEY, { retries: 2 });
      let parsed = {};
      try {
        parsed = result.text ? JSON.parse(result.text) : {};
      } catch (error) {}
      const recipients = Number(parsed.recipients);
      const target = payload.include_subscription_ids
        ? (payload.include_subscription_ids.length === 1
          ? `subscription:${payload.include_subscription_ids[0]}`
          : `supabase-subscriptions:${payload.include_subscription_ids.length}`)
        : payload.included_segments?.[0] || "tag-filter";
      if (!parsed.id) {
        lastError = new Error(`OneSignal ohne Notification-ID (${target}): ${result.text.slice(0, 240)}`);
        console.warn(lastError.message);
        continue;
      }
      if (!payload.include_subscription_ids?.length && Number.isFinite(recipients) && recipients <= 0) {
        lastError = new Error(`OneSignal 0 Empfänger (${target})`);
        console.warn(lastError.message);
        continue;
      }
      delivered += 1;
      lastOk = { result, target, parsed, delivered };
      console.log(`Bibliothek-PDF-Push gesendet (${target}, recipients=${Number.isFinite(recipients) ? recipients : "n/a"}):`, result.text.slice(0, 400));
      if (!(payload.include_subscription_ids?.length === 1 && subscriptionIds.length > 1)) {
        return lastOk;
      }
    } catch (err) {
      lastError = err;
      console.warn("Bibliothek-PDF-Push Versuch fehlgeschlagen:", err.message || err);
    }
  }
  if (lastOk) return lastOk;
  throw lastError || new Error("Bibliothek-PDF-Push fehlgeschlagen");
}

(async function main() {
  const pub = resolvePublication();
  const url = buildLibraryPushUrl(pub.slug);
  const title = "Neues PDF in der Bibliothek";
  const message = String(pub.publicationTitle || "Neue Veröffentlichung").trim();
  const subscriptionIds = await fetchRegisteredSubscriptionIds();
  console.log(`Ziel: ${pub.publicationId} · ${pub.slug} · Supabase-Abos=${subscriptionIds.length}`);

  const payload = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    headings: { en: title, de: title },
    contents: { en: message, de: message },
    url,
    data: {
      type: "library",
      nav: "bibliothek",
      publicationId: pub.publicationId,
      slug: pub.slug,
      url,
      publishedAt: new Date().toISOString(),
      cacheVersion: String(Date.now())
    },
    name: `library-publish-${pub.publicationId || "manual"}-${RUN_ID}`
  }, SITE_URL);

  const sent = await sendWithFallbacks(payload, subscriptionIds);
  console.log(JSON.stringify({
    ok: true,
    publicationId: pub.publicationId,
    slug: pub.slug,
    target: sent.target,
    notificationId: sent.parsed?.id || null,
    recipients: sent.parsed?.recipients ?? null
  }));
})().catch((err) => {
  console.error("OneSignal Fehler:", err.message || err);
  process.exit(1);
});
