#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");
const root = path.resolve(__dirname, "../..");
const src = fs.readFileSync(path.join(__dirname, "hadith-library-shelves-v1.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "hadith-library-shelves-v1.css"), "utf8");
assert(!/hadith-library-(overview|study)-v1267/.test(src + css), "person header art must not return");
assert(css.includes("bg-auto-mosque-unsplash-JF3o8Ajk.webp"), "architecture header missing");
assert(!/\b\d{3,4}\s*(AH|h\.|هجري)/i.test(src), "no unverified year");

const window = {
  document: { getElementById() { return null; }, head: {}, documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} },
  addEventListener() {},
  localStorage: { getItem(key) { return key === "darAdultPreferredLocaleV1" ? "en" : null; }, setItem() {}, removeItem() {} },
  sessionStorage: { getItem() { return ""; }, setItem() {}, removeItem() {} },
  hadithBooks: [],
  hadithSearchIndex: [],
  hadithCollections: new Map(),
  hadithLoadFailed: false,
  currentRoute: { view: "hadith", value: "" },
  esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])); },
  parseHadithRoute() { return { bookId: "", chapterId: "", babId: "", hadithId: "" }; },
  hadithVisibleBooks() { return window.hadithBooks; },
  renderHadith() { return "OLD"; },
  renderHadithDetail() { return "DETAIL-UNTOUCHED"; },
  renderHadithBookPanel() { return "READING-VIEW"; },
  bindHadithLibraryEvents() {},
  readRoute() { return window.currentRoute; }
};
window.window = window;
vm.createContext(window);
vm.runInContext(src, window);
const api = window.DARHadithShelvesV1;
assert(api && api.boot(), "boot failed");
assert.strictEqual(window.renderHadithDetail(), "DETAIL-UNTOUCHED");
const keys = Object.keys(api.copy.de);
for (const lang of api.langs) {
  assert.deepStrictEqual(Object.keys(api.copy[lang]).sort(), keys.slice().sort(), lang);
  for (const key of keys) assert(api.copy[lang][key].trim(), lang + " " + key);
  if (lang !== "de" && lang !== "ar" && lang !== "ckb") {
    const german = keys.filter((key) => /\b(und|der|die|das|keine|wird|diese|weitere|zuletzt|suchen|anzeigen|öffnen|vorhanden|Bereich|Werke|Bibliothek|gelesen)\b/.test(api.copy[lang][key]));
    assert.strictEqual(german.length, 0, lang + " still German: " + german.join(","));
  }
}
window.hadithBooks = [
  { id: "bukhari", title: "Ṣaḥīḥ al-Buḫārī", hadithCount: 10 },
  { id: "muslim", title: "Ṣaḥīḥ Muslim", hadithCount: 8 },
  { id: "dawud", title: "Sunan Abī Dāwūd", hadithCount: 4 },
  { id: "malik", title: "al-Muwaṭṭaʾ", hadithCount: 3 },
  { id: "lalakai", title: "Šarḥ Uṣūl Iʿtiqād Ahl as-Sunnah", hadithCount: 2 },
  { id: "zuhd", title: "Aḥmad, az-Zuhd", hadithCount: 2 }
];
window.hadithSearchIndex = [{ id: "HAD-0001", bookId: "bukhari", hadithNumber: "1", grade: "Ṣaḥīḥ", german: "Ein Bericht HAD-0001 bleibt intern." }];
const html = window.renderHadith();
assert(html.indexOf("aṣ-Ṣaḥīḥān") < 0 || html.indexOf("The two") >= 0, "locale");
assert(html.includes("The two Ṣaḥīḥs"), "scholarly section missing");
assert(html.indexOf("The two Ṣaḥīḥs") < html.indexOf("Sunan · the four"));
assert(html.indexOf("Sunan · the four") < html.indexOf("Masānīd and Muwaṭṭaʾ"));
assert(html.indexOf("Masānīd and Muwaṭṭaʾ") < html.indexOf("ʿAqīdah"));
assert(!/\bHAD-\d{4,6}\b/.test(html.replace(/data-value="[^"]*"/g, "")), "internal id visible");
assert(!html.includes("READING-VIEW"));
window.currentRoute.value = "bukhari/kitab/bab/HAD-0009";
window.parseHadithRoute = function () { return { bookId: "bukhari", chapterId: "kitab", babId: "bab", hadithId: "HAD-0009" }; };
window.hadithCollections.set("bukhari", { chapters: [] });
const reading = window.renderHadith();
assert.strictEqual(reading, "READING-VIEW");
assert.strictEqual(api.imamOf("Ṣaḥīḥ al-Buḫārī"), "Imām al-Buḫārī");
assert.strictEqual(api.imamOf("Ein unbekanntes Werk"), "");
assert.strictEqual(api.arabicOf("Šarḥ as-Sunnah"), "");

const shell = JSON.parse(fs.readFileSync(path.join(root, "apple-tv/hadith/library-shell.json"), "utf8"));
const htmlIndex = fs.readFileSync(path.join(root, "index.html"), "utf8");
const start = htmlIndex.indexOf("function normalizeHadithSearch");
const end = htmlIndex.indexOf("function mapAppleTvHadith");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(htmlIndex.slice(start, end), ctx);
const counts = {};
for (const rec of shell.records) {
  const title = ctx.hadithCanonicalBookTitle(rec);
  const section = api.sectionFor(title);
  counts[section] = counts[section] || { n: 0, titles: new Set() };
  counts[section].n++;
  counts[section].titles.add(title);
}
for (const key of ["sahihayn", "sunan", "masanid", "aqidah", "athar"]) {
  assert(counts[key] && counts[key].n > 0, "empty section " + key);
}
assert(counts.sahihayn.titles.has("Ṣaḥīḥ al-Buḫārī"));
assert(counts.sahihayn.titles.has("Ṣaḥīḥ Muslim"));
assert(!counts.sunan.titles.has("Abū Dāwūd, az-Zuhd"));
console.log("Hadith shelves: PASS");
for (const key of Object.keys(counts)) console.log(key, counts[key].n, "records /", counts[key].titles.size, "works");
