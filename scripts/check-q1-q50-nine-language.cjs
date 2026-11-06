#!/usr/bin/env node
"use strict";
/* Q1–Q50: one canonical ID each, nine UI languages, no fabricated approvals.
 * Distinguishes actual source-manuscript coverage from a language-picker shell.
 * This is a STRUCTURAL test, not religious/editorial verification. */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const registry=JSON.parse(read("q/_registry/shortlinks.json"));
const data=JSON.parse(read("assets/q-legacy-locales-v1.json"));
const script=read("assets/q-legacy-nine-language-v1.js");
const router=read("cloudflare/site-router.js");
const legacy=(registry.links||[]).filter(x=>x.number>=1&&x.number<=50);
assert.equal(legacy.length,50,"Q1–Q50 must each have one registry entry");
assert.deepEqual(legacy.map(x=>x.number),Array.from({length:50},(_,i)=>i+1));
assert.deepEqual(data.languages,codes);
assert.equal(data.schemaVersion,1);
assert.deepEqual(Object.keys(data.pages),["1","2","3","4","5"],"Never claim unseen source translations are complete");
assert.match(script,/qLegacyLanguageSelect/);
assert.match(script,/darAdultPreferredLocaleV1/);
assert.match(script,/history\.replaceState/);
assert.match(script,/q-legacy-rtl/);
assert.match(script,/ui\.fallback/);
assert.match(read("assets/q-legacy-locales-v1.json"),/sourceGitBlobSha/,"Manuscript source-revision record missing");
assert.match(router,/Number\(numericSource\[1\]\) <= 48/,"Q1-Q48 shared UI adapter not routed");
assert.match(router,/q-legacy-nine-language-v1\.js\?v=20261106-ui-v1/);
new vm.Script(script,{filename:"assets/q-legacy-nine-language-v1.js"});
for(let number=1;number<=50;number++){
 const raw=read("q/"+number+"/index.html");
 assert.ok(raw.length>1000,"Missing Q"+number+" original source");
 assert.match(raw,/<html\b[^>]*\blang\s*=\s*["\x27]de["\x27]/i,"German canonical source missing at Q"+number);
 if(number>=49){assert.match(raw,/q\d+-localized\.js/,"Q"+number+" must retain dedicated 9-language adapter");continue}
 if(number>=6)continue;
 const p=data.pages[number];
 assert.equal(p.canonicalId,"qsource:"+number);
 assert.equal(p.canonicalPath,"/q/"+number+"/");
 assert.ok(raw.includes(p.canonicalTitle),"Q"+number+" canonical title diverged");
 assert.ok(raw.includes(p.canonicalQuote),"Q"+number+" canonical statement diverged");
 const blob=crypto.createHash("sha1").update(Buffer.from("blob "+Buffer.byteLength(raw)+"\0")).update(raw).digest("hex");
 assert.equal(p.sourceGitBlobSha,blob,"Q"+number+" changed; stale foreign drafts require re-review");
 assert.deepEqual(Object.keys(p.locales),codes);
 const nLinks=(raw.match(/<a class="qsource-link\b/g)||[]).length;
 for(const code of codes){
   const l=p.locales[code],required=["title","quote","speaker","topic","section","noteLabel","noteBody","linkTitles","linkSubs"];
   for(const key of required)assert.ok(l[key],code+" Q"+number+" missing "+key);
   assert.equal(l.approved,code==="de","Foreign source draft falsely approved");
   assert.equal(l.independentLinguisticAndReligiousReview,false);
   assert.equal(l.linkTitles.length,nLinks,code+" Q"+number+" changed source link count");
   assert.equal(l.linkSubs.length,nLinks,code+" Q"+number+" changed source link descriptions");
   for(const key of ["linkTitles","linkSubs"])assert.ok(l[key].every(s=>typeof s==="string"&&s.trim()));
   if(code!=="de")assert.equal(l.translationStatus,"draft-review-required");
 }
}
// The remainder is deliberately incomplete, not silently marked translated.
for(let number=6;number<=48;number++)assert.equal(data.pages[number],undefined);
console.log("Q1–Q50 coverage: 50 canonical Q IDs, 48 shared UI routes, 5 nine-language source drafts, 43 older sources awaiting text packs; Q49/50 retain dedicated language packs. Original Arabic/evidence remain untouched.");
