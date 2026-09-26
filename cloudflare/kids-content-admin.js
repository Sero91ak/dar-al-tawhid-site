/**
 * DĀR AL TAWḤĪD Content Studio — gemeinsames Paketmodell für Kids/iOS.
 * Staging wird von /test/kids/ konsumiert. Live wird erst nach explizitem Publish befüllt.
 */
const DEFAULT_STAGING_PATH = "content/staging/kids/content-index.json";
const DEFAULT_LIVE_PATH = "content/kids/content-index.json";

const KINDS = new Set(["story", "quiz", "game", "lesson"]);
const STATUSES = new Set(["draft", "review", "published", "archived"]);
const TARGETS = new Set(["kids", "ios", "both"]);

function clean(value, max = 10000) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function asArray(value, limit = 100) {
  return Array.isArray(value)
    ? value.map((x) => clean(x, 500)).filter(Boolean).slice(0, limit)
    : [];
}

function normalizeQuestionBank(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [ageKey, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== "object") continue;
    const answers = Array.isArray(raw.answers)
      ? raw.answers.slice(0, 6).map((a) => ({
          label: clean(a?.label, 240),
          correct: Boolean(a?.correct)
        })).filter((a) => a.label)
      : [];
    const question = clean(raw.question, 600);
    if (!question || !answers.length) continue;
    out[clean(ageKey, 20)] = {
      question,
      answers,
      success: clean(raw.success, 700),
      retry: clean(raw.retry, 700)
    };
  }
  return out;
}

function normalizeQuiz(raw) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const questions = Array.isArray(src.questions) ? src.questions.slice(0, 100).map((q) => {
    const answers = Array.isArray(q?.answers) ? q.answers.slice(0, 6).map((a) => ({ label: clean(a?.label || a?.text, 300), correct: Boolean(a?.correct) })).filter((a) => a.label) : [];
    return {
      question: clean(q?.question, 700),
      answers,
      success: clean(q?.success || "Richtig.", 700),
      retry: clean(q?.retry || "Versuche es noch einmal.", 700)
    };
  }).filter((q) => q.question && q.answers.length >= 2) : [];
  return { questions };
}

function normalizeGame(raw) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    type: clean(src.type || "choice", 80),
    summary: clean(src.summary, 700),
    instructions: clean(src.instructions, 5000),
    voiceCues: asArray(src.voiceCues, 120)
  };
}

function normalizeProduction(raw) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const allowed = new Set(["draft","producing","awaiting-qa","ready","test-published","live-published","error"]);
  const phase = clean(src.phase || "draft", 40);
  return { phase: allowed.has(phase) ? phase : "draft", error: clean(src.error, 900) };
}
function normalizeAsset(raw, type) {
  const obj = raw && typeof raw === "object" ? raw : {};
  return {
    url: clean(obj.url, 1600),
    key: clean(obj.key || obj.assetKey || obj.r2Key, 600),
    mime: clean(obj.mime, 120),
    sha256: clean(obj.sha256, 100),
    bytes: Math.max(0, Number(obj.bytes || 0) || 0),
    source: clean(obj.source || "studio", 80),
    type
  };
}

function normalizeModes(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    read: source.read !== false,
    listen: source.listen !== false
  };
}

