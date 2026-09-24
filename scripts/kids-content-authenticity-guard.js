#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail(`${rel}: Datei fehlt`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (error) {
    fail(`${rel}: ungültiges JSON (${error.message})`);
    return null;
  }
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueIds(items, rel) {
  const seen = new Set();
  for (const item of items) {
    if (!item || !nonEmpty(item.id)) {
      fail(`${rel}: sichtbarer Eintrag ohne id`);
      continue;
    }
    if (seen.has(item.id)) fail(`${rel}: doppelte id ${item.id}`);
    seen.add(item.id);
  }
}

function validateAge(item, rel) {
  if (!Number.isInteger(Number(item.ageMin)) || !Number.isInteger(Number(item.ageMax))) {
    fail(`${rel}:${item.id}: ageMin/ageMax fehlen`);
    return;
  }
  const min = Number(item.ageMin);
  const max = Number(item.ageMax);
  if (min < 4 || max > 10 || min > max) {
    fail(`${rel}:${item.id}: ungültige Altersgrenze ${min}–${max}`);
  }
}

function rejectHiddenStatus(obj, rel, id) {
  if (!obj || typeof obj !== "object") return;
  if (obj.freigabeDurchSerhat === false) {
    fail(`${rel}:${id}: freigabeDurchSerhat=false darf nicht sichtbar sein`);
  }
  for (const key of ["quellenstatus", "status", "verificationStatus", "verification"]) {
    const value = String(obj[key] || "").toLowerCase();
    if (["nicht-anzeigen", "in-pruefung", "unverified", "draft", "rejected"].includes(value)) {
      fail(`${rel}:${id}: verbotener sichtbarer Status ${key}=${obj[key]}`);
    }
  }
}

const canonicalDuas = readJson("content/duas/duas.json") || [];
const canonicalDuaMap = new Map(
  (Array.isArray(canonicalDuas) ? canonicalDuas : []).map((item) => [String(item.id), item])
);

const canonicalQuizRaw = readJson("data/quiz-questions.json") || [];
const canonicalQuiz = Array.isArray(canonicalQuizRaw)
  ? canonicalQuizRaw
  : canonicalQuizRaw.questions || canonicalQuizRaw.items || [];
const canonicalQuizMap = new Map(canonicalQuiz.map((item) => [String(item.id), item]));

function validateDuas() {
  const rel = "test/kids/data/dua-kids.json";
  const data = readJson(rel);
  if (!data) return;
  if (data?.policy?.status !== "verified-only") {
    fail(`${rel}: policy.status muss verified-only sein`);
  }
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length < 4) fail(`${rel}: zu wenige freigegebene Einträge`);
  uniqueIds(items, rel);

  for (const item of items) {
    rejectHiddenStatus(item, rel, item.id);
    validateAge(item, rel);

    if (item.verification !== "verified") fail(`${rel}:${item.id}: verification muss verified sein`);
    for (const key of ["title", "childPrompt", "arabic", "transliteration", "meaning", "source"]) {
      if (!nonEmpty(item[key])) fail(`${rel}:${item.id}: ${key} fehlt`);
    }

    if (!["quran", "sunnah"].includes(item.type)) {
      fail(`${rel}:${item.id}: type muss quran oder sunnah sein`);
    }

    if (item.type === "quran") {
      if (!/^Qurʾān[, ·]/.test(String(item.source || ""))) {
        fail(`${rel}:${item.id}: Qurʾān-Eintrag ohne Qurʾān-Quelle`);
      }
      if (!Array.isArray(item.quranRefs) || item.quranRefs.length === 0) {
        fail(`${rel}:${item.id}: Qurʾān-Eintrag braucht quranRefs für echte Rezitation`);
      } else {
        for (const ref of item.quranRefs) {
          const s = Number(ref?.surah);
          const a = Number(ref?.ayah);
          if (!Number.isInteger(s) || s < 1 || s > 114 || !Number.isInteger(a) || a < 1) {
            fail(`${rel}:${item.id}: ungültige quranRef ${JSON.stringify(ref)}`);
          }
        }
      }
    }

    if (item.type === "sunnah") {
      if (!nonEmpty(item.grade)) fail(`${rel}:${item.id}: Sunnah-Eintrag ohne Einstufung`);
      if (!nonEmpty(item.sourceUrl)) fail(`${rel}:${item.id}: Sunnah-Eintrag ohne Direktnachweis`);
      const grade = String(item.grade || "").toLowerCase();
      if (!(grade.includes("ṣaḥīḥ") || grade.includes("ṣaḥih") || grade.includes("ḥasan"))) {
        fail(`${rel}:${item.id}: nicht freigegebene Sunnah-Einstufung ${item.grade}`);
      }
    }

    if (item.canonicalId) {
      const canonical = canonicalDuaMap.get(String(item.canonicalId));
      if (!canonical) {
        fail(`${rel}:${item.id}: canonicalId ${item.canonicalId} fehlt in content/duas/duas.json`);
      } else {
        const checks = [
          ["arabic", item.arabic, canonical.ar],
          ["transliteration", item.transliteration, canonical.tr],
          ["meaning", item.meaning, canonical.de]
        ];
        for (const [label, childValue, canonicalValue] of checks) {
          if (normalize(childValue) !== normalize(canonicalValue)) {
            fail(`${rel}:${item.id}: ${label} weicht von ${item.canonicalId} ab`);
          }
        }
      }
    }

    if (!item.quiz || !nonEmpty(item.quiz.question) || !Array.isArray(item.quiz.answers)) {
      fail(`${rel}:${item.id}: Lernfrage fehlt`);
    } else {
      const correct = item.quiz.answers.filter((a) => a && a.correct === true);
      if (correct.length !== 1) fail(`${rel}:${item.id}: Lernfrage braucht genau eine richtige Antwort`);
    }
  }
}

