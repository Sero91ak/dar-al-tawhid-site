#!/usr/bin/env node
"use strict";
/* No app/network writes. Source-linked, 16×9 interactive learning integrity and
 * 48h focus draft. Never allocates Q-number or authorizes OneSignal push. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const batch=read("content/admin/frauen-batch-16-2026-11-18.json");
const locale=read("assets/frauen/frauen-entry-locales-v1.json");
const script=fs.readFileSync(path.join(root,"assets/frauen/frauen-learning-v1.js"),"utf8");
const adapter=fs.readFileSync(path.join(root,"assets/frauen/frauen-entry-locale-v1.js"),"utf8");
const page=fs.readFileSync(path.join(root,"lernen/frauen-wissen/index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/frauen/frauen-learning-v1.css"),"utf8");
const scope={window:{},document:{getElementById(){return null}},console,URL};
vm.runInNewContext(script,scope,{filename:"frauen-learning-v1.js",timeout:15000});
const api=scope.window.DARFrauenLearningV1;
assert.ok(api,"Learning engine must be exposed to browser");
assert.equal(api.CODES.length,9);
assert.deepEqual(Array.from(api.CODES),batch.requiredLocales);
assert.match(page,/<main id="quiz"/);
assert.match(page,/frauen-learning-v1\.js/);
assert.match(script,/fw-reading-reference/,"Learning page must expose full same-language source reading");
assert.match(script,/fw-reading-sharh/,"Learning explanation disclosure missing");
assert.match(page,/dar-reading-surface-v1\.js/);
assert.match(css,/focus-visible/);
assert.match(css,/\[dir="rtl"\]/);
assert.match(adapter,/function attachLearningButton\(/);
assert.match(adapter,/href="\/lernen\/frauen-wissen\//);
assert.match(adapter,/attachLearningButton\(article,item\)/);
const data={};
for(const p of [...new Set(batch.records.map(r=>r.sourceFile))])data[p]=read(p);
const normalize=s=>String(s||"").replace(/\s+/g," ").trim();
let checked=0,questions=0;
for(const record of batch.records){
 const original=data[record.sourceFile].eintraege.filter(e=>e.kennung===record.id);
 assert.equal(original.length,1,"Source must be unique "+record.id);
 const entry=locale.entries[record.id];
 assert.equal(entry.id,record.id);
 assert.equal(entry.area,record.area);
 assert.equal(entry.sourceUrl,original[0].direktnachweisUrl);
 assert.equal(original[0].quellenstatus,"nicht-anzeigen","Hidden source must remain hidden before publication");
 assert.equal(original[0].contentId,record.id);
 assert.equal(original[0].localeCatalogId,record.id);
 for(const code of batch.requiredLocales){
  const pack=entry.locales[code];
  assert.ok(pack&&pack.preview&&pack.statement&&pack.lesson&&pack.sharh&&pack.source);
  assert.equal(pack.dir,["ar","ckb"].includes(code)?"rtl":"ltr");
  const quiz=api.questions(record.id,locale.entryIds,locale.entries,code,new Set(batch.records.map(r=>r.id)));
  assert.equal(quiz.length,4);
  for(const q of quiz){
   assert.ok(q.question.length>=10,"Question must be translated "+record.id+" "+code);
   assert.equal(q.options.length,3);
   assert.equal(new Set(q.options.map(normalize)).size,3,"Duplicate choices: "+record.id+" "+code);
   assert.ok(q.answer>=0&&q.answer<3);
   const expected=q.field==="statement"?apiFirst(pack.statement):pack[q.field];
   assert.equal(normalize(q.options[q.answer]),normalize(expected),"Correct answer not source-grounded");
   assert.ok(q.explanation&&q.explanation.length>=8,"Contextual feedback missing");
   questions++;
  }
  checked++;
 }
}
function apiFirst(value){
 const s=String(value||"").trim();
 const m=s.match(/^[^.!?؟。]+[.!?؟。](?=\s|$)/u);
 return(m?m[0]:s).trim();
}
assert.equal(checked,144);
assert.equal(questions,576);
assert.throws(()=>api.questions(batch.records[0].id,locale.entryIds,locale.entries,"de",new Set([batch.records[0].id])),/Not enough verified published entries/,"Quiz must be closed without two published distractors");
assert.throws(()=>api.questions(batch.records[0].id,locale.entryIds,locale.entries,"de",new Set(batch.records.slice(1).map(r=>r.id))),/not approved/,"Unapproved article must not be a question source");
const three=new Set(batch.records.slice(0,3).map(r=>r.id));
const threePacks=batch.records.slice(0,3).map(r=>locale.entries[r.id].locales.de);
const isolated=api.questions(batch.records[0].id,locale.entryIds,locale.entries,"de",three);
assert.equal(isolated.length,4,"Three verified records must allow exactly two distinct distractors");
for(const q of isolated){
 const field=q.field;
 const eligible=new Set(threePacks.map(p=>normalize(field==="statement"?apiFirst(p.statement):p[field])));
 assert.equal(q.options.length,3);
 assert.ok(q.options.every(option=>eligible.has(normalize(option))),"Unapproved article appeared as a quiz distractor");
}
const focusId="neufokus-frauenwissen-16-20261118";
for(const p of ["content/focus-feed/feed-index.json","content/staging/focus-feed/feed-index.json"]){
 const feed=read(p),matches=(feed.items||[]).filter(x=>x.id===focusId);
 assert.equal(matches.length,1,"Exactly one 48h focus item per feed");
 const card=matches[0];assert.equal(card.status,"draft","Focus not allowed live before 16 reports");
 assert.equal(card.visibility,"48h");assert.equal(card.targetUrl,"frauen");
 assert.equal(card.targetId,"frauen");assert.equal(card.targetType,"category");
 assert.equal(card.expiresAt,null,"Real 48h window starts at actual publish, not staging");
}
console.log("PASS Frauen learning: 16 unique source-bound records × 9 locales × 4 questions = 576 questions; canonical URLs and RTL preserved; no learning or focus release before approval.");
