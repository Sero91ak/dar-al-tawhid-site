#!/usr/bin/env node
"use strict";
/* Protected release test: verify the real Frauen renderer against all 16 entries.
 * NO production file is changed; the unlocked path exists in in-memory test data only.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const load=(file)=>JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
const batch=load("content/admin/frauen-batch-16-2026-11-18.json");
const locale=load("assets/frauen/frauen-entry-locales-v1.json");
const realSource=fs.readFileSync(path.join(root,"assets/frauen/frauen-fiqh.js"),"utf8");
const adapter=fs.readFileSync(path.join(root,"assets/frauen/frauen-live-adapter.js"),"utf8");
const langModule=fs.readFileSync(path.join(root,"assets/frauen/frauen-entry-locale-v1.js"),"utf8");
const routes=Object.freeze({
 "data/frauen-sahabiyyat.json":"sahabiyyat",
 "data/frauen-muetter-der-glaeubigen.json":"muetter-der-glaeubigen",
 "data/frauen-fiqh.json":"fiqh"
});
const cohort=new Map(batch.records.map(r=>[r.id,r]));
assert.equal(cohort.size,16);
for(const r of batch.records){
 assert.equal(r.area,routes[r.sourceFile],"The actual renderer route must be used, not the editorial category: "+r.id);
 assert.equal(locale.entries[r.id]?.area,r.area,"Locale click/share route wrong: "+r.id);
 assert.equal(locale.entries[r.id]?.id,r.id,"Identity drift "+r.id);
}
assert.match(adapter,/data-value|data-nav/, "App adapter must support original navigation");
assert.match(adapter,/location\.hash\s*=\s*hash/, "App adapter must navigate on card click");
assert.match(langModule,/function applyOneCard\(/, "App module must localize visible cards");
assert.match(langModule,/function applyOneArticle\(/, "App module must localize detail reader");
async function boot(unlockInMemory){
 const document={
  body:{setAttribute(){}}, addEventListener(){},
  querySelector(){return null},querySelectorAll(){return []}
 };
 const location={hash:"#frauen",href:"https://dar-al-tawhid.de/#frauen",pathname:"/",origin:"https://dar-al-tawhid.de"};
 const win={location,document,addEventListener(){},render:null,readRoute(){return {view:"frauen",value:""};}};
 const fetch=(url)=>{
   if(!/^\/data\/frauen-.*\.json(?:\?.*)?$/.test(url))throw Error("Unexpected network request: "+url);
   const file=path.join(root,url.split("?")[0].replace(/^\/+/,""));
   const json=JSON.parse(fs.readFileSync(file,"utf8"));
   for(const e of json.eintraege||[]){
     if(cohort.has(e.kennung)){
       assert.equal(e.freigabeDurchSerhat,true,"Owner flag missing: "+e.kennung);
       // Explicit fixtures let this test pass before AND after actual approval.
       e.quellenstatus=unlockInMemory?"geprueft":"nicht-anzeigen";
     }
   }
   return Promise.resolve({ok:true,json:async()=>json});
 };
 const context={window:win,document,location,fetch,Promise,console,URL,requestAnimationFrame:fn=>fn()};
 vm.runInNewContext(realSource,context,{filename:"frauen-fiqh.js",timeout:15000});
 const engine=win.DARFrauenFiqh;
 assert.ok(engine&&typeof engine.render==="function"&&typeof engine.parseValue==="function");
 engine.render("sahabiyyat");
 await new Promise(resolve=>setTimeout(resolve,0));
 return engine;
}
(async()=>{
 const hidden=await boot(false);
 for(const r of batch.records){
  const html=hidden.render(r.area+"/"+r.id);
  assert.match(html,/nicht sichtbar/i,"Hidden item leaked from source before publication: "+r.id);
 }
 const reader=await boot(true);
 const byArea=Object.groupBy(batch.records,r=>r.area);
 for(const [area,records] of Object.entries(byArea)){
  const list=reader.render(area);
  for(const r of records){
   const link=area+"/"+r.id;
   assert.ok(list.includes('data-value="'+link+'"'),"Visible card missing clickable target "+link);
  }
 }
 for(const r of batch.records){
  const route=r.area+"/"+r.id;
  const parsed=reader.parseValue(route);
  assert.equal(parsed.page,"detail","Reader parser cannot open "+route);
  assert.equal(parsed.abschnitt,r.area,"Reader parser selected wrong data file: "+route);
  assert.equal(parsed.kennung,r.id,"Reader parser changed canonical ID "+route);
  const html=reader.render(route);
  assert.ok(html.includes('<article class="article post-reader">'),"No full reader for "+route);
  assert.ok(html.includes('data-share-kennung="'+r.id+'"'),"Share identity missing "+route);
  assert.ok(html.includes('data-frauen-share="copy-text"'),"Text copy missing "+route);
  assert.ok(html.includes('data-frauen-share="copy-link"'),"Share link missing "+route);
  assert.ok(html.includes('data-frauen-share="native"'),"Native share missing "+route);
  assert.ok(html.includes('href="'+r.sourceUrl+'"'),"Direct proof link changed or missing: "+route);
  assert.ok(html.includes('data-value="'+r.area+'"'),"Back-to-list route missing "+route);
 }
 console.log("PASS 16 women: actual renderer simulated in memory, source hidden gate verified, 16 clickable card URLs, 16 detail readers, 16 source links, sharing/back controls, 16 canonical IDs. No app data published.");
})().catch(error=>{console.error(error&&error.stack||error);process.exitCode=1;});
