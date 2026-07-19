#!/usr/bin/env node
/**
 * DAR AL TAWḤĪD – tägliche Inhalte ohne Wiederholung.
 * Jeder Duʿāʾ- und Beitrags-Pool wird vollständig durchlaufen,
 * bevor ein bereits verwendeter Inhalt erneut ausgewählt werden darf.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const TIME_ZONE = "Europe/Berlin";
const POSTS_INDEX_PATH = path.join(ROOT, "content/posts/posts-index.json");
const POSTS_DIR = path.join(ROOT, "content/posts");
const DUA_POOL_PATH = path.join(ROOT, "content/duas/daily-dua-pool.json");
const DAILY_PATH = path.join(ROOT, "content/updates/daily.json");
const ROTATION_PATH = path.join(ROOT, "content/admin/daily-content-rotation.json");

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function dayKey(date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function uniqueByKey(items, getKey) {
  const seen = new Set();
  const result = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = String(getKey(item) || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function stableIndex(seed, size) {
  if (size <= 1) return 0;
  let hash = 2166136261;
  for (const char of String(seed || "")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % size;
}

function pickWithoutRepeat(items, getKey, rawState, fallbackLastKey, seed) {
  const pool = uniqueByKey(items, getKey);
  if (!pool.length) return { item: null, state: null };

  const validKeys = new Set(pool.map((item) => String(getKey(item))));
  const previous = rawState && typeof rawState === "object" ? rawState : {};
  let cycle = Number.isInteger(previous.cycle) && previous.cycle >= 0 ? previous.cycle : 0;
  let lastKey = String(previous.lastKey || fallbackLastKey || "").trim();
  if (!validKeys.has(lastKey)) lastKey = "";

  let usedKeys = uniqueByKey(
    (Array.isArray(previous.usedKeys) ? previous.usedKeys : []).map((key) => ({ key: String(key) })),
    (item) => item.key
  )
    .map((item) => item.key)
    .filter((key) => validKeys.has(key));

  // Beim ersten Lauf gilt der aktuell veröffentlichte Inhalt bereits als verwendet.
  if (lastKey && !usedKeys.includes(lastKey)) usedKeys.push(lastKey);

  let available = pool.filter((item) => !usedKeys.includes(String(getKey(item))));
  if (!available.length) {
    cycle += 1;
    usedKeys = [];
    // Kein identischer Inhalt direkt an der Grenze zwischen zwei Durchläufen.
    available = pool.length > 1
      ? pool.filter((item) => String(getKey(item)) !== lastKey)
      : pool.slice();
  }

  const index = stableIndex(`${seed}|${cycle}|${available.length}`, available.length);
  const item = available[index];
  const selectedKey = String(getKey(item));
  if (!usedKeys.includes(selectedKey)) usedKeys.push(selectedKey);

  return {
    item,
    state: {
      cycle,
      usedKeys,
      lastKey: selectedKey,
      poolSize: pool.length,
      remaining: Math.max(0, pool.length - usedKeys.length),
      updatedAt: new Date().toISOString()
    }
  };
}

function parseFrontMatterValue(markdown, key) {
  const text = String(markdown || "");
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return "";
  const line = match[1].match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"));
  return line ? line[1].trim() : "";
}

function parsePost(file) {
  const fullPath = path.join(POSTS_DIR, file);
  const markdown = fs.readFileSync(fullPath, "utf8");
  const body = markdown.replace(/^---[\s\S]*?---/, "").trim();
  const firstParagraph = body.split(/\n\s*\n/).find((part) => part.trim()) || "";
  const snippet = firstParagraph
    .replace(/^>\s*/gm, "")
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

  const id = parseFrontMatterValue(markdown, "id") || file.replace(/\.md$/i, "");
  const title = parseFrontMatterValue(markdown, "title").replace(/^📖\s*/, "") || id;
  return {
    id,
    title,
    file,
    category: parseFrontMatterValue(markdown, "category"),
    scholar: parseFrontMatterValue(markdown, "scholar"),
    snippet
  };
}

function loadPostFiles() {
  const index = readJson(POSTS_INDEX_PATH, {});
  return uniqueByKey(
    (Array.isArray(index.files) ? index.files : [])
      .map((entry) => (typeof entry === "string" ? entry : entry?.name))
      .filter((name) => name && String(name).endsWith(".md"))
      .filter((name) => fs.existsSync(path.join(POSTS_DIR, name))),
    (name) => name
  );
}

function run() {
  const now = new Date();
  const date = dayKey(now);
  const previousDaily = readJson(DAILY_PATH, {});
  const rotation = readJson(ROTATION_PATH, {
    version: 1,
    recommendation: {},
    dua: {}
  });

  // Bei einem erneuten Lauf am selben Tag nichts neu auswählen.
  if (
    previousDaily?.date === date &&
    previousDaily?.source === "dar-daily-no-repeat-rotation" &&
    previousDaily?.recommendation?.id &&
    previousDaily?.dua?.id
  ) {
    console.log(`Tagesrotation ${date} ist bereits vollständig erstellt.`);
    return;
  }

  const postFiles = loadPostFiles();
  const duaPool = uniqueByKey(readJson(DUA_POOL_PATH, []), (item) => item?.id);

  const recommendationPick = pickWithoutRepeat(
    postFiles,
    (file) => file,
    rotation.recommendation,
    previousDaily?.recommendation?.file,
    `${date}|recommendation`
  );

  const duaPick = pickWithoutRepeat(
    duaPool,
    (item) => item?.id,
    rotation.dua,
    previousDaily?.dua?.id,
    `${date}|dua`
  );

  const recommendation = recommendationPick.item ? parsePost(recommendationPick.item) : null;
  const selectedDua = duaPick.item;
  const dua = selectedDua
    ? {
        id: selectedDua.id,
        title: selectedDua.title,
        snippet: selectedDua.snippet || "",
        category: selectedDua.cat || selectedDua.category || ""
      }
    : null;

  if (!recommendation && !dua) {
    throw new Error("Weder Beiträge noch Duʿāʾ für die Tagesrotation gefunden.");
  }

  const nextRotation = {
    version: 1,
    updatedAt: now.toISOString(),
    date,
    recommendation: recommendationPick.state || rotation.recommendation || {},
    dua: duaPick.state || rotation.dua || {}
  };

  const daily = {
    date,
    timezone: TIME_ZONE,
    generated: now.toISOString(),
    source: "dar-daily-no-repeat-rotation",
    recommendation,
    dua,
    rotation: {
      recommendation: recommendationPick.state
        ? {
            cycle: recommendationPick.state.cycle,
            poolSize: recommendationPick.state.poolSize,
            remaining: recommendationPick.state.remaining
          }
        : null,
      dua: duaPick.state
        ? {
            cycle: duaPick.state.cycle,
            poolSize: duaPick.state.poolSize,
            remaining: duaPick.state.remaining
          }
        : null
    }
  };

  writeJson(ROTATION_PATH, nextRotation);
  writeJson(DAILY_PATH, daily);

  console.log(
    `Tagesrotation ${date}: Empfehlung ${recommendation?.id || "–"} ` +
    `(${recommendationPick.state?.remaining ?? "–"} verbleibend) · ` +
    `Duʿāʾ ${dua?.id || "–"} (${duaPick.state?.remaining ?? "–"} verbleibend)`
  );
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.stack || error.message || error);
    process.exit(1);
  }
}

module.exports = {
  dayKey,
  pickWithoutRepeat,
  run
};
