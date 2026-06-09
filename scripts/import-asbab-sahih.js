#!/usr/bin/env node
/**
 * Imports structured Asbāb an-Nuzūl reports into a local curated data file.
 *
 * Source dataset:
 * https://github.com/mostafaahmed97/asbab-al-nuzul-dataset
 * Based on: صحيح أسباب النزول دراسة حديثية – Ibrāhīm Muḥammad al-ʿAlī.
 */
const fs = require("fs");
const https = require("https");
const path = require("path");

const SOURCE_URL =
  "https://raw.githubusercontent.com/mostafaahmed97/asbab-al-nuzul-dataset/main/data/structured/json/all.json";
const OUT_FILE = path.join(__dirname, "tafsir-curated", "asbab-sahih.json");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
          res.resume();
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function normalizeOccasion(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function addOccasion(entries, item) {
  const surah = String(item.surah);
  const ayahs = Array.isArray(item.ayahs) ? item.ayahs.filter(Number.isFinite) : [];
  const occasions = (item.occasions || []).map(normalizeOccasion).filter(Boolean);
  if (!Number.isFinite(item.surah) || !ayahs.length || !occasions.length) return 0;

  entries[surah] ||= {};
  for (const ayah of ayahs) {
    const key = String(ayah);
    entries[surah][key] ||= [];
    entries[surah][key].push({
      ayahs,
      occasions,
    });
  }
  return ayahs.length;
}

async function main() {
  const dataset = await fetchJson(SOURCE_URL);
  if (!Array.isArray(dataset)) throw new Error("Unexpected Asbāb dataset format");

  const entries = {};
  let linkedAyahs = 0;
  for (const item of dataset) linkedAyahs += addOccasion(entries, item);

  const payload = {
    source: "Ṣaḥīḥ Asbāb an-Nuzūl, Ibrāhīm Muḥammad al-ʿAlī",
    dataset: "mostafaahmed97/asbab-al-nuzul-dataset",
    datasetUrl: SOURCE_URL,
    imported: new Date().toISOString().slice(0, 10),
    entries,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n");
  const surahCount = Object.keys(entries).length;
  const ayahCount = Object.values(entries).reduce((sum, surah) => sum + Object.keys(surah).length, 0);
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Imported ${dataset.length} occasion groups for ${ayahCount} ayah entries across ${surahCount} surahs (${linkedAyahs} ayah links).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
