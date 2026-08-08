#!/usr/bin/env node
/**
 * Verifiziert Dar Test nach Deploy:
 * 1) öffentliches https://dar-al-tawhid.de/test/
 * 2) workers.dev-Spiegel
 * Beide müssen denselben Build wie test/version.json ausliefern.
 * Kein stilles SKIP mehr — öffentliche URL ist Pflicht.
 */
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const PUBLIC_TEST_BASE = "https://dar-al-tawhid.de/test";
const WORKERS_DEV_TEST_BASE = "https://dar-al-tawhid-test.sero91ak.workers.dev/test";
const ATTEMPTS = Number(process.env.DEPLOY_VERIFY_ATTEMPTS || 12);
const DELAY_MS = Number(process.env.DEPLOY_VERIFY_DELAY_MS || 5000);

const TEST_EXPECT_BUILD =
  process.env.EXPECT_TEST_BUILD ||
  JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "test/version.json"), "utf8")).buildId;

function normalizeTestBase(raw, fallback) {
  let base = String(raw || fallback || PUBLIC_TEST_BASE).trim().replace(/\/$/, "");
  if (!base) base = fallback || PUBLIC_TEST_BASE;
  if (!/\/test$/i.test(base)) base = `${base.replace(/\/$/, "")}/test`;
  return base;
}

const publicBase = normalizeTestBase(
  process.env.SITE_URL || process.env.DAR_TEST_SITE_URL,
  PUBLIC_TEST_BASE
);
const workersBase = normalizeTestBase(
  process.env.DAR_TEST_WORKERS_URL,
  WORKERS_DEV_TEST_BASE
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  const text = await res.text();
  return {
    status: res.status,
    text,
    cf: res.headers.get("cf-cache-status") || "n/a"
  };
}

async function waitForBuild(label, urls) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let matched = null;
    for (const url of urls) {
      try {
        const { status, text, cf } = await fetchText(url);
        const ok = status === 200 && text.includes(TEST_EXPECT_BUILD);
        console.log(
          `${label}: ${url} -> ${status} cf=${cf} expect=${TEST_EXPECT_BUILD} ok=${ok} (attempt ${attempt}/${ATTEMPTS})`
        );
        if (ok) {
          matched = url;
          break;
        }
      } catch (err) {
        console.log(`${label}: ${url} -> error ${err.message || err} (attempt ${attempt}/${ATTEMPTS})`);
      }
    }
    if (matched) return matched;
    if (attempt < ATTEMPTS) await sleep(DELAY_MS);
  }
  return null;
}

async function fetchVersionBuild(base) {
  const url = `${base}/version.json?v=${Date.now()}`;
  const { status, text, cf } = await fetchText(url);
  let buildId = "";
  try {
    buildId = JSON.parse(text).buildId || "";
  } catch (e) {
    buildId = "";
  }
  console.log(`version: ${url} -> ${status} cf=${cf} buildId=${buildId || "?"}`);
  return { url, status, buildId };
}

(async function main() {
  console.log(`Dar Test Verify: expect=${TEST_EXPECT_BUILD}`);
  console.log(`public=${publicBase}`);
  console.log(`workers.dev=${workersBase}`);

  const publicOk = await waitForBuild("public", [
    `${publicBase}/`,
    `${publicBase}/index.html`,
    `${publicBase}/version.json`
  ]);
  if (!publicOk) {
    throw new Error(
      `Öffentliche Test-URL liefert noch nicht ${TEST_EXPECT_BUILD}. Route/Cache prüfen: ${publicBase}/`
    );
  }

  const workersOk = await waitForBuild("workers.dev", [
    `${workersBase}/`,
    `${workersBase}/index.html`,
    `${workersBase}/version.json`
  ]);
  if (!workersOk) {
    throw new Error(`workers.dev Test-App liefert noch nicht ${TEST_EXPECT_BUILD}: ${workersBase}/`);
  }

  async function waitForMatchingVersion(label, base) {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const v = await fetchVersionBuild(base);
      const ok = v.status === 200 && v.buildId === TEST_EXPECT_BUILD;
      console.log(
        `${label} version check: buildId=${v.buildId || "?"} expect=${TEST_EXPECT_BUILD} ok=${ok} (attempt ${attempt}/${ATTEMPTS})`
      );
      if (ok) return v;
      if (attempt < ATTEMPTS) await sleep(DELAY_MS);
    }
    return null;
  }

  const publicVersion = await waitForMatchingVersion("public", publicBase);
  const workersVersion = await waitForMatchingVersion("workers.dev", workersBase);
  if (!publicVersion) {
    throw new Error(
      `public /test/version.json still ≠ expect ${TEST_EXPECT_BUILD}`
    );
  }
  if (!workersVersion) {
    throw new Error(
      `workers.dev /test/version.json still ≠ expect ${TEST_EXPECT_BUILD}`
    );
  }
  if (publicVersion.buildId !== workersVersion.buildId) {
    throw new Error(
      `Parität fehlgeschlagen: public=${publicVersion.buildId} workers.dev=${workersVersion.buildId}`
    );
  }

  console.log(
    `Dar Test live OK — public und workers.dev liefern identisch ${TEST_EXPECT_BUILD}.`
  );
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
