#!/usr/bin/env node
/**
 * Professionelle 4K-Feed-Hintergründe — rein generiert, ohne Menschen/Tiere/Fotos.
 * Ersetzt fehlerhafte Wikimedia-Downloads durch edle Studio-Gradienten.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets/feed-backgrounds/auto");
const JSON_PATHS = [
  path.join(ROOT, "content/staging/feed-backgrounds/feed-backgrounds.json"),
  path.join(ROOT, "content/feed-backgrounds/feed-backgrounds.json")
];
const TARGET = 80;
const NOW = new Date().toISOString();
const FULL = { w: 2160, h: 2700 };
const MOBILE = { w: 1440, h: 1920 };
const THUMB = { w: 512, h: 512 };

const SPECS = [
  { cat: "nature", base: "0x0a0908", grad: "0x2a2520", accent: "0x8a7040", tags: ["berge", "ruhe", "tawhid"], overlay: "dark", label: "Bergnacht" },
  { cat: "nature", base: "0x040810", grad: "0x102840", accent: "0x406080", tags: ["himmel", "quran", "wolken"], overlay: "royal", label: "Königsblau" },
  { cat: "nature", base: "0x2b1e16", grad: "0x5c4a32", accent: "0xc9a86a", tags: ["wüste", "sand", "aqidah"], overlay: "warm-dark", label: "Wüstengold" },
  { cat: "nature", base: "0x081820", grad: "0x1a3040", accent: "0x3a6070", tags: ["wasser", "ruhe", "dua"], overlay: "royal", label: "Stilles Meer" },
  { cat: "nature", base: "0x181c18", grad: "0x3a4540", accent: "0x607060", tags: ["nebel", "akhirah", "zuhd"], overlay: "dark", label: "Morgennebel" },
  { cat: "nature", base: "0x0c2030", grad: "0x304060", accent: "0x90a8c0", tags: ["himmel", "licht", "sabr"], overlay: "royal", label: "Dämmerung" },
  { cat: "nature", base: "0x121008", grad: "0x403828", accent: "0xbfb08a", tags: ["sonnenaufgang", "quran", "berge"], overlay: "warm-dark", label: "Morgenlicht" },
  { cat: "nature", base: "0x080806", grad: "0x1a1814", accent: "0x505048", tags: ["stille", "tawhid", "ruhe"], overlay: "dark", label: "Stille Ebene" },
  { cat: "mosque", base: "0x0e0c08", grad: "0x2a2820", accent: "0xcfb878", tags: ["moschee", "muster", "tawhid"], overlay: "dark", label: "Bogenlicht" },
  { cat: "mosque", base: "0x081828", grad: "0x102840", accent: "0xd4b86a", tags: ["moschee", "minarett", "quran"], overlay: "royal", label: "Minarett-Schein" },
  { cat: "mosque", base: "0x121008", grad: "0x353028", accent: "0xe8d5a0", tags: ["kuppel", "muster", "aqidah"], overlay: "warm-dark", label: "Kuppelgold" },
  { cat: "mosque", base: "0x181410", grad: "0x403830", accent: "0xa89060", tags: ["moschee", "ilm", "ruhe"], overlay: "dark", label: "Säulenhalle" },
  { cat: "books", base: "0x2a2218", grad: "0x4a4030", accent: "0xc8b890", tags: ["bücher", "ilm", "hadith"], overlay: "warm-dark", label: "Pergament" },
  { cat: "books", base: "0x302820", grad: "0x554838", accent: "0xd8ccb0", tags: ["pergament", "sunnah", "adab"], overlay: "light", label: "Manuskript" },
  { cat: "books", base: "0x201810", grad: "0x3a3028", accent: "0xb8a078", tags: ["ilm", "wissen", "adab"], overlay: "warm-dark", label: "Bücherregal" },
  { cat: "books", base: "0x282018", grad: "0x484030", accent: "0xc0a880", tags: ["tinte", "feder", "ilm"], overlay: "light", label: "Tinte & Feder" },
  { cat: "abstract", base: "0x060606", grad: "0x181818", accent: "0x808080", tags: ["ruhe", "stark", "tawhid"], overlay: "dark", label: "Tiefschwarz" },
  { cat: "abstract", base: "0x181008", grad: "0x3a3020", accent: "0xe0c888", tags: ["licht", "quran", "muster"], overlay: "warm-dark", label: "Goldstrom" },
  { cat: "abstract", base: "0x101018", grad: "0x282838", accent: "0x9898b0", tags: ["muster", "kalligraphie", "ilm"], overlay: "dark", label: "Geometrie" },
  { cat: "abstract", base: "0x140808", grad: "0x381818", accent: "0xb87878", tags: ["bordeaux", "stark", "aqidah"], overlay: "bordeaux", label: "Bordeaux" },
  { cat: "tawhid", base: "0x201810", grad: "0x504030", accent: "0xf0d898", tags: ["tawhid", "aqidah", "licht"], overlay: "warm-dark", label: "Tauhid-Glanz" },
  { cat: "tawhid", base: "0x101820", grad: "0x283850", accent: "0xd8c080", tags: ["tawhid", "himmel", "quran"], overlay: "royal", label: "Himmel & Gold" },
  { cat: "akhirah", base: "0x101820", grad: "0x283038", accent: "0x688898", tags: ["akhirah", "sabr", "zuhd"], overlay: "dark", label: "Jenseits-Nacht" },
  { cat: "dua", base: "0x081a33", grad: "0x203550", accent: "0x90b0d8", tags: ["dua", "himmel", "ruhe"], overlay: "royal", label: "Duʿāʾ-Blau" },
  { cat: "quran", base: "0x102040", grad: "0x304060", accent: "0xc8b070", tags: ["quran", "licht", "himmel"], overlay: "royal", label: "Qurʾān-Licht" }
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function run(cmd) {
  execSync(cmd, { stdio: "pipe" });
}

function genProWebp(out, w, h, spec, variant) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const swap = variant % 2 === 1;
  const c0 = swap ? spec.base : spec.grad;
  const c1 = swap ? spec.grad : spec.base;
  const sat = (1.1 + (variant % 4) * 0.03).toFixed(2);
  const contrast = (1.06 + (variant % 3) * 0.02).toFixed(2);
  const cmd =
    `ffmpeg -y -hide_banner -loglevel error ` +
    `-f lavfi -i "gradients=s=${w}x${h}:c0=${c0}:c1=${c1}:duration=1:rate=1" ` +
    `-vf "vignette=angle=PI/4,noise=alls=5:allf=t+u,eq=contrast=${contrast}:saturation=${sat}:gamma=0.94" ` +
    `-frames:v 1 -q:v 2 "${out}"`;
  run(cmd);
}

function removeWikiAssets() {
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/^bg-(wiki|seed)-/.test(name)) {
        fs.unlinkSync(p);
        console.log("removed", p.replace(ROOT, ""));
      }
    }
  };
  walk(ASSETS);
}

function makeItem(id, spec, webBase) {
  return {
    id,
    title: `Pro · ${spec.cat} · ${spec.label}`,
    filename: `${id}.webp`,
    category: spec.cat,
    tags: spec.tags,
    topics: spec.tags,
    allowedFor: ["feed"],
    src: `${webBase}.webp`,
    srcMobile: `${webBase}-mobile.webp`,
    thumbnail: `${webBase}-thumb.webp`,
    alt: `Professioneller ${spec.label}-Hintergrund ohne Personen`,
    priority: 9,
    active: true,
    approved: true,
    status: "active",
    securityStatus: "approved",
    isIslamicallySafe: true,
    containsHumans: false,
    containsFaces: false,
    containsBodyParts: false,
    containsNudity: false,
    containsAnimals: false,
    containsBirds: false,
    containsWildlife: false,
    containsPets: false,
    containsInsects: false,
    containsFish: false,
    containsWatermark: false,
    containsLogo: false,
    containsTextOverlay: false,
    containsCross: false,
    containsChurch: false,
    isLowQuality: false,
    isBlurred: false,
    isTooBusy: false,
    hasWatermark: false,
    hasLogo: false,
    hasTextOverlay: false,
    qualityScore: 98,
    overlayHint: spec.overlay,
    focusPoint: { x: 50, y: 44 },
    dominantColor: spec.base,
    source: "studio",
    sourcePhotoId: id,
    sourceUrl: "",
    license: "DAR AL TAWHID Studio",
    resolution: "4K",
    width: FULL.w,
    height: FULL.h,
    downloadedAt: NOW,
    autoSynced: false,
    seedBootstrap: false,
    studioGenerated: true,
    adminNote: "4K Studio — ohne Menschen, ohne Stock-Fotos",
    createdAt: NOW,
    updatedAt: NOW
  };
}

async function main() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch (e) {
    console.error("ffmpeg required");
    process.exit(1);
  }

  console.log("Removing wiki assets…");
  removeWikiAssets();

  const items = [];
  for (let i = 0; i < TARGET; i++) {
    const spec = SPECS[i % SPECS.length];
    const n = String(i + 1).padStart(2, "0");
    const id = `bg-pro-${spec.cat}-${n}`;
    const dir = path.join(ASSETS, spec.cat);
    const base = path.join(dir, id);
    const webBase = base.replace(ROOT, "").replace(/\\/g, "/");
    console.log(`[${i + 1}/${TARGET}] ${id} (${FULL.w}x${FULL.h})`);
    genProWebp(`${base}.webp`, FULL.w, FULL.h, spec, i);
    genProWebp(`${base}-mobile.webp`, MOBILE.w, MOBILE.h, spec, i + 7);
    genProWebp(`${base}-thumb.webp`, THUMB.w, THUMB.h, spec, i + 13);
    items.push(makeItem(id, spec, webBase));
  }

  for (const jsonPath of JSON_PATHS) {
    let data = {};
    try {
      data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch (_) {}
    data.version = (Number(data.version) || 1) + 1;
    data.updatedAt = NOW;
    data.cacheVersion = (Number(data.cacheVersion) || 0) + 1;
    data.items = items;
    data.settings = {
      ...(data.settings || {}),
      blockHumans: true,
      blockFaces: true,
      blockAnimals: true,
      strictSafetyMode: true,
      fallbackToGradient: true,
      minPoolSize: 80
    };
    data.syncState = {
      ...(data.syncState || {}),
      lastSyncAt: NOW,
      lastSyncStatus: "studio-4k-80-no-people",
      lastSyncError: "",
      lastRunDownloads: 0,
      lastRunRejected: 0
    };
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
    console.log("Wrote", jsonPath);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
