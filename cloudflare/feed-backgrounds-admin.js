/**
 * Feed-Hintergrundbilder — kuratiert, Admin + öffentliche Auswahl
 */
import { DEFAULT_SETTINGS, isStrictFeedBgSafe } from "./feed-background-safety.js";

const DEFAULT_BG_JSON = "content/feed-backgrounds/feed-backgrounds.json";
const DEFAULT_STAGING_BG_JSON = "content/staging/feed-backgrounds/feed-backgrounds.json";
const ASSETS_BG_ROOT = "assets/feed-backgrounds";

const BG_CATEGORIES = new Set([
  "nature", "quran", "dua", "knowledge", "tawhid", "aqidah", "adab", "akhirah",
  "mosque", "books", "abstract", "gradients"
]);

const BG_STATUSES = new Set(["draft", "active", "disabled", "deleted"]);
const BG_SECURITY = new Set(["unchecked", "approved", "blocked", "warning"]);
const BG_ALLOWED_EXT = new Set(["webp", "jpg", "jpeg", "png", "avif"]);
const BG_MAX_BYTES = 2 * 1024 * 1024;

function bgJsonPath(env, staging) {
  const p = staging
    ? trimPath(env.STAGING_FEED_BG_JSON || DEFAULT_STAGING_BG_JSON)
    : trimPath(env.FEED_BG_JSON || DEFAULT_BG_JSON);
  return p;
}

function trimPath(path) {
  return String(path || "").replace(/^\/+/, "").replace(/\/+$/, "");
}

const DEFAULT_BG_SETTINGS = { ...DEFAULT_SETTINGS };

function explicitSafety(raw, key, legacyKey) {
  if (raw?.[key] === false) return false;
  if (raw?.[key] === true) return true;
  if (legacyKey && raw?.[legacyKey] === false) return false;
  if (legacyKey && raw?.[legacyKey] === true) return true;
  return null;
}

function emptyBgIndex() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    cacheVersion: 1,
    settings: { ...DEFAULT_BG_SETTINGS },
    syncState: {
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
    },
    items: []
  };
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "bg";
}

function normalizeAllowedFor(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || "feed").split(/[,;|]+/);
  return [...new Set(list.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean))];
}

function normalizeTags(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || "").split(/[,;|]+/);
  return [...new Set(list.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean))];
}

function normalizeBgItem(raw, nowIso) {
  const now = nowIso || new Date().toISOString();
  const id = String(raw?.id || "").trim();
  if (!id) return null;
  const category = BG_CATEGORIES.has(String(raw?.category || "").trim())
    ? String(raw.category).trim()
    : "nature";
  const status = BG_STATUSES.has(String(raw?.status || "").trim())
    ? String(raw.status).trim()
    : "draft";
  const securityStatus = BG_SECURITY.has(String(raw?.securityStatus || "").trim())
    ? String(raw.securityStatus).trim()
    : "unchecked";
  const approved = raw?.approved === true && securityStatus === "approved";
  const active = status === "active";
  const containsHumans = explicitSafety(raw, "containsHumans");
  const containsAnimals = explicitSafety(raw, "containsAnimals");
  const containsFaces = explicitSafety(raw, "containsFaces");
  const containsWatermark = explicitSafety(raw, "containsWatermark", "hasWatermark");
  const containsLogo = explicitSafety(raw, "containsLogo", "hasLogo");
  const containsTextOverlay = explicitSafety(raw, "containsTextOverlay", "hasTextOverlay");
  const hasWatermark = containsWatermark === true;
  const hasLogo = containsLogo === true;
  const hasTextOverlay = containsTextOverlay === true;
  const baseSafe = containsHumans === false && containsAnimals === false && containsFaces === false
    && containsWatermark === false && containsLogo === false && containsTextOverlay === false;
  const isIslamicallySafe = raw?.isIslamicallySafe === false ? false : approved && baseSafe;
  const fp = raw?.focusPoint && typeof raw.focusPoint === "object" ? raw.focusPoint : {};
  return {
    id,
    title: String(raw?.title || id).trim(),
    filename: String(raw?.filename || "").trim(),
    category,
    tags: normalizeTags(raw?.tags),
    topics: normalizeTags(raw?.topics),
    allowedFor: normalizeAllowedFor(raw?.allowedFor || ["feed"]),
    src: String(raw?.src || "").trim(),
    srcMobile: String(raw?.srcMobile || raw?.src || "").trim(),
    thumbnail: String(raw?.thumbnail || raw?.srcMobile || raw?.src || "").trim(),
    alt: String(raw?.alt || raw?.title || "").trim(),
    priority: Number.isFinite(Number(raw?.priority)) ? Number(raw.priority) : 5,
    active,
    approved,
    status,
    securityStatus,
    containsHumans,
    containsAnimals,
    containsFaces,
    containsBodyParts: explicitSafety(raw, "containsBodyParts"),
    containsNudity: explicitSafety(raw, "containsNudity"),
    containsBirds: explicitSafety(raw, "containsBirds"),
    containsWildlife: explicitSafety(raw, "containsWildlife"),
    containsPets: explicitSafety(raw, "containsPets"),
    containsInsects: explicitSafety(raw, "containsInsects"),
    containsFish: explicitSafety(raw, "containsFish"),
    containsWatermark,
    containsLogo,
    containsTextOverlay,
    containsCross: explicitSafety(raw, "containsCross"),
    containsChurch: explicitSafety(raw, "containsChurch"),
    isLowQuality: explicitSafety(raw, "isLowQuality"),
    isBlurred: explicitSafety(raw, "isBlurred"),
    isTooBusy: explicitSafety(raw, "isTooBusy"),
    hasWatermark,
    hasLogo,
    hasTextOverlay,
    isIslamicallySafe,
    qualityScore: Number.isFinite(Number(raw?.qualityScore)) ? Number(raw.qualityScore) : 0,
    source: String(raw?.source || "").trim(),
    sourcePhotoId: String(raw?.sourcePhotoId || "").trim(),
    sourceUrl: String(raw?.sourceUrl || "").trim(),
    license: String(raw?.license || "").trim(),
    downloadedAt: String(raw?.downloadedAt || "").trim(),
    autoSynced: raw?.autoSynced === true,
    rejectionReasons: Array.isArray(raw?.rejectionReasons) ? raw.rejectionReasons : [],
    dominantColor: String(raw?.dominantColor || "").trim(),
    overlayHint: String(raw?.overlayHint || "dark").trim(),
    focusPoint: {
      x: Number.isFinite(Number(fp.x)) ? Math.max(0, Math.min(100, Number(fp.x))) : 50,
      y: Number.isFinite(Number(fp.y)) ? Math.max(0, Math.min(100, Number(fp.y))) : 50
    },
    createdAt: String(raw?.createdAt || now).trim(),
    updatedAt: String(raw?.updatedAt || now).trim(),
    adminNote: String(raw?.adminNote || "").trim()
  };
}

