#!/usr/bin/env node
"use strict";
/* Real browser, real public website. Read only: no publish, no push.
 * Detects the original #dv3Home-only false positive on the actual #pageRoot.
 */
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const BASE=process.env.FRAUEN_LIVE_BASE||"https://dar-al-tawhid.de";
const manifest=require("../assets/frauen/frauen-neufokus-v1.json");
const feed=require("../content/focus-feed/feed-index.json");
const focus=feed.items.find(x=>x.id===manifest.focusId);
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
(async()=>{
 if(!focus||focus.status!=="live"||Date.now()>=Date.parse(focus.expiresAt)||Date.now()<Date.parse(focus.startsAt)){
  console.log("SKIP public focus browser proof: no active 48h release window");return;
 }
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const cfg of [{name:"desktop-browser",width:1280,height:800},{name:"mobile-browser",width:390,height:844}]){
   const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height}});
   const page=await context.newPage();
   let observed=null,lastError="";
   for(let attempt=1;attempt<=12;attempt++){
    try{
     await page.goto(BASE+"/?page=start&frauen-live-visual="+Date.now(),{waitUntil:"domcontentloaded",timeout:30000});
     await page.locator("#pageRoot").waitFor({timeout:12000});
     await page.waitForFunction(()=>!!window.DARFrauenNeufokusV1,{timeout:12000});
     await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
     await page.locator("#pageRoot #darFrauenNeufokus48h").waitFor({timeout:12000,state:"visible"});
     observed=await page.evaluate(()=>window.DARFrauenNeufokusV1.diagnostics());
     break;
    }catch(error){
     lastError=String(error).slice(0,1300);
     observed=await page.evaluate(()=>({
      root:!!document.getElementById("pageRoot"),
      nativeRoot:!!document.getElementById("dv3Home"),
      page:document.body?.dataset?.darV8Route,
      focus:window.DARFrauenNeufokusV1?.diagnostics?.()||null,
      hasScript:!!document.getElementById("darFrauenNeufokusV1")
     })).catch(()=>null);
     console.log("Retry "+attempt+" "+cfg.name+" "+JSON.stringify({lastError,observed}));
     if(attempt<12)await sleep(8000);
    }
   }
   assert.ok(observed?.cardPresent,cfg.name+" missing real public homepage focus; "+JSON.stringify({observed,lastError}));
   assert.equal(observed.home,"website");
   const card=page.locator("#pageRoot #darFrauenNeufokus48h");
   assert.ok((await card.innerText()).includes("16"),cfg.name+" focus label missing");
   await card.click();
   const list=page.locator("#darFrauenNeufokusIndex a.dar-frauen-index-link");
   await list.first().waitFor({timeout:10000});
   assert.equal(await list.count(),16,cfg.name+" must display exactly 16 new entries");
   const target=await list.first().getAttribute("href");
   assert.ok(/^\/wissen\/beitrag\/\?id=[a-z0-9-]+&lang=de$/.test(target),cfg.name+" first article is not permanent non-Q reader link");
   await list.first().click();
   try{
    await page.locator("#darNonQReader[data-canonical-content-id]").waitFor({timeout:18000,state:"visible"});
   }catch(error){
    const diagnostic=await page.evaluate(()=>({
     location:location.href,pathname:location.pathname,search:location.search,
     bodyRoute:document.body?.dataset?.darV8Route,
     pageRoot:!!document.getElementById("pageRoot"),
     womenReal:!!document.getElementById("womenReal"),
     womenRealText:document.getElementById("womenReal")?.innerText?.slice(0,500),
     detailScriptTag:!!document.getElementById("darFrauenDesktopEntryV1"),
     detailRuntime:!!window.DARFrauenDesktopEntryV1,
     homeRuntime:!!window.DARFrauenNeufokusV1,
     index:document.documentElement?.outerHTML?.includes("dar-frauen-desktop-entry-v1.js")
    })).catch(e=>({error:String(e)}));
    console.error("ACTUAL DESKTOP DETAIL DIAGNOSTICS:",JSON.stringify(diagnostic));
    throw error;
   }
   const actual=await page.locator("#darNonQReader[data-canonical-content-id]").getAttribute("data-canonical-content-id");
   assert.equal(actual,manifest.items[0].id,cfg.name+" direct reader selected wrong article");
   console.log("PASS LIVE PUBLIC "+cfg.name+": card, 16 links, first canonical reader, URL "+target);
   await context.close();
  }
 }finally{if(browser)await browser.close()}
})().catch(e=>{console.error("LIVE PUBLIC FRAUEN HOME QA FAILED:",e.stack||e);process.exitCode=1});
