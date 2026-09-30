#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJSON(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
}

function writeJSON(relativePath, value) {
  writeFileSync(join(root, relativePath), JSON.stringify(value, null, 2) + '\n');
}

const index = readJSON('entries-index.json');
const catalog = readJSON('catalog.json');

const seen = new Map();
const duplicateArchive = {
  schemaVersion: '1.0',
  purpose: 'Review archive for duplicate Tadabbur references removed from the registered canonical dataset.',
  canonicalPolicy: 'first-registered-reference-wins',
  sourceIndex: 'entries-index.json',
  duplicates: []
};

let loadedBefore = 0;
let canonicalCount = 0;
let duplicateCount = 0;
let changedFileCount = 0;

for (const file of index.files) {
  const envelope = readJSON(file.path);
  const originalEntries = Array.isArray(envelope.entries) ? envelope.entries : [];
  loadedBefore += originalEntries.length;

  const canonicalEntries = [];

  for (const entry of originalEntries) {
    const reference = entry?.reference;

    if (!seen.has(reference)) {
      seen.set(reference, { path: file.path });
      canonicalEntries.push(entry);
      canonicalCount += 1;
      continue;
    }

    const canonical = seen.get(reference);
    duplicateArchive.duplicates.push({
      reference,
      canonicalPath: canonical.path,
      removedFromPath: file.path,
      entry
    });
    duplicateCount += 1;
  }

  if (canonicalEntries.length !== originalEntries.length) {
    writeJSON(file.path, { ...envelope, entries: canonicalEntries });
    changedFileCount += 1;
  }

  file.count = canonicalEntries.length;
}

index.totalVerifiedEntries = canonicalCount;
catalog.entriesCount = canonicalCount;

writeJSON('entries-index.json', index);
writeJSON('catalog.json', catalog);
writeJSON('duplicate-review-archive.json', duplicateArchive);

console.log('Tadabbur dedupe repair complete');
console.log('loadedBefore=' + loadedBefore);
console.log('canonicalCount=' + canonicalCount);
console.log('duplicateCountArchived=' + duplicateCount);
console.log('changedFileCount=' + changedFileCount);
console.log('archive=apple-tv/quran/tadabbur/duplicate-review-archive.json');

if (loadedBefore - duplicateCount !== canonicalCount) {
  throw new Error('Dedupe invariant failed');
}
