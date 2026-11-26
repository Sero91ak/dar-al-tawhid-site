#!/usr/bin/env node
/**
 * Visitor Qurʾān meanings: 114 surahs, verse counts, attribution,
 * locale switching, and QuranEnc spot-check of 20:5 and 68:42.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "content", "quran-i18n");
const LOCALES = ["de", "en", "tr", "ku", "ckb", "bs", "fr", "es", "ar"];
const SPOTS = [[20, 5], [68, 42]];
const GERMAN_UI = /(Bedeutung|Quelle|Mekkanisch|Medinensisch|Anzeige|Übersetzung|Bubenheim|Deutsch)/;

function fail(message) {
  console.error("FAIL:", message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function surahCounts() {
  const meta = readJson(path.join(ROOT, "content", "quran", "surahs.json"));
  const map = new Map();
  for (const surah of meta.surahs) map.set(Number(surah.id), Number(surah.total_verses));
  return map;
}

async function sourceAyah(key, surah, aya) {
  const url = "https://quranenc.com/api/v1/translation/aya/" + key + "/" + surah + "/" + aya;
  let last = "unknown";
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "DarAlTawhid-quran-meaning-check/1.0", Accept: "application/json" } });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const json = await response.json();
      const row = Array.isArray(json.result) ? json.result[0] : json.result;
      if (!row || typeof row.translation !== "string") throw new Error("missing translation");
      return row;
    } catch (error) {
      last = error.message || String(error);
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw new Error(url + " " + last);
}

function fileFor(locale, surah, layer) {
  const folder = layer === "mokhtasar" ? path.join(DATA, locale, "mokhtasar") : path.join(DATA, locale);
  return path.join(folder, String(surah).padStart(3, "0") + ".json");
}

function checkEdition(locale, meta, counts, layer) {
  if (!meta || !meta.key || !meta.title || !meta.publisher) fail(locale + " " + layer + " attribution incomplete");
  if (meta.versionPublished && !meta.version) fail(locale + " " + layer + " published version missing");
  let total = 0;
  for (let surah = 1; surah <= 114; surah += 1) {
    const file = fileFor(locale, surah, layer);
    if (!fs.existsSync(file)) fail("missing " + file);
    const doc = readJson(file);
    if (doc.key !== meta.key) fail(file + " key " + doc.key);
    if (doc.version !== meta.version) fail(file + " version mismatch");
    if (doc.last_update !== meta.last_update) fail(file + " last_update mismatch");
    if (!Array.isArray(doc.verses) || doc.verses.length !== counts.get(surah)) {
      fail(file + " verse count " + (doc.verses && doc.verses.length));
    }
    for (let i = 0; i < doc.verses.length; i += 1) {
      const verse = doc.verses[i];
      if (verse.aya !== i + 1 || typeof verse.text !== "string" || !Object.prototype.hasOwnProperty.call(verse, "footnotes")) {
        fail(file + " verse shape at " + i);
      }
    }
    total += doc.verses.length;
  }
  if (total !== 6236) fail(locale + " " + layer + " total " + total);
  console.log("OK", locale, layer, meta.key, "v=" + meta.version, total);
}

async function spot(locale, meta, layer) {
  for (const [surah, aya] of SPOTS) {
    const doc = readJson(fileFor(locale, surah, layer));
    const stored = doc.verses[aya - 1];
    const remote = await sourceAyah(meta.key, surah, aya);
    if (stored.text !== remote.translation) {
      fail(meta.key + " " + surah + ":" + aya + " text differs from QuranEnc");
    }
    const remoteNotes = Object.prototype.hasOwnProperty.call(remote, "footnotes") ? remote.footnotes : null;
    if (stored.footnotes !== remoteNotes) {
      fail(meta.key + " " + surah + ":" + aya + " footnotes differ from QuranEnc");
    }
  }
  console.log("OK spot", meta.key, "20:5 68:42");
}

function bootRuntime(locale, pick) {
  const storage = { darAdultPreferredLocaleV1: locale };
  if (pick) storage.darQuranMeaningLocaleV1 = pick;
  const listeners = {};
  function element(tag) {
    return {
      tagName: String(tag || "div").toUpperCase(),
      id: "",
      textContent: "",
      appendChild(node) { return node; },
      addEventListener() {},
      setAttribute() {},
      getAttribute() { return null; }
    };
  }
  const document = {
    readyState: "complete",
    head: element("head"),
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    createElement: element,
    getElementById() { return null; }
  };
  const context = {
    console,
    URLSearchParams,
    fetch(url) {
      const name = String(url).split("?")[0];
      const relative = name.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "");
      const file = path.join(ROOT, relative);
      if (!file.startsWith(ROOT) || !fs.existsSync(file)) return Promise.resolve({ ok: false, json: async () => ({}) });
      return Promise.resolve({ ok: true, json: async () => readJson(file) });
    },
    document,
    location: { search: "?lang=" + locale, hash: "#quran/20/5", href: "https://dar-al-tawhid.de/?lang=" + locale + "#quran/20/5" },
    localStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null; },
      setItem(key, value) { storage[key] = String(value); },
      removeItem(key) { delete storage[key]; }
    },
    addEventListener() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/quran-meaning-i18n-v1.js"), "utf8"), context, { filename: "quran-meaning-i18n-v1.js" });
  return context;
}

async function checkSwitching() {
  const german = bootRuntime("de");
  if (german.darQuranMeaningLocale() !== "de") fail("default locale is not de");
  if (german.darQuranUi("source") !== "Quelle") fail("German source label");
  await german.darQuranMeaningEnsure(20);
  const germanHtml = german.darQuranMeaningVerseHtml(20, { id: 5 });
  const germanText = readJson(fileFor("de", 20, "primary")).verses[4].text;
  if (!germanHtml.includes(germanText.replace(/&/g, "&amp;").replace(/</g, "&lt;"))) fail("German 20:5 not rendered");
  if (germanHtml.includes("quran-mokhtasar")) fail("German must not invent a mokhtasar layer");

  const english = bootRuntime("en");
  if (english.darQuranAppLocale() !== "en" || english.darQuranMeaningLocale() !== "en") fail("English default");
  await english.DARQuranMeaning.loadCatalog();
  for (const key of ["showMeaning", "choose", "loading", "missing", "meccan", "medinan", "bookView", "pages", "chooseSurah", "searchHint"]) {
    const value = english.darQuranUi(key);
    if (value === german.darQuranUi(key) || GERMAN_UI.test(value)) fail("English UI still German: " + key + " = " + value);
  }
  if (!english.darQuranMeaningPickerHtml().includes("Source: QuranEnc.com")) fail("English attribution missing");
  if (english.darQuranMeaningPickerHtml().includes("Quelle")) fail("English attribution contains Quelle");
  await english.darQuranMeaningEnsure(20);
  const englishHtml = english.darQuranMeaningVerseHtml(20, { id: 5 });
  const englishText = readJson(fileFor("en", 20, "primary")).verses[4].text;
  if (!englishHtml.includes(englishText)) fail("English 20:5 not rendered");
  if (!englishHtml.includes('dir="ltr"')) fail("English meaning direction");
  if (!englishHtml.includes("quran-mokhtasar")) fail("English mokhtasar toggle missing");

  english.localStorage.setItem("darQuranMeaningLocaleV1", "fr");
  if (english.darQuranMeaningLocale() !== "fr") fail("explicit French pick ignored");
  if (english.darQuranAppLocale() !== "en") fail("meaning pick changed the app locale");
  await english.darQuranMeaningEnsure(20);
  const frenchHtml = english.darQuranMeaningVerseHtml(20, { id: 5 });
  const frenchText = readJson(fileFor("fr", 20, "primary")).verses[4].text;
  if (!frenchHtml.includes(frenchText)) fail("French pick did not switch the verse");
  if (frenchHtml.includes(englishText)) fail("French pick still shows the English verse");

  const kurmanji = bootRuntime("ku");
  await kurmanji.darQuranMeaningEnsure(20);
  const kurmanjiHtml = kurmanji.darQuranMeaningVerseHtml(20, { id: 5 });
  if (!kurmanjiHtml.includes('dir="rtl"')) fail("Kurmanji Badini block is not RTL");
  if (kurmanjiHtml.includes("quran-mokhtasar")) fail("Kurmanji must omit the missing mokhtasar");
  if (GERMAN_UI.test(kurmanji.darQuranUi("choose"))) fail("Kurmanji chooser is German");
  console.log("OK locale switching, attribution, RTL, mokhtasar toggle");
}

async function main() {
  const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (index.includes("Bubenheim")) fail("visitor index still names Bubenheim");
  const desktop = fs.readFileSync(path.join(ROOT, "desktop-preview", "index.html"), "utf8");
  if (desktop.includes("Bubenheim") || desktop.includes("Arabisch + Deutsch")) fail("desktop Qurʾān still uses the fixed German meaning");
  if (!desktop.includes("/assets/quran-meaning-i18n-v1.js")) fail("desktop Qurʾān does not load the meaning runtime");
  if (!index.includes("/assets/quran-meaning-i18n-v1.js")) fail("visitor index does not load the meaning runtime");
  if (index.includes("Deutsch anzeigen")) fail("visitor index still says Deutsch anzeigen");
  const counts = surahCounts();
  const catalog = readJson(path.join(DATA, "catalog.json"));
  if (!catalog.locales) fail("catalog missing");
  const jobs = [];
  for (const locale of LOCALES) {
    const entry = catalog.locales[locale];
    if (!entry) fail("catalog missing " + locale);
    checkEdition(locale, entry, counts, "primary");
    if (entry.mokhtasar) {
      checkEdition(locale, entry.mokhtasar, counts, "mokhtasar");
      jobs.push(spot(locale, entry.mokhtasar, "mokhtasar"));
    } else if (locale !== "de" && locale !== "ku") {
      fail(locale + " is missing mokhtasar without being an omitted locale");
    }
    jobs.push(spot(locale, entry, "primary"));
  }
  if (!catalog.omittedMokhtasar || catalog.omittedMokhtasar.length !== 2) fail("omitted mokhtasar record");
  await Promise.all(jobs);
  await checkSwitching();
  console.log("OK quran meaning i18n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
