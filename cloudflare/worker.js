import {
  buildTelegramPreviewPackage,
  buildTelegramTestMessage,
  buildTelegramCaption
} from "./telegram-formatter.js";

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
const DEFAULT_TELEGRAM_DISPATCH_PATH = "content/admin/telegram-dispatch.json";
const DEFAULT_TELEGRAM_CHANNEL = "@dar_al_tauhid";

export default {
  async fetch(request, env) {
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
          hasTelegramChannel: Boolean(telegramChatId(env)),
          telegramChannel: env.TELEGRAM_CHANNEL_USERNAME || DEFAULT_TELEGRAM_CHANNEL,
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
      const telegramPreviewPaths = new Set(["/api/admin/telegram/preview", "/telegram/preview"]);
      const telegramTestPaths = new Set(["/api/admin/telegram/test", "/telegram/test"]);
      const telegramSendPaths = new Set(["/api/admin/telegram/send", "/telegram/send"]);
      const telegramStatusPaths = new Set(["/api/admin/telegram/status", "/telegram/status"]);

      if (telegramStatusPaths.has(url.pathname)) {
        if (request.method !== "GET") {
          return json({ ok: false, error: "GET required" }, cors, 405);
        }
        assertConfigured(env);
        assertAuthorized(request, env);
        return json(await handleTelegramStatus(env, url), cors);
      }

      const adminPostPaths = new Set([
        ...publishPaths,
        ...newsPaths,
        ...schedulePaths,
        ...schedulerPaths,
        ...telegramPreviewPaths,
        ...telegramTestPaths,
        ...telegramSendPaths
      ]);

      if (!adminPostPaths.has(url.pathname)) {
        return json({ ok: false, error: "Not found" }, cors, 404);
      }

      if (request.method !== "POST") {
        return json({ ok: false, error: "POST required" }, cors, 405);
      }

      assertConfigured(env);
      assertAuthorized(request, env);

      const input = await request.json().catch(() => ({}));

      if (telegramPreviewPaths.has(url.pathname)) {
        return json(handleTelegramPreview(input), cors);
      }

      if (telegramTestPaths.has(url.pathname)) {
        return json(await handleTelegramTest(env), cors);
      }

      if (telegramSendPaths.has(url.pathname)) {
        return json(await handleTelegramSend(env, input), cors);
      }

      if (publishPaths.has(url.pathname)) {
        return json(await publishPostFromMarkdown(env, input), cors);
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

async function publishPostFromMarkdown(env, input) {
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
  const push = await sendNewPostPush(env, { postTitle, postId });

  let telegram = {
    telegramStatus: "not_sent",
    telegramMessageId: null,
    telegramSentAt: null,
    telegramError: null,
    skipped: true
  };

  if (input.telegram?.enabled) {
    telegram = await dispatchTelegramPost(env, {
      markdown,
      filename,
      postId,
      mode: input.telegram.mode || "text",
      imageBase64: input.telegram.imageBase64 || "",
      imageMime: input.telegram.imageMime || "image/png",
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

async function sendNewPostPush(env, { postTitle, postId }) {
  const apiKey = oneSignalApiKey(env);
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  if (!apiKey) {
    return { sent: false, reason: "ONESIGNAL_API_KEY_NEW fehlt am Worker" };
  }

  const site = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
  const title = "Neuer Beitrag online";
  const message = String(postTitle || "Neuer Beitrag").trim();
  const url = postId ? `${site}/#post/${encodeURIComponent(postId)}` : `${site}/#recent`;
  const icon = `${site}/notification-icon-192.png?v=2`;
  const badge = `${site}/notification-badge-96.png?v=2`;

  const basePayload = {
    app_id: appId,
    target_channel: "push",
    headings: { en: title, de: title },
    contents: { en: message, de: message },
    url,
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

function telegramChatId(env) {
  return String(env.TELEGRAM_CHANNEL_ID || env.TELEGRAM_CHANNEL_USERNAME || DEFAULT_TELEGRAM_CHANNEL).trim();
}

function telegramDispatchPath(env) {
  return trimSlashes(env.TELEGRAM_DISPATCH_PATH || DEFAULT_TELEGRAM_DISPATCH_PATH);
}

async function readTelegramDispatch(env) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = telegramDispatchPath(env);
  const file = await githubGet(env, owner, repo, path, branch);
  if (!file?.content) {
    return { version: 1, posts: {}, file: null };
  }
  const parsed = JSON.parse(base64ToUtf8(file.content));
  return {
    version: Number(parsed.version || 1),
    posts: parsed.posts && typeof parsed.posts === "object" ? parsed.posts : {},
    file
  };
}

async function writeTelegramDispatch(env, dispatch, message) {
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = telegramDispatchPath(env);
  const current = dispatch.file ? dispatch : await readTelegramDispatch(env);
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    posts: current.posts || {}
  };
  const saved = await githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(payload, null, 2)}\n`,
    message || "Update telegram dispatch log",
    branch,
    current.file?.sha
  );
  return saved;
}

function telegramRecordKey(postId, filename) {
  return String(postId || filename || "").trim();
}

async function saveTelegramRecord(env, key, record) {
  if (!key) return;
  const dispatch = await readTelegramDispatch(env);
  dispatch.posts[key] = {
    ...record,
    updatedAt: new Date().toISOString()
  };
  await writeTelegramDispatch(env, dispatch, `Telegram status ${key}`);
}

async function telegramApiRequest(env, method, body, { multipart = false } = {}) {
  const token = telegramBotToken(env);
  if (!token) throw httpError("TELEGRAM_BOT_TOKEN fehlt am Worker", 500);
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, multipart ? { method: "POST", body } : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const message = data.description || `Telegram API Fehler ${res.status}`;
    const error = httpError(message, res.status || 502);
    error.telegram = { status: res.status, code: data.error_code || null, description: data.description || message };
    throw error;
  }
  return data;
}

async function sendTelegramHtmlMessage(env, html, options = {}) {
  const chatId = telegramChatId(env);
  const data = await telegramApiRequest(env, "sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: options.disablePreview !== false
  });
  return {
    telegramStatus: "sent",
    telegramMessageId: data.result?.message_id || null,
    telegramSentAt: new Date().toISOString(),
    telegramError: null,
    chatId
  };
}

async function sendTelegramPhotoMessage(env, { imageBytes, caption, mimeType = "image/png" }) {
  const chatId = telegramChatId(env);
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("photo", new Blob([imageBytes], { type: mimeType }), "dar-post.png");
  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
  }
  const data = await telegramApiRequest(env, "sendPhoto", form, { multipart: true });
  return {
    telegramStatus: "sent",
    telegramMessageId: data.result?.message_id || null,
    telegramSentAt: new Date().toISOString(),
    telegramError: null,
    chatId
  };
}

function decodeImageBase64(value) {
  const raw = String(value || "").replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!raw) return null;
  const bin = atob(raw);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function handleTelegramPreview(input) {
  const markdown = String(input.markdown || "").trim();
  if (!markdown) throw httpError("Markdown fehlt", 400);
  const preview = buildTelegramPreviewPackage(markdown, {
    postId: String(input.postId || "").trim(),
    websiteUrl: String(input.websiteUrl || "").trim() || undefined
  });
  return {
    ok: true,
    preview,
    validation: preview.validation
  };
}

async function handleTelegramTest(env) {
  if (!telegramBotToken(env)) throw httpError("TELEGRAM_BOT_TOKEN fehlt am Worker", 500);
  const test = buildTelegramTestMessage();
  const result = await sendTelegramHtmlMessage(env, test.html);
  return { ok: true, message: "Telegram-Test gesendet", telegram: result };
}

async function handleTelegramStatus(env, url) {
  const postId = String(url.searchParams.get("postId") || "").trim();
  const filename = String(url.searchParams.get("filename") || "").trim();
  const key = telegramRecordKey(postId, filename);
  const dispatch = await readTelegramDispatch(env);
  const record = key ? dispatch.posts[key] || null : null;
  return {
    ok: true,
    postId: postId || null,
    filename: filename || null,
    record,
    hasTelegramToken: Boolean(telegramBotToken(env)),
    channel: telegramChatId(env)
  };
}

async function dispatchTelegramPost(env, input) {
  const markdown = String(input.markdown || "").trim();
  const filename = String(input.filename || "").trim();
  const postId = String(input.postId || frontmatterValue(markdown, "id") || "").trim();
  const mode = String(input.mode || "text");
  const forceResend = Boolean(input.forceResend);
  const key = telegramRecordKey(postId, filename);

  if (!telegramBotToken(env)) {
    return {
      telegramStatus: "failed",
      telegramMessageId: null,
      telegramSentAt: null,
      telegramError: "TELEGRAM_BOT_TOKEN fehlt am Worker",
      skipped: false
    };
  }

  const dispatch = await readTelegramDispatch(env);
  const existing = key ? dispatch.posts[key] : null;
  if (existing?.telegramStatus === "sent" && !forceResend) {
    return {
      ...existing,
      skipped: true,
      duplicateBlocked: true
    };
  }

  const preview = buildTelegramPreviewPackage(markdown, { postId });
  if (!preview.validation.ok) {
    return {
      telegramStatus: "failed",
      telegramMessageId: null,
      telegramSentAt: null,
      telegramError: preview.validation.errors.join(" · "),
      skipped: false,
      validation: preview.validation
    };
  }

  try {
    const sendText = mode === "text" || mode === "both";
    const sendImage = mode === "image" || mode === "both";
    let lastResult = null;

    if (sendImage) {
      const imageBytes = decodeImageBase64(input.imageBase64);
      if (!imageBytes || !imageBytes.length) {
        throw httpError("Bildbeitrag fehlt (1080×1350 PNG/JPG erforderlich)", 400);
      }
      if (imageBytes.length > 10 * 1024 * 1024) {
        throw httpError("Bildbeitrag ist zu groß (max. 10 MB)", 400);
      }
      const captionPack = buildTelegramCaption(preview.fields);
      lastResult = await sendTelegramPhotoMessage(env, {
        imageBytes,
        caption: captionPack.caption,
        mimeType: String(input.imageMime || "image/png")
      });
      if (mode === "image" && captionPack.followUp) {
        lastResult = await sendTelegramHtmlMessage(env, captionPack.followUp);
      }
    }

    if (sendText) {
      lastResult = await sendTelegramHtmlMessage(env, preview.validation.html);
    }

    if (!sendText && !sendImage) {
      throw httpError("Telegram-Modus ungültig", 400);
    }

    const record = {
      telegramStatus: "sent",
      telegramMessageId: lastResult.telegramMessageId,
      telegramSentAt: lastResult.telegramSentAt,
      telegramError: null,
      filename,
      postId,
      mode
    };
    if (key) await saveTelegramRecord(env, key, record);
    return { ...record, skipped: false };
  } catch (error) {
    const record = {
      telegramStatus: "failed",
      telegramMessageId: null,
      telegramSentAt: null,
      telegramError: error.telegram?.description || error.message || String(error),
      telegramErrorCode: error.telegram?.code || error.status || null,
      filename,
      postId,
      mode
    };
    if (key) await saveTelegramRecord(env, key, record);
    return { ...record, skipped: false };
  }
}

async function handleTelegramSend(env, input) {
  const result = await dispatchTelegramPost(env, input);
  const ok = result.telegramStatus === "sent";
  return {
    ok,
    telegram: result,
    duplicateBlocked: Boolean(result.duplicateBlocked),
    message: result.duplicateBlocked
      ? "Beitrag wurde bereits an Telegram gesendet"
      : ok
        ? "Telegram-Post gesendet"
        : "Telegram-Post fehlgeschlagen"
  };
}
