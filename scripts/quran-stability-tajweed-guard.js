#!/usr/bin/env node
/**
 * QURAN_STABILITY_TAJWEED_GUARD
 * Schützt Qurʾān-Stabilität (Jump-Veil/Locks) + Tajweed-Pfad in Dar Test.
 *
 * Usage: node scripts/quran-stability-tajweed-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "QURAN_STABILITY_TAJWEED_GUARD";
const LOCK_FILE = "content/admin/quran-stability-tajweed-lock.json";
const FILE = "test/index.html";
const TAJWEED_DIR = "content/quran-tajweed";

const REQUIRED = [
  "QURAN_STABILITY_TAJWEED_V574",
  "forceResetQrcUiState",
  "armQrcJumpVeilFailsafe",
  "forceResetQrcOverlayLocks",
  "renderQuranAyahArHtml",
  "loadQuranTajweed",
  "mapQuranTajweedClass",
  "showTajweed",
  "quran-stability-tajweed-v574",
  "Noto Naskh Arabic",
  "content/quran-tajweed/"
];

const FORBIDDEN = [
  {
    re: /function showQrcJumpVeil\(\)\{[^}]*classList\.add\("is-on"\)\}(?![\s\S]{0,80}armQrcJumpVeilFailsafe)/,
    reason: "Jump-Veil ohne Failsafe führt zu Schwarz-/Weißbildschirm"
  }
];

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function run() {
  if (!fs.existsSync(path.join(ROOT, LOCK_FILE))) {
    fail(`${LOCK_FILE} fehlt`);
  }
  const lock = JSON.parse(read(LOCK_FILE));
  if (!lock.locked) {
    ok("Lock-Datei: nicht gesperrt");
    return;
  }

  const content = read(FILE);
  for (const needle of REQUIRED) {
    if (!content.includes(needle)) {
      fail(`${FILE}: Pflicht-Marker fehlt: ${needle}`);
    }
  }
  for (const { re, reason } of FORBIDDEN) {
    if (re.test(content)) {
      fail(`${FILE}: ${reason}`);
    }
  }

  const dir = path.join(ROOT, TAJWEED_DIR);
  if (!fs.existsSync(dir)) fail(`${TAJWEED_DIR} fehlt`);
  const files = fs.readdirSync(dir).filter((f) => /^\d{3}\.json$/.test(f));
  if (files.length < 114) {
    fail(`${TAJWEED_DIR}: erwartet 114 Dateien, gefunden ${files.length}`);
  }
  const sample = JSON.parse(fs.readFileSync(path.join(dir, "001.json"), "utf8"));
  if (!sample.verses || !sample.verses[0] || !String(sample.verses[0].tajweed || "").includes("tj-")) {
    fail(`${TAJWEED_DIR}/001.json: Tajweed-Markup fehlt`);
  }
  const baqarah = JSON.parse(fs.readFileSync(path.join(dir, "002.json"), "utf8"));
  const baqarahHtml = (baqarah.verses || []).map((v) => String(v.tajweed || "")).join("\n");
  if (!baqarahHtml.includes("tj-qlqalah")) {
    fail(`${TAJWEED_DIR}/002.json: Qalqalah-Buchstaben (tj-qlqalah) fehlen`);
  }
  if (!baqarahHtml.includes("tj-silent")) {
    fail(`${TAJWEED_DIR}/002.json: stumme Buchstaben (tj-silent) fehlen`);
  }
  if (/<span(?![^>]*class=)/.test(baqarahHtml)) {
    fail(`${TAJWEED_DIR}/002.json: nackte span ohne Klasse — Buchstaben-Typ verloren`);
  }

  // Veil must clear on route leave via forceReset
  if (!content.includes("forceResetQrcUiState()")) {
    fail(`${FILE}: forceResetQrcUiState muss aufgerufen werden`);
  }

  ok(`${FILE}: alle Pflicht-Marker (${REQUIRED.length})`);
  ok(`${TAJWEED_DIR}: ${files.length} Suren`);
  ok("Qurʾān-Stabilität + Tajweed geschützt");
}

run();
