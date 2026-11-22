#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.join(__dirname, "..");
const ORDER = ["de", "ar", "en", "tr", "ku", "ckb", "bs", "fr", "es"];
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content/quran-translations/catalog.json"), "utf8"));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "content/quran/surahs.json"), "utf8"));
const js = fs.readFileSync(path.join(ROOT, "test/assets/quran-translation-locales-v1.js"), "utf8");
const html = fs.readFileSync(path.join(ROOT, "test/index.html"), "utf8");
const ids = catalog.locales.map((item) => item.id);
assert.deepStrictEqual(ids, ORDER, "neun Sprachen in der App-Reihenfolge");
assert.strictEqual(new Set(ids).size, 9);

const stored = catalog.locales.filter((item) => item.storage.startsWith("content/quran-translations/"));
assert.deepStrictEqual(stored.map((item) => item.id), ["en", "tr", "ku", "ckb", "bs", "fr", "es"]);

let verses = 0;
for (const item of stored) {
  for (let surah = 1; surah <= 114; surah++) {
    const file = path.join(ROOT, item.storage, String(surah).padStart(3, "0") + ".json");
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    const expected = Number(meta.surahs[surah - 1].total_verses);
    assert.strictEqual(doc.locale, item.id);
    assert.strictEqual(doc.edition, item.edition);
    assert.strictEqual(doc.ayahs.length, expected, item.id + " Sure " + surah);
    doc.ayahs.forEach((text, index) => {
      assert.strictEqual(typeof text, "string");
      assert.ok(text.trim(), item.id + " " + surah + ":" + (index + 1));
    });
    verses += doc.ayahs.length;
  }
}
assert.strictEqual(verses, 6236 * stored.length);

function ayah(locale, surah, number) {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, "content/quran-translations", locale, String(surah).padStart(3, "0") + ".json"), "utf8"));
  return doc.ayahs[number - 1];
}
assert.ok(ayah("en", 20, 5).includes("Throne"));
assert.ok(!/hükmetmektedir/i.test(ayah("tr", 20, 5)));
assert.ok(/istiva/i.test(ayah("tr", 20, 5)));
assert.ok(/Trône|Istaw/i.test(ayah("fr", 20, 5)));
assert.ok(ayah("es", 20, 5).includes("Trono"));
assert.ok(!/\[\d+\]/.test(ayah("es", 1, 1)));
assert.ok(ayah("bs", 20, 5).includes("Arš"));
assert.ok(!ayah("bs", 20, 5).includes("svemirom"));
assert.ok(ayah("ku", 20, 5).includes("عەرش"));
assert.ok(ayah("ckb", 20, 5).includes("عەرش"));
assert.ok(ayah("en", 2, 1).includes("Alif"));
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(ROOT, "content/quran/001.json"), "utf8")).verses.length, 7);

for (const code of ORDER) {
  assert.ok(js.includes(code + ":{"), "UI fehlt " + code);
}
assert.ok(js.includes('registry.register("quran-meaning-lang",UI)'));
assert.ok(html.includes("quran-translation-locales-v1.js"));
assert.ok(html.includes("quranAyahMeaningHtml"));
assert.ok(html.includes("data-quran-lang"));
assert.ok(!fs.readFileSync(path.join(ROOT, "index.html"), "utf8").includes("quran-translation-locales-v1.js"), "Besucher-index bleibt bis zur Live-Freigabe ohne die neue Leiste");
console.log("check-quran-translation-locales OK", verses, "Bedeutungsverse");
