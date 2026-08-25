/**
 * DAR AL TAWḤĪD Bibliothek — Besucher-Push bei Live-PDF-Veröffentlichung
 */

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
const LIVE_CATALOG_PATH = "data/library-publications.json";
const ONESIGNAL_BATCH_SIZE = 2000;
/** Bis ~8 Min. warten, früh häufig prüfen (Deploy dauert typ. 45–90 s). */
const LIBRARY_LIVE_CHECK_SCHEDULE_MS = [
  0, 5000, 10000, 15000, 20000, 30000, 45000, 60000, 75000, 90000,
  105000, 120000, 150000, 180000, 240000, 300000, 360000, 420000, 480000
];
const LIBRARY_LIVE_CHECK_QUICK_MS = [0, 5000, 10000, 15000, 20000];
/** Push 15 s nach Live-Bestätigung (Ziel: 10–20 s). */
export const LIBRARY_PUSH_DELAY_AFTER_LIVE_MS = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || env.ONESIGNAL_APP_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function supabaseApiKey(env) {
  return String(env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY).trim();
}

function parseOneSignalAcceptedRecipients(raw) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    const candidates = [data?.recipients, data?.total_count, data?.successful];
    for (const value of candidates) {
      const count = Number(value);
      if (Number.isFinite(count)) return count;
    }
  } catch (error) {}
  return null;
}

function countOneSignalInvalidIds(raw) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    const errors = data?.errors || {};
    const buckets = [
      errors.invalid_player_ids,
      errors.invalid_subscription_ids,
      errors.invalid_aliases,
      data?.invalid_player_ids,
      data?.invalid_subscription_ids
    ];
    let total = 0;
    for (const bucket of buckets) {
      if (Array.isArray(bucket)) total += bucket.length;
    }
    return total;
  } catch (error) {
    return 0;
  }
}

/** true = Versuch weiterprobieren (kein echter Besucher-Empfang) */
function oneSignalResponseLooksEmpty(raw, requestedIdCount = 0) {
  let data = null;
  try {
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    data = null;
  }
  const accepted = parseOneSignalAcceptedRecipients(raw);
  if (accepted !== null && accepted <= 0) return true;
  const invalid = countOneSignalInvalidIds(raw);
  if (accepted === null && invalid > 0) {
    // Viele tote Supabase-IDs: OneSignal 200 ohne recipients → kein echter Versand
    if (!requestedIdCount || invalid >= Math.max(1, Math.floor(requestedIdCount * 0.5))) {
      return true;
    }
  }
  const errors = data?.errors;
  if (Array.isArray(errors) && errors.length) {
    const joined = errors.map((e) => String(e || "").toLowerCase()).join(" | ");
    if (
      joined.includes("not subscribed") ||
      joined.includes("no subscribed") ||
      joined.includes("all included players") ||
      joined.includes("no push tokens") ||
      !String(data?.id || "").trim()
    ) {
      return true;
    }
  } else if (errors && typeof errors === "object") {
    // z.B. { invalid_player_ids: [...] } bereits über invalid abgedeckt
  }
  // Leere Notification-ID ohne Empfängerzahl = kein echter Versand
  if (accepted === null && data && !String(data.id || "").trim() && (invalid > 0 || requestedIdCount > 0 || Array.isArray(errors))) {
    return true;
  }
  return false;
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function chunkValues(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

async function deterministicUuid(seed) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(seed || "")));
  const bytes = new Uint8Array(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function loadLibraryPushSubscriptionIds(env) {
  const key = supabaseApiKey(env);
  if (!key) return [];
  const base = `${SUPABASE_URL}/rest/v1/prayer_push_registrations`;
  // Gleiche Quelle wie Gebets-Push (enabled=true) – dort funktionieren die IDs.
  const queries = [
    "enabled=eq.true&subscription_id=not.is.null&select=subscription_id,last_synced_at&order=last_synced_at.desc.nullslast",
    "subscription_id=not.is.null&push_opted_in=eq.true&select=subscription_id,last_synced_at&order=last_synced_at.desc.nullslast",
    "subscription_id=not.is.null&select=subscription_id,last_synced_at&order=last_synced_at.desc.nullslast"
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
        if (res.status === 400 && (query.includes("push_opted_in") || query.includes("enabled="))) continue;
        throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
      }
      const rows = text ? JSON.parse(text) : [];
      const ids = uniqueValues((Array.isArray(rows) ? rows : []).map((row) => row.subscription_id));
      if (ids.length) return ids;
    } catch (error) {
      if (!query.includes("push_opted_in") && !query.includes("enabled=")) return [];
    }
  }

  return [];
}

