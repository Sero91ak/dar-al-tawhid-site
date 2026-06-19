#!/usr/bin/env node
/**
 * Import bulk markdown posts from a ZIP (or folder) into content/posts or staging.
 * Usage:
 *   node scripts/import-bulk-posts.mjs incoming/takfir-bil-umum.zip
 *   node scripts/import-bulk-posts.mjs incoming/takfir-bil-umum.zip --category "Takfīr bi'l-ʿUmūm" --staging
 *   node scripts/import-bulk-posts.mjs incoming/takfir-bil-umum.zip --live --news
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CATEGORY = "Takfīr bi'l-ʿUmūm";

function parseArgs(argv) {
  const args = { source: "", category: DEFAULT_CATEGORY, staging: true, news: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--live") args.staging = false;
    else if (a === "--staging") args.staging = true;
    else if (a === "--news") args.news = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--category") args.category = String(argv[++i] || "").trim();
    else if (!a.startsWith("-") && !args.source) args.source = a;
  }
  return args;
}

function slugify(value) {
  return (
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "beitrag"
  );
}

function frontmatterValue(text, key) {
  const m = String(text || "").match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"));
  return m ? m[1].trim() : "";
}

function applyCategory(markdown, category) {
  const cat = String(category || "").trim();
  if (!cat) return String(markdown || "").trim();
  let out = String(markdown || "").trim();
  const safe = cat.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (/^category:\s/m.test(out)) return out.replace(/^category:\s*["']?.*?["']?\s*$/m, `category: "${safe}"`);
  if (/^---\s*\n/.test(out)) return out.replace(/^---\s*\n/, `---\ncategory: "${safe}"\n`);
  return `---\ncategory: "${safe}"\n---\n\n${out}`;
}

function normalizeMarkdown(markdown, nextNumber) {
  let out = String(markdown || "").trim();
  if (!out) return out;
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z");
  if (/^date:\s*["']?.*?["']?\s*$/m.test(out)) out = out.replace(/^date:\s*["']?.*?["']?\s*$/m, `date: "${iso}"`);
  const id = frontmatterValue(out, "id");
  if (id) {
    const next = String(nextNumber).padStart(3, "0");
    const updated = /-\d{3}$/.test(id) ? id.replace(/-\d{3}$/, `-${next}`) : `${id}-${next}`;
    out = out.replace(/^id:\s*["']?.*?["']?\s*$/m, `id: "${updated}"`);
  }
  return `${out}\n`;
}

function suggestFilename(markdown, nextNumber) {
  const title = frontmatterValue(markdown, "title").replace(/^📖\s*/, "") || "neuer-beitrag";
  const category = frontmatterValue(markdown, "category") || "beitrag";
  return `${slugify(category)}-${String(nextNumber).padStart(3, "0")}-${slugify(title)}.md`;
}

