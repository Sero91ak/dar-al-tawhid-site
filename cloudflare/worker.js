import {
  parsePostForTelegram,
  validateTelegramPost,
  buildTelegramPreview,
  buildTelegramHtml,
  shortenForCaption
} from "./telegram-formatter.js";
import {
  readPrayerPushStatus,
  sendPrayerTestPush,
  ensurePrayerSchedulerFresh
} from "./prayer-push-admin.js";

const DEFAULT_OWNER = "Sero91ak";
const DEFAULT_REPO = "dar-al-tawhid-site";
const DEFAULT_BRANCH = "main";
// Deployed via GitHub Actions (.github/workflows/deploy-admin-publisher.yml)
const DEFAULT_POSTS_DIR = "content/posts";
const DEFAULT_ALLOWED_ORIGIN = "https://dar-al-tawhid.de";
const DEFAULT_UPDATES_PATH = "content/updates/current.json";
const DEFAULT_SCHEDULE_PATH = "content/admin/planned-posts.json";
const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de";
const DEFAULT_TELEGRAM_POSTS_PATH = "content/admin/telegram-posts.json";
const DEFAULT_PENDING_PUSHES_PATH = "content/admin/pending-pushes.json";
const DEFAULT_PRAYER_STATUS_PATH = "content/admin/prayer-push-status.json";
const LIVE_CHECK_SCHEDULE_FULL_MS = [0, 10000, 30000, 60000, 120000, 180000, 240000, 300000];
const LIVE_CHECK_SCHEDULE_QUICK_MS = [0, 5000, 10000];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === "/health" || url.pathname === "/api/admin/health") {
        return json({
          ok: true,
          service: "dar-admin-publisher",
          repo: `${env.GITHUB_OWNER || DEFAULT_OWNER}/${env.GITHUB_REPO || DEFAULT_REPO}`,
          branch: env.GITHUB_BRANCH || DEFAULT_BRANCH,
          hasGithubToken: Boolean(env.GITHUB_TOKEN),
          hasAdminSecret: Boolean(env.ADMIN_PUBLISH_SECRET),
          hasOneSignalKey: Boolean(oneSignalApiKey(env)),
          hasTelegramToken: Boolean(telegramBotToken(env)),
          telegramChannel: telegramChannelId(env),
          newsPath: env.UPDATES_PATH || DEFAULT_UPDATES_PATH,
          schedulePath: env.SCHEDULE_PATH || DEFAULT_SCHEDULE_PATH,
          scheduler: "ready"
        }, cors);
      }

      if (url.pathname === "/api/admin/next-number") {
        if (request.method !== "GET") {
          return json({ ok: false, error: "GET required" }, cors, 405);
        }
        assertConfigured(env);
        assertAuthorized(request, env);
        return json({ ok: true, ...(await fetchPostNumberInfo(env)) }, cors);
      }

      const publishPaths = new Set(["/publish", "/api/admin/publish"]);
      const newsPaths = new Set(["/news", "/api/admin/news", "/publish-news", "/api/admin/publish-news"]);
      const schedulePaths = new Set(["/schedule", "/api/admin/schedule"]);
      const schedulerPaths = new Set(["/run-scheduler", "/api/admin/run-scheduler"]);
      const telegramPaths = new Set([
        "/api/admin/telegram/preview",
        "/api/admin/telegram/test",
        "/api/admin/telegram/send",
        "/api/admin/telegram/status"
      ]);
      const pushPaths = new Set([
        "/api/admin/push/retry",
        "/api/admin/push/status"
      ]);
      const prayerPaths = new Set([
        "/api/admin/prayer/status",
        "/api/admin/prayer/test",
        "/api/admin/prayer/run"
      ]);

      if (![...publishPaths, ...newsPaths, ...schedulePaths, ...schedulerPaths, ...telegramPaths, ...pushPaths, ...prayerPaths].includes(url.pathname)) {
        return json({ ok: false, error: "Not found" }, cors, 404);
      }

      if (url.pathname === "/api/admin/telegram/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const postId = String(url.searchParams.get("postId") || "").trim();
        const registry = await readTelegramPostsRegistry(env);
        return json({ ok: true, postId, status: postId ? registry.posts?.[postId] || null : registry }, cors);
      }

      if (url.pathname === "/api/admin/push/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const postId = String(url.searchParams.get("postId") || "").trim();
        const registry = await readPendingPushesRegistry(env);
        return json({ ok: true, postId, status: postId ? registry.pushes?.[postId] || null : registry }, cors);
      }

      if (url.pathname === "/api/admin/prayer/status") {
        if (request.method !== "GET") return json({ ok: false, error: "GET required" }, cors, 405);
        assertConfigured(env);
        assertAuthorized(request, env);
        const result = await readPrayerPushStatus(env, githubGet, base64ToUtf8);
        return json(result, cors, result.ok ? 200 : 503);
      }

      if (request.method !== "POST") {
        return json({ ok: false, error: "POST required" }, cors, 405);
      }

      assertConfigured(env);
      assertAuthorized(request, env);

      const input = await request.json().catch(() => ({}));

      if (telegramPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/preview")) {
          return json(buildTelegramPreviewResponse(env, input), cors);
        }
        if (url.pathname.endsWith("/test")) {
          return json(await sendTelegramTest(env), cors);
        }
        if (url.pathname.endsWith("/send")) {
          return json(await sendTelegramPost(env, input), cors);
        }
      }

      if (pushPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/retry")) {
          return json(await retryPendingPostPush(env, input), cors);
        }
      }

      if (prayerPaths.has(url.pathname)) {
        if (url.pathname.endsWith("/test")) {
          return json(await sendPrayerTestPush(env, input), cors);
        }
        if (url.pathname.endsWith("/run")) {
          return json(await ensurePrayerSchedulerFresh(env, githubGet, base64ToUtf8), cors);
        }
      }

      if (publishPaths.has(url.pathname)) {
        return json(await publishPostFromMarkdown(env, input, ctx), cors);
      }

      if (newsPaths.has(url.pathname)) {
        return json(await publishNewsUpdate(env, input), cors);
      }

      if (schedulePaths.has(url.pathname)) {
        return json(await saveScheduledPost(env, input), cors);
      }

      if (schedulerPaths.has(url.pathname)) {
        return json(await runScheduledPublishes(env), cors);
      }
    } catch (error) {
      return json({ ok: false, error: error.message || String(error) }, cors, error.status || 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduledPublishes(env));
    ctx.waitUntil(processAllPendingPushes(env));
    ctx.waitUntil(ensurePrayerSchedulerFresh(env, githubGet, base64ToUtf8));
  }
};