function validateQuiz() {
  const rel = "test/kids/data/quiz-kids.json";
  const data = readJson(rel);
  if (!data) return;
  if (data?.policy?.status !== "approved-only") fail(`${rel}: policy.status muss approved-only sein`);
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length < 1) fail(`${rel}: keine freigegebenen Quizfragen`);
  uniqueIds(items, rel);

  for (const item of items) {
    rejectHiddenStatus(item, rel, item.id);
    validateAge(item, rel);

    if (item.verification !== "approved") fail(`${rel}:${item.id}: verification muss approved sein`);
    if (item.canonicalStatus !== "published") fail(`${rel}:${item.id}: canonicalStatus muss published sein`);
    if (item.canonicalReviewStatus !== "approved") fail(`${rel}:${item.id}: canonicalReviewStatus muss approved sein`);
    for (const key of ["canonicalQuizId", "question", "sourceType", "source", "success", "retry"]) {
      if (!nonEmpty(item[key])) fail(`${rel}:${item.id}: ${key} fehlt`);
    }
    if (!Array.isArray(item.answers) || item.answers.length < 2) {
      fail(`${rel}:${item.id}: mindestens zwei Antworten erforderlich`);
    } else if (item.answers.filter((a) => a && a.correct === true).length !== 1) {
      fail(`${rel}:${item.id}: genau eine richtige Antwort erforderlich`);
    }

    const canonical = canonicalQuizMap.get(String(item.canonicalQuizId));
    if (!canonical) {
      fail(`${rel}:${item.id}: canonicalQuizId ${item.canonicalQuizId} fehlt`);
      continue;
    }
    if (canonical.status !== "published" || canonical.reviewStatus !== "approved") {
      fail(`${rel}:${item.id}: kanonische Frage ist nicht published+approved`);
    }
    if (canonical.sourceChecked !== true || canonical.wordingChecked !== true) {
      fail(`${rel}:${item.id}: kanonische Quellen-/Wortlautprüfung fehlt`);
    }
    if (Array.isArray(canonical.validationErrors) && canonical.validationErrors.length) {
      fail(`${rel}:${item.id}: kanonische validationErrors vorhanden`);
    }
    if (normalize(item.source) !== normalize(canonical.source)) {
      fail(`${rel}:${item.id}: Quellenangabe weicht von ${item.canonicalQuizId} ab`);
    }
  }
}

