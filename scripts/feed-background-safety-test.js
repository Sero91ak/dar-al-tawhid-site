#!/usr/bin/env node
/**
 * Unit-Tests für scripts/lib/feed-background-safety.cjs (Feed-Hintergrund-Sicherheit).
 * Reines Logik-Modul ohne DOM — deckt Merge/Haystack/Keyword/Flags/Validierung ab.
 *
 * Usage: node scripts/feed-background-safety-test.js
 */
const path = require("path");

const S = require(path.join(__dirname, "lib/feed-background-safety.cjs"));

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log("OK:", msg);
  else {
    console.error("FAIL:", msg);
    failed += 1;
  }
}

// --- Konstanten ---
assert(Array.isArray(S.FORBIDDEN_KEYWORDS) && S.FORBIDDEN_KEYWORDS.includes("people"), "FORBIDDEN_KEYWORDS enthält people");
assert(Array.isArray(S.WHITELIST_QUERIES) && S.WHITELIST_QUERIES.length > 20, "WHITELIST_QUERIES gefüllt");
assert(S.WHITELIST_QUERIES.every((q) => typeof q.query === "string" && typeof q.natureWeight === "number"), "WHITELIST_QUERIES Struktur");
assert(S.DEFAULT_SETTINGS.strictSafetyMode === true, "DEFAULT_SETTINGS strictSafetyMode true");
assert(S.STRICT_BOOL_FIELDS.includes("containsHumans") && S.STRICT_BOOL_FIELDS.length === 18, "STRICT_BOOL_FIELDS 18 Felder");

// --- mergeSettings ---
const mDefault = S.mergeSettings(null);
assert(mDefault.strictIslamicMode === true && mDefault.blockAnimals === true, "mergeSettings(null) nutzt Defaults");
assert(JSON.stringify(mDefault.allowedSources) === JSON.stringify(["pexels", "unsplash", "pixabay"]), "mergeSettings default Quellen");
assert(S.mergeSettings({ strictIslamicMode: false }).strictIslamicMode === false, "mergeSettings kann strictIslamicMode ausschalten");
assert(S.mergeSettings({ strictSafetyMode: true }).strictSafetyMode === true, "mergeSettings behält strictSafetyMode");
assert(JSON.stringify(S.mergeSettings({ allowedSources: ["Pexels", "wikimedia"] }).allowedSources) === JSON.stringify(["pexels"]), "mergeSettings filtert wikimedia + lowercased");
assert(JSON.stringify(S.mergeSettings({ allowedSources: [] }).allowedSources) === JSON.stringify(["pexels", "unsplash", "pixabay"]), "mergeSettings leere Quellen -> Default");

// --- buildHaystack ---
assert(S.buildHaystack({ alt: "Mountains", tags: ["Berge"], categories: ["Nature"] }) === "mountains berge nature", "buildHaystack kombiniert + lowercased");
assert(S.buildHaystack({ query: "desert" }) === "", "buildHaystack ignoriert query ohne opts");
assert(S.buildHaystack({ query: "desert" }, { includeQuery: true }) === "desert", "buildHaystack nimmt query mit includeQuery");
assert(S.buildHaystack(null) === "", "buildHaystack(null) leer");

// --- containsForbiddenKeyword ---
assert(S.containsForbiddenKeyword("beautiful people walking") === "people", "containsForbiddenKeyword findet people");
assert(S.containsForbiddenKeyword("CHURCH interior") === "church", "containsForbiddenKeyword case-insensitiv");
assert(S.containsForbiddenKeyword("calm ocean waves") === "", "containsForbiddenKeyword sauberes Motiv leer");
assert(S.containsForbiddenKeyword("") === "", "containsForbiddenKeyword leer");

// --- deriveSafetyFlags ---
const humanFlags = S.deriveSafetyFlags("portrait of a man");
assert(humanFlags.containsHumans === true && humanFlags.containsFaces === true, "deriveSafetyFlags erkennt Mensch + Gesicht");
const animalFlags = S.deriveSafetyFlags("wildlife lion in safari");
assert(animalFlags.containsAnimals === true && animalFlags.containsWildlife === true, "deriveSafetyFlags erkennt Tiere");
const cleanFlags = S.deriveSafetyFlags("calm ocean landscape");
assert(S.STRICT_BOOL_FIELDS.every((f) => cleanFlags[f] === false), "deriveSafetyFlags sauberes Motiv ohne Risiko");
assert(S.deriveSafetyFlags("blurry mountains").isBlurred === true, "deriveSafetyFlags erkennt Unschärfe");

