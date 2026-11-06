#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { plan } = require("./push-locale-dry-run.cjs");
require("./build-locale-coverage-report.cjs");
const report = JSON.parse(fs.readFileSync(path.join(__dirname, "locale-coverage-report.json"), "utf8"));
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "adult-ui-locales-seven.json"), "utf8"));
const protectedText = "Für eine Beurteilung des persönlichen Einzelfalls müssen der tatsächliche Grund und die Umstände geprüft werden. Wa-Allāhu aʿlam.";

assert.equal(report.acceptance.uiComplete, false);
assert.equal(report.acceptance.contentComplete, false);
assert.equal(report.acceptance.platformPushComplete, false);
assert.equal(report.ui.keys, Object.keys(catalog.translations.en).length);
assert.equal(catalog.translations.ku["Wissen durchsuchen"], "Li zanînê bigere");
assert.equal(catalog.translations.es["Keine Werke"], "No hay obras");
assert.equal(catalog.translations.ku[protectedText], undefined);
assert.equal(report.content.posts.humanApproval, false);
assert.equal(report.content.surface.humanApproval, false);
assert.equal(report.content.posts.approved, 0);
assert.equal(report.content.surface.approved, 0);
assert.equal(report.content.quranMeanings.reviewedEightLanguagePack, false);
assert.equal(report.content.blocked.blockedItems, 69);
assert.ok(report.routes.length >= 30);
assert.ok(report.routes.every(route => route.visual === "not-tested"));
assert.ok(report.routes.every(route => Object.values(route.locales).every(state => state === "not-tested")));
for (const code of ["ku", "ckb", "es", "ar"]) {
  const row = plan(code);
  assert.equal(row.send, false);
  assert.equal(row.claimedDelivered, false);
  assert.equal(row.doubleDelivery, false);
}
assert.equal(plan("ku").status, "blocked-provider");
assert.equal(plan("ckb").providerLanguage, null);
assert.equal(plan("es").providerLanguage, "es");
assert.equal(report.push.liveSend, false);
assert.ok(report.platforms.find(row => row.id === "kids" && row.changed === false));
assert.ok(report.platforms.find(row => row.id === "widgets" && row.changed === false));
console.log("PASS: acceptance report stays honest: UI " + report.ui.keys + " keys, " + report.ui.missingDistinct + " residual literals, " + report.routes.length + " routes not visually tested, ku/ckb push blocked, no approval");
