#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { plan, ALL } = require("./push-locale-dry-run.cjs");

const root = path.resolve(__dirname, "../..");
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "adult-ui-locales-seven.json"), "utf8"));
const gaps = JSON.parse(fs.readFileSync(path.join(__dirname, "locale-ui-gaps.json"), "utf8"));
const posts = JSON.parse(fs.readFileSync(path.join(__dirname, "adult-content-machine-drafts.json"), "utf8"));
const surface = JSON.parse(fs.readFileSync(path.join(__dirname, "adult-surface-drafts.json"), "utf8"));
const blocked = JSON.parse(fs.readFileSync(path.join(root, "desktop-preview/i18n-core-v1/blocked-source-review.json"), "utf8"));

function tally(records) {
  const byKind = {};
  let approved = 0;
  let drafts = 0;
  for (const record of Object.values(records || {})) {
    const kind = record.kind || "unknown";
    byKind[kind] = (byKind[kind] || 0) + 1;
    if (record.humanApproval === true) approved++;
    if (record.status === "draft" || record.humanApproval === false) drafts++;
  }
  return { records: Object.keys(records || {}).length, byKind, approved, drafts };
}

const ROUTES = [
  "home", "recent", "topics", "topic", "post", "quran", "quran-surah", "quran-player", "quran-topic",
  "duas", "dua", "hadith", "bibliothek", "bibliothek-detail", "bibliothek-reader", "books", "scholars",
  "prayer", "qibla", "quiz", "zakat", "wasiyyah", "propheten", "frauen", "news", "news-detail",
  "settings", "more", "account", "statistik", "jummah", "ramadan", "quellen-book", "quellen-scholar"
];

const patternCovered = new Set(["Noch", "Noch ca.", "/5 gewählt", "öffnen", "· öffnen", "wird", "märz"]);
const searchIndex = new Set([
  "alle", "gebet", "nicht", "keine", "noch", "auswählen", "anfänger", "gläubigen", "ungläubigen",
  "apps apple tv fernseher kids tawhid kinder iphone ipad familie verfügbar bald entdecken",
  "salah salat namaz gebet"
]);
const protectedText = "Für eine Beurteilung des persönlichen Einzelfalls müssen der tatsächliche Grund und die Umstände geprüft werden. Wa-Allāhu aʿlam.";

const classified = gaps.topGaps.map(row => {
  let className = "review";
  if (patternCovered.has(row.text) || row.text.includes("\\s+")) className = "pattern-or-code";
  else if (searchIndex.has(row.text)) className = "search-index-or-fragment";
  else if (row.text === protectedText || row.text === "nicht nach dem richtet") className = "protected-religious-text";
  return { ...row, className, owner: className === "protected-religious-text" ? "redaktion-quellenpruefung" : "dar-test-ui" };
});

const report = {
  schemaVersion: 2,
  generatedAt: "2026-10-24T20:10:00Z",
  scope: "dar-test-adult",
  acceptance: {
    uiComplete: false,
    contentComplete: false,
    platformPushComplete: false,
    reason: "Die Zahl der Katalogschlüssel ist kein Beleg für 100 % der Ansichten. Visuelle Prüfung je Route und Sprache steht aus. Religiöse Entwürfe sind nicht freigegeben."
  },
  locales: catalog.availableLocales,
  ui: {
    keys: Object.keys(catalog.translations.en).length,
    filesScanned: gaps.filesScanned,
    germanLookingLiterals: gaps.germanLookingLiterals,
    alreadyInCatalog: gaps.alreadyInCatalog,
    missingDistinct: gaps.missingDistinct,
    gaps: classified,
    note: "Der Scanner sieht Zeichenketten, keine gerenderten Bildschirme. Kurze Suchfragmente und geschützte religiöse Sätze bleiben absichtlich ohne neuen Schlüssel."
  },
  routes: ROUTES.map(route => ({
    route,
    locales: Object.fromEntries(ALL.map(code => [code, "not-tested"])),
    visual: "not-tested",
    automated: "string-inventory-only",
    blocker: "Kein Browser-Durchlauf dieser Route in den neun Sprachen."
  })),
  content: {
    posts: { ...tally(posts.records), humanApproval: posts.humanApproval, status: posts.status },
    surface: { ...tally(surface.records), humanApproval: surface.humanApproval, status: surface.status, locales: surface.locales },
    blocked: blocked.summary,
    quranMeanings: {
      targetAyat: 6236,
      reviewedEightLanguagePack: false,
      arabicOriginalUnchanged: true,
      shownState: "deutsche Fassung mit Hinweis, keine erfundenen Bedeutungen",
      blocker: "Keine fachlich freigegebene Acht-Sprachen-Bedeutung je Āyah."
    },
    approvalRule: "humanApproval true wurde nicht gesetzt und nicht behauptet."
  },
  push: {
    liveSend: false,
    plans: Object.fromEntries(ALL.map(code => [code, plan(code)])),
    blocker: "ku und ckb haben keinen OneSignal-Sprachcode. Der Dry-Run versendet nichts und meldet keine Zustellung."
  },
  platforms: [
    { id: "dar-test", changed: true, visual: "not-tested" },
    { id: "visitor-app", changed: false, visual: "not-tested", blocker: "Keine Live-Freigabe." },
    { id: "pwa-android", changed: false, visual: "not-tested", blocker: "Gemeinsamer Webcode, in diesem Lauf nicht auf dem Gerät geprüft." },
    { id: "ios-webview", changed: false, visual: "not-tested", blocker: "Keine Xcode- oder Widget-Änderung." },
    { id: "kids", changed: false, visual: "not-tested", blocker: "Kids ist eine eigene App und wurde nicht angefasst." },
    { id: "widgets", changed: false, visual: "not-tested", blocker: "Widget-Ziele und Entitlements bleiben unverändert." }
  ]
};

const out = path.join(__dirname, "locale-coverage-report.json");
fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({
  uiKeys: report.ui.keys,
  gaps: report.ui.missingDistinct,
  posts: report.content.posts.records,
  surface: report.content.surface.records,
  surfaceApproved: report.content.surface.approved,
  routes: report.routes.length,
  ku: report.push.plans.ku.status
}, null, 2));
