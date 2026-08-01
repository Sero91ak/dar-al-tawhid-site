#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const SITE_URL = String(process.env.SITE_URL || "").replace(/\/$/, "");

if (!SITE_URL) {
  console.log("SKIP: SITE_URL für Test-App-Verifikation nicht gesetzt.");
  process.exit(0);
}

const TEST_EXPECT_BUILD =
  process.env.EXPECT_TEST_BUILD ||
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "test/version.json"), "utf8")).buildId;

async function fetchHtml(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  const html = await res.text();
  return { res, html };
}

function checkHtml(url, html, res) {
  const cf = res.headers.get("cf-cache-status") || "n/a";
  const buildOk = html.includes(TEST_EXPECT_BUILD);
  console.log(`${url}: cf-cache=${cf} expect=${TEST_EXPECT_BUILD} build=${buildOk}`);
  return buildOk;
}

(async function main() {
  const targets = [`${SITE_URL}/`, `${SITE_URL}/test/`, `${SITE_URL}/test/index.html`];
  let ok = false;
  for (const url of targets) {
    const { res, html } = await fetchHtml(url);
    if (checkHtml(url, html, res)) ok = true;
  }
  if (!ok) throw new Error(`Dar Test liefert noch nicht ${TEST_EXPECT_BUILD}.`);
  console.log("Dar Test live OK.");
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
