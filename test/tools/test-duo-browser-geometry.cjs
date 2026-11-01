#!/usr/bin/env node
"use strict";
/* Diagnose the actual deployed DĀR Test viewport geometry, not a mockup. */
const {chromium}=require("playwright");
const url="https://dar-al-tawhid.de/test/?env=staging&source=duo-geometry#quran";
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const [width,height] of [[726,512],[820,1180],[1024,768],[390,844]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   page.on("console",msg=>{if(msg.type()==="error") console.log("PAGE ERROR",msg.text().slice(0,250))});
   const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
   await page.waitForTimeout(2400);
   const report=await page.evaluate(()=>{
    const p=(q)=>{
      const e=document.querySelector(q);if(!e)return null;
      const r=e.getBoundingClientRect(),s=getComputedStyle(e);
      return {tag:e.tagName,rect:[r.left,r.top,r.width,r.height].map(n=>Math.round(n)),visibility:s.visibility,display:s.display,position:s.position,width:s.width,maxWidth:s.maxWidth,marginLeft:s.marginLeft,marginRight:s.marginRight,transform:s.transform,overflow:s.overflow,dir:s.direction,css:s.cssText?.slice(0,50)};
    };
    return {active:document.documentElement.classList.contains("dar-test-duo-active"),
      audit:window.DARTestDuoAdaptive?.audit?.(),route:location.hash,
      root:{className:document.documentElement.className,layout:document.documentElement.getAttribute("data-layout"),fold:document.documentElement.getAttribute("data-fold-dual"),surface:document.documentElement.getAttribute("data-layout-surface"),width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},
      body:{className:document.body.className,scrollWidth:document.body.scrollWidth},
      elems:{nav:p("#darTestDuoWorkspaceNav"),appView:p("#appView"),bodyApp:p("body>.app"),app:p(".app"),appRoot:p("#appRoot"),appShell:p("#appShell"),pane:p(".dar-fold__pane"),left:p(".dar-fold__rail"),navBottom:p("#bottomNav"),firstContent:p("#appView > :first-child")},
      links:[...document.querySelectorAll('link[href*="dar-duo-responsive"]')].map(e=>e.href)
    };
   });
   console.log("DĀR_TEST_DUO_DIAG",width,height,response.status(),JSON.stringify(report));
   await page.close();
  }
 } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
