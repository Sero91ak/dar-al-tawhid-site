"use strict";
/* Q51: single identity across all 9 adult languages, source, quiz and reader.
 * Draft-language display is owner-authorized; independent review remains pending.
 * Run: node scripts/check-q51-nine-language.cjs
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const base=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(base,p),"utf8");
const pack=JSON.parse(read("assets/q51-locales.json"));
const script=read("assets/q51-localized.js");
const postScript=read("assets/dar-q51-post-language-v1.js");
const source=read("q/51/index.html");
const lesson=read("lernen/tawhid-schoepfer-anbetung/index.html");
const router=read("cloudflare/site-router.js");
const markdown=read("content/posts/qatadah-tawhid-schoepfer-anbetung-20261105-q51.md");
const languages=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const id="qatadah-tawhid-schoepfer-anbetung-20261105-q51";
const answers=[1,2,0,3];
assert.deepEqual(Object.keys(pack.locales),languages);
assert.equal(pack.canonicalPostId,id);
assert.equal(pack.contentId,"post:"+id);
assert.equal(pack.qSourceId,"qsource:51");
assert.equal(pack.sourcePath,"/q/51/");
assert.equal(pack.quizPath,"/lernen/tawhid-schoepfer-anbetung/");
assert.equal(pack.appLocaleStorageKey,"darAdultPreferredLocaleV1");
assert.match(pack.publicationStatus,/independent-linguistic-and-religious-review-pending/);
assert.match(markdown,/availableLocales: "de,ar,en,tr,ku,ckb,bs,fr,es"/);
assert.match(markdown,/reviewPendingLocales: "ar,en,tr,ku,ckb,bs,fr,es"/);
assert.match(router,/darQ51PostLanguageV1/);
assert.match(router,/dar-q51-post-language-v1\.js\?v=20261105-q51-nine-complete-v1/);
assert.match(source,/id="q51TabariAttribution"/);
assert.match(source,/q51-localized\.js\?v=20261105-nine-complete-v1/);
assert.match(lesson,/q51-localized\.js\?v=20261105-nine-complete-v1/);
for(const original of Object.values(pack.arabicOriginals)) assert.ok(source.includes(original),"Arabic original not preserved");
assert.equal((source.match(/class="qsource-link web"/g)||[]).length,4,"Four original references unchanged");
new vm.Script(script,{filename:"assets/q51-localized.js"});
new vm.Script(postScript,{filename:"assets/dar-q51-post-language-v1.js"});
assert.match(script,/publicationApprovedByOwner===true/);
assert.match(script,/p\.ui\.tabariContext/);
assert.match(script,/history\.replaceState/);
assert.match(script,/p\.ui\.review/);
const registry=JSON.parse(read("q/_registry/shortlinks.json"));
assert.equal(registry.links.find(x=>x.number===51)?.postReference,id);
for(const code of languages){
 const p=pack.locales[code];
 assert.ok(p&&p.title&&p.statement1&&p.statement2&&p.intro&&p.explain1&&p.explain2&&p.limitations&&p.conclusion,code+" missing source content");
 assert.equal(p.dir,code==="ar"||code==="ckb"?"rtl":"ltr",code+" direction mismatch");
 assert.equal(p.questions.length,4,code+" requires four localized questions");
 assert.deepEqual(p.questions.map(x=>x.correct),answers,code+" answer-key drift");
 for(const q of p.questions)assert.ok(q.q&&q.why&&Array.isArray(q.a)&&q.a.length===4,code+" incomplete localized question");
 assert.ok(p.ui&&p.ui.tabariContext&&p.ui.tabariAttribution&&p.ui.sourceLinkDescriptions.length===4,code+" missing localized source details");
 assert.ok(p.ui.source&&p.ui.study&&p.ui.review&&p.ui.question&&p.ui.correct&&p.ui.incorrect,code+" missing reader controls");
 assert.equal(p.post.id,id);
 assert.equal(p.post.contentId,"post:"+id);
 assert.equal(p.post.qSourceId,"qsource:51");
 assert.equal(p.post.sourceUrl,"/q/51/?lang="+code);
 assert.equal(p.post.quizUrl,"/lernen/tawhid-schoepfer-anbetung/?lang="+code);
 assert.ok(p.post.title&&p.post.statement&&p.post.source&&p.post.summary&&p.post.conclusion,code+" incomplete post");
 assert.equal(p.post.summary,p.conclusion,code+" summary not consistent with Fazit");
 assert.equal(p.post.publicationApprovedByOwner,true,code+" owner display consent missing");
 assert.equal(p.post.independentLinguisticAndReligiousReview,false,code+" must not claim independent review");
 if(code!=="de")assert.equal(p.approved,false,code+" must retain editorial review warning");
}
const makeNode=()=>({
 textContent:"",value:"",hidden:false,children:[],classList:{toggle(){}},
 setAttribute(){},append(){},appendChild(){},querySelectorAll(){return[]},querySelector(){return null},
 addEventListener(event,fn){this[event]=fn},replaceChildren(...children){this.children=children}
});
async function checkStandalone(page,kind){
 const ids=[...page.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
 const nodes=Object.fromEntries(ids.map(x=>[x,makeNode()]));
 const pathname=kind==="source"?"/q/51/":"/lernen/tawhid-schoepfer-anbetung/";
 const loc=new URL("https://dar-al-tawhid.de"+pathname);
 let storage="de";
 const document={baseURI:loc.href,body:{classList:{toggle(){}}},documentElement:{lang:"de",dir:"ltr"},
  getElementById(k){return nodes[k]||null},createElement:makeNode};
 const window={addEventListener(){},dispatchEvent(){},history:{state:null,replaceState(){}}};
 const localStorage={getItem(){return storage},setItem(_,code){storage=code}};
 vm.runInNewContext(script,{window,document,localStorage,location:loc,URL,URLSearchParams,
  CustomEvent:class{},fetch:async()=>({ok:true,json:async()=>pack}),console},
  {filename:"assets/q51-localized.js"});
 await new Promise(resolve=>setImmediate(resolve));
 const picker=nodes[kind==="source"?"q51Language":"qlLanguage"];
 assert.equal(typeof picker.change,"function",kind+" picker missing change action");
 for(const code of languages){
  picker.value=code;picker.change();
  assert.equal(storage,code,kind+" failed to save "+code);
  assert.equal(document.documentElement.dir,code==="ar"||code==="ckb"?"rtl":"ltr",kind+" RTL failed "+code);
  assert.equal(nodes[kind==="source"?"q51Title":"qlTitle"].textContent,pack.locales[code].title,kind+" title failed "+code);
  if(kind==="source"){
   assert.ok(nodes.q51Statement1.textContent.includes(pack.locales[code].statement1));
   assert.equal(nodes.q51Context.textContent,pack.locales[code].ui.tabariContext);
   assert.ok(nodes.q51Review.textContent||code==="de",code+" missing draft notice");
  }else assert.equal(nodes.qlQuestion.textContent,pack.locales[code].questions[0].q,code+" quiz translation failed");
 }
}
async function checkReader(){
 let chosen="de",renders=0;
 const original={id,title:"Original German",statement:"Original quote",source:"Original citation",scholar:"Original Qatādah",links:[{url:"/q/51/"}]};
 const doc={readyState:"complete",head:{appendChild(){}},body:{},documentElement:{appendChild(){}},
  createElement(){return makeNode()},getElementById(k){return k==="appView"?{}:null},querySelector(){return null},addEventListener(){}};
 const win={currentRoute:{view:"post",value:id},location:{hash:"#post/"+id,href:"https://dar-al-tawhid.de/?post="+id},
  localStorage:{getItem(){return chosen}},requestAnimationFrame(fn){fn()},setTimeout(fn){fn()},addEventListener(){},scrollY:0,scrollTo(){}};
 vm.runInNewContext(postScript,{window:win,document:doc,posts:[original],currentRoute:win.currentRoute,
  render(){renders++},requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){}},
  fetch:async()=>({ok:true,json:async()=>pack}),URL,console},{filename:"assets/dar-q51-post-language-v1.js"});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(win.DARQ51PostLocale.getReady(),true);
 for(const code of languages){
  chosen=code;win.DARQ51PostLocale.resync();
  if(code==="de"){
   assert.equal(original.title,"Original German");
   assert.equal(original.statement,"Original quote");
  }else{
   const p=pack.locales[code].post;
   for(const field of ["title","statement","source"])assert.equal(original[field],p[field],code+" post "+field+" mismatch");
   assert.equal(original.fazit,p.conclusion,code+" Fazit mismatch");
  }
  assert.equal(original.id,id);
  assert.equal(original.links[0].url,"/q/51/");
 }
 assert.ok(renders>=9,"Reader must rerender on all nine language changes");
}
(async()=>{
 await checkStandalone(source,"source");
 await checkStandalone(lesson,"lesson");
 await checkReader();
 console.log("Q51 NINE-LANGUAGE PASS: same canonical post and Q ID; full localized source, 36 questions, reader, RTL, original Arabic and independent-review notes.");
})().catch(e=>{console.error(e);process.exitCode=1});
