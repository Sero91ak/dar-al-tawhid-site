#!/usr/bin/env node
/**
 * Korrigiert Feed-Hintergrund-Pfade (//workspace/ → /assets/) und erzeugt fehlende Seed-WebPs.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const JSON_PATHS = [
  path.join(ROOT, "content/staging/feed-backgrounds/feed-backgrounds.json"),
  path.join(ROOT, "content/feed-backgrounds/feed-backgrounds.json")
];

const PALETTE = {
  nature: { c0: "0x2a2520", c1: "0x0a0908" },
  mosque: { c0: "0x2a2820", c1: "0x0e0c08" },
  books: { c0: "0x4a4030", c1: "0x2a2218" },
  abstract: { c0: "0x181818", c1: "0x060606" },
  tawhid: { c0: "0x504030", c1: "0x201810" },
  akhirah: { c0: "0x283038", c1: "0x101820" },
  dua: { c0: "0x203550", c1: "0x081a33" },
  quran: { c0: "0x304060", c1: "0x102040" },
  default: { c0: "0x2a2520", c1: "0x0a0908" }
};

function fixUrl(url) {
  let u = String(url || "").trim();
  if (!u) return u;
  u = u.replace(/^\/\/workspace\//, "/");
  u = u.replace(/^\/workspace\//, "/");
  if (!u.startsWith("/")) u = "/" + u.replace(/^\/+/, "");
  return u;
}

function localPathFromUrl(url) {
  const u = fixUrl(url);
  if (!u.startsWith("/assets/")) return null;
  return path.join(ROOT, u.replace(/^\//, ""));
}

function genVariant(out, w, h, c0, c1) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -f lavfi -i "gradients=s=${w}x${h}:c0=${c0}:c1=${c1}:duration=1:rate=1" -frames:v 1 -q:v 4 "${out}"`,
    { stdio: "pipe" }
  );
}

function ensureImageSet(item) {
  const src = fixUrl(item.src);
  const srcMobile = fixUrl(item.srcMobile || src.replace(/\.webp$/, "-mobile.webp"));
  const thumb = fixUrl(item.thumbnail || src.replace(/\.webp$/, "-thumb.webp"));
  const cat = String(item.category || "default").toLowerCase();
  const colors = PALETTE[cat] || PALETTE.default;

  [src, srcMobile, thumb].forEach((url, idx) => {
    const local = localPathFromUrl(url);
    if (!local || fs.existsSync(local)) return;
    const dims = idx === 0 ? [1080, 1350] : idx === 1 ? [720, 960] : [400, 400];
    genVariant(local, dims[0], dims[1], colors.c0, colors.c1);
  });

  return { src, srcMobile, thumbnail: thumb };
}

for (const jsonPath of JSON_PATHS) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let fixed = 0;
  let created = 0;

  data.items = (data.items || []).map((item) => {
    if (!item) return item;
    const before = item.src;
    const urls = ensureImageSet(item);
    item.src = urls.src;
    item.srcMobile = urls.srcMobile;
    item.thumbnail = urls.thumbnail;
    if (before !== item.src) fixed += 1;
    [item.src, item.srcMobile, item.thumbnail].forEach((u) => {
      const local = localPathFromUrl(u);
      if (local && fs.existsSync(local)) created += 1;
    });
    return item;
  });

  data.updatedAt = new Date().toISOString();
  data.cacheVersion = (Number(data.cacheVersion) || 1) + 1;
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${jsonPath}: ${data.items.length} items, paths fixed, cacheVersion=${data.cacheVersion}`);
}

console.log("Feed-Hintergrund-Pfade und Bilder bereit.");