export function isFeedBgSelectable(item) {
  return isStrictFeedBgSafe(item, DEFAULT_BG_SETTINGS);
}

function sanitizePublicBgItem(item) {
  if (!item) return null;
  const {
    sourceUrl,
    sourcePhotoId,
    source,
    license,
    adminNote,
    rejectionReasons,
    autoSynced,
    downloadedAt,
    ...rest
  } = item;
  return rest;
}

export async function readFeedBackgroundsIndex(env, options, helpers) {
  const staging = Boolean(options?.staging);
  const path = bgJsonPath(env, staging);
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  let file = null;
  try {
    file = await helpers.githubGet(env, owner, repo, path, branch);
  } catch (e) {
    file = null;
  }
  const parsed = file?.content ? JSON.parse(helpers.base64ToUtf8(file.content)) : emptyBgIndex();
  const items = (Array.isArray(parsed?.items) ? parsed.items : [])
    .map((x) => normalizeBgItem(x))
    .filter(Boolean);
  const defaults = emptyBgIndex();
  return {
    index: {
      version: Number(parsed?.version) || 1,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
      cacheVersion: Number(parsed?.cacheVersion) || 1,
      settings: { ...defaults.settings, ...(parsed?.settings && typeof parsed.settings === "object" ? parsed.settings : {}) },
      syncState: { ...defaults.syncState, ...(parsed?.syncState && typeof parsed.syncState === "object" ? parsed.syncState : {}) },
      items
    },
    sha: file?.sha || "",
    path
  };
}

export function buildPublicFeedBackgroundsResponse(index, { admin = false } = {}) {
  const items = (index?.items || [])
    .filter((item) => (admin ? item.status !== "deleted" : isFeedBgSelectable(item)))
    .map((item) => (admin ? { ...item } : sanitizePublicBgItem(item)))
    .filter(Boolean);
  return {
    ok: true,
    version: index?.version || 1,
    cacheVersion: index?.cacheVersion || 1,
    updatedAt: index?.updatedAt || new Date().toISOString(),
    items,
    count: items.length
  };
}

function bgError(message, status) {
  const err = new Error(message);
  err.status = status || 400;
  return err;
}

