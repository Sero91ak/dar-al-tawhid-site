#!/usr/bin/env node
/**
 * ADMIN SLIDE MODE UI GUARD
 *
 * Prüft, dass der Admin-Beitrag-Flow eine sichtbare Auswahl
 * „Einzelbeitrag“ / „Slide-Modus“ besitzt und vor dem Publish validiert.
 *
 * Usage: node scripts/admin-slide-mode-ui-guard.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const PARSER = path.join(ROOT, "assets/slide-post-parser.js");
const ADMIN_INDEX = path.join(ROOT, "admin/index.html");
const LIVE_EDIT = path.join(ROOT, "admin/live-edit.js");

function fail(message, failures) {
  console.error("ADMIN-SLIDE-MODE-UI-GUARD FAIL:", message);
  failures.count += 1;
}

function ok(message) {
  console.log("ADMIN-SLIDE-MODE-UI-GUARD OK:", message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function run() {
  const failures = { count: 0 };

  if (!fs.existsSync(PARSER)) fail("assets/slide-post-parser.js fehlt", failures);
  if (!fs.existsSync(ADMIN_INDEX)) fail("admin/index.html fehlt", failures);
  if (!fs.existsSync(LIVE_EDIT)) fail("admin/live-edit.js fehlt", failures);
  if (failures.count) process.exit(1);

  const parser = read(PARSER);
  const adminIndex = read(ADMIN_INDEX);
  const liveEdit = read(LIVE_EDIT);

  const requiredParserSnippets = [
    "Einzelbeitrag posten",
    "Slide-Modus posten",
    "data-dar-post-publish-mode",
    "data-dar-post-mode-box",
    "ensureSlideFrontmatter",
    "ensureSingleFrontmatter",
    "prepareAdminPostMarkdown",
    "prepareMarkdownForMode",
    "formatSlideStatusLine",
    'validateSlideMarkdown(next, { mode: "slide" })',
    "installAdminPostModeEnhancer"
  ];

  requiredParserSnippets.forEach((snippet) => {
    if (!parser.includes(snippet)) fail(`Parser/Admin-Enhancer fehlt: ${snippet}`, failures);
    else ok(`Parser/Admin-Enhancer enthält: ${snippet}`);
  });

  const requiredAdminSnippets = [
    'name="newPostMode"',
    "Komplettes Markdown einfügen",
    "checkNewPostBtn",
    "previewNewPostBtn",
    "Erweitert",
    "prepareMarkdownForMode",
    "selectedNewPostMode"
  ];
  requiredAdminSnippets.forEach((snippet) => {
    if (!adminIndex.includes(snippet)) fail(`admin/index.html fehlt: ${snippet}`, failures);
    else ok(`admin/index.html enthält: ${snippet}`);
  });

  if (!adminIndex.includes("slide-post-parser.js")) {
    fail("admin/index.html lädt slide-post-parser.js nicht", failures);
  } else {
    ok("admin/index.html lädt slide-post-parser.js");
  }

  if (!liveEdit.includes("data-live-editor-publish")) {
    fail("admin/live-edit.js besitzt keinen Publish-Button-Hook", failures);
  } else {
    ok("admin/live-edit.js Publish-Button-Hook vorhanden");
  }

  if (!liveEdit.includes("prepareMarkdownForMode") || !liveEdit.includes("selectedLivePostMode")) {
    fail("admin/live-edit.js buildPostMarkdown berücksichtigt den Modus nicht", failures);
  } else {
    ok("admin/live-edit.js buildPostMarkdown ist modus-bewusst");
  }

  const sandbox = {
    window: {},
    global: {},
    document: undefined,
    MutationObserver: function () {
      return { observe() {} };
    },
    setTimeout() {}
  };
  sandbox.global = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(parser, sandbox);
  const P = sandbox.window.DARSlidePostParser;

  if (!P) fail("DARSlidePostParser wurde nicht exportiert", failures);
  else ok("DARSlidePostParser exportiert");

  const rawSlide = [
    "# Qiyās",
    "<!-- slide: 1 -->",
    "# Erste Aussage",
    "Text eins",
    "<!-- slide: 2 -->",
    "# Zweite Aussage",
    "Text zwei"
  ].join("\n");

  if (P) {
    const preparedSlide = P.ensureSlideFrontmatter(rawSlide, {
      id: "qiyas-test",
      title: "Qiyās Test",
      status: "published"
    });
    if (!preparedSlide.includes('type: "slide"')) fail("Slide-Frontmatter setzt type nicht", failures);
    else ok("Slide-Frontmatter setzt type");
    if (!preparedSlide.includes('layout: "slides"')) fail("Slide-Frontmatter setzt layout nicht", failures);
    else ok("Slide-Frontmatter setzt layout");
    const validation = P.validateSlideMarkdown(preparedSlide, { mode: "slide" });
    if (!validation.ok || validation.info.slideCount !== 2) {
      fail(`Prepared Slide sollte 2 Slides validieren, bekam ${validation.info?.slideCount}`, failures);
    } else {
      ok("Prepared Slide validiert 2 Slides");
    }

    const modePrepared = P.prepareMarkdownForMode(rawSlide, "slide", {
      id: "qiyas-test",
      title: "Qiyās Test",
      status: "published"
    });
    if (!modePrepared.ok || modePrepared.info.slideCount !== 2) {
      fail("prepareMarkdownForMode(slide) sollte 2 Slides liefern", failures);
    } else {
      ok("prepareMarkdownForMode(slide) liefert 2 Slides");
    }

    const blockedSingle = P.prepareMarkdownForMode(rawSlide, "single", {});
    if (blockedSingle.ok) fail("Einzelbeitrag blockiert Slide-Marker nicht", failures);
    else ok("Einzelbeitrag blockiert Slide-Marker");

    const status = P.formatSlideStatusLine(preparedSlide, "slide");
    if (!/✓ Slide-Beitrag erkannt · 2 Slides/.test(status)) {
      fail(`formatSlideStatusLine falsch: ${status}`, failures);
    } else {
      ok("formatSlideStatusLine meldet Slide-Anzahl");
    }

    const single = P.ensureSingleFrontmatter(preparedSlide, { status: "published" });
    if (/^type:\s*["']?slide/m.test(single) || /^layout:\s*["']?slides/m.test(single)) {
      fail("Einzelbeitrag entfernt Slide-Frontmatter nicht", failures);
    } else {
      ok("Einzelbeitrag entfernt Slide-Frontmatter");
    }
  }


  if (!adminIndex.includes("UI-Auswahl hat Vorrang") && !adminIndex.includes("checked.value===\"slide\"?\"slide\":\"single\"")) {
    // selectedNewPostMode must trust radio when present
  }
  if (!adminIndex.includes('if(checked)return checked.value==="slide"?"slide":"single"') && !adminIndex.includes("if(checked)return checked.value===\"slide\"")) {
    fail('admin/index.html selectedNewPostMode muss Radio-Auswahl priorisieren', failures);
  } else {
    ok('admin/index.html selectedNewPostMode priorisiert Radio');
  }

  if (P) {
    const typed = [
      "---",
      'title: "X"',
      'type: "slide"',
      'layout: "slides"',
      "---",
      "Nur Text"
    ].join("\n");
    const asSingle = P.prepareMarkdownForMode(typed, "single", { id: "x", title: "X" });
    if (!asSingle.ok || /type:\s*["']?slide/m.test(asSingle.markdown)) {
      fail("Einzelbeitrag muss type:slide ohne Marker normalisieren", failures);
    } else {
      ok("Einzelbeitrag normalisiert type:slide ohne Marker");
    }
  }

  if (failures.count) {
    console.error(`\n${failures.count} Admin-Slide-Mode-Prüfung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("\nAdmin-Slide-Mode-UI-Guard: alle Prüfungen bestanden.");
}

run();
