#!/usr/bin/env node
/**
 * EDGE_TO_EDGE_THEME_LOCK
 * Format: Edge-to-Edge Erscheinungsbild
 * Blockiert Deploy/PR wenn randlose Theme-Darstellung oder Farbkontinuität
 * für Erscheinungsbilder entfernt/umgangen wird.
 *
 * Usage: node scripts/edge-to-edge-theme-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "EDGE_TO_EDGE_THEME_LOCK";
const LOCK_FILE = "content/admin/edge-to-edge-theme-lock.json";
const FILES = ["index.html", "test/index.html"];

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  return 1;
}

function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
  return 0;
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function runEdgeToEdgeThemeGuard() {
  let failed = 0;
  const lockPath = path.join(ROOT, LOCK_FILE);
  if (!fs.existsSync(lockPath)) {
    return fail(`${LOCK_FILE} fehlt`);
  }
  const lock = JSON.parse(read(LOCK_FILE));
  if (!lock.locked) {
    ok("Lock-Datei: nicht gesperrt");
    return 0;
  }
  if (String(lock.formatId || "") !== MARKER) {
    failed += fail(`formatId muss ${MARKER} sein`);
  }
  if (String(lock.formatName || "") !== "Edge-to-Edge Erscheinungsbild") {
    failed += fail('formatName muss „Edge-to-Edge Erscheinungsbild“ sein');
  }

  const cssMarkers = Array.isArray(lock.requiredCssMarkers) ? lock.requiredCssMarkers : [];
  const jsMarkers = Array.isArray(lock.requiredJsMarkers) ? lock.requiredJsMarkers : [];
  const themes = Array.isArray(lock.requiredThemes) ? lock.requiredThemes : [];
  const forbidden = Array.isArray(lock.forbiddenPatterns) ? lock.forbiddenPatterns : [];

  for (const file of FILES) {
    const content = read(file);
    for (const needle of cssMarkers) {
      if (!content.includes(needle)) failed += fail(`${file}: CSS-Marker fehlt: ${needle}`);
    }
    for (const needle of jsMarkers) {
      if (!content.includes(needle)) failed += fail(`${file}: JS-Marker fehlt: ${needle}`);
    }
    for (const theme of themes) {
      const attr = `data-theme="${theme}"`;
      if (!content.includes(attr)) failed += fail(`${file}: Theme fehlt: ${theme}`);
    }
    // Colors stay theme-native — lock must NOT force a shared palette.
    if (/app-edge-to-edge-theme-lock[\s\S]{0,900}html\[data-theme="dark"\],\s*:root\{[\s\S]*#050706/.test(content)) {
      failed += fail(`${file}: Edge-Lock darf nicht Layl-Grün auf dark/:root zwingen`);
    }
    if (!content.includes("Keine Theme-Farben überschreiben") && !content.includes("Farben bleiben theme-eigen")) {
      failed += fail(`${file}: Lock muss theme-eigene Farben bewahren (kein Farb-Override)`);
    }
    const lockMatch = content.match(/<style id="app-edge-to-edge-theme-lock-v\d+">([\s\S]*?)<\/style>/);
    if (!lockMatch) {
      failed += fail(`${file}: Lock-Style-Block fehlt`);
    } else {
      const block = lockMatch[1];
      for (const need of ["theme-hero-shell", "clip-path:none!important", "top-edge-fade", "overscroll-behavior-y:none"]) {
        if (!block.includes(need)) failed += fail(`${file}: Lock-Block fehlt „${need}“ (Top/Scroll)`);
      }
    }
    for (const item of forbidden) {
      try {
        const re = new RegExp(item.re);
        if (re.test(content)) failed += fail(`${file}: ${item.reason || item.id}`);
      } catch (e) {
        failed += fail(`${file}: ungültiges Verbotsmuster ${item.id}: ${e.message}`);
      }
    }
    if (!failed) ok(`${file}: Edge-to-Edge Erscheinungsbild geschützt`);
  }

  const adaptive = read("assets/adaptive-layout.css");
  if (/html\[data-layout\] \.app[\s\S]{0,220}padding-left:\s*max\(var\(--layout-page-gutter\)/.test(adaptive)) {
    failed += fail("assets/adaptive-layout.css: Extra-Gutter padding-left max(layout-page-gutter) ist verboten");
  } else {
    ok("adaptive-layout.css: keine Extra-Seitenränder");
  }

  if (!failed) ok("Edge-to-Edge Erscheinungsbild — Sperre aktiv");
  return failed;
}

if (require.main === module) {
  const code = runEdgeToEdgeThemeGuard();
  process.exit(code ? 1 : 0);
}

module.exports = { runEdgeToEdgeThemeGuard };