function estimateBase64Bytes(base64) {
  const clean = String(base64 || "").replace(/\s+/g, "");
  if (!clean) return 0;
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function normalizeUploadFiles(raw, category, slug) {
  const list = Array.isArray(raw) ? raw : [];
  const cat = BG_CATEGORIES.has(String(category || "").trim()) ? String(category).trim() : "nature";
  const base = slugify(slug || cat);
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i] || {};
    let path = trimPath(String(item.path || "").trim());
    const contentBase64 = String(item.contentBase64 || item.base64 || "").replace(/\s+/g, "");
    const variant = String(item.variant || "full").trim();
    if (!contentBase64) continue;
    if (!path) {
      const suffix = variant === "thumb" ? "-thumb" : variant === "mobile" ? "-mobile" : "";
      path = `${ASSETS_BG_ROOT}/${cat}/${base}${suffix}.webp`;
    }
    if (!path.startsWith(`${ASSETS_BG_ROOT}/`)) {
      throw bgError(`Upload ${i + 1}: Pfad muss mit ${ASSETS_BG_ROOT}/ beginnen`, 400);
    }
    const ext = path.split(".").pop()?.toLowerCase() || "";
    if (!BG_ALLOWED_EXT.has(ext)) throw bgError(`Upload ${i + 1}: .${ext} nicht erlaubt`, 400);
    const bytes = estimateBase64Bytes(contentBase64);
    if (bytes <= 0) throw bgError(`Upload ${i + 1}: leer`, 400);
    if (bytes > BG_MAX_BYTES) throw bgError(`Upload ${i + 1}: max. 2 MB`, 400);
    out.push({ path, contentBase64, binary: true, variant });
  }
  return out;
}

export async function saveFeedBackgroundEntry(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readFeedBackgroundsIndex(env, { staging }, helpers);
  const incoming = normalizeBgItem({ ...input, updatedAt: nowIso }, nowIso);
  if (!incoming?.id) throw bgError("ID fehlt", 400);
  if (!incoming.title) throw bgError("Titel fehlt", 400);
  if (!incoming.createdAt) incoming.createdAt = nowIso;

  if (input?.approve === true) {
    if (incoming.containsHumans || incoming.containsAnimals || incoming.containsFaces) {
      throw bgError("Freigabe blockiert: Menschen/Tiere/Gesichter markiert", 400);
    }
    incoming.approved = true;
    incoming.securityStatus = "approved";
    incoming.active = true;
    incoming.status = "active";
  }

  const uploadFiles = normalizeUploadFiles(input?.files, incoming.category, incoming.id);
  if (uploadFiles.length) {
    const byVariant = {};
    uploadFiles.forEach((f) => {
      byVariant[f.variant || "full"] = `/${f.path}`;
    });
    if (byVariant.full) incoming.src = byVariant.full;
    if (byVariant.mobile) incoming.srcMobile = byVariant.mobile;
    if (byVariant.thumb) incoming.thumbnail = byVariant.thumb;
    if (!incoming.src && byVariant.mobile) incoming.src = byVariant.mobile;
    if (!incoming.thumbnail && incoming.srcMobile) incoming.thumbnail = incoming.srcMobile;
  }

  const items = (index.items || []).filter((x) => x && x.id !== incoming.id);
  items.push(incoming);
  const cacheVersion = (Number(index.cacheVersion) || 1) + 1;
  const payload = {
    version: 1,
    updatedAt: nowIso,
    cacheVersion,
    settings: index.settings || emptyBgIndex().settings,
    syncState: index.syncState || emptyBgIndex().syncState,
    items: items.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
  };

  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";

  if (uploadFiles.length && helpers.githubCommitBatch) {
    const fileEntries = uploadFiles.map((f) => ({
      path: f.path,
      contentBase64: f.contentBase64,
      binary: true
    }));
    fileEntries.push({ path, content: `${JSON.stringify(payload, null, 2)}\n` });
    const batch = await helpers.githubCommitBatch(
      env,
      owner,
      repo,
      branch,
      fileEntries,
      `Feed-BG ${incoming.id}${staging ? " (staging)" : ""}`
    );
    return { ok: true, item: incoming, path, staging, cacheVersion, commitSha: batch?.commitSha || "" };
  }

  const saved = await helpers.githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Save feed background ${incoming.id}${staging ? " (staging)" : ""}`,
    branch,
    sha
  );
  return { ok: true, item: incoming, path, staging, cacheVersion, commitSha: saved?.commit?.sha || "" };
}

export async function deleteFeedBackgroundEntry(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const id = String(input?.id || "").trim();
  if (!id) throw bgError("ID fehlt", 400);
  const hard = Boolean(input?.hard);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readFeedBackgroundsIndex(env, { staging }, helpers);
  const found = (index.items || []).find((x) => x && String(x.id) === id);
  if (!found) throw bgError(`Hintergrund nicht gefunden: ${id}`, 404);
  const nextItems = hard
    ? (index.items || []).filter((x) => x && String(x.id) !== id)
    : (index.items || []).map((x) =>
        x && String(x.id) === id
          ? {
              ...x,
              status: "deleted",
              active: false,
              approved: false,
              securityStatus: "blocked",
              updatedAt: nowIso
            }
          : x
      );
  const cacheVersion = (Number(index.cacheVersion) || 1) + 1;
  const payload = {
    version: 1,
    updatedAt: nowIso,
    cacheVersion,
    settings: index.settings || emptyBgIndex().settings,
    syncState: index.syncState || emptyBgIndex().syncState,
    items: nextItems
  };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    hard ? `Delete feed BG ${id}` : `Disable feed BG ${id}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return { ok: true, id, hard, path, staging, cacheVersion, commitSha: saved?.commit?.sha || "" };
}

export { BG_CATEGORIES, ASSETS_BG_ROOT };
