#!/usr/bin/env node
/** Erzeugt content/duas/duas.json ausschließlich aus content/duas/dua-*.md */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DUA_DIR = path.join(ROOT, "content/duas");
const DUA_INDEX = path.join(DUA_DIR, "duas.json");
const ORDER_MAP_FILE = path.join(DUA_DIR, "dua-order-map.json");

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
  return (
    (String(markdown).match(
      new RegExp(`#{2,3}\\s*${escaped}\\s*\\n+([\\s\\S]*?)(?=\\n#{2,3}\\s|$)`, "i")
    ) || [])[1] || ""
  );
}

function normalizeArabic(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\u0640/g, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FF]/g, "")
    .trim();
}

function loadOrderMap() {
  if (!fs.existsSync(ORDER_MAP_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ORDER_MAP_FILE, "utf8"));
  } catch (_) {
    return {};
  }
}

function parseDuaFile(file, orderMap = {}) {
  const markdown = fs.readFileSync(path.join(DUA_DIR, file), "utf8");
  const meta = frontmatter(markdown);
  const id = meta.id || file.replace(/\.md$/i, "");
  let order = Number(meta.order);
  if (!Number.isInteger(order) || order < 1) {
    order = Number(orderMap[id]);
  }

  return {
    id,
    order: Number.isInteger(order) ? order : null,
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

function buildDuaIndex({ write = true, strict = true } = {}) {
  const errors = [];
  const orderMap = loadOrderMap();
  const files = fs.existsSync(DUA_DIR)
    ? fs
        .readdirSync(DUA_DIR)
        .filter((name) => /^dua-.*\.md$/i.test(name))
        .sort((a, b) => a.localeCompare(b, "de", { numeric: true }))
    : [];

  const items = [];
  const seen = new Set();
  const orders = new Set();
  const arabicKeys = new Map();

  for (const file of files) {
    const item = parseDuaFile(file, orderMap);
    if (!item.id) {
      errors.push(`FEHLER: ${file} besitzt keine ID.`);
      continue;
    }
    if (seen.has(item.id)) {
      errors.push(`FEHLER: Doppelte ID ${item.id} in ${file}.`);
      continue;
    }
    seen.add(item.id);

    if (!Number.isInteger(item.order) || item.order < 1) {
      errors.push(`FEHLER: ${file} besitzt keine gültige numerische Reihenfolge.`);
    } else if (orders.has(item.order)) {
      errors.push(`FEHLER: Reihenfolge ${item.order} ist doppelt vergeben.`);
    } else {
      orders.add(item.order);
    }

    if (!item.ar || !item.de) {
      errors.push(`FEHLER: ${file} fehlt Arabisch oder Deutsch.`);
    }

    const arKey = normalizeArabic(item.ar);
    if (arKey) {
      if (arabicKeys.has(arKey)) {
        const otherId = arabicKeys.get(arKey);
        const other = items.find((x) => x.id === otherId);
        const involvesNew =
          (Number.isInteger(item.order) && item.order >= 108) ||
          (other && Number.isInteger(other.order) && other.order >= 108);
        if (involvesNew) {
          errors.push(
            `FEHLER: Doppelte Duʿāʾ erkannt: ${otherId} und ${item.id}`
          );
        }
        // Vorbestand-Überschneidungen (order < 108) bleiben unangetastet.
      } else {
        arabicKeys.set(arKey, item.id);
      }
    }

    items.push(item);
  }

  items.sort((a, b) => Number(a.order) - Number(b.order));

  // Content files start after builtins (orders 1–17). Ensure contiguous content range.
  if (orders.size) {
    const minO = Math.min(...orders);
    const maxO = Math.max(...orders);
    for (let expected = minO; expected <= maxO; expected += 1) {
      if (!orders.has(expected)) {
        errors.push(`FEHLER: Reihenfolge ${expected} fehlt.`);
      }
    }
  }

  if (strict && errors.length) {
    const err = new Error(errors.join("\n"));
    err.errors = errors;
    throw err;
  }

  if (write) {
    fs.mkdirSync(path.dirname(DUA_INDEX), { recursive: true });
    // Array format for loadExternalDuas / legacy consumers
    fs.writeFileSync(DUA_INDEX, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  }

  return { items, count: items.length, errors };
}

function run() {
  try {
    const { count, items } = buildDuaIndex({ write: true, strict: true });
    const orders = items.map((i) => i.order);
    console.log(`Duʿāʾ-Index erfolgreich erstellt: ${count} Einträge.`);
    console.log(
      `Order range (content): ${Math.min(...orders)}–${Math.max(...orders)}`
    );
  } catch (error) {
    if (error.errors) console.error(error.errors.join("\n"));
    else console.error(error.stack || error);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { buildDuaIndex, parseDuaFile, DUA_DIR, DUA_INDEX, normalizeArabic };
