/**
 * DAR AL TAWḤĪD Bibliothek — Cloudflare Worker (Admin, Test/Staging)
 */
const LIBRARY_PATH = "test/data/library-publications.json";
const LIBRARY_PDF_PREFIX = "test/assets/library/pdfs/";
const LIBRARY_COVER_PREFIX = "test/assets/library/covers/";

const LIBRARY_STATUSES = new Set(["draft", "preparing", "published", "updated", "archived", "error"]);
const LIBRARY_CATEGORIES = new Set([
  "Tawḥīd",
  "ʿAqīdah",
  "al-Asmāʾ waṣ-Ṣifāt",
  "Qurʾān",
  "Sunnah",
  "Schirk",
  "Kufr und Ṭāghūt",
  "Sünden und Reue",
  "Gebet",
  "Fiqh",
  "Familie",
  "Manhaj",
  "Widerlegungen"
]);

const PDF_MAX_BYTES = 80 * 1024 * 1024;
const COVER_MAX_BYTES = 12 * 1024 * 1024;

function libraryError(message, status) {
  const err = new Error(message);
  err.status = status || 400;
  return err;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function emptyCatalog() {
  return { version: 1, updatedAt: new Date().toISOString(), publications: [] };
}

function normalizePublication(raw, nowIso) {
  const now = nowIso || new Date().toISOString();
  const id = String(raw?.id || "").trim();
  if (!id) return null;
  const status = LIBRARY_STATUSES.has(String(raw?.status || "").trim()) ? String(raw.status).trim() : "draft";
  const category = String(raw?.category || "").trim();
  if (category && !LIBRARY_CATEGORIES.has(category)) throw libraryError(`Unbekannte Kategorie: ${category}`, 400);
  const slug = String(raw?.slug || slugify(raw?.title || id)).trim() || slugify(id);
  return {
    id,
    slug,
    title: String(raw?.title || "").trim(),
    transliteratedTitle: String(raw?.transliteratedTitle || "").trim(),
    subtitle: String(raw?.subtitle || "").trim(),
    description: String(raw?.description || "").trim(),
    category,
    topic: String(raw?.topic || "").trim(),
    series: String(raw?.series || "").trim(),
    tags: Array.isArray(raw?.tags) ? raw.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    searchAliases: Array.isArray(raw?.searchAliases) ? raw.searchAliases.map((t) => String(t).trim()).filter(Boolean) : [],
    editor: String(raw?.editor || "Serhat Abu Malik").trim(),
    publisher: String(raw?.publisher || "DAR AL TAWḤĪD").trim(),
    credit: String(raw?.credit || "Zusammengestellt, strukturiert und herausgegeben von Serhat Abu Malik für DAR AL TAWḤĪD").trim(),
    language: String(raw?.language || "Deutsch").trim(),
    version: String(raw?.version || "1.0").trim(),
    publishedAt: String(raw?.publishedAt || now.slice(0, 10)).trim(),
    updatedAt: String(raw?.updatedAt || now.slice(0, 10)).trim(),
    pageCount: Number(raw?.pageCount) || 0,
    fileSize: String(raw?.fileSize || "").trim(),
    fileHash: String(raw?.fileHash || "").trim(),
    coverUrl: String(raw?.coverUrl || "").trim(),
    coverUrls: raw?.coverUrls && typeof raw.coverUrls === "object" ? raw.coverUrls : {},
    pdfUrl: String(raw?.pdfUrl || "").trim(),
    isNew: raw?.isNew === true,
    isRecommended: raw?.isRecommended === true,
    downloadEnabled: raw?.downloadEnabled !== false,
    offlineEnabled: raw?.offlineEnabled === true,
    status,
    statusMessage: String(raw?.statusMessage || "").trim(),
    tableOfContents: Array.isArray(raw?.tableOfContents) ? raw.tableOfContents : [],
    about: String(raw?.about || "").trim(),
    sources: Array.isArray(raw?.sources) ? raw.sources : [],
    versionHistory: Array.isArray(raw?.versionHistory) ? raw.versionHistory : [],
    relatedPublicationIds: Array.isArray(raw?.relatedPublicationIds) ? raw.relatedPublicationIds.map(String) : []
  };
}

function validatePdfBase64(base64) {
  const raw = String(base64 || "").trim();
  if (!raw) throw libraryError("PDF fehlt", 400);
  let bytes;
  try {
    bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  } catch (e) {
    throw libraryError("PDF konnte nicht gelesen werden", 400);
  }
  if (!bytes.length) throw libraryError("PDF ist leer", 400);
  if (bytes.length > PDF_MAX_BYTES) throw libraryError("PDF ist zu groß", 400);
  const head = String.fromCharCode(...bytes.slice(0, 5));
  if (!head.startsWith("%PDF")) throw libraryError("Datei ist keine gültige PDF", 400);
  return bytes;
}

function validateCoverFile(file) {
  const path = String(file?.path || "").trim();
  const base64 = String(file?.contentBase64 || "").trim();
  if (!path || !base64) return null;
  if (!path.startsWith(LIBRARY_COVER_PREFIX)) throw libraryError(`Cover-Pfad ungültig: ${path}`, 400);
  if (!/\.(webp|avif|png|jpe?g|svg)$/i.test(path)) throw libraryError(`Cover-Format nicht erlaubt: ${path}`, 400);
  let bytes;
  try {
    bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch (e) {
    throw libraryError("Cover konnte nicht gelesen werden", 400);
  }
  if (!bytes.length || bytes.length > COVER_MAX_BYTES) throw libraryError("Cover ist leer oder zu groß", 400);
  return { path, contentBase64: base64 };
}

function normalizeLibraryFilesInput(raw) {
  const files = Array.isArray(raw) ? raw : [];
  const pdfFiles = [];
  const coverFiles = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i] || {};
    const path = String(file.path || "").trim();
    const base64 = String(file.contentBase64 || "").trim();
    if (!path || !base64) continue;
    if (path.includes("..") || path.startsWith("/")) throw libraryError(`Ungültiger Pfad: ${path}`, 400);
    if (path.startsWith(LIBRARY_PDF_PREFIX)) {
      validatePdfBase64(base64);
      if (!/\.pdf$/i.test(path)) throw libraryError("PDF-Pfad muss auf .pdf enden", 400);
      pdfFiles.push({ path, contentBase64: base64 });
      continue;
    }
    const cover = validateCoverFile(file);
    if (cover) coverFiles.push(cover);
  }
  return { pdfFiles, coverFiles };
}

