const DEFAULT_OWNER = "Sero91ak";
const DEFAULT_REPO = "dar-al-tawhid-site";
const DEFAULT_BRANCH = "main";
const DEFAULT_POSTS_DIR = "content/posts";
const DEFAULT_ALLOWED_ORIGIN = "https://dar-al-tawhid.de";

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
          hasAdminSecret: Boolean(env.ADMIN_PUBLISH_SECRET)
        }, cors);
      }

      if (url.pathname !== "/publish" && url.pathname !== "/api/admin/publish") {
        return json({ ok: false, error: "Not found" }, cors, 404);
      }

      if (request.method !== "POST") {
        return json({ ok: false, error: "POST required" }, cors, 405);
      }

      assertConfigured(env);
      assertAuthorized(request, env);

      const input = await request.json().catch(() => ({}));
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
      const nextNumber = maxPostNumber(indexData.files) + 1;

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
      const files = Array.isArray(indexData.files) ? indexData.files.filter(file => file && file.name !== filename) : [];
      files.push({ name: filename, sha: created.content.sha });
      files.sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));

      const payload = {
        version: Number(indexData.version || 1),
        generated: new Date().toISOString(),
        count: files.length,
        files
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

      return json({
        ok: true,
        filename,
        number: nextNumber,
        postPath,
        indexPath,
        commitSha: updatedIndex.commit?.sha || created.commit?.sha || ""
      }, cors);
    } catch (error) {
      return json({ ok: false, error: error.message || String(error) }, cors, error.status || 500);
    }
  }
};

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

function maxPostNumber(files) {
  let max = 0;
  for (const file of files || []) {
    const name = typeof file === "string" ? file : file.name;
    for (const match of String(name || "").matchAll(/(?:^|-)(\d{3})(?=-|\.md$)/g)) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return max;
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
