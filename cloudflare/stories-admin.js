/**
 * Story-Index — Server-Logik für Cloudflare Worker (Admin + öffentliche Filterung)
 */
const DEFAULT_STORIES_PATH = "content/stories/stories-index.json";
const DEFAULT_STAGING_STORIES_PATH = "content/staging/stories/stories-index.json";

const STORY_STATUSES = new Set(["draft", "live", "expired", "deleted"]);
const STORY_TYPES = new Set(["news", "post", "dua", "quran", "prayer", "manual"]);
const TARGET_TYPES = new Set(["none", "post", "dua", "quran", "category", "external"]);
const VISIBILITY_PRESETS = {
  "24h": 24,
  "48h": 48,
  "7d": 168,
  permanent: null
};

function storiesPath(env, staging) {
  if (staging) return trimStoriesPath(env.STAGING_STORIES_PATH || DEFAULT_STAGING_STORIES_PATH);
  return trimStoriesPath(env.STORIES_PATH || DEFAULT_STORIES_PATH);
}

function trimStoriesPath(path) {
  return String(path || "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function emptyStoriesIndex() {
  return { version: 1, updatedAt: new Date().toISOString(), items: [] };
}

function normalizeStoryItem(raw, nowIso) {
  const now = nowIso || new Date().toISOString();
  const id = String(raw?.id || "").trim();
  if (!id) return null;
  const status = STORY_STATUSES.has(String(raw?.status || "").trim())
    ? String(raw.status).trim()
    : "draft";
  const type = STORY_TYPES.has(String(raw?.type || "").trim()) ? String(raw.type).trim() : "manual";
  const targetType = TARGET_TYPES.has(String(raw?.targetType || "").trim())
    ? String(raw.targetType).trim()
    : "none";
  const text = String(raw?.text || "").trim();
  const durationSec = Number(raw?.durationSec || 0);
  return {
    id,
    title: String(raw?.title || "").trim(),
    category: String(raw?.category || "Allgemein").trim(),
    text,
    type,
    imageUrl: String(raw?.imageUrl || "").trim(),
    thumbnailUrl: String(raw?.thumbnailUrl || raw?.imageUrl || "").trim(),
    gradientFrom: String(raw?.gradientFrom || raw?.gradient?.from || "#1a2f24").trim(),
    gradientTo: String(raw?.gradientTo || raw?.gradient?.to || "#0b1210").trim(),
    icon: String(raw?.icon || "✦").trim(),
    targetType,
    targetId: String(raw?.targetId || "").trim(),
    targetUrl: String(raw?.targetUrl || "").trim(),
    startsAt: String(raw?.startsAt || now).trim(),
    expiresAt: raw?.expiresAt == null ? null : String(raw.expiresAt || "").trim() || null,
    status,
    createdAt: String(raw?.createdAt || now).trim(),
    updatedAt: String(raw?.updatedAt || now).trim(),
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : 0,
    pinned: Boolean(raw?.pinned),
    theme: String(raw?.theme || "gold").trim(),
    durationSec: durationSec >= 8 ? 10 : 7,
    visibility: String(raw?.visibility || "").trim()
  };
}

function computeExpiresAt(visibility, baseDate) {
  const key = String(visibility || "24h").trim();
  const hours = Object.prototype.hasOwnProperty.call(VISIBILITY_PRESETS, key)
    ? VISIBILITY_PRESETS[key]
    : VISIBILITY_PRESETS["24h"];
  if (hours == null) return null;
  const base = baseDate instanceof Date ? baseDate : new Date(baseDate || Date.now());
  return new Date(base.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function storyDurationMs(story) {
  const sec = Number(story?.durationSec || 0);
  return (sec >= 10 ? 10 : 7) * 1000;
}

function isStoryPubliclyVisible(story, nowMs) {
  if (!story || story.status !== "live") return false;
  const starts = Date.parse(story.startsAt || "");
  if (Number.isFinite(starts) && starts > nowMs) return false;
  if (story.expiresAt) {
    const expires = Date.parse(story.expiresAt);
    if (Number.isFinite(expires) && expires <= nowMs) return false;
  }
  return true;
}

function sortStoriesForDisplay(items) {
  return [...(items || [])].sort((a, b) => {
    const pinDiff = Number(Boolean(b?.pinned)) - Number(Boolean(a?.pinned));
    if (pinDiff) return pinDiff;
    const orderDiff = Number(a?.order || 0) - Number(b?.order || 0);
    if (orderDiff) return orderDiff;
    return Date.parse(b?.updatedAt || b?.createdAt || 0) - Date.parse(a?.updatedAt || a?.createdAt || 0);
  });
}

export async function readStoriesIndex(env, options, helpers) {
  const staging = Boolean(options?.staging);
  const path = storiesPath(env, staging);
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const file = await helpers.githubGet(env, owner, repo, path, branch);
  const parsed = file?.content ? JSON.parse(helpers.base64ToUtf8(file.content)) : emptyStoriesIndex();
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const normalized = items.map((item) => normalizeStoryItem(item)).filter(Boolean);
  return {
    index: { version: 1, updatedAt: parsed?.updatedAt || new Date().toISOString(), items: normalized },
    sha: file?.sha || "",
    path
  };
}

export function filterPublicStories(index, nowMs) {
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const visible = (index?.items || []).filter((story) => isStoryPubliclyVisible(story, now));
  return sortStoriesForDisplay(visible);
}

export async function saveStoryEntry(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const now = new Date();
  const nowIso = now.toISOString();
  const { index, sha, path } = await readStoriesIndex(env, { staging }, helpers);
  const incoming = normalizeStoryItem({ ...input, updatedAt: nowIso }, nowIso);
  if (!incoming?.title) throw httpStoryError("Story-Titel fehlt", 400);
  if (!incoming?.text) throw httpStoryError("Story-Text fehlt", 400);

  const visibility = String(input?.visibility || incoming.visibility || "24h").trim();
  incoming.visibility = visibility;
  if (input?.expiresAt !== undefined) {
    incoming.expiresAt = input.expiresAt ? String(input.expiresAt) : null;
  } else if (visibility && incoming.status === "live" && !incoming.expiresAt) {
    incoming.expiresAt = computeExpiresAt(visibility, now);
  }
  if (!incoming.createdAt) incoming.createdAt = nowIso;
  if (input?.status && STORY_STATUSES.has(String(input.status))) incoming.status = String(input.status);
  if (Number(input?.durationSec) >= 10 || (incoming.text || "").length > 180) incoming.durationSec = 10;

  const items = Array.isArray(index.items) ? index.items.filter((x) => x && x.id !== incoming.id) : [];
  items.push(incoming);
  const payload = {
    version: 1,
    updatedAt: nowIso,
    items: sortStoriesForDisplay(items)
  };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Save story ${incoming.id}${staging ? " (staging)" : ""}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return {
    ok: true,
    story: incoming,
    path,
    staging,
    commitSha: saved?.commit?.sha || ""
  };
}

export async function deleteStoryEntry(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const id = String(input?.id || "").trim();
  if (!id) throw httpStoryError("Story-ID fehlt", 400);
  const hard = Boolean(input?.hard);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readStoriesIndex(env, { staging }, helpers);
  const found = (index.items || []).find((item) => item && String(item.id) === id);
  if (!found) throw httpStoryError(`Story nicht gefunden: ${id}`, 404);

  let nextItems;
  if (hard) {
    nextItems = (index.items || []).filter((item) => item && String(item.id) !== id);
  } else {
    nextItems = (index.items || []).map((item) => {
      if (!item || String(item.id) !== id) return item;
      return { ...item, status: "deleted", updatedAt: nowIso, expiresAt: nowIso };
    });
  }

  const payload = {
    version: 1,
    updatedAt: nowIso,
    items: nextItems
  };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    hard ? `Delete story ${id}` : `Archive story ${id}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return { ok: true, id, hard, path, staging, commitSha: saved?.commit?.sha || "" };
}

export async function reorderStories(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const orderList = Array.isArray(input?.order) ? input.order.map(String) : [];
  if (!orderList.length) throw httpStoryError("Reihenfolge fehlt", 400);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readStoriesIndex(env, { staging }, helpers);
  const map = new Map((index.items || []).map((item) => [String(item.id), item]));
  orderList.forEach((id, idx) => {
    const item = map.get(String(id));
    if (item) {
      item.order = idx;
      item.updatedAt = nowIso;
    }
  });
  const payload = {
    version: 1,
    updatedAt: nowIso,
    items: sortStoriesForDisplay([...map.values()])
  };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Reorder stories${staging ? " (staging)" : ""}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return { ok: true, path, staging, count: orderList.length, commitSha: saved?.commit?.sha || "" };
}

export function buildPublicStoriesResponse(index) {
  const items = filterPublicStories(index).map((story) => ({
    id: story.id,
    title: story.title,
    category: story.category,
    text: story.text,
    type: story.type,
    imageUrl: story.imageUrl,
    thumbnailUrl: story.thumbnailUrl,
    gradientFrom: story.gradientFrom,
    gradientTo: story.gradientTo,
    icon: story.icon,
    targetType: story.targetType,
    targetId: story.targetId,
    targetUrl: story.targetUrl,
    order: story.order,
    pinned: story.pinned,
    theme: story.theme,
    durationSec: story.durationSec,
    updatedAt: story.updatedAt
  }));
  return { ok: true, items, count: items.length, fetchedAt: new Date().toISOString() };
}

function httpStoryError(message, status) {
  const err = new Error(message);
  err.status = status || 400;
  return err;
}

function slugifyStoryId(title) {
  return String(title || "story")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildStoryId(title, existingIds) {
  const base = slugifyStoryId(title) || "story";
  const stamp = Date.now().toString(36);
  let id = `${base}-${stamp}`;
  const used = new Set(existingIds || []);
  let n = 1;
  while (used.has(id)) {
    id = `${base}-${stamp}-${n++}`;
  }
  return id;
}

export { storyDurationMs, isStoryPubliclyVisible, sortStoriesForDisplay, VISIBILITY_PRESETS };
