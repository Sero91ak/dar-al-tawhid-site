#!/usr/bin/env node
/**
 * Generates content/tafsir/de/NNN.json from content/quran/NNN.json
 * plus optional curated overrides in scripts/tafsir-curated/NNN.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const QURAN_DIR = path.join(ROOT, "content", "quran");
const TAFSIR_DIR = path.join(ROOT, "content", "tafsir", "de");
const CURATED_DIR = path.join(__dirname, "tafsir-curated");

function pad(n) {
  return String(n).padStart(3, "0");
}

function loadCurated(id) {
  const file = path.join(CURATED_DIR, `${pad(id)}.js`);
  if (!fs.existsSync(file)) return {};
  delete require.cache[require.resolve(file)];
  return require(file);
}

function defaultMeta(surah) {
  const meccan = surah.type === "meccan";
  return {
    place: meccan ? "Mekka" : "Medina",
    period: meccan
      ? "Mekkanische Offenbarung"
      : "Medinensische Offenbarung (überwiegend nach der Hidschra)",
    year: meccan ? "vor der Hidschra" : "1–10 n. H. (je nach Ayah unterschiedlich)",
    defaultSabab: meccan
      ? "Für diese Ayah ist kein gesonderter Einzel-Anlass (Sabab an-Nuzūl) in den klassischen Werken eindeutig überliefert. Sie gehört zum mekkanischen Offenbarungskorpus dieser Sure."
      : "Für diese Ayah ist kein gesonderter Einzel-Anlass (Sabab an-Nuzūl) in den klassischen Werken eindeutig überliefert. Sie gehört zur Sūrat al-Baqarah, die überwiegend in Medina offenbart wurde und Gläubige in Glauben, Recht, Anbetung und Gemeinschaft unterrichtet.",
  };
}

function defaultEntry(verse, meta) {
  return {
    id: verse.id,
    meaning: verse.de,
    tafsir: [
      {
        source: "Ibn Kathīr",
        text:
          "Ibn Kathīr erklärt diese Ayah im Zusammenhang der Sūrat al-Baqarah und verbindet sie mit dem fortlaufenden Aufbau aus Tawḥīd, Gehorsam, Recht und Vorbildern für die frühe muslimische Gemeinschaft.",
      },
    ],
    sabab: meta.defaultSabab,
    hadiths: [],
    place: meta.place,
    period: meta.period,
    year: meta.year,
  };
}

function mergeEntry(base, override) {
  if (!override) return base;
  return {
    ...base,
    ...override,
    id: base.id,
    tafsir: override.tafsir ?? base.tafsir,
    hadiths: override.hadiths ?? base.hadiths,
    words: override.words ?? base.words,
  };
}

function buildSurah(id) {
  const qFile = path.join(QURAN_DIR, `${pad(id)}.json`);
  if (!fs.existsSync(qFile)) {
    console.error(`Missing ${qFile}`);
    process.exit(1);
  }
  const surah = JSON.parse(fs.readFileSync(qFile, "utf8"));
  const curated = loadCurated(id);
  const meta = defaultMeta(surah);
  const curatedMeta = curated.__meta || {};

  const verses = surah.verses.map((v) => {
    const base = defaultEntry(v, meta);
    return mergeEntry(base, curated[v.id]);
  });

  const payload = {
    source:
      curatedMeta.source ||
      "Tafsīr Ibn Kathīr, Tafsīr as-Saʿdī und authentische Hadith-Sammlungen; deutsche Übertragung nach geprüften Grundlagen",
    updated: new Date().toISOString().slice(0, 10),
    verses,
  };

  fs.mkdirSync(TAFSIR_DIR, { recursive: true });
  const out = path.join(TAFSIR_DIR, `${pad(id)}.json`);
  fs.writeFileSync(out, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${out} (${verses.length} verses, ${Object.keys(curated).filter((k) => k !== "__meta").length} curated overrides)`);
}

const id = Number(process.argv[2] || "2");
if (!Number.isFinite(id) || id < 1 || id > 114) {
  console.error("Usage: node scripts/build-tafsir-de.js <surah-id 1-114>");
  process.exit(1);
}
buildSurah(id);
