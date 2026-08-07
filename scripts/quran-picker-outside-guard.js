#!/usr/bin/env node
/**
 * QURAN_PICKER_OUTSIDE_GUARD
 * Verhindert Safari-Crash beim Tippen außerhalb des Vers-Pickers
 * und Settle↔Rebuild-Schleifen.
 *
 * Usage: node scripts/quran-picker-outside-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "QURAN_PICKER_OUTSIDE_GUARD";
const LOCK_FILE = "content/admin/quran-picker-outside-lock.json";
const FILES = ["index.html", "test/index.html"];

const REQUIRED = [
  MARKER,
  "quran-picker-outside-fix-v569",
  "__qrcPickerSession",
  "closeSafe",
  "progScroll&&Date.now()-progScroll<280",
  "function bindQuranNavPickerSheet",
  "function closeQuranReaderSheets"
];

const FORBIDDEN = [
  {
    re: /setTimeout\(\(\)=>\{progScroll=0\},80\)/,
    reason: "progScroll-Guard 80ms ist kürzer als Settle 120ms → Safari-Schleife"
  }
];

function extractBindPicker(content) {
  const start = content.indexOf("function bindQuranNavPickerSheet");
  if (start < 0) return "";
  let depth = 0;
  const brace = content.indexOf("{", start);
  for (let j = brace; j < content.length; j++) {
    if (content[j] === "{") depth += 1;
    else if (content[j] === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(start, j + 1);
    }
  }
  return "";
}

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
  if (!fs.existsSync(path.join(ROOT, LOCK_FILE))) fail(`${LOCK_FILE} fehlt`);
  const lock = JSON.parse(read(LOCK_FILE));
  if (!lock.locked) {
    ok("Lock-Datei: nicht gesperrt");
    return;
  }
  for (const file of FILES) {
    const content = read(file);
    for (const needle of REQUIRED) {
      if (!content.includes(needle)) fail(`${file}: Pflicht-Marker fehlt: ${needle}`);
    }
    for (const { re, reason } of FORBIDDEN) {
      if (re.test(content)) fail(`${file}: ${reason}`);
    }
    const bind = extractBindPicker(content);
    if (!bind.includes("closeSafe")) {
      fail(`${file}: bindQuranNavPickerSheet muss closeSafe nutzen`);
    }
    if (/if\(e\.target===backdrop\)close\(\)/.test(bind)) {
      fail(`${file}: Sofort-close() unter dem Finger auf Picker-Backdrop ist verboten`);
    }
    ok(`${file}: alle Pflicht-Marker (${REQUIRED.length})`);
  }
  ok("Qurʾān-Picker Outside-Tap geschützt");
}

run();
