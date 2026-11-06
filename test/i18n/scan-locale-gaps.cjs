#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "../..");
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "adult-ui-locales-seven.json"), "utf8"));
const keys = new Set(Object.keys(catalog.translations.en));

const GERMAN = /[äßÄ]|(?:^|[\s„"'(])(?:Bitte|Keine|Öffnen|Laden|Suche|Beitrag|Einstellungen|Zurück|Weiter|Fehler|wird|nicht|für|anzeigen|speichern|löschen|verfügbar|Gebet|heute|noch|alle)(?:[\s,.!:)]|$)/i;
const translatedValues = new Set();
for (const dict of Object.values(catalog.translations)) {
  for (const value of Object.values(dict)) translatedValues.add(String(value).replace(/\s+/g, " ").trim());
}
const SKIP_FILE = /(?:^|\/)(?:kids|node_modules|apple-tv)\//;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(root, full);
    if (SKIP_FILE.test(rel + "/")) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(js|html|css)$/.test(name)) out.push(full);
  }
  return out;
}

function literals(source) {
  const found = [];
  const re = /(?:`([^`\\]|\\.)*`|"([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g;
  let match;
  while ((match = re.exec(source))) {
    let raw = match[0].slice(1, -1);
    if (match[0].startsWith("`") && /\$\{/.test(raw)) continue;
    raw = raw.replace(/\\n/g, " ").replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\s+/g, " ").trim();
    if (raw.length < 4 || raw.length > 180) continue;
    if (/[<>{}]|https?:|function |=>|var |const |#[0-9a-f]{3,8}/i.test(raw)) continue;
    if (/[\u0600-\u06FF]/.test(raw) && !/[äöüÄÖÜß]/.test(raw)) continue;
    if (!GERMAN.test(raw) || translatedValues.has(raw)) continue;
    if (!/[A-Za-zÄÖÜäöüß]{3}/.test(raw)) continue;
    found.push(raw);
  }
  return found;
}

const files = [
  ...walk(path.join(root, "test/assets")),
  path.join(root, "test/index.html")
];
const missing = new Map();
let scannedLiterals = 0;
let catalogHits = 0;
for (const file of files) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\n/);
  lines.forEach((line, index) => {
    for (const value of literals(line)) {
      scannedLiterals++;
      if (keys.has(value)) {
        catalogHits++;
        continue;
      }
      const row = missing.get(value) || { text: value, count: 0, places: [] };
      row.count++;
      if (row.places.length < 3) row.places.push(rel + ":" + (index + 1));
      missing.set(value, row);
    }
  });
}
const gaps = [...missing.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "de"));
const reportPath = path.join(__dirname, "locale-ui-gaps.json");
const payload = {
  schemaVersion: 1,
  scope: "dar-test-adult-ui-literals",
  catalogKeys: keys.size,
  filesScanned: files.length,
  germanLookingLiterals: scannedLiterals,
  alreadyInCatalog: catalogHits,
  missingDistinct: gaps.length,
  note: "Fehlende Literale sind Inventur, kein 100-%-Nachweis und keine Freigabe. Religiöse Originaltexte können in dieser Liste stehen und dürfen nicht maschinell ersetzt werden.",
  topGaps: gaps.slice(0, 120)
};
fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2) + "\n");
console.log(JSON.stringify({
  files: files.length,
  literals: scannedLiterals,
  inCatalog: catalogHits,
  missing: gaps.length,
  sample: gaps.slice(0, 25).map(row => row.count + " " + row.text)
}, null, 2));
