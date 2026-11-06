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

/* Headless source-adapter contract: a manual choice changes Q1 text and RTL,
   restores the unchanged German canonical nodes, and Q30 fails visibly closed. */
async function simulate(number,firstCode){
  const created=[],nodes={},events={},stored="de",page={};
  function element(tag){
    return {tagName:tag, textContent:"",value:"",children:[],hidden:false,attributes:{},listeners:{},
      setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]||""},
      addEventListener(k,fn){this.listeners[k]=fn},append(...x){this.children.push(...x)},appendChild(x){this.children.push(x)},
      querySelector(sel){if(sel===".dar-q-language-notice")return nodes.notice;return null},matches(){return false},
      insertBefore(x){this.children.push(x)},querySelectorAll(){return []}};
  }
  const main=element("main"),hero=element("section");
  const title=element("h2"),quote=element("p"),topic=element("p"),arabic=element("p");
  title.textContent=catalog.pages[number].locales.de?.title||"Canonical German Q"+number;
  quote.textContent="„"+(catalog.pages[number].locales.de?.quote||"German canonical quotation")+"“";
  topic.textContent=catalog.pages[number].locales.de?.topic||"Original topic";
  arabic.textContent="النص العربي الأصلي";
  nodes.title=title;nodes.quote=quote;nodes.topic=topic;nodes.arabic=arabic;
  hero.parentNode={insertBefore(x){nodes.pickerSection=x;nodes.notice=x.children[2];nodes.select=x.children[1];nodes.label=x.children[0]}};
  const bySelector={
    ".qsource-page":main,".qsource-hero":hero,".qsource-title":title,".qsource-quote":quote,
    ".qsource-meta-row:nth-child(2) .qsource-meta-value":topic,".qsource-brand-top":null,
    ".dar-q-language-label":null,".qsource-social a.web":null
  };
  const doc={
    readyState:"complete",head:{appendChild(){}},documentElement:{lang:"de",dir:"ltr",appendChild(){}},
    createElement:element,querySelector(sel){if(sel==="#darQLegacyLanguageV1")return nodes.pickerSection||null;if(sel===".dar-q-language-label")return nodes.label||null;if(sel==="#darQSourceLanguage")return nodes.select||null;return bySelector[sel]||null},
    querySelectorAll(sel){if(sel===".qsource-arabic")return [arabic];return []},
    addEventListener(){},title:"",body:{}
  };
  const route={pathname:"/q/"+number+"/",href:"https://dar-al-tawhid.de/q/"+number+"/?lang="+firstCode,search:"?lang="+firstCode};
  const localStorage={getItem(){return stored},setItem(k,v){stored=v}};
  const history={state:null,replaceState(st,title,u){route.pathname=u.split("?")[0];route.href="https://dar-al-tawhid.de"+u}};
  const win={addEventListener(k,fn){events[k]=fn},dispatchEvent(){}};
  const ctx={window:win,document:doc,location:route,localStorage,history,URL,CustomEvent:class{constructor(name,options){this.type=name;this.detail=options.detail}},console,
    fetch:async()=>({ok:true,json:async()=>catalog})};
  const germanQuote=quote.textContent;
  vm.runInNewContext(adapter,ctx,{filename:"legacy locale runtime"});
  for(let i=0;i<12;i++)await Promise.resolve();
  assert.equal(doc.documentElement.lang,firstCode);
  assert.equal(doc.documentElement.dir,firstCode==="ar"||firstCode==="ckb"?"rtl":"ltr");
  const pack=catalog.pages[number].locales[firstCode];
  if(pack?.title){
    assert.equal(title.textContent,pack.title,"Expected available Q"+number+" "+firstCode+" translated heading");
    assert.ok(quote.textContent.includes(pack.quote),"Expected available translated quote");
  }else{
    assert.equal(quote.textContent,germanQuote,"Untranslated Q"+number+" may not silently alter the German quote");
    assert.equal(nodes.notice.hidden,false,"Unreviewed fallback requires visible notice");
    assert.ok(nodes.notice.textContent.length>20);
  }
  assert.equal(arabic.textContent,"النص العربي الأصلي","Original Arabic modified");
  nodes.select.value="de";nodes.select.listeners.change();
  assert.equal(title.textContent,catalog.pages[number].locales.de?.title||"Canonical German Q"+number);
  assert.equal(quote.textContent,germanQuote);
  assert.equal(arabic.textContent,"النص العربي الأصلي");
  assert.ok(route.href.includes("lang=de"));
}
Promise.all([simulate(1,"ar"),simulate(4,"tr"),simulate(30,"fr")])
 .then(()=>console.log("Q-source runtime PASS: Arabic, Turkish, French fallback, immutable original and language switching"))
 .catch(error=>{console.error(error);process.exitCode=1});

console.log("Q1–Q50 I18N FOUNDATION PASS",JSON.stringify(report));
console.log("Editorial note: 43 older Q sources retain German original text; 40 partial non-German drafts for Q1-Q5 are NOT approved.");
