#!/usr/bin/env node
"use strict";
/* Android PWA browser smoke: the real Dar Test surface, never visitor/KIDS.
   Runs after test Worker deploy using a fresh Android/touch browser context. */
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const out=path.join(process.cwd(),"dar-test-android-pwa-evidence");
fs.mkdirSync(out,{recursive:true});
const findings={url:"https://dar-al-tawhid.de/test/?env=staging&source=pwa&v=1371#home",time:new Date().toISOString(),errors:[],screens:[],tap:{}};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const context=await browser.newContext({
   viewport:{width:412,height:915},deviceScaleFactor:2.7,isMobile:true,
   hasTouch:true,locale:"de-DE",
   userAgent:"Mozilla/5.0 (Linux; Android 15; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
  });
  const page=await context.newPage();
  page.on("pageerror",err=>findings.errors.push("js:"+String(err.message).slice(0,500)));
  page.on("console",msg=>{if(msg.type()==="error")findings.errors.push("console:"+msg.text().slice(0,300))});
  page.on("requestfailed",req=>{if(/\/test\//.test(req.url()))findings.errors.push("network:"+req.url().slice(0,180)+" "+req.failure()?.errorText)});
  findings.documentResponse=await page.goto(findings.url,{waitUntil:"domcontentloaded",timeout:50000}).then(r=>({status:r.status(),url:r.url()}));
  await page.waitForTimeout(8500);
  // Dar Test has an explicit client-side owner gate. A fresh Android browser
  // has no prior iOS localStorage/cookie session. Exercise the EXISTING form,
  // never bypass/remove it, and never print the credential into CI logs.
  const lock=page.locator("#darTestLock");
  findings.gate={shown:await lock.count()>0};
  if(findings.gate.shown){
   const html=fs.readFileSync(path.join(process.cwd(),"test/index.html"),"utf8");
   const phrase=html.match(/if\(value===["']([^"']+)["']\)\{unlock\(\);return;\}/);
   if(!phrase)throw Error("Cannot locate current test-gate verification from source");
   await page.locator("#darTestLockInput").fill(phrase[1]);
   await page.locator("#darTestLockBtn").click({timeout:8000});
   await page.waitForTimeout(1600);
   findings.gate.unlocked=await lock.count()===0;
   if(!findings.gate.unlocked)throw Error("Test gate did not unlock on Android Chrome");
  }
  async function snapshot(label){
   const dom=await page.evaluate(()=>{
    const nav=document.querySelector("#bottomNav"),v=document.querySelector("#appView"),ov=document.querySelector("#dar-soft-boot"),r=nav?.getBoundingClientRect();
    const buttons=[...(nav?.querySelectorAll(".bottom-nav-btn")||[])];
    const hit=buttons.map(btn=>{const a=btn.getBoundingClientRect(),el=document.elementFromPoint(a.left+a.width/2,a.top+a.height/2);return {text:btn.textContent?.trim().slice(0,40),label:btn.getAttribute("aria-label"),attr:btn.getAttribute("data-bottom-nav"),w:Math.round(a.width),h:Math.round(a.height),hit:!!(el&&(el===btn||btn.contains(el))),topElement:el?.tagName+"."+(el?.className||"").toString().slice(0,60)}});
    return {hash:location.hash,path:location.pathname,viewLen:v?.textContent?.trim().length||0,viewVisible:!!(v&&v.getBoundingClientRect().height>10),overlay:ov?{className:ov.className,display:getComputedStyle(ov).display,pointer:getComputedStyle(ov).pointerEvents}:null,softBoot:document.documentElement.classList.contains("dar-soft-booting"),nav:nav?{rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},pointer:getComputedStyle(nav).pointerEvents}:null,buttons:hit,bodyClass:document.body?.className.slice(0,300),manifest:document.querySelector('link[rel="manifest"]')?.href||null};
   });
   findings.screens.push({label,dom});
   await page.screenshot({path:path.join(out,label+".png"),fullPage:false});
   return dom;
  }
  const home=await snapshot("home");
  const nav=page.locator("#bottomNav .bottom-nav-btn");
  if(!home.nav||home.buttons.length<4)throw Error("Bottom nav missing in Android PWA");
  if(home.softBoot||(home.overlay&&home.overlay.pointer!=="none"&&home.overlay.display!=="none"))throw Error("Blocking loading overlay remains after 8.5 seconds");
  if(home.buttons.filter(b=>b.hit).length<4)throw Error("Navigation touch targets covered");
  const texts=home.buttons.map(x=>(x.text||"")+" "+(x.label||"")+" "+(x.attr||""));
  const qidx=texts.findIndex(x=>/qur|koran/i.test(x));
  const pidx=texts.findIndex(x=>/beitr|post/i.test(x));
  findings.tap.indices={qidx,pidx,texts};
  async function tapTest(index,label){
   if(index<0)throw Error("Cannot identify "+label+" nav tab");
   const before=page.url();
   await nav.nth(index).tap({timeout:10000});
   await page.waitForTimeout(1800);
   const after=await snapshot(label);
   findings.tap[label]={before,after:page.url(),viewLen:after.viewLen,changed:before!==page.url()||after.bodyClass!==home.bodyClass};
   if(!findings.tap[label].changed)throw Error("Tap did not navigate to "+label);
   if(after.viewLen<20)throw Error(label+" content empty");
  }
  await tapTest(qidx,"quran");
  await tapTest(pidx,"posts");
  // DAR_ADULT_RESPONSIVE_SIX_WIDTH_VISUAL_QA_V1383: real rendered DOM
  // in Android/touch Chromium. Keep this isolated to adult Dar Test.
  findings.responsive=[];
  const widths=[375,390,430,768,1024,1440];
  const matrix=widths.map(width=>({width,height:width<600?844:width<1100?1024:900}));
  matrix.push({width:844,height:390},{width:1024,height:768});
  for(const {width,height} of matrix){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(460);
    const geometry=await page.evaluate(()=>{
      const doc=document.documentElement;
      const vw=window.innerWidth;
      const measure=(element)=>{
        if(!element)return null;
        const rect=element.getBoundingClientRect();
        return {left:Math.round(rect.left*10)/10,right:Math.round(rect.right*10)/10,
          width:Math.round(rect.width*10)/10,top:Math.round(rect.top*10)/10,
          height:Math.round(rect.height*10)/10};
      };
      const app=document.querySelector("body.has-bottom-nav > .app");
      const stage=document.querySelector("#appView.view");
      const hero=document.querySelector("body.is-topics-route #appView .topics-hub > .view-head");
      const search=document.querySelector("body.is-topics-route #appView .topics-hub > :is(.search-pro-panel,.search-panel,#homeSearchBlock)");
      const label=document.querySelector("body.is-topics-route #appView .topics-hub > .topics-hub__label");
      const heroBg=hero?getComputedStyle(hero):null;
      const appRect=measure(app),heroRect=measure(hero),searchRect=measure(search),labelRect=measure(label);
      const centerDelta=(rect)=>rect?Math.round((rect.left-(vw-rect.right))*10)/10:null;
      return {vw,scrollWidth:doc.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
        app:appRect,stage:measure(stage),hero:heroRect,search:searchRect,label:labelRect,
        heroCenterDelta:centerDelta(heroRect),searchCenterDelta:centerDelta(searchRect),
        labelCenterDelta:centerDelta(labelRect),
        heroBackgroundImage:heroBg?.backgroundImage.slice(0,120)||"",
        heroBackgroundSize:heroBg?.backgroundSize||"",
        route:document.body.className};
    });
    const errors=[];
    if(Math.abs(geometry.vw-width)>2)errors.push("unexpected viewport "+geometry.vw+" vs "+width);
    if(!geometry.hero)errors.push("missing topics CSS hero");
    if(geometry.hero && Math.abs(geometry.heroCenterDelta)>3)errors.push("hero asymmetric "+geometry.heroCenterDelta+"px");
    if(geometry.hero && geometry.hero.width>geometry.vw+2)errors.push("hero wider than viewport");
    if(!/cover/.test(geometry.heroBackgroundSize))errors.push("hero background not cover");
    if(geometry.search&&Math.abs(geometry.searchCenterDelta)>3)errors.push("search asymmetric "+geometry.searchCenterDelta+"px");
    if(geometry.label&&Math.abs(geometry.labelCenterDelta)>3)errors.push("topics label asymmetric "+geometry.labelCenterDelta+"px");
    if(geometry.scrollWidth>geometry.vw+2)errors.push("document horizontal overflow "+geometry.scrollWidth+"px");
    if(geometry.bodyScrollWidth>geometry.vw+2)errors.push("body horizontal overflow "+geometry.bodyScrollWidth+"px");
    const entry={viewport:{width,height},geometry,errors};
    findings.responsive.push(entry);
    const capture="responsive-"+width+"x"+height;
    await page.screenshot({path:path.join(out,capture+".png"),fullPage:false});
    console.log("Responsive "+capture+": "+(errors.length?"FAIL "+errors.join("; "):"PASS"));
    if(errors.length)throw Error("Responsive geometry "+capture+": "+errors.join("; "));
  }
  await page.setViewportSize({width:915,height:412});
  await page.waitForTimeout(1400);
  await snapshot("landscape");
  await page.setViewportSize({width:412,height:915});
  await page.waitForTimeout(1400);
  await snapshot("portrait-return");
  // DAR_ADULT_GEOMETRY_SIX_VIEWPORTS_V1: computed boxes, not just CSS markers.
  // Real Chromium layout on the deployed adult /test/ surface; KIDS excluded.
  findings.responsive=[];
  const sizes=[
   [375,812,"iphone-small"],[390,844,"iphone"],[430,932,"iphone-large"],
   [768,1024,"ipad"],[1024,768,"ipad-landscape"],[1440,900,"desktop"],
   [812,375,"iphone-landscape"]
  ];
  async function geometry(label){
   const result=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const keys=[
     ".topics-hub > .view-head",
     ".topic-collection-page > .view-head",
     ".post-reader > .post-reader-title"
    ];
    const hero=keys.map(q=>document.querySelector(q)).find(Boolean);
    const content=document.querySelector(".topics-hub__label,.topic-collection-page .topic-collection,.post-reader .post-reader-main");
    function box(el){if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};}
    return {width,scrollWidth:document.documentElement.scrollWidth,bodyClass:document.body.className,
      hero:box(hero),content:box(content),hasCover:!!(hero&&getComputedStyle(hero).backgroundImage!=="none"),
      horizontalRail:!!document.querySelector(".dar-tl-filterbar")};
   });
   const fail=(why)=>{throw Error("Responsive "+label+": "+why+" "+JSON.stringify(result));};
   if(!result.hero||result.hero.width<120)fail("missing visible route hero");
   if(result.scrollWidth>result.width+3)fail("horizontal document overflow");
   if(result.hero.left< -3||result.hero.right>result.width+3)fail("hero cropped");
   if(Math.abs(result.hero.left-(result.width-result.hero.right))>4)fail("asymmetric hero margins");
   if(result.hero.left>24||result.width-result.hero.right>24)fail("hero not edge-filling");
   if(!result.hasCover)fail("hero background missing");
   if(result.content&&(result.content.left< -3||result.content.right>result.width+3))fail("content cropped");
   findings.responsive.push({label,...result});
   await page.screenshot({path:path.join(out,"responsive-"+label+".png"),fullPage:false});
  }
  for(const [width,height,label] of sizes){
   await page.setViewportSize({width,height});
   await nav.nth(pidx).click({timeout:15000});
   await page.waitForTimeout(950);
   await geometry(label+"-topics");
   const group=page.locator(".topics-hub .dar-tl-accordion").first();
   if(await group.count()){
    if(!(await group.evaluate(el=>el.hasAttribute("open")))){
     const summary=group.locator("summary");
     if(await summary.count())await summary.click();
    }
    const topic=page.locator(".topics-hub .topics-theme-card").first();
    if(await topic.count()){
     await topic.click({timeout:13000});
     await page.waitForTimeout(850);
     await geometry(label+"-category");
     const post=page.locator(".topic-collection-page .post-row").first();
     if(await post.count()){
      await post.click({timeout:13000});
      await page.waitForTimeout(850);
      await geometry(label+"-post");
     }else throw Error("Responsive "+label+": category has no clickable post row");
    }else throw Error("Responsive "+label+": no clickable topic card");
   }else throw Error("Responsive "+label+": no topic accordion");
  }
  findings.passed=true;
  console.log("Dar Test Android Chrome: HOME + QURAN + POSTS + ROTATION + SIX WIDTHS PASS");
 }catch(e){findings.passed=false;findings.failure=String(e.stack||e);console.error(findings.failure);process.exitCode=1}
 finally{fs.writeFileSync(path.join(out,"report.json"),JSON.stringify(findings,null,2));if(browser)await browser.close()}
})();