export function normalizeKidsContentItem(raw, nowIso = new Date().toISOString()) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id = clean(source.id, 90);
  if (!id) return null;

  const kind = KINDS.has(clean(source.kind, 30)) ? clean(source.kind, 30) : "story";
  const status = STATUSES.has(clean(source.status, 30)) ? clean(source.status, 30) : "draft";
  const appTarget = TARGETS.has(clean(source.appTarget, 20)) ? clean(source.appTarget, 20) : "kids";
  const ageMin = clampInt(source.ageMin, 3, 17, 4);
  const ageMax = clampInt(source.ageMax, ageMin, 17, 10);
  const modes = normalizeModes(source.modes);

  return {
    id,
    revision: Math.max(1, clampInt(source.revision, 1, 999999, 1)),
    kind,
    appTarget,
    status,
    title: clean(source.title, 220),
    subtitle: clean(source.subtitle, 320),
    summary: clean(source.summary, 1000),
    category: clean(source.category || "Allgemein", 120),
    topic: clean(source.topic, 180),
    prophetId: clean(source.prophetId, 100),
    tags: asArray(source.tags, 30),
    ageMin,
    ageMax,
    modes,
    text: clean(source.text, 60000),
    sourceRefs: asArray(source.sourceRefs, 40),
    claimIds: asArray(source.claimIds, 80),
    verification: clean(source.verification || "studio-review", 60),
    cover: normalizeAsset(source.cover, "cover"),
    audio: {
      ...normalizeAsset(source.audio, "audio"),
      durationSec: Math.max(0, Number(source?.audio?.durationSec || 0) || 0),
      codec: clean(source?.audio?.codec, 60)
    },
    question: normalizeQuestionBank(source.question),
    quiz: normalizeQuiz(source.quiz),
    game: normalizeGame(source.game),
    production: normalizeProduction(source.production),
    featured: Boolean(source.featured),
    newUntil: source.newUntil ? clean(source.newUntil, 80) : null,
    createdAt: clean(source.createdAt || nowIso, 80),
    updatedAt: clean(source.updatedAt || nowIso, 80),
    publishedAt: source.publishedAt ? clean(source.publishedAt, 80) : null,
    publishedRevision: Math.max(0, Number(source.publishedRevision || 0) || 0),
    push: {
      enabled: source?.push?.enabled !== false,
      title: clean(source?.push?.title, 140),
      body: clean(source?.push?.body, 260),
      status: clean(source?.push?.status || "not-sent", 60),
      sentAt: source?.push?.sentAt ? clean(source.push.sentAt, 80) : null,
      notificationId: clean(source?.push?.notificationId, 160)
    },
    qa: {
      text: Boolean(source?.qa?.text),
      cover: Boolean(source?.qa?.cover),
      audio: Boolean(source?.qa?.audio),
      pronunciation: Boolean(source?.qa?.pronunciation),
      source: Boolean(source?.qa?.source)
    }
  };
}

export function validateKidsContentForPublish(item) {
  const errors = [];
  if (!item) return ["Content-Paket fehlt"];
  if (!item.title) errors.push("Titel fehlt");
  if (!item.category) errors.push("Kategorie fehlt");
  if (item.ageMin > item.ageMax) errors.push("Altersbereich ungültig");
  if (!item.modes.read && !item.modes.listen) errors.push("Mindestens Lesen oder Hören muss aktiv sein");

  const needsVisual = ["story","lesson","quiz","game"].includes(item.kind);
  if (needsVisual && !item.cover?.url) errors.push("Cover fehlt");
  if (item.modes.listen && !item.audio?.url) errors.push("Audio fehlt");
  if (item.modes.listen && !item.qa?.pronunciation) errors.push("Aussprache muss bestätigt sein");
  if (item.modes.listen && !item.qa?.audio) errors.push("Audio-QA fehlt");
  if (needsVisual && !item.qa?.cover) errors.push("Cover-QA fehlt");

  if (item.kind === "story" || item.kind === "lesson") {
    if (!item.text) errors.push("Text fehlt");
    if (!item.qa?.text) errors.push("Text-QA fehlt");
  }

  if (item.kind === "quiz") {
    const qs = Array.isArray(item.quiz?.questions) ? item.quiz.questions : [];
    if (!qs.length) errors.push("Quiz-Fragen fehlen");
    qs.forEach((q, index) => {
      if (!q.question) errors.push(`Quiz-Frage ${index + 1} fehlt`);
      if (!Array.isArray(q.answers) || q.answers.length < 2) errors.push(`Quiz-Frage ${index + 1}: mindestens zwei Antworten nötig`);
      if ((q.answers || []).filter((a) => a.correct).length !== 1) errors.push(`Quiz-Frage ${index + 1}: genau eine richtige Antwort nötig`);
    });
  }

  if (item.kind === "game") {
    if (!item.game?.instructions) errors.push("Spielanleitung fehlt");
    if (item.modes.listen && !(item.game?.voiceCues || []).length && !item.text) errors.push("Sprachbausteine oder Sprechtext fehlen");
  }
  return errors;
}
function indexPath(env, staging) {
  return clean(
    staging
      ? (env.KIDS_STAGING_CONTENT_PATH || DEFAULT_STAGING_PATH)
      : (env.KIDS_CONTENT_PATH || DEFAULT_LIVE_PATH),
    500
  ).replace(/^\/+/, "");
}

