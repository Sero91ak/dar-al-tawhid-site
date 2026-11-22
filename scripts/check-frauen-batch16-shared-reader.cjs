#!/usr/bin/env node
"use strict";
/* Hard gate: live original source and shared native/Test Frauen reader must
 * expose identical approved canonical texts for all 16 owner-released IDs.
 * Never mutate data or accept only the existence of a link as proof.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),get=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const m=get("assets/frauen/frauen-neufokus-v1.json");
assert.equal(m.expectedCount,16);assert.equal(m.items.length,16);
let n=0;const groups={};for(const row of m.items)(groups[row.sourceFile]??=[]).push(row);
assert.deepEqual(Object.keys(groups).sort(),["data/frauen-fiqh.json","data/frauen-muetter-der-glaeubigen.json","data/frauen-sahabiyyat.json"].sort());
for(const [src,items] of Object.entries(groups)){
 const canonical=get(src),shared=get("test/"+src);
 assert.ok(Array.isArray(canonical.eintraege)&&Array.isArray(shared.eintraege),"Expected original reader shape "+src);
 const ids=new Set();
 for(const rec of shared.eintraege){assert.ok(!ids.has(rec.kennung),"Duplicate native reader ID "+rec.kennung);ids.add(rec.kennung)}
 for(const item of items){
  const original=canonical.eintraege.filter(x=>x.kennung===item.id);
  const reader=shared.eintraege.filter(x=>x.kennung===item.id);
  assert.equal(original.length,1,"Missing canonical "+item.id);
  assert.equal(reader.length,1,"Missing shared native/Test reader "+item.id);
  assert.equal(original[0].quellenstatus,"geprueft");
  assert.equal(original[0].freigabeDurchSerhat,true);
  assert.equal(original[0].direktnachweisUrl,item.sourceUrl);
  assert.equal(original[0].quellePrimaerId,item.sourceId);
  assert.deepEqual(reader[0],original[0],"Native/Test reader citation/body mismatch "+item.id);
  n++;
 }
}
assert.equal(n,16);
console.log("PASS 16/16 complete source/body/reference parity for iOS + Android + PWA + DAR TEST native Frauen reader; no duplicate IDs.");
