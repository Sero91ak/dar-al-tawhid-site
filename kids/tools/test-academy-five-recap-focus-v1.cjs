#!/usr/bin/env node
"use strict";
/* Regression: 3 recap facts + 2 reflection cards require five reachable focus pages.
 * The last page must show the self-reflection and a visible exit to the academy.
 * Recap reflections must be collected with all(), never the first-only $() helper.
 */
const fs=require("node:fs"),assert=require("node:assert/strict");
const html=fs.readFileSync("kids/akademie/index.html","utf8");
const stage=html.slice(html.indexOf('<section class="lesson-stage" data-lesson-step="4"'),html.indexOf('  </section>\n  </div>\n  <div class="lesson-navigation"'));
assert(stage.length>1000,"Could not find actual lesson recap markup");
assert.equal((stage.match(/class="recap-item"/g)||[]).length,3,"Expect three facts");
assert.equal((stage.match(/class="recap-reflection(?: academy-teach-back)?"/g)||[]).length,2,"Expect teach-back plus self-assessment");
assert(stage.includes('id="academyTeachBackPrompt"'));
assert(stage.includes('id="backAfterLesson"'));
assert(html.includes('["Merksatz","Qurʾān & Sunnah","Alltag","Wissen weitergeben","Abschluss"]'));
assert(html.includes('const isLastReviewCard=i===parts.length-1;'));
assert(html.includes('$("#summaryText").classList.toggle("is-focus-selected",isLastReviewCard);'));
assert(html.includes('$("#backAfterLesson").classList.toggle("is-focus-selected",isLastReviewCard);'));
assert(html.includes("...all('[data-lesson-step=\"4\"] .recap-reflection')"),
 "focusPieces(4) must collect every recap-reflection via all()");
assert(!/focusPieces\(4\)return \[[^\]]*\$\(['"]\.recap-reflection['"]\)/.test(html.replace(/\s+/g,"")),
 "focusPieces(4) must not use first-only $('.recap-reflection')");
assert(!html.includes('.recap-reflection:not(.is-focus-selected) + #backAfterLesson'),
 "A sibling CSS rule must not hide the exit button after an unfocused reflection card");
assert(html.includes('body .lesson-stage[data-lesson-step="4"] #backAfterLesson.is-focus-selected{display:block!important;width:100%}'),
 "Last recap page must force the exit button visible");
assert(html.includes('const lastRecap=stageNumber===4&&i===parts.length-1;'));
assert(html.includes('panel.querySelector("[data-focus-next]").disabled=false;'));
assert(html.includes('panel.querySelector("[data-focus-next]").textContent=lastRecap?"Zur Lernakademie"'));
assert(html.includes('if(stageNumber===4&&focusPages[4]>=focusPieces(4).length-1){home();return;}'));
assert(!html.includes('panel.querySelector("[data-focus-next]").disabled=i===parts.length-1 && stageNumber===4;'),
 "The last recap next-button must stay enabled as the academy exit");
assert(html.includes('const names=stageNumber===2?'));
console.log("PASS Kids Academy five recap focus pages: Merksatz → Quellen → Alltag → Weitergeben → Reflexion with visible exit.");
