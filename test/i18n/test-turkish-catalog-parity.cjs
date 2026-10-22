#!/usr/bin/env node
"use strict";
/* Prevent two different Turkish captions in the manual runtime and the shared
 * nine-language UI catalog. Does not examine or translate religious content. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"assets/dar-test-turkish-ui.js"),"utf8");
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
function parseArray(start,end){
 const left=source.indexOf(start),right=source.indexOf(end,left);
 assert(left>=0&&right>left,"Cannot safely locate Turkish legacy dictionary");
 const raw=source.slice(left+start.length,right);
 // Literal arrays only: no interpreter/app runtime and no API/network call.
 assert(/^\s*\[/.test(raw)&&/\]\s*$/.test(raw),"Dictionary array format changed");
 const list=Function('"use strict"; return ('+raw+')')();
 assert(Array.isArray(list),"Invalid legacy dictionary");
 return list;
}
const items=[
 ...parseArray("const ENTRIES=",";\nconst EXTRA_ENTRIES"),
 ...parseArray("const EXTRA_ENTRIES=",";\nconst dictionary=")
];
const manual=new Map(items),catalog=pack.translations.tr;
let compared=0;
for(const [de,tr] of manual){
 if(!Object.hasOwn(catalog,de))continue;
 assert.equal(catalog[de],tr,"Conflicting Turkish control label: "+de);
 compared++;
}
assert(compared>=150,"Unexpectedly low overlap between Turkish dictionaries: "+compared);
assert.equal(catalog["Sprache / Dil"],"Dil");
assert.equal(catalog["Sprache · Dil"],"Dil");
assert.equal(catalog["Willkommen bei DĀR AL TAWḤĪD"],"DĀR AL TAWḤĪD'e hoş geldiniz");
console.log("PASS "+compared+" identical reviewed Turkish labels across manual runtime and UI catalog");
