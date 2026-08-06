#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DUA_DIR = path.join(ROOT, "content", "duas");
const INDEX_HTML = path.join(ROOT, "test", "index.html");
const POOL_FILE = path.join(DUA_DIR, "daily-dua-pool.json");
const NEW_ORDER_MIN = 108;

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

function normalizeGerman(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clean(value, max) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max || 1e9);
}

function section(markdown, name) {
  const re = new RegExp(`##\\s*${name}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  const m = String(markdown || "").match(re);
  return m ? m[1].trim() : "";
}

function parseFrontmatter(raw) {
  const text = String(raw || "").replace(/^\uFEFF/, "");
  if (!text.startsWith("---")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: text };
  const fm = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\s*\n/, "");
  const meta = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    meta[m[1]] = val;
  }
  return { meta, body };
}

function extractBuiltinDuas(htmlPath) {
  if (!fs.existsSync(htmlPath)) return [];
  const html = fs.readFileSync(htmlPath, "utf8");
  const m = html.match(/const\s+DUAS\s*=\s*\[([\s\S]*?)\];/);
  if (!m) return [];
  const out = [];
  const block = m[1];
  const objRe = /\{[\s\S]*?\}/g;
  let om;
  while ((om = objRe.exec(block))) {
    const chunk = om[0];
    const id = (chunk.match(/id\s*:\s*["']([^"']+)["']/) || [])[1];
    const ar = (chunk.match(/ar\s*:\s*["']([^"']*)["']/) || [])[1] || "";
    const de = (chunk.match(/de\s*:\s*["']([^"']*)["']/) || [])[1] || "";
    const tr = (chunk.match(/tr\s*:\s*["']([^"']*)["']/) || [])[1] || "";
    const title = (chunk.match(/title\s*:\s*["']([^"']*)["']/) || [])[1] || "";
    const orderRaw = (chunk.match(/order\s*:\s*(\d+)/) || [])[1];
    if (!id) continue;
    out.push({
      id,
      order: orderRaw ? Number(orderRaw) : null,
      ar,
      de,
      tr,
      title,
      source: "builtin"
    });
  }
  return out;
}

function isNewItem(item) {
  return Number.isInteger(item.order) && item.order >= NEW_ORDER_MIN;
}

function main() {
  const errors = [];
  const warnings = [];

  const files = fs
    .readdirSync(DUA_DIR)
    .filter((f) => /^dua-.*\.md$/i.test(f))
    .sort((a, b) => a.localeCompare(b, "en"));

  const contentItems = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(DUA_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const markdown = body || raw;
    const id = String(meta.id || file.replace(/\.md$/i, "")).trim();
    const order = Number(meta.order);
    const ar = clean(section(markdown, "Arabisch"), 2000);
    const tr = clean(section(markdown, "Lautschrift"), 2000);
    const de = clean(section(markdown, "Deutsch"), 2000);
    const src = meta.src || clean(section(markdown, "Quelle"), 500);
    contentItems.push({
      id,
      order,
      title: meta.title || id,
      ar,
      tr,
      de,
      src,
      file,
      source: "content"
    });
  }

  const builtins = extractBuiltinDuas(INDEX_HTML);
  if (!builtins.length) {
    warnings.push("Warnung: Keine Builtin-DUAS in test/index.html gefunden.");
  }

  const all = [...builtins, ...contentItems];
  const byId = new Map();
  const byOrder = new Map();
  const byAr = new Map();
  const byDe = new Map();

  for (const item of all) {
    if (!item.id) {
      errors.push(`FEHLER: Eintrag ohne ID (${item.file || item.source}).`);
      continue;
    }
    if (byId.has(item.id)) {
      errors.push(
        `FEHLER: Doppelte Duʿāʾ erkannt: ${byId.get(item.id).id} und ${item.id}`
      );
    } else {
      byId.set(item.id, item);
    }

    if (!Number.isInteger(item.order) || item.order < 1) {
      if (item.source === "content" || item.source === "builtin") {
        errors.push(
          `FEHLER: ${item.file || item.id} besitzt keine gültige numerische Reihenfolge.`
        );
      }
    } else if (byOrder.has(item.order)) {
      errors.push(
        `FEHLER: Reihenfolge ${item.order} ist doppelt vergeben (${byOrder.get(item.order).id} und ${item.id}).`
      );
    } else {
      byOrder.set(item.order, item);
    }

    if (item.source === "content") {
      if (!item.ar) errors.push(`FEHLER: ${item.file} fehlt Abschnitt Arabisch.`);
      if (!item.de) errors.push(`FEHLER: ${item.file} fehlt Abschnitt Deutsch.`);
      if (!item.src) errors.push(`FEHLER: ${item.file} fehlt Quelle.`);
    }

    const arKey = normalizeArabic(item.ar);
    if (arKey) {
      if (byAr.has(arKey)) {
        const other = byAr.get(arKey);
        if (isNewItem(item) || isNewItem(other)) {
          errors.push(
            `FEHLER: Doppelte Duʿāʾ erkannt: ${other.id} und ${item.id}`
          );
        } else {
          warnings.push(
            `Vorbestand-Hinweis: gleicher arabischer Text bei ${other.id} und ${item.id} (unangetastet).`
          );
        }
      } else {
        byAr.set(arKey, item);
      }
    }

    const deKey = normalizeGerman(item.de);
    if (deKey && deKey.length > 24) {
      if (byDe.has(deKey)) {
        const other = byDe.get(deKey);
        if (isNewItem(item) || isNewItem(other)) {
          errors.push(
            `FEHLER: Doppelte Duʿāʾ erkannt (Deutsch): ${other.id} und ${item.id}`
          );
        }
      } else {
        byDe.set(deKey, item);
      }
    }
  }

  // Substring containment: hard-fail only when a NEW entry is involved
  const arEntries = [...byAr.entries()].filter(([k]) => k.length >= 20);
  for (let i = 0; i < arEntries.length; i += 1) {
    for (let j = i + 1; j < arEntries.length; j += 1) {
      const [ka, ia] = arEntries[i];
      const [kb, ib] = arEntries[j];
      if (!(ka.includes(kb) || kb.includes(ka))) continue;
      if (isNewItem(ia) || isNewItem(ib)) {
        errors.push(
          `FEHLER: Doppelte Duʿāʾ erkannt (Teilfassung): ${ia.id} und ${ib.id}`
        );
      }
    }
  }

  // Daily pool: duaId refs only
  if (fs.existsSync(POOL_FILE)) {
    let pool = [];
    try {
      pool = JSON.parse(fs.readFileSync(POOL_FILE, "utf8"));
    } catch (_) {
      errors.push("FEHLER: daily-dua-pool.json ist ungültiges JSON.");
      pool = [];
    }
    if (!Array.isArray(pool)) {
      errors.push("FEHLER: daily-dua-pool.json muss ein Array sein.");
    } else {
      for (const entry of pool) {
        if (entry && typeof entry === "object" && entry.duaId) {
          if (!byId.has(entry.duaId)) {
            errors.push(
              `FEHLER: daily-dua-pool verweist auf unbekannte duaId ${entry.duaId}`
            );
          }
          continue;
        }
        if (entry && (entry.ar || entry.de || entry.arabic || entry.german)) {
          errors.push(
            "FEHLER: daily-dua-pool enthält Volltext-Kopie statt duaId-Referenz."
          );
          break;
        }
        errors.push(
          "FEHLER: daily-dua-pool-Eintrag ohne duaId (nur kanonische Referenzen erlaubt)."
        );
        break;
      }
    }
  }

  const orderedOk = [...byOrder.keys()].length === all.filter((x) => Number.isInteger(x.order)).length;
  if (orderedOk && byOrder.size) {
    const maxOrder = Math.max(...byOrder.keys());
    for (let expected = 1; expected <= maxOrder; expected += 1) {
      if (!byOrder.has(expected)) {
        errors.push(`FEHLER: Reihenfolge ${expected} fehlt.`);
      }
    }
  }

  const uniqueIds = byId.size;
  const uniqueAr = byAr.size;
  const newCount = contentItems.filter((i) => isNewItem(i)).length;
  const existingCount = uniqueIds - newCount;

  console.log("=== Duʿāʾ Validierungsbericht ===");
  console.log(`Builtin-Duʿāʾ: ${builtins.length}`);
  console.log(`Content-Duʿāʾ (MD): ${contentItems.length}`);
  console.log(`Bestehende einzigartige Duʿāʾ (IDs): ${existingCount}`);
  console.log(`Neue einzigartige Duʿāʾ: ${newCount}`);
  console.log(`Gesamtbestand: ${uniqueIds}`);
  console.log(`Eindeutige arabische Texte: ${uniqueAr}`);
  console.log(
    `Doppelte IDs: ${errors.filter((e) => e.includes("Doppelte") && e.includes("und") && !e.includes("Deutsch") && !e.includes("Teilfassung") && !e.includes("Reihenfolge")).length}`
  );
  console.log(
    `Doppelte Reihenfolgen: ${errors.filter((e) => e.includes("Reihenfolge") && e.includes("doppelt")).length}`
  );
  console.log(
    `Verdächtige Teilfassungen: ${errors.filter((e) => e.includes("Teilfassung")).length}`
  );
  console.log(
    `Fehlende Quellen: ${errors.filter((e) => e.includes("fehlt Quelle")).length}`
  );
  console.log(
    `Fehlende Abschnitte: ${errors.filter((e) => e.includes("fehlt Abschnitt")).length}`
  );
  if (byOrder.size) {
    const maxO = Math.max(...byOrder.keys());
    console.log(`Reihenfolge: 1–${maxO} ohne Lücken (geprüft)`);
    console.log(`Höchste bestehende Reihenfolge: ${maxO}`);
    console.log(`Nächste zulässige Reihenfolge: ${maxO + 1}`);
  }

  if (warnings.length) console.warn("\n" + warnings.join("\n"));

  if (errors.length) {
    console.error("\n" + errors.join("\n"));
    console.error("\nValidierung fehlgeschlagen");
    process.exit(1);
  }

  console.log("\nValidierung bestanden");
}

main();
