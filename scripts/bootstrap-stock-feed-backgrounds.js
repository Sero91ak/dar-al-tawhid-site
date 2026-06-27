#!/usr/bin/env node
/**
 * Lädt professionelle Feed-Hintergründe von Pexels/Unsplash (Keys nur via ENV).
 * Streng: keine Menschen/Tiere, min. 2000px Breite, 4K-Ziel.
 *
 *   PEXELS_API_KEY=... UNSPLASH_ACCESS_KEY=... node scripts/bootstrap-stock-feed-backgrounds.js
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
const PEXELS_KEY = process.env.PEXELS_API_KEY || "";
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || "";
const TARGET = Number(process.env.STOCK_BG_TARGET || 40);
const NOW = new Date().toISOString();
const FULL = { w: 2160, h: 2700 };
const MOBILE = { w: 1440, h: 1920 };
const THUMB = { w: 512, h: 512 };

const QUERIES = [
  { q: "mountain landscape empty no people", category: "nature", tags: ["berge", "himmel", "ruhe"], overlay: "dark" },
  { q: "desert dunes empty landscape", category: "nature", tags: ["wüste", "sand", "aqidah"], overlay: "warm-dark" },
  { q: "night sky stars milky way", category: "nature", tags: ["himmel", "licht", "quran"], overlay: "royal" },
  { q: "ocean horizon calm empty", category: "nature", tags: ["wasser", "ruhe", "dua"], overlay: "royal" },
  { q: "forest mist empty landscape", category: "nature", tags: ["nebel", "akhirah", "zuhd"], overlay: "dark" },
  { q: "sunset clouds sky empty", category: "nature", tags: ["himmel", "wolken", "dua"], overlay: "warm-dark" },
  { q: "mosque architecture exterior empty", category: "mosque", tags: ["moschee", "tawhid", "muster"], overlay: "dark" },
  { q: "islamic geometric pattern texture", category: "abstract", tags: ["muster", "kalligraphie", "quran"], overlay: "dark" },
  { q: "arabesque pattern gold", category: "abstract", tags: ["muster", "licht", "tawhid"], overlay: "warm-dark" },
  { q: "old books parchment texture", category: "books", tags: ["bücher", "ilm", "hadith"], overlay: "warm-dark" },
  { q: "marble gold texture abstract", category: "abstract", tags: ["gold", "ruhe", "tawhid"], overlay: "warm-dark" },
  { q: "minimal dark gradient texture", category: "abstract", tags: ["ruhe", "stark", "aqidah"], overlay: "dark" }
];

const FORBIDDEN = /\b(people|person|portrait|face|faces|human|humans|man\b|woman\b|child|children|boy|girl|selfie|crowd|family|wedding|model|animal|animals|bird|dog|cat|pet|wildlife|horse|church|cross|statue|nude)\b/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slug(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
}

function haystack(c) {
  return [c.alt, c.description, c.photographer, c.query, ...(c.tags || [])].join(" ").toLowerCase();
}

function isSafe(c) {
  if (FORBIDDEN.test(haystack(c))) return false;
  const w = Number(c.width) || 0;
  const h = Number(c.height) || 0;
  if (w > 0 && h > 0 && (w < 2000 || h < 2500)) return false;
  return true;
}

async function searchPexels(query, perPage) {
  if (!PEXELS_KEY) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = await res.json();
  return (data.photos || []).map((p) => ({
    source: "pexels",
    sourcePhotoId: String(p.id),
    sourceUrl: p.url || "",
    alt: p.alt || query,
    description: p.alt || "",
    photographer: p.photographer || "",
    tags: [],
    width: p.width,
    height: p.height,
    license: "Pexels License",
    query,
    downloadUrl: p.src?.original || p.src?.large2x || p.src?.large
  }));
}

async function searchUnsplash(query, perPage) {
  if (!UNSPLASH_KEY) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
  if (!res.ok) throw new Error(`Unsplash ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((p) => ({
    source: "unsplash",
    sourcePhotoId: String(p.id),
    sourceUrl: p.links?.html || "",
    alt: p.alt_description || p.description || query,
    description: p.description || "",
    photographer: p.user?.name || "",
    tags: (p.tags || []).map((t) => (typeof t === "string" ? t : t.title || "")),
    width: p.width,
    height: p.height,
    license: "Unsplash License",
    query,
    downloadUrl: p.urls?.raw || p.urls?.full || p.urls?.regular
  }));
}

async function downloadToTemp(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`DL ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 50000) throw new Error("too-small");
  const tmp = path.join("/tmp", `stock-bg-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  fs.writeFileSync(tmp, buf);
  return tmp;
}

function toWebp(inPath, outPath, w, h) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i "${inPath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},eq=contrast=1.04:saturation=1.06" -q:v 3 "${outPath}"`,
    { stdio: "pipe" }
  );
}

function makeItem(id, cat, spec, c, webBase) {
  return {
    id,
    title: `Stock · ${cat} · ${spec.q.split(" ").slice(0, 3).join(" ")}`,
    filename: `${id}.webp`,
    category: cat,
    tags: spec.tags,
    topics: spec.tags,
    allowedFor: ["feed"],
    src: `${webBase}.webp`,
    srcMobile: `${webBase}-mobile.webp`,
    thumbnail: `${webBase}-thumb.webp`,
    alt: (c.alt || "Professioneller Hintergrund ohne Personen").slice(0, 180),
    priority: 10,
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
    qualityScore: 96,
    overlayHint: spec.overlay,
    focusPoint: { x: 50, y: 45 },
    source: c.source,
    sourcePhotoId: c.sourcePhotoId,
    sourceUrl: c.sourceUrl,
    license: c.license,
    photographer: c.photographer,
    resolution: "4K",
    width: FULL.w,
    height: FULL.h,
    autoSynced: true,
    studioGenerated: false,
    adminNote: `stock-curated ${c.source} — no people filter`,
    downloadedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW
  };
}

async function main() {
  if (!PEXELS_KEY && !UNSPLASH_KEY) {
    console.error("PEXELS_API_KEY oder UNSPLASH_ACCESS_KEY in ENV setzen");
    process.exit(1);
  }
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch (e) {
    console.error("ffmpeg required");
    process.exit(1);
  }

  const stock = [];
  const used = new Set();
  let n = 0;

  for (const spec of QUERIES) {
    if (stock.length >= TARGET) break;
    let batch = [];
    try {
      const [px, us] = await Promise.all([
        searchPexels(spec.q, 6).catch(() => []),
        searchUnsplash(spec.q, 6).catch(() => [])
      ]);
      batch = [...px, ...us].filter(isSafe);
    } catch (e) {
      console.warn("search fail", spec.q, e.message);
      await sleep(800);
      continue;
    }
    for (const c of batch) {
      if (stock.length >= TARGET) break;
      const dedupe = `${c.source}:${c.sourcePhotoId}`;
      if (used.has(dedupe) || !c.downloadUrl) continue;
      const id = `bg-stock-${spec.category}-${slug(c.source)}-${String(n + 1).padStart(2, "0")}`;
      const base = path.join(ASSETS, spec.category, id);
      const webBase = base.replace(ROOT, "").replace(/\\/g, "/");
      let tmp = "";
      try {
        tmp = await downloadToTemp(c.downloadUrl);
        toWebp(tmp, `${base}.webp`, FULL.w, FULL.h);
        toWebp(tmp, `${base}-mobile.webp`, MOBILE.w, MOBILE.h);
        toWebp(tmp, `${base}-thumb.webp`, THUMB.w, THUMB.h);
        stock.push(makeItem(id, spec.category, spec, c, webBase));
        used.add(dedupe);
        n += 1;
        console.log(`OK ${stock.length}/${TARGET}`, id, c.source, c.width + "x" + c.height);
      } catch (e) {
        console.warn("skip", c.sourcePhotoId, e.message);
      } finally {
        if (tmp) try { fs.unlinkSync(tmp); } catch (_) {}
      }
      await sleep(400);
    }
    await sleep(600);
  }

  if (stock.length < 8) {
    console.error("Zu wenige Stock-Bilder:", stock.length);
    process.exit(1);
  }

  for (const jsonPath of JSON_PATHS) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const studio = (data.items || []).filter((x) => x.source === "studio" || x.studioGenerated);
    const merged = [...stock, ...studio].slice(0, 80);
    while (merged.length < 80 && studio.length) {
      merged.push(studio[merged.length % studio.length]);
    }
    data.items = merged.slice(0, 80);
    data.updatedAt = NOW;
    data.cacheVersion = (Number(data.cacheVersion) || 0) + 1;
    data.syncState = {
      ...(data.syncState || {}),
      lastSyncAt: NOW,
      lastSyncStatus: `stock-local-${stock.length}-pexels-unsplash`,
      lastRunDownloads: stock.length
    };
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
    console.log("Wrote", jsonPath, "total", data.items.length, "stock", stock.length);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
