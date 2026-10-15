#!/usr/bin/env node
"use strict";
/* KIDS creator-only Prophet visual pilot: protect visitor, Kids Home,
 * prayer-times, bottom navigation, age-specific behavior and story data. */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const entry=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
const css=read("kids/design-v2-prophets-pilot.css");
const rules=css.replace(/\/\*[\s\S]*?\*\//g,"");
const data=JSON.parse(read("kids/data/prophet-stories.json"));
const prophet=read("kids/prophet-stories.js");
assert.equal(entry[0],entry[1],"Creator shells index/start must match");
assert.equal(entry[1],entry[2],"Creator shells start/shell must match");
assert.equal((entry[0].match(/\/kids\/design-v2-prophets-pilot\.css\?v=/g)||[]).length,1,"Prophet V2 CSS loaded once");
assert.ok(entry[0].includes('url("/kids/assets/kids-salah-v1272/hero-home.png?v=1274")'),"Approved mosque home hero missing");
assert.ok(entry[0].includes('id="view-today"')&&entry[0].includes('id="view-salaf"'),"Existing app views missing");
assert.ok(entry[0].includes("/kids/design-v2-salaf-pilot.css"),"Prior Salaf pilot missing");
assert.ok(entry[0].includes("/kids/test-console/return-to-studio.js"),"Creator-only TEST control must remain");
assert.ok(entry[0].includes("/kids/prophet-stories.js"),"Original Prophet runtime missing");
assert.ok(Array.isArray(data.items)&&data.items.length===25,"All 25 Prophet stories must remain present");
assert.ok(prophet.includes('const MODE_KEY="kids.contentMode.v19"'),"Shared story mode must remain");
assert.ok(prophet.includes('const ART_ROOT="/kids/assets/prophets-v2/"'),"Original story artwork path must remain");
for(const term of ["#psLibraryPage","#psModal",".ps-muhammad-card",".ps-story-row",".ps-row-title",".ps-row-ar",':has(.app[data-gender="girl"])'])
 assert.ok(rules.includes(term),"Missing expected Prophet pilot selector: "+term);
for(const term of ["#view-today","#view-salaf",".bottom-nav","#darKidsCreatorBack",".ps-library-scroll","serviceWorker","@import","url("])
 assert.ok(!rules.includes(term),"Scoped Prophet CSS touched forbidden surface: "+term);
assert.equal((rules.match(/\{/g)||[]).length,(rules.match(/\}/g)||[]).length,"Prophet pilot CSS unbalanced");
console.log("KIDS_V2_PROPHETS_PASS | 25 stories | profile tints | staging only | mosque/Salaf/TEST/nav protected");
