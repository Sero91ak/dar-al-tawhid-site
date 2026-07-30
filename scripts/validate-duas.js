#!/usr/bin/env node
/** Validiert content/duas/dua-*.md vor dem Build */

const fs = require("node:fs");
const path = require("node:path");
const { parseDuaFile, DUA_DIR } = require("./build-dua-index");

const ALLOWED_TYPES = new Set([
  "Qurʾān",
  "Sunnah",
  "Athar – Ṣaḥābī",
  "Athar – Salaf"
]);

const REQUIRED_FIELDS = ["id", "type", "cat", "title", "occasion", "src"];
const REQUIRED_SECTIONS = ["Arabisch", "Lautschrift", "Deutsch", "Quelle"];

function readMarkdown(file) {
  return fs.readFileSync(path.join(DUA_DIR, file), "utf8");
}

function hasSection(markdown, heading) {
  const escaped = String(heading).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^#{2,3}\\s*${escaped}\\s*$`, "im").test(markdown);
}

function sectionText(markdown, heading) {
  const escaped = String(heading).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (String(markdown).match(new RegExp(`#{2,3}\\s*${escaped}\\s*\\n+([\\s\\S]*?)(?=\\n#{2,3}\\s|$)`, "i")) || [])[1] || "";
}

function frontmatter(markdown) {
  const block = (String(markdown).match(/^---\s*\n([\s\S]*?)\n---/) || [])[1] || "";
  const out = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*["']?([\s\S]*?)["']?\s*$/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

function normalizeArabic(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[^\u0600-\u06FF]/g, "")
    .trim();
}

function normalizeGerman(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a, b) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  const leftWords = new Set(left.split(" ").filter((w) => w.length > 3));
  const rightWords = new Set(right.split(" ").filter((w) => w.length > 3));
  if (!leftWords.size || !rightWords.size) return false;
  let overlap = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) overlap += 1;
  }
  const ratio = overlap / Math.min(leftWords.size, rightWords.size);
  return ratio >= 0.85;
}

function shortId(id) {
  const match = String(id || "").match(/^(dua-\d+)/i);
  return match ? match[1] : id;
}

function validate() {
  const files = fs.existsSync(DUA_DIR)
    ? fs.readdirSync(DUA_DIR)
        .filter((name) => /^dua-.*\.md$/i.test(name))
        .sort((a, b) => a.localeCompare(b, "de", { numeric: true }))
    : [];

  const errors = [];
  const parsed = [];

  for (const file of files) {
    const markdown = readMarkdown(file);
    const meta = frontmatter(markdown);
    const item = parseDuaFile(file);
    const expectedId = file.replace(/\.md$/i, "");

    for (const field of REQUIRED_FIELDS) {
      if (!String(meta[field] || "").trim()) {
        errors.push(`FEHLER: ${file} fehlt Pflichtfeld "${field}".`);
      }
    }

    for (const section of REQUIRED_SECTIONS) {
      if (!hasSection(markdown, section) || !String(sectionText(markdown, section)).trim()) {
        errors.push(`FEHLER: ${file} fehlt Abschnitt "## ${section}".`);
      }
    }

    if (meta.id && meta.id !== expectedId) {
      errors.push(`FEHLER: ${file} hat ID "${meta.id}", erwartet "${expectedId}".`);
    }

    if (meta.type && !ALLOWED_TYPES.has(meta.type)) {
      errors.push(`FEHLER: ${file} hat ungültigen Typ "${meta.type}".`);
    }

    if (/^Athar\s*[–-]/i.test(meta.type || "") && !String(meta.speaker || "").trim()) {
      errors.push(`FEHLER: ${file} vom Typ "${meta.type}" benötigt Feld "speaker".`);
    }

    parsed.push({ file, item, meta });
  }

  const byId = new Map();
  const byFile = new Map();
  const byArabic = new Map();
  const byGerman = new Map();

  for (const entry of parsed) {
    const { file, item } = entry;
    const id = item.id;

    if (byId.has(id)) {
      errors.push(`FEHLER: Doppelte ID "${id}" in ${byId.get(id)} und ${file}.`);
    } else {
      byId.set(id, file);
    }

    if (byFile.has(file)) {
      errors.push(`FEHLER: Doppelter Dateiname ${file}.`);
    } else {
      byFile.set(file, id);
    }

    const ar = normalizeArabic(item.ar);
    if (ar) {
      if (byArabic.has(ar)) {
        errors.push(`FEHLER: Duʿāʾ ${shortId(byArabic.get(ar))} und ${shortId(id)} enthalten denselben arabischen Text.`);
      } else {
        byArabic.set(ar, id);
      }
    }

    const de = normalizeGerman(item.de);
    if (de) {
      if (byGerman.has(de)) {
        errors.push(`FEHLER: Duʿāʾ ${shortId(byGerman.get(de))} und ${shortId(id)} enthalten denselben deutschen Text.`);
      } else {
        byGerman.set(de, id);
      }
    }
  }

  for (let i = 0; i < parsed.length; i += 1) {
    for (let j = i + 1; j < parsed.length; j += 1) {
      const a = parsed[i].item;
      const b = parsed[j].item;
      if (titleSimilarity(a.title, b.title) && normalizeArabic(a.ar) === normalizeArabic(b.ar)) {
        errors.push(`FEHLER: Duʿāʾ ${shortId(a.id)} und ${shortId(b.id)} haben nahezu identischen Titel und arabischen Text.`);
      }
    }
  }

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  console.log(`Duʿāʾ-Validierung bestanden: ${parsed.length} Dateien.`);
}

if (require.main === module) {
  validate();
}

module.exports = { validate };
