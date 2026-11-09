#!/usr/bin/env node
/* GLOBAL_HERODOCK_V2_ACCEPTANCE_20261109
 * Real adult CSS cascade + real shared controller in Chromium.
 * This validates in-situ original DOM, not a screenshot-only CSS mock.
 * Device/browser emulation does not replace physical iOS WKWebView QA.
 */
"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const read=p=>fs.readFileSync(p,"utf8");
const runtime=read("assets/dar-global-herodock-v2.js");
const styles=[
 "assets/adult-responsive-viewport-v1381.css",
 "assets/adult-global-hero-surface-ink-v1.css",
 "assets/dar-adult-visual-continuity-v1391.css",
 "assets/ilm-hadith-v1308.css",
 "assets/adult-immersive-hero-v1.css",
 "assets/dar-global-herodock-v2.css"
].map(read);
const foldCss=read("test/assets/dar-fold-workspace-v2.css");
const devices=[
 ["small",320,700],["iphone",390,844],["android",430,932],
 ["duo",600,880],["fold",768,1024],["ipad",1024,1366],
 ["desktop",1440,900],["wide",1920,1080],["landscape",844,430]
];
const dataArt="url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20160%2090'%3E%3Crect%20width='160'%20height='90'%20fill='%232b5145'/%3E%3C/svg%3E\")";
function bodyMarkup(route){
 const hero='<button id="heroAction" type="button">Inhalt öffnen</button>'+
   '<h2>Wissen, authentische Quellen und geprüfte Überlieferungen</h2>';
 const tail='<div class="fixture-results" id="results" style="min-height:2300px;padding:16px">'+
   '<article style="min-height:125px">Erstes Kapitel</article>'+
   '<article style="min-height:125px">Weitere Inhalte</article></div>';
 const form='<div class="main-search"><input id="heroSearch" aria-label="Suchen" type="search" value="" style="font-size:16px"></div>';
 if(route==="post")
  return '<article class="post-reader" style="--px-art:'+dataArt+'">'+
    '<header class="post-reader-title">'+hero+'</header>'+tail+'</article>';
 if(route==="hadith")
  return '<section class="hadith-hub"><header class="view-head">'+hero+
    '</header>'+form+tail+'</section>';
 if(route==="topics"||route==="topic"){
  const cls=route==="topics"?"topics-hub":"topic-collection-page";
  return '<section class="'+cls+'"><header class="view-head" style="background-image:'+
    dataArt+'!important">'+hero+'</header>'+tail+'</section>';
 }
 if(route==="future")
  return '<section class="future-editorial"><header data-dar-herodock="photo" class="future-photo" style="background-image:'+
    dataArt+'!important;min-height:260px"><h2>Neue Bilderseite</h2>'+
    '<button id="heroAction">Lesen</button></header>'+tail+'</section>';
 if(route==="scholars")
  return '<section class="scholars-index"><header class="scholars-index__header">'+
    '<h1>Gelehrte</h1><p>Text ohne Bild bleibt normal.</p></header>'+tail+'</section>';
 if(route==="frauen")
  return '<div class="frauen-library-shell"><div class="dar-frauen-dock-spacer"></div>'+
    '<section class="frauen-library-hero"><h2>Frauen im Islam</h2></section>'+tail+'</div>';
 return '<section class="generic"><header class="view-head"><h2>Nur Text</h2></header>'+tail+'</section>';
}
function near(a,b,tol=2){return Math.abs(a-b)<=tol}
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 let passed=0,skipped=0;
 try{
  for(const [name,w,h] of devices){
   for(const theme of ["salbei","dar-al-layl"]){
    const context=await browser.newContext({viewport:{width:w,height:h},
      hasTouch:true,deviceScaleFactor:1,locale:"de-DE"});
    const page=await context.newPage();
    const label=name+"/"+theme;
    await page.setContent('<!doctype html><html lang="de" dir="ltr" data-theme="'+theme+
      '" class="dar-adult-global-brand-ready"><head>'+
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
      '<style>:root{--dar-adult-header-obscured-top:70px;--dar-adult-brand-header-height:70px;'+
      '--bg:#edf1e8;--card:#fffefa;--text:#182c22;--gold2:#ae9754;--line2:#879c87;}'+
      'html,body{padding:0!important;margin:0!important;min-height:100%;width:100%}'+
      'body{background:var(--bg)}.app{width:100%;min-height:2500px}'+
      '#appView{width:100%;box-sizing:border-box;min-height:2300px;}'+
      '#darAdultBrandHeaderV2{position:fixed;top:0;left:0;right:0;height:70px;z-index:730;'+
      'background:#edf1e8;box-sizing:border-box;}'+
      '#darAdultBrandHeaderSpacerV2{height:70px;width:100%;display:block;}'+
      '.fixture-results{box-sizing:border-box;}'+
      '#heroAction{position:relative;z-index:4;min-height:42px;min-width:135px;background:#fff;'+
      'border:1px solid #222;color:#132d26;cursor:pointer;}'+
      '.future-photo{display:flex;flex-direction:column;justify-content:flex-end;'+
      'padding:20px;box-sizing:border-box;background-size:cover}'+
      'body.is-frauen-route .frauen-library-hero{min-height:250px;}'+
      '</style></head><body class="has-bottom-nav is-home-route">'+
      '<header id="darAdultBrandHeaderV2">DĀR AL TAWḤĪD</header>'+
      '<div class="app"><div id="darAdultBrandHeaderSpacerV2"></div>'+
      '<main id="appView" class="view"></main></div></body></html>');
    for(const style of styles) await page.addStyleTag({content:style});
    await page.addScriptTag({content:runtime});
    for(const route of ["post","topics","topic","hadith","future","scholars","frauen"]){
     await page.evaluate(({route,markup})=>{
       document.body.className="has-bottom-nav is-"+route+"-route";
       const root=document.getElementById("appView");
       root.innerHTML=markup;
       root.onclick=e=>{if(e.target.closest("#heroAction"))window.__clicked=(window.__clicked||0)+1};
       window.scrollTo(0,0);
     },{route,markup:bodyMarkup(route)});
     if(route==="scholars"||route==="frauen"){
       await page.waitForTimeout(50);
       const no=await page.evaluate(()=>({
         count:document.querySelectorAll('[data-dar-global-herodock="v2"]').length,
         spacer:document.querySelectorAll(".dar-global-herodock-spacer").length
       }));
       assert.equal(no.count,0,label+"/"+route+": text or women had a new dock");
       assert.equal(no.spacer,0,label+"/"+route+": ghost spacer");
       skipped++;continue;
     }
     await page.waitForFunction(()=>
       !!document.querySelector('[data-dar-global-herodock="v2"]') &&
       !!document.querySelector(".dar-global-herodock-spacer") &&
       document.querySelector(".dar-global-herodock-spacer").getBoundingClientRect().height>80
     );
     const geo=await page.evaluate(()=>{
       const hero=document.querySelector('[data-dar-global-herodock="v2"]');
       const spacer=document.querySelector(".dar-global-herodock-spacer");
       const search=document.getElementById("heroSearch");
       const parent=hero.parentElement,button=document.getElementById("heroAction");
       const r=el=>{const b=el.getBoundingClientRect();return {top:b.top,left:b.left,
         right:b.right,width:b.width,height:b.height,bottom:b.bottom};};
       return {hero:r(hero),spacer:r(spacer),position:getComputedStyle(hero).position,
         art:getComputedStyle(hero).backgroundImage,
         searches:document.querySelectorAll('#heroSearch').length,
         buttons:document.querySelectorAll('#heroAction').length,
         direct:hero.parentElement===spacer.parentElement,
         originalButton:parent.contains(button),
         search:search?r(search):null,
         scrollRoot:document.scrollingElement?.tagName||""};
     });
     const nameRoute=label+"/"+route;
     assert.equal(geo.position,"fixed",nameRoute+": hero not fixed");
     assert.ok(near(geo.hero.top,70),nameRoute+": header seam "+JSON.stringify(geo));
     assert.ok(near(geo.hero.left,0),nameRoute+": artwork doesn't reach left edge");
     assert.ok(near(geo.hero.width,w),nameRoute+": hero not full screen width "+JSON.stringify(geo.hero));
     assert.ok(geo.art.includes("url("),nameRoute+": original picture missing");
     assert.equal(geo.buttons,1,nameRoute+": duplicate hero");
     assert.ok(geo.direct&&geo.originalButton,nameRoute+": original DOM moved or event handler broken");
     assert.ok(geo.spacer.height+3>=geo.hero.height,nameRoute+": content not reserved");
     if(route==="hadith"){
       assert.equal(geo.searches,1,nameRoute+": duplicated search");
       assert.ok(geo.search && geo.search.top>=geo.hero.bottom-15,
         nameRoute+": search lost photo seam");
     }
     await page.evaluate(()=>window.scrollTo(0,800));
     await page.waitForTimeout(45);
     const after=await page.evaluate(()=>{
       const hero=document.querySelector('[data-dar-global-herodock="v2"]');
       return {top:hero.getBoundingClientRect().top,scroll:window.scrollY,
         sameButton:!!document.getElementById("heroAction")};
     });
     assert.ok(after.scroll>400,nameRoute+": scroll blocked "+JSON.stringify(after));
     assert.ok(near(after.top,70),nameRoute+": hero floats after scroll");
     const click=await page.evaluate(()=>{
       document.getElementById("heroAction").click();
       return window.__clicked;
     });
     assert.ok(click>0,nameRoute+": delegated action lost");
     if(route==="hadith"){
       const focused=await page.evaluate(()=>{
         const input=document.getElementById("heroSearch");
         input.focus();
         input.value="Isnād";
         input.setSelectionRange(3,3);
         return {same:document.activeElement===input,caret:input.selectionStart};
       });
       assert.ok(focused.same && focused.caret===3,nameRoute+": caret moved");
     }
     if(route==="future"){
       await page.evaluate(()=>document.getElementById("appView").appendChild(
         document.createElement("section")));
       await page.waitForTimeout(45);
       const one=await page.evaluate(()=>document.querySelectorAll(
         ".dar-global-herodock-spacer").length);
       assert.equal(one,1,nameRoute+": duplicate reserve after mutations");
     }
     passed++;
    }
    await context.close();
   }
  }
  // True DAR-Test Fold V2: appView moved into independently scrollable reader.
  const ctx=await browser.newContext({viewport:{width:768,height:1024},hasTouch:true});
  const page=await ctx.newPage();
  await page.setContent('<!doctype html><html data-theme="salbei" class="dar-adult-global-brand-ready">'+
   '<head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
   ':root{--bg:#edf1e8;--card:#fff;--text:#18382b;--gold2:#bba05b;'+
   '--dar-adult-header-obscured-top:70px;--dar-fold-v2-rail:220px;--dar-fold-v2-top:48px}'+
   'html,body{margin:0;padding:0}#appView{min-height:2200px;}</style></head>'+
   '<body class="has-bottom-nav is-post-route"><div class="app">'+
   '<main id="appView" class="view"></main></div></body></html>');
  for(const c of styles)await page.addStyleTag({content:c});
  await page.addStyleTag({content:foldCss});
  await page.addScriptTag({content:runtime});
  await page.evaluate(markup=>{
    const top=document.createElement("header");top.id="darFoldV2Topbar";
    const rail=document.createElement("aside");rail.id="darFoldV2Rail";
    const pane=document.createElement("main");pane.id="darFoldV2Pane";
    document.body.append(top,rail,pane);
    pane.appendChild(document.getElementById("appView"));
    document.documentElement.classList.add("dar-fold-v2-active");
    document.getElementById("appView").innerHTML=markup;
  },bodyMarkup("post"));
  await page.waitForFunction(()=>!!document.querySelector('[data-dar-global-herodock="v2"]'));
  await page.waitForTimeout(80);
  const foldFirst=await page.evaluate(()=>{
   const hero=document.querySelector('[data-dar-global-herodock="v2"]');
   const pane=document.getElementById("darFoldV2Pane");
   const a=hero.getBoundingClientRect(),b=pane.getBoundingClientRect();
   const hit=document.elementFromPoint(a.left+30,a.top+35);
   return {top:a.top,left:a.left,width:a.width,paneLeft:b.left,paneWidth:b.width,
     hit:!!hit&&hero.contains(hit),overflow:getComputedStyle(pane).overflowY};
  });
  assert.ok(near(foldFirst.top,48),"Fold V2 topbar seam "+JSON.stringify(foldFirst));
  assert.ok(near(foldFirst.left,foldFirst.paneLeft)&&near(foldFirst.width,foldFirst.paneWidth),
    "Fold V2 image must stay inside reading pane "+JSON.stringify(foldFirst));
  assert.ok(foldFirst.hit,"Fold V2 original header covered by another surface");
  await page.evaluate(()=>document.getElementById("darFoldV2Pane").scrollTop=600);
  await page.waitForTimeout(90);
  const foldScroll=await page.evaluate(()=>({
    scroll:document.getElementById("darFoldV2Pane").scrollTop,
    top:document.querySelector('[data-dar-global-herodock="v2"]').getBoundingClientRect().top
  }));
  assert.ok(foldScroll.scroll>350,"Fold reader cannot scroll");
  assert.ok(near(foldScroll.top,48),"Fold photo drifts with independent reader scroll "+JSON.stringify(foldScroll));
  console.log("PASS Global HeroDock V2 Fold V2 right pane + fixed photo + independent scroll");
  await ctx.close();
  console.log("PASS Global HeroDock V2: "+passed+" photo and "+skipped+
    " photo-free/Frauen exclusion checks across 9 sizes × 2 themes + true Fold");
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
