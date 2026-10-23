#!/usr/bin/env node
/* Offline DAR TEST gate for adult interface coverage.
 * Editorial posts, Qurʾān originals and source quotations are intentionally excluded.
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pack = JSON.parse(fs.readFileSync(path.join(root, "test/i18n/adult-ui-locales-seven.json"), "utf8"));
const locales = ["de", "tr", "en", "ar", "ku", "ckb", "bs", "fr", "es"];
const pages = ["Startseite", "Qurʾān Player", "Duʿāʾ", "Bibliothek", "Gebetszeiten", "Qibla", "Suche", "Konto", "Einstellungen"];
const sourceKeys = Object.keys(pack.translations.tr || {});
const protectedSourceKeys = new Set([
    "Qibla", "Ḥadīṯ", "Duʿāʾ", "Qurʾān", "Audio", "DĀR AL TAWḤĪD",
    "As-salāmu ʿalaikum wa raḥmatullāhi wa barakātuh",
    "Tafsīr", "Tadabbur", "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh",
    "Fajr", "Faǧr", "Ẓuhr", "Dhuhr", "Zuhr", "ʿAṣr", "Asr", "Maghrib",
    "ʿIshāʾ", "Isha", "Rāwī", "Nabī / Rasūl",
    "„Dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.“"
]);
const rows = locales.map(locale => {
    const dictionary = locale === "de" ? {} : (pack.translations[locale] || {});
    const missing = sourceKeys.filter(key => locale !== "de" && !String(dictionary[key] || "").trim());
    const germanRest = sourceKeys.filter(key => locale !== "de" && dictionary[key] === key && !protectedSourceKeys.has(key));
    return {
        locale,
        direction: ["ar", "ckb"].includes(locale) ? "rtl" : "ltr",
        sourceTextCount: sourceKeys.length,
        translatedTextCount: locale === "de" ? sourceKeys.length : Object.keys(dictionary).length,
        missingCount: missing.length,
        germanRestCount: germanRest.length,
        status: locale === "de" || (missing.length === 0 && germanRest.length === 0) ? "covered" : "blocked"
    };
});
const result = {
    schemaVersion: 1,
    environment: "DAR TEST",
    scope: "adult-interface-only",
    excluded: ["posts", "Qurʾān originals", "religious source quotations"],
    sourceTextCount: sourceKeys.length,
    pages,
    locales: rows,
    rtlLocales: ["ar", "ckb"],
    complete: rows.every(row => row.status === "covered")
};
console.log(JSON.stringify(result, null, 2));
if (!result.complete) process.exitCode = 2;