async function fetchPostNumberInfo(env) {
  const indexData = await readPostsIndex(env);
  const files = listPostFiles(indexData.files);
  const postCount = files.length;
  const nextNumber = nextPostNumber(files);
  return {
    postCount,
    nextNumber,
    maxSerial: maxPostNumber(files),
    indexPath: `${trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR)}/posts-index.json`
  };
}

async function readPostsIndex(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const indexPath = `${postsDir}/posts-index.json`;
  const indexFile = await githubGet(env, owner, repo, indexPath, branch);
  return indexFile?.content ? JSON.parse(base64ToUtf8(indexFile.content)) : { version: 1, files: [] };
}

function listPostFiles(files) {
  return (Array.isArray(files) ? files : []).filter((file) => file && (file.name || typeof file === "string"));
}

async function publishPostFromMarkdown(env, input, ctx) {
  const markdownRaw = String(input.markdown || "").trim();
  let filename = String(input.filename || "").trim();

  if (!markdownRaw) throw httpError("Markdown fehlt", 400);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const indexPath = `${postsDir}/posts-index.json`;

  const indexFile = await githubGet(env, owner, repo, indexPath, branch);
  const indexData = indexFile?.content ? JSON.parse(base64ToUtf8(indexFile.content)) : { version: 1, files: [] };
  const files = listPostFiles(indexData.files);
  const duplicate = findDuplicateByTitleSlug(files, markdownRaw);
  if (duplicate) {
    throw httpError(`Möglicher Duplikat-Beitrag: „${duplicate}“ hat bereits einen ähnlichen Titel.`, 409);
  }

  const nextNumber = nextPostNumber(files);

  if (!filename) {
    filename = suggestFilename(markdownRaw, nextNumber);
  } else if (/(?:^|-)\d{3}(?=-|\.md$)/.test(filename)) {
    filename = filename.replace(/(^|-)\d{3}(?=-|\.md$)/, `$1${String(nextNumber).padStart(3, "0")}`);
  }

  filename = sanitizeFilename(filename);
  const markdown = normalizeMarkdownForUpload(markdownRaw, nextNumber);
  const postPath = `${postsDir}/${filename}`;

  const existing = await githubGet(env, owner, repo, postPath, branch);
  if (existing) throw httpError(`Diese Datei existiert schon: ${filename}`, 409);

  const created = await githubPut(env, owner, repo, postPath, markdown, `Add post ${filename}`, branch);
  const nextFiles = files.filter((file) => file.name !== filename);
  nextFiles.push({ name: filename, sha: created.content.sha });
  nextFiles.sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));

  const payload = {
    version: Number(indexData.version || 1),
    generated: new Date().toISOString(),
    count: nextFiles.length,
    files: nextFiles
  };
  const updatedIndex = await githubPut(
    env,
    owner,
    repo,
    indexPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Update posts index for ${filename}`,
    branch,
    indexFile?.sha
  );

  const postTitle = frontmatterValue(markdown, "title") || "Neuer Beitrag";
  const postId = frontmatterValue(markdown, "id");
  const publishedAt = new Date().toISOString();
  const githubSteps = { postCreated: true, indexUpdated: true };
  const liveCheck = await verifyPostLiveAvailability(
    env,
    { filename, postId, postPath, githubSteps },
    { schedule: "quick" }
  );
  let push;
  if (liveCheck.ok) {
    push = await sendNewPostPush(env, { postTitle, postId, filename, publishedAt, cacheVersion: Date.now() });
    push.liveCheck = liveCheck;
    push.pending = false;
    if (postId) {
      await writePendingPushStatus(env, postId, {
        postId,
        filename,
        postTitle,
        publishedAt,
        postPath,
        status: "sent",
        sentAt: new Date().toISOString(),
        lastError: "",
        liveCheck
      });
    }
  } else {
    const pendingRecord = {
      postId,
      filename,
      postTitle,
      publishedAt,
      postPath,
      status: "pending",
      createdAt: publishedAt,
      lastError: liveCheck.diagnosis || "Push wartet auf Live-Verfügbarkeit"
    };
    if (postId) await writePendingPushStatus(env, postId, pendingRecord);
    push = {
      sent: false,
      pending: true,
      reason: "Push wartet auf Live-Verfügbarkeit",
      waitingForLive: true,
      liveCheck,
      targetUrl: buildPostPushUrl(env, postId, Date.now())
    };
    if (ctx && postId) {
      ctx.waitUntil(processPendingPushUntilLive(env, pendingRecord));
    }
  }

  let telegram = { sent: false, skipped: true, status: "not_sent" };
  if (input.telegram?.enabled) {
    telegram = await sendTelegramPost(env, {
      markdown,
      postId,
      mode: input.telegram.mode || "text",
      imageBase64: input.telegram.imageBase64 || "",
      forceResend: Boolean(input.telegram.forceResend)
    });
  }

  return {
    ok: true,
    filename,
    number: nextNumber,
    postCount: nextFiles.length,
    postPath,
    indexPath,
    commitSha: updatedIndex.commit?.sha || created.commit?.sha || "",
    postId,
    publishedAt,
    liveCheck,
    push,
    telegram
  };
}

async function publishNewsUpdate(env, input) {
  const title = String(input.title || "").trim();
  const text = String(input.text || input.description || "").trim();
  if (!title || !text) throw httpError("News-Titel und Text fehlen", 400);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const updatesPath = trimSlashes(env.UPDATES_PATH || DEFAULT_UPDATES_PATH);
  const file = await githubGet(env, owner, repo, updatesPath, branch);
  const current = file?.content ? JSON.parse(base64ToUtf8(file.content)) : { items: [] };
  const items = Array.isArray(current) ? current : Array.isArray(current.items) ? current.items : [];
  const now = new Date();
  const ttlHours = Number(input.ttlHours || input.hours || 24);
  const id = sanitizeUpdateId(input.id || `${slugify(title)}-${now.toISOString().slice(0, 10)}`);
  const item = {
    id,
    type: input.type || "news",
    title,
    text,
    badge: input.badge || "News",
    count: Number(input.count || 0) || undefined,
    nav: input.nav || "recent",
    value: input.value || "",
    createdAt: now.toISOString(),
    ttlHours: Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24,
    visible: input.visible === false ? false : true
  };
  const freshItems = items
    .filter((entry) => entry && entry.id !== id)
    .filter((entry) => {
      const expires = Date.parse(entry.expiresAt || "");
      if (Number.isFinite(expires)) return expires > Date.now();
      const created = Date.parse(entry.createdAt || entry.date || entry.publishedAt || "");
      if (!Number.isFinite(created)) return true;
      const ttl = Number(entry.ttlHours || 24);
      return Date.now() - created <= ttl * 60 * 60 * 1000;
    });
  freshItems.unshift(item);
  const payload = { items: freshItems.slice(0, 20) };
  const saved = await githubPut(
    env,
    owner,
    repo,
    updatesPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Publish news update ${id}`,
    branch,
    file?.sha
  );
  return { ok: true, id, updatesPath, commitSha: saved.commit?.sha || "" };
}

