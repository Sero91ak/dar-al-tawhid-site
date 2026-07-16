#!/usr/bin/env node
/* Prüft ob Besucher-App und Test-App live die erwarteten Versionen ausliefern. */

const fs = require("fs");
const path = require("path");

const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const ROOT_DIR = path.join(__dirname, "..");
const VISITOR_EXPECT_BUILD =
  process.env.EXPECT_BUILD ||
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "version.json"), "utf8")).buildId;
const TEST_EXPECT_BUILD =
  process.env.EXPECT_TEST_BUILD ||
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "test/version.json"), "utf8")).buildId;
const EXPECT_ZAKAT = Number(process.env.EXPECT_ZAKAT_VERSION || 18);

async function fetchHtml(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  const html = await res.text();
  return { res, html };
}

function checkHtml(label, html, res, expectedBuild) {
  const cf = res.headers.get("cf-cache-status") || "n/a";
  const buildOk = html.includes(expectedBuild);
  const zakatMatch = html.match(/zakat-app\.js\?v=(\d+)/);
  const zakatVer = zakatMatch ? Number(zakatMatch[1]) : 0;
  const zakatOk = zakatVer >= EXPECT_ZAKAT;
  const bootOk = html.includes("live-boot.js") || html.includes("__DAR_EXPECTED_BUILD");
  console.log(`${label}: cf-cache=${cf} expect=${expectedBuild} build=${buildOk} zakat=v${zakatVer || "?"} boot=${bootOk}`);
  return buildOk && zakatOk;
}

(async function main() {
  const targets = [
    { url: `${SITE_URL}/`, expected: VISITOR_EXPECT_BUILD },
    { url: `${SITE_URL}/index.html`, expected: VISITOR_EXPECT_BUILD },
    { url: `${SITE_URL}/test/`, expected: TEST_EXPECT_BUILD },
    { url: `${SITE_URL}/test/index.html`, expected: TEST_EXPECT_BUILD }
  ];
  let ok = false;
  for (const { url, expected } of targets) {
    const { res, html } = await fetchHtml(url);
    if (checkHtml(url, html, res, expected)) ok = true;
  }
  if (!ok) {
    throw new Error(
      `Besucher-/Test-App noch nicht live (visitor=${VISITOR_EXPECT_BUILD}, test=${TEST_EXPECT_BUILD}, zakat>=v${EXPECT_ZAKAT}). ` +
        "Cloudflare Pages: Deploy command leeren, neues Deployment, Purge Everything."
    );
  }
  console.log("Besucher-/Test-App live OK.");
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
