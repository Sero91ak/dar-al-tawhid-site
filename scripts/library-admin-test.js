#!/usr/bin/env node
/**
 * Bibliothek Admin + Regal-Logik Tests
 * Usage: node scripts/library-admin-test.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let failed = 0;

function ok(msg) {
  console.log("OK:", msg);
}
function fail(msg) {
  console.error("FAIL:", msg);
  failed += 1;
}
function assert(cond, msg) {
  if (cond) ok(msg);
  else fail(msg);
}

function buildShelfIds(all) {
  const count = all.length;
  const compactCatalog = count <= 3;
  const usedInFeatured = new Set();
  const sections = [];
  const recommended = all.filter((p) => p.isRecommended);
  const newestOnly = all.filter((p) => p.isNew && !p.isRecommended);

  if (compactCatalog) {
    if (recommended.length) {
      recommended.forEach((p) => usedInFeatured.add(p.id));
      sections.push({ title: "Empfohlen", ids: recommended.map((p) => p.id) });
    } else if (newestOnly.length) {
      newestOnly.forEach((p) => usedInFeatured.add(p.id));
      sections.push({ title: "Neu erschienen", ids: newestOnly.map((p) => p.id) });
    }
  } else {
    const shelfNewest = [...all]
      .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))
      .filter((p) => p.isNew && !usedInFeatured.has(p.id))
      .slice(0, 8);
    const shelfRecommended = recommended.filter((p) => !usedInFeatured.has(p.id)).slice(0, 8);
    shelfRecommended.forEach((p) => usedInFeatured.add(p.id));
    shelfNewest.forEach((p) => usedInFeatured.add(p.id));
    if (shelfNewest.length) sections.push({ title: "Neu erschienen", ids: shelfNewest.map((p) => p.id) });
    if (shelfRecommended.length) sections.push({ title: "Empfohlen", ids: shelfRecommended.map((p) => p.id) });
  }
  return sections;
}

async function main() {
  const { suggestLibraryCategory } = await import(path.join(ROOT, "cloudflare/library-admin.js"));

  const asma = suggestLibraryCategory("Die Namen und Eigenschaften Allahs al-Asmāʾ waṣ-Ṣifāt");
  assert(asma.category === "ʿAqīdah", "Kategorie-Vorschlag: ʿAqīdah für Asmāʾ");
  assert(asma.topic === "al-Asmāʾ waṣ-Ṣifāt", "Themenbereich: al-Asmāʾ waṣ-Ṣifāt");

  const tawhid = suggestLibraryCategory("Grundlagen des Tawḥīd");
  assert(tawhid.category === "Tawḥīd", "Kategorie-Vorschlag: Tawḥīd");

  const unknown = suggestLibraryCategory("xyz unbekannt");
  assert(unknown.confidence === "none", "Unbekanntes Thema: confidence none");

  const oneBook = [{ id: "a", isNew: true, isRecommended: true, publishedAt: "2026-01-01" }];
  const shelves = buildShelfIds(oneBook);
  assert(shelves.length === 1, "1 Buch: nur ein Regal");
  assert(shelves[0].title === "Empfohlen", "1 Buch empfohlen: Empfohlen-Regal");
  assert(shelves[0].ids.length === 1, "1 Buch: eine Karte im Regal");

  const onlyNew = [{ id: "b", isNew: true, isRecommended: false, publishedAt: "2026-01-01" }];
  const shelvesNew = buildShelfIds(onlyNew);
  assert(shelvesNew[0].title === "Neu erschienen", "Nur neu: Neu-Regal");

  const css = fs.readFileSync(path.join(ROOT, "test/assets/library/library-app.css"), "utf8");
  assert(!/#5a1e26|#172235|#d8bd7a/i.test(css), "Bibliothek-CSS: keine festen Bordeaux/Nachtblau-Farben");
  assert(css.includes("var(--bg)") || css.includes("var(--card)"), "Bibliothek-CSS: Theme-Variablen");

  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "test/data/library-publications.json"), "utf8"));
  const pub = catalog.publications[0];
  assert(pub && pub.coverUrls && pub.coverUrls.medium, "Katalog: coverUrls vorhanden");

  const liveIndex = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert(!liveIndex.includes('data-nav="bibliothek"') && !liveIndex.includes("#bibliothek"), "Live index.html: keine Bibliotheks-Route");

  const testVersion = JSON.parse(fs.readFileSync(path.join(ROOT, "test/version.json"), "utf8"));
  const testIndex = fs.readFileSync(path.join(ROOT, "test/index.html"), "utf8");
  assert(testIndex.includes(testVersion.buildId), "Test-App: Build-ID synchron");

  if (failed) {
    console.error(`\n${failed} Test(s) fehlgeschlagen`);
    process.exit(1);
  }
  console.log("\nAlle Bibliothek-Tests bestanden.");
}

main().catch((e) => {
  console.error("FAIL:", e.message || e);
  process.exit(1);
});
