#!/usr/bin/env node
/**
 * Publish research de-draft Āthār into content/quran-athar/de/ for the live app.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DRAFT_DIR = path.join(ROOT, "content", "quran-athar", "research", "de-draft");
const OUT_DIR = path.join(ROOT, "content", "quran-athar", "de");

function pad(n) {
  return String(n).padStart(3, "0");
}

function cleanSource(source) {
  return String(source || "")
    .replace(/;\s*spa5k\/tafsir_api/g, "")
    .replace(/Tafsīr al-Tabari \(Jāmiʿ al-Bayān\)/g, "Tafsīr al-Tabari")
    .trim();
}

function publishEntry(entry) {
  const item = {
    person: entry.person,
    generation: entry.generation,
    category: entry.category,
    text: entry.text,
    source: cleanSource(entry.source),
    grading: entry.grading,
  };
  if (entry.note) item.note = entry.note;
  return item;
}

function publishSurah(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const surahId = Number(data.surah || parseInt(path.basename(file, ".json"), 10));
  const verses = (data.verses || [])
    .map((verse) => {
      const athar = (verse.athar || []).map(publishEntry).filter((a) => a.text && a.person);
      if (!athar.length) return null;
      return { id: Number(verse.id), athar };
    })
    .filter(Boolean);

  if (!verses.length) return null;

  const nameMatch = String(data.source || "").match(/zu ([^:]+):/);
  const surahName = nameMatch?.[1]?.trim() || `Sure ${surahId}`;

  return {
    source: `Āthār der Ṣaḥābah, Tābiʿīn und Imame (bis 4. Jh.) zu ${surahName} — aus Tafsīr al-Tabari, deutsch`,
    updated: new Date().toISOString().slice(0, 10),
    verses,
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let written = 0;
  let verseBlocks = 0;
  let atharCount = 0;

  for (let id = 1; id <= 114; id += 1) {
    const draft = path.join(DRAFT_DIR, `${pad(id)}.json`);
    if (!fs.existsSync(draft)) continue;
    const payload = publishSurah(draft);
    if (!payload) continue;
    const out = path.join(OUT_DIR, `${pad(id)}.json`);
    fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    written += 1;
    verseBlocks += payload.verses.length;
    atharCount += payload.verses.reduce((n, v) => n + v.athar.length, 0);
    console.log(`${pad(id)}: ${payload.verses.length} Ayāt, ${payload.verses.reduce((n, v) => n + v.athar.length, 0)} Āthār`);
  }

  console.log(`Published ${written} files, ${verseBlocks} ayah blocks, ${atharCount} Āthār.`);
}

main();
