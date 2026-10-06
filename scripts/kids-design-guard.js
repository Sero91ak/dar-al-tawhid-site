#!/usr/bin/env node
/**
 * KIDS_DESIGN_GUARD
 * Sichert Edge-to-Edge, Glass-Tab-Bar und das Verbot von System-Emojis
 * in DĀR AL TAWḤĪD Kids (/kids/).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MARKER = "KIDS_DESIGN_GUARD";
const KIDS_HTML = "kids/index.html";
const KIDS_DOC = "kids/KIDS-DESIGN.md";

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
  if (!/KIDS_GLOBAL_CAPSULE_WIDTH/.test(doc)) {
    failed += fail(`${KIDS_DOC}: globale Kapselbreite muss dokumentiert sein`);
  }
  if (!/KIDS_GLOBAL_TOUCH_GLOW/.test(doc)) {
    failed += fail(`${KIDS_DOC}: globaler Touch-Glow muss dokumentiert sein`);
  }
  if (!html.includes("/kids/kids-touch-rail.css?v=") || !html.includes("/kids/kids-card-interaction.js?v=")) {
    failed += fail(`${KIDS_HTML}: globales Kapsel-/Touch-System fehlt`);
  }
  if (!html.includes("kid-icon") || !html.includes("function kidsIconMarkup")) {
    failed += fail(`${KIDS_HTML}: Icon-System kidsIconMarkup/kid-icon fehlt`);
  }
  if (!/KIDS_WHOLE_CARD_TAP/.test(doc)) {
    failed += fail(`${KIDS_DOC}: Whole-Card-Tap-Regel fehlt`);
  }
  if (!/KIDS_NO_PRECLICK_DURATION/.test(doc)) {
    failed += fail(`${KIDS_DOC}: Pre-Click-Dauer/Alter-Regel fehlt`);
  }
  if (!html.includes("/kids/kids-touch-rail.css?v=9")) {
    failed += fail(`${KIDS_HTML}: globales Karten-Interaktionssystem v9 fehlt`);
  }

  // Approved start hero reference (V1199): keep the exact static scene and
  // iOS-safe real-text brand from regressing into video/camera motion or clipped SVG text.
  const homeHeroNeedles = [
    "kids-home-reference-exact-v1199",
    "/kids/assets/kids-home-v1191/hero-static-reference.jpg?v=1199",
    "https://use.typekit.net/jka5jda.css",
    "class=\"wm-dar-safe\"",
    "margin:calc(-1 * var(--safe-top)) calc(50% - 50vw) 0!important",
    "kids-home-hero-polish-v1203",
    "static shooting star",
    "background:transparent!important"
  ];
  for (const n of homeHeroNeedles) {
    if (!html.includes(n)) failed += fail(`${KIDS_HTML}: Startseiten-Hero Referenz fehlt: ${n}`);
  }
  if (!/Startseiten-Hero – verbindliche Referenz \(V1199\)/.test(doc)) {
    failed += fail(`${KIDS_DOC}: verbindliche V1199-Startseitenreferenz fehlt`);
  }
  const forbiddenStaticArrowMarkup = [
    '<span class="arrow">›</span>',
    '<div class="go">›</div>',
    '<span class="kgo">›</span>',
    '<div class="fgo">›</div>'
  ];
  for (const marker of forbiddenStaticArrowMarkup) {
    if (html.includes(marker)) failed += fail(`${KIDS_HTML}: permanente Karten-Pfeil-Markup verboten: ${marker}`);
  }
  const runtimeFiles = [
    "kids/prophet-stories.js",
    "kids/mubashshirun-stories.js",
    "kids/sahabiyyat-stories.js"
  ];
  for (const rel of runtimeFiles) {
    const body = fs.readFileSync(path.join(ROOT, rel), "utf8");
    if (/class="(?:ps|ms)-row-go/.test(body)) failed += fail(`${rel}: Vorschau-Pfeil verboten`);
    if (/class="(?:ps|ms)-row-meta/.test(body)) failed += fail(`${rel}: Laufzeit/Alter vor dem Öffnen verboten`);
  }
  // Common UI emojis must not be used as symbols in the Kids shell.
  const banned = ["🎧", "🌙", "☀️", "❤️", "📚", "👨‍👩‍👧", "🕌", "⭐️", "🌟", "🙏"];
  for (const e of banned) {
    if (html.includes(e)) failed += fail(`${KIDS_HTML}: System-Emoji als UI-Symbol verboten: ${e}`);
  }
  const iconDir = path.join(ROOT, "kids/assets/kids-icons");
  if (!fs.existsSync(iconDir)) return fail("kids-icons Ordner fehlt");
  const must = ["headphones-real-v12.png", "moon-real-v12.png", "sun-real-v12.png", "quran-real-v12.png", "parents-real-v12.png"];
  for (const f of must) {
    const buf = fs.readFileSync(path.join(iconDir, f));
    if (buf.slice(0, 8).toString("binary") !== "\x89PNG\r\n\x1a\n") {
      failed += fail(`${f} muss eine echte PNG-Datei sein (kein JPEG mit .png-Endung)`);
    }
  }
  if (!failed) ok("Kids Design (Edge-to-Edge, V1199-Referenzhero, Adobe-Cinzel-Wortmarke, Glass-Nav, Whole-Card-Tap, keine Pre-Click-Dauer, keine Emojis, PNG-Icons)");
  return failed;
}

if (require.main === module) {
  const n = runKidsDesignGuard();
  process.exit(n ? 1 : 0);
}

module.exports = { runKidsDesignGuard };
