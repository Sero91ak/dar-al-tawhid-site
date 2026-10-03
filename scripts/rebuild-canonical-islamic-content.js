#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HADITH_ROOT = path.join(ROOT, "apple-tv", "hadith");
const SERIES_ROOT = path.join(HADITH_ROOT, "series");

function padHad(n) {
  return "HAD-" + String(n).padStart(4, "0");
}

function idNum(id) {
  const m = String(id || "").match(/HAD-(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function sortSeriesDirs(dirs) {
  return dirs.slice().sort(function (a, b) {
    return parseInt(a, 10) - parseInt(b, 10);
  });
}

function writeJson(file, data, pretty) {
  const text = pretty ? JSON.stringify(data, null, 2) + "\n" : JSON.stringify(data);
  fs.writeFileSync(file, text);
}

function rebuildHadith() {
  if (!fs.existsSync(SERIES_ROOT)) {
    throw new Error("missing apple-tv/hadith/series");
  }
  const dirs = sortSeriesDirs(
    fs.readdirSync(SERIES_ROOT).filter(function (name) {
      return fs.statSync(path.join(SERIES_ROOT, name)).isDirectory();
    })
  );
  const allRecords = [];
  const seriesMeta = [];
  let typeCounts = { hadith: 0, athar: 0, other: 0 };

  for (const dirName of dirs) {
    const dir = path.join(SERIES_ROOT, dirName);
    const files = fs
      .readdirSync(dir)
      .filter(function (name) {
        return /^HAD-\d+\.json$/i.test(name);
      })
      .sort();
    const ids = files.map(function (name) {
      return path.basename(name, ".json").toUpperCase();
    });
    const nums = ids.map(idNum).filter(Boolean).sort(function (a, b) {
      return a - b;
    });
    const parts = dirName.split("-");
    const rangeStart = parseInt(parts[0], 10);
    const rangeEnd = parseInt(parts[1], 10);
    const skipped = [];
    if (rangeStart && rangeEnd) {
      for (let n = rangeStart; n <= rangeEnd; n++) {
        if (ids.indexOf(padHad(n)) < 0) skipped.push(padHad(n));
      }
    }
    for (const name of files) {
      const rec = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      allRecords.push(rec);
      const t = rec.recordType || "hadith";
      if (t === "athar") typeCounts.athar += 1;
      else if (t === "hadith") typeCounts.hadith += 1;
      else typeCounts.other += 1;
    }
    const firstId = nums.length ? padHad(nums[0]) : "";
    const lastId = nums.length ? padHad(nums[nums.length - 1]) : "";
    const index = {
      series: dirName,
      count: files.length,
      firstId: firstId,
      lastId: lastId,
      files: files
    };
    writeJson(path.join(dir, "index.json"), index, false);
    seriesMeta.push({
      id: dirName,
      label: firstId && lastId ? firstId + " bis " + lastId : dirName,
      indexPath: "series/" + dirName + "/index.json",
      publishedFrom: firstId,
      publishedTo: lastId,
      publishedCount: files.length,
      skipped: skipped
    });
  }

  allRecords.sort(function (a, b) {
    return idNum(a.id) - idNum(b.id);
  });
  const latest = allRecords.length ? allRecords[allRecords.length - 1].id : "";
  const latestN = idNum(latest);
  const currentSeries = dirs.length ? dirs[dirs.length - 1] : "";

  const catalog = {
    project: "DĀR AL TAWḤĪD – Apple TV Ḥadīṯ & Āṯār",
    language: "de",
    encoding: "UTF-8",
    schemaVersion: "1.4",
    sourceOfTruth: "/apple-tv/hadith/",
    liveURL: "https://dar-al-tawhid.de/apple-tv/hadith/catalog.json",
    totalCount: allRecords.length,
    publishedCount: allRecords.length,
    hadithCount: typeCounts.hadith,
    atharCount: typeCounts.athar,
    currentSeries: currentSeries,
    latestId: latest,
    latestPublishedId: latest,
    nextId: latestN ? padHad(latestN + 1) : "HAD-0001",
    policy: {
      authenticOnly: true,
      requireVerifiedSharh: false,
      screensaverShowsSharh: true,
      screensaverSharhMode: "compact",
      hadithLibraryShowsSharh: true,
      excludeStatuses: ["missing", "needs-review"],
      hadithLibraryIncludesOpenSharh: true,
      singleSourceForWebIosAndroidAppleTv: true
    },
    series: seriesMeta
  };
  writeJson(path.join(HADITH_ROOT, "catalog.json"), catalog, true);

  const manifestPath = path.join(HADITH_ROOT, "manifest.json");
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }
  manifest.currentSeries = currentSeries;
  manifest.nextId = catalog.nextId;
  manifest.readyThrough = latest;
  manifest.releasePolicy = manifest.releasePolicy || {};
  manifest.releasePolicy.onlineBranch = "main";
  manifest.releasePolicy.publishedRange = allRecords.length
    ? allRecords[0].id + "-" + latest
    : "";
  manifest.hadithLibrary = manifest.hadithLibrary || {};
  manifest.hadithLibrary.catalogPath = "/apple-tv/hadith/catalog.json";
  manifest.hadithLibrary.sourceOfTruth = "https://dar-al-tawhid.de/apple-tv/hadith/catalog.json";
  manifest.syncPolicy = manifest.syncPolicy || {};
  manifest.syncPolicy.sourceOfTruth = "apple-tv/hadith/";
  manifest.syncPolicy.liveURL = "https://dar-al-tawhid.de/apple-tv/hadith/";
  writeJson(manifestPath, manifest, true);

  writeJson(path.join(HADITH_ROOT, "library-shell.json"), { records: allRecords }, false);

  const tadCatPath = path.join(ROOT, "apple-tv", "quran", "tadabbur", "catalog.json");
  let tadCount = 0;
  if (fs.existsSync(tadCatPath)) {
    try {
      tadCount = Number(JSON.parse(fs.readFileSync(tadCatPath, "utf8")).entriesCount || 0) || 0;
    } catch (e) {
      tadCount = 0;
    }
  }

  const stamp = {
    schemaVersion: 1,
    liveRoot: "https://dar-al-tawhid.de/apple-tv/",
    hadithCount: allRecords.length,
    hadithLatestId: latest,
    atharCount: typeCounts.athar,
    tadabburCount: tadCount,
    rebuiltAt: new Date().toISOString()
  };
  writeJson(path.join(HADITH_ROOT, "sync-status.json"), stamp, true);

  const loaderVersion = "2.0.0+" + latest + "+tad" + tadCount;
  ["assets/hadith-library-data.js", "test/assets/hadith-library-data.js"].forEach(function (rel) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, "utf8");
    const next = src.replace(/version:\s*"[^"]*"/, 'version: "' + loaderVersion + '"');
    if (next !== src) fs.writeFileSync(file, next);
  });

  console.log(
    "hadith rebuild: files=" +
      allRecords.length +
      " hadith=" +
      typeCounts.hadith +
      " athar=" +
      typeCounts.athar +
      " latest=" +
      latest +
      " tadabbur=" +
      tadCount
  );
}

rebuildHadith();
