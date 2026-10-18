#!/usr/bin/env node
"use strict";
/* Read-only production DOM check with a local, route-intercepted adapter.
 * Never writes to the real site. Never uses browser storage or login.
 * The frozen original remains in production throughout the test. */
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const {chromium,webkit}=require("playwright");
const dir=path.resolve(__dirname,"..");
const safeJS=fs.readFileSync(path.join(dir,"assets/frauen/frauen-live-adapter-safe-v1.js"),"utf8");
const legacyJS=fs.readFileSync(path.join(dir,"assets/frauen/frauen-live-adapter.js"),"utf8");
const evidence=path.join(dir,"frauen-scroll-reset-evidence");
fs.mkdirSync(evidence,{recursive:true});
assert.ok(safeJS.includes("lastRouteKey=key")&&safeJS.includes("if(unchanged&&existing&&!lastWasLoading&&!force)return true"),"Safe render guard missing");
assert.ok(safeJS.includes("if(!unchanged)")&&safeJS.includes("scroller.scrollTop=oldScroll"),"Navigation/scroll preservation missing");
assert.ok(!legacyJS.includes("lastRouteKey=key"),"Protected live original unexpectedly modified");
const outcomes=[],errors=[];
const scenarios=[
  {id:"ios-webkit",engine:webkit,ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS",width:393,height:852,mobile:true},
  {id:"ios-chromium",engine:chromium,ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS",width:393,height:852,mobile:true},
  {id:"android-pwa-chromium",engine:chromium,ua:"Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",width:412,height:915,mobile:true,url:"https://dar-al-tawhid.de/pwa/?safeFrauenQA=20261018#frauen"}
];
function read(){
  const hero=document.querySelector("#appView .frauen-library-hero");
  const app=document.querySelector("#appView");
  const img=hero?getComputedStyle(hero).backgroundImage:"";
  const search=document.querySelector("#appView .frauen-library-search-wrap input");
  return {hash:location.hash,view:document.body.dataset.frauenView||"",
    y:window.scrollY,max:document.documentElement.scrollHeight-innerHeight,
    heroCount:document.querySelectorAll("#appView .frauen-library-hero").length,
    heroHeight:hero?.getBoundingClientRect().height||0,
    heroImage:img,heroDirectChild:!!hero?.parentElement?.classList.contains("frauen-library-shell"),
    search:!!search,searchValue:search?.value||"",appChildren:app?.children.length||0,
    stageCount:document.querySelectorAll(".dar-immersive-hero-stage").length};
}
(async()=>{
 for(const cfg of scenarios){
  let browser=null;
  try{
   browser=await cfg.engine.launch({headless:true,args:["--no-sandbox"]});
   const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:2,isMobile:cfg.mobile,hasTouch:cfg.mobile,userAgent:cfg.ua,locale:"de-DE"});
   const page=await context.newPage();
   const err=[],imgs=[];let injected=0;
   page.on("pageerror",e=>err.push(e.message));
   page.on("response",r=>{if(/03-erste-generationen\.jpg/.test(r.url()))imgs.push(r.status())});
   await page.route("**/assets/frauen/frauen-live-adapter.js*",async route=>{
     injected++;
     await route.fulfill({status:200,contentType:"application/javascript; charset=utf-8",body:safeJS,headers:{"cache-control":"no-store"}});
   });
   const url=cfg.url||"https://dar-al-tawhid.de/?safeFrauenQA=20261018#frauen";
   const rsp=await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
   await page.waitForTimeout(7500);
   const initial=await page.evaluate(read);
   assert.equal(rsp.status(),200,"Bad app HTTP status");
   assert.ok(injected>0,cfg.id+" safe adapter was not injected");
   assert.equal(initial.heroCount,1,cfg.id+" visible Frauen hero not mounted");
   assert.ok(initial.heroHeight>240,cfg.id+" Hero missing height");
   assert.match(initial.heroImage,/03-erste-generationen\.jpg/,cfg.id+" image missing");
   assert.ok(initial.heroDirectChild,cfg.id+" frozen Frauen DOM hierarchy changed");
   assert.equal(initial.stageCount,0,cfg.id+" forbidden V1 DOM mutation");
   assert.ok(imgs.includes(200),cfg.id+" photo did not load HTTP 200");
   await page.screenshot({path:path.join(evidence,cfg.id+"-before.png")});
   // Check the failing production pattern: scroll, then an incidental global
   // render event. It must preserve both content nodes and the scroll offset.
   const r=await page.evaluate(async()=>{
     const hero=document.querySelector("#appView .frauen-library-hero");
     const input=document.querySelector("#appView .frauen-library-search-wrap input");
     window.scrollTo(0,Math.min(420,document.documentElement.scrollHeight-innerHeight-50));
     await new Promise(x=>setTimeout(x,180));
     const beforeY=window.scrollY;
     document.dispatchEvent(new Event("dar:render"));
     const immediate=window.scrollY;
     await new Promise(x=>requestAnimationFrame(()=>setTimeout(x,120)));
     return {beforeY,immediate,afterY:window.scrollY,
       sameHero:hero===document.querySelector("#appView .frauen-library-hero"),
       sameSearch:input===document.querySelector("#appView .frauen-library-search-wrap input")};
   });
   assert.ok(r.beforeY>100,cfg.id+" cannot scroll before re-render event");
   assert.ok(Math.abs(r.afterY-r.beforeY)<=3,cfg.id+" scroll reset after global render: "+JSON.stringify(r));
   assert.ok(r.sameHero&&r.sameSearch,cfg.id+" Hero/Search rebuilt on same-route render");
   await page.screenshot({path:path.join(evidence,cfg.id+"-scroll.png")});
   const search=page.locator("#appView .frauen-library-search-wrap input").first();
   await search.fill("Fiqh",{timeout:7000});await page.waitForTimeout(240);
   assert.equal(await search.inputValue(),"Fiqh",cfg.id+" search lost entered text");
   // Real route navigation MUST reset scroll and show the original chapter photo.
   await page.evaluate(()=>{window.DAROpenFrauen("group/din");});
   await page.waitForTimeout(1250);
   const afterRoute=await page.evaluate(read);
   assert.equal(afterRoute.hash,"#frauen/group/din",cfg.id+" route failed");
   assert.ok(afterRoute.y<7,cfg.id+" real navigation did not reset to top");
   assert.ok(afterRoute.heroHeight>180,cfg.id+" group hero vanished");
   assert.equal(afterRoute.heroDirectChild,true,cfg.id+" group Hero hierarchy invalid");
   await page.screenshot({path:path.join(evidence,cfg.id+"-group.png")});
   await page.evaluate(()=>window.DAROpenFrauen(""));
   await page.waitForTimeout(950);
   const restored=await page.evaluate(read);
   assert.equal(restored.hash,"#frauen",cfg.id+" back navigation failed");
   assert.ok(restored.heroHeight>240,cfg.id+" hub hero vanished after returning");
   const row={id:cfg.id,passed:true,injected,initial:{heroHeight:initial.heroHeight,image:initial.heroImage,photoResponses:imgs},render:r,route:{hash:afterRoute.hash,y:afterRoute.y,height:afterRoute.heroHeight},errors:err.slice(0,10)};
   console.log("FRAUEN_SAFE_ADAPTER_PASS "+JSON.stringify(row).slice(0,8000));
   outcomes.push(row);
   await context.close();
  }catch(err){errors.push(cfg.id+": "+String(err.stack||err).slice(0,1300));console.error("FRAUEN_SAFE_ADAPTER_FAIL "+cfg.id+" "+String(err.stack||err).slice(0,1500));}
  finally{if(browser)await browser.close();}
 }
 fs.writeFileSync(path.join(evidence,"results.json"),JSON.stringify({outcomes,errors},null,2));
 console.log("FRAUEN_SAFE_ADAPTER_SUMMARY "+JSON.stringify({passed:outcomes.length,total:scenarios.length,errors}));
 if(errors.length||outcomes.length!==scenarios.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