function buildLibraryPushAttempts(basePayload, subscriptionIds) {
  const attempts = [];
  // Zuerst bekannte aktive Gebets-Push-Abos (funktionieren live), dann Segmente.
  for (const ids of chunkValues(subscriptionIds, ONESIGNAL_BATCH_SIZE)) {
    attempts.push({ ...basePayload, include_subscription_ids: ids });
  }
  attempts.push(
    { ...basePayload, included_segments: ["Subscribed Users"] },
    { ...basePayload, included_segments: ["DAR_PUSH"] },
    { ...basePayload, included_segments: ["Total Subscriptions"] },
    { ...basePayload, filters: [{ field: "tag", key: "dar_push", relation: "=", value: "true" }] },
    { ...basePayload, filters: [{ field: "tag", key: "post_notifications", relation: "=", value: "true" }] }
  );
  return attempts;
}

function siteOrigin(env) {
  return String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
}

export function libraryPushRegistryKey(publicationId) {
  const id = String(publicationId || "").trim();
  return id ? `lib:${id}` : "";
}

export function buildLibraryPushUrl(env, slug, cacheVersion) {
  const site = siteOrigin(env);
  const s = String(slug || "").trim();
  const v = cacheVersion || Date.now();
  return s
    ? `${site}/?v=${encodeURIComponent(v)}#bibliothek/${encodeURIComponent(s)}`
    : `${site}/#bibliothek`;
}

export function buildLibraryPushPendingRecord(publication) {
  const pub = publication || {};
  const publicationId = String(pub.id || "").trim();
  const slug = String(pub.slug || publicationId).trim();
  const publishedAt = new Date().toISOString();
  return {
    kind: "library",
    publicationId,
    slug,
    publicationTitle: String(pub.title || "Neue PDF").trim(),
    pdfUrl: String(pub.pdfUrl || "").trim(),
    catalogPath: LIVE_CATALOG_PATH,
    publishedAt,
    status: "pending",
    pushApproved: true,
    pushApprovedAt: publishedAt,
    createdAt: publishedAt,
    lastError: ""
  };
}