export async function readLibraryCatalog(env, helpers) {
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const file = await helpers.githubGet(env, owner, repo, LIBRARY_PATH, branch);
  const parsed = file?.content ? JSON.parse(helpers.base64ToUtf8(file.content)) : emptyCatalog();
  const publications = (Array.isArray(parsed?.publications) ? parsed.publications : [])
    .map((p) => normalizePublication(p))
    .filter(Boolean);
  return {
    catalog: { version: 1, updatedAt: parsed?.updatedAt || new Date().toISOString(), publications },
    sha: file?.sha || "",
    path: LIBRARY_PATH
  };
}

function findDuplicates(catalog, pub, ignoreId) {
  const warnings = [];
  const list = catalog.publications || [];
  if (list.some((p) => p.id === pub.id && p.id !== ignoreId)) warnings.push("ID bereits vorhanden");
  if (list.some((p) => p.slug === pub.slug && p.id !== ignoreId)) warnings.push("Slug bereits vorhanden");
  if (pub.fileHash && list.some((p) => p.fileHash === pub.fileHash && p.id !== ignoreId)) {
    warnings.push("Eine möglicherweise identische Veröffentlichung ist bereits vorhanden.");
  }
  const titleKey = String(pub.title || "").trim().toLowerCase();
  if (titleKey && list.some((p) => String(p.title || "").trim().toLowerCase() === titleKey && p.id !== ignoreId)) {
    warnings.push("Titel möglicherweise doppelt");
  }
  return warnings;
}

export async function saveLibraryPublication(env, input, helpers) {
  const nowIso = new Date().toISOString();
  const publish = input?.publish === true;
  const { catalog, sha, path } = await readLibraryCatalog(env, helpers);
  const incoming = normalizePublication({ ...input?.publication, updatedAt: nowIso.slice(0, 10) }, nowIso);
  if (!incoming?.title) throw libraryError("Titel fehlt", 400);

  const warnings = findDuplicates(catalog, incoming, input?.ignoreId || incoming.id);
  if (input?.allowDuplicate !== true && warnings.some((w) => w.includes("identische"))) {
    throw libraryError(warnings.find((w) => w.includes("identische")), 409);
  }

  const { pdfFiles, coverFiles } = normalizeLibraryFilesInput(input?.libraryFiles || []);

  if (pdfFiles.length) {
    const pdf = pdfFiles[pdfFiles.length - 1];
    incoming.pdfUrl = `/${pdf.path}`;
  }

  if (coverFiles.length) {
    const medium = coverFiles.find((c) => /cover-medium/i.test(c.path)) || coverFiles[coverFiles.length - 1];
    const small = coverFiles.find((c) => /cover-small/i.test(c.path));
    const master = coverFiles.find((c) => /cover-master/i.test(c.path));
    incoming.coverUrl = `/${medium.path}`;
    incoming.coverUrls = {
      small: small ? `/${small.path}` : incoming.coverUrls?.small || "",
      medium: `/${medium.path}`,
      master: master ? `/${master.path}` : incoming.coverUrls?.master || `/${medium.path}`
    };
  }

  if (publish) {
    if (!incoming.category) throw libraryError("Kategorie fehlt", 400);
    if (!incoming.pdfUrl) throw libraryError("Veröffentlichung ohne PDF nicht möglich", 400);
    if (!incoming.coverUrl) throw libraryError("Veröffentlichung ohne Cover nicht möglich", 400);
    incoming.status = incoming.status === "updated" ? "updated" : "published";
    incoming.downloadEnabled = incoming.downloadEnabled !== false;
  } else if (!incoming.status || incoming.status === "published") {
    incoming.status = "draft";
  }

  const idx = catalog.publications.findIndex((p) => p.id === incoming.id);
  if (idx >= 0) catalog.publications[idx] = { ...catalog.publications[idx], ...incoming };
  else catalog.publications.unshift(incoming);

  catalog.updatedAt = nowIso;
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const fileEntries = [
    ...pdfFiles.map((f) => ({ path: f.path, binary: true, contentBase64: f.contentBase64 })),
    ...coverFiles.map((f) => ({ path: f.path, binary: true, contentBase64: f.contentBase64 })),
    { path, content: `${JSON.stringify(catalog, null, 2)}\n` }
  ];
  await helpers.githubCommitBatch(
    env,
    owner,
    repo,
    branch,
    fileEntries,
    `Bibliothek: ${incoming.title} (${incoming.status})`
  );

  return {
    ok: true,
    publication: incoming,
    warnings,
    path,
    published: publish && incoming.status === "published"
  };
}

