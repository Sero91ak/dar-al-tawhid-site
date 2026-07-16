#!/usr/bin/env node
/**
 * Ergänzt Bootstrap-Seed auf mindestens 80 sichere lokale Hintergründe.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets/feed-backgrounds/auto");
const PATHS = [
  path.join(ROOT, "content/staging/feed-backgrounds/feed-backgrounds.json"),
  path.join(ROOT, "content/feed-backgrounds/feed-backgrounds.json")
];
const TARGET = 80;
const NOW = new Date().toISOString();

const PALETTE = [
  { cat: "nature", c0: "0x2a2520", c1: "0x0a0908", tags: ["berge", "ruhe", "tawhid"], overlay: "dark" },
  { cat: "nature", c0: "0x102030", c1: "0x040810", tags: ["himmel", "quran", "wolken"], overlay: "royal" },
  { cat: "nature", c0: "0x5c4a32", c1: "0x2b1e16", tags: ["wüste", "sand", "aqidah"], overlay: "warm-dark" },
  { cat: "nature", c0: "0x1a3040", c1: "0x081820", tags: ["wasser", "dua", "ruhe"], overlay: "royal" },
  { cat: "nature", c0: "0x3a4540", c1: "0x181c18", tags: ["nebel", "akhirah", "zuhd"], overlay: "dark" },
  { cat: "mosque", c0: "0x2a2820", c1: "0x0e0c08", tags: ["moschee", "tawhid", "muster"], overlay: "dark" },
  { cat: "mosque", c0: "0x102840", c1: "0x081828", tags: ["moschee", "quran", "minarett"], overlay: "royal" },
  { cat: "books", c0: "0x4a4030", c1: "0x2a2218", tags: ["bücher", "ilm", "adab"], overlay: "light" },
  { cat: "books", c0: "0x554838", c1: "0x302820", tags: ["pergament", "hadith", "sunnah"], overlay: "warm-dark" },
  { cat: "abstract", c0: "0x181818", c1: "0x060606", tags: ["ruhe", "tawhid", "stark"], overlay: "dark" },
  { cat: "abstract", c0: "0x3a3020", c1: "0x181008", tags: ["licht", "quran", "muster"], overlay: "warm-dark" },
  { cat: "tawhid", c0: "0x504030", c1: "0x201810", tags: ["tawhid", "aqidah", "berge"], overlay: "warm-dark" },
  { cat: "akhirah", c0: "0x283038", c1: "0x101820", tags: ["akhirah", "sabr", "zuhd"], overlay: "dark" },
  { cat: "dua", c0: "0x203550", c1: "0x081a33", tags: ["dua", "himmel", "ruhe"], overlay: "royal" },
  { cat: "quran", c0: "0x304060", c1: "0x102040", tags: ["quran", "licht", "himmel"], overlay: "royal" }
];

function genVariant(out, w, h, c0, c1) {
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -f lavfi -i "gradients=s=${w}x${h}:c0=${c0}:c1=${c1}:duration=1:rate=1" -frames:v 1 -q:v 4 "${out}"`,
    { stdio: "pipe" }
  );
}

function makeItem(id, spec) {
  const dir = path.join(ASSETS, spec.cat);
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, id);
  genVariant(`${base}.webp`, 1080, 1350, spec.c0, spec.c1);
  genVariant(`${base}-mobile.webp`, 720, 960, spec.c0, spec.c1);
  genVariant(`${base}-thumb.webp`, 400, 400, spec.c0, spec.c1);
  const rel = base.replace(ROOT, "").replace(/\\/g, "/");
  const webBase = rel.startsWith("/") ? rel : `/${rel.replace(/^\/+/, "")}`;
  return {
    id,
    title: `Seed · ${spec.cat} · ${id}`,
    filename: `${id}.webp`,
    category: spec.cat,
    tags: spec.tags,
    topics: spec.tags,
    allowedFor: ["feed"],
    src: `${webBase}.webp`,
    srcMobile: `${webBase}-mobile.webp`,
    thumbnail: `${webBase}-thumb.webp`,
    alt: `Edler ${spec.cat}-Hintergrund`,
    priority: 7,
    active: true,
    approved: true,
    status: "active",
    securityStatus: "approved",
    isIslamicallySafe: true,
    containsHumans: false,
    containsAnimals: false,
    containsFaces: false,
    hasWatermark: false,
    hasLogo: false,
    hasTextOverlay: false,
    qualityScore: 88,
    overlayHint: spec.overlay,
    focusPoint: { x: 50, y: 50 },
    dominantColor: "",
    source: "seed",
    sourcePhotoId: id,
    sourceUrl: "",
    license: "DAR AL TAWHID internal seed",
    downloadedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    adminNote: "bootstrap seed — sicher, lokal, ohne API",
    autoSynced: false,
    seedBootstrap: true
  };
}

for (const jsonPath of PATHS) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const items = Array.isArray(data.items) ? [...data.items] : [];
  const have = new Set(items.map((x) => x.id));
  let n = 0;
  while (items.filter((x) => x?.approved && x?.status === "active").length < TARGET) {
    const spec = PALETTE[n % PALETTE.length];
    const id = `bg-seed-${spec.cat}-auto-${String(n + 1).padStart(3, "0")}`;
    if (!have.has(id)) {
      items.push(makeItem(id, spec));
      have.add(id);
    }
    n += 1;
    if (n > TARGET * 3) break;
  }
  data.items = items.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
  data.updatedAt = NOW;
  data.cacheVersion = (Number(data.cacheVersion) || 1) + 1;
  data.syncState = {
    ...(data.syncState || {}),
    lastSyncAt: NOW,
    lastSyncStatus: "seed-bootstrap-80",
    seedBootstrappedAt: NOW,
    lastRunDownloads: items.length
  };
  if (data.settings) {
    data.settings.allowedSources = ["wikimedia", "pexels", "unsplash", "pixabay"];
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${jsonPath}: ${items.length} items (${items.filter((x) => x.approved).length} approved)`);
}
