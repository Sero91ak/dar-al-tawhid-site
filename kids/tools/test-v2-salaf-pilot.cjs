#!/usr/bin/env node
"use strict";
/* Creator-only V2.0 Salaf pilot release guard.
 * Protect the visitor app, home hero, prayer times and bottom navigation. */
const fs=require("node:fs");
const assert=require("node:assert/strict");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=(p)=>fs.readFileSync(path.join(ROOT,p),"utf8");
const entries=["kids/index.html","kids/start.html","kids/shell.html"];
const htmls=entries.map(read);
const css=read("kids/design-v2-salaf-pilot.css");
const salaf=read("kids/salaf-library-v1.js");
assert.equal(htmls[0],htmls[1],"Kids creator index/start differ");
assert.equal(htmls[1],htmls[2],"Kids creator start/shell differ");
assert.equal((htmls[0].match(/\/kids\/design-v2-salaf-pilot\.css\?v=/g)||[]).length,1,"Creator pilot CSS must load exactly once");
assert.ok(htmls[0].includes('url("/kids/assets/kids-salah-v1272/hero-home.png?v=1274")'),"Approved Home mosque hero missing");
assert.ok(htmls[0].includes('id="view-today"'),"Home view missing");
assert.ok(htmls[0].includes('id="view-salaf"'),"Salaf view missing");
assert.ok(htmls[0].includes('id="view-stories"'),"Stories view missing");
assert.ok(htmls[0].includes('/kids/global-detail-dock-v1247.css'),"Global detail docking must remain");
assert.ok(htmls[0].includes('/kids/salaf-open-world-v1353.css'),"Original Salaf visuals must remain");
assert.ok(htmls[0].includes("/kids/design-v2-salaf-pilot.css?v=20261014-3"),"Fresh staging-only V2 CSS required");
assert.ok(htmls[0].includes("/kids/salaf-library-v1.js?v=20261014-4"),"Fresh Salaf library JS required");
assert.ok(salaf.includes('<h3>Was möchtest du entdecken?</h3><span class="salaf-age" id="salafAge">'),"One clear overview heading with age is required");
assert.ok(!salaf.includes("salaf-collection-mark"),"Duplicate eight-topic badge must be removed");
assert.ok(salaf.includes("Geschichten: '+count+"),"Story counters must use the uniform Geschichten: N format");
assert.ok(!salaf.includes("count===1?"),"Old singular/plural counter expression must be absent");
assert.ok(css.includes("V2.0 C: user-approved visual refinement"),"Distinct visible V2 styling missing");
for(const token of ['#view-salaf','.app[data-gender="girl"] #view-salaf','--kids-v2-bg','--kids-v2-accent','.salaf-topic','.salaf-switch'])assert.ok(css.includes(token),"V2 pilot missing "+token);
for(const restricted of ['#view-today','#kidsSalahDailyPage','#bottom-nav','.app > .hero','serviceWorker.register','@import'])assert.ok(!css.includes(restricted),"Pilot must not affect protected surface "+restricted);
const main=read("kids/creator-test/worker.js");
assert.ok(main.includes('url.pathname.startsWith("/kids/")'),"Isolated creator worker path guard missing");
assert.ok(!main.includes('routes = ["dar-al-tawhid.de/kids'),'Creator worker must never claim public KIDS route');
console.log("KIDS_V2_SALAF_PILOT PASS | staging-only | three shells identical | home and salah protected");