export async function deleteLibraryPublication(env, input, helpers) {
  const id = String(input?.id || "").trim();
  if (!id) throw libraryError("ID fehlt", 400);
  const hard = input?.hard === true;
  const { catalog, sha, path } = await readLibraryCatalog(env, helpers);
  const idx = catalog.publications.findIndex((p) => p.id === id);
  if (idx < 0) throw libraryError("Veröffentlichung nicht gefunden", 404);
  if (hard) catalog.publications.splice(idx, 1);
  else {
    catalog.publications[idx] = { ...catalog.publications[idx], status: "archived", updatedAt: new Date().toISOString().slice(0, 10) };
  }
  catalog.updatedAt = new Date().toISOString();
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  await helpers.githubPut(
    env,
    owner,
    repo,
    path,
    `${JSON.stringify(catalog, null, 2)}\n`,
    `Bibliothek: ${hard ? "gelöscht" : "archiviert"} ${id}`,
    branch,
    sha
  );
  return { ok: true, id, archived: !hard };
}

export function suggestLibraryCategory(text) {
  const blob = String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʾʿḥṣḍṭẓġāīū]/g, (ch) => {
      const map = { ʾ: "", ʿ: "", ḥ: "h", ṣ: "s", ḍ: "d", ṭ: "t", ẓ: "z", ġ: "g", ā: "a", ī: "i", ū: "u" };
      return map[ch] || ch;
    });
  if (/asma|sifat|sifat|eigenschaft|uluw|nuzul|istiw|husna/i.test(blob)) {
    return { category: "ʿAqīdah", topic: "al-Asmāʾ waṣ-Ṣifāt", confidence: "medium" };
  }
  if (/tawhid|tauhid/i.test(blob)) return { category: "Tawḥīd", topic: "Tawḥīd", confidence: "medium" };
  if (/schirk|shirk/i.test(blob)) return { category: "Schirk", topic: "Schirk", confidence: "medium" };
  if (/kufr|ṭāghūt|taghut/i.test(blob)) return { category: "Kufr und Ṭāghūt", topic: "Kufr und Ṭāghūt", confidence: "low" };
  if (/sunnah|hadith|ahadith/i.test(blob)) return { category: "Sunnah", topic: "Sunnah", confidence: "low" };
  if (/quran|qurʾān|tafsir/i.test(blob)) return { category: "Qurʾān", topic: "Qurʾān", confidence: "low" };
  if (/gebet|salah|salat/i.test(blob)) return { category: "Gebet", topic: "Gebet", confidence: "low" };
  if (/fiqh|zakat|zakāt/i.test(blob)) return { category: "Fiqh", topic: "Fiqh", confidence: "low" };
  if (/familie|ehe|kinder/i.test(blob)) return { category: "Familie", topic: "Familie", confidence: "low" };
  if (/manhaj|methodology/i.test(blob)) return { category: "Manhaj", topic: "Manhaj", confidence: "low" };
  if (/widerleg|radd|refutation/i.test(blob)) return { category: "Widerlegungen", topic: "Widerlegungen", confidence: "low" };
  return { category: "", topic: "", confidence: "none" };
}

export const LIBRARY_ADMIN_META = {
  categories: [...LIBRARY_CATEGORIES],
  pdfPrefix: LIBRARY_PDF_PREFIX,
  coverPrefix: LIBRARY_COVER_PREFIX
};
