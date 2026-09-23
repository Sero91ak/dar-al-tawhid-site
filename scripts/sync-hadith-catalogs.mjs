#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HADITH_ROOT = path.join(ROOT, "apple-tv", "hadith");
const SERIES_ROOT = path.join(HADITH_ROOT, "series");
const CATALOG_PATH = path.join(HADITH_ROOT, "catalog.json");
const MANIFEST_PATH = path.join(HADITH_ROOT, "manifest.json");
const MANAGED_FROM = 2151;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}
function idNumber(id) {
  const m = String(id || "").match(/^HAD-(\d{4})$/);
  return m ? Number(m[1]) : 0;
}
function seriesBounds(name) {
  const m = String(name).match(/^(\d+)-(\d+)$/);
  return m ? { start: Number(m[1]), end: Number(m[2]) } : null;
}
function ready(record) {
  return !!(
    record &&
    record.sharhStatus === "verified" &&
    record.sharhText &&
    record.sharhReference &&
    record.verificationNote &&
    record.sourceBook &&
    (record.sourceHadithNumber || record.sourceSection)
  );
}

const dirs = fs.readdirSync(SERIES_ROOT)
  .map((name) => ({ name, bounds: seriesBounds(name) }))
  .filter((x) => x.bounds && x.bounds.end >= MANAGED_FROM)
  .sort((a, b) => a.bounds.start - b.bounds.start);

const generated = [];
for (const item of dirs) {
  const dir = path.join(SERIES_ROOT, item.name);
  const files = fs.readdirSync(dir)
    .filter((name) => /^HAD-\d{4}\.json$/.test(name))
    .sort((a, b) => idNumber(a.slice(0, -5)) - idNumber(b.slice(0, -5)));

  const verifiedFiles = [];
  let hadithCount = 0;
  let atharCount = 0;
  for (const file of files) {
    const record = readJson(path.join(dir, file));
    if (!ready(record)) continue;
    verifiedFiles.push(file);
    if (record.recordType === "athar") atharCount += 1;
    else hadithCount += 1;
  }
  if (!verifiedFiles.length) continue;

  const firstId = verifiedFiles[0].replace(/\.json$/, "");
  const lastId = verifiedFiles[verifiedFiles.length - 1].replace(/\.json$/, "");
  const isComplete = idNumber(lastId) >= item.bounds.end;
  const index = {
    series: item.name,
    status: isComplete ? "complete" : "incremental-active",
    count: verifiedFiles.length,
    firstId,
    lastId,
    ...(isComplete ? {} : { plannedLastId: `HAD-${item.bounds.end}` }),
    contentTypes: { hadith: hadithCount, athar: atharCount },
    screensaver: {
      included: true,
      rotation: "shuffleBag",
      showEveryItemBeforeRepeat: true,
      requireVerifiedSharh: true
    },
    completionRule: {
      sharhRequiredForCompletion: true,
      allIndexedRecordsSharhStatus: "verified"
    },
    files: verifiedFiles
  };
  writeJson(path.join(dir, "index.json"), index);
  generated.push({ item, index });
}

if (!generated.length) {
  throw new Error("No verified managed Ḥadīṯ series found.");
}

const latest = generated[generated.length - 1].index;
const latestNum = idNumber(latest.lastId);

const catalog = readJson(CATALOG_PATH);
catalog.totalCount = 2150 + generated.reduce((sum, x) => sum + x.index.count, 0);
catalog.currentSeries = generated[generated.length - 1].item.name;
catalog.latestId = latest.lastId;
catalog.nextId = `HAD-${String(latestNum + 1).padStart(4, "0")}`;

const keep = (Array.isArray(catalog.series) ? catalog.series : [])
  .filter((s) => {
    const b = seriesBounds(s.id);
    return !b || b.end < MANAGED_FROM;
  });

catalog.series = keep.concat(generated.map(({ item, index }) => ({
  id: item.name,
  ...(index.status !== "complete" ? { status: index.status, activation: "per-record-immediate" } : {}),
  count: index.count,
  firstId: index.firstId,
  lastId: index.lastId,
  ...(index.plannedLastId ? { plannedLastId: index.plannedLastId } : {}),
  indexPath: `series/${item.name}/index.json`,
  contentTypes: index.contentTypes,
  screensaverIncluded: true,
  showSharh: true,
  showSharhSource: true,
  requireVerifiedSharh: true,
  readyThrough: index.lastId
})));
writeJson(CATALOG_PATH, catalog);

const manifest = readJson(MANIFEST_PATH);
manifest.currentSeries = catalog.currentSeries;
manifest.nextId = catalog.nextId;
if (manifest.screensaver) manifest.screensaver.readyThrough = catalog.latestId;
if (manifest.hadithLibrary) manifest.hadithLibrary.readyThrough = catalog.latestId;
writeJson(MANIFEST_PATH, manifest);

console.log(`HAD_SYNC_OK latest=${catalog.latestId} total=${catalog.totalCount} series=${generated.length}`);
