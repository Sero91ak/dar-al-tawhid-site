#!/usr/bin/env node
"use strict";
/* Tests the real Frauen DOM with optional local CSS/JS in an isolated
 * Playwright context. No deployed files/HTML are modified. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium,webkit}=require("playwright");
const root=path.resolve(__dirname,"..");
const original=fs.readFileSync(path.join(root,"assets/frauen/frauen-live-adapter-safe-v1.js"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/frauen/frauen-sticky-safe-v2.css"),"utf8");
const script=fs.readFileSync(path.join(root,"assets/frauen/frauen-sticky-safe-v2.js"),"utf8");
const output=path.join(root,"frauen-sticky-v2-evidence");fs.mkdirSync(output,{recursive:true});
assert.ok(!/appendChild\(hero\)|insertBefore\(stage|touchmove|preventDefault\(/.test(script));
const scenarios=[
 {name:"ios-webkit-phone",engine:webkit,ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS",width:393,height:852,native:true},
 {name:"ios-webkit-ipad",engine:webkit,ua:"Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS",width:820,height:1180,native:true},
 {name:"android-pwa",engine:chromium,ua:"Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",width:412,height:915,native:false},
 {name:"ios-chromium",engine:chromium,ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS",width:393,height:852,native:true}
];
function measured(){
 const app=document.getElementById("appView"),hero=app?.querySelector(".frauen-library-hero"),shell=app?.querySelector(".frauen-library-shell,.frauen-library-list");
 const search=app?.querySelector(".frauen-library-search-wrap,.frauen-library-list-controls");
 const sty=e=>{if(!e)return null;const c=getComputedStyle(e),r=e.getBoundingClientRect();return {
  top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),width:Math.round(r.width),
  position:c.position,backgroundImage:c.backgroundImage.slice(0,280),z:c.zIndex};};
 return {scroll:window.scrollY,documentMax:document.documentElement.scrollHeight-innerHeight,hero:sty(hero),
  search:sty(search),containerOverflow:app?getComputedStyle(app).overflowY:null,
  bodyOverflow:getComputedStyle(document.body).overflowY,bodyClass:document.body.className,
  heroParent:hero?.parentElement?.className,searchParent:search?.parentElement?.className,
  shellKids:shell?[...shell.children].slice(0,6).map(x=>String(x.className).slice(0,120)):[],
  stickyJS:!!window.DARFrauenStickySafeV2,
  shellOptIn:shell?.getAttribute("data-dar-frauen-sticky-safe")||"",hvar:shell?.style.getPropertyValue("--dar-frauen-sticky-hero-height")||"",
  stageCount:document.querySelectorAll(".dar-immersive-hero-stage").length,
  photoCount:document.querySelectorAll("#appView .frauen-library-hero").length,
  widthOverflow:document.documentElement.scrollWidth-window.innerWidth,hash:location.hash};
}
(async()=>{
 const errs=[],results=[];
 for(const cfg of scenarios){
  let b;
  try{
   b=await cfg.engine.launch({headless:true,args:cfg.engine===chromium?["--no-sandbox"]:[]});
   const ctx=await b.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:cfg.ua,locale:"de-DE"});
   const page=await ctx.newPage();let replaced=0;
   if(cfg.native)await page.route("**/assets/frauen/frauen-live-adapter.js*",async route=>{
    replaced++;await route.fulfill({status:200,contentType:"application/javascript",body:original});
   });
   const uri=cfg.native?"https://dar-al-tawhid.de/?stickyPreviewOnly=20261018#frauen":"https://dar-al-tawhid.de/pwa/?stickyPreviewOnly=20261018#frauen";
   await page.goto(uri,{waitUntil:"domcontentloaded",timeout:55000});
   await page.waitForTimeout(7200);
   if(cfg.native)assert.ok(replaced>0,cfg.name+": safety adapter not intercepted");
   const start=await page.evaluate(measured);
   assert.ok(start.photoCount===1&&start.hero.height>240,cfg.name+": initial original hero missing");
   assert.match(start.hero.backgroundImage,/03-erste-generationen\.jpg/);
   const originalHero=await page.locator("#appView .frauen-library-hero").evaluate(e=>e.outerHTML.slice(0,250));
   await page.screenshot({path:path.join(output,cfg.name+"-before.png")});
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:script});
   await page.waitForFunction(()=>!!document.querySelector("#appView [data-dar-frauen-sticky-safe='1']"),null,{timeout:4500});
   await page.waitForTimeout(170);
   const ready=await page.evaluate(measured);
   assert.equal(ready.shellOptIn,"1",cfg.name+": no opt-in measured "+JSON.stringify(ready).slice(0,1400));
   assert.equal(ready.hero.position,"sticky",cfg.name+": background not sticky");
   assert.equal(ready.search.position,"sticky",cfg.name+": search not sticky");
   assert.ok(ready.widthOverflow<=2,cfg.name+": horizontal overflow");
   const transition=await page.evaluate(async()=>{
     const beforeHero=document.querySelector("#appView .frauen-library-hero");
     const beforeSearch=document.querySelector("#appView .frauen-library-search-wrap,#appView .frauen-library-list-controls");
     window.scrollTo(0,420);
     await new Promise(r=>setTimeout(r,210));
     const h=beforeHero.getBoundingClientRect(),s=beforeSearch.getBoundingClientRect();
     return {y:window.scrollY,heroTop:h.top,heroHeight:h.height,
       searchTop:s.top,searchDelta:s.top-h.height,
       heroSame:beforeHero===document.querySelector("#appView .frauen-library-hero"),
       searchSame:beforeSearch===document.querySelector("#appView .frauen-library-search-wrap,#appView .frauen-library-list-controls")};
   });
   assert.ok(transition.y>120,cfg.name+": scroll not working");
   assert.ok(Math.abs(transition.heroTop)<=8,cfg.name+": hero scrolls away "+JSON.stringify({transition,ready}).slice(0,1900));
   assert.ok(Math.abs(transition.searchDelta+31)<=18,cfg.name+": search detached from hero "+JSON.stringify(transition));
   assert.ok(transition.heroSame&&transition.searchSame,cfg.name+": DOM children replaced during sticky scroll");
   await page.screenshot({path:path.join(output,cfg.name+"-scroll.png")});
   await page.evaluate(()=>window.scrollTo(0,0));
   const search=page.locator("#appView .frauen-library-search-wrap input,#appView .frauen-library-list-controls input").first();
   await search.fill("Fiqh",{timeout:7000});
   assert.equal((await search.inputValue()).toLocaleLowerCase("de"),"fiqh");
   await page.evaluate(()=>{window.scrollTo(0,0);});
   if(cfg.native){
     await page.evaluate(()=>window.DAROpenFrauen("group/din"));
     await page.waitForTimeout(900);
     const group=await page.evaluate(measured);
     assert.equal(group.hash,"#frauen/group/din",cfg.name+": group navigation failed");
     assert.ok(group.hero.height>160,cfg.name+": group hero disappeared");
     assert.equal(group.hero.position,"sticky",cfg.name+": group lost sticky");
     await page.evaluate(()=>window.scrollTo(0,360));
     await page.waitForTimeout(210);
     const scrolledGroup=await page.evaluate(measured);
     assert.ok(Math.abs(scrolledGroup.hero.top)<=8,cfg.name+": group sticky failed");
     assert.ok(Math.abs(scrolledGroup.search.top-scrolledGroup.hero.height+31)<=18,cfg.name+": group search lost position");
     await page.screenshot({path:path.join(output,cfg.name+"-group-scroll.png")});
   }
   const result={name:cfg.name,passed:true,origin:start,ready,transition,originalHeroStarts:originalHero.slice(0,70)};
   results.push(result);console.log("FRAUEN_STICKY_V2_PASS "+JSON.stringify(result).slice(0,3300));
   await ctx.close();
  }catch(e){errs.push(cfg.name+": "+String(e.stack||e).slice(0,1100));console.error("FRAUEN_STICKY_V2_FAIL "+cfg.name+" "+String(e.stack||e).slice(0,1100));}
  finally{if(b)await b.close()}
 }
 fs.writeFileSync(path.join(output,"results.json"),JSON.stringify({results,errs},null,2));
 console.log("FRAUEN_STICKY_V2_SUMMARY "+JSON.stringify({passed:results.length,total:scenarios.length,errs}));
 if(errs.length||results.length!==scenarios.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
