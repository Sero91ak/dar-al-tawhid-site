#!/usr/bin/env node
"use strict";
/* Real Chromium/Android PWA QA for the proposed half-and-half Test layout.
 * Loads ONLY local PR JS/CSS into the deployed /test site for pre-deploy QA.
 * Uses the EXISTING test-login form; does not weaken authentication.
 */
const fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"../..");
const js=fs.readFileSync(path.join(root,"test/assets/dar-duo-responsive-v1.js"),"utf8");
const css=fs.readFileSync(path.join(root,"test/assets/dar-duo-responsive-v1.css"),"utf8");
const URL="https://dar-al-tawhid.de/test/?env=staging&source=duo-half-qa#quran";
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const page=await browser.newPage({
    viewport:{width:726,height:512},deviceScaleFactor:2.5,isMobile:true,hasTouch:true,
    locale:"de-DE",
    userAgent:"Mozilla/5.0 (Linux; Android 16; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
  });
  await page.route(/\/test\/assets\/dar-duo-responsive-v1\.(?:css|js)(?:\?|$)/,async route=>{
    const isCss=route.request().url().includes(".css");
    await route.fulfill({status:200,body:isCss?css:js,contentType:isCss?"text/css":"application/javascript"});
  });
  const response=await page.goto(URL,{waitUntil:"domcontentloaded",timeout:55000});
  if(!response||response.status()!==200)throw Error("Test app unavailable");
  await page.waitForTimeout(1800);
  const lock=page.locator("#darTestLock");
  if(await lock.count()){
    const html=fs.readFileSync(path.join(root,"test/index.html"),"utf8");
    const match=html.match(/if\(value===["']([^"']+)["']\)\{unlock\(\);return;\}/);
    if(!match)throw Error("Known Test access flow cannot be verified");
    await page.locator("#darTestLockInput").fill(match[1]);
    await page.locator("#darTestLockBtn").click({timeout:8000});
    await page.waitForTimeout(1200);
    if(await lock.count())throw Error("Existing test access gate did not unlock");
  }
  async function inspect(label,expectDual){
    await page.waitForTimeout(450);
    const d=await page.evaluate(()=>{
      const b=(sel)=>{
        const el=document.querySelector(sel);
        if(!el)return null;
        const r=el.getBoundingClientRect(),style=getComputedStyle(el);
        return {x:r.x,y:r.y,width:r.width,height:r.height,overflowY:style.overflowY,
          visible:style.display!=="none"&&style.visibility!=="hidden",
          cssLeft:style.left,inlineLeft:el.style.left,
          transform:style.transform,translate:style.translate,
          parent:el.parentElement&&el.parentElement.id,
          scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
      };
      return {width:document.documentElement.clientWidth,
        height:innerHeight,bodyWidth:document.body.scrollWidth,
        rootWidth:document.documentElement.scrollWidth,
        active:document.documentElement.classList.contains("dar-test-duo-active"),
        left:b("#darTestDuoWorkspaceNav"),right:b("#appView"),
        tabs:b("#bottomNav"),
        focus:document.documentElement.getAttribute("data-dar-duo-focus"),
        hash:location.hash,
        navCount:document.querySelectorAll("#bottomNav .bottom-nav-btn").length,
        content:document.querySelector("#appView")?.textContent?.trim().length||0};
    });
    console.log("DAR_HALF_QA "+label+" "+JSON.stringify(d));
    if(d.active!==expectDual)throw Error(label+" active mismatch");
    if(d.rootWidth>d.width+3||d.bodyWidth>d.width+3)
      throw Error(label+" horizontal viewport overflow");
    if(expectDual){
      const half=d.width/2,eps=1.5;
      const near=(a,b)=>Math.abs(a-b)<=eps;
      if(!d.left||!d.right||!d.tabs||
         !near(d.left.x,0)||!near(d.left.width,half)||
         !near(d.right.x,half)||!near(d.right.width,half))
        throw Error(label+" not exact 50/50");
      if(d.left.overflowY!=="auto"||d.right.overflowY!=="auto")
        throw Error(label+" panes do not have independent scroll");
      if(d.tabs.x< -1||d.tabs.x+d.tabs.width>half+1)
        throw Error(label+" original five-tab dock escapes left control pane");
    }else if(d.right&&Math.abs(d.right.width-d.width)>2){
      throw Error(label+" cover view not restored to 100%");
    }
    if(d.navCount<4)throw Error(label+" original bottom buttons missing");
    if(d.content<10)throw Error(label+" original route content missing");
    return d;
  }
  await inspect("fold-open",true);
  const sources=await page.evaluate(()=>{
    const selectors=[
      '#appView a[href^="#"]','#appView [data-nav]','#appView .quran-surah-card',
      '#appView [data-library-open]','#appView [data-qsrc-open]','#appView button'
    ];
    return selectors.map(q=>({
      selector:q,count:document.querySelectorAll(q).length,
      first:[...document.querySelectorAll(q)].slice(0,3).map(x=>({
        tag:x.tagName,className:String(x.className).slice(0,100),
        href:x.getAttribute("href"),nav:x.getAttribute("data-nav"),
        value:x.getAttribute("data-value"),text:(x.textContent||"").trim().slice(0,80)
      }))
    }));
  });
  console.log("DAR_HALF_QA_CONTEXT_SOURCES "+JSON.stringify(sources));
  const realSurahs=await page.locator('#darTestDuoContext [data-duo-context-index]').count();
  if(realSurahs<10)throw Error("Left pane has no real selectable Qurʾān entries");
  const beforeSurah=await page.evaluate(()=>location.hash);
  await page.locator('#darTestDuoContext [data-duo-context-index]').first().tap({timeout:10000});
  await page.waitForTimeout(800);
  const afterSurah=await page.evaluate(()=>({hash:location.hash,
    content:document.querySelector('#appView')?.textContent?.trim().length||0}));
  console.log("DAR_HALF_QA_SURAH_TAP "+JSON.stringify({beforeSurah,afterSurah,realSurahs}));
  if(afterSurah.hash===beforeSurah)throw Error("Selecting a real surah on the left did not open right reader");
  await page.waitForTimeout(2500);
  const readerProof=await page.evaluate(()=>{
    const view=document.querySelector("#appView");
    return {hash:location.hash,textLength:view?.innerText?.trim().length||0,
      childCount:view?.querySelectorAll("*").length||0,
      quranReader:!!view?.querySelector(".qrc-shell,.quran-ayah-list,.quran-reader,.quran-verse,.qrc-ayah"),
      fragment:view?.innerText?.trim().slice(0,200)||"",
      geometry:view?.getBoundingClientRect().width||0};
  });
  console.log("DAR_HALF_QA_REAL_SURAH_READER "+JSON.stringify(readerProof));
  if(readerProof.textLength<80 || readerProof.geometry>365)
    throw Error("Real surah reader did not show readable content inside right pane");
  await page.evaluate(()=>{location.hash="#quran";});
  await page.waitForTimeout(650);
  await inspect("quran-return",true);
  const leftBefore=await page.evaluate(()=>{
    const l=document.querySelector("#darTestDuoWorkspaceNav");
    const r=document.querySelector("#appView");
    if(l.scrollHeight-l.clientHeight>25)l.scrollTop=25;
    if(r.scrollHeight-r.clientHeight>120)r.scrollTop=120;
    return {left:l.scrollTop,right:r.scrollTop};
  });
  await page.waitForTimeout(120);
  const leftAfter=await page.evaluate(()=>{
    const l=document.querySelector("#darTestDuoWorkspaceNav");
    const r=document.querySelector("#appView");
    return {left:l.scrollTop,right:r.scrollTop};
  });
  if(Math.abs(leftAfter.left-leftBefore.left)>1||Math.abs(leftAfter.right-leftBefore.right)>1)
    throw Error("Independent scrolling is not stable");
  await page.locator('#darTestDuoWorkspaceNav [data-duo-route="hadith"]').tap({timeout:10000});
  await page.waitForTimeout(950);
  const tapped=await inspect("hadith-tap",true);
  if(!tapped.hash.startsWith("#hadith"))throw Error("Tap in left chooser did not open right route");
  await page.locator('#darTestDuoWorkspaceNav [data-duo-route="library"]').tap({timeout:10000});
  await page.waitForTimeout(850);
  const library=await inspect("library-tap",true);
  if(!library.hash.startsWith("#bibliothek"))throw Error("Library route not opened");
  await page.evaluate(()=>{
    const o=document.createElement("div");o.id="darTestReadingOverlay";
    o.innerHTML='<div class="dar-test-reader-dialog">Reader test</div>';
    document.body.appendChild(o);document.body.classList.add("dar-test-reading-open");
  });
  await page.waitForTimeout(140);
  const modal=await page.evaluate(()=>{
    const r=document.querySelector("#darTestReadingOverlay").getBoundingClientRect();
    return {x:r.x,w:r.width};
  });
  if(Math.abs(modal.x-363)>2||Math.abs(modal.w-363)>2)
    throw Error("Reader dialog does not stay in right half "+JSON.stringify(modal));
  await page.evaluate(()=>{
    document.body.classList.remove("dar-test-reading-open");
    document.querySelector("#darTestReadingOverlay")?.remove();
  });
  await page.setViewportSize({width:390,height:844});
  await inspect("fold-cover",false);
  await page.setViewportSize({width:726,height:512});
  await inspect("fold-reopen",true);
  console.log("DAR_HALF_QA PASS — 50/50, scroll, tap, focus, modal, cover/reopen");
 }finally{await browser.close();}
})().catch(e=>{console.error("DAR_HALF_QA FAIL",String(e.stack||e));process.exitCode=1;});
