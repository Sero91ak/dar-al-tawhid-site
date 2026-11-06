#!/usr/bin/env node
"use strict";
/* DĀR AL TAWḤĪD Q1–Q50 language coverage gate.
 * A language picker is NOT proof that religious source text has been translated.
 * Pass means the UI infrastructure and coverage inventory are truthful.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=JSON.parse(read("assets/q1-q48-translation-catalog-v1.json"));
const worker=read("cloudflare/site-router.js"),adapter=read("assets/q-legacy-nine-language-v1.js");
const registry=JSON.parse(read("q/_registry/shortlinks.json"));
const expected=["de","ar","en","tr","ku","ckb","bs","fr","es"];
assert.deepEqual(catalog.languages,expected);
assert.equal(catalog.schemaVersion,1);
assert.equal(Object.keys(catalog.pages).length,48);
assert.match(worker,/id="darQLegacyNineLanguageV1"/,"Legacy source adapter not injected");
assert.match(worker,/Number\(numericSource\[1\]\) <= 48/,"Q49-Q51 must retain specialized translators");
assert.match(worker,/q-legacy-nine-language-v1\.js\?v=20261106-foundation1/);
assert.match(adapter,/darAdultPreferredLocaleV1/);
assert.match(adapter,/history\.replaceState/);
assert.match(adapter,/document\.documentElement\.dir=/);
assert.match(adapter,/qsource-arabic/);
assert.match(adapter,/dar-q-language-notice/);
assert.match(adapter,/data\.locales\[code\]/);
new vm.Script(adapter,{filename:"assets/q-legacy-nine-language-v1.js"});
const report={sources:48,languages:9,partialDrafts:0,germanFallbacks:0,missingPrimaryLinks:[],duplicatedId:[]};
for(let n=1;n<=48;n++){
  const p=catalog.pages[n],html=read("q/"+n+"/index.html");
  assert.ok(html.includes("qsource-page"),"Q"+n+" has no source card");
  assert.ok(p,"Q"+n+" missing localization inventory");
  assert.equal(p.qSourceId,"qsource:"+n,"Source identity changed");
  assert.equal(p.canonicalPath,"/q/"+n+"/","Q URL changed");
  assert.equal(registry.links.find(x=>x.number===n)?.shortPath,"/q/"+n+"/");
  assert.ok(!html.includes('id="darQLegacyNineLanguageV1"'),"Do not duplicate page-level source locale owner on Q"+n);
  if(n<=5){
    assert.equal(p.status,"partial-editorial-draft");
    assert.deepEqual(Object.keys(p.locales),expected);
    for(const code of expected){
      const l=p.locales[code];
      assert.ok(l&&l.title&&l.quote&&l.topic,"Partial source manuscript missing Q"+n+" "+code);
      assert.equal(l.approved,code==="de","Approval misrepresented Q"+n+" "+code);
      assert.equal(l.reviewStatus,code==="de"?"canonical-original":"partial-editorial-review-required");
      report.partialDrafts+=(code!=="de"?1:0);
    }
    assert.ok(html.includes(p.locales.de.title),"German heading drift for Q"+n);
    // German semantic quote must be the same, with no full-page overwrite.
    assert.ok(html.includes(p.locales.de.quote),"Original German quote drift for Q"+n);
  } else {
    assert.equal(p.status,"german-original-awaiting-translation");
    assert.equal(Object.keys(p.locales).length,0,"Unverified translations must not appear available on Q"+n);
    report.germanFallbacks++;
  }
}
for(let n of [49,50]){
  const html=read("q/"+n+"/index.html");
  assert.ok(html.includes("q"+n+"-localized.js"),"Q"+n+" independent locale owner must remain");
}
console.log("Q1–Q50 I18N FOUNDATION PASS",JSON.stringify(report));
console.log("Editorial note: 43 older Q sources retain German original text; 40 partial non-German drafts for Q1-Q5 are NOT approved.");
