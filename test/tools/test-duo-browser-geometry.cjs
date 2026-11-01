#!/usr/bin/env node
"use strict";
/* Diagnose the actual deployed DĀR Test viewport geometry, not a mockup. */
const {chromium}=require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const localJS=fs.readFileSync(path.join(root,"test/assets/dar-duo-responsive-v1.js"),"utf8");
const localCSS=fs.readFileSync(path.join(root,"test/assets/dar-duo-responsive-v1.css"),"utf8");
const url="https://dar-al-tawhid.de/test/?env=staging&source=duo-geometry#quran";
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const [width,height] of [[726,512],[820,1180],[1024,768],[390,844]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   page.on("console",msg=>{if(msg.type()==="error") console.log("PAGE ERROR",msg.text().slice(0,250))});
   // Test the CURRENT PR assets against the deployed app shell without
   // publishing speculative fixes to production.
   await page.route(/\/test\/assets\/dar-duo-responsive-v1\.(js|css)(?:\?|$)/,async route=>{
     const css=route.request().url().includes(".css");
     await route.fulfill({status:200,contentType:css?"text/css":"application/javascript",body:css?localCSS:localJS});
   });
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
   const expected=width!==390;
   if(report.active!==expected)throw Error("Wrong active mode at "+width+"x"+height+": "+JSON.stringify(report.audit));
   if(expected){
     const nav=report.elems.nav?.rect,view=report.elems.appView?.rect;
     if(!nav||!view)throw Error("Missing reader/rail");
     if(view[0]<nav[0]+nav[2]+7)throw Error("Reader overlaps selection: "+JSON.stringify({nav,view}));
     if(view[0]+view[2]>width-6)throw Error("Reader extends past viewport: "+JSON.stringify(view));
     const dock=report.elems.navBottom?.rect;
     if(!dock || dock[0]<view[0]-1 || dock[0]+dock[2]>Math.min(width,view[0]+view[2])+1){
       throw Error("Five-tab dock clipped or outside reader: "+JSON.stringify({dock,view}));
     }
     if(report.audit.viewport.height!==height)throw Error("Scroll height misidentified as viewport height");
     await page.evaluate(()=>{
       const overlay=document.createElement("div");
       overlay.id="darTestReadingOverlay";
       overlay.innerHTML='<div class="dar-test-reader-dialog">Test reader</div>';
       document.body.appendChild(overlay);
       document.body.classList.add("dar-test-reading-open");
     });
     await page.waitForTimeout(190);
     const modal=await page.evaluate(()=>{
       const o=document.querySelector("#darTestReadingOverlay"),r=o.getBoundingClientRect();
       const n=document.querySelector("#darTestDuoWorkspaceNav").getBoundingClientRect();
       return {left:r.left,right:r.right,railRight:n.right,active:document.documentElement.classList.contains("dar-test-duo-active")};
     });
     console.log("DĀR_TEST_DUO_MODAL",width,height,JSON.stringify(modal));
     if(!modal.active || modal.left<modal.railRight-1)throw Error("Reader dialog covers left selection");
   }
   await page.close();
  }
 } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
