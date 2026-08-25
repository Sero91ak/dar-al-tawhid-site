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
    "validateSlideMarkdown(next)",
    "installAdminPostModeEnhancer"
  ];

  requiredParserSnippets.forEach((snippet) => {
    if (!parser.includes(snippet)) fail(`Parser/Admin-Enhancer fehlt: ${snippet}`, failures);
    else ok(`Parser/Admin-Enhancer enthält: ${snippet}`);
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
    const validation = P.validateSlideMarkdown(preparedSlide);
    if (!validation.ok || validation.info.slideCount !== 2) {
      fail(`Prepared Slide sollte 2 Slides validieren, bekam ${validation.info?.slideCount}`, failures);
    } else {
      ok("Prepared Slide validiert 2 Slides");
    }

    const single = P.ensureSingleFrontmatter(preparedSlide, { status: "published" });
    if (/^type:\s*["']?slide/m.test(single) || /^layout:\s*["']?slides/m.test(single)) {
      fail("Einzelbeitrag entfernt Slide-Frontmatter nicht", failures);
    } else {
      ok("Einzelbeitrag entfernt Slide-Frontmatter");
    }
  }

  if (failures.count) {
    console.error(`\n${failures.count} Admin-Slide-Mode-Prüfung(en) fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("\nAdmin-Slide-Mode-UI-Guard: alle Prüfungen bestanden.");
}

run();
