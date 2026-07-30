#!/usr/bin/env node
/** Erzeugt content/duas/duas.json ausschließlich aus content/duas/dua-*.md */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DUA_DIR = path.join(ROOT, "content/duas");
const DUA_INDEX = path.join(DUA_DIR, "duas.json");

function clean(text, max = 2000) {
  return String(text || "")
    .replace(/^>\s*/gm, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
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

function section(markdown, heading) {
  const escaped = String(heading).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (String(markdown).match(new RegExp(`#{2,3}\\s*${escaped}\\s*\\n+([\\s\\S]*?)(?=\\n#{2,3}\\s|$)`, "i")) || [])[1] || "";
}

function parseDuaFile(file) {
  const markdown = fs.readFileSync(path.join(DUA_DIR, file), "utf8");
  const meta = frontmatter(markdown);
  const id = meta.id || file.replace(/\.md$/i, "");

  return {
    id,
    type: meta.type || "",
    cat: meta.cat || meta.category || "",
    title: meta.title || id,
    occasion: meta.occasion || "",
    ar: clean(section(markdown, "Arabisch"), 2000),
    tr: clean(section(markdown, "Lautschrift"), 2000),
    de: clean(section(markdown, "Deutsch"), 2000),
    src: meta.src || clean(section(markdown, "Quelle"), 500),
    file
  };
}

function buildDuaIndex() {
  const files = fs.existsSync(DUA_DIR)
    ? fs.readdirSync(DUA_DIR)
        .filter((name) => /^dua-.*\.md$/i.test(name))
        .sort((a, b) => a.localeCompare(b, "de", { numeric: true }))
    : [];

  const items = [];
  const seen = new Set();
  for (const file of files) {
    const item = parseDuaFile(file);
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }

  fs.mkdirSync(path.dirname(DUA_INDEX), { recursive: true });
  fs.writeFileSync(DUA_INDEX, `${JSON.stringify(items, null, 2)}\n`, "utf8");

  return { items, count: items.length };
}

function run() {
  const { count } = buildDuaIndex();
  console.log(`Duʿāʾ-Index erfolgreich erstellt: ${count} Einträge.`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.stack || error);
    process.exit(1);
  }
}

module.exports = { buildDuaIndex, parseDuaFile, DUA_DIR, DUA_INDEX };
