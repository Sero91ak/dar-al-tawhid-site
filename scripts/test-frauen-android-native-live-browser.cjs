#!/usr/bin/env node
"use strict";
/* Real public Android-native shell smoke test. Read-only; no OneSignal calls.
   The Android app uses DarAlTawhidAndroid/.. UA, /#home and #appView.
   Unlike the public website, it must NEVER be tested with a desktop ?page route. */
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const BASE=process.env.FRAUEN_LIVE_BASE||"https://dar-al-tawhid.de";
const rows=require("../assets/frauen/frauen-neufokus-v1.json").items;
const feed=require("../content/focus-feed/feed-index.json");
const focus=feed.items.find(x=>x.id==="neufokus-frauenwissen-16-20261118");
async function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function diag(page){
 return await page.evaluate(()=>({
   href:location.href,hash:location.hash,route:document.body?.className,
   nativeSurface:document.documentElement?.dataset?.appPath,
   app:!!document.getElementById("appView"),
   nativeV3:!!document.getElementById("dv3Home"),
   v380:!!document.querySelector("#appView .home-v380-shell"),
   mainChildren:document.getElementById("appView")?.children?.length,
   focusScript:!!document.getElementById("darFrauenNeufokusV1"),
   focus:window.DARFrauenNeufokusV1?.diagnostics?.()||null,
   focusEl:!!document.getElementById("darFrauenNeufokus48h"),
   visible:!!document.getElementById("darFrauenNeufokus48h")?.getClientRects().length,
   topText:document.getElementById("appView")?.innerText?.slice(0,180)
 })).catch(e=>({error:String(e)}));
}
(async()=>{
 const active=focus?.status==="live"&&Date.now()>=Date.parse(focus.startsAt||"")&&Date.now()<Date.parse(focus.expiresAt||"");
 if(!active){console.log("SKIP android-native 48h visual check: inactive window");return}
 let browser;
 try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const device of [{name:"android-phone",width:412,height:915},{name:"android-fold",width:690,height:840},{name:"android-tablet",width:800,height:1100}]){
  const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},
   deviceScaleFactor:2,isMobile:true,hasTouch:true,
   userAgent:"Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 DarAlTawhidAndroid/1.0"});
  const page=await ctx.newPage();let latest=null,header=null;
  for(let trial=0;trial<5;trial++){
   const response=await page.goto(BASE+"/?native-focus-audit="+Date.now()+"#home",{waitUntil:"domcontentloaded",timeout:45000});
   header=response?.headers()?.["x-dar-surface"]||"";
   try{
    await page.waitForFunction(()=>!!window.DARFrauenNeufokusV1,{timeout:12000});
    await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
    await page.locator("#darFrauenNeufokus48h").waitFor({timeout:12000,state:"visible"});
    latest=await diag(page);break;
   }catch(e){latest=await diag(page);console.log(device.name+" retry "+(trial+1)+" "+JSON.stringify({header,diag:latest,error:String(e).slice(0,280)}));if(trial<4)await sleep(2500)}
  }
  assert.equal(header,"ios-native",device.name+" did not receive native Android worker shell");
  assert.ok(latest?.app,device.name+" missing real native app");
  assert.equal(latest?.focus?.cardPresent,true,device.name+" no global news/focus card in native Android: "+JSON.stringify(latest));
  assert.ok(latest?.visible,device.name+" news/focus card is in DOM but hidden");
  const card=page.locator("#darFrauenNeufokus48h");
  const position=await card.boundingBox();
  assert.ok(position&&position.width>140&&position.height>125,device.name+" card too small or absent");
  assert.ok(position.x>=-3&&position.x+position.width<=device.width+3,device.name+" card clipped");
  assert.ok(/16/.test(await card.innerText()),device.name+" missing count");
  await card.click();
  const list=page.locator("#darFrauenNeufokusIndex a.dar-frauen-index-link");
  await list.first().waitFor({timeout:10000});
  assert.equal(await list.count(),16,device.name+" count mismatch");
  const first=rows[0],target="#frauen/"+encodeURIComponent(first.area)+"/"+encodeURIComponent(first.id);
  assert.equal(await list.first().getAttribute("href"),target,device.name+" must use native route, not desktop ?page URL");
  await list.first().click();
  await page.waitForFunction(expected=>location.hash===expected,{timeout:10000},target);
  await page.locator(".dar-frauen-production-root").waitFor({timeout:15000});
  console.log("PASS ANDROID NATIVE "+device.name+" "+JSON.stringify({nativeShell:header,card:latest.focus,items:16,target}));
  await ctx.close();
 }
 }finally{if(browser)await browser.close()}
})().catch(e=>{console.error("ANDROID NATIVE FOCUS QA FAILED:",e.stack||e);process.exitCode=1});
