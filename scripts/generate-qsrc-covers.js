#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BOOKS_PATH = path.join(ROOT, "data", "books-library.json");
const COVERS_DIR = path.join(ROOT, "test", "assets", "library", "covers", "qsrc");

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function paletteForCategory(category) {
  const key = normalize(category);
  if (key.includes("hadith") || key.includes("fiqh") || key.includes("athar")) {
    return { top: "#0f1f35", mid: "#152a45", bottom: "#1a2230" };
  }
  if (key.includes("bio") || key.includes("rijal") || key.includes("tarikh")) {
    return { top: "#2a1810", mid: "#3a2418", bottom: "#241810" };
  }
  if (key.includes("aqidah") || key.includes("sunnah") || key.includes("widerleg")) {
    return { top: "#241a28", mid: "#322438", bottom: "#1a1420" };
  }
  if (key.includes("tafsir")) {
    return { top: "#102418", mid: "#1a3524", bottom: "#142018" };
  }
  if (key.includes("tawhid")) {
    return { top: "#2a2010", mid: "#3d3018", bottom: "#241c10" };
  }
  return { top: "#14120e", mid: "#1e1a14", bottom: "#100e0a" };
}

function escXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text, maxLen, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLen && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines);
}

function shortCategory(category) {
  const raw = String(category || "Werk");
  const parts = raw.split(/\s+und\s+/i);
  return parts[0].length > 18 ? parts[0].slice(0, 16) + "…" : parts[0];
}

function coverSvg(book) {
  const colors = paletteForCategory(book.category);
  const titleLines = wrapLines(book.title, 11, 2);
  const authorLine = wrapLines(book.author, 20, 1)[0] || "";
  const category = shortCategory(book.category).toUpperCase();
  const titleStartY = 248;
  const titleSvg = titleLines.map((line, i) =>
    `<text x="212" y="${titleStartY + i * 32}" text-anchor="middle" fill="#faf4e4" font-family="Georgia,'Times New Roman',serif" font-size="24" font-weight="700">${escXml(line)}</text>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" role="img" aria-label="Buchcover: ${escXml(book.title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.top}"/>
      <stop offset="55%" stop-color="${colors.mid}"/>
      <stop offset="100%" stop-color="${colors.bottom}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b8944f"/>
      <stop offset="50%" stop-color="#e8d49a"/>
      <stop offset="100%" stop-color="#a67c3d"/>
    </linearGradient>
    <linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0a0806"/>
      <stop offset="100%" stop-color="${colors.top}"/>
    </linearGradient>
    <linearGradient id="shade" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="rgba(0,0,0,.55)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <rect x="0" y="0" width="36" height="600" fill="url(#spine)" opacity="0.94"/>
  <rect x="8" y="48" width="12" height="500" rx="2" fill="url(#gold)" opacity="0.38"/>
  <rect x="22" y="16" width="360" height="568" rx="7" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.64"/>
  <text x="214" y="118" text-anchor="middle" fill="#edd89a" font-family="Georgia,serif" font-size="12" font-weight="700" letter-spacing="1.6">${escXml(category)}</text>
  <line x1="72" y1="136" x2="356" y2="136" stroke="url(#gold)" stroke-width="0.9" opacity="0.5"/>
  ${titleSvg}
  <rect x="36" y="430" width="340" height="150" fill="url(#shade)"/>
  <text x="214" y="468" text-anchor="middle" fill="#b9a57a" font-family="Georgia,serif" font-size="10" font-weight="700" letter-spacing="1.4">AUTOR</text>
  <text x="214" y="498" text-anchor="middle" fill="#efe2c2" font-family="Georgia,serif" font-size="14" font-style="italic">${escXml(authorLine)}</text>
  <text x="214" y="560" text-anchor="middle" fill="#9a8b6e" font-family="Georgia,serif" font-size="8" letter-spacing="1.1">DAR AL TAWḤĪD</text>
</svg>
`;
}

function main() {
  if (!fs.existsSync(BOOKS_PATH)) {
    console.log("generate-qsrc-covers: books-library.json fehlt, übersprungen.");
    return;
  }
  const data = JSON.parse(fs.readFileSync(BOOKS_PATH, "utf8"));
  const books = Array.isArray(data.books) ? data.books : [];
  fs.mkdirSync(COVERS_DIR, { recursive: true });
  let count = 0;
  for (const book of books) {
    if (!book?.id) continue;
    const file = path.join(COVERS_DIR, `${book.id}.svg`);
    fs.writeFileSync(file, coverSvg(book));
    count += 1;
  }
  console.log(`generate-qsrc-covers: ${count} Buchcover erstellt.`);
}

main();
