/* Live-Bearbeitung admin APIs: audit, versions, dua save, meta save */
const AUDIT_PATH = "content/admin/live-audit-log.json";
const VERSIONS_PATH = "content/admin/live-versions.json";
const META_SCHOLARS_PATH = "content/admin/live-scholars.json";
const META_BOOKS_PATH = "content/admin/live-books.json";
const DUAS_INDEX_PATH = "content/duas/duas.json";

function jsonOk(data) {
  return { ok: true, ...data };
}

function utf8ToBase64(text) {
  return btoa(unescape(encodeURIComponent(String(text || ""))));
}

async function readJsonFile(env, helpers, path, fallback) {
  const { githubGet, base64ToUtf8 } = helpers;
  try {
    const file = await githubGet(env, path);
    if (!file?.content) return { data: fallback, sha: null };
    const raw = base64ToUtf8(file.content.replace(/\n/g, ""));
    return { data: JSON.parse(raw), sha: file.sha || null };
  } catch (e) {
    return { data: fallback, sha: null };
  }
}

async function writeJsonFile(env, helpers, path, data, message, sha) {
  const { githubPut } = helpers;
  const content = utf8ToBase64(JSON.stringify(data, null, 2) + "\n");
  return githubPut(env, path, content, message, sha || undefined);
}

