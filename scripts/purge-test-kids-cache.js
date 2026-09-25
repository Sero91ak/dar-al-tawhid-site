#!/usr/bin/env node
/**
 * Nur /test/kids/* am CDN leeren.
 * Kein Besucher-Deploy, kein purge_everything, keine Workers Builds.
 */
const SITE_URL = (process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const GLOBAL_API_KEY = process.env.CLOUDFLARE_GLOBAL_API_KEY || process.env.CLOUDFLARE_API_KEY || "";
const GLOBAL_EMAIL = process.env.CLOUDFLARE_EMAIL || "";
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "0e4c0fdfaca4f3fa137de3a67ac8a68b";

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
  throw new Error("Cloudflare Auth fehlt");
}

async function main() {
  const files = [
    `${SITE_URL}/test/kids`,
    `${SITE_URL}/test/kids/`,
    `${SITE_URL}/test/kids/index.html`,
    `${SITE_URL}/test/kids/version.json`,
    `${SITE_URL}/test/kids/manifest.webmanifest`
  ];
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ files })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const msg = data.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(`Kids-Cache-Purge fehlgeschlagen: ${msg}`);
  }
  console.log("Kids Test Cache geleert:", files.length, data.result?.id || "ok");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
