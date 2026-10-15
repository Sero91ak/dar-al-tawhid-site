#!/usr/bin/env node
"use strict";
/* Index-level scientific binding check only; not scholarly approval. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const data=JSON.parse(read("kids-akademie/research/SOURCE_REGISTRY.json"));
const plan=JSON.parse(read("kids-akademie/LESSON_STATUS.json"));
assert.equal(data.sourceCount,data.sources.length);
assert.equal(new Set(data.sources.map(s=>s.sourceId)).size,data.sources.length);
const required={
"adab-morgen-dhikr":["SRC-V38-7-205","SRC-CORE49-IBNKATHIR-1493"],
"adab-eltern-freundlich":["SRC-CORE10-IBNKATHIR-1005","SRC-CORE10-BUKHARI-5971"],
"aqidah-allah-erschuf-tiere":["SRC-CORE51-IBNKATHIR-1276","SRC-CORE36-BUKHARI-2363"],
"aqidah-iman-an-allah-vertiefen":["SRC-V38-112-1","SRC-CORE8-MUSLIM-8"]
};
let count=0;
for(const [id,refs] of Object.entries(required)){
 assert.ok(plan.lessons.some(z=>z.lessonId===id),"Unknown lesson "+id);
 for(const name of refs){
  const source=data.sources.find(s=>s.sourceId===name);
  assert.ok(source?.lessonIds?.includes(id),"Missing lesson source "+id+" / "+name);
  assert.ok(source.directLink?.startsWith("https://"),"No URL "+name);
  assert.ok(/(?:islamweb\.net|dorar\.net)\//.test(source.directLink),"Disallowed host "+name);
  assert.ok(source.arabic&&source.authenticityNote&&source.safeApplication);
  assert.notEqual(source.verificationStatus,"scientifically-approved");
  count++;
 }
}
const morning=data.sources.find(s=>s.sourceId==="SRC-CORE49-IBNKATHIR-1493");
assert.match(morning.locus,/33:41–42/);
assert.ok(!morning.arabic.includes("هُوَ الَّذِي يُصَلِّي"));
const animals=data.sources.find(s=>s.sourceId==="SRC-CORE51-IBNKATHIR-1276");
assert.match(animals.locus,/24:45/);
const muslim=data.sources.find(s=>s.sourceId==="SRC-CORE8-MUSLIM-8");
assert.equal(muslim.number,"8");
assert.ok(muslim.directLink.includes("/25545"),"Muslim 8 wrong Dorar link");
const parents=data.sources.find(s=>s.sourceId==="SRC-CORE10-BUKHARI-5971");
assert.match(parents.number,/5971/);
const created=["SRC-CORE49-IBNKATHIR-1493","SRC-CORE51-IBNKATHIR-1276"];
assert.ok(created.every(id=>data.sources.filter(s=>s.sourceId===id).length===1));
process.stdout.write("PASS 49–52 bindings: 4 lessons / "+count+" source links / "+data.sourceCount+" unique IDs; final scholarly approval remains blocked\n");
