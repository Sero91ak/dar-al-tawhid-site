#!/usr/bin/env node
"use strict";
/**
 * Lädt die ausgewählten Übersetzungen der Bedeutungen unverändert
 * und schreibt sie nach content/quran-translations/<locale>/<surah>.json.
 * Der arabische Uthmani-Text und die deutsche Bubenheim-Fassung bleiben
 * in content/quran/.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "content", "quran-translations");
const META = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "quran", "surahs.json"), "utf8"));
const EXPECTED = META.surahs.map((s) => Number(s.total_verses));

const EDITIONS = [
  {
    locale: "en",
    edition: "en.sahih",
    source: "alquran",
    translator: "Saheeh International",
    direction: "ltr",
    script: "Latn"
  },
  {
    locale: "tr",
    edition: "tr.vakfi",
    source: "alquran",
    translator: "Diyanet Vakfı",
    direction: "ltr",
    script: "Latn"
  },
  {
    locale: "fr",
    edition: "fr.hamidullah",
    source: "alquran",
    translator: "Muhammad Hamidullah",
    direction: "ltr",
    script: "Latn"
  },
  {
    locale: "es",
    edition: "spanish_montada_eu",
    source: "quranenc",
    translator: "Noor International",
    direction: "ltr",
    script: "Latn"
  },
  {
    locale: "bs",
    edition: "bosnian_rwwad",
    source: "quranenc",
    translator: "Rowwad Translation Centre",
    direction: "ltr",
    script: "Latn"
  },
  {
    locale: "ku",
    edition: "kurmanji_ismail",
    source: "quranenc",
    translator: "Ismail Sageri",
    direction: "rtl",
    script: "Arab"
  },
  {
    locale: "ckb",
    edition: "kurdish_bamoki",
    source: "quranenc",
    translator: "Muhammad Salih Bamoki",
    direction: "rtl",
    script: "Arab"
  }
];

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "DarAlTawhidQuranCatalog/1.0",
        Accept: "application/json"
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        getJson(res.headers.location).then(resolve, reject);
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode !== 200) {
          reject(new Error(url + " → HTTP " + res.statusCode + " " + body.slice(0, 180)));
          return;
        }
        try { resolve(JSON.parse(body)); }
        catch (error) { reject(error); }
      });
    });
    req.on("error", reject);
    req.setTimeout(90000, () => req.destroy(new Error("timeout " + url)));
  });
}

async function withRetry(fn, label) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try { return await fn(); }
    catch (error) {
      last = error;
      await new Promise((r) => setTimeout(r, 400 * attempt));
      process.stderr.write("retry " + label + " #" + attempt + " " + (error.message || error) + "\n");
    }
  }
  throw last;
}

function stripAyahNumber(text, ayah) {
  return String(text || "")
    .replace(new RegExp("^" + ayah + "\\.\\s+"), "")
    .replace(/\s*\[[0-9]+\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function mapPool(items, limit, worker) {
  const out = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      out[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return out;
}

async function loadAlquran(edition) {
  const data = await withRetry(
    () => getJson("https://api.alquran.cloud/v1/quran/" + edition),
    edition
  );
  const surahs = data && data.data && data.data.surahs;
  if (!Array.isArray(surahs) || surahs.length !== 114) {
    throw new Error(edition + " hat nicht 114 Suren");
  }
  return surahs.map((surah) => surah.ayahs.map((ayah) => String(ayah.text || "").trim()));
}

async function loadQuranEnc(edition) {
  const numbers = Array.from({ length: 114 }, (_, i) => i + 1);
  const surahs = await mapPool(numbers, 6, async (surah) => {
    const data = await withRetry(
      () => getJson("https://quranenc.com/api/v1/translation/sura/" + edition + "/" + surah + "?without_footnotes_symbols=1"),
      edition + ":" + surah
    );
    const rows = Array.isArray(data && data.result) ? data.result : [];
    rows.sort((a, b) => Number(a.aya) - Number(b.aya));
    return rows.map((row) => stripAyahNumber(row.translation, Number(row.aya)));
  });
  return surahs;
}

function assertCounts(locale, surahs) {
  if (surahs.length !== 114) throw new Error(locale + " Suren " + surahs.length);
  let total = 0;
  surahs.forEach((ayahs, index) => {
    if (ayahs.length !== EXPECTED[index]) {
      throw new Error(locale + " Sure " + (index + 1) + " hat " + ayahs.length + ", erwartet " + EXPECTED[index]);
    }
    ayahs.forEach((text, ayah) => {
      if (!String(text || "").trim()) throw new Error(locale + " " + (index + 1) + ":" + (ayah + 1) + " ist leer");
    });
    total += ayahs.length;
  });
  if (total !== 6236) throw new Error(locale + " Verse " + total);
}

function writeEdition(spec, surahs) {
  const dir = path.join(OUT, spec.locale);
  fs.mkdirSync(dir, { recursive: true });
  surahs.forEach((ayahs, index) => {
    const file = path.join(dir, String(index + 1).padStart(3, "0") + ".json");
    const body = {
      locale: spec.locale,
      edition: spec.edition,
      surah: index + 1,
      ayahs
    };
    fs.writeFileSync(file, JSON.stringify(body));
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const written = [];
  for (const spec of EDITIONS) {
    process.stdout.write("load " + spec.locale + " " + spec.edition + "\n");
    const surahs = spec.source === "alquran"
      ? await loadAlquran(spec.edition)
      : await loadQuranEnc(spec.edition);
    assertCounts(spec.locale, surahs);
    writeEdition(spec, surahs);
    written.push({
      locale: spec.locale,
      edition: spec.edition,
      translator: spec.translator,
      direction: spec.direction,
      script: spec.script,
      source: spec.source,
      verses: 6236
    });
    process.stdout.write("ok " + spec.locale + " 20:5 " + surahs[19][4].slice(0, 140) + "\n");
  }
  process.stdout.write(JSON.stringify(written) + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
