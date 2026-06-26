#!/usr/bin/env node
/* DAR AL TAWḤID – Cloudflare-Cache für live Besucher-App leeren (nach GitHub Pages Deploy). */

const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const GLOBAL_API_KEY = process.env.CLOUDFLARE_GLOBAL_API_KEY || process.env.CLOUDFLARE_API_KEY || "";
const GLOBAL_EMAIL = process.env.CLOUDFLARE_EMAIL || "";
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "";

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

async function purgeSite(zoneId) {
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
  try {
    const result = await cfApi(`/zones/${zoneId}/purge_cache`, {
      method: "POST",
      body: JSON.stringify({ files })
    });
    console.log("Cloudflare Cache geleert (Dateien):", files.length, result.result?.id || "ok");
    return result;
  } catch (err) {
    console.warn("Selektiver Purge fehlgeschlagen, versuche purge_everything:", err.message || err);
    const result = await cfApi(`/zones/${zoneId}/purge_cache`, {
      method: "POST",
      body: JSON.stringify({ purge_everything: true })
    });
    console.log("Cloudflare Cache geleert (alles):", result.result?.id || "ok");
    return result;
  }
}

(async function main() {
  const hostname = new URL(SITE_URL).hostname;
  const zoneId = await resolveZoneId(hostname);
  console.log("Zone:", zoneId, "für", hostname);
  await purgeSite(zoneId);
})().catch((err) => {
  console.error("Purge fehlgeschlagen:", err.message || err);
  process.exit(1);
});
