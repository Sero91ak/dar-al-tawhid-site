#!/usr/bin/env node
/**
 * Sync getestete test/index.html → index.html (Live-Besucher-App).
 * Produktions-Branding im Head, sonst identisch zur Test-App.
 */
const fs = require("fs");
const path = require("path");

if (String(process.env.CODEX_LIVE_APPROVED || "").trim() !== "1") {
  throw new Error(
    "sync-live-from-test blockiert: Live-Sync braucht ausdruecklich CODEX_LIVE_APPROVED=1."
  );
}

const ROOT = path.join(__dirname, "..");
const liveOld = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
let out = fs.readFileSync(path.join(ROOT, "test/index.html"), "utf8");

const replacements = [
  ["<title>Dar Test</title>", "<title>DAR AL TAWḤID</title>"],
  ['href="/favicon.ico?v=dar-test-v3"', 'href="/favicon.ico?v=source-under-statement-v12"'],
  ['href="/favicon-16.png?v=dar-test-v3"', 'href="/favicon-16.png?v=source-under-statement-v12"'],
  ['href="/favicon-32.png?v=dar-test-v3"', 'href="/favicon-32.png?v=source-under-statement-v12"'],
  ['href="/favicon-48.png?v=dar-test-v3"', 'href="/favicon-48.png?v=source-under-statement-v12"'],
  ['href="/test-apple-touch-icon.png?v=dar-test-v3"', 'href="/apple-touch-icon.png?v=source-under-statement-v12"'],
  ['href="/test/manifest.json?v=dar-test-v3"', 'href="/manifest.json?v=source-under-statement-v12"'],
  ['content="Dar Test"', 'content="DAR AL TAWḤID"'],
  [
    'content="Dar Test — private DAR AL TAWḤID Vorschau vor Live-Veröffentlichung."',
    'content="DAR AL TAWḤID - geordnete Wissens-App mit Beitraegen aus Qurʾan, Sunnah, Athar, Duʿaʾ, Qurʾan-Bereich und Gebetszeiten."'
  ],
  ['content="Private Vorschau der DAR AL TAWḤID App — nicht für Besucher live."', 'content="Geordnete Wissens-App mit Beitraegen aus Qurʾan, Sunnah und Athar."'],
  ['content="/test-app-icon-512.png?v=dar-test-v3"', 'content="/app-icon-512.png?v=source-under-statement-v12"'],
  ['content="https://dar-al-tawhid.de/test/"', 'content="https://dar-al-tawhid.de/"'],
  ['content="Private Vorschau der DAR AL TAWḤID App."', 'content="Geordnete Wissens-App mit Beitraegen aus Qurʾan, Sunnah und Athar."'],
  ['content="/test-app-icon-192.png?v=dar-test-v3"', 'content="/app-icon-192.png?v=source-under-statement-v12"'],
  ['content="#061826"', 'content="#080806"']
];

for (const [from, to] of replacements) {
  out = out.split(from).join(to);
}

// loadCurrentUpdates: GitHub-Fallback aus altem Live-Stand (volle Funktion bis activeCurrentUpdates)
const loadLive = liveOld.match(
  /async function loadCurrentUpdates\(\)\{[\s\S]*?\}(?=function activeCurrentUpdates)/
);
const loadTest = out.match(
  /async function loadCurrentUpdates\(\)\{[\s\S]*?\}(?=function activeCurrentUpdates)/
);
if (loadLive && loadTest) {
  const liveFn = loadLive[0].replace(/\}catch\(e\)\{console\.warn\("Aktuell-Hinweise:",e\);return currentUpdates\}$/, "}");
  out = out.replace(loadTest[0], liveFn.includes("raw.githubusercontent.com") ? liveFn : loadLive[0]);
}

fs.writeFileSync(path.join(ROOT, "index.html"), out);
console.log("OK: test/index.html → index.html (Live-Branding)");
