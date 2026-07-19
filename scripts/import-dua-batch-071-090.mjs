#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('content/duas');
const duas = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'dua-batch-071-090-source.json'), 'utf8')
);

function yamlQuote(value) {
  return JSON.stringify(String(value ?? ''));
}

function createMarkdown(dua) {
  const speakerLine = dua.speaker ? `\nspeaker: ${yamlQuote(dua.speaker)}` : '';
  return `---
id: ${yamlQuote(dua.id)}
type: ${yamlQuote(dua.type)}
cat: ${yamlQuote(dua.category)}
title: ${yamlQuote(dua.title)}
occasion: ${yamlQuote(dua.occasion)}
src: ${yamlQuote(dua.source)}${speakerLine}
logo: "logo-black.png"
---
## Arabisch
${dua.arabic}
## Lautschrift
${dua.transliteration}
## Deutsch
${dua.german}
## Quelle
${dua.source}
`;
}

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'duas.json'), 'utf8'));
const existingIds = new Set(index.map((d) => d.id));

for (const dua of duas) {
  const file = `${dua.id}.md`;
  fs.writeFileSync(path.join(ROOT, file), createMarkdown(dua), 'utf8');
  const entry = {
    id: dua.id,
    type: dua.type,
    cat: dua.category,
    title: dua.title,
    occasion: dua.occasion,
    ar: dua.arabic,
    tr: dua.transliteration,
    de: dua.german,
    src: dua.source,
    file,
  };
  if (existingIds.has(dua.id)) {
    const i = index.findIndex((d) => d.id === dua.id);
    index[i] = entry;
  } else {
    index.push(entry);
    existingIds.add(dua.id);
  }
  console.log('imported', dua.id);
}

index.sort((a, b) => a.id.localeCompare(b.id, 'de'));
fs.writeFileSync(path.join(ROOT, 'duas.json'), JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log('done', duas.length, 'duas; total', index.length);
