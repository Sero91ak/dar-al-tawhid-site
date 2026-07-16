#!/usr/bin/env node
/**
 * Lädt professionelle Feed-Hintergründe (Natur-Fokus, keine Menschen/Tiere).
 * Keys nur via ENV — niemals ins Repo.
 *
 *   PEXELS_API_KEY=... UNSPLASH_ACCESS_KEY=... PIXABAY_API_KEY=... node scripts/bootstrap-stock-feed-backgrounds.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  WHITELIST_QUERIES,
  DEFAULT_SETTINGS,
  validateCandidate,
  sortQueriesNatureFirst
} = require("./lib/feed-background-safety.cjs");
const { analyzeImageFile } = require("./lib/feed-bg-image-analysis.cjs");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets/feed-backgrounds/auto");
const JSON_PATHS = [
  path.join(ROOT, "content/staging/feed-backgrounds/feed-backgrounds.json"),
  path.join(ROOT, "content/feed-backgrounds/feed-backgrounds.json")
];
const PEXELS_KEY = process.env.PEXELS_API_KEY || "";
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || "";
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "";
const TARGET = Number(process.env.STOCK_BG_TARGET || 56);
const NATURE_MIN = Number(process.env.NATURE_BG_MIN || 44);
const NOW = new Date().toISOString();
const FULL = { w: 2160, h: 2700 };
const MOBILE = { w: 1440, h: 1920 };
const THUMB = { w: 512, h: 512 };
const SETTINGS = { ...DEFAULT_SETTINGS };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slug(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
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

async function searchPixabay(query, perPage) {
  if (!PIXABAY_KEY) return [];
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(PIXABAY_KEY)}&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&safesearch=true&per_page=${Math.max(3, perPage)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  const data = await res.json();
  return (data.hits || []).map((p) => ({
    source: "pixabay",
    sourcePhotoId: String(p.id),
    sourceUrl: p.pageURL || "",
    alt: p.tags || query,
    description: p.tags || "",
    photographer: p.user || "",
    tags: String(p.tags || "").split(",").map((x) => x.trim()).filter(Boolean),
    width: p.imageWidth,
    height: p.imageHeight,
    license: "Pixabay License",
    query,
    downloadUrl: p.largeImageURL || p.webformatURL
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

function makeItem(id, cat, spec, c, webBase, check) {
  const flags = check.flags || {};
  const safe = check.ok;
  const item = {
    id,
    title: `Stock · ${cat} · ${spec.q.split(" ").slice(0, 4).join(" ")}`,
    filename: `${id}.webp`,
    category: cat,
    tags: spec.tags,
    topics: spec.tags,
    allowedFor: ["feed"],
    src: `${webBase}.webp`,
    srcMobile: `${webBase}-mobile.webp`,
    thumbnail: `${webBase}-thumb.webp`,
    alt: (c.alt || "Ruhige Natur ohne Menschen und Tiere").slice(0, 180),
    priority: cat === "nature" ? 10 : 7,
    active: safe,
    approved: safe,
    status: safe ? "active" : "disabled",
    securityStatus: safe ? "approved" : "blocked",
    isIslamicallySafe: safe,
    qualityScore: safe ? 96 : 0,
    overlayHint: spec.overlayHint || spec.overlay || "dark",
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
    adminNote: safe ? `nature-safe ${c.source}` : `rejected: ${(check.reasons || []).join(", ")}`,
    downloadedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    rejectionReasons: safe ? [] : check.reasons || []
  };
  const keys = [
    "containsHumans", "containsFaces", "containsBodyParts", "containsNudity",
    "containsAnimals", "containsBirds", "containsWildlife", "containsPets",
    "containsInsects", "containsFish", "containsWatermark", "containsLogo",
    "containsTextOverlay", "containsCross", "containsChurch",
    "isLowQuality", "isBlurred", "isTooBusy"
  ];
  keys.forEach((k) => {
    item[k] = safe ? false : (flags[k] === true);
  });
  item.hasWatermark = item.containsWatermark;
  item.hasLogo = item.containsLogo;
  item.hasTextOverlay = item.containsTextOverlay;
  return item;
}

async function main() {
  if (!PEXELS_KEY && !UNSPLASH_KEY && !PIXABAY_KEY) {
    console.error("PEXELS_API_KEY, UNSPLASH_ACCESS_KEY oder PIXABAY_API_KEY in ENV setzen");
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
  let natureCount = 0;
  const allQueries = sortQueriesNatureFirst(
    WHITELIST_QUERIES.map((q) => ({ ...q, q: q.query, overlay: q.overlayHint }))
  );
  const natureQueries = allQueries.filter((q) => q.category === "nature");
  const secondaryQueries = allQueries.filter((q) => q.category !== "nature");
  const phases = [
    { label: "nature", queries: natureQueries, until: () => natureCount < NATURE_MIN && stock.length < TARGET },
    { label: "secondary", queries: secondaryQueries, until: () => stock.length < TARGET }
  ];

  for (const phase of phases) {
    for (const spec of phase.queries) {
      if (!phase.until()) break;
    let batch = [];
    try {
      const [px, us, pb] = await Promise.all([
        searchPexels(spec.q, 6).catch(() => []),
        searchUnsplash(spec.q, 6).catch(() => []),
        searchPixabay(spec.q, 6).catch(() => [])
      ]);
      batch = [...px, ...us, ...pb];
    } catch (e) {
      console.warn("search fail", spec.q, e.message);
      await sleep(800);
      continue;
    }
    for (const c of batch) {
      if (stock.length >= TARGET) break;
      const check = validateCandidate(c, SETTINGS);
      if (!check.ok || !c.downloadUrl) continue;
      const dedupe = `${c.source}:${c.sourcePhotoId}`;
      if (used.has(dedupe)) continue;
      const id = `bg-nature-${spec.category}-${slug(c.source)}-${String(n + 1).padStart(2, "0")}`;
      const base = path.join(ASSETS, spec.category, id);
      const webBase = base.replace(ROOT, "").replace(/\\/g, "/");
      let tmp = "";
      try {
        tmp = await downloadToTemp(c.downloadUrl);
        toWebp(tmp, `${base}.webp`, FULL.w, FULL.h);
        toWebp(tmp, `${base}-mobile.webp`, MOBILE.w, MOBILE.h);
        toWebp(tmp, `${base}-thumb.webp`, THUMB.w, THUMB.h);
        stock.push(makeItem(id, spec.category, spec, c, webBase, check));
        const lum = analyzeImageFile(`${base}.webp`);
        if (lum) Object.assign(stock[stock.length - 1], lum);
        used.add(dedupe);
        n += 1;
        if (spec.category === "nature") natureCount += 1;
        console.log(`OK ${stock.length}/${TARGET} (nature ${natureCount})`, id, c.source, spec.category);
      } catch (e) {
        console.warn("skip", c.sourcePhotoId, e.message);
      } finally {
        if (tmp) try { fs.unlinkSync(tmp); } catch (_) {}
      }
      await sleep(400);
    }
    await sleep(600);
    }
  }

  if (stock.length < 12) {
    console.error("Zu wenige sichere Natur-Bilder:", stock.length);
    process.exit(1);
  }

  for (const jsonPath of JSON_PATHS) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const studio = (data.items || []).filter((x) => x.source === "studio" || x.studioGenerated);
    const merged = [...stock, ...studio].slice(0, 80);
    while (merged.length < 80 && studio.length) {
      merged.push(studio[merged.length % studio.length]);
    }
    data.version = 3;
    data.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), ...SETTINGS };
    data.items = merged.slice(0, 80);
    data.updatedAt = NOW;
    data.cacheVersion = (Number(data.cacheVersion) || 0) + 1;
    data.syncState = {
      ...(data.syncState || {}),
      lastSyncAt: NOW,
      lastSyncStatus: `nature-safe-${stock.length}-pexels-unsplash-pixabay`,
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
