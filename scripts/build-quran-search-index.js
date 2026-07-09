#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QURAN_DIR = path.join(ROOT, "content/quran");
const TAFSIR_DIR = path.join(ROOT, "content/tafsir/de");
const ATHAR_DIR = path.join(ROOT, "content/quran-athar/de");
const KEYWORDS_PATH = path.join(ROOT, "data/quran-search-keywords.json");
const OUTPUT_PATH = path.join(ROOT, "data/quran-search-index.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readOptionalJson(file, fallback) {
  try {
    return readJson(file);
  } catch (error) {
    if (error && (error.code === "ENOENT" || error instanceof SyntaxError)) return fallback;
    throw error;
  }
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

function quranSearchNormalize(value) {
  let text = String(value || "").toLowerCase();
  text = text.replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "");
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  text = text
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");
  text = text
    .replace(/[ʿ‘’`´ʼ]/g, "")
    .replace(/[āâ]/g, "a")
    .replace(/[īî]/g, "i")
    .replace(/[ūû]/g, "u")
    .replace(/[ä]/g, "a")
    .replace(/[ö]/g, "o")
    .replace(/[ü]/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[ḥ]/g, "h")
    .replace(/[ḫخ]/g, "kh")
    .replace(/[ḍ]/g, "d")
    .replace(/[ṣ]/g, "s")
    .replace(/[ṭ]/g, "t")
    .replace(/[ẓ]/g, "z")
    .replace(/[š]/g, "sh")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function quranNormContains(haystack, needle) {
  const hay = String(haystack || "").trim();
  const term = String(needle || "").trim();
  if (!hay || !term) return false;
  if (/[\u0600-\u06ff]/.test(term)) return hay.includes(term);
  return ` ${hay} `.includes(` ${term} `);
}

function tafsirText(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        const head = [item?.source, item?.grading].filter(Boolean).join(" · ");
        return [head, item?.text, item?.url].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join(" ");
  }
  return String(value || "");
}

function normalizeTafsirPayload(data) {
  const rows = Array.isArray(data) ? data : data?.verses || data?.ayahs || [];
  const map = new Map();
  rows.forEach((row) => {
    const id = Number(row.id || row.ayah || row.verse);
    if (Number.isFinite(id)) map.set(id, row);
  });
  return map;
}

function normalizeAtharPayload(data) {
  const rows = Array.isArray(data) ? data : data?.verses || data?.ayahs || [];
  const map = new Map();
  rows.forEach((row) => {
    const id = Number(row.id || row.ayah || row.verse);
    if (!Number.isFinite(id)) return;
    map.set(id, Array.isArray(row.athar) ? row.athar : Array.isArray(row.items) ? row.items : []);
  });
  return map;
}

function flattenQuranWordTerms(entry) {
  return (Array.isArray(entry?.words) ? entry.words : [])
    .map((item) => [item.term, item.text || item.meaning || ""].filter(Boolean).join(" "))
    .join(" ");
}

function flattenQuranAtharText(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) =>
      [item.person, item.name, item.generation, item.category, item.text, item.source, item.note]
        .filter(Boolean)
        .join(" ")
    )
    .join(" ");
}

function buildKeywordLookup(items) {
  const lookup = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const terms = [item.id, ...(Array.isArray(item.terms) ? item.terms : [])]
      .map(quranSearchNormalize)
      .filter(Boolean);
    lookup.set(item.id, [...new Set(terms)]);
  });
  return lookup;
}

function buildKeywordLabelLookup(items) {
  const lookup = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    lookup.set(item.id, String(item.label || item.id || "").trim());
  });
  return lookup;
}

function quranKeywordIdsForText(text, lookup) {
  const hay = quranSearchNormalize(text);
  if (!hay) return [];
  const found = [];
  lookup.forEach((terms, id) => {
    if (terms.some((term) => term && quranNormContains(hay, term))) found.push(id);
  });
  return found;
}

function main() {
  const meta = readJson(path.join(QURAN_DIR, "surahs.json"));
  const keywordItems = readJson(KEYWORDS_PATH);
  const keywordLookup = buildKeywordLookup(keywordItems);
  const keywordLabelLookup = buildKeywordLabelLookup(keywordItems);
  const rows = [];

  (meta?.surahs || []).forEach((surahMeta) => {
    const id = Number(surahMeta.id);
    if (!Number.isFinite(id)) return;

    const surah = readJson(path.join(QURAN_DIR, `${pad3(id)}.json`));
    const tafsirMap = normalizeTafsirPayload(readOptionalJson(path.join(TAFSIR_DIR, `${pad3(id)}.json`), { verses: [] }));
    const atharMap = normalizeAtharPayload(readOptionalJson(path.join(ATHAR_DIR, `${pad3(id)}.json`), { verses: [] }));
    const surahName = surahMeta.transliteration || surah.transliteration || "";
    const surahArabic = surahMeta.name || surah.name || "";

    (Array.isArray(surah.verses) ? surah.verses : []).forEach((verse) => {
      const tafsirEntry = tafsirMap.get(Number(verse.id)) || null;
      const atharList = atharMap.get(Number(verse.id)) || [];
      const tagText = [
        tafsirEntry?.meaning,
        tafsirText(tafsirEntry?.tafsir),
        tafsirEntry?.sabab,
        tafsirText(tafsirEntry?.hadiths),
        flattenQuranWordTerms(tafsirEntry),
        flattenQuranAtharText(atharList),
      ]
        .filter(Boolean)
        .join(" ");
      const fullText = [
        surahName,
        surahArabic,
        verse.de || "",
        verse.tr || "",
        verse.tr_readable || "",
        verse.tr_academic || "",
        verse.ar || "",
        tagText,
      ].join(" ");
      const keywordIds = quranKeywordIdsForText(fullText, keywordLookup);
      const compactTagText = keywordIds
        .map((id) => keywordLabelLookup.get(id))
        .filter(Boolean)
        .join(" · ");

      rows.push({
        surahId: id,
        ayah: Number(verse.id),
        surahName,
        surahArabic,
        ar: verse.ar || "",
        de: verse.de || "",
        tr: verse.tr_readable || verse.tr || verse.tr_academic || "",
        tagText: compactTagText,
        keywordIds,
      });
    });
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(rows));
  console.log(`Wrote ${rows.length} rows to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main();
