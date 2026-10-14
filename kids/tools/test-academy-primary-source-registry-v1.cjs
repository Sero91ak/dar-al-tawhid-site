#!/usr/bin/env node
"use strict";
/* Protected draft: factual completeness and unique source-link regression.
 * Does not grant scientific approval and does not change any data.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const file=JSON.parse(fs.readFileSync(path.join(root,"kids-akademie/research/SOURCE_REGISTRY.json"),"utf8"));
assert.ok(Array.isArray(file.sources),"Source registry must contain sources array");
const ids=new Set();
for(const src of file.sources){
 assert.ok(src.sourceId&&typeof src.sourceId==="string","Every source needs ID");
 assert.ok(!ids.has(src.sourceId),"Duplicate sourceId: "+src.sourceId);
 ids.add(src.sourceId);
}
const required={
"fiqh-gebetsplatz-vorbereiten":{
 "SRC-FIQH118-BUKHARI-335":["dorar.net","335"],
 "SRC-FIQH118-MUGHNI-784":["islamweb.net","15/784"],
 "SRC-FIQH118-MUGHNI-786":["islamweb.net","15/786"],
 "SRC-FIQH118-MUGHNI-808":["islamweb.net","15/808"]
},
"fiqh-gebetszeiten-kennenlernen":{
 "SRC-FIQH130-MUGHNI-425":["islamweb.net","15/425"],
 "SRC-FIQH130-MUGHNI-428":["islamweb.net","15/428"],
 "SRC-FIQH130-MUGHNI-429":["islamweb.net","15/429"]
},
"fiqh-namen-der-fuenf-gebete":{
 "SRC-FIQH142-MUSLIM-612":["islamweb.net","1/1036"],
 "SRC-FIQH142-MUGHNI-425":["islamweb.net","15/425"]
},
"fiqh-absicht-zum-gebet":{
 "SRC-FIQH154-MUGHNI-542":["islamweb.net","15/542"]
},
"fiqh-takbirat-al-ihram":{
 "SRC-FIQH174-MUGHNI-533":["islamweb.net","15/533"]
},
"fiqh-quran-rezitation-im-gebet":{
 "SRC-FIQH180-MUGHNI-553":["islamweb.net","15/553"]
},
"fiqh-ruku-kennenlernen":{
 "SRC-FIQH186-MUGHNI-570":["islamweb.net","15/570"]
},
"fiqh-aus-dem-ruku-aufrichten":{
 "SRC-FIQH192-MUGHNI-574":["islamweb.net","15/574"]
},
"fiqh-zwischen-niederwerfungen-sitzen":{
 "SRC-FIQH201-MUGHNI-599":["islamweb.net","15/599"],
 "SRC-FIQH201-MUGHNI-602":["islamweb.net","15/602"]
},
"fiqh-tashahhud":{
 "SRC-FIQH204-MUGHNI-611":["islamweb.net","15/611"],
 "SRC-FIQH204-MUGHNI-618":["islamweb.net","15/618"]
},
"fiqh-taslim":{
 "SRC-FIQH205-MUGHNI-621":["islamweb.net","15/621"]
},
"fiqh-ramadan-fasten":{
 "SRC-FIQH207-MUGHNI-1713":["islamweb.net","15/1713"]
},
"fiqh-zakah-und-hajj":{
 "SRC-FIQH208-MUGHNI-1386":["islamweb.net","15/1386"],
 "SRC-FIQH208-MUGHNI-1754":["islamweb.net","15/1754"],
 "SRC-FIQH208-MUGHNI-1800":["islamweb.net","15/1800"]
},
"fiqh-fehler-beim-ueben":{
 "SRC-FIQH206-MUGHNI-729":["islamweb.net","15/729"]
}};
assert.equal(file.sourceCount,file.sources.length,"sourceCount metadata must match actual source IDs");
const indexedOnly=["SRC-FIQH201-MUGHNI-599","SRC-FIQH201-MUGHNI-602","SRC-FIQH205-MUGHNI-621","SRC-FIQH207-MUGHNI-1713","SRC-FIQH208-MUGHNI-1386","SRC-FIQH206-MUGHNI-729","SRC-FIQH208-MUGHNI-1754","SRC-FIQH208-MUGHNI-1800","SRC-FIQH204-MUGHNI-611","SRC-FIQH204-MUGHNI-618","SRC-FIQH174-MUGHNI-533","SRC-FIQH186-MUGHNI-570","SRC-FIQH192-MUGHNI-574"];
for(const id of indexedOnly){
 const e=file.sources.find(x=>x.sourceId===id);
 assert.ok(e,"Indexed primary-source gap missing: "+id);
 assert.equal(e.verificationStatus,"primary-index-excerpt-cross-checked-2026-10-14-direct-fetch-unavailable");
 assert.match(e.checkedBy,/nicht möglich|nicht verfügbar/,"source access limitation must not be concealed");
 assert.ok(e.safeApplication&&e.authenticityNote&&e.arabic,"record must give original fragment and child-safe scope");
 assert.notEqual(e.verificationStatus,"scientifically-approved");
}
let count=0;
for(const [lessonId,expected] of Object.entries(required)){
 for(const [id,[host,fragment]] of Object.entries(expected)){
  const ref=file.sources.find(x=>x.sourceId===id);
  assert.ok(ref,"Required source missing: "+id);
  assert.ok(ref.lessonIds?.includes(lessonId),"Wrong lesson link: "+id);
  assert.ok(ref.directLink?.startsWith("https://"),"Direct link missing HTTPS: "+id);
  assert.equal(new URL(ref.directLink).hostname.replace("www.",""),host,"Domain mismatch: "+id);
  assert.ok(ref.directLink.includes(fragment)||String(ref.number).includes(fragment),"Unexpected source page/number: "+id);
  assert.ok(ref.arabic&&ref.authenticityNote&&ref.safeApplication,"Unexplained source: "+id);
  assert.notEqual(ref.verificationStatus,"scientifically-approved","Source lookup != final approval");
  count++;
 }
}
process.stdout.write("PASS source registry: "+file.sources.length+" unique source IDs; "+count+" referenced evidence items / "+Object.keys(required).length+" Fiqh lessons; no scientific approval implied\n");
