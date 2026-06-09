#!/usr/bin/env node
/**
 * Builds content/quran-athar/de/NNN.json from content/tafsir/de/NNN.json
 * for selected surahs. Extracts tafsir entries and substantive hadith notes.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TAFSIR_DIR = path.join(ROOT, "content", "tafsir", "de");
const ATHAR_DIR = path.join(ROOT, "content", "quran-athar", "de");
const QURAN_INDEX = path.join(ROOT, "content", "quran", "surahs.json");

function pad(n) {
  return String(n).padStart(3, "0");
}

function loadSurahNames() {
  const data = JSON.parse(fs.readFileSync(QURAN_INDEX, "utf8"));
  const map = new Map();
  (data.surahs || []).forEach((s) => map.set(Number(s.id), s.transliteration || `Sure ${s.id}`));
  return map;
}

const GENERATION_RULES = [
  [/ibn\s*ʿabb|ibn\s*abb/i, "Sahabi", "Tafsir"],
  [/ibn\s*masʿ|ibn\s*masu/i, "Sahabi", "Tafsir"],
  [/ab[uū]\s*hurayrah|ab[uū]\s*dharr|ʿāʾish|aishah|umar|uthman|ali\b/i, "Sahabi", "Tafsir"],
  [/mujahid|qat[aā]d|ikrimah|saʿ[iī]d ibn jubayr|al-?hasan al-?bas|al-?ḍaḥh[aā]k|suddi/i, "Tabi'i", "Tafsir"],
  [/ibn\s*kath[iī]r/i, "Imam des Tafsir", "Tafsir"],
  [/as-?saʿd[iī]|saadi/i, "Imam", "Tafsir"],
  [/ibn\s*taymiyyah|ibn\s*al-?qayyim|ahmad ibn hanbal|al-?bukh[aā]r[iī]|ab[uū]\s*hatim|ab[uū]\s*zurʿah|an-?nawaw[iī]/i, "Imam", "Tafsir"],
  [/at-?tabar[iī]|al-?baghaw[iī]|al-?qurtub[iī]|al-?mawardi/i, "Imam", "Tafsir"],
];

function classifyPerson(source) {
  const s = String(source || "");
  for (const [re, generation, category] of GENERATION_RULES) {
    if (re.test(s)) return { generation, category };
  }
  if (/prophet|gesandten|ﷺ|marfu/i.test(s)) return { generation: "Prophet ﷺ", category: "Hadith" };
  if (/sahih|muslim|bukh|tirmidh|ab[uū]\s*d[aā]w|nas[aā]i|ibn\s*majah|musnad|ahmad/i.test(s)) {
    return { generation: "Prophet ﷺ", category: "Hadith" };
  }
  return { generation: "Salaf", category: "Tafsir" };
}

function isGenericHadith(entry) {
  const hay = `${entry?.source || ""} ${entry?.text || ""}`.toLowerCase();
  return (
    hay.includes("einordnung · überlieferung") ||
    hay.includes("kein gesondertes marfu") ||
    hay.includes("kein gesondertes marfuʿ") ||
    hay.includes("in den sechs büchern")
  );
}

function cleanPerson(source) {
  return String(source || "Überlieferung")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAtharFromTafsirVerse(verse, surahId, surahName) {
  const athar = [];
  const seen = new Set();

  const push = (item) => {
    const key = `${item.person}|${item.text}|${item.source}`;
    if (seen.has(key)) return;
    seen.add(key);
    athar.push(item);
  };

  for (const row of verse.tafsir || []) {
    if (!row?.text || !String(row.text).trim()) continue;
    const person = cleanPerson(row.source);
    const meta = classifyPerson(person);
    push({
      person,
      generation: meta.generation,
      category: meta.category,
      text: String(row.text).trim(),
      source: `${row.source || person}; Tafsīr zu ${surahName} ${surahId}:${verse.id}`,
      note: "Sinngemäße deutsche Zusammenfassung aus der Tafsīr-Sammlung.",
    });
  }

  for (const row of verse.hadiths || []) {
    if (!row?.text || isGenericHadith(row)) continue;
    const person = /prophet|ﷺ|gesandten/i.test(row.text)
      ? "Prophet Muhammad ﷺ"
      : cleanPerson(row.source);
    const meta = classifyPerson(`${person} ${row.source || ""}`);
    push({
      person,
      generation: meta.generation,
      category: "Hadith",
      text: String(row.text).trim(),
      source: `${row.source || "Hadith"}; Bezug zu ${surahName} ${surahId}:${verse.id}`,
      grading: row.grading || "",
      note: row.grading ? "" : "Hadith-Einordnung zur Ayah.",
    });
  }

  return athar;
}

function buildSurahAthar(surahId, surahNames) {
  const file = path.join(TAFSIR_DIR, `${pad(surahId)}.json`);
  if (!fs.existsSync(file)) return null;
  const tafsir = JSON.parse(fs.readFileSync(file, "utf8"));
  const surahName = surahNames.get(surahId) || `Sure ${surahId}`;
  const verses = [];

  for (const verse of tafsir.verses || []) {
    const athar = buildAtharFromTafsirVerse(verse, surahId, surahName);
    if (athar.length) verses.push({ id: Number(verse.id), athar });
  }

  return {
    source: `Āthār-Auszüge zu ${surahName} (deutsche Zusammenfassungen aus Tafsīr und Hadith-Überlieferungen)`,
    updated: new Date().toISOString().slice(0, 10),
    verses,
  };
}

function main() {
  const args = process.argv.slice(2);
  let from = 2;
  let to = 50;
  if (args[0]) from = Number(args[0]);
  if (args[1]) to = Number(args[1]);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to > 114 || from > to) {
    console.error("Usage: node scripts/build-quran-athar-de.js [fromSurah] [toSurah]");
    process.exit(1);
  }

  fs.mkdirSync(ATHAR_DIR, { recursive: true });
  const surahNames = loadSurahNames();
  let written = 0;
  let verseCount = 0;

  for (let id = from; id <= to; id += 1) {
    const payload = buildSurahAthar(id, surahNames);
    if (!payload || !payload.verses.length) {
      console.warn(`Skip ${pad(id)}: no athar extracted`);
      continue;
    }
    const out = path.join(ATHAR_DIR, `${pad(id)}.json`);
    fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    written += 1;
    verseCount += payload.verses.length;
    console.log(`${pad(id)}: ${payload.verses.length} Ayāt mit Āthār`);
  }

  console.log(`Done. ${written} files, ${verseCount} ayah blocks.`);
}

main();
