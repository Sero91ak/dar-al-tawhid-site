#!/usr/bin/env node
/**
 * Generates premium-style 3/4-perspective feature SVG icons for Spatial Premium 2026.
 * Output: assets/icons/features/{id}.svg
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("assets/icons/features");

const defs = {
  feed: { c1: "#6B8CFF", c2: "#3D5FD9", motif: "frame" },
  ilm: { c1: "#4ECDC4", c2: "#2A9D8F", motif: "lamp" },
  quiz: { c1: "#F4A261", c2: "#E76F51", motif: "puzzle" },
  hadith: { c1: "#D4A574", c2: "#8B6914", motif: "scroll" },
  topics: { c1: "#C9B8FF", c2: "#7C6BB8", motif: "stack" },
  quran: { c1: "#1B7A4E", c2: "#0D4D32", motif: "mushaf" },
  duas: { c1: "#7EC8E3", c2: "#3A86A8", motif: "hands" },
  scholars: { c1: "#E8C170", c2: "#B8860B", motif: "person" },
  books: { c1: "#A67C52", c2: "#6B4423", motif: "books" },
  "prayer-times": { c1: "#5BA3D9", c2: "#2E6B9E", motif: "mosque" },
  jummah: { c1: "#6ECB8F", c2: "#3D9970", motif: "dome" },
  qibla: { c1: "#D4AF37", c2: "#8B7500", motif: "kaaba" },
  calendar: { c1: "#B8A9C9", c2: "#7B6B8F", motif: "calendar" },
  zakat: { c1: "#90BE6D", c2: "#588B3A", motif: "scale" },
  wasiyyah: { c1: "#DDA15E", c2: "#BC6C25", motif: "document" },
  widgets: { c1: "#89CFF0", c2: "#4A90C2", motif: "widget" },
  "image-editor": { c1: "#F4978E", c2: "#D62828", motif: "image" },
  saved: { c1: "#F2CC8F", c2: "#E07A5F", motif: "heart" },
  account: { c1: "#9B8EC4", c2: "#6B5B95", motif: "shield" },
  news: { c1: "#FFD166", c2: "#F4A900", motif: "star" },
  settings: { c1: "#ADB5BD", c2: "#6C757D", motif: "gear" },
  about: { c1: "#83C5BE", c2: "#4A9B94", motif: "info" },
  ramadan: { c1: "#CDB4DB", c2: "#8B6B9E", motif: "moon" }
};

function shadow() {
  return `<ellipse cx="64" cy="88" rx="34" ry="8" fill="#000" opacity="0.18"/>`;
}

function base(c1, c2) {
  return `<defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="hl" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${shadow()}`;
}

function motifSvg(motif, c1, c2) {
  const g = `fill="url(#g)" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"`;
  switch (motif) {
    case "frame":
      return `<rect x="30" y="26" width="52" height="40" rx="8" ${g}/><rect x="36" y="32" width="40" height="28" rx="4" fill="url(#hl)" opacity="0.5"/>`;
    case "lamp":
      return `<path d="M44 30c8-10 24-10 32 0l-6 14H50L44 30z" ${g}/><rect x="52" y="44" width="16" height="18" rx="3" ${g}/>`;
    case "puzzle":
      return `<path d="M34 38h14v-8c0-4 6-4 6 0v8h14v14h-8c-4 0-4 6 0 6h-8V38z" ${g}/>`;
    case "scroll":
      return `<ellipse cx="38" cy="44" rx="8" ry="14" ${g}/><rect x="38" y="30" width="44" height="28" rx="4" ${g}/><ellipse cx="82" cy="44" rx="8" ry="14" ${g}/>`;
    case "stack":
      return `<rect x="32" y="48" width="48" height="10" rx="3" ${g} opacity="0.7"/><rect x="34" y="38" width="48" height="10" rx="3" ${g} opacity="0.85"/><rect x="36" y="28" width="48" height="10" rx="3" ${g}/>`;
    case "mushaf":
      return `<path d="M36 24h20c6 0 10 4 10 10v32c0 6-4 10-10 10H36V24z" ${g}/><path d="M68 24H48c-6 0-10 4-10 10v32c0 6 4 10 10 10h20V24z" ${g} opacity="0.85"/><path d="M52 34h16M52 42h12M52 50h14" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>`;
    case "hands":
      return `<path d="M40 58V38c0-4 4-6 6-4l4 8V34c0-4 4-6 6-4v22c0 8-10 12-16 8z" ${g}/><path d="M72 58V40c0-4-4-6-6-4l-4 6V36c0-4-4-6-6-4v22c0 8 10 12 16 8z" ${g} opacity="0.9"/>`;
    case "person":
      return `<circle cx="56" cy="34" r="12" ${g}/><path d="M36 68c2-14 36-14 40 0v6H36v-6z" ${g}/>`;
    case "books":
      return `<rect x="30" y="30" width="14" height="40" rx="2" ${g}/><rect x="46" y="26" width="14" height="44" rx="2" ${g} opacity="0.9"/><rect x="62" y="32" width="14" height="38" rx="2" ${g} opacity="0.8"/>`;
    case "mosque":
      return `<path d="M56 22l18 12v34H38V34L56 22z" ${g}/><circle cx="56" cy="30" r="5" fill="url(#hl)"/><rect x="48" y="46" width="16" height="18" rx="2" fill="rgba(0,0,0,0.15)"/>`;
    case "dome":
      return `<path d="M30 58h52" stroke="${c2}" stroke-width="3"/><path d="M38 58V42c0-12 36-12 36 0v16" ${g}/><circle cx="56" cy="36" r="6" fill="url(#hl)"/>`;
    case "kaaba":
      return `<path d="M34 58 56 26l22 32H34z" ${g}/><path d="M42 44h28M42 50h20" stroke="#fff" stroke-opacity="0.3" stroke-width="1.5"/>`;
    case "calendar":
      return `<rect x="32" y="28" width="48" height="44" rx="8" ${g}/><rect x="32" y="28" width="48" height="12" rx="8" fill="url(#hl)" opacity="0.55"/><path d="M42 24v8M62 24v8" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>`;
    case "scale":
      return `<path d="M56 28v36M40 64h32" stroke="${c2}" stroke-width="3"/><path d="M36 36 28 52h16L36 36zM76 36l8 16H68l8-16z" ${g}/>`;
    case "document":
      return `<path d="M38 24h24l10 10v34H38V24z" ${g}/><path d="M62 24v10h10" fill="none" stroke="#fff" stroke-opacity="0.35"/><path d="M44 42h24M44 50h18M44 58h20" stroke="#fff" stroke-opacity="0.3" stroke-width="1.5"/>`;
    case "widget":
      return `<rect x="30" y="30" width="22" height="22" rx="6" ${g}/><rect x="58" y="30" width="22" height="22" rx="6" ${g} opacity="0.85"/><rect x="30" y="58" width="22" height="22" rx="6" ${g} opacity="0.75"/><rect x="58" y="58" width="22" height="22" rx="6" ${g} opacity="0.65"/>`;
    case "image":
      return `<rect x="30" y="30" width="52" height="40" rx="8" ${g}/><circle cx="44" cy="44" r="5" fill="url(#hl)"/><path d="M34 62l14-12 10 8 12-14 14 16" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="2"/>`;
    case "heart":
      return `<path d="M56 68S30 52 30 38c0-8 6-12 12-12 6 0 10 4 14 8 4-4 8-8 14-8 6 0 12 4 12 12 0 14-24 30-26 30z" ${g}/>`;
    case "shield":
      return `<path d="M56 24 72 30v18c0 14-16 24-16 24S40 62 40 48V30l16-6z" ${g}/><path d="M56 36v20M48 46h16" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>`;
    case "star":
      return `<path d="M56 26l6 14h14l-11 9 4 14-13-8-13 8 4-14-11-9h14l6-14z" ${g}/>`;
    case "gear":
      return `<circle cx="56" cy="48" r="10" ${g}/><path d="M56 28v8M56 60v8M36 48h8M68 48h8M42 34l6 6M64 56l6 6M42 62l6-6M64 40l6-6" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>`;
    case "info":
      return `<circle cx="56" cy="48" r="22" ${g}/><circle cx="56" cy="38" r="3" fill="#fff" opacity="0.85"/><rect x="53" y="44" width="6" height="16" rx="3" fill="#fff" opacity="0.85"/>`;
    case "moon":
      return `<path d="M68 34c-10 2-16 12-12 22s16 16 26 12c-12 8-30 2-34-12s6-28 20-22z" ${g}/>`;
    default:
      return `<circle cx="56" cy="48" r="20" ${g}/>`;
  }
}

fs.mkdirSync(OUT, { recursive: true });

for (const [id, spec] of Object.entries(defs)) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 96" role="img" aria-hidden="true">
  ${base(spec.c1, spec.c2)}
  ${motifSvg(spec.motif, spec.c1, spec.c2)}
</svg>
`;
  fs.writeFileSync(path.join(OUT, `${id}.svg`), svg);
  console.log("wrote", id);
}

console.log(`Generated ${Object.keys(defs).length} feature icons in ${OUT}`);
