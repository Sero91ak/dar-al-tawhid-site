#!/usr/bin/env node
/**
 * KIDS_DESIGN_GUARD
 * Sichert Edge-to-Edge, Glass-Tab-Bar und das Verbot von System-Emojis
 * in DĀR AL TAWḤĪD Kids (/test/kids/).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "KIDS_DESIGN_GUARD";
const KIDS_HTML = "test/kids/index.html";
const KIDS_DOC = "test/kids/KIDS-DESIGN.md";

function fail(msg) {
  console.error(`${MARKER} FAIL: ${msg}`);
  return 1;
}
function ok(msg) {
  console.log(`${MARKER} OK: ${msg}`);
  return 0;
}

function runKidsDesignGuard() {
  let failed = 0;
  const htmlPath = path.join(ROOT, KIDS_HTML);
  const docPath = path.join(ROOT, KIDS_DOC);
  if (!fs.existsSync(htmlPath)) return fail(`${KIDS_HTML} fehlt`);
  if (!fs.existsSync(docPath)) return fail(`${KIDS_DOC} fehlt`);
  const html = fs.readFileSync(htmlPath, "utf8");
  const doc = fs.readFileSync(docPath, "utf8");

  const needles = [
    "KIDS_UI_OVERHAUL_V12",
    "KIDS_NO_SYSTEM_EMOJI",
    "KIDS_REAL_ASSET_ICON_SYSTEM_V11",
    "backdrop-filter:blur(28px) saturate(1.55)",
    "width:100%!important",
    "kids-icons/moon-real-v12.png",
    "kids-icons/headphones-real-v12.png",
    "kids-icons/quran-real-v12.png"
  ];
  for (const n of needles) {
    if (!html.includes(n)) failed += fail(`${KIDS_HTML}: Marker fehlt: ${n}`);
  }
  if (!/KIDS_NO_SYSTEM_EMOJI/.test(doc) || !/keine.*Emojis/i.test(doc)) {
    failed += fail(`${KIDS_DOC}: Emoji-Verbot muss dokumentiert sein`);
  }
  if (!html.includes("kid-icon") || !html.includes("function kidsIconMarkup")) {
    failed += fail(`${KIDS_HTML}: Icon-System kidsIconMarkup/kid-icon fehlt`);
  }
  // Common UI emojis must not be used as symbols in the Kids shell.
  const banned = ["🎧", "🌙", "☀️", "❤️", "📚", "👨‍👩‍👧", "🕌", "⭐️", "🌟", "🙏"];
  for (const e of banned) {
    if (html.includes(e)) failed += fail(`${KIDS_HTML}: System-Emoji als UI-Symbol verboten: ${e}`);
  }
  const iconDir = path.join(ROOT, "test/kids/assets/kids-icons");
  if (!fs.existsSync(iconDir)) return fail("kids-icons Ordner fehlt");
  const must = ["headphones-real-v12.png", "moon-real-v12.png", "sun-real-v12.png", "quran-real-v12.png", "parents-real-v12.png"];
  for (const f of must) {
    const buf = fs.readFileSync(path.join(iconDir, f));
    if (buf.slice(0, 8).toString("binary") !== "\x89PNG\r\n\x1a\n") {
      failed += fail(`${f} muss eine echte PNG-Datei sein (kein JPEG mit .png-Endung)`);
    }
  }
  if (!failed) ok("Kids Design (Edge-to-Edge, Glass-Nav, keine Emojis, PNG-Icons)");
  return failed;
}

if (require.main === module) {
  const n = runKidsDesignGuard();
  process.exit(n ? 1 : 0);
}

module.exports = { runKidsDesignGuard };