async function saveScheduledPost(env, input) {
  const markdown = String(input.markdown || "").trim();
  const when = String(input.when || input.publishAt || "").trim();
  const title = String(input.title || frontmatterValue(markdown, "title") || "").trim();
  if (!markdown) throw httpError("Markdown fehlt für geplanten Beitrag", 400);
  if (!when) throw httpError("Veröffentlichungszeit fehlt", 400);
  if (!Date.parse(when)) throw httpError("Veröffentlichungszeit ist ungültig", 400);

  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const schedulePath = trimSlashes(env.SCHEDULE_PATH || DEFAULT_SCHEDULE_PATH);
  const file = await githubGet(env, owner, repo, schedulePath, branch);
  const current = file?.content ? JSON.parse(base64ToUtf8(file.content)) : { items: [] };
  const items = Array.isArray(current) ? current : Array.isArray(current.items) ? current.items : [];
  const id = sanitizeUpdateId(input.id || `${slugify(title || "geplanter-beitrag")}-${Date.now()}`);
  const item = {
    id,
    title: title || "Geplanter Beitrag",
    filename: String(input.filename || "").trim(),
    markdown,
    publishAt: new Date(when).toISOString(),
    timezone: input.timezone || "Europe/Berlin",
    status: "scheduled",
    createdAt: new Date().toISOString(),
    lastError: ""
  };
  const payload = { items: [item, ...items.filter((entry) => entry && entry.id !== id)].slice(0, 120) };
  const saved = await githubPut(
    env,
    owner,
    repo,
    schedulePath,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Schedule post ${id}`,
    branch,
    file?.sha
  );
  return { ok: true, id, schedulePath, publishAt: item.publishAt, commitSha: saved.commit?.sha || "" };
}

async function runScheduledPublishes(env) {
  assertConfigured(env);
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const schedulePath = trimSlashes(env.SCHEDULE_PATH || DEFAULT_SCHEDULE_PATH);
  const file = await githubGet(env, owner, repo, schedulePath, branch);
  if (!file?.content) return { ok: true, checked: 0, published: 0, message: "Keine Planung gefunden" };

  const current = JSON.parse(base64ToUtf8(file.content));
  const items = Array.isArray(current) ? current : Array.isArray(current.items) ? current.items : [];
  const now = Date.now();
  let published = 0;
  let changed = false;

  for (const item of items) {
    if (!item || item.status !== "scheduled") continue;
    const due = Date.parse(item.publishAt || item.when || "");
    if (!Number.isFinite(due) || due > now) continue;
    try {
      const result = await publishPostFromMarkdown(env, { markdown: item.markdown, filename: item.filename });
      item.status = "published";
      item.publishedAt = new Date().toISOString();
      item.filename = result.filename;
      item.commitSha = result.commitSha || "";
      item.lastError = "";
      published += 1;
      changed = true;
    } catch (error) {
      item.status = "failed";
      item.lastError = error.message || String(error);
      item.failedAt = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    await githubPut(
      env,
      owner,
      repo,
      schedulePath,
      `${JSON.stringify({ items }, null, 2)}\n`,
      "Run scheduled post publisher",
      branch,
      file.sha
    );
  }

  return { ok: true, checked: items.length, published };
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN);
  const allowOrigin = origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost") || origin === allowed ? origin || allowed : allowed;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Secret",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}

function assertConfigured(env) {
  if (!env.GITHUB_TOKEN) throw httpError("Cloudflare Secret GITHUB_TOKEN fehlt", 500);
  if (!env.ADMIN_PUBLISH_SECRET) throw httpError("Cloudflare Secret ADMIN_PUBLISH_SECRET fehlt", 500);
}

function assertAuthorized(request, env) {
  const headerSecret = request.headers.get("X-Admin-Secret") || "";
  const bearer = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (headerSecret !== env.ADMIN_PUBLISH_SECRET && bearer !== env.ADMIN_PUBLISH_SECRET) {
    throw httpError("Nicht autorisiert", 401);
  }
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function githubGet(env, owner, repo, path, branch) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`, {
    headers: githubHeaders(env)
  });
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub GET Fehler ${res.status}`, res.status);
  return data;
}

async function githubPut(env, owner, repo, path, content, message, branch, sha) {
  const body = { message, content: utf8ToBase64(content), branch };
  if (sha) body.sha = sha;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}`, {
    method: "PUT",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(data.message || `GitHub PUT Fehler ${res.status}`, res.status);
  return data;
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "dar-admin-cloudflare-worker",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function encodeURIComponentPath(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

function trimSlashes(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function frontmatterValue(text, key) {
  const match = String(text || "").match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"));
  return match ? match[1].trim() : "";
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "beitrag";
}

function nextPostNumber(files) {
  return listPostFiles(files).length + 1;
}

function maxPostNumber(files) {
  let max = 0;
  for (const file of listPostFiles(files)) {
    const name = typeof file === "string" ? file : file.name;
    for (const match of String(name || "").matchAll(/(?:^|-)(\d{3})(?=-|\.md$)/g)) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return max;
}

function findDuplicateByTitleSlug(files, markdown) {
  const title = frontmatterValue(markdown, "title").replace(/^📖\s*/, "").trim();
  if (!title || title.length < 6) return null;
  const titleSlug = slugify(title);
  if (titleSlug.length < 8) return null;
  for (const file of listPostFiles(files)) {
    const name = typeof file === "string" ? file : file.name;
    if (String(name || "").includes(titleSlug)) return name;
  }
  return null;
}

function suggestFilename(markdown, nextNumber) {
  const title = frontmatterValue(markdown, "title").replace(/^📖\s*/, "") || "neuer Beitrag";
  const category = frontmatterValue(markdown, "category") || "beitrag";
  return `${slugify(category)}-${String(nextNumber).padStart(3, "0")}-${slugify(title)}.md`;
}

function sanitizeFilename(filename) {
  const clean = slugify(String(filename || "").replace(/\.md$/i, ""));
  const finalName = `${clean}.md`;
  if (!/^[a-z0-9][a-z0-9-]*\.md$/i.test(finalName)) {
    throw httpError("Dateiname muss eine .md-Datei ohne Leerzeichen sein", 400);
  }
  return finalName;
}

function sanitizeUpdateId(value) {
  return slugify(value).slice(0, 96) || `meldung-${Date.now()}`;
}

function normalizeMarkdownForUpload(markdown, nextNumber) {
  let out = String(markdown || "").trim();
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");
  if (/^date:\s*["']?.*?["']?\s*$/m.test(out)) out = out.replace(/^date:\s*["']?.*?["']?\s*$/m, `date: "${iso}"`);
  const id = frontmatterValue(out, "id");
  if (id) {
    const next = String(nextNumber).padStart(3, "0");
    const updated = /-\d{3}$/.test(id) ? id.replace(/-\d{3}$/, `-${next}`) : `${id}-${next}`;
    out = out.replace(/^id:\s*["']?.*?["']?\s*$/m, `id: "${updated}"`);
  }
  return `${out}\n`;
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.slice(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64ToUtf8(value) {
  const bin = atob(String(value || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || env.ONESIGNAL_APP_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function buildPostPushUrl(env, postId, cacheVersion) {
  const site = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
  const slug = String(postId || "").trim();
  const v = cacheVersion || Date.now();
  return `${site}/?post=${encodeURIComponent(slug)}&v=${encodeURIComponent(v)}#post/${encodeURIComponent(slug)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pendingPushesPath(env) {
  return trimSlashes(env.PENDING_PUSHES_PATH || DEFAULT_PENDING_PUSHES_PATH);
}

async function readPendingPushesRegistry(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = pendingPushesPath(env);
  const file = await githubGet(env, owner, repo, path, branch);
  if (!file?.content) return { pushes: {} };
  try {
    const data = JSON.parse(base64ToUtf8(file.content));
    return { pushes: data.pushes || {}, sha: file.sha };
  } catch (error) {
    return { pushes: {}, sha: file.sha };
  }
}

async function writePendingPushStatus(env, postId, patch) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = pendingPushesPath(env);
  const registry = await readPendingPushesRegistry(env);
  const pushes = { ...(registry.pushes || {}) };
  const key = String(postId || "").trim();
  if (!key) return null;
  pushes[key] = {
    ...(pushes[key] || {}),
    ...patch,
    postId: key,
    updatedAt: new Date().toISOString()
  };
  const payload = { version: 1, generated: new Date().toISOString(), pushes };
  await githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Update pending push ${key}`,
    branch,
    registry.sha
  );
  return pushes[key];
}

function diagnoseLiveFailure(steps, live = {}) {
  if (!steps.githubFileCreated) return "GitHub-Datei wurde nicht erstellt.";
  if (!steps.indexUpdatedGithub) return "Indexdatei wurde auf GitHub nicht aktualisiert.";
  if (!steps.indexFoundPublic) {
    if (live.indexHttpStatus === 404) return "Indexdatei öffentlich nicht gefunden.";
    return "GitHub Commit erfolgreich, aber Cloudflare Deployment noch nicht fertig.";
  }
  if (!steps.postInIndex) return "Beitrag ist nicht im öffentlichen Index enthalten.";
  if (!steps.postFilePublic) {
    if (live.postHttpStatus === 404) return "Beitrag-Datei öffentlich nicht erreichbar.";
    return "Cloudflare liefert noch alte Cache-Version.";
  }
  if (!steps.visitorUrlOk) return "Besucher-URL (?post=…) noch nicht erreichbar.";
  return "";
}

function buildLiveCheckResult(githubSteps, live, attempts) {
  const steps = {
    githubFileCreated: !!githubSteps?.postCreated,
    indexUpdatedGithub: !!githubSteps?.indexUpdated,
    indexFoundPublic: !!live.indexFoundPublic,
    postInIndex: !!live.postInIndex,
    postFilePublic: !!live.postFilePublic,
    visitorUrlOk: !!live.visitorUrlOk,
    cloudflareDeployed: !!(live.indexFoundPublic && live.postFilePublic)
  };
  const ok = steps.indexFoundPublic && steps.postInIndex && steps.postFilePublic;
  const diagnosis = ok ? "" : diagnoseLiveFailure(steps, live);
  return {
    ok,
    steps,
    diagnosis,
    indexOk: steps.postInIndex,
    postOk: steps.postFilePublic,
    visitorUrlOk: steps.visitorUrlOk,
    attempts,
    site: live.site,
    postId: live.postId,
    indexGenerated: live.indexGenerated,
    indexCount: live.indexCount,
    visitorUrl: live.visitorUrl,
    indexError: live.indexError,
    postError: live.postError,
    visitorError: live.visitorError
  };
}

async function fetchLiveResources(env, { filename, postId, postPath }) {
  const site = siteOrigin(env);
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const bust = Date.now();
  const result = {
    site,
    postId: String(postId || ""),
    indexFoundPublic: false,
    postInIndex: false,
    postFilePublic: false,
    visitorUrlOk: false,
    indexGenerated: null,
    indexCount: null,
    visitorUrl: postId ? buildPostPushUrl(env, postId, bust) : null
  };

  try {
    const indexRes = await fetch(`${site}/${postsDir}/posts-index.json?v=${bust}`, { cache: "no-store" });
    if (indexRes.ok) {
      result.indexFoundPublic = true;
      const indexData = await indexRes.json();
      result.indexGenerated = indexData.generated || null;
      result.indexCount = Number(indexData.count ?? (indexData.files?.length ?? 0)) || 0;
      const files = listPostFiles(indexData.files || []);
      result.postInIndex = files.some((file) => file.name === filename);
      if (!result.postInIndex && postId) {
        result.postInIndex = files.some((file) => String(file.name).replace(/\.md$/, "") === String(postId));
      }
    } else {
      result.indexHttpStatus = indexRes.status;
    }
  } catch (error) {
    result.indexError = error.message || String(error);
  }

  try {
    const postRes = await fetch(`${site}/${postPath}?v=${bust}`, { cache: "no-store" });
    result.postFilePublic = postRes.ok;
    if (!postRes.ok) result.postHttpStatus = postRes.status;
  } catch (error) {
    result.postError = error.message || String(error);
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

  return result;
}

async function verifyPostLiveAvailability(env, opts, { schedule = "full" } = {}) {
  const delays = schedule === "quick" ? LIVE_CHECK_SCHEDULE_QUICK_MS : LIVE_CHECK_SCHEDULE_FULL_MS;
  let lastResult = null;
  let elapsed = 0;

  for (let i = 0; i < delays.length; i++) {
    const target = delays[i];
    const waitMs = target - elapsed;
    if (waitMs > 0) await sleep(waitMs);
    elapsed = target;

    const live = await fetchLiveResources(env, opts);
    lastResult = buildLiveCheckResult(opts.githubSteps || {}, live, i + 1);
    if (lastResult.ok) return lastResult;
  }

  return lastResult;
}

async function processPendingPushUntilLive(env, record) {
  const postId = String(record?.postId || "").trim();
  if (!postId) return { sent: false, reason: "postId fehlt" };

  const registry = await readPendingPushesRegistry(env);
  if (registry.pushes?.[postId]?.status === "sent") {
    return { sent: true, skipped: true, reason: "Push wurde bereits gesendet." };
  }

  const liveCheck = await verifyPostLiveAvailability(
    env,
    {
      filename: record.filename,
      postId,
      postPath: record.postPath,
      githubSteps: { postCreated: true, indexUpdated: true }
    },
    { schedule: "full" }
  );

  await writePendingPushStatus(env, postId, {
    lastCheckAt: new Date().toISOString(),
    liveCheck,
    attempts: liveCheck.attempts,
    lastError: liveCheck.ok ? "" : liveCheck.diagnosis
  });

  if (!liveCheck.ok) {
    return { sent: false, pending: true, waitingForLive: true, liveCheck, reason: liveCheck.diagnosis };
  }

  const push = await sendNewPostPush(env, {
    postTitle: record.postTitle,
    postId,
    filename: record.filename,
    publishedAt: record.publishedAt,
    cacheVersion: Date.now()
  });

  if (push.sent) {
    await writePendingPushStatus(env, postId, {
      status: "sent",
      sentAt: new Date().toISOString(),
      lastError: "",
      pushResult: { target: push.target, targetUrl: push.targetUrl }
    });
  } else {
    await writePendingPushStatus(env, postId, {
      status: "failed",
      lastError: push.reason || "OneSignal Push fehlgeschlagen"
    });
  }

  return { ...push, liveCheck, pending: !push.sent };
}

async function processAllPendingPushes(env) {
  const registry = await readPendingPushesRegistry(env);
  const pending = Object.values(registry.pushes || {}).filter((item) => item?.status === "pending");
  const results = [];
  for (const record of pending) {
    results.push(await processPendingPushUntilLive(env, record));
  }
  return { processed: pending.length, results };
}

async function retryPendingPostPush(env, input) {
  const postId = String(input.postId || "").trim();
  const filename = sanitizeFilename(String(input.filename || "").trim());
  const postTitle = String(input.postTitle || "").trim() || "Neuer Beitrag";
  const publishedAt = String(input.publishedAt || new Date().toISOString());
  const postsDir = trimSlashes(env.POSTS_DIR || DEFAULT_POSTS_DIR);
  const postPath = String(input.postPath || `${postsDir}/${filename}`).trim();
  if (!postId || !filename) throw httpError("postId und filename fehlen", 400);

  const registry = await readPendingPushesRegistry(env);
  const existing = registry.pushes?.[postId];
  if (existing?.status === "sent" && !input.forceResend) {
    return {
      ok: true,
      sent: true,
      skipped: true,
      reason: "Push wurde bereits gesendet.",
      liveCheck: existing.liveCheck || null,
      push: { sent: true, targetUrl: buildPostPushUrl(env, postId, Date.now()) }
    };
  }

  const record = {
    postId,
    filename,
    postTitle: existing?.postTitle || postTitle,
    publishedAt: existing?.publishedAt || publishedAt,
    postPath: existing?.postPath || postPath,
    status: "pending"
  };
  await writePendingPushStatus(env, postId, record);
  const push = await processPendingPushUntilLive(env, record);
  return {
    ok: true,
    postId,
    filename,
    liveCheck: push.liveCheck || null,
    push
  };
}
async function sendNewPostPush(env, { postTitle, postId, filename, publishedAt, cacheVersion }) {
  const apiKey = oneSignalApiKey(env);
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  if (!apiKey) {
    return { sent: false, reason: "OneSignal API-Key fehlt am Worker (ONESIGNAL_API_KEY_NEW)" };
  }

  const site = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
  const title = "Neuer Beitrag online";
  const message = String(postTitle || "Neuer Beitrag").trim();
  const slug = String(postId || "").trim();
  const version = cacheVersion || Date.now();
  const url = slug ? buildPostPushUrl(env, slug, version) : `${site}/#recent`;
  const icon = `${site}/notification-icon-192.png?v=2`;
  const badge = `${site}/notification-badge-96.png?v=2`;
  const pushData = {
    type: "post",
    postId: slug,
    slug,
    filename: String(filename || "").trim(),
    url,
    publishedAt: publishedAt || new Date().toISOString(),
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
    name: `admin-publish-${Date.now()}`
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

function telegramBotToken(env) {
  return String(env.TELEGRAM_BOT_TOKEN || "").trim();
}

function telegramChannelId(env) {
  return String(env.TELEGRAM_CHANNEL_USERNAME || env.TELEGRAM_CHANNEL_ID || "@dar_al_tauhid").trim();
}

function siteOrigin(env) {
  return String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
}

function telegramPostsPath(env) {
  return trimSlashes(env.TELEGRAM_POSTS_PATH || DEFAULT_TELEGRAM_POSTS_PATH);
}

async function readTelegramPostsRegistry(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = telegramPostsPath(env);
  const file = await githubGet(env, owner, repo, path, branch);
  if (!file?.content) return { posts: {} };
  try {
    const data = JSON.parse(base64ToUtf8(file.content));
    return { posts: data.posts || {}, sha: file.sha };
  } catch (error) {
    return { posts: {}, sha: file.sha };
  }
}

async function writeTelegramPostStatus(env, postId, patch) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = telegramPostsPath(env);
  const registry = await readTelegramPostsRegistry(env);
  const posts = { ...(registry.posts || {}) };
  const key = String(postId || "").trim();
  if (!key) return null;
  posts[key] = {
    ...(posts[key] || {}),
    ...patch,
    postId: key,
    updatedAt: new Date().toISOString()
  };
  const payload = { version: 1, generated: new Date().toISOString(), posts };
  const saved = await githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    `Update telegram status ${key}`,
    branch,
    registry.sha
  );
  return posts[key];
}

function buildTelegramPreviewResponse(env, input) {
  const markdown = String(input.markdown || "").trim();
  const fields = parsePostForTelegram(markdown, {
    postId: input.postId || "",
    websiteOrigin: siteOrigin(env)
  });
  const preview = buildTelegramPreview(fields);
  return {
    ok: preview.validation.ok,
    fields,
    preview,
    errors: preview.validation.errors,
    warnings: [
      preview.tooLong ? "Telegram-Text ist zu lang." : "",
      preview.captionTooLong ? "Text ist für Foto-Caption zu lang – es wird gekürzt oder getrennt gesendet." : ""
    ].filter(Boolean)
  };
}

async function telegramApiCall(env, method, payload, { multipart = false } = {}) {
  const token = telegramBotToken(env);
  if (!token) throw httpError("TELEGRAM_BOT_TOKEN fehlt am Worker", 500);
  const url = `https://api.telegram.org/bot${token}/${method}`;
  let res;
  if (multipart) {
    res = await fetch(url, { method: "POST", body: payload });
  } else {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw httpError(`Telegram ${method} Fehler: ${data.description || res.status}`, res.status || 500);
  }
  return data.result || data;
}

function base64ToBytes(base64) {
  const bin = atob(String(base64 || "").replace(/^data:image\/\w+;base64,/, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sendTelegramPhoto(env, { chatId, imageBase64, caption }) {
  const bytes = base64ToBytes(imageBase64);
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", new Blob([bytes], { type: "image/png" }), "dar-al-tawhid-bildbeitrag.png");
  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
  }
  return telegramApiCall(env, "sendPhoto", form, { multipart: true });
}

async function sendTelegramText(env, { chatId, text }) {
  return telegramApiCall(env, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: false
  });
}

async function sendTelegramTest(env) {
  const chatId = telegramChannelId(env);
  const text = [
    "<b>DAR AL TAWḤID Test</b>",
    "Telegram-Verbindung funktioniert."
  ].join("\n");
  const result = await sendTelegramText(env, { chatId, text });
  return {
    ok: true,
    sent: true,
    status: "sent",
    telegramMessageId: result?.message_id || null,
    telegramSentAt: new Date().toISOString(),
    target: chatId
  };
}

async function sendTelegramPost(env, input) {
  const markdown = String(input.markdown || "").trim();
  const postId = String(input.postId || frontmatterValue(markdown, "id") || "").trim();
  const mode = String(input.mode || "text");
  const forceResend = Boolean(input.forceResend);
  const imageBase64 = String(input.imageBase64 || "");
  const chatId = telegramChannelId(env);

  if (!telegramBotToken(env)) {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: "TELEGRAM_BOT_TOKEN fehlt am Worker",
      skipped: false
    };
  }

  const registry = await readTelegramPostsRegistry(env);
  const existing = registry.posts?.[postId];
  if (!forceResend && (existing?.status === "sent" || existing?.telegramStatus === "sent")) {
    return {
      sent: false,
      status: "sent",
      telegramStatus: "sent",
      skipped: true,
      reason: "Beitrag wurde bereits an Telegram gesendet.",
      telegramMessageId: existing.telegramMessageId || null,
      telegramSentAt: existing.telegramSentAt || null
    };
  }

  const fields = parsePostForTelegram(markdown, { postId, websiteOrigin: siteOrigin(env) });
  const validation = validateTelegramPost(fields);
  if (!validation.ok) {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: validation.errors.join(" "),
      errors: validation.errors,
      skipped: false
    };
  }

  const html = buildTelegramHtml(fields);
  const preview = buildTelegramPreview(fields);
  if (preview.tooLong && mode === "text") {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: "Telegram-Text ist zu lang.",
      skipped: false
    };
  }

  const sendText = mode === "text" || mode === "both";
  const sendImage = (mode === "image" || mode === "both") && imageBase64;

  if ((mode === "image" || mode === "both") && !imageBase64) {
    return {
      sent: false,
      status: "failed",
      telegramStatus: "failed",
      telegramError: "Bildbeitrag fehlt oder konnte nicht generiert werden.",
      skipped: false
    };
  }

  try {
    let messageId = null;

    if (sendImage) {
      const caption = preview.captionTooLong ? shortenForCaption(html) : html;
      const photoResult = await sendTelegramPhoto(env, { chatId, imageBase64, caption });
      messageId = photoResult?.message_id || null;
      if (mode === "both" || preview.captionTooLong) {
        const followup = await sendTelegramText(env, { chatId, text: html });
        messageId = followup?.message_id || messageId;
      }
    } else if (sendText) {
      const textResult = await sendTelegramText(env, { chatId, text: html });
      messageId = textResult?.message_id || null;
    } else {
      throw httpError("Kein Telegram-Modus gewählt", 400);
    }

    const statusPatch = {
      status: "sent",
      telegramStatus: "sent",
      telegramMessageId: messageId,
      telegramSentAt: new Date().toISOString(),
      telegramError: ""
    };
    if (postId) await writeTelegramPostStatus(env, postId, statusPatch);

    return {
      ok: true,
      sent: true,
      skipped: false,
      target: chatId,
      mode,
      previewLength: html.length,
      ...statusPatch
    };
  } catch (error) {
    const fail = {
      status: "failed",
      telegramStatus: "failed",
      telegramError: error.message || String(error),
      telegramSentAt: new Date().toISOString()
    };
    if (postId) await writeTelegramPostStatus(env, postId, fail).catch(() => null);
    return { sent: false, skipped: false, ...fail };
  }
}