// --- validateCandidate ---
const cleanOk = S.validateCandidate({ alt: "calm ocean landscape", tags: ["ruhe"], width: 1600, height: 2000 });
assert(cleanOk.ok === true && cleanOk.reasons.length === 0, "validateCandidate akzeptiert sauberes Motiv");

const human = S.validateCandidate({ alt: "portrait of a man", width: 1600, height: 2000 });
assert(human.ok === false && human.uncertain === true, "validateCandidate blockiert Mensch (strikt)");
assert(human.reasons.some((r) => r.startsWith("forbidden-keyword:")), "validateCandidate meldet forbidden-keyword");

const noDims = S.validateCandidate({ alt: "calm ocean landscape" });
assert(noDims.ok === false && noDims.reasons.includes("dimensions-unknown"), "validateCandidate blockiert fehlende Maße (strikt)");

const tooLow = S.validateCandidate({ alt: "calm ocean landscape", width: 800, height: 1000 });
assert(tooLow.ok === false && tooLow.reasons.includes("resolution-too-low"), "validateCandidate blockiert zu geringe Auflösung");

const nonStrict = S.validateCandidate(
  { alt: "calm ocean landscape", width: 1600, height: 2000 },
  { strictIslamicMode: false, strictSafetyMode: false }
);
assert(nonStrict.ok === true, "validateCandidate non-strict akzeptiert sauberes Motiv");

const nonStrictAnimal = S.validateCandidate(
  { alt: "wildlife lion", width: 1600, height: 2000 },
  { strictIslamicMode: false, strictSafetyMode: false }
);
assert(nonStrictAnimal.ok === false && nonStrictAnimal.uncertain === false, "validateCandidate non-strict blockiert echtes Risiko ohne uncertain");

// --- isStrictFeedBgSafe ---
function safeItem(overrides) {
  const base = {
    src: "https://cdn/x.jpg",
    status: "active",
    active: true,
    approved: true,
    securityStatus: "approved",
    isIslamicallySafe: true,
    allowedFor: "feed",
    source: "pexels",
    category: "nature"
  };
  S.STRICT_BOOL_FIELDS.forEach((f) => {
    base[f] = false;
  });
  return { ...base, ...(overrides || {}) };
}
assert(S.isStrictFeedBgSafe(safeItem()) === true, "isStrictFeedBgSafe akzeptiert sauberes Natur-Item");
assert(S.isStrictFeedBgSafe(null) === false, "isStrictFeedBgSafe(null) false");
assert(S.isStrictFeedBgSafe(safeItem({ src: "" })) === false, "isStrictFeedBgSafe ohne src false");
assert(S.isStrictFeedBgSafe(safeItem({ status: "draft" })) === false, "isStrictFeedBgSafe ohne active-Status false");
assert(S.isStrictFeedBgSafe(safeItem({ containsAnimals: true })) === false, "isStrictFeedBgSafe mit Risiko-Flag false");
assert(S.isStrictFeedBgSafe(safeItem({ source: "wikimedia" })) === false, "isStrictFeedBgSafe blockiert wikimedia");
assert(S.isStrictFeedBgSafe(safeItem({ allowedFor: "story" })) === false, "isStrictFeedBgSafe ohne feed-Freigabe false");
assert(S.isStrictFeedBgSafe(safeItem({ category: "abstract" })) === true, "isStrictFeedBgSafe erlaubt abstract");
assert(S.isStrictFeedBgSafe(safeItem({ category: "random" })) === false, "isStrictFeedBgSafe blockiert unbekannte Kategorie");

// --- sortQueriesNatureFirst ---
const input = [{ natureWeight: 2 }, { natureWeight: 10 }, { natureWeight: 5 }];
const sorted = S.sortQueriesNatureFirst(input);
assert(sorted.map((q) => q.natureWeight).join(",") === "10,5,2", "sortQueriesNatureFirst absteigend");
assert(input[0].natureWeight === 2, "sortQueriesNatureFirst mutiert Eingabe nicht");

if (failed) {
  console.error(`\n${failed} Feed-Background-Safety-Test(s) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\nAlle Feed-Background-Safety-Tests bestanden.");
