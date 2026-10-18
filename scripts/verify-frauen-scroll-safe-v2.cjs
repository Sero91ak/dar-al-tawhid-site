#!/usr/bin/env node
"use strict";
/* DAR_FRAUEN_SCROLL_RESET_SAFE_V2: real browser reproduction/control and repair QA.
   Browser suite uses a synthetic Frauen renderer, the genuine adapter bytes,
   and actual existing static Frauen Hero photograph. No production mutations. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const {chromium,webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const evidence=path.join(root,"frauen-scroll-safe-v2-evidence");
fs.mkdirSync(evidence,{recursive:true});
const versioned="assets/frauen/frauen-live-adapter-scroll-safe-v2.js";
const legacy="assets/frauen/frauen-live-adapter.js";
const locked=fs.readFileSync(path.join(root,legacy),"utf8");
const candidate=fs.readFileSync(path.join(root,versioned),"utf8");
assert.match(locked,/global\.scrollTo\(0,0\)/);
assert.match(candidate,/DAR_FRAUEN_SCROLL_RESET_SAFE_V2/);
assert.doesNotMatch(candidate,/\.dar-immersive-hero-stage|appendChild\(hero\)|touchmove/);
assert.ok(fs.existsSync(path.join(root,"assets/frauen/library-v1224/03-erste-generationen.jpg")));
for(const fname of ["cloudflare/test-app-worker.js","cloudflare/site-router.js"]){
  const data=fs.readFileSync(path.join(root,fname),"utf8");
  assert.ok(!data.includes("darAdultImmersiveHeroVisitorV1")&&!data.includes("darAdultImmersiveHeroTestV1"));
}
const fixture=(isOld)=>`<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
:root{background:#f3f2eb;color:#173028;font-family:system-ui}
*{box-sizing:border-box}body{margin:0;overflow-x:clip}
#appView{width:100%;padding:0 0 200px}
.frauen-library-hero{background-image:linear-gradient(90deg,rgba(0,15,15,.78),rgba(0,15,15,.07)),url("/assets/frauen/library-v1224/03-erste-generationen.jpg");background-size:cover;background-position:center;height:330px;width:100%;padding:40px 20px;display:flex;flex-direction:column;justify-content:end;color:white}
.frauen-library-hero h1{font:40px Georgia,serif;margin:0}.frauen-library-search-wrap{padding:15px 22px;background:#eaf0e8}.frauen-library-search-wrap input{font-size:17px;padding:14px;width:100%}
.frauen-library-card{padding:25px;border:1px solid #bdcbc0;border-radius:22px;background:#fffdfa;min-height:185px;display:block;width:calc(100% - 36px);margin:15px 18px;text-align:left;font-size:18px;color:#173028}
</style></head><body><div id="appView"></div>
<script>
window.__baseCalls=0;window.__viewPaints=0;window.__bindCalls=0;window.__renderEvents=0;
window.__search="";window.__dataVersion=0;
window.readRoute=function(){
var h=location.hash.slice(1);if(!h.startsWith("frauen"))return{view:"start"};
return{view:"frauen",value:h.split("/").slice(1).join("/")};
};
window.render=function(){window.__baseCalls++};
window.DARFrauenFiqh={
render:function(value){
  var route=String(value||"");
  window.__viewPaints++;
  var title=route?"Fiqh der Frauen":"Frauen im Islam";
  var cards=Array.from({length:9},function(_,i){
    return '<button type="button" class="frauen-library-card" data-nav="frauen" data-value="group/din">Kapitel '+(i+1)+' · '+title+'</button>';
  }).join("");
  return '<div class="frauen-library-shell"><header class="frauen-library-hero"><h1>'+title+'</h1></header>'+
  '<div class="frauen-library-search-wrap"><input data-frauen-q type="search" value="'+window.__search+'" aria-label="Frauenbereich Suche"></div>'+
  '<p id="dataVersion">Datenversion: '+window.__dataVersion+'</p>'+
  '<div class="cards">'+cards+'</div></div>';
},
bind:function(){
  window.__bindCalls++;
  var field=document.querySelector("[data-frauen-q]");
  if(field&&!field.dataset.bound){field.dataset.bound="1";field.addEventListener("input",function(){
    window.__search=field.value;
    window.render();
  });}
},
reload:function(){window.__dataVersion++;return Promise.resolve()}
};
document.addEventListener("dar:frauen-render",function(){window.__renderEvents++});
</script>
<script src="/${isOld?"assets/frauen/frauen-live-adapter.js":versioned}"></script>
</body></html>`;
const server=http.createServer((request,response)=>{
  const p=new URL(request.url,"http://localhost").pathname;
  if(p==="/"||p==="/legacy"){
    response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
    response.end(fixture(p==="/legacy"));return;
  }
  const pathname=decodeURIComponent(p).replace(/^\/+/, "");
  const full=path.resolve(root,pathname);
  if(!full.startsWith(root+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile()){
    response.writeHead(404);response.end("Missing");return;
  }
  response.writeHead(200,{"Content-Type":/\.js$/.test(full)?"text/javascript":/\.jpe?g$/.test(full)?"image/jpeg":"application/octet-stream"});
  fs.createReadStream(full).pipe(response);
});
const scenarios=[
  {engine:"chromium",width:393,height:852,mobile:true},
  {engine:"chromium",width:320,height:640,mobile:true},
  {engine:"chromium",width:820,height:1180,mobile:true},
  {engine:"chromium",width:1440,height:900,mobile:false},
  {engine:"webkit",width:393,height:852,mobile:true},
  {engine:"webkit",width:820,height:1180,mobile:true}
];
const results=[],failures=[];
function styleProbe(){
 const hero=document.querySelector(".frauen-library-hero"),s=document.scrollingElement;
 const r=hero?.getBoundingClientRect();
 return {scrollY:window.scrollY,docTop:s?.scrollTop,searchFocused:document.activeElement?.hasAttribute("data-frauen-q"),
  activeValue:document.activeElement?.value,
  hero:{top:r?.top,height:r?.height,width:r?.width,img:hero?getComputedStyle(hero).backgroundImage:null},
  firstCard:document.querySelector(".frauen-library-card")?.getBoundingClientRect().top,
  rootChildren:document.querySelectorAll("#appView > .dar-frauen-production-root").length,
  bodyClass:document.body.className,view:document.body.dataset.frauenView||""};
}
async function runCase(browser,cfg,origin){
 const tag=cfg.engine+"-"+cfg.width+"x"+cfg.height;
 const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},
  isMobile:cfg.mobile,hasTouch:cfg.mobile,deviceScaleFactor:cfg.mobile?2:1});
 const page=await context.newPage(),errors=[],missing=[];
 page.on("pageerror",e=>errors.push(String(e.message)));
 page.on("response",r=>{if(r.status()>=400)missing.push(r.status()+":"+r.url())});
 try{
  await page.goto(origin+"/#frauen",{waitUntil:"load"});
  await page.waitForFunction(()=>document.querySelector(".frauen-library-hero"));
  const initial=await page.evaluate(styleProbe);
  assert.match(initial.hero.img,/03-erste-generationen\.jpg/);
  assert.equal(initial.rootChildren,1);
  assert.ok(initial.hero.height>=280);
  assert.ok(Math.abs(initial.hero.width-cfg.width)<=2);
  await page.evaluate(()=>window.scrollTo(0,620));
  await page.waitForTimeout(70);
  const y1=await page.evaluate(()=>window.scrollY);
  assert.ok(y1>300,tag+" cannot initially scroll");
  const oldHeroId=await page.evaluate(()=>{window.__initialHero=document.querySelector(".frauen-library-hero");return window.__renderEvents});
  await page.evaluate(()=>{for(let n=0;n<5;n++)window.render();document.dispatchEvent(new Event("dar:render"));});
  await page.waitForTimeout(120);
  const y2=await page.evaluate(()=>window.scrollY);
  assert.ok(Math.abs(y2-y1)<3,tag+" repeated render reset scroll "+y1+" -> "+y2);
  const dom=await page.evaluate(()=>({
    sameHero:window.__initialHero===document.querySelector(".frauen-library-hero"),
    eventIncrease:window.__renderEvents,extraRoot:document.querySelectorAll(".dar-frauen-production-root").length
  }));
  assert.equal(dom.sameHero,true,tag+" unchanged route remounted hero");
  assert.equal(dom.extraRoot,1);
  assert.equal(dom.eventIncrease,oldHeroId,tag+" no-change render still dispatched event");
  await page.screenshot({path:path.join(evidence,tag+"-scrolled.png")});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator("[data-frauen-q]").fill("Fiqh");
  await page.waitForTimeout(100);
  assert.equal(await page.locator("[data-frauen-q]").inputValue(),"Fiqh");
  assert.equal(await page.locator("[data-frauen-q]").evaluate(el=>el===document.activeElement),true,tag+" search lost focus");
  await page.evaluate(()=>window.scrollTo(0,410));
  const beforeRefresh=await page.evaluate(()=>window.scrollY);
  await page.evaluate(()=>window.render());
  assert.ok(Math.abs((await page.evaluate(()=>window.scrollY))-beforeRefresh)<3,tag+" same-route render reset after search");
  await page.evaluate(()=>document.dispatchEvent(new Event("dar:live-sync-done")));
  await page.waitForTimeout(120);
  assert.ok(Math.abs((await page.evaluate(()=>window.scrollY))-beforeRefresh)<3,tag+" live sync reset scroll");
  assert.equal(await page.locator("#dataVersion").innerText(),"Datenversion: 1");
  await page.locator(".frauen-library-card").first().click({timeout:5000});
  await page.waitForFunction(()=>location.hash==="#frauen/group/din");
  await page.waitForTimeout(180);
  const navigated=await page.evaluate(styleProbe);
  assert.equal(navigated.rootChildren,1);
  assert.equal(navigated.scrollY,0,tag+" route transition did not reset scroll");
  assert.equal(await page.locator(".frauen-library-hero h1").innerText(),"Fiqh der Frauen");
  await page.evaluate(()=>window.scrollTo(0,350));
  await page.evaluate(()=>location.hash="#start");
  await page.waitForTimeout(160);
  assert.equal(await page.evaluate(()=>document.body.classList.contains("is-frauen-route")),false);
  await page.evaluate(()=>location.hash="#frauen");
  await page.waitForTimeout(180);
  assert.equal(await page.locator(".frauen-library-hero h1").innerText(),"Frauen im Islam");
  assert.equal(await page.evaluate(()=>window.scrollY),0);
  assert.deepEqual(errors,[],tag+" JS errors");
  assert.deepEqual(missing,[],tag+" 404s");
  results.push({tag,status:"pass",repeatedRenderScroll:y2,afterRoute:navigated.scrollY,search:true,hero:initial.hero.height});
  console.log("FRAUEN_SCROLL_SAFE_PASS "+JSON.stringify(results[results.length-1]));
 }catch(e){
  const err=tag+": "+String(e.stack||e).slice(0,950);failures.push(err);
  console.error("FRAUEN_SCROLL_SAFE_FAIL "+err);
  try{await page.screenshot({path:path.join(evidence,tag+"-failure.png")})}catch(err){}
 }finally{await context.close()}
}
(async()=>{
 await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
 const origin="http://127.0.0.1:"+server.address().port;
 try{
  const controlBrowser=await chromium.launch({headless:true});
  const page=await controlBrowser.newPage({viewport:{width:393,height:852}});
  await page.goto(origin+"/legacy#frauen",{waitUntil:"load"});
  await page.waitForFunction(()=>document.querySelector(".frauen-library-hero"));
  await page.evaluate(()=>window.scrollTo(0,620));
  const y=await page.evaluate(()=>window.scrollY);
  await page.evaluate(()=>window.render());
  const reset=await page.evaluate(()=>window.scrollY);
  assert.ok(y>300&&reset===0,"Legacy control must reproduce scroll reset");
  console.log("FRAUEN_SCROLL_LEGACY_REPRODUCED "+JSON.stringify({before:y,after:reset}));
  await controlBrowser.close();
  for(const engineName of ["chromium","webkit"]){
   const browser=await ({chromium,webkit})[engineName].launch({headless:true});
   for(const cfg of scenarios.filter(x=>x.engine===engineName))await runCase(browser,cfg,origin);
   await browser.close();
  }
 }catch(e){failures.push("runner: "+String(e.stack||e).slice(0,900));}
 finally{
  server.close();
  fs.writeFileSync(path.join(evidence,"results.json"),JSON.stringify({results,failures},null,2));
  console.log("FRAUEN_SCROLL_SAFE_SUMMARY "+JSON.stringify({passed:results.length,failed:failures.length,failures}));
  if(failures.length)process.exitCode=1;
 }
})();
