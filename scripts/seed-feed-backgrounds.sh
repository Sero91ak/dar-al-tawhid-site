#!/usr/bin/env bash
# Erzeugt sichere Bootstrap-Hintergründe (Gradient/Natur-Töne, keine Menschen/Tiere).
# Vollständig lokal — kein API, kein Hotlink.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/assets/feed-backgrounds/auto"
STAGING_JSON="$ROOT/content/staging/feed-backgrounds/feed-backgrounds.json"
LIVE_JSON="$ROOT/content/feed-backgrounds/feed-backgrounds.json"
NOW="$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg fehlt — Seed übersprungen"
  exit 1
fi

gen_variant() {
  local out="$1" w="$2" h="$3" c0="$4" c1="$5"
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "gradients=s=${w}x${h}:c0=${c0}:c1=${c1}:duration=1:rate=1" \
    -frames:v 1 -q:v 4 "$out"
}

gen_set() {
  local id="$1" cat="$2" c0="$3" c1="$4" tags="$5" overlay="$6"
  local dir="$ASSETS/$cat"
  mkdir -p "$dir"
  local base="$dir/${id}"
  gen_variant "${base}.webp" 1080 1350 "$c0" "$c1"
  gen_variant "${base}-mobile.webp" 720 960 "$c0" "$c1"
  gen_variant "${base}-thumb.webp" 400 400 "$c0" "$c1"
  node - "$id" "$cat" "$tags" "$overlay" "$NOW" "$base" "$ROOT" <<'NODE'
const [id, cat, tags, overlay, now, base, root] = process.argv.slice(2);
const tagList = tags.split("|").filter(Boolean);
const webBase = base.replace(root, "").replace(/\\/g, "/");
process.stdout.write(JSON.stringify({
  id,
  title: `Seed · ${cat} · ${id}`,
  filename: `${id}.webp`,
  category: cat,
  tags: tagList,
  topics: tagList,
  allowedFor: ["feed"],
  src: `${webBase}.webp`,
  srcMobile: `${webBase}-mobile.webp`,
  thumbnail: `${webBase}-thumb.webp`,
  alt: `Edler ${cat}-Hintergrund`,
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
  overlayHint: overlay,
  focusPoint: { x: 50, y: 50 },
  dominantColor: "",
  source: "seed",
  sourcePhotoId: id,
  sourceUrl: "",
  license: "DAR AL TAWHID internal seed",
  downloadedAt: now,
  createdAt: now,
  updatedAt: now,
  adminNote: "bootstrap seed — sicher, lokal, ohne API",
  autoSynced: false,
  seedBootstrap: true
}) + "\n");
NODE
}

ITEMS=""
add_item() {
  local line
  line="$(gen_set "$@")"
  ITEMS="${ITEMS}${line},"
}

