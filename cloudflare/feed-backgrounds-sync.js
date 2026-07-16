/**
 * Automatische Feed-Hintergrundbilder — Pexels / Unsplash / Pixabay (Natur-Fokus).
 * Download → Prüfung → lokale Speicherung (GitHub Assets). Keine Hotlinks im Feed.
 */
import {
  readFeedBackgroundsIndex,
  saveFeedBackgroundEntry,
  deleteFeedBackgroundEntry,
  isFeedBgSelectable,
  ASSETS_BG_ROOT
} from "./feed-backgrounds-admin.js";
import {
  WHITELIST_QUERIES,
  DEFAULT_SETTINGS,
  mergeSettings,
  validateCandidate,
  sortQueriesNatureFirst
} from "./feed-background-safety.js";

const AUTO_BG_ROOT = `${ASSETS_BG_ROOT}/auto`;
const DAILY_SYNC_MS = 24 * 60 * 60 * 1000;
const MIN_SYNC_INTERVAL_MS = 5 * 60 * 1000;

const WIKI_FORBIDDEN_CATEGORIES = [
  "people", "portrait", "nude", "nudity", "animal", "bird", "mammal", "dog", "cat",
  "church", "cross", "statue", "sculptures of people", "selfie", "wedding"
];

function wikiSearchQuery(query) {
  return String(query || "")
    .replace(/\s+no people/gi, "")
    .replace(/\s+no animals/gi, "")
    .replace(/\s+empty\s+/gi, " ")
    .trim();
}

function wikiFilePathUrl(fileTitle, width) {
  const name = String(fileTitle || "").replace(/^File:/i, "");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
}

function isWikiLicenseOk(meta) {
  const license = String(meta?.LicenseShortName?.value || meta?.License?.value || "").toLowerCase();
  const url = String(meta?.LicenseUrl?.value || "").toLowerCase();
  const hay = `${license} ${url}`;
  if (!hay.trim()) return false;
  if (hay.includes("nc") || hay.includes("nd")) return false;
  if (hay.includes("cc0") || hay.includes("cc-zero") || hay.includes("public domain") || hay.includes("pd")) return true;
  if (hay.includes("cc-by-sa") || hay.includes("cc by-sa")) return true;
  if (hay.includes("cc-by") || hay.includes("cc by")) return true;
  return false;
}

function wikiCategoriesBlocked(categoriesValue) {
  const hay = String(categoriesValue || "").toLowerCase();
  return WIKI_FORBIDDEN_CATEGORIES.some((c) => hay.includes(c));
}

