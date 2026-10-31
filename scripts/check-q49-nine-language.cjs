"use strict";
/* Q49 staging acceptance: one post ID, one Q ID, nine locales, unchanged Arabic,
 * full source references, localized four-question quiz and readable German fallback. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const pack=JSON.parse(read("assets/q49-locales.json"));
const script=read("assets/q49-localized.js");
const page=read("q/49/index.html");
const test=read("lernen/recht-der-mutter/index.html");
const original=JSON.parse(read("docs/editorial-drafts/ibn-abbas-mutter-wahltun-20261031-q49-nine-languages.json"));
const expected=["de","ar","en","tr","ku","ckb","bs","fr","es"];
assert.deepEqual(Object.keys(pack.locales),expected);
assert.equal(pack.qSourceId,"qsource:49");
assert.equal(pack.quizId,"quiz:qsource:49");
assert.equal(pack.contentId,original.contentId);
assert.equal(pack.integration.publicationStatus,"staging-only-needs-religious-linguistic-and-device-review");
assert.equal(pack.sourceArabic.primary,original.sourceOriginalArabic.primary);
assert.equal(pack.sourceArabic.secondary,original.sourceOriginalArabic.secondary);
const ids=new Set(),postIds=new Set();
const required=["name","dir","title","speaker","primary","secondarySpeaker","secondary","context","sharh","conclusion","ui","quizUi","post","questions"];
for(const code of expected){
 const loc=pack.locales[code],src=original.locales[code];
 required.forEach(k=>assert.ok(loc[k],code+": missing "+k));
 for(const k of ["primary","secondary","context","sharh","conclusion"]){
  assert.equal(loc[k],src[k],code+": unexpected source translation change "+k);
 }
 assert.equal(loc.dir,(code==="ar"||code==="ckb")?"rtl":"ltr");
 assert.equal(loc.approved,false);
 assert.equal(loc.post.approval,"draft-not-published");
 assert.equal(loc.post.statement,loc.primary);
 assert.equal(loc.post.qSourceId,"qsource:49");
 assert.match(loc.post.sourceUrl,new RegExp("/q/49/\\?lang="+code+"$"));
 assert.match(loc.post.quizUrl,new RegExp("/lernen/recht-der-mutter/\\?lang="+code+"$"));
 postIds.add(loc.post.id);
 assert.equal(loc.questions.length,4);
 loc.questions.forEach((q,i)=>{assert.equal(q.id,"q49-0"+(i+1));assert.ok(q.question&&q.explanation);
 assert.equal(q.choices.length,4);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);ids.add(q.id)});
 for(const k of ["language","primaryTitle","contextTitle","hadithTitle","sharhTitle","referencesTitle","conclusionTitle","classification","chain","quizAction","chatAction","draftNotice"]){
 assert.ok(loc.ui[k],code+": UI locale missing "+k)}
 for(const k of ["question","of","correct","yes","no","next","result","finished","retry","sources","title"]){
 assert.ok(loc.quizUi[k],code+": quiz UI missing "+k)}
}
assert.equal(postIds.size,1);assert.equal(ids.size,4);
assert.ok(page.includes('class="qsource-section"')&&page.includes('al-Adab al-Mufrad')&&page.includes('q49-localized.js'));
assert.ok(page.includes("DIE BESONDERE STELLUNG DER MUTTER"));
assert.equal((page.match(/class="qsource-link web"/g)||[]).length,6);
assert.ok(page.includes("إِنِّي لَا أَعْلَمُ"));
assert.ok(test.includes("DIE RECHTE DER MUTTER")&&test.includes("q49-localized.js"));
assert.ok(test.includes("const questions="),"German no-network fallback must remain");
assert.ok(script.includes("darAdultPreferredLocaleV1")&&script.includes('fetch(DATA'));
assert.ok(script.includes('cloneNode(true)')&&script.includes('sessionStorage.setItem("darIlmQ49ContextV1"'));
new Function(script); // syntax without executing DOM runtime
console.log("Q49: nine locale packs, one post ID, source links, 36 quiz texts, RTL and fallback OK");
