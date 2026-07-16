#!/usr/bin/env node
/** Setzt Luminanz-Metadaten für alle Feed-Hintergrundbilder in JSON. */
const fs = require("fs");
const path = require("path");
const { analyzeImageFile, metaFromDominantColor } = require("./lib/feed-bg-image-analysis.cjs");

const ROOT = path.join(__dirname, "..");
const JSON_PATHS = [
  path.join(ROOT, "content/staging/feed-backgrounds/feed-backgrounds.json"),
  path.join(ROOT, "content/feed-backgrounds/feed-backgrounds.json")
];

function fileFromSrc(src) {
  const s = String(src || "").replace(/^\//, "");
  return path.join(ROOT, s);
}

function applyMeta(item) {
  const full = fileFromSrc(item.src);
  let meta = analyzeImageFile(full);
  if (!meta && item.dominantColor) meta = metaFromDominantColor(item.dominantColor);
  if (!meta) return false;
  Object.assign(item, meta);
  if (!item.dominantColor && meta.averageLuminance != null) {
    const v = Math.round(meta.averageLuminance * 255);
    item.dominantColor = "#" + [v, v, v].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  return true;
}

for (const jsonPath of JSON_PATHS) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let n = 0;
  (data.items || []).forEach((it) => {
    if (applyMeta(it)) n += 1;
  });
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
  console.log("Wrote", jsonPath, "analyzed", n);
}
