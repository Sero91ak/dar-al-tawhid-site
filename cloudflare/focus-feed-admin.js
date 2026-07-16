/**
 * Focus-Feed-Index — Cloudflare Worker (Admin + öffentliche Filterung)
 */
const DEFAULT_FEED_PATH = "content/focus-feed/feed-index.json";
const DEFAULT_STAGING_FEED_PATH = "content/staging/focus-feed/feed-index.json";

const FEED_STATUSES = new Set(["draft", "live", "expired", "deleted"]);
const FEED_TYPES = new Set(["post", "dua", "quran", "news", "prayer", "category", "series", "manual"]);
const CARD_SIZES = new Set(["premium", "medium", "mini"]);
const TARGET_TYPES = new Set(["none", "post", "dua", "quran", "news", "category", "prayer", "external"]);

function feedPath(env, staging) {
  if (staging) return trimPath(env.STAGING_FEED_PATH || DEFAULT_STAGING_FEED_PATH);
  return trimPath(env.FEED_PATH || DEFAULT_FEED_PATH);
}

function trimPath(path) {
  return String(path || "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function emptyFeedIndex() {
  return { version: 1, updatedAt: new Date().toISOString(), items: [] };
}

function normalizeFeedItem(raw, nowIso) {
  const now = nowIso || new Date().toISOString();
  const id = String(raw?.id || "").trim();
  if (!id) return null;
  const status = FEED_STATUSES.has(String(raw?.status || "").trim()) ? String(raw.status).trim() : "draft";
  const type = FEED_TYPES.has(String(raw?.type || "").trim()) ? String(raw.type).trim() : "manual";
  const cardSize = CARD_SIZES.has(String(raw?.cardSize || "").trim()) ? String(raw.cardSize).trim() : "medium";
  const targetType = TARGET_TYPES.has(String(raw?.targetType || "").trim()) ? String(raw.targetType).trim() : "none";
  return {
    id,
    title: String(raw?.title || "").trim(),
    preview: String(raw?.preview || raw?.text || "").trim(),
    category: String(raw?.category || "").trim(),
    scholar: String(raw?.scholar || "").trim(),
    book: String(raw?.book || "").trim(),
    type,
    cardSize,
    imageUrl: String(raw?.imageUrl || "").trim(),
    thumbnailUrl: String(raw?.thumbnailUrl || raw?.imageUrl || "").trim(),
    gradientFrom: String(raw?.gradientFrom || "#243628").trim(),
    gradientTo: String(raw?.gradientTo || "#0a100c").trim(),
    icon: String(raw?.icon || "✦").trim(),
    targetType,
    targetId: String(raw?.targetId || "").trim(),
    targetUrl: String(raw?.targetUrl || "").trim(),
    badgeNeu: raw?.badgeNeu === true || raw?.badge === "neu",
    badgeEmpfohlen: raw?.badgeEmpfohlen === true || raw?.badge === "empfohlen",
    badgeWichtig: raw?.badgeWichtig === true || raw?.badge === "wichtig",
    dateLabel: String(raw?.dateLabel || "").trim(),
    startsAt: String(raw?.startsAt || now).trim(),
    expiresAt: raw?.expiresAt == null ? null : String(raw.expiresAt || "").trim() || null,
    status,
    createdAt: String(raw?.createdAt || now).trim(),
    updatedAt: String(raw?.updatedAt || now).trim(),
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : 0,
      pinned: Boolean(raw?.pinned),
      bgType: String(raw?.bgType || "").trim(),
      imageSafe: raw?.imageSafe !== false,
      imageGradient: raw?.bgType === "gradient" || raw?.imageGradient === true,
      backgroundId: String(raw?.backgroundId || "").trim(),
      backgroundMode: String(raw?.backgroundMode || (raw?.bgType === "gradient" ? "gradient" : "auto")).trim(),
      backgroundSafe: raw?.backgroundSafe !== false,
      topic: String(raw?.topic || "").trim()
    };
  }

function isFeedPublic(item, nowMs) {
  if (!item || item.status !== "live") return false;
  const starts = Date.parse(item.startsAt || "");
  if (Number.isFinite(starts) && starts > nowMs) return false;
  if (item.expiresAt) {
    const exp = Date.parse(item.expiresAt);
    if (Number.isFinite(exp) && exp <= nowMs) return false;
  }
  return true;
}

function sortFeedItems(items) {
  return [...(items || [])].sort((a, b) => {
    const pin = Number(Boolean(b?.pinned)) - Number(Boolean(a?.pinned));
    if (pin) return pin;
    const ord = Number(a?.order || 0) - Number(b?.order || 0);
    if (ord) return ord;
    return Date.parse(b?.updatedAt || b?.createdAt || 0) - Date.parse(a?.updatedAt || a?.createdAt || 0);
  });
}

export async function readFeedIndex(env, options, helpers) {
  const staging = Boolean(options?.staging);
  const path = feedPath(env, staging);
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const file = await helpers.githubGet(env, owner, repo, path, branch);
  const parsed = file?.content ? JSON.parse(helpers.base64ToUtf8(file.content)) : emptyFeedIndex();
  const items = (Array.isArray(parsed?.items) ? parsed.items : []).map((x) => normalizeFeedItem(x)).filter(Boolean);
  return {
    index: { version: 1, updatedAt: parsed?.updatedAt || new Date().toISOString(), items },
    sha: file?.sha || "",
    path
  };
}

export function filterPublicFeed(index) {
  const now = Date.now();
  return sortFeedItems((index?.items || []).filter((item) => isFeedPublic(item, now)));
}

export async function saveFeedEntry(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readFeedIndex(env, { staging }, helpers);
  const incoming = normalizeFeedItem({ ...input, updatedAt: nowIso }, nowIso);
  if (!incoming?.title) throw feedError("Titel fehlt", 400);
  if (input?.status && FEED_STATUSES.has(String(input.status))) incoming.status = String(input.status);
  if (!incoming.createdAt) incoming.createdAt = nowIso;
  if (incoming.status === "live") {
    if (!incoming.title) throw feedError("Titel fehlt für Live-Karte", 400);
    const tt = incoming.targetType || "none";
    const hasTarget =
      tt === "prayer" ||
      (tt === "external" && incoming.targetUrl) ||
      (tt !== "none" && tt !== "external" && incoming.targetId);
    if (!hasTarget) throw feedError("Live-Karte braucht ein gültiges Ziel (targetType + targetId/URL)", 400);
  }
  const items = (index.items || []).filter((x) => x && x.id !== incoming.id);
  items.push(incoming);
  const payload = { version: 1, updatedAt: nowIso, items: sortFeedItems(items) };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Save feed card ${incoming.id}${staging ? " (staging)" : ""}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return { ok: true, item: incoming, path, staging, commitSha: saved?.commit?.sha || "" };
}

export async function deleteFeedEntry(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const id = String(input?.id || "").trim();
  if (!id) throw feedError("Feed-ID fehlt", 400);
  const hard = Boolean(input?.hard);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readFeedIndex(env, { staging }, helpers);
  if (!(index.items || []).some((x) => x && String(x.id) === id)) throw feedError(`Feed-Karte nicht gefunden: ${id}`, 404);
  const nextItems = hard
    ? (index.items || []).filter((x) => x && String(x.id) !== id)
    : (index.items || []).map((x) =>
        x && String(x.id) === id ? { ...x, status: "deleted", updatedAt: nowIso, expiresAt: nowIso } : x
      );
  const payload = { version: 1, updatedAt: nowIso, items: nextItems };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    hard ? `Delete feed ${id}` : `Archive feed ${id}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return { ok: true, id, hard, path, staging, commitSha: saved?.commit?.sha || "" };
}

export async function reorderFeedItems(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const orderList = Array.isArray(input?.order) ? input.order.map(String) : [];
  if (!orderList.length) throw feedError("Reihenfolge fehlt", 400);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readFeedIndex(env, { staging }, helpers);
  const map = new Map((index.items || []).map((item) => [String(item.id), item]));
  orderList.forEach((id, idx) => {
    const item = map.get(String(id));
    if (item) {
      item.order = idx;
      item.updatedAt = nowIso;
    }
  });
  const payload = { version: 1, updatedAt: nowIso, items: sortFeedItems([...map.values()]) };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Reorder feed${staging ? " (staging)" : ""}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return { ok: true, path, staging, count: orderList.length, commitSha: saved?.commit?.sha || "" };
}

export function buildPublicFeedResponse(index) {
  const items = filterPublicFeed(index).map((item) => ({ ...item }));
  return { ok: true, items, count: items.length, fetchedAt: new Date().toISOString() };
}

function feedError(message, status) {
  const err = new Error(message);
  err.status = status || 400;
  return err;
}
