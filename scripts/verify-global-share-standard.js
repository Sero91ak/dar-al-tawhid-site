#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const scanRoots = ["assets", "test/assets", "kids", "apple-tv"];
const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(?:js|html)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

const files = scanRoots.flatMap((name) => walk(path.join(root, name)));

for (const file of files) {
  const code = fs.readFileSync(file, "utf8");
  const r = rel(file);
  const imageShareRenderer =
    /canvas/i.test(code) &&
    /(bildbeitrag|image.?share|share.?image|App Store)/i.test(code);

  if (!imageShareRenderer) continue;

  // Kein erfundenes blaues Fragezeichen-/Pseudo-App-Store-Icon mehr.
  if (/fillText\(\s*["']Download on the["']/.test(code)) {
    failures.push(r + ": alter englischer/falscher App-Store-Badge-Renderer gefunden");
  }

  if (/fillText\(\s*["']App Store["']/.test(code) && !/fillText\(\s*["']Laden im["']/.test(code)) {
    failures.push(r + ": App-Store-Badge ohne globalen „Laden im“-Standard");
  }
}

const globalShare = path.join(root, "assets/dar-global-share-v1225.js");
if (!fs.existsSync(globalShare)) {
  failures.push("assets/dar-global-share-v1225.js fehlt");
} else {
  const code = fs.readFileSync(globalShare, "utf8");
  for (const token of ["adaptiveBodyLayout", "stripUiLabel", 'fillText("AUSSAGE"', 'fillText("QUELLE"', 'fillText("Laden im"']) {
    if (!code.includes(token)) failures.push("Global-Share: Pflichtstandard fehlt: " + token);
  }
}

const liveFeed = path.join(root, "assets/premium-feed-app.js");
const testFeed = path.join(root, "test/assets/premium-feed-app.js");
if (fs.existsSync(liveFeed) && fs.existsSync(testFeed)) {
  const live = fs.readFileSync(liveFeed, "utf8");
  const test = fs.readFileSync(testFeed, "utf8");
  if (live !== test) failures.push("Live/Test Premium-Feed-Renderer sind nicht identisch");
}

const frauen = path.join(root, "test/assets/frauen/frauen-fiqh.js");
if (fs.existsSync(frauen)) {
  const code = fs.readFileSync(frauen, "utf8");
  for (const token of ["frauenAdaptiveBodyLayout", 'fillText("AUSSAGE"', 'fillText("QUELLE"', 'fillText("Laden im"']) {
    if (!code.includes(token)) failures.push("Frauen-App Share-Standard fehlt: " + token);
  }
}

if (failures.length) {
  console.error("GLOBAL SHARE STANDARD: FEHLER");
  failures.forEach((msg) => console.error(" - " + msg));
  process.exit(1);
}

console.log("GLOBAL SHARE STANDARD: OK · adaptive Typografie, saubere Labels und App-Store-Badge geprüft.");
