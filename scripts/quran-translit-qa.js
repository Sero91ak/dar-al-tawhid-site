"use strict";

const fs = require("fs");
const path = require("path");
const { nfc } = require("./quran-translit-map");

const ROOT = path.resolve(__dirname, "..");
const META = JSON.parse(fs.readFileSync(path.join(ROOT, "content/quran/surahs.json"), "utf8"));
const DIR = path.join(ROOT, "content/quran-translit");

function fail(msg) {
  console.error("QURAN_TRANSLIT_QA FAIL:", msg);
  process.exit(1);
}

if (!fs.existsSync(path.join(DIR, "001.json"))) fail("content/quran-translit fehlt");

let ayahs = 0;
META.surahs.forEach(function (s) {
  const file = path.join(DIR, String(s.id).padStart(3, "0") + ".json");
  if (!fs.existsSync(file)) fail("fehlende Sūrah-Datei " + s.id);
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Number(doc.surah) !== Number(s.id)) fail("surah mismatch " + s.id);
  if (!Array.isArray(doc.verses) || doc.verses.length !== Number(s.total_verses)) {
    fail("Āyah-Anzahl " + s.id + " " + (doc.verses && doc.verses.length) + " vs " + s.total_verses);
  }
  doc.verses.forEach(function (v, i) {
    if (Number(v.id) !== i + 1) fail("Āyah-Reihenfolge " + s.id + ":" + v.id);
    const t = v.transliteration || {};
    ["scientific", "standard", "readable"].forEach(function (k) {
      const val = t[k];
      if (val == null || val === undefined) fail("null " + s.id + ":" + v.id + " " + k);
      if (typeof val !== "string") fail("type " + s.id + ":" + v.id + " " + k);
      if (!String(val).trim()) fail("leer " + s.id + ":" + v.id + " " + k);
      if (/[<>]/.test(val) || /�/.test(val)) fail("HTML/Unicode " + s.id + ":" + v.id);
      if (/\s{2,}/.test(val)) fail("Doppelspace " + s.id + ":" + v.id);
      if (nfc(val) !== val) fail("nicht NFC " + s.id + ":" + v.id);
    });
    const words = Array.isArray(v.words) ? v.words.slice().sort(function (a, b) { return a.position - b.position; }) : [];
    for (var w = 0; w < words.length; w++) {
      if (Number(words[w].position) !== w + 1) fail("Wortposition " + s.id + ":" + v.id);
      if (!words[w].scientific) fail("Wort leer " + s.id + ":" + v.id + " #" + (w + 1));
    }
    ayahs += 1;
  });
});

const samples = ["1:1", "1:7", "2:1", "2:255", "112:1", "113:1", "114:6"];
samples.forEach(function (ref) {
  const parts = ref.split(":").map(Number);
  const doc = JSON.parse(fs.readFileSync(path.join(DIR, String(parts[0]).padStart(3, "0") + ".json"), "utf8"));
  const v = doc.verses[parts[1] - 1];
  if (!v || !v.transliteration.scientific) fail("Stichprobe fehlt " + ref);
  console.log("SAMPLE", ref, v.transliteration.scientific);
});

if (ayahs < 6236) fail("zu wenige Āyāt: " + ayahs);
console.log("QURAN_TRANSLIT_QA OK:", META.surahs.length, "Sūrahs,", ayahs, "Āyāt");
