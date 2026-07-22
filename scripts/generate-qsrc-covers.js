#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BOOKS_PATH = path.join(ROOT, "data", "books-library.json");
const AUTHORITY_PATH = path.join(ROOT, "data", "library-authority.json");
const COVERS_DIRS = [
  path.join(ROOT, "test", "assets", "library", "covers", "qsrc"),
  path.join(ROOT, "assets", "library", "covers", "qsrc")
];

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

function wrapLines(text, maxLen) {
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
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function coverSvg(book) {
  const colors = paletteForCategory(book.category);
  const titleLines = wrapLines(book.title, 22);
  const authorLines = wrapLines(book.author, 24);
  const category = String(book.category || "Werk").toUpperCase();
  const titleY = 250 - titleLines.length * 8;
  const authorY = 390;
  const titleSvg = titleLines.map((line, i) =>
    `<text x="200" y="${titleY + i * 24}" text-anchor="middle" fill="#f4ecd8" font-family="Georgia,'Times New Roman',serif" font-size="16" font-weight="600">${escXml(line)}</text>`
  ).join("");
  const authorSvg = authorLines.map((line, i) =>
    `<text x="200" y="${authorY + i * 16}" text-anchor="middle" fill="#c9b896" font-family="Georgia,serif" font-size="10" opacity="0.92">${escXml(line)}</text>`
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
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <rect x="16" y="16" width="368" height="568" rx="6" fill="none" stroke="url(#gold)" stroke-width="1.2" opacity="0.55"/>
  <rect x="26" y="26" width="348" height="548" rx="4" fill="none" stroke="url(#gold)" stroke-width="0.6" opacity="0.28"/>
  <text x="200" y="120" text-anchor="middle" fill="#e8d49a" font-family="Georgia,serif" font-size="10" letter-spacing="2.2">${escXml(category)}</text>
  <line x1="90" y1="136" x2="310" y2="136" stroke="url(#gold)" stroke-width="0.8" opacity="0.45"/>
  ${titleSvg}
  <line x1="90" y1="360" x2="310" y2="360" stroke="url(#gold)" stroke-width="0.6" opacity="0.35"/>
  <text x="200" y="378" text-anchor="middle" fill="#9a8b6e" font-family="Georgia,serif" font-size="8" letter-spacing="1.4">AUTOR</text>
  ${authorSvg}
  <text x="200" y="548" text-anchor="middle" fill="#9a8b6e" font-family="Georgia,serif" font-size="9" letter-spacing="1.4">QUELLENBIBLIOTHEK</text>
</svg>
`;
}

function loadBooks() {
  const byId = new Map();
  if (fs.existsSync(AUTHORITY_PATH)) {
    const authority = JSON.parse(fs.readFileSync(AUTHORITY_PATH, "utf8"));
    for (const work of authority.works || []) {
      if (!work?.id || work.verified === false) continue;
      byId.set(work.id, {
        id: work.id,
        title: work.title,
        author: work.author,
        category: work.category
      });
    }
  }
  if (fs.existsSync(BOOKS_PATH)) {
    const data = JSON.parse(fs.readFileSync(BOOKS_PATH, "utf8"));
    for (const book of data.books || []) {
      if (!book?.id) continue;
      byId.set(book.id, {
        id: book.id,
        title: book.title || byId.get(book.id)?.title,
        author: book.author || byId.get(book.id)?.author,
        category: book.category || byId.get(book.id)?.category
      });
    }
  }
  return [...byId.values()];
}

function main() {
  const books = loadBooks();
  if (!books.length) {
    console.log("generate-qsrc-covers: keine Bücher gefunden, übersprungen.");
    return;
  }
  let count = 0;
  for (const book of books) {
    if (!book?.id || !book.title) continue;
    const svg = coverSvg(book);
    for (const dir of COVERS_DIRS) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${book.id}.svg`), svg);
    }
    count += 1;
  }
  console.log(`generate-qsrc-covers: ${count} Buchcover in ${COVERS_DIRS.length} Verzeichnisse erstellt.`);
}

main();
