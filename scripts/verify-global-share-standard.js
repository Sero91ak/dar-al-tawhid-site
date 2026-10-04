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

  if (/fillText\(\s*["']App Store["']/.test(code)) {
    failures.push(r + ": selbst gezeichneter App-Store-Badge gefunden; nur offizielles Apple-Badge erlaubt");
  }

  if (/App Store/i.test(code) && !/app-store-badge-de-official\.svg/.test(code) && !/SHARE_IMAGE_API|generateFreshBackground|feedShareFreshImage/.test(code)) {
    failures.push(r + ": Bild-Share verweist auf App Store, aber nicht auf das offizielle globale Badge");
  }

  if (/fillText\(\s*["']AUSSAGE["']/.test(code) && !/(?:adaptiveBodyLayout|AdaptiveBodyLayout)/.test(code)) {
    failures.push(r + ": Aussage-Renderer ohne adaptive Schriftgrößen-/Seitenlogik");
  }

}

const globalShare = path.join(root, "assets/dar-global-share-v1225.js");
if (!fs.existsSync(globalShare)) {
  failures.push("assets/dar-global-share-v1225.js fehlt");
} else {
  const code = fs.readFileSync(globalShare, "utf8");
  for (const token of ["adaptiveBodyLayout", "stripUiLabel", 'fillText("AUSSAGE"', 'fillText("QUELLE"', "generateFreshBackground", "/api/share-image/background"]) {
    if (!code.includes(token)) failures.push("Global-Share: Pflichtstandard fehlt: " + token);
  }
  for (const token of ["SHARE_SCENE_MANIFEST", "GENERIC_SCENES", "SAHABA_SCENES", "sceneFor(", "Folgt für mehr Wissen aus Qurʾān & Sunnah"]) {
    if (code.includes(token)) failures.push("Global-Share: alte Bild-/Promo-Logik darf nicht aktiv sein: " + token);
  }
}

const liveFeed = path.join(root, "assets/premium-feed-app.js");
const testFeed = path.join(root, "test/assets/premium-feed-app.js");
if (fs.existsSync(liveFeed) && fs.existsSync(testFeed)) {
  const live = fs.readFileSync(liveFeed, "utf8");
  const test = fs.readFileSync(testFeed, "utf8");
  if (live !== test) failures.push("Live/Test Premium-Feed-Renderer sind nicht identisch");
  for (const [name, code] of [["Live", live], ["Test", test]]) {
    if (!/SHARE_IMAGE_API/.test(code) || !/feedShareFreshImage\(/.test(code)) failures.push(name + "-Feed: frische KI-Bildgenerierung fehlt");
    if (/await\s+feedShareBrandFooter\(/.test(code)) failures.push(name + "-Feed: alter Promo-Footer ist noch aktiv");
    if (!/\.sf-scene-brand,.sf-scene-badge/.test(code)) failures.push(name + "-Feed: Social-Strip wird beim Export nicht entfernt");
  }
}

const frauen = path.join(root, "test/assets/frauen/frauen-fiqh.js");
if (fs.existsSync(frauen)) {
  const code = fs.readFileSync(frauen, "utf8");
  for (const token of ["frauenAdaptiveBodyLayout", 'fillText("AUSSAGE"', 'fillText("QUELLE"', "app-store-badge-de-official.svg"]) {
    if (!code.includes(token)) failures.push("Frauen-App Share-Standard fehlt: " + token);
  }
}

if (failures.length) {
  console.error("GLOBAL SHARE STANDARD: FEHLER");
  failures.forEach((msg) => console.error(" - " + msg));
  process.exit(1);
}

console.log("GLOBAL SHARE STANDARD: OK · frische KI-Bilder, adaptive Typografie und exportbereinigte Share-Karten geprüft.");
