#!/usr/bin/env node
"use strict";
/* FRAUEN_HERO_LIVE_BROWSER_QA_V2 · read-only, screenshot-based regression probe.
 * No application scripts/styles injected. Inspect the real deployed Test,
 * visitor/native-web, Android PWA and desktop surfaces after a rollback.
 * Never send pushes, submit forms or mutate user data.
 */
const { chromium }=require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const out=path.join(process.cwd(),"frauen-hero-live-evidence");
fs.mkdirSync(out,{recursive:true});
const base="https://dar-al-tawhid.de";
const routes=[
 {id:"dar-test-iphone",url:base+"/test/?heroVisualAudit=20261018#frauen",width:393,height:852,mobile:true,
  ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1"},
 {id:"visitor-ios-webview",url:base+"/?heroVisualAudit=20261018#frauen",width:393,height:852,mobile:true,
  ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS"},
 {id:"visitor-android-pwa",url:base+"/pwa/?heroVisualAudit=20261018#frauen",width:412,height:915,mobile:true,
  ua:"Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"},
 {id:"desktop-public",url:base+"/?heroVisualAudit=20261018#frauen",width:1440,height:900,mobile:false,
  ua:"Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15"}
];
function measure(){
  const pick=function(el){
    if(!el)return null;
    const c=getComputedStyle(el),b=el.getBoundingClientRect();
    return {exists:true,tag:el.tagName,cls:String(el.className).slice(0,160),
      top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),
      width:Math.round(b.width),height:Math.round(b.height),position:c.position,
      display:c.display,visibility:c.visibility,opacity:c.opacity,
      overflow:c.overflow,backgroundImage:c.backgroundImage.slice(0,520),
      backgroundSize:c.backgroundSize,zIndex:c.zIndex};
  };
  const h=document.querySelector("#appView .frauen-library-hero");
  const section=document.querySelector("#appView .frauen-library-shell,#appView .frauen-library-list");
  const input=document.querySelector("#appView .frauen-library-search-wrap input,#appView .frauen-library-list-controls input");
  const styleSource=h?getComputedStyle(h).getPropertyValue("--frauen-hero-img").trim():"";
  const ancestor=[];if(h)for(let e=h,n=0;e&&n<9;e=e.parentElement,n++){const c=getComputedStyle(e);ancestor.push({name:String(e.className).slice(0,120),overflowX:c.overflowX,overflowY:c.overflowY,position:c.position,transform:c.transform.slice(0,90)});}
  const scrollNodes=[
    {name:"html",el:document.documentElement},{name:"body",el:document.body},
    {name:"document",el:document.scrollingElement},
    {name:"appView",el:document.getElementById("appView")},
    {name:"frauen-production-root",el:document.querySelector(".dar-frauen-production-root")}
  ].filter(x=>x.el).map(x=>({name:x.name,top:Math.round(x.el.scrollTop||0),
    max:Math.max(0,(x.el.scrollHeight||0)-(x.el.clientHeight||0)),
    overflowY:getComputedStyle(x.el).overflowY,
    height:x.el.clientHeight}));
  const gateVisible=Array.from(document.querySelectorAll("input[type=password]")).some(x=>{
    const r=x.getBoundingClientRect();return r.width>120&&r.height>24&&r.top>=0&&r.top<innerHeight&&getComputedStyle(x).visibility!=="hidden";
  });
  return {url:location.href,hash:location.hash,theme:document.documentElement.dataset.theme||"",
    scrollNodes,gateVisible,
    bodyClass:document.body.className.slice(0,350),
    frauenView:document.body.dataset.frauenView||"",
    documentScroll:Math.round(document.scrollingElement?.scrollTop||0),
    documentScrollMax:Math.max(0,(document.scrollingElement?.scrollHeight||0)-(document.scrollingElement?.clientHeight||0)),
    windowY:Math.round(scrollY), viewport:{width:innerWidth,height:innerHeight},
    hero:pick(h),heroImageVar:styleSource,heroParent:h?.parentElement?.className||null,
    originalDirectChild:!!(h&&h.parentElement===section),section:pick(section),
    input:pick(input),search:pick(document.querySelector("#appView .frauen-library-search-wrap,#appView .frauen-library-list-controls")),
    stageCount:document.querySelectorAll(".dar-immersive-hero-stage").length,
    heroCount:document.querySelectorAll("#appView .frauen-library-hero").length,
    firstCardCount:document.querySelectorAll("#appView .frauen-library-card[data-nav],#appView .frauen-library-area-card[data-nav]").length,
    ancestors:ancestor};
}
(async()=>{
 let browser;const results=[],issues=[];
 try{
   browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
   for(const cfg of routes){
     const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},
       deviceScaleFactor:cfg.mobile?2:1,isMobile:cfg.mobile,hasTouch:cfg.mobile,
       userAgent:cfg.ua,locale:"de-DE",javaScriptEnabled:true,ignoreHTTPSErrors:false});
     const page=await context.newPage();const errors=[],imageResponses=[];
     page.on("pageerror",e=>errors.push(String(e.message).slice(0,300)));
     page.on("response",r=>{if(/\/assets\/frauen\//.test(r.url()))imageResponses.push({status:r.status(),url:r.url().slice(0,170)});});
     let status=null,loadError=null,before=null,after=null,typing=null,subpage=null;
     try{
       const res=await page.goto(cfg.url,{waitUntil:"domcontentloaded",timeout:55000});status=res?.status()||0;
       await page.waitForTimeout(7000);
       before=await page.evaluate(measure);
       await page.screenshot({path:path.join(out,cfg.id+"-before.png"),fullPage:false});
       await page.mouse.wheel(0,620);await page.waitForTimeout(850);
       after=await page.evaluate(measure);
       await page.screenshot({path:path.join(out,cfg.id+"-scroll.png"),fullPage:false});
       if(before?.input&&!before.gateVisible){
         await page.evaluate(()=>window.scrollTo(0,0));
         const inp=page.locator("#appView .frauen-library-search-wrap input,#appView .frauen-library-list-controls input").first();
         try{
           await inp.click({timeout:5000});
           typing={focus:await inp.evaluate(el=>document.activeElement===el),valueBefore:await inp.inputValue()};
           await inp.fill("frau",{timeout:5000});
           await page.waitForTimeout(600);
           typing.valueAfter=await page.locator("#appView .frauen-library-search-wrap input,#appView .frauen-library-list-controls input").first().inputValue({timeout:1500});
           await page.screenshot({path:path.join(out,cfg.id+"-search.png"),fullPage:false});
         }catch(e){typing={error:String(e.message).slice(0,240)};}
       }
       if(before?.firstCardCount&&!before.gateVisible){
         await page.evaluate(()=>window.scrollTo(0,0));
         const card=page.locator("#appView .frauen-library-card[data-nav],#appView .frauen-library-area-card[data-nav]").first();
         try{
           await card.click({timeout:5000});await page.waitForTimeout(1500);
           subpage=await page.evaluate(measure);
           await page.screenshot({path:path.join(out,cfg.id+"-navigation.png"),fullPage:false});
         }catch(e){subpage={error:String(e.message).slice(0,250)};}
       }
     }catch(e){loadError=String(e.stack||e).slice(0,750);}
     const result={id:cfg.id,status,loadError,before,after,typing,
       subpage:subpage?{hash:subpage.hash,hero:subpage.hero?.height||0,bodyClass:subpage.bodyClass,error:subpage.error||null}:null,
       imageResponses,errors:errors.slice(0,12)};
     results.push(result);
     console.log("HERO_BROWSER_AUDIT "+JSON.stringify(result).slice(0,12500));
     if(loadError||status!==200)issues.push(cfg.id+": response/timeout "+(status||loadError));
     else if(before?.gateVisible)console.log("HERO_GATE_PRESENT "+cfg.id+": password gate covers app; interaction check skipped");
     else if(cfg.id==="desktop-public"&&!before?.hero)console.log("HERO_DESKTOP_SEPARATE_ROUTE: public desktop rendered its own start page, not adult Frauen SPA");
     else if(!before?.hero||before.hero.height<160)issues.push(cfg.id+": missing visible Frauen Hero");
     else {
       if(!/url\(/.test(before.hero.backgroundImage))issues.push(cfg.id+": Hero has no photo background-image");
       if(!before.originalDirectChild)issues.push(cfg.id+": Hero moved from original direct-child hierarchy");
       if(before.stageCount!==0)issues.push(cfg.id+": obsolete immersive Hero adapter still modifies DOM");
       const scrollable=(after?.scrollNodes||[]).some(n=>n.top>60);
       const scrollRange=(before?.scrollNodes||[]).some(n=>n.max>200);
       if(scrollRange&&!scrollable)issues.push(cfg.id+": no actual scroll container moved after wheel");
       if(typing&&typing.error)issues.push(cfg.id+": search focus failure: "+typing.error);
     }
     await context.close();
   }
 }catch(err){issues.push("audit runner: "+String(err.stack||err).slice(0,600));}
 finally{
   if(browser)await browser.close();
   fs.writeFileSync(path.join(out,"audit.json"),JSON.stringify({results,issues},null,2));
   console.log("HERO_BROWSER_AUDIT_ISSUES "+JSON.stringify(issues));
   if(issues.length)process.exitCode=1;
 }
})();
