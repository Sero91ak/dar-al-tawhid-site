/* DĀR adult post push: localized post titles for the OneSignal language map.
 * Reads only already published translation files in the repo
 * (assets/i18n/content/<lang>.json and assets/q*-locales.json).
 * No send, no audience change, no schedule, no prayer or location logic.
 * Missing translations fall back to the German title, as before.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const PROVIDER_CODES = ["de", "en", "tr", "ar", "bs", "fr", "es"];
const NEW_POST_HEADINGS = {
  de: "Neuer Beitrag",
  en: "New post",
  ar: "منشور جديد",
  tr: "Yeni yazı",
  bs: "Nova objava",
  fr: "Nouvelle publication",
  es: "Nueva publicación"
};

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {
    return null;
  }
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function catalogTitles(root, postId) {
  const out = {};
  if (!postId) return out;
  for (const code of PROVIDER_CODES) {
    if (code === "de") continue;
    const data = readJson(path.join(root, "assets/i18n/content", `${code}.json`));
    if (!data || data.publicDisplayAllowed === false) continue;
    const title = clean(data?.posts?.[postId]?.title);
    if (title) out[code] = title;
  }
  return out;
}

function qLocaleTitles(root, ids) {
  const out = {};
  const wanted = new Set(ids.filter(Boolean).map((id) => `post:${id}`));
  if (!wanted.size) return out;
  let files = [];
  try {
    files = fs.readdirSync(path.join(root, "assets")).filter((f) => /^q\d+-locales\.json$/.test(f));
  } catch (_) {
    return out;
  }
  for (const file of files) {
    const data = readJson(path.join(root, "assets", file));
    if (!data || !wanted.has(String(data.contentId || ""))) continue;
    for (const code of PROVIDER_CODES) {
      if (code === "de") continue;
      const title = clean(data?.locales?.[code]?.title);
      if (title) out[code] = title;
    }
    break;
  }
  return out;
}

/** Returns { titles, localized } where titles has every provider code. */
function postTitlesByLocale(germanTitle, { postId = "", filename = "", root = process.cwd() } = {}) {
  const de = clean(germanTitle);
  const fileBase = String(filename || "").replace(/\.md$/i, "");
  const fromCatalog = catalogTitles(root, postId);
  const fromQ = Object.keys(fromCatalog).length ? {} : qLocaleTitles(root, [fileBase, postId]);
  const found = { ...fromQ, ...fromCatalog };
  // Keep the post emoji prefix of the German title when the translation lacks it.
  const prefix = (de.match(/^(\p{Extended_Pictographic}\uFE0F?)\s/u) || [])[1] || "";
  const titles = {};
  for (const code of PROVIDER_CODES) {
    let title = code === "de" ? de : clean(found[code]);
    if (!title) title = de;
    else if (prefix && code !== "de" && !title.startsWith(prefix)) title = `${prefix} ${title}`;
    titles[code] = title;
  }
  return { titles, localized: Object.keys(found).filter((c) => PROVIDER_CODES.includes(c)) };
}

module.exports = { PROVIDER_CODES, NEW_POST_HEADINGS, postTitlesByLocale };
