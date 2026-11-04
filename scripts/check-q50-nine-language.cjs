"use strict";
/* Q50 acceptance: one Āthār post ID, one canonical Q, one learning route,
   nine complete language drafts; unchanged Arabic texts and reliable answers.
   This does NOT approve translations or authorize live publication. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pack=JSON.parse(read("assets/q50-locales.json"));
const q=read("q/50/index.html"),quiz=read("lernen/wissen-ist-religion/index.html");
const js=read("assets/q50-localized.js"),chrome=read("assets/dar-app-chrome.js");
const registry=JSON.parse(read("q/_registry/shortlinks.json"));
const expected=["de","ar","en","tr","ku","ckb","bs","fr","es"];
assert.deepEqual(Object.keys(pack.locales),expected);
assert.equal(pack.qSourceId,"qsource:50");
assert.equal(pack.quizId,"quiz:qsource:50");
assert.equal(pack.sourcePath,"/q/50/");
assert.equal(pack.quizPath,"/lernen/wissen-ist-religion/");
assert.equal(pack.contentId,"post:dieses-wissen-ist-religion-isnad-20261104-q50");
assert.equal(pack.appLocaleStorageKey,"darAdultPreferredLocaleV1");
assert.match(pack.publicationStatus,/staging-only/);
assert.equal(registry.nextNumber,51);
const entry=registry.links.find(x=>x.number===50);
assert.equal(entry.shortPath,"/q/50/");assert.equal(entry.targetPath,"/q/50/");
const scripts=[js,chrome];scripts.forEach((s,i)=>new vm.Script(s,{filename:i?"app chrome":"Q50 localization"}));
assert.match(js,/DAR_Q50_READER_NAV_V1/);
assert.match(chrome,/DAR_Q50_READER_NAV_V1/);
assert.match(js,/darAdultPreferredLocaleV1/);
assert.match(js,/window\.addEventListener\("storage"/);
assert.match(js,/window\.addEventListener\("message"/);
assert.match(q,/property="og:image"/);
assert.match(q,/name="twitter:image"/);
assert.match(q,/lang="ar" dir="rtl"/);
assert.match(q,/<nav class="qsource-social"/);
assert.match(q,/class="qsource-learning"/);
assert.match(q,/id="q50Language"/);
assert.match(quiz,/<section id="quiz"/);
assert.match(quiz,/id="qlOptions"/);
assert.match(quiz,/id="qlNext" disabled/);
assert.match(quiz,/id="qlRetry"/);
assert.ok(!/<a[^>]*href="\/q\/\d+/i.test(quiz),"Quiz is for questions only, not evidence links");
assert.equal((q.match(/class="qsource-link web"/g)||[]).length,6,"Two Āthār have three original links each");
assert.equal((q.match(/class="qsource-links q50-link-grid"/g)||[]).length,2,"Each Āthār must have a distinct three-link original evidence group");
assert.equal((q.match(/class="q50-ar" lang="ar" dir="rtl"/g)||[]).length,2,"Two immutable Arabic quotations required");
const orig=pack.arabicOriginals;
assert.ok(q.includes(orig.ibnSirin)&&q.includes(orig.ibnMubarak),"Original Arabic must match locale pack exactly");
const correct=[1,2,0,3],texts=new Set();
for(const code of expected){
 const p=pack.locales[code];
 assert.ok(p&&p.name&&p.title&&p.speaker1&&p.speaker2&&p.statement1&&p.statement2);
 assert.ok(p.intro&&p.explain1&&p.explain2&&p.limitations&&p.conclusion);
 assert.equal(p.dir,code==="ar"||code==="ckb"?"rtl":"ltr");
 assert.equal(p.approved,false);
 assert.equal(p.translationStatus,"review-required");
 for(const field of ["source","study","sources","chain","classification","explanation","warning","result","language","question","of","next","correct","incorrect","finish","restart","review"])
   assert.ok(p.ui[field],code+" missing UI "+field);
 assert.equal(p.questions.length,4);
 p.questions.forEach((item,i)=>{
  assert.equal(item.correct,correct[i],code+" "+i+" key drift");
  assert.equal(item.a.length,4);
  assert.ok(item.q.length>7&&item.why.length>7);
  item.a.forEach(x=>assert.ok(x.length>=2));
 });
 texts.add(p.title);
}
assert.equal(texts.size,9);
const manuscript=read("docs/editorial-drafts/dieses-wissen-ist-religion-isnad-20261104-q50.md");
assert.match(manuscript,/draftStatus: "prepared-not-published"/);
assert.match(manuscript,/📖 \*\*/);
assert.match(manuscript,/#DarAlTawhid #Athar #Salaf #Sunnah/);
assert.match(manuscript,/🌙 \*\*𝐅𝐀𝐙𝐈𝐓:\*\*/);
assert.ok(!fs.existsSync(path.join(root,"content/posts/dieses-wissen-ist-religion-isnad-20261104-q50.md")),"No live post may be silently created");
console.log("Q50 PASS: 9 locales, 36 question translations, two original Arabic Āthār, 6 evidence links, URLs, RTL, draft-only, no repeat push");
