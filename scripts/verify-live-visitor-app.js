#!/usr/bin/env node
/* Prüft ob die Besucher-App live die erwartete Version ausliefert. */

const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const EXPECT_BUILD = process.env.EXPECT_BUILD || "app-shell-v197";
const EXPECT_ZAKAT = Number(process.env.EXPECT_ZAKAT_VERSION || 18);

async function fetchHtml(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  const html = await res.text();
  return { res, html };
}

function checkHtml(label, html, res) {
  const cf = res.headers.get("cf-cache-status") || "n/a";
  const buildOk = html.includes(EXPECT_BUILD);
  const zakatMatch = html.match(/zakat-app\.js\?v=(\d+)/);
  const zakatVer = zakatMatch ? Number(zakatMatch[1]) : 0;
  const zakatOk = zakatVer >= EXPECT_ZAKAT;
  const bootOk = html.includes("live-boot.js") || html.includes("__DAR_EXPECTED_BUILD");
  console.log(`${label}: cf-cache=${cf} build=${buildOk} zakat=v${zakatVer || "?"} boot=${bootOk}`);
  return buildOk && zakatOk;
}

(async function main() {
  const urls = [`${SITE_URL}/`, `${SITE_URL}/index.html`, `${SITE_URL}/test/`, `${SITE_URL}/test/index.html`];
  let ok = false;
  for (const url of urls) {
    const { res, html } = await fetchHtml(url);
    if (checkHtml(url, html, res)) ok = true;
  }
  if (!ok) {
    throw new Error(
      `Besucher-App noch nicht live (${EXPECT_BUILD}, zakat>=v${EXPECT_ZAKAT}). ` +
        "Cloudflare Pages: Deploy command leeren, neues Deployment, Purge Everything."
    );
  }
  console.log("Besucher-App live OK.");
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
