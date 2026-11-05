"use strict";
/* Q51 regression guard: one post/source/quiz identity, nine complete language drafts.
   Independent theological/linguistic approval is NOT implied by this test.
   No push or publication is triggered. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const manifest=JSON.parse(read("assets/q51-locales.json"));
const source=read("q/51/index.html"),quiz=read("lernen/tawhid-schoepfer-anbetung/index.html");
const adapter=read("assets/q51-localized.js"),postRuntime=read("assets/dar-q51-post-language-v1.js");
const post=read("content/posts/qatadah-tawhid-schoepfer-anbetung-20261105-q51.md");
const router=read("cloudflare/site-router.js");
const codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const id="qatadah-tawhid-schoepfer-anbetung-20261105-q51";
assert.equal(manifest.contentId,"post:"+id);
assert.equal(manifest.canonicalPostId,id);
assert.equal(manifest.qSourceId,"qsource:51");
assert.equal(manifest.quizId,"quiz:qsource:51");
assert.equal(manifest.sourcePath,"/q/51/");
assert.equal(manifest.quizPath,"/lernen/tawhid-schoepfer-anbetung/");
assert.deepEqual(Object.keys(manifest.locales),codes);
assert.match(post,new RegExp('id: "'+id+'"'));
assert.match(post,/status: "published"/);
assert.match(post,/localizationManifest: "\/assets\/q51-locales.json"/);
assert.match(post,/url: "\/q\/51\/"/);
assert.match(source,/id="q51Language"/);
assert.match(source,/id="q51TabariAttribution"/);
assert.match(source,/class="qsource-learning"/);
assert.equal((source.match(/class="qsource-link web"/g)||[]).length,4);
assert.match(quiz,/id="qlLanguage"/);
assert.match(quiz,/id="qlSourceBack"/);
assert.match(router,/darQ51PostLanguageV1/);
assert.match(router,/dar-q51-post-language-v1\.js\?v=20261105-nine-preview-v3/);
assert.match(adapter,/return chosen\}/);
assert.match(adapter,/mark\(c\)/);
assert.match(adapter,/history\.replaceState/);
assert.match(adapter,/tabariAttribution/);
assert.match(postRuntime,/darAdultPreferredLocaleV1/);
assert.match(postRuntime,/DARQ51PostLocale/);
new vm.Script(adapter,{filename:"q51-localized.js"});
new vm.Script(postRuntime,{filename:"dar-q51-post-language-v1.js"});
for(const code of codes){
 const p=manifest.locales[code];
 assert.ok(p,code+" is missing");
 for(const key of ["title","speaker1","speaker2","statement1","statement2","intro","explain1","explain2","limitations","conclusion"]){
   assert.ok(p[key]&&typeof p[key]==="string",code+" missing "+key);
 }
 assert.equal(p.dir,code==="ar"||code==="ckb"?"rtl":"ltr");
 assert.equal(p.approved,code==="de",code+" review must not be falsely approved");
 assert.ok(p.ui?.tabariAttribution&&p.ui?.review&&p.ui?.sources&&p.ui?.arabic);
 assert.equal(p.questions.length,4);
 p.questions.forEach((q,i)=>{
   assert.equal(q.correct,[1,2,0,3][i],code+" answer key changed");
   assert.ok(q.q&&q.why&&q.a?.length===4);
 });
 assert.equal(p.post.id,id);
 assert.equal(p.post.qSourceId,"qsource:51");
 assert.equal(p.post.contentId,"post:"+id);
 assert.equal(p.post.sourceUrl,"/q/51/?lang="+code);
 assert.equal(p.post.quizUrl,"/lernen/tawhid-schoepfer-anbetung/?lang="+code);
 for(const field of ["title","statement","topic","source","summary","conclusion"]){
   assert.ok(p.post[field],code+" incomplete post "+field);
 }
 assert.ok(p.post.ui?.post&&p.post.ui?.source&&p.post.ui?.conclusion);
 assert.equal(p.post.independentLinguisticAndReligiousReview,false);
}
for(const arabic of [manifest.arabicOriginals.qatadah487,manifest.arabicOriginals.qatadah480]){
 assert.ok(arabic&&source.includes(arabic),"Arabic primary source must be unchanged");
}
async function simulateReader(){
 let current="de",renderCount=0;
 const raw={id,title:"📖 ORIGINAL GERMAN",statement:"Original statement",source:"Original source",links:[{url:"/q/51/"}],category:"Āthār"};
 const win={
  location:{hash:"#post/"+id,href:"https://dar-al-tawhid.de/?post="+id},
  localStorage:{getItem:k=>k==="darAdultPreferredLocaleV1"?current:null},
  currentRoute:{view:"post",value:id},
  addEventListener(){},requestAnimationFrame(fn){fn()},setTimeout(fn){fn()},scrollY:0,scrollTo(){}
 };
 const doc={
   readyState:"complete",head:{appendChild(){}},body:{},documentElement:{appendChild(){}},
   getElementById:k=>k==="appView"?{}:null,querySelector(){return null},
   createElement(){return {setAttribute(){},textContent:"",id:""}},
   addEventListener(){}
 };
 const context={window:win,document:doc,posts:[raw],currentRoute:win.currentRoute,URL,console,
  MutationObserver:class{observe(){}},requestAnimationFrame(fn){fn()},
  render(){renderCount++},fetch:async()=>({ok:true,json:async()=>manifest})};
 vm.runInNewContext(postRuntime,context,{filename:"q51 reader adapter"});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(win.DARQ51PostLocale.getReady(),true);
 for(const c of codes){
  current=c;win.DARQ51PostLocale.resync();
  const p=context.posts[0];
  if(c==="de"){
    assert.equal(p.title,"📖 ORIGINAL GERMAN");assert.equal(p.statement,"Original statement");assert.equal(p.source,"Original source");
  }else{
    assert.equal(p.title,manifest.locales[c].post.title,c+" title mismatch");
    assert.equal(p.statement,manifest.locales[c].post.statement,c+" statement mismatch");
    assert.equal(p.source,manifest.locales[c].post.source,c+" source mismatch");
    assert.equal(p.fazit,manifest.locales[c].post.conclusion,c+" Fazit mismatch");
  }
  assert.equal(p.id,id);assert.equal(p.links[0].url,"/q/51/");
 }
 current="de";win.DARQ51PostLocale.resync();
 assert.equal(raw.statement,"Original statement","German original not restored");
 assert.ok(renderCount>=codes.length,"Language changes must cause rerenders");
 console.log("PASS Q51: 9 complete locale drafts, 36 fixed quiz answers, post locale simulation, RTL, source/lesson links; no fake approvals");
}
simulateReader().catch(e=>{console.error(e);process.exitCode=1});