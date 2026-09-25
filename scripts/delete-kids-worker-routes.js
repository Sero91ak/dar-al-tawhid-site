#!/usr/bin/env node
/**
 * Löscht Custom-Domain-Routen des Workers dar-al-tawhid-kids auf /test/kids.
 * Nicht anfassen: dar-al-tawhid-site (/*), dar-al-tawhid-test (/voice-studio).
 */
const { execFileSync } = require("child_process");

const TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const ZONE = process.env.CLOUDFLARE_ZONE_ID || "0e4c0fdfaca4f3fa137de3a67ac8a68b";

if (!TOKEN) {
  console.error("CLOUDFLARE_API_TOKEN fehlt");
  process.exit(1);
}

function cf(method, path) {
  const args = [
    "-sS",
    "-X",
    method,
    "-H",
    `Authorization: Bearer ${TOKEN}`,
    `https://api.cloudflare.com/client/v4${path}`
  ];
  const out = execFileSync("curl", args, { encoding: "utf8" });
  return JSON.parse(out || "{}");
}

function isKidsLiveRoute(route) {
  const pattern = String(route.pattern || "");
  const script = String(route.script || "");
  if (script !== "dar-al-tawhid-kids") return false;
  return (
    pattern.includes("dar-al-tawhid.de/test/kids") ||
    /\/test\/kids(\/|$|\*)/.test(pattern)
  );
}

const listed = cf("GET", `/zones/${ZONE}/workers/routes`);
if (listed.success === false) {
  console.error("Routen-Liste fehlgeschlagen:", JSON.stringify(listed.errors || listed));
  process.exit(1);
}

const routes = (listed.result || []).filter(isKidsLiveRoute);
console.log(
  "Kids-Worker Live-Routen:",
  routes.map((r) => `${r.pattern} [${r.script} ${r.id}]`).join(", ") || "(keine)"
);

let failed = 0;
for (const route of routes) {
  const del = cf("DELETE", `/zones/${ZONE}/workers/routes/${route.id}`);
  if (del.success === false) {
    console.error("Löschen fehlgeschlagen:", route.pattern, JSON.stringify(del.errors || del));
    failed += 1;
    continue;
  }
  console.log("gelöscht:", route.pattern, route.id);
}

process.exit(failed ? 1 : 0);
