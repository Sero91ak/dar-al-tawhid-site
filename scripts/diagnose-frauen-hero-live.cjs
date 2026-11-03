#!/usr/bin/env node
"use strict";
/* DAR FRAUEN V1408 LIVE PREVIEW ACCEPTANCE
 * Read-only external website: inject PR CSS+JS into browser memory, never
 * mutate published pages or user data. Verifies browser geometry for both
 * visitor and Test, hub and group, scroll up/down and original images.
 */
const {chromium}=require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const out=path.join(process.cwd(),"frauen-hero-live-evidence");
fs.mkdirSync(out,{recursive:true});
const css=fs.readFileSync("assets/frauen/frauen-fixed-hero-v1408.css","utf8");
const js=fs.readFileSync("assets/frauen/frauen-fixed-hero-runtime-v1408.js","utf8");
const routes=[
  {key:"visitor",url:"https://dar-al-tawhid.de/pwa/?frauen-preview-v1408=1#frauen"},
  {key:"test",url:"https://dar-al-tawhid.de/test/?frauen-preview-v1408=1#frauen"}
];
const checks=[];
const metrics=()=>{
 const pick=q=>document.querySelector(q);
 const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,width:r.width,height:r.height};};
 const header=pick("#darAdultBrandHeaderV2")||pick("#darTestBrandHeaderV1");
 const stage=pick("#appView .dar-immersive-hero-stage");
 const hero=pick("#appView .frauen-library-hero");
 const placeholder=pick("#appView .dar-frauen-hero-space-v1408");
 const heading=pick("#appView .frauen-library-section-head");
 const grid=pick("#appView .frauen-library-area-grid");
 const cards=[...document.querySelectorAll("#appView .frauen-library-area-card")];
 return {header:box(header),stage:box(stage),hero:box(hero),placeholder:box(placeholder),heading:box(heading),
   documentY:window.scrollY,view:document.body?.getAttribute("data-frauen-view"),
   stagePosition:stage?getComputedStyle(stage).position:null,
   cards:cards.length,card:box(cards[0]),
   grid:box(grid),flex:grid?getComputedStyle(grid).flexDirection:null};
};
function verify(label,m,group=false){
 if(!m.stage||!m.hero||!m.header||!m.placeholder)throw Error(label+" no fixed hero/header/placeholder: "+JSON.stringify(m));
 if(m.stagePosition!=="fixed")throw Error(label+" Hero not fixed: "+JSON.stringify(m));
 if(Math.abs(m.stage.top-m.header.bottom)>5)throw Error(label+" Hero detached from fixed header: "+JSON.stringify(m));
 if(m.placeholder.height<150)throw Error(label+" Hero missing flow reservation: "+JSON.stringify(m));
 if(group){
  if(!m.heading||m.heading.top<m.stage.bottom-5)throw Error(label+" chapter heading above/inside Hero: "+JSON.stringify(m));
  if(m.cards<2||m.flex!=="column")throw Error(label+" chapters not one column: "+JSON.stringify(m));
  if(m.card&&m.grid&&m.card.width<m.grid.width-5)throw Error(label+" chapter capsule not full width: "+JSON.stringify(m));
 }
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const route of routes){
   const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"de-DE"});
   const page=await context.newPage();
   const errors=[];
   page.on("pageerror",e=>errors.push(String(e.message).slice(0,300)));
   const response=await page.goto(route.url,{waitUntil:"domcontentloaded",timeout:60000});
   await page.waitForTimeout(4000);
   // Ensure this is genuinely the Frauen route, rather than a boot splash or
   // Start view that just happens to have a stale '#frauen' URL fragment.
   const boot=await page.evaluate(()=>{
     const nav=document.querySelector('[data-nav="frauen"]');
     if(!document.body?.classList.contains("is-frauen-route")){
       if(typeof window.navigate==="function")window.navigate("frauen","");
       else if(nav)nav.click();
     }
     return {bodyClass:document.body?.className,hash:location.hash,
       navigate:typeof window.navigate,app:!!document.getElementById("appView"),
       nav:!!nav,hero:!!document.querySelector("#appView .frauen-library-hero")};
   });
   console.log("HERO_LIVE_BOOT",route.key,JSON.stringify(boot));
   await page.waitForTimeout(1700);
   // Inject the current PR into browser memory only, never publish it.
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:js});
   try{
     await page.waitForFunction(()=>!!document.querySelector("#appView .dar-frauen-hero-space-v1408"),null,{timeout:16000});
   }catch(e){
     const state=await page.evaluate(()=>({bodyClass:document.body?.className,hash:location.hash,
       app:!!document.getElementById("appView"),hero:!!document.querySelector("#appView .frauen-library-hero"),
       stage:!!document.querySelector("#appView .dar-immersive-hero-stage"),
       fixedRuntime:!!window.__darFrauenFixedHeroV1408,
       loader:document.querySelector(".app-loading")?.textContent?.slice(0,100)}));
     throw new Error(route.key+" V1408 never mounted: "+JSON.stringify(state)+"; "+e.message);
   }
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(500);
   let hub=await page.evaluate(metrics);
   verify(route.key+" hub",hub);
   await page.screenshot({path:path.join(out,route.key+"-hub.png")});
   // Navigate through the actual application; the renderer/order is not mocked.
   const nav=await page.evaluate(()=>{
     if(typeof window.navigate==="function"){window.navigate("frauen","group/fiqh");return true}
     const card=document.querySelector('#appView .frauen-library-card[data-value^="group/"]');
     if(card){card.click();return true}
     return false;
   });
   if(!nav)throw Error(route.key+" cannot navigate to real group");
   await page.waitForTimeout(1200);
   await page.waitForFunction(()=>!!document.querySelector(".frauen-library-area-grid .frauen-library-area-card"),{timeout:12000});
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(500);
   let group=await page.evaluate(metrics);
   verify(route.key+" group",group,true);
   await page.screenshot({path:path.join(out,route.key+"-group.png")});
   await page.mouse.wheel(0,350);
   await page.waitForTimeout(450);
   let scrolled=await page.evaluate(metrics);
   if(!scrolled.stage||Math.abs(scrolled.stage.top-scrolled.header.bottom)>5)
     throw Error(route.key+" photo moves away on scroll: "+JSON.stringify(scrolled));
   if(scrolled.documentY<50)throw Error(route.key+" ordinary content cannot scroll: "+JSON.stringify(scrolled));
   if(scrolled.heading&&scrolled.heading.top>group.heading.top-60)
     throw Error(route.key+" chapter heading did not scroll behind image: "+JSON.stringify(scrolled));
   await page.screenshot({path:path.join(out,route.key+"-scrolled.png")});
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(300);
   let back=await page.evaluate(metrics);
   verify(route.key+" return-to-top",back,true);
   checks.push({route:route.key,http:response.status(),hub,group,scrolled,back,errors});
   console.log("PASS LIVE PREVIEW",route.key,JSON.stringify({http:response.status(),hub:hub.stage,groupHeading:group.heading,scroll:scrolled.documentY,returnToTop:back.stage}));
   await context.close();
  }
 }catch(e){
  fs.writeFileSync(path.join(out,"diagnosis.json"),JSON.stringify({checks,error:String(e.stack||e)},null,2));
  console.error("HERO_LIVE_FAILURE",e.stack||e);
  process.exitCode=1;
 }finally{
  if(browser)await browser.close();
  fs.writeFileSync(path.join(out,"diagnosis.json"),JSON.stringify(checks,null,2));
 }
})();
