#!/usr/bin/env node
"use strict";
/* Regression: 3 recap facts + 2 reflection cards require five reachable focus pages.
 * The last page must show the self-reflection and return button; otherwise
 * children cannot finish their own learning reflection after 'teach-back'. */
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
assert(html.includes('[".recap-reflection"]')===false||html.includes(".recap-reflection"));
assert(html.includes('panel.querySelector("[data-focus-next]").disabled=i===parts.length-1 && stageNumber===4;'));
assert(html.includes('const names=stageNumber===2?'));
console.log("PASS Kids Academy five recap focus pages: Merksatz → Quellen → Alltag → Weitergeben → Reflexion with exit button.");
