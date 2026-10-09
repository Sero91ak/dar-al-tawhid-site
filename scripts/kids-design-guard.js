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
  if (!/KIDS_SUBPAGE_NAV_RAIL/.test(doc)) {
    failed += fail(`${KIDS_DOC}: globale Nicht-Hero-Unterseiten-Navigation fehlt`);
  }
  if (!/KIDS_SUBPAGE_APPBAR_V14/.test(doc)) {
    failed += fail(`${KIDS_DOC}: professionelle Unterseiten-App-Bar V14 fehlt`);
  }
  if (!/KIDS_SUBPAGE_DOCK_V15/.test(doc)) {
    failed += fail(`${KIDS_DOC}: eingedockter Unterseiten-Kopf V15 fehlt`);
  }
  if (!/KIDS_HOME_GLOW_PARITY_V16/.test(doc)) {
    failed += fail(`${KIDS_DOC}: Startseiten-Glow-Parität V16 fehlt`);
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
  if (!html.includes("/kids/kids-touch-rail.css?v=16")) {
    failed += fail(`${KIDS_HTML}: globales Karten-Interaktionssystem v16 fehlt`);
  }

  // Approved start hero reference (V1199): keep the exact static scene and
  // iOS-safe real-text brand from regressing into video/camera motion or clipped SVG text.
  const homeHeroNeedles = [
    "kids-home-reference-exact-v1199",
    "/kids/assets/kids-home-v1191/hero-static-reference.jpg?v=1199",
    "https://use.typekit.net/jka5jda.css",
    "class=\"wm-dar-safe\"",
    "margin:calc(-1 * var(--safe-top)) calc(50% - 50vw) 0!important",
    "kids-home-reference-polish-v1204",
    "The reference image already contains the correct meteor.",
    "The approved reference has a soft atmospheric shadow"
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
  // Kids Quiz learning center: 900 fixed questions, age comes only from profile/settings.
  const quizPath = path.join(ROOT, "kids/data/quiz-kids.json");
  const quizLibraryPath = path.join(ROOT, "kids/quiz-library.js");
  const quizCssPath = path.join(ROOT, "kids/quiz-library.css");
  if (!fs.existsSync(quizPath) || !fs.existsSync(quizLibraryPath) || !fs.existsSync(quizCssPath)) {
    failed += fail("Kids Quiz Lernzentrum: Pflichtdateien fehlen");
  } else {
    const quiz = JSON.parse(fs.readFileSync(quizPath, "utf8"));
    const quizLibrary = fs.readFileSync(quizLibraryPath, "utf8");
    const quizCss = fs.readFileSync(quizCssPath, "utf8");
    const quizItems = Array.isArray(quiz.items) ? quiz.items : [];
    const quizCounts = Object.fromEntries(["4-6","7-8","9-10"].map((band)=>[
      band, quizItems.filter((q)=>q && q.ageBand===band).length
    ]));
    if (quizItems.length !== 900 || quizCounts["4-6"] !== 300 || quizCounts["7-8"] !== 300 || quizCounts["9-10"] !== 300) {
      failed += fail(`Kids Quiz: erwartet 900 = 300/300/300, gefunden ${quizItems.length} = ${quizCounts["4-6"]}/${quizCounts["7-8"]}/${quizCounts["9-10"]}`);
    }
    if (html.includes('id="quizAgePick"') || html.includes('data-quiz-age=')) {
      failed += fail("Kids Quiz: zweite Altersauswahl im Quiz ist verboten; Alter kommt aus Kids-Einstellungen");
    }
    for (const marker of ["openKidsQuizHub","quizReviewMistakes","quizReviewDue","quizResumeRound","data-quiz-topic"]) {
      if (!quizLibrary.includes(marker)) failed += fail(`Kids Quiz Lernzentrum fehlt: ${marker}`);
    }
    for (const marker of ["KIDS_QUIZ_LEARNING_CENTER_V4","KIDS_QUIZ_MOBILE_NEXT_V5"]) {
      if (!quizCss.includes(marker)) failed += fail(`Kids Quiz Layout-Schutz fehlt: ${marker}`);
    }
  }

  // KIDS_GLOBAL_DETAIL_DOCK_V1247: one shared dock for detail and reading views.
  if (!doc.includes("KIDS_GLOBAL_DETAIL_DOCK_V1247")) {
    failed += fail("Kids: globaler Detail-Kopf muss dokumentiert bleiben");
  }
  const detailDockCss = path.join(ROOT, "kids/global-detail-dock-v1247.css");
  const detailDockJs = path.join(ROOT, "kids/global-detail-dock-v1247.js");
  if (!fs.existsSync(detailDockCss) || !fs.existsSync(detailDockJs)) {
    failed += fail("Kids: CSS/JS der globalen Detail-Navigation fehlen");
  } else {
    const dockJs = fs.readFileSync(detailDockJs, "utf8");
    const dockCss = fs.readFileSync(detailDockCss, "utf8");
    for (const id of ["psModal","msModal","syModal","dlModal","ghPlayer","duaHubDetail"]) {
      if (!dockJs.includes('id:"'+id+'"')) failed += fail("Kids-Detail-Dock: Seite fehlt: "+id);
    }
    for (const marker of ["kids-detail-appbar","kids-detail-dock-back","safe-area-inset-top"]) {
      if (!dockCss.includes(marker)) failed += fail("Kids-Detail-Dock CSS: "+marker+" fehlt");
    }
    // Read the approved release's cache version, not a frozen v1247 value.
    // Otherwise every legitimate update is blocked and never reaches devices.
    const release = JSON.parse(fs.readFileSync(path.join(ROOT, "kids/version.json"), "utf8"));
    const swVersion = String(release.visualSystem?.serviceWorkerCache || "").replace(/^v/, "");
    const compact = String(release.visualSystem?.compactGlobalTopDock || "");
    const dockCssRef = "global-detail-dock-v1247.css?v=" + swVersion;
    const dockJsRef = "global-detail-dock-v1247.js?v=" + (Number(swVersion)>=1249 ? swVersion : "1247");
    if (!/^\d+$/.test(swVersion)) failed += fail("Kids: Service-Worker-Cacheversion fehlt");
    if (compact === "v1248") {
      if (!doc.includes("KIDS_COMPACT_GLOBAL_TOP_DOCK_V1248") || !dockCss.includes("KIDS_COMPACT_GLOBAL_TOP_DOCK_V1248")) {
        failed += fail("Kids: kompakter globaler Top-Kopf V1248 fehlt");
      }
      for (const needle of [
        "min-height:calc(60px + env(safe-area-inset-top,0px))",
        "min-height:calc(64px + env(safe-area-inset-top,0px))",
        "min-width:44px!important",
        "white-space:normal!important",
        "max-height:none!important"
      ]) {
        if (!dockCss.includes(needle)) failed += fail("Kids-Detail-Dock kompakte Sicherheitsregel fehlt: "+needle);
      }
    }
    if (Number(swVersion)>=1249) {
      for (const needle of [
        "KIDS_DUA_FULLBLEED_EXPLANATION_CTA_V1249",
        "width:100vw!important",
        "margin:0 0 0 calc(50% - 50vw)!important",
        "grid-template-columns:46px minmax(0,1fr) 15px",
        "focus-visible"
      ]) if(!dockCss.includes(needle))failed+=fail("Kids Duʿāʾ edge/header or explain control missing: "+needle);
      if(!dockJs.includes("upgradeExplanationActions")||!dockJs.includes("btn.replaceChildren(icon,copy,arrow)")) {
        failed+=fail("Kids explanation button event-preserving decorator missing");
      }
    }
    if (Number(swVersion)>=1250) {
      const duaCss = fs.readFileSync(path.join(ROOT,"kids/dua-hub-v1219.css"),"utf8");
      const duaJs = fs.readFileSync(path.join(ROOT,"kids/dua-hub-v1219.js"),"utf8");
      for (const marker of [
        "KIDS_DUA_READER_HERO_INTRO_V1250",
        ".duahub-detail-intro",
        "font-size:clamp(18px,4.2vw,21px)",
        ".duahub-source a"
      ]) if(!duaCss.includes(marker))failed+=fail("Kids Duʿāʾ lesbare Lesehierarchie fehlt: "+marker);
      if(!duaJs.includes("KIDS_SOURCE_TEXT_ONLY_V1250") || duaJs.includes("Nachweis öffnen") ||
         !duaJs.includes("source.append(sourceLabel,sourceText)")) {
        failed+=fail("Kids Duʿāʾ muss überprüfbare Quellen nur als lesbaren Text zeigen, ohne externen Nachweis-Button");
      }
      const kidsSw = fs.readFileSync(path.join(ROOT,"kids/sw.js"),"utf8");
      // Die CSS-Datei folgt der Service-Worker-Version; der JS-Reader darf separat aktualisiert werden.
      const kidsHome = fs.readFileSync(path.join(ROOT,"kids/index.html"),"utf8");
      const readerScript = (kidsHome.match(/\/kids\/dua-hub-v1219\.js\?v=\d+/)||[])[0];
      const offlineFiles = ["dua-hub-v1219.css?v="+swVersion];
      if(readerScript)offlineFiles.push(readerScript.slice("/kids/".length));
      else failed+=fail("Kids Duʿāʾ Reader Script-Verweis fehlt in kids/index.html");
      for(const res of offlineFiles){
        if(!kidsSw.includes(res))failed+=fail("Kids Duʿāʾ Reader nicht offline-cached: "+res);
      }
      if(!doc.includes("KIDS_DUA_READER_HERO_INTRO_V1250")){
        failed+=fail("Kids Duʿāʾ Lesehierarchie V1250 nicht dokumentiert");
      }
    }
    if(Number(swVersion)>=1251){
      if(!dockJs.includes("KIDS_NO_EXTERNAL_SOURCE_PROOF_ACTIONS_V1251") ||
         !dockJs.includes("removeExternalSourceProofActions();")) {
        failed+=fail("Kids externe Nachweis-/Quelle-Öffnen-Aktionen sind nicht global entfernt");
      }
      const pages=["kids/index.html","kids/start.html","kids/shell.html"];
      for(const file of pages){
        const content=fs.readFileSync(path.join(ROOT,file),"utf8");
        if(content.includes(">Quelle öffnen</a>")||content.includes(">Nachweis öffnen</a>")) {
          failed+=fail(file+": externer Quellennachweis-Link in Kinder-App");
        }
      }
    }
    for (const file of ["kids/index.html","kids/start.html","kids/shell.html"]) {
      const page = fs.readFileSync(path.join(ROOT, file), "utf8");
      for (const asset of [dockCssRef,dockJsRef]) {
        if (!page.includes(asset)) failed += fail(file+": globaler Detail-Kopf fehlt: "+asset);
      }
    }
    const sw = fs.readFileSync(path.join(ROOT, "kids/sw.js"), "utf8");
    // swVersion is the PINNED detail-dock/dua asset query version.
    // The global service worker cache advances independently for Salah and other Kids features.
    const liveCacheMatch = sw.match(/const CACHE_NAME=["']dar-al-tawhid-kids-v(\d+)["']/);
    const liveCacheVersion = liveCacheMatch ? Number(liveCacheMatch[1]) : 0;
    const buildCacheMatch = String(release.buildId || "").match(/(\d+)$/);
    const buildCacheVersion = buildCacheMatch ? Number(buildCacheMatch[1]) : 0;
    if (!liveCacheMatch || liveCacheVersion < Number(swVersion) ||
        liveCacheVersion !== buildCacheVersion ||
        !sw.includes(dockCssRef) || !sw.includes(dockJsRef)) {
      failed += fail("Kids: Service Worker enthält nicht die aktuelle CSS/JS-Offlineversion "+swVersion);
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
