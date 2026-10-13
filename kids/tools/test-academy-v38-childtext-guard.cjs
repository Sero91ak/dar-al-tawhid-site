#!/usr/bin/env node
'use strict';

// Prevent internal production, release and QA wording from reaching KIDS learners.
// This test checks the 111 V38 lessons; it does not grant scientific approval.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const filename = path.resolve(__dirname, '../akademie/curriculum-v38.js');
const source = fs.readFileSync(filename, 'utf8');
const opening = 'const additions=';
const start = source.indexOf(opening);
assert.ok(start >= 0, 'V38 additions object is missing');
const bodyStart = start + opening.length;
const bodyEnd = source.indexOf('\n};\n', bodyStart);
assert.ok(bodyEnd > bodyStart, 'V38 additions object terminator is missing');
const data = JSON.parse(source.slice(bodyStart, bodyEnd + 2));
const lessons = Object.values(data);
assert.equal(lessons.length, 111, 'Lessons 98–208 must remain present');
const ages = ['4-5', '6-8', '9-10'];
const noteLeak = /Keine Freigabe für Besucher|Keine synthetische Rezitation|Sichtbare Entwickler- und Freigabeformeln|mechanisch aus Sprech-\/Einführungstexten/i;
const childLeak = /Keine Freigabe für Besucher|Keine synthetische Rezitation|Sichtbare Entwickler- und Freigabeformeln|In diesem Paket gibt es keine Aufnahme|Technische Vollständigkeit ersetzt keine Quellenfreigabe|Hadithnummer, die wir erfunden haben|Die arabischen Worte spricht die Lehrperson|Wir erfinden keine zusätzliche Geschichte/i;
let ageCount = 0;

function checkText(value, label) {
  if (typeof value === 'string') {
    assert.doesNotMatch(value, childLeak, label);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => checkText(item, label + '[' + index + ']'));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      // The evidence and source references belong to the internal source ledger,
      // not to the child-facing speech/script content.
      if (key !== 'evidence' && key !== 'sources') checkText(item, label + '.' + key);
    });
  }
}

for (const [lessonId, lesson] of Object.entries(data)) {
  assert.equal(lesson.id, lessonId, 'Lesson ID must be stable: ' + lessonId);
  assert.ok(lesson.quran && lesson.quran.label, 'Missing Qurʾān reference: ' + lessonId);
  assert.ok(lesson.sourceAudit && lesson.sourceAudit.quranUrl, 'Missing source URL: ' + lessonId);
  assert.equal(lesson.sourceAudit.scientificApproval, false, 'Unreviewed lesson wrongly approved: ' + lessonId);
  assert.doesNotMatch(lesson.sourceAudit.note || '', noteLeak, 'Internal note leak: ' + lessonId);
  for (const key of ['title', 'lead', 'goal', 'hint', 'sample', 'practice', 'summary', 'audioScript', 'ageText', 'questions']) {
    checkText(lesson[key], lessonId + '.' + key);
  }
  for (const age of ages) {
    assert.ok(lesson.ageText && lesson.ageText[age], 'Missing age version: ' + lessonId + ' / ' + age);
    assert.ok(Array.isArray(lesson.questions[age]) && lesson.questions[age].length >= 2, 'Missing questions: ' + lessonId + ' / ' + age);
    ageCount += 1;
  }
}
assert.equal(ageCount, 333, 'V38 must keep 333 age versions');
assert.match(source, /"religiousSourcesVerified":false/, 'Religious approval gate must remain closed');
console.log('V38 child-text guard passed: 111 lessons, 333 age versions, sources preserved, no release approval.');
