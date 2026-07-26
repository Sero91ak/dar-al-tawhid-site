/**
 * DAR AL TAWḤĪD Bibliothek — Besucher-Push bei Live-PDF-Veröffentlichung
 */

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const LIVE_CATALOG_PATH = "data/library-publications.json";
const LIBRARY_LIVE_CHECK_SCHEDULE_MS = [0, 3000, 6000, 9000, 12000, 15000, 20000, 30000, 45000, 60000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || env.ONESIGNAL_APP_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
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
  const delays = Array.isArray(options.delays) && options.delays.length
    ? options.delays
    : LIBRARY_LIVE_CHECK_SCHEDULE_MS;
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
    name: `library-publish-${Date.now()}`
  };

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

  let lastError = "Unbekannter Fehler";
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
          return {
            sent: true,
            target: payload.included_segments?.[0] || "tag-filter",
            authMode,
            targetUrl: url,
            data: pushData,
            response: text.slice(0, 400)
          };
        }
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          lastError = `OneSignal ${res.status} (${authMode}): ${text.slice(0, 240)}`;
          continue;
        }
        lastError = `OneSignal ${res.status}: ${text.slice(0, 240)}`;
      } catch (error) {
        lastError = error.message || String(error);
      }
    }
  }

  return { sent: false, reason: lastError };
}
