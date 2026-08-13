#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const REGISTRY_PATH = path.join(ROOT, "q", "_registry", "shortlinks.json");
const NEXT_PATH = path.join(ROOT, "q", "_registry", "next-number.txt");
const TEMPLATE_PATH = path.join(ROOT, "q", "_registry", "shortlink-template.html");
const Q_ROOT = path.join(ROOT, "q");
const Q_INDEX_PATH = path.join(ROOT, "q", "index.html");

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Nutzung: node q/_registry/register-shortlink.mjs --target /quelle/.../ --title \"...\" --postReference statement-002 --summary \"...\" --source \"...\"");
    return;
  }

  const targetPath = requireArg(args, "target");
  const title = requireArg(args, "title");
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
    .replaceAll("__TARGET_PATH__", targetPath);
  await fs.writeFile(qIndex, html, "utf8");

  registry.links = Array.isArray(registry.links) ? registry.links : [];
  registry.links.push({
    number,
    shortPath,
    targetPath,
    title,
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

  console.log(`OK: ${shortPath} -> ${targetPath}`);
}

main().catch((err) => {
  console.error(`FEHLER: ${err.message}`);
  process.exit(1);
});
