#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('assets/q59-locales.json'));
const source=read('q/59/index.html');
const learn=read('lernen/jugend-und-handeln/index.html');
const qLink='https://dar-al-tawhid.de/q/59/';
assert.equal(data.qSourceId,59,'Q number');
assert.equal(data.contentId,'post:hafsah-bint-sirin-jugend-handeln-20261120-q59','canonical content ID');
assert.ok(source.includes(qLink),'canonical link');
assert.ok(source.includes('/assets/q59-locales.json'),'source must load translations');
assert.ok(learn.includes('/assets/q59-locales.json'),'lesson must load translations');
assert.ok(learn.includes("location.assign('/q/59/?lang='"),'localized source return path');
assert.ok(source.includes('يَا مَعْشَرَ الشَّبَابِ'),'Arabic quote present');
assert.ok(source.includes('خُذُوا مِنْ أَنْفُسِكُمْ'),'Arabic variant present');
assert.ok(source.includes('class="qsource-social"'),'source page social icon navigation');
assert.ok(source.includes('href="/lernen/jugend-und-handeln/"'),'source→learn link');
const langs=['de','ar','en','tr','ku','ckb','bs','fr','es'];
assert.deepEqual(Object.keys(data.locales).sort(),langs.slice().sort(),'nine languages');
const required=['title','speaker','quote','quoteNote','primaryNote','alternateNote','chain','status','explanation','conclusion','evidenceNote','linkTitles','linkSubs','labels','quiz'];
const labels=['language','quote','primary','alternate','isnad','explanation','conclusion','evidence','learn','learnSub','back','progress','of','next','results','result','again','score','sourceNote'];
for(const language of langs){
const doc=data.locales[language];
for(const key of required)assert.ok(doc[key],language+' missing '+key);
for(const key of labels)assert.ok(typeof doc.labels[key]==='string'&&doc.labels[key].length>0,language+'.labels.'+key);
for(const k of ['title','quote','explanation','conclusion','chain','status'])assert.ok(doc[k].length>14,language+'.'+k+' too short');
assert.equal(doc.linkTitles.length,3,language+' link titles');
assert.equal(doc.linkSubs.length,3,language+' link summaries');
assert.equal(doc.quiz.length,4,language+' question count');
for(const q of doc.quiz){
assert.ok(q.q.length>12,'question must be translated');
assert.equal(q.a.length,3,'three choices');
assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3,'valid answer index');
assert.ok(q.why.length>10,'answer explanation');
}
}
for(const code of ['ar','ckb'])assert.ok(source.includes("code==='ar'||code==='ckb'"),'source RTL logic');
assert.ok(learn.includes("v==='ar'||v==='ckb'"),'learning RTL logic');
assert.ok(!source.includes('A reviewed translation is not available yet'),'old language placeholders removed');
assert.ok(!learn.includes('Reviewed questions in this language are not yet available'),'old questions placeholder removed');
console.log('Q59 LANGUAGES PASS: 9 complete locales, 36 translated questions, source navigation and immutable Arabic texts.');
