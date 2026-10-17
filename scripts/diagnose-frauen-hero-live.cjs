#!/usr/bin/env node
"use strict";
/* Browser-based, read-only Frauen hero diagnosis: public Test + visitor SPA.
   Preserve image/card/navigation logic; record actual computed layout on screen. */
const { chromium } = require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const out=path.join(process.cwd(),"frauen-hero-live-evidence");
fs.mkdirSync(out,{recursive:true});
const all=[];
const routes=[
  {key:"visitor",url:"https://dar-al-tawhid.de/?frauen-hero-probe=1392#frauen"},
  {key:"test",url:"https://dar-al-tawhid.de/test/?frauen-hero-probe=1392#frauen"}
];
function snapshot(){
  const hero=document.querySelector(".frauen-library-pinned-header .frauen-library-hero");
  const stage=document.querySelector(".frauen-library-pinned-header");
  const heading=document.querySelector(".frauen-library-section-head");
  const app=document.querySelector("#appView");
  const shell=document.querySelector(".frauen-library-shell");
  const doc=document.scrollingElement;
  const pick=e=>{
    if(!e)return null;
    const r=e.getBoundingClientRect(),c=getComputedStyle(e);
    return {tag:e.tagName,id:e.id,classes:String(e.className).slice(0,180),
      top:Math.round(r.top),bottom:Math.round(r.bottom),
      left:Math.round(r.left),right:Math.round(r.right),
      width:Math.round(r.width),height:Math.round(r.height),
      display:c.display,visibility:c.visibility,opacity:c.opacity,
      position:c.position,overflowX:c.overflowX,overflowY:c.overflowY,
      backgroundImage:c.backgroundImage.slice(0,420),zIndex:c.zIndex,
      scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,
      clipPath:c.clipPath,transform:c.transform,
      parent:e.parentElement?String(e.parentElement.className).slice(0,120):""};
  };
  let ancestors=[];
  if(hero){for(let x=hero,n=0;x&&n<12;x=x.parentElement,n++)ancestors.push(pick(x));}
  return {hash:location.hash,theme:document.documentElement.getAttribute("data-theme"),
    bodyClass:document.body?.className,view:document.body?.getAttribute("data-frauen-view"),
    docScroll:doc?.scrollTop,windowY:scrollY,viewport:{w:innerWidth,h:innerHeight},
    hero:pick(hero),stage:pick(stage),heading:pick(heading),
    app:pick(app),shell:pick(shell),ancestors,
    heroHtml:hero?.outerHTML.slice(0,400),
    shellChildren:shell?[...shell.children].slice(0,7).map(x=>({tag:x.tagName,cls:String(x.className).slice(0,150),head:x.outerHTML.slice(0,260)})):[],
    renderer:(()=>{
      try{
        const p=window.DARFrauenFiqh;
        const html=typeof p?.render==="function"?String(p.render("")):"";
        return {exists:!!p,render:typeof p?.render,
          generatedLength:html.length,generatedHero:html.includes("frauen-library-hero"),
          generatedStage:html.includes("frauen-library-pinned-header"),
          generatedHeader:html.slice(0,330)};
      }catch(e){return {error:String(e)}}
    })(),
    images:[...document.querySelectorAll(".frauen-library-card.has-visual")].slice(0,2).map(pick),
    styles:[...document.querySelectorAll('link[rel="stylesheet"]')].filter(x=>/frauen/.test(x.href)).map(x=>x.href)};
}
(async()=>{
 let browser;let issues=[];
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const route of routes){
   const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"de-DE",userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1"});
   const page=await context.newPage();const errors=[];
   page.on("pageerror",e=>errors.push(String(e.message).slice(0,300)));
   const response=await page.goto(route.url,{waitUntil:"domcontentloaded",timeout:60000});
   await page.waitForTimeout(6000);
   let before=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-initial.png")});
   await page.evaluate(()=>{scrollTo(0,350);let el=document.querySelector("#appView");if(el)el.scrollTop=350});
   await page.waitForTimeout(450);
   let after=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-after-scroll.png")});
   all.push({key:route.key,status:response.status(),before,after,errors});
   console.log(JSON.stringify({route:route.key,status:response.status(),
    before:{bodyClass:before.bodyClass,theme:before.theme,view:before.view,scroll:before.docScroll,hero:before.hero,stage:before.stage,heading:before.heading,app:before.app,images:before.images.length,styles:before.styles,shellChildren:before.shellChildren,renderer:before.renderer},
    after:{scroll:after.docScroll,hero:after.hero,stage:after.stage,heading:after.heading},errors}));
   if(!before.hero||before.hero.height<180||before.hero.bottom<100){
     issues.push(route.key+" upper hero missing from first viewport");
   }
   if(after.stage&&after.stage.bottom<100)issues.push(route.key+" stage scrolls off-screen");
   await context.close();
  }
 }catch(e){issues.push(String(e.stack||e));console.error(e);}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,"diagnosis.json"),JSON.stringify({all,issues},null,2));}
 if(issues.length){console.error("HERO_LIVE_FAILURES",issues);process.exitCode=1;}
})();