function nowIso() {
  return new Date().toISOString();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "bg";
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function emptySyncState() {
  return {
    lastSyncAt: "",
    lastSyncStatus: "idle",
    lastSyncError: "",
    nextSyncAt: "",
    dailyDownloadDate: "",
    dailyDownloadCount: 0,
    lastRunDownloads: 0,
    lastRunRejected: 0,
    lastRunErrors: [],
    totalDownloads: 0,
    totalRejected: 0
  };
}

function mergeSyncState(raw) {
  return { ...emptySyncState(), ...(raw && typeof raw === "object" ? raw : {}) };
}

export function countApprovedPool(items) {
  return (Array.isArray(items) ? items : []).filter((x) => isFeedBgSelectable(x)).length;
}

export function countBlockedPool(items) {
  return (Array.isArray(items) ? items : []).filter((x) => {
    if (!x) return false;
    return x.securityStatus === "blocked" || x.approved === false && x.status !== "deleted";
  }).length;
}

function resetDailyCounter(syncState) {
  const today = todayKey();
  if (syncState.dailyDownloadDate !== today) {
    syncState.dailyDownloadDate = today;
    syncState.dailyDownloadCount = 0;
  }
}

function canDownloadMore(settings, syncState, limitOverride) {
  resetDailyCounter(syncState);
  const limit = Number.isFinite(Number(limitOverride))
    ? Number(limitOverride)
    : Number(settings.dailyDownloadLimit) || DEFAULT_SETTINGS.dailyDownloadLimit;
  return syncState.dailyDownloadCount < limit;
}

function remainingDailyDownloads(settings, syncState) {
  resetDailyCounter(syncState);
  const limit = Number(settings.dailyDownloadLimit) || DEFAULT_SETTINGS.dailyDownloadLimit;
  return Math.max(0, limit - (Number(syncState.dailyDownloadCount) || 0));
}

function existingSourceIds(items) {
  const set = new Set();
  (items || []).forEach((x) => {
    if (!x) return;
    if (x.source && x.sourcePhotoId) set.add(`${x.source}:${x.sourcePhotoId}`);
  });
  return set;
}

function validateBinary(bytes, contentType) {
  const reasons = [];
  if (!bytes || bytes <= 0) reasons.push("empty-file");
  if (bytes > 2 * 1024 * 1024) reasons.push("file-too-large");
  if (bytes < 8000) reasons.push("file-too-small");
  const ct = String(contentType || "").toLowerCase();
  if (ct && !ct.startsWith("image/")) reasons.push("not-image");
  return { ok: reasons.length === 0, reasons };
}

function qualityScoreFromMeta(meta, bytes) {
  const w = Number(meta.width) || 1080;
  const h = Number(meta.height) || 1350;
  let score = 70;
  score += Math.min(20, Math.floor(Math.min(w, h) / 80));
  if (bytes > 40000 && bytes < 900000) score += 8;
  if ((meta.tags || []).length >= 3) score += 4;
  return Math.max(0, Math.min(100, score));
}

function overlayFromQuery(entry) {
  return entry.overlayHint || "dark";
}

function buildVariantUrls(source, photoId, raw) {
  if (source === "pexels") {
    const base = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg`;
    return {
      full: `${base}?auto=compress&cs=tinysrgb&w=2160&h=2700&fit=crop`,
      mobile: `${base}?auto=compress&cs=tinysrgb&w=1440&h=1920&fit=crop`,
      thumb: `${base}?auto=compress&cs=tinysrgb&w=512&h=512&fit=crop`,
      ext: "jpg"
    };
  }
  if (source === "unsplash") {
    const base = raw.downloadBase || raw.regularUrl || raw.rawUrl;
    if (!base) return null;
    const join = base.includes("?") ? "&" : "?";
    return {
      full: `${base}${join}w=2160&h=2700&fit=crop&fm=webp&q=88`,
      mobile: `${base}${join}w=1440&h=1920&fit=crop&fm=webp&q=85`,
      thumb: `${base}${join}w=512&h=512&fit=crop&fm=webp&q=82`,
      ext: "webp"
    };
  }
  if (source === "pixabay") {
    return {
      full: raw.largeUrl || raw.webUrl,
      mobile: raw.webUrl || raw.largeUrl,
      thumb: raw.previewUrl || raw.webUrl,
      ext: "jpg"
    };
  }
  if (source === "wikimedia") {
    const fileTitle = raw.fileTitle || "";
    if (!fileTitle) return null;
    const ext = String(raw.ext || "jpg").toLowerCase();
    return {
      full: wikiFilePathUrl(fileTitle, 1080),
      mobile: wikiFilePathUrl(fileTitle, 720),
      thumb: wikiFilePathUrl(fileTitle, 400),
      ext: ext === "jpeg" ? "jpg" : ext
    };
  }
  return null;
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers: headers || {} });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function downloadImage(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buf = await res.arrayBuffer();
  return { bytes: buf.byteLength, contentType, base64: arrayBufferToBase64(buf) };
}

async function searchPexels(env, query, perPage) {
  const key = env.PEXELS_API_KEY;
  if (!key) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`;
  const data = await fetchJson(url, { Authorization: key });
  return (data.photos || []).map((p) => ({
    source: "pexels",
    sourcePhotoId: String(p.id),
    sourceUrl: p.url || "",
    alt: p.alt || "",
    description: "",
    photographer: p.photographer || "",
    tags: [],
    width: p.width,
    height: p.height,
    license: "Pexels License",
    raw: {}
  }));
}

async function searchUnsplash(env, query, perPage) {
  const key = env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait&content_filter=high`;
  const data = await fetchJson(url, { Authorization: `Client-ID ${key}` });
  return (data.results || []).map((p) => ({
    source: "unsplash",
    sourcePhotoId: String(p.id),
    sourceUrl: p.links?.html || "",
    alt: p.alt_description || p.description || "",
    description: p.description || "",
    photographer: p.user?.name || "",
    tags: (p.tags || []).map((t) => (typeof t === "string" ? t : t.title || "")),
    width: p.width,
    height: p.height,
    license: "Unsplash License",
    raw: {
      downloadBase: p.urls?.raw || p.urls?.full || p.urls?.regular,
      regularUrl: p.urls?.regular,
      rawUrl: p.urls?.raw
    }
  }));
}

async function searchWikimedia(query, perPage) {
  const wikiQuery = wikiSearchQuery(query);
  if (!wikiQuery) return [];
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&formatversion=2" +
    `&generator=search&gsrsearch=${encodeURIComponent(wikiQuery)}&gsrnamespace=6&gsrlimit=${perPage}` +
    "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1080";
  const data = await fetchJson(url);
  const pages = data?.query?.pages || [];
  const out = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const info = (page?.imageinfo || [])[0];
    if (!info?.url) continue;
    const mime = String(info.mime || "").toLowerCase();
    if (!mime.startsWith("image/")) continue;
    const meta = info.extmetadata || {};
    if (!isWikiLicenseOk(meta)) continue;
    if (wikiCategoriesBlocked(meta?.Categories?.value)) continue;
    const title = String(page.title || "");
    const desc = String(meta?.ImageDescription?.value || meta?.ObjectName?.value || title)
      .replace(/<[^>]+>/g, " ")
      .trim();
    const artist = String(meta?.Artist?.value || "").replace(/<[^>]+>/g, " ").trim();
    const license = String(meta?.LicenseShortName?.value || meta?.License?.value || "Wikimedia Commons").trim();
    const ext = (mime.split("/")[1] || "jpg").split("+")[0];
    out.push({
      source: "wikimedia",
      sourcePhotoId: String(page.pageid || page.title || i),
      sourceUrl: info.descriptionurl || page.canonicalurl || "",
      alt: desc || title,
      description: desc,
      photographer: artist,
      tags: String(meta?.Categories?.value || "").split("|").slice(0, 8),
      width: info.width,
      height: info.height,
      license,
      raw: { fileTitle: title, ext }
    });
  }
  return out;
}

async function searchPixabay(env, query, perPage) {
  const key = env.PIXABAY_API_KEY;
  if (!key) return [];
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&safesearch=true&per_page=${perPage}`;
  const data = await fetchJson(url);
  return (data.hits || []).map((p) => ({
    source: "pixabay",
    sourcePhotoId: String(p.id),
    sourceUrl: p.pageURL || "",
    alt: p.tags || "",
    description: p.tags || "",
    photographer: p.user || "",
    tags: String(p.tags || "").split(",").map((x) => x.trim()).filter(Boolean),
    width: p.imageWidth,
    height: p.imageHeight,
    license: "Pixabay License",
    raw: {
      largeUrl: p.largeImageURL,
      webUrl: p.webformatURL,
      previewUrl: p.previewURL
    }
  }));
}

async function searchAllSources(env, queryEntry, perPage, allowedSources) {
  const tasks = [];
  const q = queryEntry.query;
  if (allowedSources.includes("wikimedia")) tasks.push(searchWikimedia(q, perPage).catch(() => []));
  if (allowedSources.includes("pexels")) tasks.push(searchPexels(env, q, perPage).catch(() => []));
  if (allowedSources.includes("unsplash")) tasks.push(searchUnsplash(env, q, perPage).catch(() => []));
  if (allowedSources.includes("pixabay")) tasks.push(searchPixabay(env, q, perPage).catch(() => []));
  const batches = await Promise.all(tasks);
  return batches.flat().map((c) => ({ ...c, query: q, category: queryEntry.category, queryTags: queryEntry.tags || [] }));
}

function hasAnyPhotoSource(env, settings) {
  const allowed = settings?.allowedSources || DEFAULT_SETTINGS.allowedSources;
  if (allowed.includes("pexels") && env.PEXELS_API_KEY) return true;
  if (allowed.includes("unsplash") && env.UNSPLASH_ACCESS_KEY) return true;
  if (allowed.includes("pixabay") && env.PIXABAY_API_KEY) return true;
  return false;
}

function missingApiKeys(env) {
  const missing = [];
  if (!env?.PEXELS_API_KEY) missing.push("PEXELS_API_KEY");
  if (!env?.UNSPLASH_ACCESS_KEY) missing.push("UNSPLASH_ACCESS_KEY");
  if (!env?.PIXABAY_API_KEY) missing.push("PIXABAY_API_KEY");
  return missing;
}

function makeAutoId(source, photoId, category) {
  return `bg-auto-${slugify(category)}-${slugify(source)}-${String(photoId).slice(-8)}`;
}

function buildApprovedItem(candidate, variants, queryEntry, settings) {
  const now = nowIso();
  const id = makeAutoId(candidate.source, candidate.sourcePhotoId, queryEntry.category);
  const cat = queryEntry.category || "nature";
  const ext = variants.ext || "webp";
  const basePath = `${AUTO_BG_ROOT}/${cat}/${id}`;
  const tags = [...new Set([...(queryEntry.tags || []), ...(candidate.tags || []).slice(0, 6)].map((x) => String(x).toLowerCase()))];
  const metaCheck = validateCandidate(candidate, settings);
  const flags = metaCheck.flags || {};
  const approved = metaCheck.ok;
  return {
    id,
    title: `${queryEntry.category} · ${candidate.source} ${candidate.sourcePhotoId}`,
    filename: `${id}.${ext}`,
    category: cat,
    tags,
    topics: tags.slice(0, 8),
    allowedFor: ["feed"],
    src: `/${basePath}.${ext}`,
    srcMobile: `/${basePath}-mobile.${ext}`,
    thumbnail: `/${basePath}-thumb.${ext}`,
    alt: candidate.alt || queryEntry.query,
    priority: cat === "nature" ? 10 : Math.min(8, Math.max(5, Math.floor(qualityScoreFromMeta(candidate, variants.fullBytes) / 10))),
    active: approved,
    approved,
    status: approved ? "active" : "disabled",
    securityStatus: approved ? "approved" : "blocked",
    isIslamicallySafe: approved,
    containsHumans: flags.containsHumans === true,
    containsFaces: flags.containsFaces === true,
    containsBodyParts: flags.containsBodyParts === true,
    containsNudity: flags.containsNudity === true,
    containsAnimals: flags.containsAnimals === true,
    containsBirds: flags.containsBirds === true,
    containsWildlife: flags.containsWildlife === true,
    containsPets: flags.containsPets === true,
    containsInsects: flags.containsInsects === true,
    containsFish: flags.containsFish === true,
    containsWatermark: flags.containsWatermark === true,
    containsLogo: flags.containsLogo === true,
    containsTextOverlay: flags.containsTextOverlay === true,
    containsCross: flags.containsCross === true,
    containsChurch: flags.containsChurch === true,
    isLowQuality: flags.isLowQuality === true,
    isBlurred: flags.isBlurred === true,
    isTooBusy: flags.isTooBusy === true,
    hasWatermark: flags.containsWatermark === true,
    hasLogo: flags.containsLogo === true,
    hasTextOverlay: flags.containsTextOverlay === true,
    qualityScore: qualityScoreFromMeta(candidate, variants.fullBytes),
    overlayHint: overlayFromQuery(queryEntry),
    focusPoint: { x: 50, y: 50 },
    dominantColor: "",
    source: candidate.source,
    sourcePhotoId: String(candidate.sourcePhotoId),
    sourceUrl: candidate.sourceUrl,
    license: candidate.license || "source_api_license",
    downloadedAt: now,
    createdAt: now,
    updatedAt: now,
    adminNote: approved ? "auto-sync nature-safe approved" : `auto-sync rejected: ${metaCheck.reasons.join(", ")}`,
    autoSynced: true,
    rejectionReasons: approved ? [] : metaCheck.reasons
  };
}

export function getFeedBackgroundSyncStatus(index, env) {
  const settings = mergeSettings(index?.settings);
  const syncState = mergeSyncState(index?.syncState);
  const items = index?.items || [];
  const approved = countApprovedPool(items);
  const blocked = countBlockedPool(items);
  const sources = {
    pexels: Boolean(env?.PEXELS_API_KEY),
    unsplash: Boolean(env?.UNSPLASH_ACCESS_KEY),
    pixabay: Boolean(env?.PIXABAY_API_KEY)
  };
  const missingKeys = missingApiKeys(env);
  resetDailyCounter(syncState);
  return {
    ok: true,
    settings,
    syncState,
    pool: {
      total: items.length,
      approved,
      blocked,
      auto: items.filter((x) => x?.autoSynced).length,
      nature: items.filter((x) => isFeedBgSelectable(x) && x?.category === "nature").length,
      needsRefill: approved < settings.refillBelow,
      target: settings.minPoolSize
    },
    sources,
    missingKeys,
    remainingDailyDownloads: remainingDailyDownloads(settings, syncState),
    apiConfigured: sources.pexels || sources.unsplash || sources.pixabay
  };
}

export async function syncFeedBackgroundImages(env, helpers, options = {}) {
  const staging = Boolean(options.staging);
  const force = Boolean(options.force);
  const maxDownloads = Number(options.maxDownloads) > 0 ? Number(options.maxDownloads) : null;
  const helpersBag = helpers || {};
  const now = nowIso();

  const { index, sha, path } = await readFeedBackgroundsIndex(env, { staging }, helpersBag);
  const settings = mergeSettings(index?.settings);
  const syncState = mergeSyncState(index?.syncState);
  const items = Array.isArray(index?.items) ? [...index.items] : [];

  if (!settings.autoDownloadEnabled && !force) {
    return {
      ok: true,
      skipped: true,
      reason: "auto-download-disabled",
      status: getFeedBackgroundSyncStatus({ ...index, settings, syncState, items }, env)
    };
  }

  const approved = countApprovedPool(items);
  const needsRefill = approved < settings.refillBelow;
  const lastSyncTs = Date.parse(syncState.lastSyncAt || "");
  const dueDaily = !Number.isFinite(lastSyncTs) || Date.now() - lastSyncTs >= DAILY_SYNC_MS;
  const recentlySynced = Number.isFinite(lastSyncTs) && Date.now() - lastSyncTs < MIN_SYNC_INTERVAL_MS;

  if (!force && !needsRefill && !dueDaily) {
    return {
      ok: true,
      skipped: true,
      reason: "not-due",
      status: getFeedBackgroundSyncStatus({ ...index, settings, syncState, items }, env)
    };
  }
  if (!force && recentlySynced) {
    return {
      ok: true,
      skipped: true,
      reason: "cooldown",
      status: getFeedBackgroundSyncStatus({ ...index, settings, syncState, items }, env)
    };
  }

  if (!hasAnyPhotoSource(env, settings)) {
    syncState.lastSyncAt = now;
    syncState.lastSyncStatus = "error";
    syncState.lastSyncError = `API-Keys fehlen: ${missingApiKeys(env).join(", ") || "PEXELS/UNSPLASH/PIXABAY"}`;
    syncState.nextSyncAt = new Date(Date.now() + DAILY_SYNC_MS).toISOString();
    await writeSyncIndex(env, helpersBag, { index, sha, path, settings, syncState, items, staging });
    return {
      ok: false,
      error: syncState.lastSyncError,
      status: getFeedBackgroundSyncStatus({ ...index, settings, syncState, items }, env)
    };
  }

  resetDailyCounter(syncState);
  const allowedSources = (settings.allowedSources || []).filter((s) => {
    if (s === "pexels") return Boolean(env.PEXELS_API_KEY);
    if (s === "unsplash") return Boolean(env.UNSPLASH_ACCESS_KEY);
    if (s === "pixabay") return Boolean(env.PIXABAY_API_KEY);
    return false;
  });

  const existingIds = existingSourceIds(items);
  const targetAdds = Math.min(
    maxDownloads || remainingDailyDownloads(settings, syncState),
    remainingDailyDownloads(settings, syncState),
    Math.max(0, settings.minPoolSize - approved)
  );

  if (targetAdds <= 0 && !force) {
    syncState.lastSyncAt = now;
    syncState.lastSyncStatus = "ok";
    syncState.lastSyncError = "";
    syncState.nextSyncAt = new Date(Date.now() + DAILY_SYNC_MS).toISOString();
    await writeSyncIndex(env, helpersBag, { index, sha, path, settings, syncState, items, staging });
    return {
      ok: true,
      skipped: true,
      reason: "daily-limit-or-pool-full",
      status: getFeedBackgroundSyncStatus({ ...index, settings, syncState, items }, env)
    };
  }

  const runLimit = force && maxDownloads ? maxDownloads : Math.max(1, Math.min(targetAdds || 5, settings.dailyDownloadLimit));
  let downloaded = 0;
  let rejected = 0;
  const errors = [];
  const orderedQueries = sortQueriesNatureFirst(WHITELIST_QUERIES);

  for (let qi = 0; qi < orderedQueries.length && downloaded < runLimit; qi++) {
    const queryEntry = orderedQueries[qi];
    let candidates = [];
    try {
      candidates = await searchAllSources(env, queryEntry, 8, allowedSources);
    } catch (e) {
      errors.push(`${queryEntry.query}: ${e.message || String(e)}`);
      continue;
    }

    for (let ci = 0; ci < candidates.length && downloaded < runLimit; ci++) {
      const candidate = candidates[ci];
      const dedupeKey = `${candidate.source}:${candidate.sourcePhotoId}`;
      if (existingIds.has(dedupeKey)) continue;

      const metaCheck = validateCandidate(candidate, settings);
      if (!metaCheck.ok) {
        rejected += 1;
        syncState.totalRejected = (Number(syncState.totalRejected) || 0) + 1;
        continue;
      }

      const urls = buildVariantUrls(candidate.source, candidate.sourcePhotoId, candidate.raw);
      if (!urls?.full || !urls?.mobile || !urls?.thumb) {
        rejected += 1;
        continue;
      }

      try {
        const full = await downloadImage(urls.full);
        const binCheck = validateBinary(full.bytes, full.contentType);
        if (!binCheck.ok) {
          rejected += 1;
          continue;
        }
        const mobile = await downloadImage(urls.mobile);
        const thumb = await downloadImage(urls.thumb);
        if (!validateBinary(mobile.bytes, mobile.contentType).ok || !validateBinary(thumb.bytes, thumb.contentType).ok) {
          rejected += 1;
          continue;
        }

        const ext = urls.ext || "webp";
        const item = buildApprovedItem(candidate, { ext, fullBytes: full.bytes }, queryEntry, settings);
        if (!item.approved) {
          rejected += 1;
          continue;
        }

        const cat = queryEntry.category || "nature";
        const basePath = `${AUTO_BG_ROOT}/${cat}/${item.id}`;
        const files = [
          { variant: "full", path: `${basePath}.${ext}`, contentBase64: full.base64 },
          { variant: "mobile", path: `${basePath}-mobile.${ext}`, contentBase64: mobile.base64 },
          { variant: "thumb", path: `${basePath}-thumb.${ext}`, contentBase64: thumb.base64 }
        ];

        const saveResult = await saveFeedBackgroundEntry(env, {
          ...item,
          staging,
          files,
          approve: true
        }, helpersBag);

        if (saveResult?.item) {
          items.push(saveResult.item);
          existingIds.add(dedupeKey);
          downloaded += 1;
          syncState.dailyDownloadCount = (Number(syncState.dailyDownloadCount) || 0) + 1;
          syncState.totalDownloads = (Number(syncState.totalDownloads) || 0) + 1;
        }
      } catch (e) {
        errors.push(`${candidate.source}:${candidate.sourcePhotoId}: ${e.message || String(e)}`);
        rejected += 1;
      }
    }
  }

  syncState.lastSyncAt = now;
  syncState.lastRunDownloads = downloaded;
  syncState.lastRunRejected = rejected;
  syncState.lastRunErrors = errors.slice(0, 12);
  syncState.lastSyncStatus = errors.length && !downloaded ? "error" : downloaded ? "ok" : "partial";
  syncState.lastSyncError = errors[0] || "";
  syncState.nextSyncAt = new Date(Date.now() + DAILY_SYNC_MS).toISOString();

  await writeSyncIndex(env, helpersBag, {
    index,
    sha: "",
    path,
    settings,
    syncState,
    items,
    staging,
    skipItemsWrite: true
  });

  return {
    ok: true,
    downloaded,
    rejected,
    errors,
    status: getFeedBackgroundSyncStatus(
      { ...index, settings, syncState, items: await reloadItems(env, helpersBag, staging) },
      env
    )
  };
}

async function reloadItems(env, helpers, staging) {
  const { index } = await readFeedBackgroundsIndex(env, { staging }, helpers);
  return index.items || [];
}

async function writeSyncIndex(env, helpers, ctx) {
  const { index, sha, path, settings, syncState, items, staging, skipItemsWrite } = ctx;
  const now = nowIso();
  const payload = {
    version: Number(index?.version) || 1,
    updatedAt: now,
    cacheVersion: (Number(index?.cacheVersion) || 1) + (skipItemsWrite ? 0 : 1),
    settings: mergeSettings(settings),
    syncState: mergeSyncState(syncState),
    items: skipItemsWrite ? (index?.items || items || []) : (items || [])
  };

  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";

  let currentSha = sha;
  if (!currentSha) {
    try {
      const fresh = await readFeedBackgroundsIndex(env, { staging }, helpers);
      currentSha = fresh.sha || "";
      if (!skipItemsWrite) payload.items = fresh.index?.items || payload.items;
      payload.cacheVersion = (Number(fresh.index?.cacheVersion) || 1) + (skipItemsWrite ? 0 : 1);
    } catch (e) {
      currentSha = "";
    }
  }

  if (skipItemsWrite) {
    try {
      const fresh = await readFeedBackgroundsIndex(env, { staging }, helpers);
      payload.items = fresh.index?.items || payload.items;
      payload.cacheVersion = Number(fresh.index?.cacheVersion) || payload.cacheVersion;
      currentSha = fresh.sha || currentSha;
    } catch (e) {}
  }

  await helpers.githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    skipItemsWrite ? "Feed-BG sync state update" : "Feed-BG sync index update",
    branch,
    currentSha || undefined
  );
}

export async function cleanupFeedBackgroundPool(env, helpers, options = {}) {
  const staging = Boolean(options?.staging);
  const { index } = await readFeedBackgroundsIndex(env, { staging }, helpers);
  const items = index?.items || [];
  let removed = 0;
  for (const item of items) {
    if (!item?.autoSynced) continue;
    if (item.status === "deleted") continue;
    if (!item.approved || item.securityStatus === "blocked") {
      await deleteFeedBackgroundEntry(env, { id: item.id, hard: true, staging }, helpers);
      removed += 1;
    }
  }
  return { ok: true, removed, status: getFeedBackgroundSyncStatus(index, env) };
}

export async function blockFeedBackgroundImage(env, helpers, input) {
  const staging = Boolean(input?.staging);
  const id = String(input?.id || "").trim();
  if (!id) throw new Error("ID fehlt");
  const now = nowIso();
  const { index, sha, path } = await readFeedBackgroundsIndex(env, { staging }, helpers);
  const items = (index.items || []).map((x) => {
    if (!x || String(x.id) !== id) return x;
    return {
      ...x,
      approved: false,
      active: false,
      status: "disabled",
      securityStatus: "blocked",
      isIslamicallySafe: false,
      updatedAt: now,
      adminNote: String(input?.reason || "Manuell gesperrt")
    };
  });
  const payload = {
    ...index,
    updatedAt: now,
    cacheVersion: (Number(index.cacheVersion) || 1) + 1,
    items
  };
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  await helpers.githubPut(
    env, owner, repo, path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Block feed BG ${id}`,
    branch,
    sha || undefined
  );
  return { ok: true, id, status: getFeedBackgroundSyncStatus({ ...index, items }, env) };
}

export async function maybeAutoSyncFeedBackgrounds(env, helpers, options = {}) {
  const staging = options.staging !== false;
  const { index } = await readFeedBackgroundsIndex(env, { staging }, helpers);
  const settings = mergeSettings(index?.settings);
  if (!settings.autoDownloadEnabled) return { ok: true, skipped: true, reason: "disabled" };

  const approved = countApprovedPool(index?.items || []);
  if (approved >= settings.minPoolSize) {
    return { ok: true, skipped: true, reason: "pool-full", approved };
  }

  const syncState = mergeSyncState(index?.syncState);
  const lastSyncTs = Date.parse(syncState.lastSyncAt || "");
  const needsRefill = approved < settings.refillBelow;
  const dueDaily = !Number.isFinite(lastSyncTs) || Date.now() - lastSyncTs >= DAILY_SYNC_MS;
  const cooldownMs = needsRefill
    ? (approved < 10 ? 10 * 60 * 1000 : 30 * 60 * 1000)
    : 60 * 60 * 1000;

  if (!needsRefill && !dueDaily) {
    return { ok: true, skipped: true, reason: "not-due", approved };
  }
  if (Number.isFinite(lastSyncTs) && Date.now() - lastSyncTs < cooldownMs && !options.force) {
    return { ok: true, skipped: true, reason: "cooldown", approved };
  }

  return syncFeedBackgroundImages(env, helpers, {
    staging,
    force: Boolean(options.force || needsRefill)
  });
}

export async function ensureFeedBackgroundsFresh(env, helpers, options = {}) {
  const staging = options.staging !== false;
  return maybeAutoSyncFeedBackgrounds(env, helpers, {
    staging,
    force: Boolean(options.force)
  });
}
