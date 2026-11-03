#!/usr/bin/env node
"use strict";
/* Frauen V1409 browser QA: read-only live visitor Android and iOS WebView
   injection in temporary Playwright contexts. Never changes production data.
   Screenshots + diagnostics belong exclusively to CI artifacts. */
const {chromium}=require("playwright");
const fs=require("node:fs"),path=require("node:path");
const output=path.join(process.cwd(),"frauen-hero-live-evidence");
fs.mkdirSync(output,{recursive:true});
const css=fs.readFileSync("assets/frauen/frauen-ios-hero-v1409.css","utf8");
const widthCss=fs.readFileSync("assets/dar-adult-navwidth-content-v1409.css","utf8");
const script=fs.readFileSync("assets/frauen/frauen-ios-hero-v1409.js","utf8");
const data=[];
function metrics(){
 const one=q=>document.querySelector(q),rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,width:r.width,height:r.height}};
 const header=one("#darAdultBrandHeaderV2")||one("#darTestBrandHeaderV1");
 const stage=one("#appView .dar-immersive-hero-stage");
 const hero=one("#appView .frauen-library-hero");
 const space=one("#appView .dar-ios-frauen-hero-spacer-v1409");
 const cards=[...document.querySelectorAll("#appView .frauen-library-area-card")];
 const area=one("#appView .frauen-library-area-grid");
 const nav=one("#bottomNav");
 return {body:document.body?.className,view:document.body?.getAttribute("data-frauen-view"),header:rect(header),stage:rect(stage),hero:rect(hero),space:rect(space),area:rect(area),firstCard:rect(cards[0]),heading:rect(one(".frauen-library-section-head")),
   nav:rect(nav),cardCount:cards.length,display:area?getComputedStyle(area).display:null,flexDirection:area?getComputedStyle(area).flexDirection:null,
   stagePosition:stage?getComputedStyle(stage).position:null,iosClass:document.documentElement.classList.contains("dar-ios-frauen-hero-v1409"),
   scriptFlag:!!window.__darIosFrauenHeroV1409,y:window.scrollY,scrollHeight:document.scrollingElement?.scrollHeight,
   shell:one(".frauen-library-shell")?.outerHTML.slice(0,450)};
}
function check(m,kind,group){
 if(!m.header||!m.stage||!m.hero||!m.space)throw Error(kind+": missing original hero stage or spacer: "+JSON.stringify(m));
 if(m.stagePosition!=="fixed")throw Error(kind+": stage not fixed on iOS: "+JSON.stringify(m));
 if(Math.abs(m.stage.top-m.header.bottom)>3)throw Error(kind+": gap between header and hero: "+JSON.stringify(m));
 if(m.space.height<140)throw Error(kind+": no correctly-sized flow reservation: "+JSON.stringify(m));
 if(!m.iosClass||!m.scriptFlag)throw Error(kind+": iOS-only gate not active");
 if(group){
  if(!m.heading||m.heading.top<m.stage.bottom-3)throw Error(kind+": heading drawn inside or above hero: "+JSON.stringify(m));
  if(m.cardCount<2||m.display!=="flex"||m.flexDirection!=="column")throw Error(kind+": chapters not stacked: "+JSON.stringify(m));
  if(m.area&&m.firstCard&&m.firstCard.width<m.area.width-3)throw Error(kind+": cards not full-width: "+JSON.stringify(m));
 }
}
(async()=>{
 let browser,errors=[];
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const targets=[
   {name:"visitor-iOS",url:"https://dar-al-tawhid.de/pwa/?women-preview-v1409=1#frauen"},
   {name:"test-iOS",url:"https://dar-al-tawhid.de/test/?women-preview-v1409=1#frauen"}
  ];
  for(const target of targets){
   const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,
    userAgent:"DarAlTawhid-iOS/1.0 WKWebView (iPhone; CPU iPhone OS 27_0 like Mac OS X)"});
   await context.addInitScript(()=>{window.DAR_IOS_NATIVE_APP=true;window.__DAR_FRAUEN_HERO_SEAM_V1407=true;
    document.documentElement.classList.add("dar-ios-native-app")});
   const page=await context.newPage();
   page.on("pageerror",e=>errors.push(target.name+" "+String(e.message)));
   const response=await page.goto(target.url,{waitUntil:"domcontentloaded",timeout:60000});
   await page.waitForTimeout(4000);
   await page.waitForFunction(()=>!!document.querySelector("#appView .frauen-library-hero"),null,{timeout:15000});
   await page.addStyleTag({content:widthCss});
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:script});
   await page.waitForFunction(()=>!!document.querySelector("#appView .dar-ios-frauen-hero-spacer-v1409"),null,{timeout:10000});
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(350);
   const hub=await page.evaluate(metrics);
   check(hub,target.name+" hub",false);
   await page.screenshot({path:path.join(output,target.name+"-hub.png")});
   const changed=await page.evaluate(()=>{
    const c=document.querySelector('#appView [data-nav="frauen"][data-value^="group/"]');
    if(!c)return {navigated:false,reason:"no group link",body:document.body.className};
    const value=c.getAttribute("data-value");
    if(typeof window.navigate==="function")window.navigate("frauen",value);else c.click();
    return {navigated:true,value};
   });
   if(!changed.navigated)throw Error(target.name+" "+JSON.stringify(changed));
   await page.waitForFunction(()=>!!document.querySelector("#appView .frauen-library-area-grid .frauen-library-area-card"),null,{timeout:12000});
   await page.waitForTimeout(500);
   await page.evaluate(()=>window.scrollTo(0,0));
   const group=await page.evaluate(metrics);
   check(group,target.name+" group",true);
   if(group.nav&&group.area&&group.area.width<Math.min(group.nav.width,group.area.width+20)-16)
    throw Error(target.name+" content cards unnecessarily narrower than nav");
   await page.screenshot({path:path.join(output,target.name+"-group.png")});
   await page.evaluate(()=>window.scrollTo(0,420));
   await page.waitForTimeout(300);
   const moved=await page.evaluate(metrics);
   if(!moved.header||!moved.stage||Math.abs(moved.stage.top-moved.header.bottom)>3)
    throw Error(target.name+" iOS photo detached on upward scroll: "+JSON.stringify(moved));
   if(moved.y<75||!moved.heading||moved.heading.top>group.heading.top-75)
    throw Error(target.name+" chapter list did not scroll under hero: "+JSON.stringify(moved));
   await page.screenshot({path:path.join(output,target.name+"-scroll.png")});
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(180);
   check(await page.evaluate(metrics),target.name+" returned",true);
   data.push({target:target.name,http:response.status(),hub,group,moved});
   console.log("PASS IOS HERO",target.name,JSON.stringify({http:response.status(),top:group.stage.top,brand:group.header.bottom,cardWidth:group.firstCard?.width,nav:group.nav?.width,scroll:moved.y}));
   await context.close();
  }
  // Android parity: the iOS-only runtime must be inert, no fixed rail or spacer.
  const ctx=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/141 Mobile Safari/537.36"});
  const page=await ctx.newPage();
  await page.setContent('<html data-theme="salbei"><body class="is-frauen-route has-bottom-nav" data-frauen-view="group"><div id="appView"><div class="frauen-library-shell"><section class="frauen-library-hero">Android existing hero</section><section class="frauen-library-area-grid"></section></div></div></body></html>');
  await page.addScriptTag({content:script});
  const parity=await page.evaluate(()=>({active:!!window.__darIosFrauenHeroV1409,
   spacer:!!document.querySelector(".dar-ios-frauen-hero-spacer-v1409"),classAdded:document.documentElement.classList.contains("dar-ios-frauen-hero-v1409")}));
  if(parity.active||parity.spacer||parity.classAdded)throw Error("Android was modified by iOS-only runtime: "+JSON.stringify(parity));
  console.log("PASS ANDROID UNCHANGED",JSON.stringify(parity));
  data.push({target:"Android untouched",parity});
  await ctx.close();
 }catch(e){errors.push(String(e.stack||e));console.error("FRAUEN_V1409_QA_FAILURE",e.stack||e);process.exitCode=1;}
 finally{
  if(browser)await browser.close();
  fs.writeFileSync(path.join(output,"diagnosis.json"),JSON.stringify({data,errors},null,2));
 }
})();
