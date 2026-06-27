#!/usr/bin/env node
/**
 * Ersetzt Seed-Gradienten durch echte Wikimedia-Commons-Fotos (sicher, lokal).
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

const QUERIES = [
  { query: "mountains landscape", category: "nature", tags: ["berge", "himmel", "ruhe", "tawhid"], overlayHint: "dark" },
  { query: "desert landscape", category: "nature", tags: ["wüste", "sand", "ruhe", "aqidah"], overlayHint: "warm-dark" },
  { query: "sand dunes", category: "nature", tags: ["wüste", "sand", "stark", "tawhid"], overlayHint: "warm-dark" },
  { query: "night sky stars", category: "nature", tags: ["himmel", "licht", "quran", "ruhe"], overlayHint: "royal" },
  { query: "clouds sunset", category: "nature", tags: ["himmel", "wolken", "dua", "ruhe"], overlayHint: "warm-dark" },
  { query: "sunrise mountains", category: "nature", tags: ["berge", "sonnenaufgang", "licht", "quran"], overlayHint: "light" },
  { query: "forest mist", category: "nature", tags: ["nebel", "pflanzen", "ruhe", "akhirah"], overlayHint: "dark" },
  { query: "calm ocean", category: "nature", tags: ["wasser", "ruhe", "dua", "tazkiyah"], overlayHint: "royal" },
  { query: "mosque interior architecture", category: "mosque", tags: ["moschee", "muster", "tawhid", "aqidah"], overlayHint: "dark" },
  { query: "mosque architecture minaret", category: "mosque", tags: ["moschee", "minarett", "kuppel", "tawhid"], overlayHint: "royal" },
  { query: "islamic geometric pattern", category: "abstract", tags: ["muster", "kalligraphie", "quran", "tawhid"], overlayHint: "dark" },
  { query: "arabesque pattern", category: "abstract", tags: ["muster", "kalligraphie", "ilm"], overlayHint: "dark" },
  { query: "old books parchment", category: "books", tags: ["bücher", "ilm", "hadith", "sunnah"], overlayHint: "warm-dark" },
  { query: "parchment texture", category: "books", tags: ["pergament", "bücher", "ilm", "adab"], overlayHint: "light" },
  { query: "paper texture", category: "books", tags: ["pergament", "bücher", "ilm"], overlayHint: "light" },
  { query: "gold texture", category: "abstract", tags: ["licht", "tawhid", "quran"], overlayHint: "warm-dark" }
];

const FORBIDDEN = /\b(people|person|portrait|face|human|man\b|woman\b|child|animal|bird|dog|cat|church|cross|statue|wedding|selfie)\b/i;
const WIKI_BLOCKED = ["people", "portrait", "nude", "animal", "bird", "dog", "cat", "church", "cross", "selfie", "wedding"];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function wikiFilePathUrl(fileTitle, width) {
  const name = String(fileTitle || "").replace(/^File:/i, "");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
}

function isWikiLicenseOk(meta) {
  const license = String(meta?.LicenseShortName?.value || meta?.License?.value || "").toLowerCase();
  const url = String(meta?.LicenseUrl?.value || "").toLowerCase();
  const hay = `${license} ${url}`;
  if (!hay.trim()) return false;
  if (hay.includes("nc") || hay.includes("nd")) return false;
  return hay.includes("cc0") || hay.includes("public domain") || hay.includes("pd") || hay.includes("cc-by");
}

function wikiCategoriesBlocked(categoriesValue) {
  const hay = String(categoriesValue || "").toLowerCase();
  return WIKI_BLOCKED.some((c) => hay.includes(c));
}

async function searchWikimedia(query, perPage, attempt) {
  attempt = attempt || 0;
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&formatversion=2" +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${perPage}` +
    "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1080";
  const res = await fetch(url, {
    headers: { "User-Agent": "DAR-AL-TAWHID-FeedBackgroundBootstrap/1.0 (contact: dar-al-tawhid.de)" }
  });
  if (res.status === 429 && attempt < 6) {
    await sleep(2000 * (attempt + 1));
    return searchWikimedia(query, perPage, attempt + 1);
  }
  if (!res.ok) throw new Error(`Wiki search ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages || [];
  const out = [];
  for (const page of pages) {
    const info = (page?.imageinfo || [])[0];
    if (!info?.url) continue;
    const mime = String(info.mime || "").toLowerCase();
    if (!mime.startsWith("image/")) continue;
    const meta = info.extmetadata || {};
    if (!isWikiLicenseOk(meta)) continue;
    if (wikiCategoriesBlocked(meta?.Categories?.value)) continue;
    const title = String(page.title || "");
    const desc = String(meta?.ImageDescription?.value || meta?.ObjectName?.value || title)
      .replace(/<[^>]+>/g, " ")
      .trim();
    const artist = String(meta?.Artist?.value || "").replace(/<[^>]+>/g, " ").trim();
    const hay = `${query} ${desc} ${title} ${meta?.Categories?.value || ""}`;
    if (FORBIDDEN.test(hay)) continue;
    const w = Number(info.width) || 0;
    const h = Number(info.height) || 0;
    if (w > 0 && h > 0 && (w < 900 || h < 700)) continue;
    out.push({
      fileTitle: title,
      alt: desc || title,
      photographer: artist,
      license: String(meta?.LicenseShortName?.value || "Wikimedia Commons").trim(),
      sourceUrl: info.descriptionurl || "",
      width: w,
      height: h,
      pageId: String(page.pageid || title),
      downloadUrl: info.thumburl || info.url
    });
  }
  return out;
}

async function downloadBuffer(url, attempt) {
  attempt = attempt || 0;
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "DAR-AL-TAWHID-FeedBackgroundBootstrap/1.0 (contact: dar-al-tawhid.de)" }
  });
  if (res.status === 429 && attempt < 6) {
    await sleep(1500 * (attempt + 1));
    return downloadBuffer(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 12000) throw new Error("file-too-small");
  if (buf.length > 2.5 * 1024 * 1024) throw new Error("file-too-large");
  if (ct && !ct.startsWith("image/")) throw new Error("not-image");
  return buf;
}

function toWebp(inputPath, outputPath, w, h) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i "${inputPath}" -vf "scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}" -q:v 4 "${outputPath}"`,
    { stdio: "pipe" }
  );
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36) || "bg";
}

async function main() {
  if (!fs.existsSync("/tmp") && !process.env.HOME) {
    console.error("Need writable temp");
    process.exit(1);
  }
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch (e) {
    console.error("ffmpeg required");
    process.exit(1);
  }

  const items = [];
  const usedIds = new Set();
  let n = 0;

  // Bereits heruntergeladene bg-wiki-* Dateien einlesen
  function scanExistingWiki() {
    const found = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (/^bg-wiki-.+\.webp$/.test(name) && !/-mobile|-thumb/.test(name)) found.push(p);
      }
    };
    walk(ASSETS);
    return found;
  }
  for (const full of scanExistingWiki()) {
    const id = path.basename(full, ".webp");
    if (items.some((x) => x.id === id)) continue;
    const rel = full.replace(ROOT, "").replace(/\\/g, "/");
    const cat = rel.split("/auto/")[1]?.split("/")[0] || "nature";
    items.push({
      id,
      title: `Wikimedia · ${cat} · ${id}`,
      filename: `${id}.webp`,
      category: cat,
      tags: ["tawhid", "ruhe"],
      topics: ["tawhid", "ruhe"],
      allowedFor: ["feed"],
      src: rel.startsWith("/") ? rel : `/${rel.replace(/^\/+/, "")}`,
      srcMobile: rel.replace(".webp", "-mobile.webp"),
      thumbnail: rel.replace(".webp", "-thumb.webp"),
      alt: `Wikimedia ${cat} Hintergrund`,
      priority: 8,
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
      qualityScore: 90,
      overlayHint: "dark",
      focusPoint: { x: 50, y: 46 },
      source: "wikimedia",
      sourcePhotoId: id,
      sourceUrl: "",
      license: "Wikimedia Commons",
      downloadedAt: NOW,
      autoSynced: true,
      seedBootstrap: false,
      adminNote: "resumed local wiki asset",
      createdAt: NOW,
      updatedAt: NOW
    });
    usedIds.add(`wikimedia:${id}`);
    n += 1;
  }
  console.log("Resume with", items.length, "existing wiki items");

  for (const entry of QUERIES) {
    if (items.length >= TARGET) break;
    let results = [];
    try {
      results = await searchWikimedia(entry.query, 8);
    } catch (e) {
      console.warn("search fail", entry.query, e.message);
      await sleep(400);
      continue;
    }
    for (const hit of results) {
      if (items.length >= TARGET) break;
      const dedupe = `wikimedia:${hit.pageId}`;
      if (usedIds.has(dedupe)) continue;
      const id = `bg-wiki-${entry.category}-${slugify(entry.query)}-${String(n + 1).padStart(2, "0")}`;
      const dir = path.join(ASSETS, entry.category);
      const base = path.join(dir, id);
      const tmp = path.join("/tmp", `${id}.src`);
      try {
        const fullUrl = hit.downloadUrl || wikiFilePathUrl(hit.fileTitle, 1400);
        const buf = await downloadBuffer(fullUrl);
        fs.writeFileSync(tmp, buf);
        toWebp(tmp, `${base}.webp`, 1080, 1350);
        toWebp(tmp, `${base}-mobile.webp`, 720, 960);
        toWebp(tmp, `${base}-thumb.webp`, 400, 400);
        fs.unlinkSync(tmp);
        const webBase = base.replace(ROOT, "").replace(/\\/g, "/");
        items.push({
          id,
          title: hit.alt.slice(0, 120) || `Wikimedia · ${entry.category}`,
          filename: `${id}.webp`,
          category: entry.category,
          tags: entry.tags,
          topics: entry.tags,
          allowedFor: ["feed"],
          src: `${webBase}.webp`,
          srcMobile: `${webBase}-mobile.webp`,
          thumbnail: `${webBase}-thumb.webp`,
          alt: hit.alt.slice(0, 180),
          priority: 8,
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
          qualityScore: 92,
          overlayHint: entry.overlayHint,
          focusPoint: { x: 50, y: 46 },
          dominantColor: "",
          source: "wikimedia",
          sourcePhotoId: hit.pageId,
          sourceUrl: hit.sourceUrl,
          license: hit.license,
          photographer: hit.photographer,
          downloadedAt: NOW,
          autoSynced: true,
          seedBootstrap: false,
          adminNote: `wikimedia bootstrap ${entry.query}`,
          createdAt: NOW,
          updatedAt: NOW
        });
        usedIds.add(dedupe);
        n += 1;
        console.log(`OK ${items.length}/${TARGET}`, id, Math.round(buf.length / 1024) + "KB");
      } catch (e) {
        try { fs.unlinkSync(tmp); } catch (_) {}
        console.warn("skip", hit.fileTitle, e.message);
      }
      await sleep(1200);
    }
    await sleep(2000);
  }

  if (items.length < 12) {
    console.error("Too few downloads:", items.length);
    process.exit(1);
  }

  for (const jsonPath of JSON_PATHS) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    data.version = (Number(data.version) || 1) + 1;
    data.updatedAt = NOW;
    data.cacheVersion = (Number(data.cacheVersion) || 0) + 1;
    data.items = items.slice(0, TARGET);
    data.syncState = {
      ...(data.syncState || {}),
      lastSyncAt: NOW,
      lastSyncStatus: `wikimedia-bootstrap-${items.length}`,
      lastSyncError: "",
      lastRunDownloads: items.length,
      seedBootstrappedAt: data.syncState?.seedBootstrappedAt || NOW
    };
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
    console.log("Wrote", jsonPath, "items", data.items.length, "cacheVersion", data.cacheVersion);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
