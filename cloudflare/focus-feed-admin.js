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

const FRAUEN_NEUFOKUS_16_ID = "neufokus-frauenwissen-16-20261118";
const FRAUEN_NEUFOKUS_DURATION = 48 * 60 * 60 * 1000;
// This batch-specific rule uses the EXISTING Admin write gate and preserves all
// other Feed entries. It never grants source, push or translation approval.
async function verifyFrauenNeufokusPublication(env, helpers) {
  const owner = env.GITHUB_OWNER || "Sero91ak", repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const get = async (filePath) => {
    const file = await helpers.githubGet(env, owner, repo, filePath, branch);
    if (!file?.content) throw feedError("Frauen-Neufokus: Quelldatei nicht verfügbar: " + filePath, 409);
    try{return JSON.parse(helpers.base64ToUtf8(file.content))}
    catch(_){throw feedError("Frauen-Neufokus: Quelldatei nicht lesbar: " + filePath, 409)}
  };
  const [batch, focus, locales] = await Promise.all([
    get("content/admin/frauen-batch-16-2026-11-18.json"),
    get("assets/frauen/frauen-neufokus-v1.json"),
    get("assets/frauen/frauen-entry-locales-v1.json")
  ]);
  if(batch.state !== "published-live-verified" ||
    batch.records?.length !== 16 || focus.items?.length !== 16 ||
    focus.focusId !== FRAUEN_NEUFOKUS_16_ID) {
    throw feedError("Frauen-Neufokus: 16er-Sammelveröffentlichung nicht vollständig live bestätigt", 409);
  }
  const ids = new Set(batch.records.map(x=>x.id));
  if(ids.size !== 16 || focus.items.some(row => !ids.has(row.id)) ||
     batch.records.some(row=>row.sourceReview!=="approved" ||
       row.translationReview!=="approved" || row.uiQa!=="passed" || row.publishQa!=="passed")) {
    throw feedError("Frauen-Neufokus: Quellen-, Sprach-, Geräte- oder Live-Freigabe fehlt", 409);
  }
  if(!Array.isArray(locales.entryIds))throw feedError("Frauen-Neufokus: Sprachkatalog fehlt",409);
  const codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
  for(const row of batch.records){
    if(!locales.entryIds.includes(row.id)||locales.entries?.[row.id]?.sourceUrl!==row.sourceUrl ||
      codes.some(code=>{
        const e=locales.entries?.[row.id]?.locales?.[code];
        return !e || !e.title || !e.statement || !e.lesson || !e.sharh || !e.source;
      })){throw feedError("Frauen-Neufokus: Sprachfassung oder Quellennachweis fehlt",409)}
  }
  const paths=[...new Set(batch.records.map(x=>x.sourceFile))];
  if(paths.length!==3 || paths.some(p=>!/^data\/frauen-[a-z0-9-]+\.json$/.test(p)))
    throw feedError("Frauen-Neufokus: unerwartete Beitragsdateien",409);
  const data=await Promise.all(paths.map(get));
  for(const row of batch.records){
    const parent=data[paths.indexOf(row.sourceFile)];
    const matches=(parent?.eintraege||[]).filter(e=>e.kennung===row.id);
    if(matches.length!==1 || matches[0].quellenstatus!=="geprueft" ||
       matches[0].freigabeDurchSerhat!==true ||
       matches[0].quellePrimaerId!==row.sourceId ||
       matches[0].direktnachweisUrl!==row.sourceUrl) {
       throw feedError("Frauen-Neufokus: Originalbericht noch nicht freigegeben: "+row.id,409);
    }
  }
}

export async function saveFeedEntry(env, input, helpers) {
  const staging = Boolean(input?.staging);
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readFeedIndex(env, { staging }, helpers);
  const incoming = normalizeFeedItem({ ...input, updatedAt: nowIso }, nowIso);
  if (!incoming?.title) throw feedError("Titel fehlt", 400);
  if (input?.status && FEED_STATUSES.has(String(input.status))) incoming.status = String(input.status);
  if (!incoming.createdAt) incoming.createdAt = nowIso;
  if (incoming.id === FRAUEN_NEUFOKUS_16_ID && incoming.status === "live") {
    if(incoming.targetType!=="category" || incoming.targetId!=="frauen" ||
       incoming.targetUrl!=="frauen") {
       throw feedError("Frauen-Neufokus: Ziel muss der originale Frauenbereich sein", 400);
    }
    await verifyFrauenNeufokusPublication(env, helpers);
    // The clock starts on FIRST successful Admin publication. Re-saving must
    // never prolong the 48-hour visibility window.
    const previous=(index.items||[]).find(item=>item?.id===FRAUEN_NEUFOKUS_16_ID);
    const first=previous?.status==="live" ? Date.parse(previous.startsAt||"") : NaN;
    const start=Number.isFinite(first)?first:Date.parse(nowIso);
    incoming.startsAt=new Date(start).toISOString();
    incoming.expiresAt=new Date(start+FRAUEN_NEUFOKUS_DURATION).toISOString();
    incoming.visibility="48h";
  }
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
