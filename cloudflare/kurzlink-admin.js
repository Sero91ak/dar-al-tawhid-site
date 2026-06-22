/**
 * Kurzlink-Registry — Server-Logik für Cloudflare Worker
 */
const SHORT_DOMAIN = "dar-al-tawhid.de";
const CODE_RE = /^a(\d+)$/i;
const DEFAULT_SHORTLINKS_PATH = "content/admin/source-shortlinks.json";
const PUBLISH_BLOCK_MSG =
  "Dieser Beitrag kann nicht veröffentlicht werden, weil der Quellenlink nicht vollständig geprüft wurde.";

const ALLOWED_DOMAIN_ROOTS = [
  "islamweb.net",
  "shamela.ws",
  "al-maktaba.org",
  "ketabonline.com",
  "dorar.net",
  "quran.ksu.edu.sa",
  "archive.org",
  "waqfeya.net"
];

function isAllowedHost(host) {
  const h = String(host || "")
    .toLowerCase()
    .replace(/^www\./, "");
  return ALLOWED_DOMAIN_ROOTS.some((root) => h === root || h.endsWith(`.${root}`));
}

function normalizeCode(code) {
  const raw = String(code || "").trim().toLowerCase();
  return CODE_RE.test(raw) ? raw : "";
}

function domainFromUrl(url) {
  try {
    return String(new URL(String(url || "").trim()).hostname || "")
      .toLowerCase()
      .replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

function isLocalSourcePath(url) {
  const u = String(url || "").trim();
  return /^\/assets\/sources\//i.test(u) || /^assets\/sources\//i.test(u);
}

function isAllowedTargetUrl(url) {
  const u = String(url || "").trim();
  if (!u) return false;
  if (isLocalSourcePath(u)) return true;
  if (!/^https?:\/\//i.test(u)) return false;
  const host = domainFromUrl(u);
  if (!host) return false;
  return isAllowedHost(host);
}

function hasTextFragment(url) {
  return /#:~:text=/i.test(String(url || ""));
}

export function normalizeShortlinksRegistry(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  const entries = {};
  Object.keys(data.entries || {}).forEach((key) => {
    const code = normalizeCode(key);
    if (!code) return;
    entries[code] = { ...data.entries[key], code };
  });
  let nextSerial = Number(data.nextSerial || 1);
  if (!Number.isFinite(nextSerial) || nextSerial < 1) nextSerial = 1;
  Object.keys(entries).forEach((code) => {
    const n = parseInt(code.slice(1), 10);
    if (n >= nextSerial) nextSerial = n + 1;
  });
  return { version: 1, updatedAt: String(data.updatedAt || ""), nextSerial, entries };
}

export async function readShortlinksRegistry(env, githubGet, base64ToUtf8) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const path = String(env.SHORTLINKS_PATH || DEFAULT_SHORTLINKS_PATH).replace(/^\/+/, "");
  const file = await githubGet(env, owner, repo, path, branch);
  if (!file?.content) {
    return { registry: normalizeShortlinksRegistry({ version: 1, nextSerial: 1, entries: {} }), sha: "", path };
  }
  const registry = normalizeShortlinksRegistry(JSON.parse(base64ToUtf8(file.content)));
  return { registry, sha: file.sha || "", path };
}

export function extractShortlinkFromMarkdown(markdown) {
  const fm = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return "";
  const m = fm[1].match(/^source_shortlink:\s*["']?(a\d+)["']?\s*$/im);
  return m ? normalizeCode(m[1]) : "";
}

export function validateShortlinkEntry(entry, registry, { forPublish = false, existingCode = "" } = {}) {
  const errors = [];
  const e = { ...(entry || {}) };
  const code = normalizeCode(e.code);
  const reg = normalizeShortlinksRegistry(registry);

  if (!code) errors.push("Kurzcode fehlt");
  else if (!CODE_RE.test(code)) errors.push("Kurzcode ungültig");
  else if (reg.entries[code] && normalizeCode(existingCode) !== code) errors.push(`Kurzcode ${code} ist bereits vergeben`);

  const targetUrl = String(e.targetUrl || "").trim();
  if (!targetUrl) errors.push("Ziel-Link fehlt");
  else if (!isAllowedTargetUrl(targetUrl)) errors.push("Quelle nicht erlaubt");

  if (!String(e.platform || "").trim()) errors.push("Quellenplattform fehlt");
  if (!String(e.work || "").trim()) errors.push("Werk fehlt");
  if (!String(e.citation || "").trim()) errors.push("Exakte Quellenangabe fehlt");
  if (!String(e.quote || "").trim()) errors.push("Zitierte Aussage fehlt");

  const th = String(e.textHighlight || "no");
  if (th === "yes" && targetUrl && !hasTextFragment(targetUrl) && !isLocalSourcePath(targetUrl)) {
    errors.push("Textmarkierung fehlt im Ziel-Link");
  }
  if (th === "not_possible" && !String(e.textHighlightNote || "").trim()) {
    errors.push("Bestätigung für fehlende Textmarkierung fehlt");
  }

  const status = String(e.status || "unverified");
  if (forPublish && status !== "verified") errors.push("Prüfstatus muss Geprüft sein");
  if (forPublish && errors.length) errors.unshift(PUBLISH_BLOCK_MSG);

  return { ok: !errors.length, errors, entry: { ...e, code, targetUrl, status } };
}

export function validatePostShortlinkForPublish(markdown, registry) {
  const code = extractShortlinkFromMarkdown(markdown);
  if (!code) {
    return { ok: false, message: `${PUBLISH_BLOCK_MSG} (Kurzcode fehlt)` };
  }
  const entry = normalizeShortlinksRegistry(registry).entries[code];
  if (!entry) {
    return { ok: false, message: `${PUBLISH_BLOCK_MSG} (${code} nicht registriert)` };
  }
  const check = validateShortlinkEntry(entry, registry, { forPublish: true, existingCode: code });
  return { ok: check.ok, message: check.errors[0] || PUBLISH_BLOCK_MSG, errors: check.errors };
}

export function buildShortlinkRedirectHtml(entry) {
  const code = normalizeCode(entry?.code);
  const status = String(entry?.status || "unverified");
  const target = String(entry?.targetUrl || "").trim();
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  if (status === "disabled" || status !== "verified" || !target) {
    return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Quellenlink deaktiviert</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1419;color:#e8eef5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}main{max-width:420px}h1{font-size:1.25rem}p{color:#9fb0c3;line-height:1.5}</style></head>
<body><main><h1>Quellenlink deaktiviert</h1><p>Dieser Quellenlink (${esc(code)}) wurde deaktiviert oder wird aktuell geprüft.</p><p><a href="https://${SHORT_DOMAIN}/">Zur Startseite</a></p></main></body></html>`;
  }
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${esc(target)}">
<link rel="canonical" href="${esc(target)}"><meta name="robots" content="noindex"><title>Weiterleitung zur Quelle</title></head>
<body><p>Weiterleitung zur geprüften Quelle … <a href="${esc(target)}">Hier klicken</a></p>
<script>location.replace(${JSON.stringify(target)});<\/script></body></html>`;
}

export function redirectPathForCode(code) {
  const c = normalizeCode(code);
  return c ? `${c}/index.html` : "";
}

export async function saveAutoShortlinkEntry(env, input, deps) {
  const { githubGet, githubPut, githubCommitBatch, base64ToUtf8 } = deps;
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const { registry, sha, path } = await readShortlinksRegistry(env, githubGet, base64ToUtf8);
  const incoming = { ...(input.entry || input) };
  let code = normalizeCode(incoming.code);
  const postFilename = String(incoming.postFilename || "").trim();
  if (!postFilename) throw new Error("Beitrag fehlt");

  const byPost = Object.values(registry.entries || {}).find((e) => String(e.postFilename || "") === postFilename);
  if (byPost) code = normalizeCode(byPost.code);
  if (!code) code = `a${registry.nextSerial || 1}`;

  const now = new Date().toISOString();
  const merged = {
    ...(registry.entries[code] || {}),
    ...incoming,
    code,
    postFilename,
    status: registry.entries[code]?.status || "unverified",
    updatedAt: now,
    createdAt: registry.entries[code]?.createdAt || now,
    reserved: true
  };

  const check = validateAutoShortlinkEntry(merged, registry, { existingCode: code });
  if (!check.ok) throw new Error(check.errors.join(" · "));

  const nextRegistry = normalizeShortlinksRegistry(registry);
  nextRegistry.entries[code] = check.entry;
  nextRegistry.nextSerial = Math.max(nextRegistry.nextSerial, parseInt(code.slice(1), 10) + 1);
  nextRegistry.updatedAt = now;

  const registryContent = `${JSON.stringify(
    {
      version: nextRegistry.version,
      updatedAt: nextRegistry.updatedAt,
      nextSerial: nextRegistry.nextSerial,
      entries: nextRegistry.entries
    },
    null,
    2
  )}\n`;

  const redirectPath = redirectPathForCode(code);
  const redirectHtml = buildShortlinkRedirectHtml(check.entry);
  const registrySha = String(input.registrySha || sha || "").trim();
  if (registrySha && sha && registrySha !== sha) {
    throw new Error("Registry wurde zwischenzeitlich geändert — bitte neu laden");
  }

  const batch = await githubCommitBatch(env, owner, repo, branch, [
    { path, content: registryContent },
    { path: redirectPath, content: redirectHtml }
  ], `Kurzlink ${code} automatisch verknüpft (${postFilename})`);

  return {
    ok: true,
    code,
    entry: nextRegistry.entries[code],
    registry: nextRegistry,
    redirectPath,
    commitSha: batch.commitSha || "",
    auto: true
  };
}

function validateAutoShortlinkEntry(entry, registry, { existingCode = "" } = {}) {
  const errors = [];
  const e = { ...(entry || {}) };
  const code = normalizeCode(e.code);
  const reg = normalizeShortlinksRegistry(registry);
  if (!code) errors.push("Kurzcode fehlt");
  if (!String(e.postFilename || "").trim()) errors.push("Beitrag fehlt");
  const taken = reg.entries[code];
  if (
    taken &&
    normalizeCode(existingCode) !== code &&
    String(taken.postFilename || "") !== String(e.postFilename || "")
  ) {
    errors.push(`Kurzcode ${code} ist bereits vergeben`);
  }
  const targetUrl = String(e.targetUrl || "").trim();
  if (targetUrl && !isAllowedTargetUrl(targetUrl)) errors.push("Quelle nicht erlaubt");
  return { ok: !errors.length, errors, entry: { ...e, code, targetUrl, status: e.status || "unverified" } };
}

export async function saveShortlinkEntry(env, input, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const { registry, sha, path } = await readShortlinksRegistry(env, githubGet, base64ToUtf8);
  const incoming = { ...(input.entry || input) };
  const existingCode = normalizeCode(incoming.code);
  const isNew = !existingCode || !registry.entries[existingCode];
  let code = existingCode;

  if (!code) {
    code = `a${registry.nextSerial}`;
  }

  const now = new Date().toISOString();
  const merged = {
    ...(registry.entries[code] || {}),
    ...incoming,
    code,
    updatedAt: now,
    createdAt: registry.entries[code]?.createdAt || now,
    reserved: true
  };

  if (merged.status === "verified" && !merged.verifiedAt) merged.verifiedAt = now;
  if (merged.status !== "verified") merged.verifiedAt = merged.status === "verified" ? merged.verifiedAt || now : "";

  const check = validateShortlinkEntry(merged, registry, { existingCode: code });
  if (!check.ok) throw new Error(check.errors.join(" · "));

  const nextRegistry = normalizeShortlinksRegistry(registry);
  nextRegistry.entries[code] = check.entry;
  if (isNew || parseInt(code.slice(1), 10) >= nextRegistry.nextSerial) {
    nextRegistry.nextSerial = Math.max(nextRegistry.nextSerial, parseInt(code.slice(1), 10) + 1);
  }
  nextRegistry.updatedAt = now;

  const registryContent = `${JSON.stringify(
    {
      version: nextRegistry.version,
      updatedAt: nextRegistry.updatedAt,
      nextSerial: nextRegistry.nextSerial,
      entries: nextRegistry.entries
    },
    null,
    2
  )}\n`;

  const redirectPath = redirectPathForCode(code);
  const redirectHtml = buildShortlinkRedirectHtml(check.entry);
  const registrySha = String(input.registrySha || sha || "").trim();

  let commitSha = "";
  if (registrySha && sha && registrySha !== sha) {
    throw new Error("Registry wurde zwischenzeitlich geändert — bitte neu laden");
  }

  if (githubCommitBatch) {
    const batch = await githubCommitBatch(env, owner, repo, branch, [
      { path, content: registryContent },
      { path: redirectPath, content: redirectHtml }
    ], `Kurzlink ${code} ${isNew ? "angelegt" : "aktualisiert"}`);
    commitSha = batch.commitSha || "";
  } else {
    const saved = await githubPut(env, owner, repo, path, registryContent, `Kurzlink ${code}`, branch, sha);
    commitSha = saved.commit?.sha || "";
    await githubPut(env, owner, repo, redirectPath, redirectHtml, `Redirect ${code}`, branch, null);
  }

  return {
    ok: true,
    code,
    entry: nextRegistry.entries[code],
    registry: nextRegistry,
    redirectPath,
    commitSha
  };
}
