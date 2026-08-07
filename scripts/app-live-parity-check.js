#!/usr/bin/env node
/**
 * APP_LIVE_PARITY_CHECK
 * Zentrale Live-Parität: Repo vs. dar-al-tawhid.de für alle registrierten Bereiche.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "APP_LIVE_PARITY";
const LOCK_FILE = "content/admin/app-stability-lock.json";
const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");

function loadMasterLock() {
  const lockPath = path.join(ROOT, LOCK_FILE);
  if (!fs.existsSync(lockPath)) return null;
  return JSON.parse(fs.readFileSync(lockPath, "utf8"));
}

async function fetchText(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

async function checkBuildSyncParity() {
  const bust = Date.now();
  const scope = String(process.env.VERIFY_SCOPE || "both").toLowerCase();
  const visitorBuild = JSON.parse(fs.readFileSync(path.join(ROOT, "version.json"), "utf8")).buildId;
  const testBuild = JSON.parse(fs.readFileSync(path.join(ROOT, "test/version.json"), "utf8")).buildId;
  let visitorOk = true;
  let testOk = true;

  // Besucher-App: immer gegen Live-Root prüfen, außer Scope=test
  if (scope === "both" || scope === "visitor") {
    const visitorHtml = await fetchText(`${SITE_URL}/index.html?v=${bust}`);
    visitorOk = visitorHtml.includes(visitorBuild);
  }

  // Test-App: eigener Worker unter /test* — nur prüfen wenn Scope es verlangt.
  // Live-Deploy (VERIFY_SCOPE=visitor) darf Test-Build nicht gegen Repo-Commit erzwingen.
  if (scope === "both" || scope === "test") {
    const testHtml = await fetchText(`${SITE_URL}/test/index.html?v=${bust}`);
    testOk = testHtml.includes(testBuild);
  }

  return {
    ok: visitorOk && testOk,
    id: "build-sync",
    diagnosis: !visitorOk
      ? `Besucher-App live ohne Build ${visitorBuild}`
      : !testOk
        ? `Test-App live ohne Build ${testBuild}`
        : "",
    visitorBuild,
    testBuild,
    visitorOk,
    testOk,
    scope
  };
}

async function checkPostsIndexParity() {
  const bust = Date.now();
  const repoIndex = JSON.parse(
    fs.readFileSync(path.join(ROOT, "content/posts/posts-index.json"), "utf8")
  );
  const repoCount = Number(repoIndex.count) || (repoIndex.files || []).length;
  const repoGenerated = String(repoIndex.generated || "");

  const liveText = await fetchText(
    `${SITE_URL}/content/posts/posts-index.json?v=${bust}`
  );
  const liveIndex = JSON.parse(liveText);
  const liveCount = Number(liveIndex.count) || (liveIndex.files || []).length;
  const liveGenerated = String(liveIndex.generated || "");

  const stale = repoGenerated && liveGenerated && repoGenerated !== liveGenerated;
  const countDrift = liveCount < repoCount;
  const ok = !stale && !countDrift;

  return {
    ok,
    id: "posts-index",
    repoCount,
    liveCount,
    repoGenerated,
    liveGenerated,
    diagnosis: ok
      ? ""
      : stale
        ? "Beitrags-Index live veraltet (Deploy fehlgeschlagen oder Cache)."
        : `Beitrags-Index live hat weniger Einträge (${liveCount} < ${repoCount})`
  };
}

async function runDomainParity(domain) {
  if (domain.parityKind === "build-sync") return checkBuildSyncParity();
  if (domain.parityKind === "posts-index") return checkPostsIndexParity();

  if (!domain.parityModule || !domain.parityExport) return { ok: true, id: domain.id, skipped: true };

  const mod = require(path.join(__dirname, domain.parityModule));
  const fn = mod[domain.parityExport];
  if (typeof fn !== "function") {
    return { ok: false, id: domain.id, diagnosis: `Parity-Export fehlt: ${domain.parityExport}` };
  }

  const options = {
    ...(domain.parityOptions || {}),
    siteUrl: SITE_URL
  };
  if (options.catalogPath?.startsWith("test/")) {
    options.catalogPath = options.catalogPath;
  }
  return fn(options).then((result) => ({ ...result, id: domain.id, label: domain.label }));
}

async function runAppLiveParityCheck() {
  const lock = loadMasterLock();
  if (!lock?.locked) {
    console.log(`${MARKER} OK: Master-Lock nicht aktiv`);
    return { ok: true, results: [] };
  }

  const domains = Array.isArray(lock.domains) ? lock.domains : [];
  const results = [];
  const seen = new Set();

  for (const domain of domains) {
    const key = domain.parityKind || domain.parityModule;
    if (!key || seen.has(key + (domain.parityOptions?.catalogPath || ""))) continue;
    seen.add(key + (domain.parityOptions?.catalogPath || ""));

    if (!domain.parityKind && !domain.parityModule) continue;

    const result = await runDomainParity(domain);
    results.push(result);
    const label = domain.label || domain.id;
    if (result.ok) {
      console.log(`${MARKER} OK: ${label}`);
    } else {
      console.error(`${MARKER} FAIL: ${label} — ${result.diagnosis || "Parität fehlgeschlagen"}`);
    }
  }

  const ok = results.every((r) => r.ok || r.skipped);
  return { ok, results, site: SITE_URL };
}

async function main() {
  const summary = await runAppLiveParityCheck();
  if (!summary.ok) {
    const failed = summary.results.filter((r) => !r.ok && !r.skipped);
    console.error(`${MARKER}: ${failed.length} Bereich(e) nicht live-synchron`);
    process.exit(1);
  }
  console.log(`${MARKER}: alle Bereiche live-synchron`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { MARKER, runAppLiveParityCheck };
