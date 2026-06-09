#!/usr/bin/env node
/**
 * Builds content/quran-athar/de/NNN.json from content/tafsir/de/NNN.json
 * for selected surahs.
 *
 * Strict mode: this file must NOT mirror Ibn Kathir/as-Sa'di tafsir panels.
 * It only emits entries with an explicit early/riwayah basis and a usable
 * authenticity marker. If a verse has no such entry, it stays empty.
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

const EARLY_PERSON_RULES = [
  [/ibn\s*ʿabb|ibn\s*abb/i, "Ibn ʿAbbās", "Sahabi"],
  [/ibn\s*masʿ|ibn\s*masu/i, "Ibn Masʿūd", "Sahabi"],
  [/ab[uū]\s*hurayrah/i, "Abū Hurayrah", "Sahabi"],
  [/ab[uū]\s*dharr/i, "Abū Dharr", "Sahabi"],
  [/ʿāʾish|aishah/i, "ʿĀʾishah", "Sahabiyyah"],
  [/\bʿumar\b|\bumar\b/i, "ʿUmar ibn al-Khaṭṭāb", "Sahabi"],
  [/\bʿuthm[aā]n\b|\buthman\b/i, "ʿUthmān ibn ʿAffān", "Sahabi"],
  [/\bʿal[iī]\b|\bali\b/i, "ʿAlī ibn Abī Ṭālib", "Sahabi"],
  [/muj[aā]hid/i, "Mujāhid", "Tābiʿī"],
  [/qat[aā]dah?/i, "Qatādah", "Tābiʿī"],
  [/ʿikrimah|ikrimah/i, "ʿIkrimah", "Tābiʿī"],
  [/saʿ[iī]d ibn jubayr/i, "Saʿīd ibn Jubayr", "Tābiʿī"],
  [/al-?hasan al-?bas/i, "al-Ḥasan al-Baṣrī", "Tābiʿī"],
  [/al-?ḍaḥh[aā]k|ad-?dahhak/i, "aḍ-Ḍaḥḥāk", "Tābiʿī"],
  [/as-?sudd[iī]|suddi/i, "as-Suddī", "Tābiʿī"],
  [/ahmad ibn hanbal|im[aā]m ahmad/i, "Aḥmad ibn Ḥanbal", "Imam bis 4. Jh."],
  [/al-?bukh[aā]r[iī]/i, "al-Bukhārī", "Imam bis 4. Jh."],
  [/ab[uū]\s*hatim/i, "Abū Ḥātim ar-Rāzī", "Imam bis 4. Jh."],
  [/ab[uū]\s*zurʿah/i, "Abū Zurʿah ar-Rāzī", "Imam bis 4. Jh."],
];

function earlyPersonFrom(text) {
  const s = String(text || "");
  for (const [re, person, generation] of EARLY_PERSON_RULES) {
    if (re.test(s)) return { person, generation };
  }
  return null;
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

function isAuthentic(entry) {
  const hay = `${entry?.source || ""} ${entry?.grading || ""}`.toLowerCase();
  return (
    hay.includes("ṣaḥīḥ") ||
    hay.includes("sahih") ||
    hay.includes("ḥasan") ||
    hay.includes("hasan") ||
    hay.includes("bukhārī") ||
    hay.includes("bukhari") ||
    hay.includes("muslim")
  );
}

function hadithSourceIsReliable(entry) {
  const hay = `${entry?.source || ""} ${entry?.grading || ""}`.toLowerCase();
  return (
    hay.includes("ṣaḥīḥ") ||
    hay.includes("sahih") ||
    hay.includes("bukhārī") ||
    hay.includes("bukhari") ||
    hay.includes("muslim") ||
    hay.includes("ḥasan") ||
    hay.includes("hasan")
  );
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

  // Do not mirror tafsir panels. Only accept tafsir rows when the source itself
  // explicitly names an early authority and carries a usable authenticity marker.
  for (const row of verse.tafsir || []) {
    if (!row?.text || !String(row.text).trim()) continue;
    if (!isAuthentic(row)) continue;
    const early = earlyPersonFrom(`${row.source || ""} ${row.text || ""}`);
    if (!early) continue;
    push({
      person: early.person,
      generation: early.generation,
      category: "Athar-Tafsir",
      text: String(row.text).trim(),
      source: `${row.source || "Athar"}; Bezug zu ${surahName} ${surahId}:${verse.id}`,
      grading: row.grading || "authentisch markiert",
      note: "Streng gefiltert: nur frühe Autorität mit Authentizitäts-Hinweis.",
    });
  }

  for (const row of verse.hadiths || []) {
    if (!row?.text || isGenericHadith(row)) continue;
    if (!hadithSourceIsReliable(row)) continue;
    const early = earlyPersonFrom(row.text);
    const isMarfu = /prophet|gesandten|ﷺ|sagte/i.test(row.text);
    push({
      person: early?.person || (isMarfu ? "Prophet Muhammad ﷺ" : "Ṣaḥīḥe Überlieferung"),
      generation: early?.generation || (isMarfu ? "Prophet ﷺ" : "Überlieferung"),
      category: early ? "Sahih-Athar / Hadith" : "Hadith-Tafsir",
      text: String(row.text).trim(),
      source: `${row.source || "Hadith"}; Bezug zu ${surahName} ${surahId}:${verse.id}`,
      grading: row.grading || "",
      note: "Streng übernommen: nur nicht-generische Überlieferung mit ṣaḥīḥ/ḥasan-Hinweis.",
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
    source: `Strenge Āthār-Auszüge zu ${surahName}: nur frühe/riwāyah-basierte Einträge mit Authentizitäts-Hinweis`,
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
