#!/usr/bin/env node
/**
 * Prüft ob der öffentliche Live-Katalog mit dem Repo übereinstimmt.
 * Wird vom Deploy-Watchdog und verify-live-deploy genutzt.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const CATALOG_PATH = process.env.LIBRARY_CATALOG_PATH || "data/library-publications.json";

async function fetchJson(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function headOk(url) {
  const res = await fetch(url, { method: "HEAD", cache: "no-store" });
  return res.ok;
}

function readRepoCatalog() {
  const full = path.join(ROOT, CATALOG_PATH);
  if (!fs.existsSync(full)) throw new Error(`${CATALOG_PATH} fehlt im Repo`);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

async function checkLibraryLiveParity(options = {}) {
  const bust = Date.now();
  const repoCatalog = options.repoCatalog || readRepoCatalog();
  const liveCatalog = await fetchJson(`${SITE_URL}/${CATALOG_PATH}?v=${bust}`);
  const repoUpdatedAt = String(repoCatalog.updatedAt || "");
  const liveUpdatedAt = String(liveCatalog.updatedAt || "");
  const stale = repoUpdatedAt && liveUpdatedAt && repoUpdatedAt !== liveUpdatedAt;

  const repoIds = new Set((repoCatalog.publications || []).map((p) => p.id));
  const liveIds = new Set((liveCatalog.publications || []).map((p) => p.id));
  const missingOnLive = [...repoIds].filter((id) => !liveIds.has(id));

  const online = new Set(["published", "updated", "preparing"]);
  const assetChecks = [];
  for (const pub of repoCatalog.publications || []) {
    if (!online.has(String(pub.status || ""))) continue;
    const pdfUrl = String(pub.pdfUrl || "").trim();
    if (!pdfUrl) continue;
    const ok = await headOk(`${SITE_URL}${pdfUrl}?v=${bust}`);
    assetChecks.push({ id: pub.id, pdfUrl, ok });
  }

  const brokenAssets = assetChecks.filter((item) => !item.ok);
  const ok = !stale && !missingOnLive.length && !brokenAssets.length;

  return {
    ok,
    site: SITE_URL,
    repoUpdatedAt,
    liveUpdatedAt,
    stale,
    missingOnLive,
    brokenAssets,
    diagnosis: ok
      ? ""
      : stale
        ? "Live-Katalog ist veraltet (Deploy fehlgeschlagen oder Cache)."
        : missingOnLive.length
          ? `Live-Katalog fehlt: ${missingOnLive.join(", ")}`
          : brokenAssets.length
            ? `PDF nicht öffentlich: ${brokenAssets.map((x) => x.id).join(", ")}`
            : "Bibliothek-Live-Parität fehlgeschlagen"
  };
}

async function main() {
  const result = await checkLibraryLiveParity();
  if (result.ok) {
    console.log(`library-live-parity OK (${result.repoUpdatedAt})`);
    return;
  }
  console.error("library-live-parity FAIL:", result.diagnosis);
  if (result.missingOnLive.length) console.error("missing:", result.missingOnLive.join(", "));
  if (result.brokenAssets.length) {
    console.error("broken PDFs:", result.brokenAssets.map((x) => x.id).join(", "));
  }
  process.exit(1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { checkLibraryLiveParity };
