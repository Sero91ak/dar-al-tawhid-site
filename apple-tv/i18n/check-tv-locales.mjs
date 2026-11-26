#!/usr/bin/env node
/**
 * Apple TV language parity check.
 * UI strings must match the adult picker, locales.json and the UI catalog.
 * Religious overlays must come from the existing content packs. No new text.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const here = path.join(root, "apple-tv/i18n");
const CODES = ["de", "tr", "en", "ar", "ku", "ckb", "bs", "fr", "es"];
const RTL = new Set(["ar", "ckb"]);
const TRANSLATED = CODES.filter((code) => code !== "de");
const UI_KEYS = [
  "brand", "home", "posts", "quran", "tadabbur", "athar", "hadith", "dua", "prayer", "library",
  "language", "choose", "subtitle", "settings", "back", "close", "ready", "active", "note",
  "readGerman", "awaiting", "fallbackNotice", "sources", "open", "loading", "search", "source",
  "meaning", "verse", "narrator", "grading", "originalArabic", "retry"
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}
function norm(value) {
  return String(value || "").replace(/\*+/g, "").replace(/\s+/g, " ").trim();
}
function fail(message) {
  console.error("TV_LOCALE_CHECK FAIL: " + message);
  process.exitCode = 1;
}

function pickerText() {
  const src = fs.readFileSync(path.join(root, "assets/i18n/adult-language-picker-v1.js"), "utf8");
  const start = src.indexOf("var text=");
  const end = src.indexOf("function t()", start);
  if (start < 0 || end < 0) throw new Error("Sprachwähler-Text nicht gefunden");
  let body = src.slice(start + "var text=".length, end).trim();
  if (body.endsWith(";")) body = body.slice(0, -1);
  return Function("return (" + body + ");")();
}

function catalogPhrase(catalogs, german) {
  const out = { de: german };
  for (const code of TRANSLATED) {
    const value = catalogs[code][german];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("Katalogphrase fehlt: " + code + " / " + german);
    }
    out[code] = value;
  }
  return out;
}

function expectedUi() {
  const locales = readJson("desktop-preview/i18n-core-v1/locales.json");
  const picker = pickerText();
  const catalogs = {};
  for (const code of TRANSLATED) catalogs[code] = readJson("assets/i18n/catalog/" + code + ".json").entries;
  const fromCatalog = {
    tadabbur: catalogPhrase(catalogs, "Tadabbur"),
    athar: catalogPhrase(catalogs, "Āthār"),
    loading: catalogPhrase(catalogs, "Wird geladen …"),
    search: catalogPhrase(catalogs, "Suche"),
    source: catalogPhrase(catalogs, "Quelle"),
    meaning: catalogPhrase(catalogs, "Bedeutung"),
    verse: catalogPhrase(catalogs, "Qurʾān-Vers"),
    narrator: catalogPhrase(catalogs, "Überliefert von"),
    grading: catalogPhrase(catalogs, "Einordnung"),
    originalArabic: catalogPhrase(catalogs, "Arabischer Originalwortlaut"),
    retry: catalogPhrase(catalogs, "Erneut versuchen"),
    settings: catalogPhrase(catalogs, "Einstellungen")
  };
  const strings = {};
  for (const code of CODES) {
    const messages = locales.locales[code].messages;
    const pick = picker[code];
    strings[code] = {
      brand: messages.brand,
      home: messages.start,
      posts: messages.posts,
      quran: messages.quran,
      hadith: messages.hadith,
      dua: messages.dua,
      prayer: messages.prayer,
      library: messages.library,
      readGerman: messages.readGerman,
      awaiting: messages.awaiting,
      fallbackNotice: messages.unverified,
      sources: messages.sources,
      open: messages.open,
      language: pick.language,
      choose: pick.choose,
      subtitle: pick.subtitle,
      back: pick.back,
      close: pick.close,
      ready: pick.ready,
      active: pick.active,
      note: pick.note,
      tadabbur: fromCatalog.tadabbur[code],
      athar: fromCatalog.athar[code],
      loading: fromCatalog.loading[code],
      search: fromCatalog.search[code],
      source: fromCatalog.source[code],
      meaning: fromCatalog.meaning[code],
      verse: fromCatalog.verse[code],
      narrator: fromCatalog.narrator[code],
      grading: fromCatalog.grading[code],
      originalArabic: fromCatalog.originalArabic[code],
      retry: fromCatalog.retry[code],
      settings: fromCatalog.settings[code]
    };
  }
  return {
    schemaVersion: 1,
    source: "adult-language-picker-v1.js + desktop-preview/i18n-core-v1/locales.json + assets/i18n/catalog",
    inventedReligiousText: false,
    locales: CODES,
    strings
  };
}

function swiftKeys() {
  const src = fs.readFileSync(path.join(root, "apple-tv/xcode/TVLocalization/Sources/TVStrings.swift"), "utf8");
  const body = src.slice(src.indexOf("public enum TVStringKey"), src.indexOf("}", src.indexOf("public enum TVStringKey")));
  return [...body.matchAll(/case\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]);
}

function localize(german, translated, locale) {
  if (locale === "de" || !translated) {
    return { text: german, locale: translated ? locale : (locale === "de" ? "de" : "de"), review: locale === "de" ? "original" : "fallback-de", usedFallback: locale !== "de" };
  }
  return { text: translated, locale, review: "machine-translation-owner-approved", usedFallback: false };
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function coverageReport() {
  const shell = readJson("apple-tv/hadith/library-shell.json").records;
  const byType = { hadith: [], athar: [] };
  for (const record of shell) byType[record.recordType].push(record.id);
  const packs = {};
  const postPacks = {};
  const duaPacks = {};
  for (const code of TRANSLATED) {
    packs[code] = new Set(Object.keys(readJson("assets/i18n/content/hadith-" + code + ".json").items));
    const content = readJson("assets/i18n/content/" + code + ".json");
    postPacks[code] = Object.keys(content.posts || {}).length;
    duaPacks[code] = Object.keys(content.duas || {}).length;
  }
  const duaCount = readJson("content/duas/duas.json").length;
  const postDir = path.join(root, "content/posts");
  const postFiles = fs.readdirSync(postDir).filter((name) => name.endsWith(".md"));
  const postIds = postFiles.map((name) => {
    const text = fs.readFileSync(path.join(postDir, name), "utf8");
    const match = text.match(/^id:\s*"?([^"\n]+)"?/m);
    return match ? match[1].trim().replace(/^post:/, "") : name;
  });
  const quranFiles = fs.readdirSync(path.join(root, "content/quran")).filter((name) => /^\d+\.json$/.test(name));
  const sampleVerse = readJson("content/quran/001.json").verses[0];
  const tad = readJson("apple-tv/quran/tadabbur/catalog.json");
  const locales = {};
  for (const code of CODES) {
    const hadithIds = new Set(byType.hadith);
    const atharIds = new Set(byType.athar);
    const pack = code === "de" ? null : packs[code];
    locales[code] = {
      ui: "complete",
      posts: code === "de" ? { mode: "canonical-markdown", files: postFiles.length } : { translated: postPacks[code], germanFiles: postFiles.length },
      quranMeaning: code === "de" ? "de.bubenheim in content/quran" : "no in-repo verse meaning; German remains; field tr is transliteration only",
      tadabbur: code === "de" ? tad.entriesCount : "German only",
      hadith: code === "de" ? hadithIds.size : [...hadithIds].filter((id) => pack.has(id)).length,
      hadithTotal: hadithIds.size,
      athar: code === "de" ? atharIds.size : [...atharIds].filter((id) => pack.has(id)).length,
      atharTotal: atharIds.size,
      duas: code === "de" ? duaCount : duaPacks[code],
      duasTotal: duaCount
    };
  }
  const missingHadith = byType.hadith.filter((id) => !packs.en.has(id));
  const missingAthar = byType.athar.filter((id) => !packs.en.has(id));
  return {
    schemaVersion: 1,
    generatedBy: "apple-tv/i18n/check-tv-locales.mjs",
    defaultLocale: "de",
    followsSystemLanguage: false,
    preferenceKey: "darAdultPreferredLocaleV1",
    rtl: ["ar", "ckb"],
    humanReligiousReview: false,
    quranSample: {
      reference: "1:1",
      hasArabic: Boolean(sampleVerse.ar),
      hasGermanMeaning: Boolean(sampleVerse.de),
      transliterationField: "tr",
      transliterationIsNotTurkish: true
    },
    gaps: {
      quranMeanings: "Nur Deutsch (Bubenheim & Elyas) liegt im Projekt. Keine erfundene Bedeutung für ar, en, tr, ku, ckb, bs, fr, es. Das Feld tr in content/quran ist Lautschrift.",
      tadabbur: "Die Tadabbur-Einträge sind ausschließlich Deutsch. Andere Sprachen zeigen den deutschen Text mit Hinweis.",
      hadithWithoutPack: missingHadith.length,
      atharWithoutPack: missingAthar.length,
      postsWithoutPack: postIds.filter((id) => !new Set(Object.keys(readJson("assets/i18n/content/en.json").posts)).has(id)),
      blockedList: "content/i18n/adult-nine-locale-gaps-20261125.json"
    },
    locales
  };
}

function assertOverlay() {
  const shell = readJson("apple-tv/hadith/library-shell.json").records;
  const en = readJson("assets/i18n/content/hadith-en.json").items;
  const first = shell.find((record) => record.id === "HAD-0001");
  const blocked = shell.find((record) => record.id === "HAD-0039");
  if (!first || !en["HAD-0001"] || !en["HAD-0001"].text) fail("HAD-0001 ohne englische Paketfassung");
  else {
    const resolved = localize(first.textMarkdown, en["HAD-0001"].text, "en");
    if (resolved.usedFallback || resolved.review !== "machine-translation-owner-approved") fail("HAD-0001 fällt unerwartet auf Deutsch zurück");
    if (norm(resolved.text) === norm(first.textMarkdown)) fail("HAD-0001 englisch ist mit dem deutschen Wortlaut identisch");
  }
  if (!blocked) fail("HAD-0039 fehlt im deutschen Bestand");
  else if (en["HAD-0039"]) fail("gesperrte HAD-0039 ist trotzdem im Übersetzungspaket");
  else {
    const resolved = localize(blocked.textMarkdown, null, "en");
    if (!resolved.usedFallback || resolved.text !== blocked.textMarkdown) fail("HAD-0039 nutzt nicht die deutsche Fassung");
  }
  const duas = readJson("content/duas/duas.json");
  const dua = duas.find((item) => item.id === "dua-001-rabbana-atina");
  const duaEn = readJson("assets/i18n/content/en.json").duas["dua-001-rabbana-atina"];
  if (!dua || !dua.ar || !duaEn || !duaEn.meaning) fail("Duʿāʾ-Beispiel unvollständig");
  if (dua.tr && dua.tr === duaEn.meaning) fail("Duʿāʾ-Lautschrift wurde als Übersetzung gewertet");
  const verse = readJson("content/quran/001.json").verses[0];
  const meaning = localize(verse.de, null, "tr");
  if (meaning.text !== verse.de || meaning.text === verse.tr) fail("Qurʾān-Lautschrift darf nicht als türkische Bedeutung gelten");
  const tad = readJson("apple-tv/quran/tadabbur/entries.json").entries.find((entry) => entry.reference === "2:183");
  if (!tad || tad.en || tad.translations) fail("Tadabbur 2:183 darf keine mitgelieferte Fremdübersetzung vortäuschen");
  const posts = readJson("assets/i18n/content/en.json").posts;
  const postId = Object.keys(posts)[0];
  if (!posts[postId] || !posts[postId].title || !posts[postId].body) fail("Beitragspaket ohne Titel oder Text");
}

function main() {
  const expected = expectedUi();
  const uiPath = path.join(here, "ui.json");
  const coveragePath = path.join(here, "coverage.json");
  const bundledPath = path.join(root, "apple-tv/xcode/TVLocalization/Sources/ui.json");
  if (process.argv.includes("--write")) {
    const pretty = JSON.stringify(expected, null, 2) + "\n";
    fs.writeFileSync(uiPath, pretty);
    fs.writeFileSync(bundledPath, pretty);
    fs.writeFileSync(coveragePath, JSON.stringify(coverageReport(), null, 2) + "\n");
  }
  const ui = JSON.parse(fs.readFileSync(uiPath, "utf8"));
  const bundled = JSON.parse(fs.readFileSync(bundledPath, "utf8"));
  if (!sameJson(ui, bundled)) fail("Die gebündelte ui.json im Swift-Paket weicht von apple-tv/i18n/ui.json ab");
  if (!sameJson(ui, expected)) fail("ui.json weicht von Sprachwähler, locales.json oder UI-Katalog ab. Neu schreiben: node apple-tv/i18n/check-tv-locales.mjs --write");
  for (const code of CODES) {
    const pack = ui.strings[code];
    for (const key of UI_KEYS) {
      if (!pack || typeof pack[key] !== "string" || !pack[key].trim()) fail("UI-Schlüssel fehlt: " + code + "." + key);
    }
    const extra = Object.keys(pack).filter((key) => !UI_KEYS.includes(key));
    if (extra.length) fail("zusätzliche UI-Schlüssel in " + code + ": " + extra.join(", "));
  }
  const keys = swiftKeys();
  if (!sameJson(keys, UI_KEYS)) fail("TVStringKey stimmt nicht mit der UI-Liste überein");
  const contract = readJson("apple-tv/i18n/catalog.json");
  if (!sameJson(contract.pickerOrder, CODES)) fail("pickerOrder entspricht nicht der Erwachsenen-App");
  if (!sameJson(contract.rtl, ["ar", "ckb"])) fail("RTL-Liste");
  if (contract.followsSystemLanguage !== false || contract.defaultLocale !== "de") fail("Standardsprache muss Deutsch bleiben");
  if (contract.preferenceKey !== "darAdultPreferredLocaleV1") fail("Präferenzschlüssel");
  for (const code of CODES) {
    if (!RTL.has(code) && contract.locales.find((item) => item.code === code).dir !== "ltr") fail("Schreibrichtung " + code);
    if (RTL.has(code) && contract.locales.find((item) => item.code === code).dir !== "rtl") fail("Schreibrichtung " + code);
  }
  const swift = fs.readFileSync(path.join(root, "apple-tv/xcode/TVLocalization/Sources/TVContent.swift"), "utf8");
  for (const needle of ["fallback-de", "machine-translation-owner-approved", "transliterationIsNotATranslation", "recordType"]) {
    if (!swift.includes(needle)) fail("Swift-Inhalt ohne " + needle);
  }
  const localeSwift = fs.readFileSync(path.join(root, "apple-tv/xcode/TVLocalization/Sources/TVLocale.swift"), "utf8");
  if (!localeSwift.includes("darAdultPreferredLocaleV1")) fail("Präferenzschlüssel fehlt im Swift-Speicher");
  if (/HAD-\d{4}/.test(JSON.stringify(ui.strings))) fail("UI-Text enthält eine interne HAD-Kennung");
  assertOverlay();
  const fresh = coverageReport();
  const saved = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  if (!sameJson(saved, fresh)) fail("coverage.json ist veraltet. Neu schreiben: node apple-tv/i18n/check-tv-locales.mjs --write");
  if (process.exitCode) return;
  const en = fresh.locales.en;
  console.log("TV_LOCALE_CHECK OK: 9 Sprachen, " + UI_KEYS.length + " UI-Schlüssel, Beiträge " + en.posts.translated + "/" + en.posts.germanFiles + ", Ḥadīṯ " + en.hadith + "/" + en.hadithTotal + ", Āṯār " + en.athar + "/" + en.atharTotal + ", Duʿāʾ " + en.duas + "/" + en.duasTotal + ", Qurʾān-Bedeutung und Tadabbur nur Deutsch.");
}

main();
