#!/usr/bin/env node
/**
 * POST MARKDOWN GUARD: Admin-Publish darf kein kaputtes YAML-Frontmatter speichern.
 * Repariert *-Listen und falsch eingerückte source/links/logo vor dem Upload.
 *
 * Usage: node scripts/post-markdown-guard.js
 */
const { read, createReporter } = require("./lib/guard-report.cjs");

const FM_TOP_KEY =
  "source|links|logo|layout|slides|intro|introTitle|date|id|title|category|topic|scholar|book|author|tags|type";

function repairYamlFrontmatter(markdown) {
  const raw = String(markdown || "");
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return raw;
  const body = match[2] || "";
  const fixed = match[1]
    .split("\n")
    .map((line) => {
      if (/^\*\s+/.test(line)) return line.replace(/^\*\s+/, "- ");
      if (/^\*\s*label:/.test(line)) return line.replace(/^\*\s*/, "  - ");
      const nested = line.match(
        new RegExp(`^(\\s{2,})(${FM_TOP_KEY}:\\s*.*)$`)
      );
      if (nested && !/^\s+-/.test(line)) return nested[2];
      return line;
    })
    .join("\n")
    .replace(/^\* /gm, "- ")
    .replace(new RegExp(`^\\s{4}(${FM_TOP_KEY}):`, "gm"), "$1:")
    .replace(/^\*\s*label:/gm, "  - label:");
  return `---\n${fixed}\n---\n\n${body.trim()}`.trimEnd() + "\n";
}

function parseFrontmatterValue(text, key) {
  const match = String(text || "").match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!match) return "";
  return match[1].replace(/^["']|["']$/g, "").trim();
}

function frontmatterHasLinks(markdown) {
  const block = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---/);
  if (!block) return false;
  const yaml = block[1];
  const links = [];
  let item = null;
  yaml.split(/\r?\n/).forEach((line) => {
    const label = line.match(/^\s*-\s*label:\s*(.*)$/);
    if (label) {
      item = { label: label[1].replace(/^["']|["']$/g, ""), url: "" };
      links.push(item);
      return;
    }
    const url = line.match(/^\s*url:\s*(.*)$/);
    if (url && item) item.url = url[1].replace(/^["']|["']$/g, "");
  });
  return links.some((l) => String(l.url || "").startsWith("http"));
}

function runPostMarkdownGuard() {
  const report = createReporter("POST-MARKDOWN-GUARD");
  const { fail, ok } = report;

  const broken = `---
id: "test-424"
title: "Test"
tags:

* "#Nuzul"
* "#Aqidah"
    source: "Quelle hier"
    links:
* label: "→ Link"
    url: "https://example.com/test"
    logo: "logo-black.png"
---
Body text
`;

  const fixed = repairYamlFrontmatter(broken);
  if (!fixed.includes('- "#Nuzul"')) fail("Repair: Tags * → - fehlgeschlagen");
  else ok("Repair: Tags * → -");
  if (!/^source:/m.test(fixed.split("---")[1])) fail("Repair: source nicht auf Top-Level");
  else ok("Repair: source Top-Level");
  if (!frontmatterHasLinks(fixed)) fail("Repair: links nicht parsebar");
  else ok("Repair: links parsebar");
  if (parseFrontmatterValue(fixed, "source") !== "Quelle hier") fail("Repair: source-Wert fehlt");
  else ok("Repair: source-Wert vorhanden");

  for (const file of ["cloudflare/worker.js", "admin/index.html"]) {
    const src = read(file);
    if (!src.includes("function repairYamlFrontmatter")) {
      fail(`${file}: repairYamlFrontmatter fehlt`);
    } else {
      ok(`${file}: repairYamlFrontmatter vorhanden`);
    }
    if (!src.includes("repairYamlFrontmatter(repairMarkdownStructure")) {
      fail(`${file}: normalize muss repairYamlFrontmatter aufrufen`);
    } else {
      ok(`${file}: normalize ruft repairYamlFrontmatter auf`);
    }
  }

  const worker = read("cloudflare/worker.js");
  if (!worker.includes("function normalizeMarkdownForStorage")) {
    fail("worker.js: normalizeMarkdownForStorage für post/update fehlt");
  } else {
    ok("worker.js: normalizeMarkdownForStorage vorhanden");
  }
  if (!/async function updateExistingPost[\s\S]*normalizeMarkdownForStorage/.test(worker)) {
    fail("worker.js: updateExistingPost muss normalizeMarkdownForStorage nutzen");
  } else {
    ok("worker.js: updateExistingPost normalisiert Markdown");
  }

  return report.failed;
}

if (require.main === module) {
  const failed = runPostMarkdownGuard();
  if (failed) {
    console.error(`\n${failed} Post-Markdown-Guard-Prüfung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("\nPost-Markdown-Schutz: alle Prüfungen bestanden.");
}

module.exports = { repairYamlFrontmatter, runPostMarkdownGuard };
