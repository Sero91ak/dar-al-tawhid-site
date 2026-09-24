#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJSON(relativePath) {
  const filePath = join(root, relativePath);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function canonicalReferences(verseCounts) {
  const refs = [];
  verseCounts.forEach((count, surahIndex) => {
    const surah = surahIndex + 1;
    for (let ayah = 1; ayah <= count; ayah += 1) {
      refs.push(`${surah}:${ayah}`);
    }
  });
  return refs;
}

function orderedUnique(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      output.push(value);
    }
  }
  return output;
}

const catalog = readJSON('catalog.json');
const coverage = readJSON(catalog.coveragePath ?? 'coverage.json');
const index = readJSON(catalog.entriesIndexPath ?? 'entries-index.json');

const allRefs = canonicalReferences(coverage.verseCounts);
const allowedRefs = new Set(allRefs);

const seen = new Map();
const duplicates = [];
const invalid = [];
const countMismatches = [];
let loadedEntries = 0;

for (const file of index.files) {
  const envelope = readJSON(file.path);
  const entries = envelope.entries ?? [];
  loadedEntries += entries.length;

  if (typeof file.count === 'number' && entries.length !== file.count) {
    countMismatches.push({ path: file.path, expected: file.count, actual: entries.length });
  }

  for (const entry of entries) {
    if (!allowedRefs.has(entry.reference)) {
      invalid.push({ reference: entry.reference, path: file.path });
      continue;
    }

    if (seen.has(entry.reference)) {
      duplicates.push({ reference: entry.reference, firstPath: seen.get(entry.reference), duplicatePath: file.path });
      continue;
    }

    seen.set(entry.reference, file.path);
  }
}

const missing = allRefs.filter((reference) => !seen.has(reference));
const present = Array.from(seen.keys());
const suggestedNextBatch = missing.slice(0, 25);
const suggestedNextPlus200 = missing.slice(0, 200);

const report = {
  schemaVersion: '1.0',
  generatedBy: 'apple-tv/quran/tadabbur/tools/find-missing-references.mjs',
  totalVerses: allRefs.length,
  catalogEntriesCount: catalog.entriesCount,
  indexTotalVerifiedEntries: index.totalVerifiedEntries,
  loadedEntries,
  uniqueVerifiedReferences: present.length,
  missingCount: missing.length,
  duplicateCount: duplicates.length,
  invalidCount: invalid.length,
  countMismatchCount: countMismatches.length,
  firstMissingReference: missing[0] ?? null,
  lastMissingReference: missing.at(-1) ?? null,
  suggestedNextBatch,
  suggestedNextPlus200,
  duplicates,
  invalid,
  countMismatches,
  missing
};

const outputPath = join(root, 'missing-references.report.json');
writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');

const summaryLines = [
  `Tadabbur audit complete`,
  `totalVerses=${report.totalVerses}`,
  `catalogEntriesCount=${report.catalogEntriesCount}`,
  `indexTotalVerifiedEntries=${report.indexTotalVerifiedEntries}`,
  `loadedEntries=${report.loadedEntries}`,
  `uniqueVerifiedReferences=${report.uniqueVerifiedReferences}`,
  `missingCount=${report.missingCount}`,
  `duplicateCount=${report.duplicateCount}`,
  `invalidCount=${report.invalidCount}`,
  `countMismatchCount=${report.countMismatchCount}`,
  `firstMissingReference=${report.firstMissingReference}`,
  `lastMissingReference=${report.lastMissingReference}`,
  `report=apple-tv/quran/tadabbur/missing-references.report.json`
];

console.log(summaryLines.join('\n'));

if (duplicates.length || invalid.length || countMismatches.length) {
  process.exitCode = 1;
}
