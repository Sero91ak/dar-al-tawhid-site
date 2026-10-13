#!/usr/bin/env node
/* Builds kids-akademie/LESSON_STATUS.json from the year plan, research ledger and archive.
   Does not approve lessons and does not invent missing lesson IDs. */
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "../..");
const year = JSON.parse(fs.readFileSync(path.join(root, "kids/data/academy-year-52weeks-v1.json"), "utf8"));
const ledger = JSON.parse(fs.readFileSync(path.join(root, "kids/research/academy-208-research-ledger-v1.json"), "utf8"));
const html = fs.readFileSync(path.join(root, "kids/unterrichtsarchiv.html"), "utf8");
const start = html.indexOf("const ARCHIVE_SNAPSHOT=") + "const ARCHIVE_SNAPSHOT=".length;
const end = html.indexOf(";\n", start);
const archive = JSON.parse(html.slice(start, end));
const catalog = archive.catalog || {};
const bySlot = new Map(ledger.lessons.map((lesson) => [lesson.slot, lesson]));
const lessons = [];
for (const week of year.weeks) {
  for (const day of week.days) {
    if (day.mode !== "new") continue;
    const row = bySlot.get(day.editorialSlot) || {};
    const lessonId = day.lessonId || null;
    const archived = !!(lessonId && catalog[lessonId]);
    const questions = archived ? (catalog[lessonId].questions || {}) : {};
    const ages = ["4-5", "6-8", "9-10"].filter((age) => questions[age]);
    lessons.push({
      lessonId: lessonId,
      slot: day.editorialSlot,
      week: week.week,
      weekday: day.weekday,
      topic: row.topic || null,
      pillar: row.pillar || null,
      yearPlanStatus: day.status || null,
      ledgerStatus: row.status || null,
      ageVersionsPresent: lessonId === "sidq" ? ["4-5", "6-8", "9-10"] : ages,
      completenessStatus: lessonId
        ? (archived || lessonId === "sidq" ? "draft-present" : "id-without-archive-module")
        : "outline-only",
      sourceStatus: row.sourceAuditStatus || "not-reviewed",
      didacticReviewStatus: "not-independently-approved",
      integrationStatus: archived
        ? "archive-catalog"
        : (lessonId === "sidq" ? "separate-sidq-module" : (lessonId ? "year-plan-only" : "no-lesson-id")),
      audioScriptStatus: "deferred-no-generation",
      releaseStatus: "not-approved-not-live",
      childUnlocked: row.childUnlocked === true,
      voiceApproved: false
    });
  }
}
const counts = {
  slots: lessons.length,
  withLessonId: lessons.filter((lesson) => lesson.lessonId).length,
  outlineWithoutLessonId: lessons.filter((lesson) => !lesson.lessonId).length,
  archiveCatalog: Object.keys(catalog).length,
  archiveMatchedToYearPlan: lessons.filter((lesson) => lesson.integrationStatus === "archive-catalog").length,
  separateSidqModule: lessons.filter((lesson) => lesson.integrationStatus === "separate-sidq-module").length,
  threeAgeQuestionSetsInArchive: lessons.filter((lesson) => lesson.integrationStatus === "archive-catalog" && lesson.ageVersionsPresent.length === 3).length,
  sourceOnlineChecked: lessons.filter((lesson) => lesson.sourceStatus === "target-hadith-checked-online").length,
  sourceMetadataOnly: lessons.filter((lesson) => lesson.sourceStatus === "metadata-in-repository-not-reverified").length,
  sourceNotReviewed: lessons.filter((lesson) => lesson.sourceStatus === "not-reviewed").length,
  requiredAgeVersions: 624,
  approvedAgeVersions: 0,
  approvedLessons: 0
};
const out = {
  schemaVersion: 1,
  generatedOn: "2026-10-13",
  warning: "Inventory of repository state. Age blocks and inherited sourceAudit metadata are not religious approval. No lesson is released to the visitor app.",
  counts: counts,
  lessons: lessons
};
const dest = path.join(root, "kids-akademie/LESSON_STATUS.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
if (counts.slots !== 208 || counts.withLessonId !== 94 || counts.outlineWithoutLessonId !== 114) {
  console.error(counts);
  process.exit(1);
}
console.log(JSON.stringify(counts));
