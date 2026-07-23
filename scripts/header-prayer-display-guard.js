#!/usr/bin/env node
/**
 * HEADER_PRAYER_DISPLAY_GUARD
 * Blockiert Deploy/PR wenn die Header-Gebetszeit-Darstellung (Maghrib/Zeit)
 * wieder auf Einzeilen-Ellipsis oder Sekunden-Re-Render umgebaut wird.
 *
 * Usage: node scripts/header-prayer-display-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "HEADER_PRAYER_DISPLAY_GUARD";
const LOCK_FILE = "content/admin/header-prayer-display-lock.json";
const FILES = ["index.html", "test/index.html"];

const REQUIRED = [
  MARKER,
  "header-prayer-display-guard-v1",
  "function headerPrayerLineHtml",
  "headerPrayerDisplayKey",
  "class=\"header-prayer-line\"",
  "header-prayer-hour",
  "flex-shrink:0!important",
  "min-width:max-content!important"
];

const FORBIDDEN = [
  {
    re: /updatePrayerCountdowns\(\)\{[^}]*updateHeaderPrayerStatus\(\);if\(!quick/,
    reason: "Countdown darf Header nicht jede Sekunde neu rendern (verursacht Verschieben/Abschneiden)"
  },
  {
    re: /innerHTML=`<div class="header-prayer-item"><b>Nächstes<\/b><span>\$\{esc\(next\.name\)\} ·/,
    reason: "Einzeilen-Format „Gebet · Uhrzeit“ im Header ist verboten"
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

function runHeaderPrayerDisplayGuard() {
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
    ok(`${file}: alle Pflicht-Marker (${REQUIRED.length})`);
  }

  ok("Header-Gebetszeit-Darstellung geschützt");
}

runHeaderPrayerDisplayGuard();
