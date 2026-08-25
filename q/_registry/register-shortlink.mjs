#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const REGISTRY_PATH = path.join(ROOT, "q", "_registry", "shortlinks.json");
const NEXT_PATH = path.join(ROOT, "q", "_registry", "next-number.txt");
const TEMPLATE_PATH = path.join(ROOT, "q", "_registry", "shortlink-template.html");
const Q_ROOT = path.join(ROOT, "q");
const Q_INDEX_PATH = path.join(ROOT, "q", "index.html");
const Q_README_PATH = path.join(ROOT, "q", "README.md");

function parseArgs(argv) {
  const args = { updateEntry: true };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    if (key === "--help") {
      args.help = true;
      continue;
    }
    if (key === "--no-update-q-index") {
      args.updateEntry = false;
      continue;
    }
    const val = argv[i + 1];
    if (!val || val.startsWith("--")) throw new Error(`Fehlender Wert für ${key}`);
    args[key.slice(2)] = val;
    i += 1;
  }
  return args;
}

function requireArg(args, name) {
  const value = String(args[name] || "").trim();
  if (!value) throw new Error(`Pflichtparameter fehlt: --${name}`);
  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function utcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function ensureTargetPath(targetPath) {
  const cleaned = String(targetPath || "").trim();
  if (!cleaned.startsWith("/")) throw new Error("target muss mit / beginnen, z. B. /quelle/meine-seite/");
  const full = path.join(ROOT, cleaned);
  try {
    await fs.access(full);
  } catch {
    throw new Error(`Zielpfad nicht gefunden: ${cleaned}`);
  }
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, data) {
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function updateQIndex(shortPath) {
  let html = await fs.readFile(Q_INDEX_PATH, "utf8");
  html = html.replace(/content="0;url=([^"]+)"/, `content="0;url=${shortPath}"`);
  html = html.replace(/location\.replace\("([^"]+)"\);/, `location.replace("${shortPath}");`);
  html = html.replace(/<a href="([^"]+)">([^<]+)<\/a>/, `<a href="${shortPath}">${shortPath}</a>`);
  await fs.writeFile(Q_INDEX_PATH, html, "utf8");
}

function readmeTopic(entry) {
  return entry.topic || entry.title || `Quelle ${entry.number}`;
}

function readmeSpeaker(entry) {
  return entry.speaker || "siehe Titel";
}

async function updateQReadme(registry) {
  const activeLinks = [...(registry.links || [])]
    .filter((entry) => entry && entry.status !== "archived")
    .sort((a, b) => Number(a.number) - Number(b.number));
  const rows = activeLinks.map((entry) => {
    return `| \`q/${entry.number}\` | ${readmeTopic(entry)} | \`${readmeSpeaker(entry)}\` | ${entry.statementSummary || ""} |`;
  });
  const readme = `# DAR AL TAWḤĪD Quellenlinks

Dieser Ordner ist die zentrale Ablage für alle nummerierten Quellenlinks.

## Regel

- Öffentlich sichtbar bleibt immer nur: \`dar-al-tawhid.de/q/<nummer>\`
- Die Ordnernamen bleiben technisch kurz: \`q/1\`, \`q/2\`, \`q/3\`, ...
- Die GitHub-Uebersicht steht hier in dieser Datei: Nummer, Thema, Sprecher und Kernaussage.
- Neue Quellenlinks werden immer fortlaufend angelegt und in \`q/_registry/shortlinks.json\` eingetragen.

## Aktuelle Quellenlinks

| Nummer | Thema | Sprecher / Überlieferer | Kernaussage |
| --- | --- | --- | --- |
${rows.join("\n")}

## Sonderbereiche

- \`q/_registry/\` ist nur Verwaltung: Nummerierung, Vorlage und Registry.
- \`q/i/\` ist ein alter technischer Kurzlink und kein nummerierter Quellenlink.
- \`q/mawlid-bidah/\` ist ein Themen-Hub und kein nummerierter Quellenlink.

Neue nummerierte Quellenlinks gehören immer in \`q/<nummer>/\`.
`;
  await fs.writeFile(Q_README_PATH, readme, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Nutzung: node q/_registry/register-shortlink.mjs --target /quelle/.../ --title \"...\" --topic \"...\" --speaker \"...\" --postReference statement-002 --summary \"...\" --source \"...\"");
    return;
  }

  const targetPath = requireArg(args, "target");
  const title = requireArg(args, "title");
  const topic = requireArg(args, "topic");
  const speaker = requireArg(args, "speaker");
  const postReference = requireArg(args, "postReference");
  const statementSummary = requireArg(args, "summary");
  const sourceLabel = requireArg(args, "source");
  await ensureTargetPath(targetPath);

  const registry = await readJson(REGISTRY_PATH);
  const rawNext = String(await fs.readFile(NEXT_PATH, "utf8")).trim();
  const number = Number(rawNext);
  if (!Number.isInteger(number) || number < 1) throw new Error("Ungültiger Wert in next-number.txt");

  const shortPath = `/q/${number}/`;
  const qDir = path.join(Q_ROOT, String(number));
  const qIndex = path.join(qDir, "index.html");
  await fs.mkdir(qDir, { recursive: true });

  const tpl = await fs.readFile(TEMPLATE_PATH, "utf8");
  const html = tpl
    .replaceAll("__NUMBER__", String(number))
    .replaceAll("__TARGET_PATH__", escapeHtml(targetPath))
    .replaceAll("__TITLE__", escapeHtml(title))
    .replaceAll("__SUMMARY__", escapeHtml(statementSummary))
    .replaceAll("__SOURCE_LABEL__", escapeHtml(sourceLabel))
    .replaceAll("__POST_REFERENCE__", escapeHtml(postReference));
  await fs.writeFile(qIndex, html, "utf8");

  registry.links = Array.isArray(registry.links) ? registry.links : [];
  registry.links.push({
    number,
    shortPath,
    targetPath,
    title,
    topic,
    speaker,
    postReference,
    statementSummary,
    sourceLabel,
    status: "active",
    createdAt: utcNow()
  });
  registry.nextNumber = number + 1;
  registry.updatedAt = utcNow();
  await writeJson(REGISTRY_PATH, registry);
  await fs.writeFile(NEXT_PATH, `${number + 1}\n`, "utf8");

  if (args.updateEntry) await updateQIndex(shortPath);
  await updateQReadme(registry);

  console.log(`OK: ${shortPath} -> ${targetPath}`);
}

main().catch((err) => {
  console.error(`FEHLER: ${err.message}`);
  process.exit(1);
});
