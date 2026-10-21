#!/usr/bin/env node
/**
 * Production gate for native Apple TV screensaver feeds.
 * A 200 HTML fallback or a rotation-only index is NOT a working content feed.
 */
"use strict";

const BASE = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const MAX_ATTEMPTS = 4;

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function getJson(path) {
  let last;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const separator = path.includes("?") ? "&" : "?";
      const response = await fetch(BASE + path + separator + "tvcheck=" + Date.now(), {
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache",
          "User-Agent": "DarAlTawhid-tvOS/LiveScreensaverVerify"
        }
      });
      const type = String(response.headers.get("content-type") || "").toLowerCase();
      if (response.status !== 200 || !type.includes("json")) {
        throw new Error(path + ": HTTP " + response.status + ", Content-Type=" + type);
      }
      return await response.json();
    } catch (error) {
      last = error;
      if (attempt < MAX_ATTEMPTS) await sleep(attempt * 1500);
    }
  }
  throw new Error("Apple TV live resource unavailable: " + String(last));
}

function assert(condition, message) {
  if (!condition) throw new Error("Apple TV LIVE FAIL: " + message);
}

async function main() {
  const paths = [
    "/apple-tv/catalog.json",
    "/apple-tv/screensaver/catalog.json",
    "/apple-tv/screensaver/entries-index.json",
    "/apple-tv/screensaver/rotation.json",
    "/apple-tv/hadith/catalog.json",
    "/apple-tv/hadith/library-shell.json",
    "/apple-tv/hadith/series/001-050/HAD-0001.json",
    "/apple-tv/quran/tadabbur/catalog.json",
    "/apple-tv/quran/tadabbur/entries-index.json"
  ];
  // Limited concurrency avoids overwhelming the worker on large source catalogs.
  const data = [];
  for (let i = 0; i < paths.length; i += 3) {
    data.push(...await Promise.all(paths.slice(i, i + 3).map(getJson)));
  }
  const [root, screen, index, rotation, hadith, shell, sample, tad, tadIndex] = data;
  const count = Number(hadith.totalCount);
  assert(root.screensaver && root.screensaver.enabled === true, "screensaver disabled");
  assert(screen.status === "active" && screen.remoteLoad === true, "screensaver catalog inactive");
  assert(Number.isInteger(count) && count > 0, "canonical hadith catalog empty");
  assert(Number(screen.entriesCount) === count, "screen count differs from hadith count");
  assert(Number(index.totalVerifiedEntries) === count, "screensaver index total differs from hadith count");
  const files = Array.isArray(index.files) ? index.files : [];
  assert(files.length === 1 && files[0].path === "../hadith/library-shell.json", "screensaver index points to non-record data");
  assert(Number(files[0].count) === count, "screensaver source index count mismatch");
  assert(Array.isArray(screen.entriesPaths) && screen.entriesPaths.length === 1 &&
    screen.entriesPaths[0] === files[0].path, "screensaver catalog source path mismatch");
  assert(Array.isArray(shell.records) && shell.records.length === count, "actual screensaver source missing or empty");
  assert(shell.records.some(item => item && item.textMarkdown && ["hadith", "athar"].includes(item.recordType)), "no renderable statements");
  assert(sample.id === "HAD-0001" && String(sample.textMarkdown || "").trim().length > 0, "record fetch unavailable");
  const weights = rotation.futureModuleMixing && rotation.futureModuleMixing.weights;
  assert(weights && weights.hadith === 5 && weights.athar === 5 && weights.quranTad === 5, "5/5/5 rotation lost");
  assert(rotation.display && rotation.display.duration && rotation.display.duration.unit === "seconds",
    "screen retention seconds contract missing");
  assert(Number(tad.entriesCount) > 0 && Number(tadIndex.totalVerifiedEntries) === Number(tad.entriesCount),
    "Qur'an Tadabbur catalog/index not usable");
  console.log("Apple TV LIVE OK: " + count + " HAD/ATHAR records, " + tad.entriesCount +
    " Tadabbur, 5/5/5 rotation, all 9 tvOS JSON endpoints valid.");
}

main().catch(error => { console.error(error.stack || error.message || error); process.exitCode = 1; });
