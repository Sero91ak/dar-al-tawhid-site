#!/usr/bin/env node
/* DAR AL TAWḤID – Cloudflare-Cache für live Besucher-App leeren (nach GitHub Pages Deploy). */

const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const GLOBAL_API_KEY = process.env.CLOUDFLARE_GLOBAL_API_KEY || process.env.CLOUDFLARE_API_KEY || "";
const GLOBAL_EMAIL = process.env.CLOUDFLARE_EMAIL || "";
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "0e4c0fdfaca4f3fa137de3a67ac8a68b";
const ENABLE_DEV_MODE = String(process.env.CLOUDFLARE_DEV_MODE || "1").trim() !== "0";

async function readExpectedBuild(path) {
  const fallback = path.includes("/test/") ? "app-shell-v234" : "app-shell-v229";
  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
    });
    const data = await res.json();
    return String(data?.buildId || fallback);
  } catch (err) {
    console.warn(`Build-ID konnte nicht aus ${path} gelesen werden, nutze ${fallback}.`);
    return fallback;
  }
}

function authHeaders() {
  if (API_TOKEN) {
    return { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" };
  }
  if (GLOBAL_EMAIL && GLOBAL_API_KEY) {
    return {
      "X-Auth-Email": GLOBAL_EMAIL,
      "X-Auth-Key": GLOBAL_API_KEY,
      "Content-Type": "application/json"
    };
  }
  throw new Error("Cloudflare Auth fehlt (CLOUDFLARE_API_TOKEN oder CLOUDFLARE_EMAIL + CLOUDFLARE_GLOBAL_API_KEY)");
}

async function cfApi(path, options = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const msg = data.errors?.map((e) => e.message).join("; ") || res.statusText;
    if (/authentication/i.test(msg)) {
      throw new Error(
        `${msg} — Token braucht: Zone → Cache Purge → Purge (+ optional Zone Settings → Edit für Dev-Mode).`
      );
    }
    throw new Error(msg || "Cloudflare API Fehler");
  }
  return data;
}

async function resolveZoneId(hostname) {
  if (ZONE_ID) return ZONE_ID;
  const host = String(hostname || "").replace(/^www\./, "");
  const data = await cfApi(`/zones?name=${encodeURIComponent(host)}&status=active`);
  const zone = (data.result || []).find((z) => z.name === host || host.endsWith(`.${z.name}`));
  if (!zone?.id) throw new Error(`Cloudflare Zone nicht gefunden für ${host}`);
  return zone.id;
}

async function purgeEverything(zoneId) {
  const result = await cfApi(`/zones/${zoneId}/purge_cache`, {
    method: "POST",
    body: JSON.stringify({ purge_everything: true })
  });
  console.log("Cloudflare purge_everything:", result.result?.id || "ok");
  return result;
}

async function purgeFiles(zoneId, files) {
  const result = await cfApi(`/zones/${zoneId}/purge_cache`, {
    method: "POST",
    body: JSON.stringify({ files })
  });
  console.log("Cloudflare Datei-Purge:", files.length, result.result?.id || "ok");
  return result;
}

async function setDevelopmentMode(zoneId, on) {
  const result = await cfApi(`/zones/${zoneId}/settings/development_mode`, {
    method: "PATCH",
    body: JSON.stringify({ value: on ? "on" : "off" })
  });
  console.log("Development Mode:", on ? "AN (3h Cache-Bypass)" : "aus", result.result?.value || "");
  return result;
}

async function verifyLiveHtml() {
  const rootBuild = process.env.EXPECT_BUILD_ROOT || process.env.EXPECT_BUILD || await readExpectedBuild("/version.json");
  const testBuild = process.env.EXPECT_BUILD_TEST || await readExpectedBuild("/test/version.json");
  const checks = [
    { label: "Besucher-App", expected: rootBuild, urls: [`${SITE_URL}/`, `${SITE_URL}/index.html`] },
    { label: "Dar Test", expected: testBuild, urls: [`${SITE_URL}/test/`, `${SITE_URL}/test/index.html`] }
  ];
  let allOk = true;
  for (const check of checks) {
    let ok = false;
    for (const url of check.urls) {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
    });
    const html = await res.text();
    const cf = res.headers.get("cf-cache-status") || "?";
      const hasBuild = html.includes(check.expected);
      console.log(`Verify ${url} (${check.label}) → cf-cache=${cf}, expected=${check.expected}, build=${hasBuild}`);
      ok = ok || hasBuild;
    }
    allOk = allOk && ok;
  }
  return allOk;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async function main() {
  const hostname = new URL(SITE_URL).hostname;
  const zoneId = await resolveZoneId(hostname);
  console.log("Zone:", zoneId, "für", hostname);

  await purgeEverything(zoneId);
  await sleep(2500);

  if (await verifyLiveHtml()) {
    console.log("Live-Check OK — Besucher-App ist aktuell.");
    return;
  }

  console.warn("Nach purge_everything noch alte Version — versuche Datei-Purge + Dev-Mode…");
  const files = [
    `${SITE_URL}/`,
    `${SITE_URL}/index.html`,
    `${SITE_URL}/test/index.html`,
    `${SITE_URL}/version.json`,
    `${SITE_URL}/service-worker.js`,
    `${SITE_URL}/content/updates/current.json`,
    `${SITE_URL}/content/focus-feed/feed-index.json`,
    `${SITE_URL}/assets/zakat-app.js`,
    `${SITE_URL}/assets/app-card-layout.css`,
    `${SITE_URL}/assets/app-scroll-manager.js`,
    `${SITE_URL}/assets/focus-feed-app.js`,
    `${SITE_URL}/assets/live-boot.js`
  ];
  await purgeFiles(zoneId, files);
  await sleep(2500);

  if (await verifyLiveHtml()) {
    console.log("Live-Check OK nach Datei-Purge.");
    return;
  }

  if (ENABLE_DEV_MODE) {
    try {
      await setDevelopmentMode(zoneId, true);
      await sleep(2000);
      if (await verifyLiveHtml()) {
        console.log("Live-Check OK mit Development Mode (bleibt ~3h aktiv, dann automatisch aus).");
        return;
      }
    } catch (err) {
      console.warn("Development Mode nicht möglich:", err.message || err);
    }
  }

  throw new Error(
    "Cloudflare liefert nach Purge noch alte index.html. Bitte im Dashboard: Caching → Purge Everything + Development Mode 3h aktivieren."
  );
})().catch((err) => {
  console.error("Purge fehlgeschlagen:", err.message || err);
  process.exit(1);
});
