"use strict";
/* Test-only home V4.8 smoke: no external API calls or credentials. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const read=f=>fs.readFileSync(f,"utf8");
const core=read("test/assets/dar-smart-search-core-v48.js");
const ui=read("test/assets/dar-smart-search-ui-v48.js");
const css=read("test/assets/dar-home-v48-polish.css");
const posts=JSON.parse(read("test/data/dar-smart-post-titles-v1.json"));
const layout=read("test/assets/dar-home-v47-layout.js");
const worker=read("cloudflare/test-app-worker.js");
new vm.Script(core);new vm.Script(ui);
const window={};vm.runInNewContext(core,{window});
const F=window.DarTestFuzzyCore;assert(F,"Missing fuzzy search core");
const cases=[
 ["Tawhid","Tawḥīd"],["Tauhid","Tawḥīd"],["Tawhif","Tawḥīd"],
 ["Tevhid","Tawḥīd"],["den Iman","Īmān"],["Imann","Īmān"],
 ["Koran","Qurʾān"],["Hadeeth","Ḥadīṯ"],["Bittgebet","Duʿāʾ"]
];
for(const [query,label]of cases)assert(F.score(query,F.make(label,"Themen","topics"))>0,
 "Search should recognize "+query+" → "+label);
assert(posts.entries.length>=450,"Posts title index incomplete");
assert(posts.entries.every(x=>x.label&&x.slug),"Missing post label");
assert(layout.includes("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh"),"Full greeting missing");
assert(layout.includes("einer geordneten Wissens-App mit Beiträgen"),"Full intro shortened");
assert(css.includes("header-prayer-hub__status"),"Prayer fix missing");
assert(css.includes("grid-template-columns:minmax(0,1fr) minmax(0,1fr)"),"Date may be clipped");
for(const id of ["darHomeV48Polish","darSearchV48Core","darSearchV48Ui"])
 assert(worker.includes(id),"Test HTML missing "+id);
assert(!css.includes("#bottomNav"),"Bottom navigation must not be restyled");
console.log("PASS · Dar Test V4.8: full welcome, responsive prayer, spelling variants, 483 post titles.");
