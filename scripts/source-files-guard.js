#!/usr/bin/env node
/**
 * SOURCE FILES GUARD: blockiert Deploy wenn Quellen-Upload in Admin/Worker fehlt.
 *
 * Usage: node scripts/source-files-guard.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function runSourceFilesGuard() {
  let failed = 0;

  function fail(msg) {
    console.error("SOURCE-FILES-GUARD FAIL:", msg);
    failed += 1;
  }

  function ok(msg) {
    console.log("SOURCE-FILES-GUARD OK:", msg);
  }

  function mustInclude(label, content, needles) {
    for (const needle of needles) {
      if (!content.includes(needle)) {
        fail(`${label}: fehlt „${needle}“`);
        return false;
      }
    }
    ok(`${label}: alle Pflicht-Marker (${needles.length})`);
    return true;
  }

  const admin = read("admin/index.html");
  const worker = read("cloudflare/worker.js");

  mustInclude("admin/index.html", admin, [
    "SOURCE FILES GUARD FINAL",
    "renderSourceFilesPanel",
    "appendLinkToMarkdown",
    "buildSourceStoragePath",
    "assets/sources/",
    "SOURCE_MAX_BYTES",
    "Quellen-Dateien",
    "Zum Markdown hinzufügen",
    "Speichern und Markdown aktualisieren",
    "Zum Beitrag hinzufügen",
    "sources/list",
    "renderQuellen",
    "Bestehende Beiträge bearbeiten",
    "quellen-manager.js",
    "Quelle testen",
    "validateBeforeSourceSave"
  ]);

  mustInclude("admin/quellen-manager.js", read("admin/quellen-manager.js"), [
    "appendLinkToMarkdownTarget",
    "removeLinkFromMarkdownTarget",
    "setSlideMediaField",
    "validateSourceSave",
    "parseQuellenCatalogHead"
  ]);

  mustInclude("admin/index.html kurzlink", admin, [
    "KURZLINK GUARD",
    "kurzlink-manager.js",
    "renderKurzlinks",
    "Kurzlinks — nur Weiterleitung",
    "shortlinks/save",
    "shortlinks/import",
    "shortlinks/create",
    "Custom GPT Action — vollautomatisch",
    "gpt-instagram-channel-openapi.yaml",
    "parseChatGptImport",
    "Links automatisch anlegen",
    "bindKurzlinksUi",
  ]);

  mustInclude("admin/kurzlink-manager.js", read("admin/kurzlink-manager.js"), [
    "parseChatGptImport",
    "buildImportPreviewBlock",
    "CHATGPT_IMPORT_PROMPT",
    "isAllowedTargetUrl",
    "buildRedirectHtml",
    "validateCreateInput",
    "buildCreatePayload",
    "buildChannelShareText",
    "buildImageShareText",
    "GPT_ACTION_INSTRUCTIONS",
    "GPT_ACTION_OPENAPI_URL"
  ]);

  mustInclude("worker.js", worker, [
    "SOURCE FILES GUARD FINAL",
    "DEFAULT_SOURCES_DIR",
    "githubCreateBinaryBlob",
    "/api/admin/sources/list",
    "normalizeSourceFilesInput",
    "listSourceFiles",
    "prepareSourceCommitEntries",
    "scanSourceUsageInPosts",
    "/api/admin/shortlinks",
    "/api/admin/shortlinks/import",
    "/api/admin/shortlinks/create",
    "/api/admin/shortlinks/channel-create",
    "createShortlinkEntry",
    "createInstagramChannelPost",
    "validatePostShortlinkForPublish",
    "kurzlink-admin.js"
  ]);

  if (!fs.existsSync(path.join(ROOT, "assets/sources/.gitkeep"))) {
    fail("assets/sources/.gitkeep fehlt");
  } else {
    ok("assets/sources/.gitkeep vorhanden");
  }

  if (!admin.includes('renderSourceFilesPanel("draft")') || !admin.includes('renderSourceFilesPanel("ordner")') || !admin.includes('renderSourceFilesPanel("quellen")')) {
    fail("admin: Quellen-Panel fehlt im Einzelbeitrag, Ordner- oder Quellen-Editor");
  } else {
    ok("admin: Quellen-Panel in Einzelbeitrag + Ordner-Editor + Quellen-Tab");
  }

  if (!admin.includes("collectSourceFilesForWorker()") || !worker.includes("input.sourceFiles")) {
    fail("Publish/Update muss sourceFiles an Worker senden");
  } else {
    ok("sourceFiles in Publish/Update-Flow");
  }

  if (!fs.existsSync(path.join(ROOT, "content/admin/source-shortlinks.json"))) {
    fail("content/admin/source-shortlinks.json fehlt");
  } else {
    ok("content/admin/source-shortlinks.json vorhanden");
  }

  return failed;
}

if (require.main === module) {
  const failed = runSourceFilesGuard();
  if (failed) {
    console.error(`\n${failed} Source-Files-Guard-Prüfung(en) fehlgeschlagen – Deploy blockiert.`);
    process.exit(1);
  }
  console.log("\nSource-Files-Schutz: alle Prüfungen bestanden.");
}

module.exports = { runSourceFilesGuard };
