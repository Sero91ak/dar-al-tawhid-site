#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let failed = 0;

function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}

function ok(msg) {
  console.log("OK:", msg);
}

function warn(msg) {
  console.warn("WARN:", msg);
}

function readJson(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    fail("missing " + rel);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail("invalid JSON " + rel + ": " + e.message);
    return null;
  }
}

function validateHadith() {
  const catalog = readJson("apple-tv/hadith/catalog.json");
  const manifest = readJson("apple-tv/hadith/manifest.json");
  if (!catalog || !manifest) return;
  const seriesRoot = path.join(ROOT, "apple-tv/hadith/series");
  const ids = [];
  if (fs.existsSync(seriesRoot)) {
    for (const series of fs.readdirSync(seriesRoot)) {
      const dir = path.join(seriesRoot, series);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const name of fs.readdirSync(dir)) {
        if (/^HAD-\d+\.json$/i.test(name)) ids.push(path.basename(name, ".json"));
      }
    }
  }
  if (new Set(ids).size !== ids.length) fail("duplicate HAD ids");
  const count = ids.length;
  if (catalog.totalCount !== count) fail("catalog.totalCount " + catalog.totalCount + " !== files " + count);
  if (catalog.publishedCount !== count) fail("catalog.publishedCount mismatch");
  const latest = ids.length ? ids.slice().sort().pop() : "";
  const catalogLatest = catalog.latestId || catalog.latestPublishedId || "";
  if (catalogLatest !== latest) fail("latestId " + catalogLatest + " !== " + latest);
  if (manifest.readyThrough && manifest.readyThrough !== latest) {
    fail("manifest.readyThrough " + manifest.readyThrough + " !== " + latest);
  }
  let seriesSum = 0;
  for (const series of catalog.series || []) {
    const indexRel = "apple-tv/hadith/" + (series.indexPath || ("series/" + series.id + "/index.json"));
    const index = readJson(indexRel);
    if (!index) continue;
    const listed = Array.isArray(index.files) ? index.files : [];
    seriesSum += listed.length;
    const bounds = String(series.id || "").match(/^(\d+)-(\d+)$/);
    for (const name of listed) {
      const n = Number((name.match(/^HAD-(\d+)\.json$/i) || [])[1]);
      if (!bounds || !n || n < Number(bounds[1]) || n > Number(bounds[2])) {
        fail("HAD record in wrong series: " + series.id + "/" + name);
      }
      const recPath = path.join(ROOT, path.dirname(indexRel), name);
      if (!fs.existsSync(recPath)) fail("missing record " + path.dirname(indexRel) + "/" + name);
    }
  }
  const ranges = (catalog.series || []).map(s => (String(s.id || "").match(/^(\d+)-(\d+)$/) || []).slice(1).map(Number)).filter(p => p.length === 2).sort((a,b) => a[0]-b[0]);
  for (let i=1; i<ranges.length; i++) if (ranges[i][0] <= ranges[i-1][1]) fail("Overlapping HAD series ranges: " + ranges[i-1].join("-") + " and " + ranges[i].join("-"));
  if (seriesSum !== count) fail("series index files " + seriesSum + " !== disk " + count);
  ok("hadith files=" + count + " latest=" + latest);
}

function validateTadabbur() {
  const cat = readJson("apple-tv/quran/tadabbur/catalog.json");
  const idx = readJson("apple-tv/quran/tadabbur/entries-index.json");
  if (!cat || !idx) return;
  const sum = (idx.files || []).reduce((n, f) => n + Number(f.count || 0), 0);
  if (sum !== idx.totalVerifiedEntries) fail("tadabbur SUM(file.count) !== totalVerifiedEntries");
  if (sum !== cat.entriesCount) fail("tadabbur SUM(file.count) !== catalog.entriesCount");
  const refs = [];
  let loaded = 0;
  for (const file of idx.files || []) {
    const rel = "apple-tv/quran/tadabbur/" + file.path;
    const data = readJson(rel);
    if (!data) continue;
    const entries = Array.isArray(data) ? data : data.entries || [];
    if (entries.length !== file.count) fail(file.path + " count " + file.count + " !== " + entries.length);
    for (const entry of entries) {
      loaded += 1;
      refs.push(entry.reference || "");
      if (!entry.reference || !entry.text || !entry.narrator || !entry.generation || !entry.source) {
        fail("tadabbur schema gap in " + file.path);
      }
    }
  }
  if (loaded !== sum) fail("tadabbur loaded " + loaded + " !== " + sum);
  const dups = [...new Set(refs.filter((ref, i) => ref && refs.indexOf(ref) !== i))];
  if (dups.length) fail("tadabbur duplicate references: " + dups.length);
  ok("tadabbur entries=" + loaded);
}

function validateAthar() {
  const dir = path.join(ROOT, "content/quran-athar/de");
  if (!fs.existsSync(dir)) {
    warn("content/quran-athar/de missing");
    return;
  }
  const files = fs.readdirSync(dir).filter((n) => n.endsWith(".json"));
  let verses = 0;
  for (const name of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
    verses += Array.isArray(data.verses) ? data.verses.length : 0;
  }
  ok("quran-athar files=" + files.length + " verse-records=" + verses);
}

validateHadith();
validateTadabbur();
validateAthar();

if (failed) {
  console.error("\n" + failed + " canonical-content check(s) failed.");
  process.exit(1);
}
console.log("canonical-content validation passed.");
