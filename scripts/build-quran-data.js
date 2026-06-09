#!/usr/bin/env node
/**
 * Builds content/quran/surahs.json + content/quran/001.json … 114.json
 * Sources: quran-json (Arabic + transliteration), fawazahmed0/quran-api (German Bubenheim)
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..", "content", "quran");
const QURAN_JSON = "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters";
const DE_URL = "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/deu-frankbubenheima.min.json";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve, reject);
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`${url} → ${res.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function pad(n) { return String(n).padStart(3, "0"); }

async function main() {
  fs.mkdirSync(ROOT, { recursive: true });

  console.log("Loading German translation…");
  const deData = await fetchJson(DE_URL);
  const deMap = new Map();
  for (const row of deData.quran || []) {
    deMap.set(`${row.chapter}:${row.verse}`, row.text);
  }

  console.log("Loading surah index…");
  const index = await fetchJson(`${QURAN_JSON}/index.json`);
  const surahsMeta = [];

  for (const meta of index) {
    const n = meta.id;
    process.stdout.write(`Surah ${n}/114…\r`);
    const chapter = await fetchJson(`${QURAN_JSON}/${n}.json`);
    const verses = (chapter.verses || []).map((v) => ({
      id: v.id,
      ar: v.text,
      tr: v.transliteration,
      de: deMap.get(`${n}:${v.id}`) || ""
    }));

    const surah = {
      id: n,
      name: chapter.name,
      transliteration: chapter.transliteration,
      type: chapter.type,
      total_verses: chapter.total_verses,
      verses
    };

    fs.writeFileSync(path.join(ROOT, `${pad(n)}.json`), JSON.stringify(surah));
    surahsMeta.push({
      id: n,
      name: surah.name,
      transliteration: surah.transliteration,
      type: surah.type,
      total_verses: surah.total_verses
    });
  }

  fs.writeFileSync(path.join(ROOT, "surahs.json"), JSON.stringify({
    updated: new Date().toISOString().slice(0, 10),
    translation: "Frank Bubenheim & Nadeem Elyas (de)",
    transliteration: "Tanzil.net (en.transliteration)",
    arabic: "Uthmani (quran-json / Quran Encyclopedia)",
    surahs: surahsMeta
  }, null, 2));

  console.log("\nDone:", surahsMeta.length, "surahs →", ROOT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
