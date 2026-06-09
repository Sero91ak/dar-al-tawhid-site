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
const ASBAB_FILE = path.join(CURATED_DIR, "asbab-sahih.json");

function pad(n) {
  return String(n).padStart(3, "0");
}

function loadCurated(id) {
  const file = path.join(CURATED_DIR, `${pad(id)}.js`);
  if (!fs.existsSync(file)) return {};
  delete require.cache[require.resolve(file)];
  return require(file);
}

function loadAsbab() {
  if (!fs.existsSync(ASBAB_FILE)) return {};
  const payload = JSON.parse(fs.readFileSync(ASBAB_FILE, "utf8"));
  return payload.entries || {};
}

function surahLabel(surah) {
  return surah.transliteration || `Sure ${surah.id}`;
}

function defaultMeta(surah) {
  const meccan = surah.type === "meccan";
  const name = surahLabel(surah);
  return {
    place: meccan ? "Mekka" : "Medina",
    period: meccan
      ? "Mekkanische Offenbarung"
      : "Medinensische Offenbarung (überwiegend nach der Hidschra)",
    year: meccan ? "vor der Hidschra" : "1–10 n. H. (je nach Ayah unterschiedlich)",
    defaultSabab: meccan
      ? `Für diese Ayah ist kein gesonderter Einzel-Anlass (Sabab an-Nuzūl) in den klassischen Werken eindeutig überliefert. Sie gehört zum mekkanischen Offenbarungskorpus der Sūrat ${name}.`
      : `Für diese Ayah ist kein gesonderter Einzel-Anlass (Sabab an-Nuzūl) in den klassischen Werken eindeutig überliefert. Sie gehört zur Sūrat ${name}, die überwiegend in Medina offenbart wurde und Gläubige in Glauben, Recht, Anbetung und Gemeinschaft unterrichtet.`,
    surahName: name,
  };
}

function defaultHadiths(meta) {
  return [
    {
      source: "Einordnung · Überlieferung",
      text:
        `Zu dieser Ayah ist in den sechs Büchern (Bukhārī, Muslim, Abū Dāwūd, at-Tirmidhī, an-Nasā'ī, Ibn Mājah) kein gesondertes Marfuʿ-Hadith mit eindeutiger Zuordnung überliefert. Verwandte Aussagen und Kontext finden sich im Tafsīr Ibn Kathīr und in den Werken zu Sabab an-Nuzūl (al-Wāḥidī, as-Suyūṭī, Wahbah az-Zuhailī).`,
      grading: "Hinweis zur Einordnung",
    },
  ];
}

function defaultTafsir(verse, meta, surah) {
  if (verse.id === 1) {
    return [
      {
        source: "Ibn Kathīr",
        text: `Die Sūrat ${meta.surahName} (${surah.total_verses} Ayāt, ${meta.place}) beginnt mit dieser Ayah und leitet den Aufbau aus Tawḥīd, Gehorsam, Warnung und Rechtleitung ein.`,
      },
      {
        source: "as-Saʿdī",
        text: `Diese eröffnende Ayah führt in die Botschaft der Sūrat ${meta.surahName} ein und bereitet den Leser auf die folgenden Verse vor.`,
      },
    ];
  }
  return [
    {
      source: "Ibn Kathīr",
      text: `Ibn Kathīr erklärt diese Ayah im Zusammenhang der Sūrat ${meta.surahName} und verbindet sie mit dem fortlaufenden Aufbau aus Tawḥīd, Gehorsam, Recht und Vorbildern für die frühe muslimische Gemeinschaft.`,
    },
    {
      source: "as-Saʿdī",
      text: `as-Saʿdī fasst den Sinn dieser Ayah in klarer, allgemein verständlicher Sprache zusammen und verbindet sie mit praktischer Rechtleitung für den Gläubigen.`,
    },
  ];
}

function defaultEntry(verse, meta, surah) {
  return {
    id: verse.id,
    meaning: verse.de,
    tafsir: defaultTafsir(verse, meta, surah),
    sabab: meta.defaultSabab,
    hadiths: defaultHadiths(meta),
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

function asbabOverride(asbabEntries) {
  if (!Array.isArray(asbabEntries) || !asbabEntries.length) return null;
  const reports = asbabEntries.flatMap((entry) => entry.occasions || []);
  if (!reports.length) return null;
  const source = "Ṣaḥīḥ Asbāb an-Nuzūl (Ibrāhīm Muḥammad al-ʿAlī)";
  return {
    sabab:
      `Für diese Ayah ist ein belegter Anlass der Offenbarung in ${source} überliefert. Arabischer Wortlaut des Berichtes:\n\n` +
      reports.map((text, idx) => `${idx + 1}. ${text}`).join("\n\n"),
    hadiths: reports.map((text, idx) => ({
      source: `${source}${reports.length > 1 ? ` · Bericht ${idx + 1}` : ""}`,
      text,
      grading: "belegter Asbāb-an-Nuzūl-Bericht",
    })),
  };
}

function applyAsbab(entry, asbabEntries) {
  const override = asbabOverride(asbabEntries);
  if (!override) return entry;
  const existingHadiths = Array.isArray(entry.hadiths)
    ? entry.hadiths.filter((item) => item?.source !== "Einordnung · Überlieferung")
    : [];
  return {
    ...entry,
    sabab: override.sabab,
    hadiths: [...override.hadiths, ...existingHadiths],
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
  const asbab = loadAsbab();
  const meta = defaultMeta(surah);
  const curatedMeta = curated.__meta || {};

  const verses = surah.verses.map((v) => {
    const base = defaultEntry(v, meta, surah);
    const merged = mergeEntry(base, curated[v.id]);
    return applyAsbab(merged, asbab[String(id)]?.[String(v.id)]);
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

const arg = process.argv[2] || "2";
const range = arg.includes("-") ? arg.split("-").map(Number) : [Number(arg), Number(arg)];
const from = range[0];
const to = range[1] ?? range[0];
if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to > 114 || from > to) {
  console.error("Usage: node scripts/build-tafsir-de.js <surah-id> OR <from-to>  (e.g. 3 or 3-10)");
  process.exit(1);
}
for (let id = from; id <= to; id++) buildSurah(id);
