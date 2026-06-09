#!/usr/bin/env node
/**
 * Baut content/tafsir/de/001.json … 114.json — ausschließlich auf Deutsch.
 * Quellen: Ibn Kathīr, as-Saʿdī, Ibn ʿAbbās (deutsche Übertragung) + Curated-Overrides.
 *
 * Hinweis: Kein arabischer API-Rohimport. Vollständige deutsche Band-Texte
 * (z. B. DIDI / Darulkitab) können später ergänzt werden.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const script = path.join(__dirname, "build-tafsir-de.js");
const arg = process.argv[2] || "1-114";
const result = spawnSync(process.execPath, [script, arg], { stdio: "inherit" });
process.exit(result.status ?? 1);
