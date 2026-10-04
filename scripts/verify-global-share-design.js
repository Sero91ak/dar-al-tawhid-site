#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const OFFICIAL_BADGE = "/assets/app-store-badge-de-official.svg";
const failures = [];

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`missing: ${rel}`);
    return "";
  }
  return fs.readFileSync(abs, "utf8");
}
function need(rel, text, label) {
  const src = read(rel);
  if (src && !src.includes(text)) failures.push(`${rel}: missing ${label || text}`);
  return src;
}
function forbid(rel, text, label) {
  const src = read(rel);
  if (src && src.includes(text)) failures.push(`${rel}: forbidden ${label || text}`);
}

const badge = read("assets/app-store-badge-de-official.svg");
if (badge) {
  if (!/Download_on_the_App_Store_Badge_DE_RGB_blk/i.test(badge)) {
    failures.push("assets/app-store-badge-de-official.svg: not the canonical German black App Store badge");
  }
  if (!/viewBox=/i.test(badge)) failures.push("assets/app-store-badge-de-official.svg: invalid SVG/viewBox");
}

const globalShare = need("assets/dar-global-share-v1225.js", OFFICIAL_BADGE, "official App Store badge");
if (globalShare) {
  if (!/adaptiveBodyLayout\(/.test(globalShare)) failures.push("assets/dar-global-share-v1225.js: adaptive body typography missing");
  if (!/fillText\("AUSSAGE"/.test(globalShare)) failures.push("assets/dar-global-share-v1225.js: AUSSAGE hierarchy missing");
  if (!/fillText\("QUELLE"/.test(globalShare)) failures.push("assets/dar-global-share-v1225.js: QUELLE hierarchy missing");
  if (!/__DAR_GLOBAL_SHARE_V1240=true/.test(globalShare)) failures.push("assets/dar-global-share-v1225.js: singleton/version flag mismatch");
}

for (const rel of ["assets/premium-feed-app.js", "test/assets/premium-feed-app.js"]) {
  const src = need(rel, OFFICIAL_BADGE, "official App Store badge");
  if (src && !/await\s+feedShareBrandFooter\(/.test(src)) failures.push(`${rel}: share footer must await badge rendering`);
}

const frauen = need("test/assets/frauen/frauen-fiqh.js", OFFICIAL_BADGE, "official App Store badge");
if (frauen) {
  if (!/frauenAdaptiveBodyLayout\(/.test(frauen)) failures.push("test/assets/frauen/frauen-fiqh.js: adaptive body typography missing");
  if (!/fillText\("AUSSAGE"/.test(frauen)) failures.push("test/assets/frauen/frauen-fiqh.js: AUSSAGE hierarchy missing");
  if (!/fillText\("QUELLE"/.test(frauen)) failures.push("test/assets/frauen/frauen-fiqh.js: QUELLE hierarchy missing");
  if (!/await\s+frauenDrawStoreBadge\(/.test(frauen)) failures.push("test/assets/frauen/frauen-fiqh.js: official badge render is not awaited");
}

for (const rel of [
  "assets/dar-global-share-v1225.js",
  "assets/premium-feed-app.js",
  "test/assets/premium-feed-app.js",
  "test/assets/frauen/frauen-fiqh.js"
]) {
  forbid(rel, "Download on the", "hand-built App Store badge text");
  forbid(rel, "#38a8ff", "legacy blue pseudo App Store icon");
  forbid(rel, "app-store-icon-fixed.svg", "legacy App Store icon asset");
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (ent.isFile() && /\.(?:js|html)$/i.test(ent.name)) out.push(abs);
  }
  return out;
}

const roots = ["assets", "test/assets", "kids"];
const known = new Set([
  "assets/dar-global-share-v1225.js",
  "assets/premium-feed-app.js",
  "test/assets/premium-feed-app.js",
  "test/assets/frauen/frauen-fiqh.js"
]);

for (const base of roots) {
  for (const abs of walk(path.join(root, base))) {
    const rel = path.relative(root, abs).replace(/\\/g, "/");
    if (known.has(rel)) continue;
    const src = fs.readFileSync(abs, "utf8");
    const isImageShareRenderer =
      /navigator\.share/.test(src) ||
      (/canvas\.toBlob/.test(src) &&
       /new File\(\[blob\]/.test(src) &&
       /(bildbeitrag|share)/i.test(src));
    if (!isImageShareRenderer) continue;
    const delegatesGlobal = /DARGlobalShare/.test(src);
    const usesOfficial = src.includes(OFFICIAL_BADGE);
    if (!delegatesGlobal && !usesOfficial) {
      failures.push(`${rel}: independent image-share renderer must use DARGlobalShare or the official App Store badge`);
    }
  }
}

if (failures.length) {
  console.error("Global share design verification FAILED:");
  for (const item of failures) console.error(" - " + item);
  process.exit(1);
}

console.log("Global share design verification passed.");
