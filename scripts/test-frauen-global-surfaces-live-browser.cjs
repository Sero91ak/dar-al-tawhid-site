#!/usr/bin/env node
"use strict";
/* Strict read-only live QA across official iOS native, DAR TEST and Android
 * installed PWA. Public website + Android native have separate existing gates.
 * Does not send push, change feed dates, or create notifications.
 */
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const BASE=process.env.FRAUEN_LIVE_BASE||"https://dar-al-tawhid.de";
const manifest=require("../assets/frauen/frauen-neufokus-v1.json");
const release=require("../content/focus-feed/feed-index.json").items.find(x=>x.id===manifest.focusId);
const staging=require("../content/staging/focus-feed/feed-index.json").items.find(x=>x.id===manifest.focusId);
const now=Date.now();
function active(f){return f?.status==="live"&&Date.parse(f.startsAt)<=now&&now<Date.parse(f.expiresAt)}
if(!active(release)||!active(staging)){console.log("SKIP 48h global live surfaces: window inactive");process.exit(0)}
assert.equal(release.startsAt,staging.startsAt,"Live/Test focus start MUST match");
assert.equal(release.expiresAt,staging.expiresAt,"Live/Test focus expiry MUST match");
const iphone="Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 DarAlTawhid-iOS/1.0 WKWebView";
const safari="Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
const android="Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const cases=[
 {name:"official-ios-native",uri:"/?native_ios=1#home",ua:iphone,header:"ios-native",width:390,height:844,home:"native-frontstage"},
 {name:"android-installed-pwa",uri:"/pwa/?pwa=1#home",ua:android,header:"android-pwa-app",width:412,height:915,home:"native-frontstage"},
 {name:"ios-ipad-native",uri:"/?native_ios=1#home",ua:"Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 DarAlTawhid-iOS/1.0 WKWebView",header:"ios-native",width:834,height:1112,home:"native-frontstage"},
 {name:"dar-test-ios",uri:"/test/#home",ua:safari,header:"",width:390,height:844,home:"native-frontstage"},
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function diagnose(page) {
 return page.evaluate(()=>{
  const f=window.DARFrauenNeufokusV1?.diagnostics?.()||null;
  const el=document.getElementById("darFrauenNeufokus48h");
  const home=document.getElementById("darHomeHtmlParityV1");
  const r=el?.getBoundingClientRect(),cs=el?getComputedStyle(el):null;
  return {href:location.href,hash:location.hash,body:document.body.className,
   appPath:document.documentElement.dataset.appPath,
   parity:!!home,parityStyle:home?getComputedStyle(home).display:null,
   legacy:!!document.getElementById("dv3Home"),
   script:!!document.getElementById("darFrauenNeufokusV1"),
   focus:f,visibility:cs?.visibility,display:cs?.display,
   rect:r?{w:r.width,h:r.height,x:r.x}:null};
 }).catch(e=>({error:String(e)}))
}
(async()=>{
 let browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const spec of cases){
   const ctx=await browser.newContext({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:2,
    isMobile:true,hasTouch:true,userAgent:spec.ua});
   const page=await ctx.newPage();
   let detail=null,header="",lastError="";
   for(let attempt=0;attempt<2;attempt++){
    const url=BASE+spec.uri.replace("#home","?global-focus-probe="+Date.now()+"#home").replace("??","?");
    // Do not accidentally add a second ? query to iOS /pwa roots.
    const link=new URL(BASE+spec.uri);
    link.searchParams.set("global_focus_probe",Date.now().toString());
    const res=await page.goto(link.toString(),{waitUntil:"domcontentloaded",timeout:45000});
    header=res?.headers()?.["x-dar-surface"]||res?.headers()?.["x-dar-test-app"]||"";
    try{
     await page.waitForFunction(()=>!!window.DARFrauenNeufokusV1,{timeout:14000});
     await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
     await page.locator("#darFrauenNeufokus48h").waitFor({state:"visible",timeout:16000});
     detail=await diagnose(page);
     break;
    }catch(e){
     lastError=String(e).slice(0,330);
     detail=await diagnose(page);
     console.log("GLOBAL SURFACE RETRY "+spec.name+" "+JSON.stringify({header,detail,lastError}).slice(0,2200));
     if(!attempt)await sleep(1500);
    }
   }
   if(spec.name==="dar-test-ios")
    assert.equal(detail?.appPath,"test","DĀR TEST must remain the isolated test UI: "+JSON.stringify({header,detail}));
   else
    assert.equal(header,spec.header,spec.name+" wrong Cloudflare branch: "+JSON.stringify({header,detail}));
   assert.ok(detail?.focus?.visible,spec.name+" global focus not visible: "+JSON.stringify({detail,lastError}));
   assert.equal(detail?.focus?.enabled,true,spec.name+" live 48h feed not active");
   assert.equal(detail?.focus?.indexReady,true,spec.name+" 16-entry list not loaded");
   assert.equal(detail?.focus?.home,spec.home,spec.name+" wrong home host");
   const card=page.locator("#darFrauenNeufokus48h"),box=await card.boundingBox();
   assert.ok(box?.width>145&&box?.height>140,spec.name+" editorial focus small/hidden");
   assert.ok(box.x>=-5&&box.x+box.width<=spec.width+5,spec.name+" focus clipped");
   assert.ok((await card.innerText()).includes("16"),spec.name+" count missing");
   // DĀR TEST has its own protected entry overlay. Do not obtain or
   // reverse-engineer its password; public tests can prove the card and
   // data are loaded underneath, but not authenticated user interaction.
   if(spec.name==="dar-test-ios"&&await page.locator("#darTestLock").isVisible()){
    console.log("PASS GLOBAL dar-test-ios "+JSON.stringify({
     visibleNativeFrontstage:true,entriesReady:detail.focus.indexReady,
     testGate:"protected: credentialed click test intentionally not attempted",
     host:detail.focus.host
    }));
    await ctx.close();continue;
   }
   await card.click();
   const items=page.locator("#darFrauenNeufokusIndex a.dar-frauen-index-link");
   await items.first().waitFor({timeout:9000});
   assert.equal(await items.count(),16,spec.name+" article index wrong count");
   const first=manifest.items[0];
   const target="#frauen/"+encodeURIComponent(first.area)+"/"+encodeURIComponent(first.id);
   assert.equal(await items.first().getAttribute("href"),target,spec.name+" native direct link wrong");
   await items.first().click();
   await page.waitForFunction(expected=>location.hash===expected,target,{timeout:15000});
   const reader=page.locator(".dar-frauen-production-root");
   try{await reader.waitFor({timeout:12000})}catch(error){
    const more=await page.evaluate(()=>({
      href:location.href,route:document.body.className,
      appPath:document.documentElement.dataset.appPath,
      appView:!!document.getElementById("appView"),
      appStyle:document.getElementById("appView")?getComputedStyle(document.getElementById("appView")).display:"",
      currentHash:location.hash,
      root:!!document.querySelector(".dar-frauen-production-root"),
      fraFiqhRuntime:!!window.DARFrauenFiqh,
      fraFiqhRender:typeof window.DARFrauenFiqh?.render,
      frauenAdapter:!!window.DARFrauenLiveAdapter,
      expectedScript:!!document.querySelector('script[src*="frauen-live-adapter.js"]'),
      content:document.getElementById("appView")?.innerText?.slice(0,470),
      nativeRoute:typeof window.readRoute==="function"?window.readRoute():null
    })).catch(e=>({error:String(e)}));
    console.error("GLOBAL FRAUEN READER DIAGNOSTICS "+spec.name+" "+JSON.stringify(more));
    throw error;
   }
   try{
    await page.waitForFunction(()=>{const e=document.querySelector(".dar-frauen-production-root");return e&&e.innerText.trim().length>150},{timeout:15000});
   }catch(_){}
   const readerText=await reader.innerText();
   console.log("GLOBAL ARTICLE "+spec.name+" "+JSON.stringify({length:readerText.length,excerpt:readerText.slice(0,500),href:await page.evaluate(()=>location.href)}));
   assert.ok(readerText.length>150,spec.name+" article reader content too short: "+JSON.stringify({length:readerText.length,excerpt:readerText.slice(0,250)}));
   console.log("PASS GLOBAL "+spec.name+" "+JSON.stringify({header,host:detail.focus.host,visible:true,entries:16,reader:target,chars:readerText.length}));
   await ctx.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error("GLOBAL NEWS/FOCUS QA FAILED:",e.stack||e);process.exitCode=1});