# 28 sichere Bootstrap-Bilder (Natur-Töne, Architektur-Töne, Bücher, Abstrakt)
add_item bg-seed-nature-mountain-01 nature "0x2a2520" "0x0a0908" "berge|himmel|ruhe|tawhid" dark
add_item bg-seed-nature-mountain-02 nature "0x3a3530" "0x12100e" "berge|nebel|akhirah|ruhe" dark
add_item bg-seed-nature-mountain-03 nature "0x4a4035" "0x1a150f" "berge|licht|quran|stark" warm-dark
add_item bg-seed-nature-desert-01 nature "0x5c4a32" "0x2b1e16" "wüste|sand|tawhid|aqidah" warm-dark
add_item bg-seed-nature-desert-02 nature "0x6b5538" "0x321317" "wüste|sand|stark|ruhe" warm-dark
add_item bg-seed-nature-sky-01 nature "0x102030" "0x040810" "himmel|licht|quran|wolken" royal
add_item bg-seed-nature-sky-02 nature "0x203550" "0x081a33" "himmel|wolken|dua|ruhe" royal
add_item bg-seed-nature-sky-03 nature "0x304060" "0x102040" "himmel|sonnenuntergang|dua|ruhe" royal
add_item bg-seed-nature-ocean-01 nature "0x1a3040" "0x081820" "wasser|ruhe|dua|tazkiyah" royal
add_item bg-seed-nature-ocean-02 nature "0x2a4555" "0x0c2030" "wasser|himmel|ruhe|sabr" dark
add_item bg-seed-nature-mist-01 nature "0x3a4540" "0x181c18" "nebel|pflanzen|akhirah|zuhd" dark
add_item bg-seed-nature-mist-02 nature "0x454540" "0x202018" "nebel|ruhe|tazkiyah|sabr" dark
add_item bg-seed-mosque-arch-01 mosque "0x2a2820" "0x0e0c08" "moschee|muster|tawhid|aqidah" dark
add_item bg-seed-mosque-arch-02 mosque "0x353028" "0x121008" "moschee|minarett|kuppel|tawhid" warm-dark
add_item bg-seed-mosque-arch-03 mosque "0x102840" "0x081828" "moschee|himmel|quran|muster" royal
add_item bg-seed-mosque-arch-04 mosque "0x403830" "0x181410" "moschee|muster|ilm|ruhe" dark
add_item bg-seed-books-parchment-01 books "0x4a4030" "0x2a2218" "bücher|pergament|ilm|adab" light
add_item bg-seed-books-parchment-02 books "0x554838" "0x302820" "bücher|tinte|feder|hadith" warm-dark
add_item bg-seed-books-parchment-03 books "0x3a3428" "0x1a1610" "bücher|ilm|sunnah|wissen" warm-dark
add_item bg-seed-books-parchment-04 books "0x484038" "0x282018" "pergament|bücher|ilm|adab" light
add_item bg-seed-abstract-gold-01 abstract "0x3a3020" "0x181008" "licht|tawhid|quran|stark" warm-dark
add_item bg-seed-abstract-gold-02 abstract "0x2a2018" "0x0a0806" "tawhid|aqidah|ruhe|stark" dark
add_item bg-seed-abstract-dark-01 abstract "0x181818" "0x060606" "ruhe|tawhid|akhirah|zuhd" dark
add_item bg-seed-abstract-dark-02 abstract "0x201820" "0x080808" "ruhe|sabr|tazkiyah|akhirah" dark
add_item bg-seed-abstract-pattern-01 abstract "0x283038" "0x101820" "muster|kalligraphie|quran|ilm" dark
add_item bg-seed-abstract-pattern-02 abstract "0x303028" "0x141410" "muster|tawhid|ilm|ruhe" dark
add_item bg-seed-tawhid-dawn-01 tawhid "0x504030" "0x201810" "berge|himmel|tawhid|aqidah" warm-dark
add_item bg-seed-tawhid-dawn-02 tawhid "0x604838" "0x281810" "wüste|stark|tawhid|klarheit" warm-dark

ITEMS="${ITEMS%,}"

node - "$STAGING_JSON" "$LIVE_JSON" "$NOW" "$ITEMS" <<'NODE'
const fs = require("fs");
const [stagingPath, livePath, now, itemsJson] = process.argv.slice(2);
const items = JSON.parse(`[${itemsJson}]`);
const settings = {
  autoDownloadEnabled: true,
  strictSafetyMode: true,
  blockHumans: true,
  blockFaces: true,
  blockAnimals: true,
  blockWatermarks: true,
  blockLogos: true,
  blockTextOverlays: true,
  fallbackToGradient: true,
  minPoolSize: 80,
  refillBelow: 40,
  dailyDownloadLimit: 20,
  allowedSources: ["pexels", "unsplash", "pixabay"]
};
const syncState = {
  lastSyncAt: now,
  lastSyncStatus: "seed-bootstrap",
  lastSyncError: "",
  nextSyncAt: "",
  dailyDownloadDate: now.slice(0, 10),
  dailyDownloadCount: 0,
  lastRunDownloads: items.length,
  lastRunRejected: 0,
  lastRunErrors: [],
  totalDownloads: 0,
  totalRejected: 0,
  seedBootstrappedAt: now
};
function write(path) {
  const payload = {
    version: 1,
    updatedAt: now,
    cacheVersion: 2,
    settings,
    syncState,
    items: items.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
  };
  fs.writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}
write(stagingPath);
write(livePath);
console.log(`Seed OK: ${items.length} Bilder → ${stagingPath}`);
NODE

echo "Bootstrap-Hintergründe erzeugt: 28 Sets (full/mobile/thumb)"