function emptyIndex(staging) {
  return {
    schemaVersion: 1,
    environment: staging ? "staging" : "live",
    updatedAt: new Date().toISOString(),
    items: []
  };
}

export async function readKidsContentIndex(env, { staging = false } = {}, helpers) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = indexPath(env, staging);
  try {
    const file = await helpers.githubGet(env, owner, repo, path, branch);
    if (!file?.content) return { index: emptyIndex(staging), sha: "", path, staging };
    const parsed = JSON.parse(helpers.base64ToUtf8(file.content));
    const items = Array.isArray(parsed?.items)
      ? parsed.items.map((x) => normalizeKidsContentItem(x)).filter(Boolean)
      : [];
    return {
      index: {
        schemaVersion: 1,
        environment: staging ? "staging" : "live",
        updatedAt: clean(parsed?.updatedAt || new Date().toISOString(), 80),
        items
      },
      sha: file.sha || "",
      path,
      staging
    };
  } catch (error) {
    if (Number(error?.status || 0) === 404) return { index: emptyIndex(staging), sha: "", path, staging };
    throw error;
  }
}

export async function saveKidsContentEntry(env, input, helpers) {
  const staging = input?.staging !== false;
  const nowIso = new Date().toISOString();
  const { index, sha, path } = await readKidsContentIndex(env, { staging }, helpers);
  const existing = (index.items || []).find((x) => String(x.id) === String(input?.id || ""));
  const merged = {
    ...(existing || {}),
    ...(input || {}),
    cover: { ...(existing?.cover || {}), ...(input?.cover || {}) },
    audio: { ...(existing?.audio || {}), ...(input?.audio || {}) },
    modes: { ...(existing?.modes || {}), ...(input?.modes || {}) },
    qa: { ...(existing?.qa || {}), ...(input?.qa || {}) },
    push: { ...(existing?.push || {}), ...(input?.push || {}) },
    createdAt: existing?.createdAt || input?.createdAt || nowIso,
    updatedAt: nowIso,
    revision: Math.max(1, Number(existing?.revision || 0) + 1)
  };
  const normalized = normalizeKidsContentItem(merged, nowIso);
  if (!normalized?.title) throw contentError("Titel fehlt", 400);

  const items = (index.items || []).filter((x) => x.id !== normalized.id);
  items.unshift(normalized);
  const payload = {
    schemaVersion: 1,
    environment: staging ? "staging" : "live",
    updatedAt: nowIso,
    items
  };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    JSON.stringify(payload, null, 2) + "\n",
    `Kids Studio save ${normalized.kind} ${normalized.id}${staging ? " (staging)" : ""}`,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return {
    ok: true,
    staging,
    path,
    item: normalized,
    commitSha: saved?.commit?.sha || ""
  };
}

async function writeIndex(env, staging, index, sha, path, helpers, message) {
  const payload = {
    schemaVersion: 1,
    environment: staging ? "staging" : "live",
    updatedAt: new Date().toISOString(),
    items: index.items || []
  };
  const saved = await helpers.githubPut(
    env,
    env.GITHUB_OWNER || "Sero91ak",
    env.GITHUB_REPO || "dar-al-tawhid-site",
    path,
    JSON.stringify(payload, null, 2) + "\n",
    message,
    env.GITHUB_BRANCH || "main",
    sha
  );
  return saved?.commit?.sha || "";
}

