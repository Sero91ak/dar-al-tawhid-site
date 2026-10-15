#!/usr/bin/env node
"use strict";
/* Release gate: girls' page-level and portal palettes are checked BEFORE deployment.
   Test-specific, no screenshots accepted as a substitute for computed colors. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const base=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(base,p),"utf8");
const screens=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
const raw=read("kids/girls-profile-v2-final-audit.css");
const css=raw.replace(/\/\*[\s\S]*?\*\//g,"");
const profile=read("kids/design-v2-profile-parity-v1.css");
const prophet=read("kids/prophet-stories.js");
assert.equal(screens[0],screens[1],"Kids TEST entry pages must match");
assert.equal(screens[1],screens[2],"Kids TEST shell must match");
assert.equal((screens[0].match(/\/kids\/girls-profile-v2-final-audit\.css\?v=/g)||[]).length,1,"Girls final palette must load exactly once");
const links=[...screens[0].matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>/g)].map(x=>x[1]);
assert.ok(links.at(-1).startsWith("/kids/girls-profile-v2-final-audit.css?"),"Girl palette must be last after other style overrides");
for(const p of ["/kids/design-v2-profile-parity-v1.css","/kids/design-v2-prophets-pilot.css","/kids/design-v2-salaf-pilot.css"])
 assert.ok(screens[0].includes(p),"Pre-existing design layer missing: "+p);
assert.ok(screens[0].includes('url("/kids/assets/kids-salah-v1272/hero-home.png?v=1274")'),"Mosque home hero changed");
assert.ok(screens[0].includes("/kids/test-console/return-to-studio.js"),"KIDS TEST button changed");
const categories=[
 ["Salaf",["#view-salaf",'.salaf-story','.salaf-topic','.salaf-switch']],
 ["Propheten",["#psLibraryPage","#psModal",".ps-muhammad-panel",".ps-story-row",".ps-hero-copy"]],
 ["Ṣaḥābah/Ṣaḥābiyyāt",["#msLibraryPage","#syLibraryPage","#msModal","#syModal"]],
 ["Geschichtenwelt",["#ghWorld","#ghPlayer"]],
 ["Qurʾān",["#view-quran"]],
 ["Duʿāʾ",["#view-dua"]],
 ["Eltern",["#view-parents"]]
];
for(const [label,selectors] of categories)for(const token of selectors)
 assert.ok(css.includes(token),"Girls CSS missing "+label+" surface "+token);
assert.ok(css.includes('data-profile="girl"'),"No explicit portal profile scope");
assert.ok(css.includes('data-gender="girl"'),"No active app profile scope");
assert.ok(profile.includes("--salaf-shell-surface:#2b2035!important"),"Salaf shell must remain plum");
assert.ok(prophet.includes("function syncProphetVisualProfile()")&&prophet.includes("surface.dataset.profile=profile"),"Body portals must synchronize live profile");
assert.ok(prophet.includes('const MODE_KEY="kids.contentMode.v19"'),"Audio/story state changed");
assert.equal(JSON.parse(read("kids/data/prophet-stories.json")).items.length,25,"Prophet library size changed");
const unprotected=css.split("}").filter(x=>x.includes("{")).map(x=>x.split("{")[0].trim());
for(const selector of unprotected){
 assert.ok(selector.includes('data-gender="girl"')||selector.includes('data-profile="girl"'),
 "Girls CSS rule lacks girl-profile guard: "+selector.slice(0,120));
}
for(const forbidden of ["#view-today","#kidsSalahDailyPage",".bottom-nav","test-console","return-to-studio","#darKidsCreatorBack","serviceWorker","touch-action","scroll-padding","position:","display:","overflow:","url("]){
 assert.ok(!css.includes(forbidden),"Girls CSS attempts protected layout/content change: "+forbidden);
}
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"Girls palette CSS unbalanced");
assert.ok(!/#(?:0[0-9a-f]{5}|1[0-9a-f]{5})\b/i.test(css),"Dark pure-navy fill may have leaked into girls' audited CSS");
console.log("KIDS_GIRLS_COLOR_V2_PASS | Salaf Prophets Sahabah Sahabiyyat Storyhub Quran Dua Parents | Home, prayer, TEST, nav protected");
