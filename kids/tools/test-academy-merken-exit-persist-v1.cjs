#!/usr/bin/env node
"use strict";
/* Guard: finishing Merken must persist completion and never park a draft on step 4. */
const fs=require("node:fs"),assert=require("node:assert/strict");
const html=fs.readFileSync("kids/akademie/index.html","utf8");
assert(html.includes('saveDraft(3,qIndex===questions().length-1?qIndex:qIndex+1);'),
 "check() must keep the draft on the question step, never jump to step 4 before finish()/persist()");
assert(!html.includes('saveDraft(qIndex===questions().length-1?4:3,'),
 "Draft must not be written as step 4 after the last question");
assert(html.includes('const allDone=questions().length>0&&Number(score.done)>=questions().length;'),
 "Restore must detect a completed question set");
assert(html.includes('if(allDone){finished=true;unlocked=4;step=4;qIndex=questions().length-1;}'));
assert(html.includes('else{finished=false;if(step>=4){step=3;unlocked=Math.min(unlocked,3);}}'),
 "An incomplete draft must not stay on the recap step");
assert(html.includes('if(finished)persist("help",true);'),
 "A restored completed lesson must persist after the recap is shown");
assert(html.includes('persist("help",true);'));
console.log("PASS Kids Academy Merken exit/persist: draft stays on step 3, restore persists completion.");
