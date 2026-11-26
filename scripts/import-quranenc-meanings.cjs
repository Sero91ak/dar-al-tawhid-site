#!/usr/bin/env node
/**
 * Build-time import of owner-approved QuranEnc meanings.
 * Reads https://quranenc.com/api/v1/translation/sura/{key}/{n}
 * and writes content/quran-i18n/{locale}/{NNN}.json unchanged.
 * No scheduler. Re-run only by hand: node scripts/import-quranenc-meanings.cjs
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "content", "quran-i18n");
const SURA_API = "https://quranenc.com/api/v1/translation/sura";
const UPDATE_API = "https://quranenc.com/api/v1/translations/updates";
const UA = "DarAlTawhid-quranenc-import/1.0";

const PRIMARY = [
  { locale: "de", key: "german_rwwad", textDirection: "ltr", role: "meaning", title: "German Translation", publisher: "Rowwad Translation Center" },
  { locale: "en", key: "english_rwwad", textDirection: "ltr", role: "meaning", title: "English Translation", publisher: "Rowwad Translation Center" },
  { locale: "tr", key: "turkish_rwwad", textDirection: "ltr", role: "meaning", title: "Turkish Translation", publisher: "Rowwad Translation Center" },
  { locale: "ku", key: "kurmanji_ismail", textDirection: "rtl", role: "meaning", title: "Kurdish (Kurmanji) Translation", publisher: "Ismail Sageri" },
  { locale: "ckb", key: "kurdish_bamoki", textDirection: "rtl", role: "meaning", title: "Kurdish Translation", publisher: "Muhammad Salih Bamoki" },
  { locale: "bs", key: "bosnian_rwwad", textDirection: "ltr", role: "meaning", title: "Bosnian Translation", publisher: "Rowwad Translation Centre" },
  { locale: "fr", key: "french_rashid", textDirection: "ltr", role: "meaning", title: "French Translation", publisher: "Rachid Maach" },
  { locale: "es", key: "spanish_garcia", textDirection: "ltr", role: "meaning", title: "Spanish Translation", publisher: "Isa Garcia" },
  { locale: "ar", key: "arabic_moyassar", textDirection: "rtl", role: "explanation", title: "Arabic Language", publisher: "At-Tafsir Al-Muyassar" }
];

const MOKHTASAR = [
  { locale: "en", key: "english_mokhtasar", textDirection: "ltr", title: "english_mokhtasar", publisher: "QuranEnc.com", titlePublished: false },
  { locale: "tr", key: "turkish_mokhtasar", textDirection: "ltr", title: "Turkish Translation of Al-Mukhtasar in Interpreting the Noble Quran", publisher: "QuranEnc.com", titlePublished: true },
  { locale: "ckb", key: "kurdish_mokhtasar", textDirection: "rtl", title: "Kurdish Translation of Al-Mukhtasar in Interpreting the Noble Quran", publisher: "QuranEnc.com", titlePublished: true },
  { locale: "bs", key: "bosnian_mokhtasar", textDirection: "ltr", title: "Bosnian Translation of Al-Mukhtasar in Interpreting the Noble Quran", publisher: "QuranEnc.com", titlePublished: true },
  { locale: "fr", key: "french_mokhtasar", textDirection: "ltr", title: "French Translation of Al-Mukhtasar in Interpreting the Noble Quran", publisher: "QuranEnc.com", titlePublished: true },
  { locale: "es", key: "spanish_mokhtasar", textDirection: "ltr", title: "Spanish Translation of Al-Mukhtasar in Interpreting the Noble Quran", publisher: "QuranEnc.com", titlePublished: true },
  { locale: "ar", key: "arabic_mokhtasar", textDirection: "rtl", title: "Arabic language - Al-Mukhtsar in Interpreting the Noble Quran", publisher: "QuranEnc.com", titlePublished: true }
];

const OMITTED_MOKHTASAR = [
  { locale: "de", key: "german_mokhtasar", reason: "QuranEnc /api/v1/translation/sura/german_mokhtasar and /translations/updates return no edition" },
  { locale: "ku", key: "kurmanji_mokhtasar", reason: "QuranEnc /api/v1/translation/sura/kurmanji_mokhtasar and /translations/updates return no edition" }
];

function surahCounts() {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "quran", "surahs.json"), "utf8"));
  const map = new Map();
  for (const surah of meta.surahs) map.set(Number(surah.id), Number(surah.total_verses));
  return map;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url) {
  let last = "unknown";
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" }
      });
      const text = await response.text();
      if (response.status === 400 || response.status === 404) {
        return { missing: true, status: response.status, body: text.slice(0, 240) };
      }
      if (!response.ok) throw new Error("HTTP " + response.status + " " + text.slice(0, 160));
      return { missing: false, json: JSON.parse(text) };
    } catch (error) {
      last = error.message || String(error);
      await sleep(350 * attempt);
    }
  }
  throw new Error(url + " failed: " + last);
}

async function editionMeta(edition) {
  const hit = await getJson(UPDATE_API + "?key=" + encodeURIComponent(edition.key));
  if (hit.missing) {
    return {
      version: null,
      last_update: null,
      direction: edition.textDirection,
      versionPublished: false,
      versionNote: "updates endpoint status " + hit.status + " " + (hit.body || "")
    };
  }
  const row = hit.json || {};
  return {
    version: row.version == null ? null : String(row.version),
    last_update: Number.isFinite(Number(row.last_update)) ? Number(row.last_update) : null,
    direction: row.direction === "rtl" || row.direction === "ltr" ? row.direction : edition.textDirection,
    versionPublished: row.version != null
  };
}

function verseFile(edition, surah, layer) {
  const folder = layer === "mokhtasar"
    ? path.join(OUT, edition.locale, "mokhtasar")
    : path.join(OUT, edition.locale);
  return path.join(folder, String(surah).padStart(3, "0") + ".json");
}

async function importSurah(edition, meta, surah, expected, layer) {
  const url = SURA_API + "/" + edition.key + "/" + surah;
  const hit = await getJson(url);
  if (hit.missing) throw new Error(edition.key + " sura " + surah + " missing " + hit.status);
  const rows = hit.json && hit.json.result;
  if (!Array.isArray(rows)) throw new Error(edition.key + " sura " + surah + " has no result array");
  const verses = rows.map((row) => {
    if (!row || typeof row.translation !== "string") {
      throw new Error(edition.key + " " + surah + " verse text is not a string");
    }
    const aya = Number(row.aya);
    if (!Number.isInteger(aya) || aya < 1) throw new Error(edition.key + " " + surah + " bad aya " + row.aya);
    return {
      aya,
      text: row.translation,
      footnotes: Object.prototype.hasOwnProperty.call(row, "footnotes") ? row.footnotes : null
    };
  });
  verses.sort((a, b) => a.aya - b.aya);
  if (verses.length !== expected) {
    throw new Error(edition.key + " sura " + surah + " count " + verses.length + " expected " + expected);
  }
  for (let i = 0; i < verses.length; i += 1) {
    if (verses[i].aya !== i + 1) throw new Error(edition.key + " sura " + surah + " ayah gap at " + verses[i].aya);
  }
  const doc = {
    key: edition.key,
    version: meta.version,
    last_update: meta.last_update,
    verses
  };
  const file = verseFile(edition, surah, layer);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(doc));
  return verses.length;
}

async function pool(items, limit, worker) {
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

async function importEdition(edition, counts, layer) {
  const meta = await editionMeta(edition);
  const jobs = [];
  for (let surah = 1; surah <= 114; surah += 1) jobs.push(surah);
  let done = 0;
  await pool(jobs, 8, async (surah) => {
    const count = await importSurah(edition, meta, surah, counts.get(surah), layer);
    done += 1;
    if (done === 1 || done === 114 || done % 20 === 0) {
      console.log(edition.locale, layer, edition.key, done + "/114", "last", surah, "verses", count);
    }
  });
  let total = 0;
  for (const expected of counts.values()) total += expected;
  return Object.assign({}, edition, meta, { layer, verseCount: total, surahs: 114 });
}

async function main() {
  const counts = surahCounts();
  let expected = 0;
  for (const value of counts.values()) expected += value;
  if (expected !== 6236 || counts.size !== 114) {
    throw new Error("surahs.json is not 114 surahs / 6236 verses (" + counts.size + "/" + expected + ")");
  }
  fs.mkdirSync(OUT, { recursive: true });
  const locales = {};
  for (const edition of PRIMARY) {
    console.log("primary", edition.locale, edition.key);
    const imported = await importEdition(edition, counts, "primary");
    locales[edition.locale] = {
      key: imported.key,
      version: imported.version,
      last_update: imported.last_update,
      direction: imported.direction,
      role: imported.role,
      title: imported.title,
      publisher: imported.publisher,
      verseCount: imported.verseCount,
      surahs: imported.surahs,
      versionPublished: imported.versionPublished !== false,
      mokhtasar: null
    };
  }
  for (const edition of MOKHTASAR) {
    console.log("mokhtasar", edition.locale, edition.key);
    const imported = await importEdition(edition, counts, "mokhtasar");
    locales[edition.locale].mokhtasar = {
      key: imported.key,
      version: imported.version,
      last_update: imported.last_update,
      direction: imported.direction,
      title: imported.title,
      publisher: imported.publisher,
      titlePublished: imported.titlePublished !== false,
      versionPublished: imported.versionPublished !== false,
      versionNote: imported.versionNote || "",
      verseCount: imported.verseCount,
      surahs: imported.surahs
    };
  }
  const catalog = {
    source: "https://quranenc.com/api/v1/translation/sura/{key}/{n}",
    updates: UPDATE_API,
    importedAt: new Date().toISOString(),
    terms: "QuranEnc text and footnotes stored unchanged. Attribution keeps the published title, publisher and version.",
    expectedVerses: 6236,
    omittedMokhtasar: OMITTED_MOKHTASAR,
    locales
  };
  fs.writeFileSync(path.join(OUT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  console.log("catalog written", path.join(OUT, "catalog.json"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
