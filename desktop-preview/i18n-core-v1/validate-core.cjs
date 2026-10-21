#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const load=p=>JSON.parse(fs.readFileSync(path.join(__dirname,p),"utf8"));
const l=load("locales.json"),t=load("terms.json"),s=load("source-examples.json");
const supported=["de","ar","en","tr","ku","ckb","bs"];
assert.equal(l.schemaVersion,1);assert.deepEqual(Object.keys(l.locales).sort(),supported.sort());
const expected=Object.keys(l.locales.de.messages);
for(const code of supported){
 const x=l.locales[code];assert(x.name&&x.dir);
 assert.equal(x.dir,["ar","ckb"].includes(code)?"rtl":"ltr",code+" direction");
 for(const key of expected)assert(typeof x.messages[key]==="string"&&x.messages[key].trim(),code+" "+key);
 assert.equal(Object.keys(x.messages).length,expected.length,code+" keys");
}
assert(t.entries.length>=30);
const aliasSeen=new Map();
const norm=x=>String(x).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim();
for(const v of t.entries){
 assert(v.id&&v.arabic&&v.aliases?.length>=2,"term incomplete");
 assert.equal(v.reviewStatus,"alias-draft","glossary approval claims not permitted");
 assert.equal(v.definitionStatus,"not_provided","no unsupported religious definitions");
 for(const alias of [v.id,v.arabic,...v.aliases]){
  const key=norm(alias);
  if(aliasSeen.has(key))assert.equal(aliasSeen.get(key),v.id,"colliding canonical term alias "+alias);
  else aliasSeen.set(key,v.id);
 }
}
for(const v of s.records){
 assert(/^\/(?!\/)/.test(v.url),"source must be same-origin");
 assert(v.id&&v.title&&v.reference,"source should have title, stable id and reference");
 for(const code of supported.filter(x=>x!=="de"))assert.notEqual(v.translationStatus?.[code],"approved","preview cannot publish unreviewed translations");
}
console.log("PASS: 7 locale catalogs; "+expected.length+" keys each; "+t.entries.length+" terms; "+aliasSeen.size+" aliases; "+s.records.length+" grounded sample records.");
