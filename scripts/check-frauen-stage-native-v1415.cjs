#!/usr/bin/env node
"use strict";
/* V1415 isolated DOM acceptance: uses the actual checked-in adapter, header
 * runtime and Frauen CSS, not the deployed old production JavaScript.
 * Chromium is NOT a substitute for physical WKWebView / Android acceptance. */
const {chromium}=require("playwright");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const adapter=read("assets/frauen/frauen-live-adapter.js");
const runtime=read("assets/frauen/frauen-hero-seam-runtime-v1407.js");
const flow=read("assets/frauen/frauen-original-v1224-header-seam-v1405.css");
const oldHeroCss=read("assets/adult-immersive-hero-v1.css");
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const [label,width,height] of [
   ["iphone",390,844],["duo",594,820],["fold",768,1024],["ipad",1024,1366]
  ]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});
   const page=await ctx.newPage();
   await page.setContent('<!doctype html><html data-theme="salbei" class="dar-adult-global-brand-ready"><head>'+
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
    '<style>html,body{margin:0;background:#edf0e8}#darAdultBrandHeaderV2{position:fixed;'+
    'left:0;right:0;top:0;height:90px;z-index:700;background:#e5ebe4;box-sizing:border-box}'+
    '#darAdultBrandHeaderSpacerV2{height:90px}#appView{min-height:1800px;width:100%}'+
    '.frauen-library-shell{width:100%;min-height:1700px}'+
    '.frauen-library-hero{height:228px;min-height:228px;box-sizing:border-box;background:#425a48;'+
    'background-image:linear-gradient(90deg,#283e30,#506c58);color:white;padding:36px 20px}'+
    '.frauen-library-search-wrap{height:70px;background:#f5f6ee;padding:12px}'+
    '.frauen-library-search-wrap input{height:44px;width:90%;box-sizing:border-box}'+
    '.frauen-library-grid{padding:18px;display:block}'+
    '.frauen-library-card{min-height:96px;padding:10px;border-bottom:1px solid #9fa99b}'+
    '.frauen-library-card button{padding:15px;min-width:160px}'+
    '</style></head><body class="is-frauen-route has-bottom-nav is-area-route">'+
    '<header id="darAdultBrandHeaderV2">DĀR AL TAWḤĪD</header><div class="app">'+
    '<div id="darAdultBrandHeaderSpacerV2"></div><main id="appView" class="view"></main>'+
    '</div></body></html>');
   await page.addStyleTag({content:oldHeroCss});
   await page.addStyleTag({content:flow});
   await page.evaluate(()=>{
    location.hash="#frauen";
    window.__query="";
    window.render=function(){};
    window.readRoute=function(){
      return {view:"frauen",value:String(location.hash).replace(/^#frauen\/?/,"")};
    };
    window.DARFrauenFiqh={
      render:function(value){
        const search=window.__query;
        const safe=search.replace(/[&<>"']/g,"");
        const cards=Array.from({length:18},(_,i)=>
          '<article class="frauen-library-card"><button data-nav="frauen" data-value="group/din">'+
          'Kapitel '+(i+1)+'</button></article>').join("");
        return '<div class="frauen-library-shell">'+
         '<section class="frauen-library-hero"><h2>Frauen im Islam '+value+'</h2></section>'+
         '<div class="frauen-library-search-wrap"><input data-frauen-q value="'+safe+'" aria-label="Suche"></div>'+
         '<div class="frauen-library-section-head">Ergebnisse für '+safe+'</div>'+
         '<section class="frauen-library-grid">'+cards+'</section></div>';
      },
      bind:function(){
        const input=document.querySelector("[data-frauen-q]");
        if(input&&!input.dataset.bound){
          input.dataset.bound="1";
          input.addEventListener("input",()=>{window.__query=input.value;window.render();});
        }
      }
    };
   });
   await page.addScriptTag({content:adapter});
   await page.addScriptTag({content:runtime});
   await page.waitForSelector(".dar-immersive-hero-stage[data-dar-frauen-stage='v1415']");
   await page.waitForTimeout(150);
   const initial=await page.evaluate(()=>{
    const s=document.querySelector(".dar-immersive-hero-stage");
    window.__stage=s;
    window.__hero=s.querySelector(".frauen-library-hero");
    window.__search=s.querySelector("[data-frauen-q]");
    return {stageCount:document.querySelectorAll(".dar-immersive-hero-stage").length,
      photoCount:document.querySelectorAll(".frauen-library-hero").length,
      searchCount:document.querySelectorAll("[data-frauen-q]").length,
      position:getComputedStyle(s).position};
   });
   assert.equal(initial.stageCount,1,label+" duplicate stage");
   assert.equal(initial.photoCount,1,label+" duplicate original photo");
   assert.equal(initial.searchCount,1,label+" duplicate input");
   assert.equal(initial.position,"sticky",label+" not native sticky");
   await page.evaluate(()=>{for(let i=0;i<30;i++)window.render();window.scrollTo(0,560);});
   await page.waitForTimeout(120);
   const scrolled=await page.evaluate(()=>{
     const s=document.querySelector(".dar-immersive-hero-stage");
     return {top:s.getBoundingClientRect().top,head:document.getElementById("darAdultBrandHeaderV2").getBoundingClientRect().bottom,
       scroll:window.scrollY,heroSame:s.querySelector(".frauen-library-hero")===window.__hero};
   });
   assert.ok(scrolled.scroll>350,label+" document failed to scroll");
   assert.ok(Math.abs(scrolled.top-scrolled.head)<=2,label+" Hero shifted from header "+JSON.stringify(scrolled));
   assert.ok(scrolled.heroSame,label+" photo replaced during scroll");
   await page.locator("[data-frauen-q]").fill("Wissen");
   await page.waitForTimeout(120);
   const searched=await page.evaluate(()=>{
    const s=document.querySelector(".dar-immersive-hero-stage");
    return {stageCount:document.querySelectorAll(".dar-immersive-hero-stage").length,
      sameStage:s===window.__stage,
      sameHero:s.querySelector(".frauen-library-hero")===window.__hero,
      sameInput:s.querySelector("[data-frauen-q]")===window.__search,
      focus:document.activeElement===window.__search,
      text:document.querySelector(".frauen-library-section-head")?.textContent,
      scroll:window.scrollY};
   });
   assert.equal(searched.stageCount,1,label+" duplicate Hero after search");
   assert.ok(searched.sameStage&&searched.sameHero&&searched.sameInput&&searched.focus,
      label+" Hero/search was remounted on input "+JSON.stringify(searched));
   assert.ok(searched.text.includes("Wissen"),label+" search results not updated");
   assert.ok(searched.scroll>300,label+" input caused scroll-to-top");
   await page.locator(".frauen-library-grid [data-nav='frauen']").first().click();
   await page.waitForTimeout(150);
   const next=await page.evaluate(()=>({route:location.hash,stage:document.querySelectorAll(".dar-immersive-hero-stage").length,
    photo:document.querySelectorAll(".frauen-library-hero").length,scroll:window.scrollY}));
   assert.ok(next.route.includes("group/din"),label+" chapter click failed");
   assert.equal(next.stage,1,label+" double stage after route navigation");
   assert.equal(next.photo,1,label+" double original photo after navigation");
   console.log("PASS V1415 "+label+" single Hero + search, native sticky pan, incremental results, chapter tap");
   await ctx.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