export async function verifyLibraryLiveAvailability(env, record) {
  const site = siteOrigin(env);
  const bust = Date.now();
  const publicationId = String(record?.publicationId || "").trim();
  const slug = String(record?.slug || "").trim();
  const pdfPath = String(record?.pdfUrl || "").trim().replace(/^\//, "");
  const catalogPath = String(record?.catalogPath || LIVE_CATALOG_PATH).trim();
  const result = {
    site,
    publicationId,
    slug,
    catalogFoundPublic: false,
    publicationInCatalog: false,
    pdfFilePublic: false,
    visitorUrlOk: false,
    visitorUrl: buildLibraryPushUrl(env, slug, bust)
  };

  try {
    const catalogRes = await fetch(`${site}/${catalogPath}?v=${bust}`, { cache: "no-store" });
    if (catalogRes.ok) {
      result.catalogFoundPublic = true;
      const catalog = await catalogRes.json();
      const publications = Array.isArray(catalog?.publications) ? catalog.publications : [];
      result.publicationInCatalog = publications.some((item) => {
        const id = String(item?.id || "").trim();
        const itemSlug = String(item?.slug || "").trim();
        return (publicationId && id === publicationId) || (slug && itemSlug === slug);
      });
    } else {
      result.catalogHttpStatus = catalogRes.status;
    }
  } catch (error) {
    result.catalogError = error.message || String(error);
  }

  if (pdfPath) {
    try {
      const pdfRes = await fetch(`${site}/${pdfPath}?v=${bust}`, { cache: "no-store", method: "HEAD" });
      result.pdfFilePublic = pdfRes.ok;
      if (!pdfRes.ok) result.pdfHttpStatus = pdfRes.status;
    } catch (error) {
      result.pdfError = error.message || String(error);
    }
  }

  if (result.visitorUrl) {
    try {
      const navRes = await fetch(result.visitorUrl.split("#")[0], { cache: "no-store", redirect: "follow" });
      result.visitorUrlOk = navRes.ok;
      if (!navRes.ok) result.visitorHttpStatus = navRes.status;
    } catch (error) {
      result.visitorError = error.message || String(error);
    }
  }

  const ok = result.catalogFoundPublic && result.publicationInCatalog && result.pdfFilePublic;
  let diagnosis = "";
  if (!result.catalogFoundPublic) diagnosis = "Bibliotheks-Katalog öffentlich nicht erreichbar.";
  else if (!result.publicationInCatalog) diagnosis = "PDF noch nicht im Live-Katalog enthalten.";
  else if (!result.pdfFilePublic) diagnosis = "PDF-Datei öffentlich noch nicht erreichbar.";

  return { ok, diagnosis, ...result };
}

export async function verifyLibraryLiveAvailabilityWithRetry(env, record, options = {}) {
  const schedule = options.schedule === "quick" ? LIBRARY_LIVE_CHECK_QUICK_MS : LIBRARY_LIVE_CHECK_SCHEDULE_MS;
  const delays = Array.isArray(options.delays) && options.delays.length ? options.delays : schedule;
  let lastResult = null;
  let elapsed = 0;

  for (let i = 0; i < delays.length; i++) {
    const target = delays[i];
    const waitMs = target - elapsed;
    if (waitMs > 0) await sleep(waitMs);
    elapsed = target;

    lastResult = await verifyLibraryLiveAvailability(env, record);
    lastResult.attempt = i + 1;
    if (lastResult.ok) return lastResult;
  }

  return lastResult;
}

export async function sendLibraryPublicationPush(env, record) {
  const apiKey = oneSignalApiKey(env);
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  if (!apiKey) {
    return { sent: false, reason: "OneSignal API-Key fehlt am Worker (ONESIGNAL_API_KEY_NEW)" };
  }

  const site = siteOrigin(env);
  const publicationId = String(record?.publicationId || "").trim();
  const slug = String(record?.slug || publicationId).trim();
  const title = "Neues PDF in der Bibliothek";
  const message = String(record?.publicationTitle || "Neue Veröffentlichung").trim();
  const version = Date.now();
  const url = buildLibraryPushUrl(env, slug, version);
  const icon = `${site}/notification-icon-192.png?v=2`;
  const badge = `${site}/notification-badge-96.png?v=2`;
  const pushData = {
    type: "library",
    nav: "bibliothek",
    publicationId,
    slug,
    url,
    publishedAt: record?.publishedAt || new Date().toISOString(),
    cacheVersion: String(version)
  };
  const idempotencySeed = [
    "library-push",
    publicationId || slug || "unknown",
    slug || "no-slug",
    String(record?.publishedAt || ""),
    String(record?.pushApprovedAt || ""),
    String(record?.pdfUrl || "")
  ].join("|");
  const idempotencyKey = await deterministicUuid(idempotencySeed);

  const basePayload = {
    app_id: appId,
    target_channel: "push",
    headings: { en: title, de: title },
    contents: { en: message, de: message },
    url,
    data: pushData,
    chrome_web_icon: icon,
    chrome_web_badge: badge,
    firefox_icon: icon,
    name: `library-publish-${publicationId || slug || "unknown"}`,
    idempotency_key: idempotencyKey
  };

  const subscriptionIds = await loadLibraryPushSubscriptionIds(env);
  const attempts = buildLibraryPushAttempts(basePayload, subscriptionIds);

  let lastError = "Kein Empfänger gefunden – alle Zielgruppen lieferten 0 Empfänger oder Fehler";
  const attemptLog = [];
  for (const payload of attempts) {
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
        if (res.ok) {
          const requestedIds = Array.isArray(payload.include_subscription_ids)
            ? payload.include_subscription_ids.length
            : 0;
          const accepted = parseOneSignalAcceptedRecipients(text);
          const invalidCount = countOneSignalInvalidIds(text);
          const targetLabel = requestedIds
            ? `supabase-subscriptions:${requestedIds}`
            : (payload.included_segments?.[0] || "tag-filter");
          if (oneSignalResponseLooksEmpty(text, requestedIds)) {
            lastError = `OneSignal 200 ohne Zustellung (${targetLabel}): recipients=${accepted ?? "null"}, invalid=${invalidCount}`;
            attemptLog.push({
              target: targetLabel,
              httpStatus: res.status,
              authMode,
              sent: false,
              recipients: accepted,
              invalidIds: invalidCount,
              reason: lastError
            });
            continue;
          }
          return {
            sent: true,
            target: targetLabel,
            authMode,
            targetUrl: url,
            data: pushData,
            recipients: accepted,
            invalidIds: invalidCount,
            response: text.slice(0, 400),
            subscriptionCount: subscriptionIds.length,
            attempts: attemptLog
          };
        }
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          lastError = `OneSignal ${res.status} (${authMode}): ${text.slice(0, 240)}`;
          attemptLog.push({
            target: payload.include_subscription_ids?.length
              ? `supabase-subscriptions:${payload.include_subscription_ids.length}`
              : (payload.included_segments?.[0] || "tag-filter"),
            httpStatus: res.status,
            authMode,
            sent: false,
            reason: lastError
          });
          continue;
        }
        lastError = `OneSignal ${res.status}: ${text.slice(0, 240)}`;
        attemptLog.push({
          target: payload.include_subscription_ids?.length
            ? `supabase-subscriptions:${payload.include_subscription_ids.length}`
            : (payload.included_segments?.[0] || "tag-filter"),
          httpStatus: res.status,
          authMode,
          sent: false,
          reason: lastError
        });
      } catch (error) {
        lastError = error.message || String(error);
        attemptLog.push({
          target: payload.include_subscription_ids?.length
            ? `supabase-subscriptions:${payload.include_subscription_ids.length}`
            : (payload.included_segments?.[0] || "tag-filter"),
          httpStatus: 0,
          authMode,
          sent: false,
          reason: lastError
        });
      }
    }
  }

  return { sent: false, reason: lastError, subscriptionCount: subscriptionIds.length, attempts: attemptLog };
}
