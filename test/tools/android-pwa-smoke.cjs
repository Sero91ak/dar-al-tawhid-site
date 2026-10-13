#!/usr/bin/env node
"use strict";
/* Android PWA browser smoke: the real Dar Test surface, never visitor/KIDS.
   Runs after test Worker deploy using a fresh Android/touch browser context. */
const fs=require("node:fs");
const path=require("node:path");
const {execFileSync}=require("node:child_process");
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
  // Verify the actual installation icon bytes match the iOS Apple icon,
  // not just that a manifest URL exists. Only test /test assets.
  execFileSync(process.execPath,["test/tools/build-apple-icons.cjs"],{stdio:"pipe"});
  const mr=await context.request.get("https://dar-al-tawhid.de/test/manifest.json?v=ios-apple-exact-1371");
  if(!mr.ok())throw Error("Dar Test PWA manifest HTTP "+mr.status());
  const manifest=await mr.json();
  findings.install={id:manifest.id,scope:manifest.scope,icons:[]};
  if(manifest.id!=="/test/?env=staging"||manifest.scope!=="/test/")throw Error("Wrong Android Dar Test install identity");
  for(const icon of manifest.icons||[]){
   const p=new URL(icon.src,"https://dar-al-tawhid.de").pathname;
   if(!/^\/test\/assets\/dar-test-apple-icon-(192|512)\.png$/.test(p))throw Error("Wrong icon source in Android Test manifest");
   const res=await context.request.get(new URL(icon.src,"https://dar-al-tawhid.de").toString());
   const actual=await res.body();
   const expected=fs.readFileSync(p.slice(1));
   findings.install.icons.push({path:p,http:res.status(),bytes:actual.length,match:actual.equals(expected)});
   if(!res.ok()||!actual.equals(expected))throw Error("Android icon not deployed from iOS original "+p);
  }
  if(findings.install.icons.length!==2)throw Error("Missing Android install icons");
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
  await page.waitForTimeout(4600);
  const pageText=await page.locator("#appView").innerText();
  findings.tap.posts.hasCategories=!/0\s+Bereiche|Noch keine Kategorien erkannt/i.test(pageText);
  await snapshot("posts-after-wait");
  if(!findings.tap.posts.hasCategories)throw Error("Beiträge did not load categories after 4.6 sec on Android Chrome");
  await page.setViewportSize({width:915,height:412});
  await page.waitForTimeout(1400);
  await snapshot("landscape");
  await page.setViewportSize({width:412,height:915});
  await page.waitForTimeout(1400);
  await snapshot("portrait-return");
  findings.passed=true;
  console.log("Dar Test Android Chrome: HOME + QURAN + POSTS + ROTATION PASS");
 }catch(e){findings.passed=false;findings.failure=String(e.stack||e);console.error(findings.failure);process.exitCode=1}
 finally{fs.writeFileSync(path.join(out,"report.json"),JSON.stringify(findings,null,2));if(browser)await browser.close()}
})();
