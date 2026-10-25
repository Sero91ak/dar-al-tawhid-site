#!/usr/bin/env node
"use strict";
/* Static integrity gate for staged adult DAR TEST V8. Does not deploy. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const index=read("test/index.html");
assert.match(index,/id="darTestV8Overhaul" src="\/test\/assets\/dar-test-v8-overhaul\.js/);
assert.match(index,/\/test\/assets\/dar-quran-player\.js/);
assert.match(index,/function renderSettings\(\)/);
assert.match(index,/renderThemeSwitchPanel\(\)/);
assert.match(index,/id="bottomNav"/);
const jsPaths=[
 "test/assets/dar-test-v8-overhaul.js",
 "test/assets/dar-home-v3-compact.js",
 "test/assets/dar-more-v15.js",
 "test/assets/dar-test-turkish-ui.js",
 "test/assets/dar-test-seven-languages-loader.js",
 "scripts/restore-dar-test-v8.cjs"
];
for(const p of jsPaths){new vm.Script(read(p).replace(/^#![^\n]*\n/,""),{filename:p});console.log("Syntax OK",p)}
const pack=JSON.parse(read("test/i18n/adult-ui-locales-nine-v8.json"));
const list=["de","tr","en","ar","ku","ckb","bs","fr","es"];
assert.deepEqual(pack.availableLocales,list);
assert.deepEqual(pack.rtlLocales,["ar","ckb"]);
assert.equal(pack.scope,"adult-interface-only");
assert.equal(pack.noPaidProvider,true);
for(const k of list.slice(1)){
 const keys=Object.keys(pack.translations[k]||{});
 assert(keys.length>=150,"Incomplete minimum interface draft: "+k);
 for(const required of ["Startseite","Mehr","Einstellungen","Erscheinungsbild","Sprache","Qurʾān","Duʿāʾ"])
  assert(pack.translations[k][required],"Missing required UI key "+k+":"+required);
}
const runtime=read("test/assets/dar-test-turkish-ui.js");
assert.match(runtime,/const SUPPORTED=new Set\(\["de","tr","en","ar","ku","ckb","bs","fr","es"\]\)/);
assert.match(runtime,/const EXCLUDE=/); // Prevent translating primary religious evidence
const loader=read("test/assets/dar-test-seven-languages-loader.js");
assert(loader.includes("adult-ui-locales-nine-v8.json"));
const shell=read("test/assets/dar-test-v8-overhaul.js");
assert(shell.includes("window,document"));
assert(shell.includes("DARAdultLanguagePickerV1"));
assert(shell.includes("d.getElementById(\"appView\")"));
const css=read("test/assets/dar-test-v8-overhaul.css");
assert(css.includes("@media(min-width:740px)"));
assert(css.includes("data-dv8-density"));
assert(css.includes("data-dv8-motion"));
console.log("DAR TEST V8 static QA: passed. Browser/device smoke testing remains required.");