export async function publishKidsContentEntry(env, input, helpers) {
  const id = clean(input?.id, 90);
  if (!id) throw contentError("Content-ID fehlt", 400);
  const live = Boolean(input?.live);
  const now = new Date();
  const nowIso = now.toISOString();

  const source = await readKidsContentIndex(env, { staging: true }, helpers);
  const draft = (source.index.items || []).find((x) => x.id === id);
  if (!draft) throw contentError("Staging-Paket nicht gefunden", 404);

  const candidate = normalizeKidsContentItem({
    ...draft,
    ...(input?.cover ? { cover: { ...(draft.cover || {}), ...input.cover } } : {}),
    ...(input?.audio ? { audio: { ...(draft.audio || {}), ...input.audio } } : {}),
    production: { ...(draft.production || {}), phase: live ? "live-published" : "test-published", error: "" },
    status: "published",
    publishedAt: draft.publishedAt || nowIso,
    publishedRevision: draft.revision,
    newUntil: input?.newUntil || draft.newUntil || new Date(now.getTime() + 14 * 86400000).toISOString(),
    updatedAt: nowIso,
    push: {
      ...(draft.push || {}),
      enabled: input?.pushEnabled !== false && draft?.push?.enabled !== false,
      status: live ? "pending" : "suppressed-staging"
    }
  }, nowIso);

  const errors = validateKidsContentForPublish(candidate);
  if (errors.length) throw contentError("Publish blockiert: " + errors.join(" · "), 422);

  if (!live) {
    const items = source.index.items.map((x) => x.id === id ? candidate : x);
    const commitSha = await writeIndex(
      env, true, { ...source.index, items }, source.sha, source.path, helpers,
      `Kids Studio publish ${id} to staging`
    );
    return { ok: true, live: false, staging: true, item: candidate, commitSha, pushRequired: false };
  }

  const target = await readKidsContentIndex(env, { staging: false }, helpers);
  const existingLive = (target.index.items || []).find((x) => x.id === id);
  if (existingLive && Number(existingLive.publishedRevision || 0) === Number(candidate.publishedRevision || 0)) {
    return {
      ok: true,
      live: true,
      idempotent: true,
      item: existingLive,
      commitSha: "",
      pushRequired: existingLive?.push?.status !== "sent" && existingLive?.push?.enabled !== false
    };
  }

  const liveItems = (target.index.items || []).filter((x) => x.id !== id);
  liveItems.unshift(candidate);
  const commitSha = await writeIndex(
    env, false, { ...target.index, items: liveItems }, target.sha, target.path, helpers,
    `Kids Studio publish ${id} live r${candidate.publishedRevision}`
  );

  return { ok: true, live: true, item: candidate, commitSha, pushRequired: candidate.push.enabled !== false };
}

export async function updateKidsContentPushState(env, { id, status, sentAt, notificationId }, helpers) {
  const current = await readKidsContentIndex(env, { staging: false }, helpers);
  let found = false;
  const items = current.index.items.map((x) => {
    if (x.id !== id) return x;
    found = true;
    return normalizeKidsContentItem({
      ...x,
      updatedAt: new Date().toISOString(),
      push: {
        ...(x.push || {}),
        status: clean(status || "failed", 60),
        sentAt: sentAt || x?.push?.sentAt || null,
        notificationId: notificationId || x?.push?.notificationId || ""
      }
    });
  });
  if (!found) return { ok: false, reason: "Live-Paket fehlt" };
  const commitSha = await writeIndex(
    env, false, { ...current.index, items }, current.sha, current.path, helpers,
    `Kids Studio push state ${id}: ${status}`
  );
  return { ok: true, commitSha };
}

export function buildPublicKidsContentResponse(index, { kind = "", age = 0, appTarget = "kids" } = {}) {
  const now = Date.now();
  const k = clean(kind, 30);
  const a = Number(age || 0);
  const target = clean(appTarget, 20) || "kids";
  const items = (index?.items || [])
    .filter((item) => item?.status === "published")
    .filter((item) => !k || item.kind === k)
    .filter((item) => !a || (a >= Number(item.ageMin || 0) && a <= Number(item.ageMax || 99)))
    .filter((item) => item.appTarget === "both" || item.appTarget === target)
    .sort((aItem, bItem) => {
      const f = Number(Boolean(bItem.featured)) - Number(Boolean(aItem.featured));
      if (f) return f;
      return Date.parse(bItem.publishedAt || bItem.updatedAt || 0) - Date.parse(aItem.publishedAt || aItem.updatedAt || 0);
    })
    .map((item) => ({
      ...item,
      isNew: Boolean(item.newUntil && Date.parse(item.newUntil) > now)
    }));
  return {
    ok: true,
    schemaVersion: 1,
    items,
    count: items.length,
    fetchedAt: new Date().toISOString()
  };
}

export function buildKidsContentId(kind, title) {
  const base = clean(title || kind || "content", 140)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52) || "content";
  return `${clean(kind || "story", 20)}-${base}-${Date.now().toString(36)}`;
}

function contentError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const KIDS_CONTENT_META = Object.freeze({
  stagingPath: DEFAULT_STAGING_PATH,
  livePath: DEFAULT_LIVE_PATH,
  kinds: [...KINDS],
  statuses: [...STATUSES],
  targets: [...TARGETS]
});
