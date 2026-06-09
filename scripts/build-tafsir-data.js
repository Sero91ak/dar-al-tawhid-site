#!/usr/bin/env node
/**
 * Builds content/tafsir/de/001.json … 114.json
 * Sources:
 *  - meaning: German translation from content/quran (Bubenheim & Elyas)
 *  - tafsir: Ibn Kathīr (Arabic, spa5k/tafsir_api)
 *  - sabab / hadiths: Asbāb al-Nuzūl (Arabic, mostafaahmed97/asbab-al-nuzul-dataset)
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const QURAN_DIR = path.join(ROOT, "content", "quran");
const OUT_DIR = path.join(ROOT, "content", "tafsir", "de");
const ASBAB_BASE = "https://raw.githubusercontent.com/mostafaahmed97/asbab-al-nuzul-dataset/main/data/structured/json";
const IBN_KATHIR_BASE = "https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/ar-tafsir-ibn-kathir";

const SOURCE_LABEL = "Bedeutung: Bubenheim & Elyas · Tafsīr: Ibn Kathīr (arabisch) · Offenbarung: صحيح أسباب النزول (إبراهيم محمد العلي)";

function pad(n) { return String(n).padStart(3, "0"); }

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
        if (res.statusCode === 404) { resolve(null); return; }
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

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function cleanTafsirText(text) {
  return String(text || "")
    .replace(/\[\[[^\]]*\]\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function placeLabel(type) {
  return type === "medinan" ? "Madīna" : "Mekka";
}

function periodLabel(type) {
  return type === "medinan" ? "Medinensische Phase" : "Makkanische Phase";
}

function sababIntro() {
  return "Authentischer Offenbarungsgrund (arabische Überlieferung nach صحيح أسباب النزول). Deutsche Übersetzung wird ergänzt.\n\n";
}

function looksLikeHadith(text) {
  const t = String(text || "").trim();
  return /^(عن|ومن حديث|وفي حديث|قال|روى|أخرج)/.test(t) || t.includes("حديث") || t.includes("رضي الله");
}

function buildAsbabMap(rows) {
  const map = new Map();
  if (!Array.isArray(rows)) return map;
  for (const row of rows) {
    const ayahs = Array.isArray(row.ayahs) ? row.ayahs : [];
    const occasions = Array.isArray(row.occasions) ? row.occasions.filter(Boolean) : [];
    if (!ayahs.length || !occasions.length) continue;
    for (const ayahId of ayahs) {
      const key = Number(ayahId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(...occasions);
    }
  }
  return map;
}

function buildIbnKathirMap(rows) {
  const map = new Map();
  if (!Array.isArray(rows)) return map;
  for (const row of rows) {
    const ayahId = Number(row.ayah);
    if (!Number.isFinite(ayahId)) continue;
    const text = cleanTafsirText(row.text);
    if (text) map.set(ayahId, text);
  }
  return map;
}

function uniqueOccasions(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = String(item || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const updated = new Date().toISOString().slice(0, 10);

  for (let surahId = 1; surahId <= 114; surahId++) {
    process.stdout.write(`Tafsīr Sure ${surahId}/114…\r`);
    const quranPath = path.join(QURAN_DIR, `${pad(surahId)}.json`);
    if (!fs.existsSync(quranPath)) {
      console.warn(`\nMissing ${quranPath}, skip.`);
      continue;
    }
    const quran = JSON.parse(fs.readFileSync(quranPath, "utf8"));
    const asbabRows = await fetchJson(`${ASBAB_BASE}/${pad(surahId)}.json`).catch(() => null);
    const ibnRows = await fetchJson(`${IBN_KATHIR_BASE}/${surahId}.json`).catch(() => null);
    const asbabMap = buildAsbabMap(asbabRows);
    const ibnMap = buildIbnKathirMap(ibnRows);

    const verses = (quran.verses || []).map((v) => {
      const id = Number(v.id);
      const occasions = uniqueOccasions(asbabMap.get(id) || []);
      const ibn = ibnMap.get(id) || "";
      const hadiths = occasions
        .filter(looksLikeHadith)
        .map((text) => ({
          source: "Asbāb al-Nuzūl · إبراهيم محمد العلي",
          text,
          grading: "in den Anlässen überliefert"
        }));
      const sababOnly = occasions.filter((text) => !looksLikeHadith(text));
      const sababParts = [...sababOnly];
      if (occasions.length && !sababParts.length && hadiths.length) {
        sababParts.push("Siehe auch die Hadithe/Āthār in diesem Tab.");
      }

      return {
        id,
        meaning: String(v.de || "").trim(),
        tafsir: ibn ? [{ source: "Ibn Kathīr (arabisch)", text: ibn }] : [],
        sabab: sababParts.length ? sababIntro() + sababParts.join("\n\n") : "",
        hadiths,
        place: placeLabel(quran.type),
        period: periodLabel(quran.type),
        year: ""
      };
    });

    const payload = {
      source: SOURCE_LABEL,
      updated,
      verses
    };

    fs.writeFileSync(path.join(OUT_DIR, `${pad(surahId)}.json`), JSON.stringify(payload));
    await sleep(120);
  }

  console.log("\nDone → content/tafsir/de/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
