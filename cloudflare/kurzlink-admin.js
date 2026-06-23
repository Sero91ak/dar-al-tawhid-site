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

function isHttpsUrl(url) {
  try {
    return new URL(String(url || "").trim()).protocol === "https:";
  } catch (e) {
    return false;
  }
}

function isPublicRedirectStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "active" || s === "verified";
}

function normalizeForCompare(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function findDuplicateEntry(registry, { targetUrl = "", quote = "", selfCode = "" } = {}) {
  const reg = normalizeShortlinksRegistry(registry);
  const target = String(targetUrl || "").trim();
  const quoteNorm = normalizeForCompare(quote);
  const self = normalizeCode(selfCode);
  for (const other of Object.values(reg.entries || {})) {
    const code = normalizeCode(other.code);
    if (!code || code === self) continue;
    if (target && String(other.targetUrl || "").trim() === target) {
      return { code, reason: "Doppelter Originalquellenlink" };
    }
    if (quoteNorm && normalizeForCompare(other.quote) === quoteNorm) {
      return { code, reason: "Doppelte Aussage" };
    }
  }
  return null;
}

function isShortlinkUrl(url) {
  const u = String(url || "").trim();
  if (!u) return false;
  return new RegExp(`^(https?:\\/\\/)?(www\\.)?${SHORT_DOMAIN.replace(/\./g, "\\.")}\\/a\\d+\\/?$`, "i").test(u);
}

function detectPlatform(url) {
  if (isLocalSourcePath(url)) return "PDF/Scan (lokal)";
  const host = domainFromUrl(url);
  if (!host) return "";
  if (host.includes("islamweb")) return "Islamweb";
  if (host.includes("shamela")) return "Shamela";
  if (host.includes("maktaba")) return "al-Maktaba";
  if (host.includes("ketabonline")) return "Ketabonline";
  if (host.includes("dorar")) return "Dorar";
  if (host.includes("quran.ksu")) return "quran.ksu.edu.sa";
  if (host.includes("archive.org")) return "Archive";
  if (host.includes("waqfeya")) return "Waqfeya";
  return "";
}

function normalizeImportLink(raw) {
  if (typeof raw === "string") {
    const targetUrl = String(raw || "").trim();
    return targetUrl ? { targetUrl, adminNote: "", platform: "" } : null;
  }
  if (!raw || typeof raw !== "object") return null;
  const targetUrl = String(raw.targetUrl || raw.url || raw.quelle || raw.source || "").trim();
  if (!targetUrl) return null;
  return {
    targetUrl,
    adminNote: String(raw.adminNote || raw.note || raw.bemerkung || "").trim(),
    platform: String(raw.platform || "").trim(),
    textHighlightNote: String(raw.textHighlightNote || "").trim()
  };
}

function formatInstagramLine(code) {
  const c = normalizeCode(code);
  return c ? `🔗 https://${SHORT_DOMAIN}/${c}` : "";
}

export function buildImageShareText(input = {}) {
  const code = normalizeCode(input.code || input.sourceShortlink || "");
  const scholar = String(input.scholar || input.title || "").trim();
  const quote = String(input.quote || input.statement || "").trim();
  const citation = String(input.sourceCitation || input.adminNote || "").trim();
  const shortLink = code ? formatInstagramLine(code) : "";
  const parts = [];
  if (scholar) parts.push(`${scholar} sagte:`, "", quote);
  else if (quote) parts.push(quote);
  if (citation) parts.push("", `📝 ${citation}`);
  if (shortLink) parts.push("", shortLink);
  return parts.join("\n").trim();
}

export function buildChannelShareText(input = {}) {
  const postType = String(input.postType || input.contentType || "channel").toLowerCase();
  if (postType.includes("image") || postType === "instagram_image") {
    return buildImageShareText(input);
  }
  const code = normalizeCode(input.code || input.sourceShortlink || "");
  const titleClean = String(input.title || "")
    .replace(/^📖\s*/, "")
    .trim();
  const titleLine = titleClean ? `📖 ${titleClean}` : "";
  const tags = String(input.hashtags || "")
    .trim()
    .replace(/^#/, "");
  const tagLine = tags
    ? tags
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`))
        .join(" ")
    : "";
  const body = String(input.statement || input.quote || "").trim();
  const citation = String(input.sourceCitation || input.adminNote || "").trim();
  const shortLink = code ? formatInstagramLine(code) : "";
  const fazitLine = String(input.fazit || "").trim();
  const parts = [];
  if (titleLine) parts.push(titleLine);
  if (tagLine) parts.push(tagLine);
  if (body) parts.push("", body);
  if (citation) parts.push("", `📝 ${citation}`);
  if (shortLink) parts.push("", shortLink);
  if (fazitLine) parts.push("", `🌙 **Fazit:** ${fazitLine}`);
  return parts.join("\n").trim();
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

export function validateRedirectShortlinkEntry(entry, registry, { forVerified = false, existingCode = "" } = {}) {
  const errors = [];
  const warnings = [];
  const e = { ...(entry || {}) };
  const code = normalizeCode(e.code);
  const reg = normalizeShortlinksRegistry(registry);

  if (!code) errors.push("Kurzcode fehlt");
  else if (!CODE_RE.test(code)) errors.push("Kurzcode ungültig");
  else if (reg.entries[code] && normalizeCode(existingCode) !== code) errors.push(`Kurzcode ${code} ist bereits vergeben`);

  const targetUrl = String(e.targetUrl || "").trim();
  if (!targetUrl) errors.push("Ziel-Link fehlt");
  else if (!isAllowedTargetUrl(targetUrl)) errors.push("Quelle nicht erlaubt");

  const platform = String(e.platform || "").trim();
  if (!platform) warnings.push("Quellenplattform fehlt — bitte wählen");

  const th = hasTextFragment(targetUrl) ? "yes" : String(e.textHighlight || "no");
  if (forVerified && targetUrl && !hasTextFragment(targetUrl) && !isLocalSourcePath(targetUrl)) {
    if (th !== "not_possible" || !String(e.textHighlightNote || "").trim()) {
      errors.push("Ziel-Link braucht Textmarkierung (#:~:text=…) oder bestätigte Ausnahme");
    }
  }

  const status = String(e.status || "unverified");
  if (forVerified && !isPublicRedirectStatus(status)) {
    errors.push("Erst als geprüft/aktiv markieren, dann leitet der Link zur Quelle weiter");
  }

  return {
    ok: !errors.length,
    errors,
    warnings,
    entry: { ...e, code, targetUrl, platform, textHighlight: th, status }
  };
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
  if (forPublish && !isPublicRedirectStatus(status)) errors.push("Prüfstatus muss Aktiv oder Geprüft sein");
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
  if (status === "disabled" || status === "error" || !isPublicRedirectStatus(status) || !target) {
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

  if (isPublicRedirectStatus(merged.status) && !merged.verifiedAt) merged.verifiedAt = now;
  if (!isPublicRedirectStatus(merged.status)) merged.verifiedAt = "";

  const forVerified = isPublicRedirectStatus(merged.status);
  const skipStrict = merged.status === "disabled" || merged.status === "error";
  const check = skipStrict
    ? { ok: Boolean(code), errors: code ? [] : ["Kurzcode fehlt"], entry: merged }
    : validateRedirectShortlinkEntry(merged, registry, { existingCode: code, forVerified });
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

export async function importShortlinkBatch(env, input, { githubGet, githubPut, githubCommitBatch, base64ToUtf8 }) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const rawLinks = Array.isArray(input.links) ? input.links : [];
  if (!rawLinks.length) throw new Error("Keine Links zum Importieren");

  const { registry, sha, path } = await readShortlinksRegistry(env, githubGet, base64ToUtf8);
  const registrySha = String(input.registrySha || sha || "").trim();
  if (registrySha && sha && registrySha !== sha) {
    throw new Error("Registry wurde zwischenzeitlich geändert — bitte neu laden");
  }

  const verify = input.verify === true;
  const now = new Date().toISOString();
  let nextRegistry = normalizeShortlinksRegistry(registry);
  let serial = nextRegistry.nextSerial || 1;
  const created = [];
  const skipped = [];
  const batchEntries = [];

  for (const raw of rawLinks) {
    const link = normalizeImportLink(raw);
    if (!link?.targetUrl) continue;
    if (isShortlinkUrl(link.targetUrl)) {
      skipped.push({ targetUrl: link.targetUrl, reason: "Bereits Kurzlink" });
      continue;
    }
    if (!isAllowedTargetUrl(link.targetUrl)) {
      skipped.push({ targetUrl: link.targetUrl, reason: "Domain nicht erlaubt" });
      continue;
    }

    const code = `a${serial}`;
    serial += 1;
    const targetUrl = link.targetUrl;
    const th = hasTextFragment(targetUrl) ? "yes" : link.textHighlightNote ? "not_possible" : "no";
    const entry = {
      code,
      targetUrl,
      platform: link.platform || detectPlatform(targetUrl),
      textHighlight: th,
      textHighlightNote: th === "not_possible" ? String(link.textHighlightNote || "").trim() : "",
      adminNote: link.adminNote || "",
      status: verify ? "active" : "unverified",
      verifiedAt: verify ? now : "",
      createdAt: now,
      updatedAt: now,
      source: "chatgpt-import"
    };

    const check = validateRedirectShortlinkEntry(entry, nextRegistry, { existingCode: code, forVerified: verify });
    if (!check.ok) {
      skipped.push({ targetUrl, reason: check.errors.join("; ") });
      serial -= 1;
      continue;
    }

    nextRegistry.entries[code] = check.entry;
    batchEntries.push({ path: redirectPathForCode(code), content: buildShortlinkRedirectHtml(check.entry) });
    created.push({
      code,
      targetUrl,
      platform: check.entry.platform,
      instagramLine: formatInstagramLine(code),
      status: check.entry.status
    });
  }

  if (!created.length) {
    const detail = skipped.map((s) => `${String(s.targetUrl || "").slice(0, 48)}: ${s.reason}`).join(" · ");
    throw new Error(detail || "Import fehlgeschlagen — keine gültigen Links");
  }

  nextRegistry.nextSerial = serial;
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

  const commitFiles = [{ path, content: registryContent }, ...batchEntries];
  let commitSha = "";
  if (githubCommitBatch) {
    const batch = await githubCommitBatch(
      env,
      owner,
      repo,
      branch,
      commitFiles,
      `Kurzlink-Import: ${created.map((c) => c.code).join(", ")} (ChatGPT)`
    );
    commitSha = batch.commitSha || "";
  } else {
    const saved = await githubPut(env, owner, repo, path, registryContent, `Kurzlink-Import ${created.length}`, branch, sha);
    commitSha = saved.commit?.sha || "";
    for (const file of batchEntries) {
      await githubPut(env, owner, repo, file.path, file.content, `Redirect ${file.path}`, branch, null);
    }
  }

  return {
    ok: true,
    created,
    skipped,
    count: created.length,
    registry: nextRegistry,
    commitSha,
    instagramBlock: created.map((c) => c.instagramLine).join("\n")
  };
}

export function validateCreateShortlinkInput(input, registry) {
  const errors = [];
  const targetUrl = String(input?.targetUrl || "").trim();
  const quote = String(input?.quote || "").trim();
  const adminNote = String(input?.adminNote || "").trim();
  const platform = String(input?.sourcePlatform || input?.platform || "").trim();
  const textHighlightException = input?.textHighlightException === true;
  const textHighlightNote = String(input?.textHighlightNote || "").trim();

  if (!targetUrl) errors.push("Ziel-Link fehlt");
  else if (!isHttpsUrl(targetUrl) && !isLocalSourcePath(targetUrl)) errors.push("Ziel-Link muss HTTPS sein");
  else if (!isAllowedTargetUrl(targetUrl)) errors.push("Domain nicht erlaubt");

  if (!quote) errors.push("Zitierte Aussage fehlt");
  if (!adminNote) errors.push("Quellenangabe fehlt");

  const hasFragment = hasTextFragment(targetUrl);
  if (targetUrl && !isLocalSourcePath(targetUrl)) {
    if (!hasFragment && !textHighlightException) errors.push("Textmarkierung fehlt");
    if (!hasFragment && textHighlightException && !textHighlightNote) {
      errors.push("Ausnahme für fehlende Textmarkierung muss bestätigt werden");
    }
  }

  const dup = findDuplicateEntry(registry, { targetUrl, quote });
  if (dup) errors.push(`${dup.reason} (${dup.code})`);

  const th = hasFragment ? "yes" : textHighlightException ? "not_possible" : "no";
  return {
    ok: !errors.length,
    errors,
    entry: {
      targetUrl,
      quote,
      adminNote,
      platform: platform || detectPlatform(targetUrl),
      work: adminNote,
      citation: adminNote,
      textHighlight: th,
      textHighlightNote: th === "not_possible" ? textHighlightNote : "",
      contentType: String(input?.contentType || "instagram_channel").trim(),
      source: "api-create"
    }
  };
}

export async function createShortlinkEntry(env, input, { githubGet, githubPut, githubCommitBatch, base64ToUtf8, logMeta = {} } = {}) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const { registry, sha, path } = await readShortlinksRegistry(env, githubGet, base64ToUtf8);
  const registrySha = String(input?.registrySha || sha || "").trim();
  if (registrySha && sha && registrySha !== sha) {
    return { ok: false, success: false, error: "Registry wurde zwischenzeitlich geändert — bitte neu laden" };
  }

  const check = validateCreateShortlinkInput(input, registry);
  if (!check.ok) {
    return { ok: false, success: false, error: check.errors[0] || "Kurzlink konnte nicht erstellt werden" };
  }

  const nextRegistry = normalizeShortlinksRegistry(registry);
  const code = `a${nextRegistry.nextSerial || 1}`;
  if (nextRegistry.entries[code]) {
    return { ok: false, success: false, error: `Kurzcode ${code} ist bereits vergeben` };
  }

  const now = new Date().toISOString();
  const hasFragment = hasTextFragment(check.entry.targetUrl);
  const status = hasFragment || check.entry.textHighlight === "not_possible" ? "active" : "draft";
  const entry = {
    ...check.entry,
    code,
    status,
    verifiedAt: status === "active" ? now : "",
    createdAt: now,
    updatedAt: now,
    reserved: true,
    redirectType: "302",
    creationLog: [
      {
        at: now,
        action: "create",
        contentType: check.entry.contentType,
        client: String(logMeta.client || ""),
        ip: String(logMeta.ip || ""),
        userAgent: String(logMeta.userAgent || "").slice(0, 200)
      }
    ]
  };

  const redirectCheck = validateRedirectShortlinkEntry(entry, nextRegistry, { existingCode: code, forVerified: status === "active" });
  if (!redirectCheck.ok) {
    return { ok: false, success: false, error: redirectCheck.errors.join(" · ") };
  }

  nextRegistry.entries[code] = redirectCheck.entry;
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
  const redirectHtml = buildShortlinkRedirectHtml(redirectCheck.entry);

  let commitSha = "";
  if (githubCommitBatch) {
    const batch = await githubCommitBatch(
      env,
      owner,
      repo,
      branch,
      [
        { path, content: registryContent },
        { path: redirectPath, content: redirectHtml }
      ],
      `Kurzlink ${code} automatisch erstellt (${check.entry.contentType})`
    );
    commitSha = batch.commitSha || "";
  } else {
    const saved = await githubPut(env, owner, repo, path, registryContent, `Kurzlink ${code} erstellt`, branch, sha);
    commitSha = saved.commit?.sha || "";
    await githubPut(env, owner, repo, redirectPath, redirectHtml, `Redirect ${code}`, branch, null);
  }

  const shortUrl = `https://${SHORT_DOMAIN}/${code}`;
  const channelFields = input?.title || input?.statement || input?.hashtags || input?.fazit || input?.sourceCitation || input?.quote;
  const postType = String(input?.postType || input?.contentType || "channel").toLowerCase();
  const instagramPost = channelFields
    ? buildChannelShareText({
        postType,
        title: input?.title,
        scholar: input?.scholar,
        hashtags: input?.hashtags,
        statement: input?.statement,
        quote: input?.quote,
        sourceCitation: input?.sourceCitation || input?.adminNote,
        fazit: input?.fazit,
        code
      })
    : "";
  return {
    ok: true,
    success: true,
    code,
    shortUrl,
    targetUrl: check.entry.targetUrl,
    status: "created",
    entry: nextRegistry.entries[code],
    registry: nextRegistry,
    commitSha,
    instagramLine: formatInstagramLine(code),
    instagramPost
  };
}

export function validateInstagramChannelInput(input) {
  const errors = [];
  const postType = String(input?.postType || input?.contentType || "channel").toLowerCase();
  const isImage = postType.includes("image") || postType === "instagram_image";
  const quote = String(input?.quote || input?.statement || "").trim();
  const sourceCitation = String(input?.sourceCitation || input?.adminNote || "").trim();
  const scholar = String(input?.scholar || "").trim();

  if (isImage) {
    if (!quote) errors.push("Zitierte Aussage fehlt");
    if (!sourceCitation) errors.push("Quellenangabe fehlt");
    if (!scholar) errors.push("Gelehrter fehlt");
    return { ok: !errors.length, errors, postType: "image" };
  }

  const title = String(input?.title || "").trim();
  const statement = String(input?.statement || "").trim();
  const fazit = String(input?.fazit || "").trim();
  if (!title) errors.push("Titel fehlt");
  if (!statement) errors.push("Beitragstext fehlt");
  if (!sourceCitation) errors.push("Kurze Quellenangabe fehlt");
  if (!fazit) errors.push("Fazit fehlt");
  return { ok: !errors.length, errors, postType: "channel" };
}

export async function createInstagramChannelPost(env, input, deps) {
  const channelCheck = validateInstagramChannelInput(input);
  if (!channelCheck.ok) {
    return { ok: false, success: false, error: channelCheck.errors[0] || "Beitragsdaten unvollständig" };
  }

  const payload = {
    ...input,
    adminNote: String(input?.adminNote || input?.sourceCitation || "").trim(),
    quote: String(input?.quote || input?.statement || "").trim(),
    contentType: "instagram_channel_gpt",
    sourcePlatform: String(input?.sourcePlatform || "").trim()
  };

  const result = await createShortlinkEntry(env, payload, {
    ...deps,
    logMeta: {
      ...(deps?.logMeta || {}),
      client: String(input?.client || deps?.logMeta?.client || "gpt-action")
    }
  });

  if (!result.ok) return result;

  const instagramPost =
    result.instagramPost ||
    buildChannelShareText({
      postType: input?.postType || input?.contentType || "channel",
      title: input?.title,
      scholar: input?.scholar,
      hashtags: input?.hashtags,
      statement: input?.statement,
      quote: input?.quote,
      sourceCitation: input?.sourceCitation || input?.adminNote,
      fazit: input?.fazit,
      code: result.code
    });

  return {
    ...result,
    instagramPost,
    message: "Instagram-Channel-Beitrag mit echtem Kurzlink erstellt. instagramPost ist kopierbereit."
  };
}
