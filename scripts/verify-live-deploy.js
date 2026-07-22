#!/usr/bin/env node
/**
 * Live-Verifikation mit CDN-Retries nach Deploy.
 * Nutzbar für Besucher-App, Test-App und Quellenbibliothek.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const ATTEMPTS = Number(process.env.DEPLOY_VERIFY_ATTEMPTS || 10);
const DELAY_MS = Number(process.env.DEPLOY_VERIFY_DELAY_MS || 4000);

function readBuildId(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")).buildId;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStatus(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  return { status: res.status, text: await res.text(), cf: res.headers.get("cf-cache-status") || "n/a" };
}

async function waitForStatus(url, expected = 200) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { status, cf } = await fetchStatus(url);
    console.log(`verify: ${url} -> ${status} (cf=${cf}, attempt ${attempt}/${ATTEMPTS})`);
    if (status === expected) return true;
    if (attempt < ATTEMPTS) await sleep(DELAY_MS);
  }
  return false;
}

async function waitForHtmlIncludes(url, needles) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { status, text, cf } = await fetchStatus(url);
    const ok = status === 200 && needles.every((needle) => text.includes(needle));
    console.log(
      `verify: ${url} -> ${status} (cf=${cf}, attempt ${attempt}/${ATTEMPTS}, html=${ok ? "ok" : "pending"})`
    );
    if (ok) return true;
    if (attempt < ATTEMPTS) await sleep(DELAY_MS);
  }
  return false;
}

async function main() {
  const mode = process.env.DEPLOY_VERIFY_MODE || "all";
  let failed = 0;

  if (mode === "test" || mode === "all") {
    const testBuild = process.env.EXPECT_TEST_BUILD || readBuildId("test/version.json");
    const assetOk = await waitForStatus(
      `${SITE_URL}/test/assets/library/canonical-source-library.js`,
      200
    );
    const booksOk = await waitForStatus(`${SITE_URL}/data/books-library.json`, 200);
    const scholarsOk = await waitForStatus(`${SITE_URL}/data/scholars-library.json`, 200);
    const htmlOk = await waitForHtmlIncludes(`${SITE_URL}/test/index.html`, [
      testBuild,
      "canonical-source-library.js",
      "Quellenbibliothek"
    ]);
    if (!assetOk || !booksOk || !scholarsOk || !htmlOk) failed += 1;
    else console.log(`verify: Test-App Quellenbibliothek live OK (${testBuild})`);
  }

  if (mode === "visitor" || mode === "all") {
    const visitorBuild = process.env.EXPECT_BUILD || readBuildId("version.json");
    const expectZakat = Number(process.env.EXPECT_ZAKAT_VERSION || 18);
    const visitorOk = await waitForHtmlIncludes(`${SITE_URL}/index.html`, [visitorBuild]);
    const { text } = await fetchStatus(`${SITE_URL}/index.html`);
    const zakatMatch = text.match(/zakat-app\.js\?v=(\d+)/);
    const zakatVer = zakatMatch ? Number(zakatMatch[1]) : 0;
    if (!visitorOk || zakatVer < expectZakat) {
      console.error(
        `verify: Besucher-App fehlgeschlagen (build=${visitorBuild}, zakat=v${zakatVer || "?"})`
      );
      failed += 1;
    } else {
      console.log(`verify: Besucher-App live OK (${visitorBuild}, zakat>=v${expectZakat})`);
    }
  }

  if (failed) {
    throw new Error(`${failed} Live-Verifikation(en) fehlgeschlagen nach ${ATTEMPTS} Versuchen.`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
