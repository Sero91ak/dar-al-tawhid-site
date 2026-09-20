"use strict";

const fs = require("fs");
const path = require("path");
const { nfc, collapseSpaces, toStandard, toReadable } = require("./quran-translit-map");

const ROOT = path.resolve(__dirname, "..");
const XML = process.env.CC_TEI_CAIRO
  || "/tmp/corpus-coranicum-tei/data/cairo_quran/cairoquran.xml";
const OUT_DIR = path.join(ROOT, "content", "quran-translit");
const META_PATH = path.join(ROOT, "content", "quran", "surahs.json");

function parseCairo(xml) {
  const arabic = Object.create(null);
  const sci = Object.create(null);
  const arRe = /xml:id="w-(\d+)-(\d+)-(\d+)"[^>]*>([^<]*)<\/w>/g;
  const sciRe = /xml:id="transcribed-w-(\d+)-(\d+)-(\d+)"[^>]*>([^<]*)<\/w>/g;
  let m;
  while ((m = arRe.exec(xml))) {
    const s = Number(m[1]);
    const a = Number(m[2]);
    const p = Number(m[3]);
    const key = s + ":" + a + ":" + p;
    arabic[key] = nfc(m[4]);
  }
  while ((m = sciRe.exec(xml))) {
    const s = Number(m[1]);
    const a = Number(m[2]);
    const p = Number(m[3]);
    const key = s + ":" + a + ":" + p;
    sci[key] = nfc(m[4]);
  }
  return { arabic: arabic, sci: sci };
}

function joinWords(words) {
  return collapseSpaces(words.map(function (w) { return w.scientific; }).join(" "));
}

function main() {
  if (!fs.existsSync(XML)) {
    console.error("Corpus Coranicum TEI nicht gefunden:", XML);
    process.exit(1);
  }
  const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  const xml = fs.readFileSync(XML, "utf8");
  const parsed = parseCairo(xml);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const overlay = {};
  let ayahCount = 0;
  const missing = [];

  meta.surahs.forEach(function (s) {
    const sid = Number(s.id);
    const verses = [];
    for (var a = 1; a <= Number(s.total_verses); a++) {
      const words = [];
      var p = 1;
      while (true) {
        const key = sid + ":" + a + ":" + p;
        if (!parsed.sci[key]) break;
        words.push({
          position: p,
          ar: parsed.arabic[key] || "",
          scientific: parsed.sci[key]
        });
        p += 1;
      }
      words.sort(function (x, y) { return x.position - y.position; });
      const scientific = joinWords(words);
      if (!scientific) missing.push(sid + ":" + a);
      const standard = scientific ? toStandard(scientific) : "";
      const readable = scientific ? toReadable(scientific) : "";
      verses.push({
        id: a,
        transliteration: { scientific: scientific, standard: standard, readable: readable },
        words: words
      });
      overlay[sid + ":" + a] = { scientific: scientific, standard: standard, readable: readable };
      ayahCount += 1;
    }
    const doc = {
      source: "Corpus Coranicum TEI (telota/corpus-coranicum-tei), cairo_quran transcription word_cc",
      license: "CC BY-SA 4.0",
      publisher: "Berlin-Brandenburgische Akademie der Wissenschaften",
      generatedAt: new Date().toISOString(),
      surah: sid,
      verses: verses
    };
    fs.writeFileSync(
      path.join(OUT_DIR, String(sid).padStart(3, "0") + ".json"),
      JSON.stringify(doc),
      "utf8"
    );
  });

  fs.writeFileSync(
    path.join(OUT_DIR, "search-overlay.json"),
    JSON.stringify({ source: "Corpus Coranicum TEI", license: "CC BY-SA 4.0", ayahs: overlay }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "meta.json"),
    JSON.stringify({
      source: "https://github.com/telota/corpus-coranicum-tei",
      license: "CC BY-SA 4.0",
      surahs: meta.surahs.length,
      ayahs: ayahCount,
      missing: missing,
      sample: {
        "1:2": overlay["1:2"],
        "2:255": overlay["2:255"],
        "112:1": overlay["112:1"]
      }
    }, null, 2),
    "utf8"
  );
  console.log("imported ayahs", ayahCount, "missing", missing.length);
  if (missing.length) {
    console.error(missing.slice(0, 40).join(", "));
    process.exit(2);
  }
}

main();
