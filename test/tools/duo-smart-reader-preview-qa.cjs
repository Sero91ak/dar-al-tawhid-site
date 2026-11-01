#!/usr/bin/env node
"use strict";
/* DĀR TEST smart master/detail preview on deployed shell with LOCAL PR assets.
 * Respects the existing test owner gate and never targets live visitor/KIDS.
 */
const fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"../..");
const js=fs.readFileSync(path.join(root,"test/assets/dar-duo-responsive-v1.js"),"utf8");
const css=fs.readFileSync(path.join(root,"test/assets/dar-duo-responsive-v1.css"),"utf8");
const html=fs.readFileSync(path.join(root,"test/index.html"),"utf8");
const phrase=html.match(/if\(value===["']([^"']+)["']\)\{unlock\(\);return;\}/);
if(!phrase)throw Error("Cannot verify existing Test owner-gate login");
const url="https://dar-al-tawhid.de/test/?env=staging&source=smart-duo-preview#quran";
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 const page=await browser.newPage({viewport:{width:726,height:512},deviceScaleFactor:2,
  isMobile:true,hasTouch:true,locale:"de-DE",
  userAgent:"Mozilla/5.0 (Linux; Android 16; SM-F956B) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36"});
 page.on("pageerror",e=>console.log("READER_PAGEERROR",String(e.message).slice(0,130)));
 await page.route(/\/test\/assets\/dar-duo-responsive-v1\.(?:css|js)(?:\?|$)/,
  async route=>{
    let cssReq=route.request().url().includes(".css");
    await route.fulfill({status:200,body:cssReq?css:js,contentType:cssReq?"text/css":"application/javascript"});
  });
 const load=await page.goto(url,{waitUntil:"domcontentloaded",timeout:55000});
 if(!load||load.status()!==200)throw Error("DĀR Test entry not HTTP 200");
 async function unlock(scope){
   let lock=scope.locator("#darTestLock");
   if(await lock.count() && await lock.isVisible()){
     await scope.locator("#darTestLockInput").fill(phrase[1]);
     await scope.locator("#darTestLockBtn").click({timeout:8000});
   }
 }
 await page.waitForTimeout(1400);
 await unlock(page);
 await page.waitForTimeout(1400);
 async function inspect(label,dual){
   await page.waitForTimeout(900);
   const d=await page.evaluate(()=>{
      const box=(sel)=>{
        let e=document.querySelector(sel);if(!e)return null;
        let r=e.getBoundingClientRect(),s=getComputedStyle(e);
        return {x:r.x,y:r.y,w:r.width,h:r.height,display:s.display,overflowY:s.overflowY,
          hidden:s.visibility==="hidden",scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};
      };
      return {viewport:document.documentElement.clientWidth,innerHeight:innerHeight,
       active:document.documentElement.classList.contains("dar-test-duo-active"),
       left:box("#darTestDuoWorkspaceNav"),reader:box("#darTestDuoReaderFrame"),
       app:box("#appView"),bottom:box("#bottomNav"),
       rootScrollWidth:document.documentElement.scrollWidth,
       capacity:window.DARTestDuoAdaptive?.capacity?.(document.documentElement.clientWidth,innerHeight)};
   });
   console.log("SMART_DUO_PARENT "+label+" "+JSON.stringify(d));
   if(d.active!==dual)throw Error(label+" wrong adaptive mode");
   if(d.rootScrollWidth>d.viewport+2)throw Error(label+" horizontal overflow");
   if(!dual) {
     if(d.reader&&d.reader.display!=="none")throw Error("Narrow view kept iframe");
     if(!d.app || d.app.w<d.viewport-3)throw Error("Narrow view did not restore original app");
     return null;
   }
   if(!d.reader||!d.left)throw Error(label+" reader/chooser missing");
   if(Math.abs(d.left.w-d.capacity.rail)>2||
      Math.abs(d.reader.x-d.capacity.rail)>2||
      Math.abs(d.reader.w-d.capacity.reader)>2||
      d.reader.w<=d.left.w)throw Error(label+" not compact 30/70 split");
   const child=page.frameLocator("#darTestDuoReaderFrame");
   await child.locator("#appView").waitFor({state:"attached",timeout:20000});
   await unlock(child);
   await page.waitForTimeout(850);
   const details=await page.locator("#darTestDuoReaderFrame").evaluate(e=>{
     const w=e.contentWindow,doc=w.document;
     let main=doc.querySelector("#appView"),r=main?.getBoundingClientRect();
     const inner=doc.documentElement.clientWidth;
     const hero=doc.querySelector(".view-head,.post-reader-title,.qov-page,.hadith-hub,.lib-page,.dua-hub");
     const hr=hero?.getBoundingClientRect();
     return {inner,windowWidth:w.innerWidth,
       app:r?{x:r.x,width:r.width}:null,
       hero:hr?{x:hr.x,width:hr.width,right:hr.right}:null,
       mainLen:main?.textContent?.trim().length||0,
       hash:w.location.hash,documentScroll:doc.documentElement.scrollWidth,
       embedded:doc.documentElement.classList.contains("dar-duo-reader-embedded"),
       chrome:w.getComputedStyle(doc.querySelector("#bottomNav")||doc.body).display};
   });
   console.log("SMART_DUO_READER "+label+" "+JSON.stringify(details));
   if(!details.embedded)throw Error(label+" nested reader was not initialized");
   if(details.inner>d.reader.w+3||details.documentScroll>details.inner+3)
      throw Error(label+" child document overflow");
   if(details.mainLen<15)throw Error(label+" reader content missing");
   if(details.hero&&details.hero.right>details.inner+4)
      throw Error(label+" right content clipped");
   return child;
 }
 let child=await inspect("fold-open",true);
 for(const [key,hash] of [["hadith","#hadith"],["library","#bibliothek"],["topics","#themen"],["dua","#duas"],["more","#more"],["quran","#quran"]]){
   await page.locator('#darTestDuoWorkspaceNav [data-duo-route="'+key+'"]').tap({timeout:10000});
   await page.waitForTimeout(800);
   const actual=await page.locator("#darTestDuoReaderFrame").evaluate(el=>el.contentWindow.location.hash);
   console.log("SMART_DUO_ROUTE",key,actual);
   const aliases=key==="topics"?["#themen","#topics"]:key==="dua"?["#duas","#dua"]: [hash];
   if(!aliases.some(h=>actual.startsWith(h)))
      throw Error("Pane route did not sync: "+key+" "+actual);
   await inspect(key,true);
   const chooser=await page.evaluate(()=>{
     const root=document.getElementById("appView");
     return {count:document.querySelectorAll("#darTestDuoContext [data-duo-context-index]").length,
       options:[...document.querySelectorAll("#darTestDuoContext [data-duo-context-index]")]
         .slice(0,8).map(e=>e.textContent.slice(0,70)),
       controls:[...(root?.querySelectorAll("button,a,[role='button']")||[])]
         .filter(e=>String(e.textContent||"").trim().length>3).slice(0,24)
         .map(e=>({text:String(e.textContent||"").trim().slice(0,58),
           nav:e.getAttribute("data-nav"),value:e.getAttribute("data-value"),
           action:e.getAttribute("data-action"),id:e.id,cls:String(e.className).slice(0,70)}))};
   });
   console.log("SMART_DUO_CHOOSER "+key+" "+JSON.stringify(chooser));
   if(key==="more"){
     if(chooser.count<10)throw Error("More menu has no real left-side subnavigation");
     const propheten=page.locator("#darTestDuoContext [data-duo-context-index]")
       .filter({hasText:"Die Propheten"}).first();
     if(!(await propheten.count()))throw Error("More's Propheten item missing from master");
     await propheten.tap({timeout:8000});
     await page.waitForTimeout(1200);
     const opened=await page.locator("#darTestDuoReaderFrame")
       .evaluate(el=>el.contentWindow.location.hash);
     console.log("SMART_DUO_MORE_DETAIL",opened);
     if(!opened.startsWith("#propheten")&&!opened.startsWith("#prophets"))
       throw Error("More selection did not open its real reader route");
     if((await page.locator("#darTestDuoContext [data-duo-context-index]").count())<10)
       throw Error("More master choices disappeared after opening right detail");
     await page.locator('#darTestDuoWorkspaceNav [data-duo-route="more"]').tap({timeout:8000});
     await page.waitForTimeout(650);
   }
 }
 const n=await page.locator("#darTestDuoContext [data-duo-context-index]").count();
 console.log("SMART_DUO_CONTEXT_COUNT",n);
 if(n<8)throw Error("Real Quran entries not shown in master");
 await page.locator("#darTestDuoContext [data-duo-context-index]").first().tap({timeout:8000});
 await page.waitForTimeout(1900);
 const first=await page.locator("#darTestDuoReaderFrame").evaluate(el=>{
   const d=el.contentDocument;return {hash:el.contentWindow.location.hash,
      textLength:d.querySelector("#appView")?.innerText?.trim().length||0,
      width:d.documentElement.clientWidth};});
 console.log("SMART_DUO_SURAH",JSON.stringify(first));
 if(!first.hash.startsWith("#quran-surah/1")||first.textLength<80)
   throw Error("Real surah does not read in independent detail viewport");
 const leftTop=await page.locator("#darTestDuoWorkspaceNav").evaluate(e=>{
   e.scrollTop=60;return e.scrollTop});
 await page.locator("#darTestDuoReaderFrame").evaluate(e=>{
   const d=e.contentDocument;const win=e.contentWindow;
   const main=d.getElementById("appView");
   if(main&&main.scrollHeight>main.clientHeight+30)main.scrollTop=120;
   else win.scrollTo(0,120);
 });
 await page.waitForTimeout(180);
 const finalLeft=await page.locator("#darTestDuoWorkspaceNav").evaluate(e=>e.scrollTop);
 if(Math.abs(finalLeft-leftTop)>2)throw Error("Reader scroll moved left chooser");
 for(const [w,h,label] of [[820,1180,"tablet-portrait"],[1024,768,"tablet-landscape"]]){
   await page.setViewportSize({width:w,height:h});
   await inspect(label,true);
 }
 await page.setViewportSize({width:390,height:844});
 await inspect("fold-cover",false);
 await page.setViewportSize({width:726,height:512});
 await inspect("fold-reopen",true);
 console.log("SMART_DUO_PASS — standalone responsive pane, linked routes, real surah, scroll, cover/reopen");
}finally{await browser.close();}
})().catch(e=>{console.error("SMART_DUO_FAIL",String(e.stack||e));process.exitCode=1;});
