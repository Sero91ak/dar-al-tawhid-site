#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content/posts");
const OUT_DIR = path.join(ROOT, "p");
const SITE = "https://dar-al-tawhid.de";
const DEFAULT_IMAGE = `${SITE}/assets/share/default-og-image.webp`;
const PREVIEW_LOGO = `${SITE}/app-icon-512.png`;

function htmlAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripYamlQuotes(value) {
  let val = String(value || "").trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1).trim();
  }
  return val.replace(/^["']+|["']+$/g, "").trim();
}

function frontmatterValue(markdown, key) {
  const match = String(markdown || "").match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return match ? stripYamlQuotes(match[1]) : "";
}

function yamlBlockValue(markdown, blockName, key) {
  const match = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---/);
  const yaml = match ? match[1] : "";
  const lines = yaml.split(/\r?\n/);
  let inBlock = false;
  for (const line of lines) {
    if (!inBlock) {
      if (line.trim() === `${blockName}:`) inBlock = true;
      continue;
    }
    if (/^[A-Za-z0-9_-]+:\s*/.test(line)) break;
    const item = line.match(new RegExp(`^\\s{2}${key}:\\s*(.*)$`));
    if (item) return stripYamlQuotes(item[1]);
  }
  return "";
}

function absolutePublicUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || /^(?:blob:|data:|localhost|https?:\/\/localhost)/i.test(raw)) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE}/${raw.replace(/^\/+/, "")}`;
}

function buildHtml(markdown, postId) {
  const title = frontmatterValue(markdown, "title") || "DAR AL TAWḤID Beitrag";
  const description = frontmatterValue(markdown, "source")
    ? "Ein Beitrag von DAR AL TAWḤID mit Quelle und Nachweis."
    : "Ein Beitrag von DAR AL TAWḤID.";
  const ogImage = absolutePublicUrl(yamlBlockValue(markdown, "feed", "image")) || DEFAULT_IMAGE;
  const publicUrl = `${SITE}/p/${encodeURIComponent(postId)}`;
  const appUrl = `${SITE}/#post/${encodeURIComponent(postId)}`;
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${htmlAttr(title)} | DAR AL TAWḤID</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0f2f2b">
  <meta name="robots" content="index, follow">
  <meta name="description" content="${htmlAttr(description)}">
  <link rel="canonical" href="${htmlAttr(publicUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="DAR AL TAWḤID">
  <meta property="og:title" content="${htmlAttr(title)}">
  <meta property="og:description" content="${htmlAttr(description)}">
  <meta property="og:url" content="${htmlAttr(publicUrl)}">
  <meta property="og:image" content="${htmlAttr(ogImage)}">
  <meta property="og:image:secure_url" content="${htmlAttr(ogImage)}">
  <meta property="og:image:alt" content="DAR AL TAWḤID Bildbeitrag">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${htmlAttr(title)}">
  <meta name="twitter:description" content="${htmlAttr(description)}">
  <meta name="twitter:image" content="${htmlAttr(ogImage)}">
  <script>window.addEventListener("DOMContentLoaded",function(){setTimeout(function(){window.location.replace("${htmlAttr(appUrl)}")},500)});</script>
  <style>:root{--bg:#f7f0df;--ink:#18342f;--gold:#b99245;--muted:#6d6250;--card:rgba(255,255,255,.78)}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,rgba(185,146,69,.18),transparent 36%),linear-gradient(180deg,#fff8e8,var(--bg));color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.page{width:min(100%,520px);padding:28px;border:1px solid rgba(185,146,69,.35);border-radius:28px;background:var(--card);box-shadow:0 24px 70px rgba(32,25,10,.16);text-align:center}.logo{width:82px;height:82px;border-radius:999px;object-fit:cover;display:block;margin:0 auto 18px}h1{margin:0;font-size:24px;line-height:1.25;letter-spacing:.02em}p{margin:14px 0 0;color:var(--muted);font-size:15px;line-height:1.6}.button{display:inline-flex;align-items:center;justify-content:center;margin-top:22px;padding:12px 18px;border-radius:999px;background:var(--ink);color:#fff6df;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 12px 28px rgba(24,52,47,.24)}.site{margin-top:18px;color:var(--gold);font-weight:700;font-size:13px;letter-spacing:.04em}</style>
</head>
<body><main class="page"><img class="logo" src="${PREVIEW_LOGO}" alt="DAR AL TAWḤID"><h1>${htmlAttr(title)}</h1><p>Der Beitrag wird geöffnet. Falls die Weiterleitung nicht automatisch funktioniert, bitte den Button benutzen.</p><a class="button" href="${htmlAttr(appUrl)}">Beitrag öffnen</a><div class="site">dar-al-tawhid.de</div></main></body>
</html>
`;
}

function main() {
  const files = fs.readdirSync(POSTS_DIR).filter((name) => name.endsWith(".md"));
  let written = 0;
  let skipped = 0;
  for (const file of files) {
    const markdown = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const postId = frontmatterValue(markdown, "id") || file.replace(/\.md$/i, "");
    if (!postId) {
      skipped += 1;
      continue;
    }
    const dir = path.join(OUT_DIR, postId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildHtml(markdown, postId));
    written += 1;
  }
  console.log(`Post preview pages generated: ${written} written, ${skipped} skipped`);
}

main();