function validateStories() {
  const rel = "test/kids/data/stories-authentic.json";
  const data = readJson(rel);
  if (!data) return;
  if (data?.policy?.status !== "approved-only") fail(`${rel}: policy.status muss approved-only sein`);
  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) fail(`${rel}: keine authentischen Geschichten`);
  uniqueIds(items, rel);

  for (const item of items) {
    rejectHiddenStatus(item, rel, item.id);
    validateAge(item, rel);
    if (item.verification !== "approved") fail(`${rel}:${item.id}: verification muss approved sein`);
    for (const key of ["prophetId", "title", "text", "category"]) {
      if (!nonEmpty(item[key])) fail(`${rel}:${item.id}: ${key} fehlt`);
    }
    if (!Array.isArray(item.claimIds) || item.claimIds.length === 0) fail(`${rel}:${item.id}: claimIds fehlen`);
    if (!Array.isArray(item.sourceRefs) || item.sourceRefs.length === 0) {
      fail(`${rel}:${item.id}: sourceRefs fehlen`);
    } else if (item.sourceRefs.some((s) => !/^Qurʾān\s/.test(String(s)))) {
      fail(`${rel}:${item.id}: authentische Story enthält Nicht-Qurʾān-Quelle`);
    }
    if (!item.question || typeof item.question !== "object") fail(`${rel}:${item.id}: Verständnisfrage fehlt`);
  }
}

function validateVerifiedPool() {
  const rel = "test/kids/data/verified-content.json";
  const data = readJson(rel);
  if (!data) return;

  if (data?.policy?.rule && !String(data.policy.rule).includes("eindeutig")) {
    warn(`${rel}: policy.rule ungewöhnlich formuliert`);
  }

  const groups = [
    ["hadithLessons", data.hadithLessons || []],
    ["earlyLessons", data.earlyLessons || []]
  ];

  for (const [group, items] of groups) {
    if (!Array.isArray(items)) {
      fail(`${rel}: ${group} ist kein Array`);
      continue;
    }
    uniqueIds(items, `${rel}:${group}`);
    for (const item of items) {
      rejectHiddenStatus(item, rel, item.id);
      if (item.verificationStatus !== "verified") {
        fail(`${rel}:${item.id}: verificationStatus muss verified sein`);
      }
      if (!Array.isArray(item.ages) || item.ages.length === 0) fail(`${rel}:${item.id}: ages fehlen`);
      for (const key of ["title", "childExplanation", "source", "exactText"]) {
        if (!nonEmpty(item[key])) fail(`${rel}:${item.id}: ${key} fehlt`);
      }
      if (!nonEmpty(item.canonicalId)) fail(`${rel}:${item.id}: canonicalId fehlt`);
      if (group === "hadithLessons") {
        if (item.grade !== "Ṣaḥīḥ") fail(`${rel}:${item.id}: Ḥadīṯ-Lektion muss Ṣaḥīḥ sein`);
      }
      if (group === "earlyLessons") {
        if (!nonEmpty(item.person) || !nonEmpty(item.generation)) fail(`${rel}:${item.id}: Person/Generation fehlt`);
        if (!nonEmpty(item.sourceUrl)) fail(`${rel}:${item.id}: früher Bericht ohne Direktnachweis`);
      }
    }
  }

  const duas = Array.isArray(data.duas) ? data.duas : [];
  for (const item of duas) {
    rejectHiddenStatus(item, rel, item.id);
    if (item.verificationStatus !== "verified") fail(`${rel}:${item.id}: Duʿāʾ-Status nicht verified`);
    if (!nonEmpty(item.source)) fail(`${rel}:${item.id}: Duʿāʾ-Quelle fehlt`);
    if (item.type === "quran" && (!Array.isArray(item.quranRefs) || !item.quranRefs.length)) {
      fail(`${rel}:${item.id}: Qurʾān-Duʿāʾ ohne quranRefs`);
    }
  }
}

validateDuas();
validateQuiz();
validateStories();
validateVerifiedPool();

for (const message of warnings) console.warn("KIDS AUTH WARN:", message);

if (errors.length) {
  console.error("\nKIDS CONTENT AUTHENTICITY GUARD: BLOCKIERT\n");
  for (const error of errors) console.error(" -", error);
  console.error(`\n${errors.length} Fehler. Kinder-Deploy wird nicht freigegeben.\n`);
  process.exit(1);
}

console.log("KIDS CONTENT AUTHENTICITY GUARD: OK");
console.log(" - Duʿāʾ: verified-only + kanonischer Wortlaut/Quelle");
console.log(" - Quiz: published + approved + sourceChecked + wordingChecked");
console.log(" - Geschichten: approved-only + Qurʾān-Quellen");
console.log(" - Ḥadīṯ/Ṣaḥābah/Tābiʿīn: verified-only + Quelle");
