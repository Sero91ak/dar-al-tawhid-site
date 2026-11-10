#!/usr/bin/env node
/* Native iOS copy regression: every operating-surface text must exist in all
   nine adult app languages (de, ar, en, tr, ku, ckb, bs, fr, es).
   Religious content is source-bound and is never localized here. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../../..");
const SOURCE = path.join(ROOT, "ios/DarAlTawhid/Shared/DarNativeCopy.swift");
const EXPECTED = ["de", "ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
const RTL = ["ar", "ckb"];

const swift = fs.readFileSync(SOURCE, "utf8");

/* ---- registered languages ------------------------------------------------ */
const supportedBlock = swift.match(/static let supportedLocales: \[String\] = \[([^\]]*)\]/);
assert.ok(supportedBlock, "supportedLocales fehlt in DarNativeCopy.swift");
const supported = supportedBlock[1]
  .split(",")
  .map((entry) => entry.trim().replace(/^"|"$/g, ""))
  .filter(Boolean);
assert.deepEqual(supported, EXPECTED, "Alle neun Erwachsenensprachen müssen registriert sein");

const rtlBlock = swift.match(/static let rightToLeftLocales: Set<String> = \[([^\]]*)\]/);
assert.ok(rtlBlock, "rightToLeftLocales fehlt");
const rtl = rtlBlock[1]
  .split(",")
  .map((entry) => entry.trim().replace(/^"|"$/g, ""))
  .filter(Boolean);
assert.deepEqual(rtl, RTL, "Arabisch und Sorani müssen RTL sein");

assert.match(swift, /static let fallbackLocale = "de"/, "Der Rückfall muss die deutsche Originalfassung sein");

/* ---- key catalogue ------------------------------------------------------- */
const keyEnumBlock = swift.match(/enum Key: String, CaseIterable \{([\s\S]*?)\n    \}/);
assert.ok(keyEnumBlock, "Key-Enum fehlt");
const keys = Array.from(keyEnumBlock[1].matchAll(/case (\w+)/g)).map((m) => m[1]);
assert.ok(keys.length >= 10, `Zu wenige Texte katalogisiert (${keys.length})`);

/* ---- dictionaries -------------------------------------------------------- */
const dictStart = swift.indexOf("private static let dictionaries");
assert.ok(dictStart > 0, "Dictionary-Block fehlt");
const dictBlock = swift.slice(dictStart);

const perLocale = Object.create(null);
const localeRe = /"([a-z]{2,3})": \[\n([\s\S]*?)\n        \]/g;
let match;
while ((match = localeRe.exec(dictBlock)) !== null) {
  const code = match[1];
  const entries = Array.from(match[2].matchAll(/\.(\w+):\s*"((?:[^"\\]|\\.)*)"/g));
  perLocale[code] = entries.map((entry) => ({ key: entry[1], value: entry[2] }));
}

for (const code of EXPECTED) {
  assert.ok(perLocale[code], `Sprache "${code}" fehlt im Katalog`);
  const present = perLocale[code].map((entry) => entry.key);
  const missing = keys.filter((key) => !present.includes(key));
  assert.equal(missing.length, 0, `Sprache "${code}" ist unvollständig: ${missing.join(", ")}`);
  const extra = present.filter((key) => !keys.includes(key));
  assert.equal(extra.length, 0, `Sprache "${code}" hat unbekannte Schlüssel: ${extra.join(", ")}`);
  const blank = perLocale[code].filter((entry) => !entry.value.trim());
  assert.equal(blank.length, 0, `Sprache "${code}" hat leere Texte: ${blank.map((e) => e.key).join(", ")}`);
  assert.equal(
    perLocale[code].length,
    keys.length,
    `Sprache "${code}" hat ${perLocale[code].length} statt ${keys.length} Texte`
  );
}

/* ---- no decorative unicode leaking into native labels -------------------- */
const decorative = /[\u{1D400}-\u{1D7FF}]/u;
for (const code of EXPECTED) {
  for (const entry of perLocale[code]) {
    assert.ok(
      !decorative.test(entry.value),
      `Sprache "${code}" / ${entry.key}: dekorative Mathe-Unicode-Schrift ist in nativen UI-Texten verboten`
    );
  }
}

/* ---- completeness helper must exist for runtime fallback ----------------- */
assert.match(swift, /static var isComplete: Bool/, "isComplete fehlt");
assert.match(swift, /DarWidgetStore\.defaults/, "Sprache muss über die App-Group auflösbar sein");

const locales = Object.keys(perLocale).sort();
console.log(
  `OK: ${keys.length} native UI-Texte vollständig in ${locales.length} Sprachen (${locales.join(", ")}), RTL: ${RTL.join(", ")}`
);
