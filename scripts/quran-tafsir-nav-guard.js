#!/usr/bin/env node
/**
 * QURAN_TAFSIR_NAV_GUARD
 * Schützt Tafsīr/Erklärung-Navigation: Open ohne Vorab-Lock (Schwarzfeld),
 * Close ohne Hänger, Prev/Next ohne Doppelklick-Chaos.
 *
 * Usage: node scripts/quran-tafsir-nav-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "QURAN_TAFSIR_NAV_GUARD";
const LOCK_FILE = "content/admin/quran-tafsir-nav-lock.json";
const FILES = ["index.html", "test/index.html"];

const REQUIRED = [
  MARKER,
  "quran-tafsir-nav-smooth-v568",
  "quranExplanationOpenGen",
  "quranExplanationHistoryPushed",
  "function stepQuranExplanationAyah",
  "data-quran-explain-mount",
  'lockAppOverlayScroll("quran-panel-open")'
];

const FORBIDDEN = [
  {
    re: /lockAppOverlayScroll\("quran-panel-open"\);await Promise\.all/,
    reason: "Scroll-Lock vor dem Await verursacht Schwarzfeld/Hänger beim Öffnen"
  },
  {
    re: /quranExplanationState=\{surah:sid,ayah:aid,tab:[^}]+\},scrollY:[^}]+\};lockAppOverlayScroll\("quran-panel-open"\);await/,
    reason: "State+Lock vor Daten-Load ist verboten (Schwarzfeld)"
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

  for (const file of FILES) {
    const content = read(file);
    for (const needle of REQUIRED) {
      if (!content.includes(needle)) {
        fail(`${file}: Pflicht-Marker fehlt: ${needle}`);
      }
    }
    for (const { re, reason } of FORBIDDEN) {
      if (re.test(content)) {
        fail(`${file}: ${reason}`);
      }
    }
    // Lock must happen after mount append
    const mountIdx = content.indexOf('document.body.appendChild(mount)');
    const lockIdx = content.indexOf('lockAppOverlayScroll("quran-panel-open")', mountIdx);
    if (mountIdx < 0 || lockIdx < 0 || lockIdx < mountIdx) {
      fail(`${file}: lockAppOverlayScroll muss nach appendChild(mount) kommen`);
    }
    ok(`${file}: alle Pflicht-Marker (${REQUIRED.length})`);
  }

  ok("Tafsīr/Erklärung-Navigation geschützt");
}

run();
