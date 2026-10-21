#!/usr/bin/env node
"use strict";
/* Adult-only publication guard for canonical post-language manifests.
 * Read-only. Reject stale translations, mismatched IDs and unreviewed public content.
 * No Kids, OneSignal, native-app or Cloudflare changes.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const manifestDir = path.join(root, "content/i18n/adult-posts");
const locales = JSON.parse(fs.readFileSync(path.join(root, "desktop-preview/i18n-core-v1/locales.json"), "utf8")).locales;
const index = JSON.parse(fs.readFileSync(path.join(root, "content/posts/posts-index.json"), "utf8"));
const indexed = new Set((index.files || []).map(x => typeof x === "string" ? x : x.name));
const qRegistry = JSON.parse(fs.readFileSync(path.join(root, "q/_registry/shortlinks.json"), "utf8"));
const failures = [];
const sha = x => crypto.createHash("sha256").update(JSON.stringify(x)).digest("hex");
function fail(id, message) { failures.push(id + ": " + message); }
function readRelative(p) {
  if (typeof p !== "string" || !p.startsWith("/") || p.includes("..") || p.includes("\\") ||
      !/^\/[a-zA-Z0-9_.\/-]+$/.test(p)) throw Error("Unsafe source path");
  return JSON.parse(fs.readFileSync(path.join(root, p.slice(1)), "utf8"));
}
function frontmatter(input) {
  const m = input.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!m) throw Error("Missing frontmatter");
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const match = line.match(/^([a-zA-Z_][\w-]*):\s*(.+)$/);
    if (match) meta[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: input.slice(m[0].length).trim() };
}
function postHash(file, expectedToPublish) {
  const { meta, body } = frontmatter(fs.readFileSync(path.join(root, "content/posts", file), "utf8"));
  return { meta, hash: sha({
    fields: { title: meta.title || file, body },
    immutable: {
      source: meta.source || "", book: meta.book || "", scholar: meta.scholar || "",
      date: meta.date || "", originalFile: file,
      sourceReviewBlocked: expectedToPublish ? false : !indexed.has(file)
    }
  }) };
}
function qHash(n) {
  const r = (qRegistry.links || []).find(x => Number(x.number) === n);
  if (!r) throw Error("No Q record for " + n);
  return sha({
    fields: { title: r.title || "", topic: r.topic || "", statementSummary: r.statementSummary || "" },
    immutable: {
      shortPath: r.shortPath || "/q/" + n + "/", targetPath: r.targetPath || "",
      speaker: r.speaker || "", sourceLabel: r.sourceLabel || "",
      postReference: r.postReference || "", htmlPageExists: fs.existsSync(path.join(root, "q", String(n), "index.html"))
    }
  });
}
function reviewed(doc) {
  const r = doc.reviewer || {};
  return doc.status === "approved" && !!doc.reviewedAt && !!r.linguistic && !!r.religious &&
    !!r.arabicOriginalChecked && !!r.sourcesChecked;
}
const files = fs.existsSync(manifestDir) ?
  fs.readdirSync(manifestDir).filter(x => x.endsWith(".json")).sort() : [];
for (const file of files) {
  try {
    const item = JSON.parse(fs.readFileSync(path.join(manifestDir, file), "utf8"));
    const id = item.contentId, slug = item.postId;
    if (!/^post:[a-z0-9][a-z0-9-]+$/.test(id || "") || id !== "post:" + slug ||
        file !== slug + ".json") throw Error("Inconsistent canonical ID");
    if (item.kidsExcluded !== true) throw Error("Kids exclusion not enforced");
    const canonical = "/content/posts/" + slug + ".md";
    if (item.canonicalPath !== canonical) throw Error("Wrong canonical path");
    const post = postHash(slug + ".md", /expected canonical fingerprint/.test(item.sourceHashPolicy || ""));
    if (post.hash !== item.sourceHash) throw Error("Stale German-source fingerprint");
    const sourceNum = Number((item.sourcePath || "").match(/^\/q\/(\d+)\/$/)?.[1]);
    if (!Number.isSafeInteger(sourceNum)) throw Error("Invalid Q source reference");
    const currentQHash = qHash(sourceNum);
    if (item.qsourceHash && item.qsourceHash !== currentQHash) throw Error("Stale Q-source fingerprint");
    const listed = indexed.has(slug + ".md");
    if (post.meta.status === "draft" && listed) throw Error("Draft registered as published");
    if (post.meta.status === "published" && !listed) throw Error("Published post missing from index");
    if (item.canonicalLocale !== "de" || !item.languages?.de) throw Error("German original missing");
    if (post.meta.status !== "published" && item.languages.de.publicDisplayAllowed !== false)
      throw Error("Unpublished German post is publicly marked");
    const registered = new Set(Object.keys(locales));
    const declared = [...(item.supportedLocales || [])];
    if (!declared.includes("de") || declared.some(code => !registered.has(code)) ||
        new Set(declared).size !== declared.length) throw Error("Unknown, duplicate or missing canonical locale");
    // New languages are added to the worklist automatically. Legacy manifests may omit them
    // until reviewed translations are attached; an omitted language is never public.
    for (const code of declared) {
      const lang = item.languages[code];
      if (!lang || lang.name !== locales[code].name) { fail(id, "Language metadata missing: " + code); continue; }
      if (code === "de") continue;
      const expectedSuffix = crypto.createHash("sha256").update(id).digest("hex").slice(0, 10);
      const expectedPath = "/desktop-preview/i18n-core-v1/translations/" + code + "/post/" + slug + "-" + expectedSuffix + ".json";
      if (lang.path !== expectedPath) { fail(id, "Wrong translation path: " + code); continue; }
      const translation = readRelative(lang.path);
      if (translation.id !== id || translation.locale !== code || translation.sourceHash !== item.sourceHash)
        fail(id, "Incorrect translation identity or revision: " + code);
      if (!translation.fields || !String(translation.fields.title || "").trim() ||
          !String(translation.fields.body || "").trim()) fail(id, "Incomplete manuscript: " + code);
      if (lang.publicDisplayAllowed === true && (lang.status !== "approved" || !reviewed(translation)))
        fail(id, "Unreviewed translation marked public: " + code);
      if (lang.status !== "approved" && lang.publicDisplayAllowed !== false)
        fail(id, "Draft or stale translation not blocked: " + code);
      if (lang.qsourcePath) {
        const sourceTranslation = readRelative(lang.qsourcePath);
        if (sourceTranslation.id !== "qsource:" + sourceNum || sourceTranslation.locale !== code ||
            sourceTranslation.sourceHash !== currentQHash) fail(id, "Stale or wrong Q metadata: " + code);
        if (lang.publicDisplayAllowed === true && !reviewed(sourceTranslation))
          fail(id, "Unapproved Q-language source exposed: " + code);
      }
    }
  } catch (e) { fail(file, String(e.message || e)); }
}
if (failures.length) {
  failures.forEach(m => console.error("ADULT_I18N_FAIL " + m));
  process.exit(1);
}
console.log("Adult i18n manifest gate OK: " + files.length + " canonical adult post manifest(s), no unreviewed language marked public.");