function slugifyDuaId(id) {
  return String(id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildDuaMarkdown(dua) {
  const id = slugifyDuaId(dua.id || dua.title || `dua-${Date.now()}`);
  return `---
id: "${id}"
type: "${String(dua.type || "").replace(/"/g, '\\"')}"
cat: "${String(dua.cat || "").replace(/"/g, '\\"')}"
title: "${String(dua.title || "").replace(/"/g, '\\"')}"
occasion: "${String(dua.occasion || "").replace(/"/g, '\\"')}"
src: "${String(dua.src || "").replace(/"/g, '\\"')}"
status: "${String(dua.status || "published").replace(/"/g, "")}"
---

## Arabisch

${String(dua.ar || "").trim()}

## Lautschrift

${String(dua.tr || "").trim()}

## Deutsch

${String(dua.de || "").trim()}

## Quelle

${String(dua.src || "").trim()}
`;
}

export async function appendLiveAudit(env, entry, helpers) {
  const { data, sha } = await readJsonFile(env, helpers, AUDIT_PATH, { version: 1, entries: [] });
  const rows = Array.isArray(data.entries) ? data.entries : [];
  rows.unshift({
    actorId: entry.actorId || "admin",
    actorRole: entry.actorRole || "owner",
    action: entry.action || "unknown",
    entityType: entry.entityType || "",
    entityId: entry.entityId || "",
    timestamp: entry.timestamp || new Date().toISOString(),
    changes: entry.changes || {},
    deviceInfo: entry.deviceInfo || "",
    environment: entry.environment || "production",
    sourceApp: entry.sourceApp || "dar-admin",
    analyticsExcluded: true
  });
  data.entries = rows.slice(0, 2000);
  data.updatedAt = new Date().toISOString();
  await writeJsonFile(env, helpers, AUDIT_PATH, data, `chore(admin): live audit ${entry.action || ""}`, sha);
  return jsonOk({ stored: true });
}

export async function appendLiveVersion(env, entry, helpers) {
  const { data, sha } = await readJsonFile(env, helpers, VERSIONS_PATH, { version: 1, entries: [] });
  const rows = Array.isArray(data.entries) ? data.entries : [];
  rows.unshift({
    entityType: entry.entityType || "",
    entityId: entry.entityId || "",
    actorId: entry.actorId || "admin",
    timestamp: entry.timestamp || new Date().toISOString(),
    status: entry.status || "",
    changedFields: entry.changedFields || [],
    previous: entry.previous || null,
    next: entry.next || null
  });
  data.entries = rows.slice(0, 2000);
  data.updatedAt = new Date().toISOString();
  await writeJsonFile(env, helpers, VERSIONS_PATH, data, `chore(admin): live version ${entry.entityType}/${entry.entityId}`, sha);
  return jsonOk({ stored: true });
}

export async function getDuaAdmin(env, id, helpers) {
  const { data } = await readJsonFile(env, helpers, DUAS_INDEX_PATH, []);
  const list = Array.isArray(data) ? data : [];
  const dua = list.find((x) => String(x.id) === String(id));
  if (!dua) return { ok: false, error: "Duʿāʾ nicht gefunden" };
  return jsonOk({ dua });
}

export async function saveDuaAdmin(env, input, helpers) {
  const { githubGet, githubPut, githubCommitBatch, base64ToUtf8 } = helpers;
  const duaIn = input?.dua || input || {};
  const id = slugifyDuaId(duaIn.id || duaIn.title);
  if (!id) return { ok: false, error: "Duʿāʾ-ID fehlt" };
  if (!String(duaIn.title || "").trim()) return { ok: false, error: "Titel ist Pflicht" };
  if (!String(duaIn.ar || "").trim() && !String(duaIn.de || "").trim()) {
    return { ok: false, error: "Arabisch oder Deutsch ist Pflicht" };
  }

  const file = `${id}.md`;
  const path = `content/duas/${file}`;
  const markdown = buildDuaMarkdown({ ...duaIn, id });
  const indexRead = await readJsonFile(env, helpers, DUAS_INDEX_PATH, []);
  const list = Array.isArray(indexRead.data) ? indexRead.data.slice() : [];
  const row = {
    id,
    type: duaIn.type || "",
    cat: duaIn.cat || "",
    title: duaIn.title || "",
    occasion: duaIn.occasion || "",
    ar: duaIn.ar || "",
    tr: duaIn.tr || "",
    de: duaIn.de || "",
    src: duaIn.src || "",
    file,
    status: duaIn.status || (input.publish ? "published" : "draft")
  };
  const idx = list.findIndex((x) => String(x.id) === id);
  if (idx >= 0) list[idx] = { ...list[idx], ...row };
  else list.push(row);

  let existingSha = null;
  try {
    const existing = await githubGet(env, path);
    existingSha = existing?.sha || null;
  } catch (e) {}

  const entries = [
    { path, content: utf8ToBase64(markdown), sha: existingSha || undefined },
    {
      path: DUAS_INDEX_PATH,
      content: utf8ToBase64(JSON.stringify(list, null, 2) + "\n"),
      sha: indexRead.sha || undefined
    }
  ];

  if (typeof githubCommitBatch === "function") {
    await githubCommitBatch(env, entries, `content(dua): ${id} via live-edit`);
  } else {
    await githubPut(env, path, utf8ToBase64(markdown), `content(dua): ${id}`, existingSha || undefined);
    await writeJsonFile(env, helpers, DUAS_INDEX_PATH, list, `content(dua-index): ${id}`, indexRead.sha);
  }

  await appendLiveAudit(
    env,
    {
      action: input.publish ? "dua.publish" : "dua.update",
      entityType: "dua",
      entityId: id,
      changes: { title: row.title, status: row.status }
    },
    helpers
  );
  await appendLiveVersion(
    env,
    { entityType: "dua", entityId: id, status: row.status, next: { title: row.title } },
    helpers
  );

  return jsonOk({ dua: row, path, publish: !!input.publish });
}

export async function saveLiveMeta(env, input, helpers) {
  const kind = String(input?.kind || "");
  const row = input?.data || {};
  if (kind !== "scholar" && kind !== "book") return { ok: false, error: "Ungültiger Meta-Typ" };
  const path = kind === "scholar" ? META_SCHOLARS_PATH : META_BOOKS_PATH;
  const { data, sha } = await readJsonFile(env, helpers, path, { version: 1, entries: [] });
  const rows = Array.isArray(data.entries) ? data.entries : [];
  const id = String(row.id || row.name || row.title || "").trim() || `${kind}-${Date.now()}`;
  const next = { ...row, id, updatedAt: new Date().toISOString(), status: row.status || "published" };
  const idx = rows.findIndex((x) => String(x.id) === id);
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next };
  else rows.push(next);
  data.entries = rows;
  data.updatedAt = new Date().toISOString();
  await writeJsonFile(env, helpers, path, data, `content(${kind}): ${id} via live-edit`, sha);
  await appendLiveAudit(env, { action: `${kind}.update`, entityType: kind, entityId: id, changes: next }, helpers);
  return jsonOk({ entry: next });
}