function isBulkMarkdownExcluded(markdown, sourcePath = "") {
  const md = String(markdown || "").trim();
  const base = String(sourcePath || "").split(/[/\\]/).pop() || "";
  if (!md || md.length < 20) return "zu kurz";
  if (/prufbericht|prüfbericht|readme|report|kontrolle|checklist|inhalt(?:sverzeichnis)?/i.test(base)) {
    return "Hilfsdatei im Dateinamen";
  }
  if (/nicht\s+zum\s+Hochladen/i.test(md)) return "interner Hinweis (nicht zum Hochladen)";
  if (/^#\s*Pr[üu]fbericht/m.test(md)) return "Prüfbericht, kein Beitrag";
  if (/Dieser Bericht ist\s+\*\*nicht zum Hochladen\*\*/i.test(md)) return "Prüfbericht, kein Beitrag";
  const title = frontmatterValue(md, "title").replace(/^📖\s*/, "").trim();
  if (!title) {
    if (/^#\s+/.test(md) && !/^(#\s+📖|#\s+Beitrag)/.test(md)) return "kein Titel/Frontmatter";
    if (/^category:\s/m.test(md) && !/^title:\s/m.test(md) && /^#\s+/.test(md)) return "kein title:-Feld";
  }
  return "";
}

function sha1(content) {
  return createHash("sha1").update(content).digest("hex");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function collectMarkdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectMarkdownFiles(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) out.push(full);
  }
  return out.sort((a, b) => a.localeCompare(b, "de"));
}

function extractSource(sourcePath, tmpDir) {
  const abs = path.resolve(sourcePath);
  if (!fs.existsSync(abs)) throw new Error(`Quelle nicht gefunden: ${abs}`);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) return abs;
  if (!/\.zip$/i.test(abs)) throw new Error("Quelle muss .zip oder Ordner sein");
  fs.mkdirSync(tmpDir, { recursive: true });
  execFileSync("unzip", ["-o", abs, "-d", tmpDir], { stdio: "inherit" });
  return tmpDir;
}

function addFocusNews(updatesPath, category, count, dryRun) {
  const data = readJson(updatesPath, { items: [] });
  const items = Array.isArray(data.items) ? data.items : [];
  const news = {
    id: `bulk-${slugify(category)}-${Date.now()}`,
    type: "news",
    title: `Neue Kategorie: ${category}`,
    text: `Assalāmu ʿalaikum,\n\nes wurden ${count} neue Beiträge zum Thema „${category}“ veröffentlicht. Tippe hier, um den Ordner mit allen Aussagen zu öffnen.\n\nBarakallāhu fīkum.`,
    badge: "Neu",
    nav: "topic",
    value: category,
    count,
    createdAt: new Date().toISOString(),
    ttlHours: 24,
    visible: true
  };
  items.unshift(news);
  if (dryRun) {
    console.log("[dry-run] Fokus-News:", news.title);
    return;
  }
  writeJson(updatesPath, { ...data, items });
  console.log(`Fokus-News hinzugefügt: ${updatesPath}`);
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.source) {
    console.error(`Usage: node scripts/import-bulk-posts.mjs <zip-or-folder> [--category "${DEFAULT_CATEGORY}"] [--staging|--live] [--news] [--dry-run]`);
    process.exit(1);
  }

  const postsDir = args.staging ? "content/staging/posts" : "content/posts";
  const updatesPath = args.staging ? "content/staging/updates/current.json" : "content/updates/current.json";
  const indexPath = path.join(ROOT, postsDir, "posts-index.json");
  const indexData = readJson(indexPath, { version: 1, files: [] });
  const files = Array.isArray(indexData.files) ? [...indexData.files] : [];
  let nextNumber = files.length + 1;

  const tmpDir = path.join(os.tmpdir(), `dar-import-${Date.now()}`);
  let sourceDir;
  try {
    sourceDir = extractSource(path.resolve(ROOT, args.source), tmpDir);
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }

  const mdPaths = collectMarkdownFiles(sourceDir);
  if (!mdPaths.length) {
    console.error("Keine .md-Dateien in der ZIP gefunden.");
    process.exit(1);
  }

  console.log(`Gefunden: ${mdPaths.length} Beiträge → ${postsDir}`);
  console.log(`Kategorie: ${args.category}`);
  if (args.dryRun) console.log("Modus: dry-run (keine Dateien schreiben)");

  const imported = [];
  const skipped = [];
  for (const mdPath of mdPaths) {
    const raw = fs.readFileSync(mdPath, "utf8");
    const rel = path.relative(sourceDir, mdPath);
    const skipReason = isBulkMarkdownExcluded(raw, rel);
    if (skipReason) {
      skipped.push({ file: rel, reason: skipReason });
      console.log(`  ⊘ übersprungen (${skipReason}): ${rel}`);
      continue;
    }
    const withCategory = applyCategory(raw, args.category);
    const normalized = normalizeMarkdown(withCategory, nextNumber);
    let filename = suggestFilename(normalized, nextNumber);
    if (files.some((f) => f.name === filename)) {
      filename = `${path.basename(filename, ".md")}-${Date.now()}.md`;
    }
    const dest = path.join(ROOT, postsDir, filename);
    if (args.dryRun) {
      console.log(`  [dry-run] ${filename}`);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, normalized, "utf8");
      const fileSha = sha1(normalized);
      const idx = files.findIndex((f) => f.name === filename);
      const entry = { name: filename, sha: fileSha };
      if (idx >= 0) files[idx] = entry;
      else files.push(entry);
      console.log(`  ✓ ${filename}`);
    }
    imported.push(filename);
    nextNumber += 1;
  }

  if (!args.dryRun) {
    files.sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));
    writeJson(indexPath, {
      version: Number(indexData.version || 1),
      generated: new Date().toISOString(),
      count: files.length,
      files
    });
    console.log(`posts-index.json aktualisiert (${files.length} Einträge)`);
    if (args.news && args.category) addFocusNews(path.join(ROOT, updatesPath), args.category, imported.length, false);
  } else if (args.news) {
    addFocusNews(path.join(ROOT, updatesPath), args.category, imported.length, true);
  }

  if (fs.existsSync(tmpDir)) {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  console.log(`Fertig: ${imported.length} Beiträge${args.staging ? " (Staging)" : " (Live)"}.`);
  if (skipped.length) console.log(`Übersprungen: ${skipped.length} Hilfsdatei(en)/Prüfberichte.`);
}

main();
