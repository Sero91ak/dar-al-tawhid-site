#!/usr/bin/env node
"use strict";
/* Actual Chromium home-card interaction and expiry test. This only constructs
 * a local fixture; original publication states remain locked in GitHub.
 * Four responsive viewports and all nine localized labels. No push or deploy.
 */
const {chromium}=require("playwright");
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const launch=read("assets/frauen/frauen-neufokus-v1.json");
const focus=read("content/focus-feed/feed-index.json");
const code=fs.readFileSync(path.join(root,"assets/frauen/frauen-neufokus-v1.js"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/frauen/frauen-neufokus-v1.css"),"utf8");
const source=Object.fromEntries(launch.sourceFiles.map(p=>["/"+p,read(p)]));
const localeCatalog=read("assets/frauen/frauen-entry-locales-v1.json");
const learningHtml=fs.readFileSync(path.join(root,"lernen/frauen-wissen/index.html"),"utf8");
const id=launch.focusId,regions=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const viewports=[{name:"phone",width:390,height:844},{name:"fold",width:670,height:792},{name:"tablet",width:834,height:1112},{name:"desktop",width:1280,height:800}];
const date=Date.now(),start=new Date(date-120000).toISOString(),expires=new Date(date-120000+48*3600000).toISOString();
function snapshot(isPublic,locale) {
 const feed=JSON.parse(JSON.stringify(focus));
 const item=feed.items.find(e=>e.id===id);assert.ok(item);
 // An explicit draft fixture keeps the browser test valid after live release.
 item.status=isPublic?"live":"draft";
 item.startsAt=isPublic?start:item.startsAt;
 item.expiresAt=isPublic?expires:null;
 const docs=JSON.parse(JSON.stringify(source));
 for(const record of launch.items){
  const e=docs["/"+record.sourceFile].eintraege.find(x=>x.kennung===record.id);
  assert.ok(e);
  e.quellenstatus=isPublic?"geprueft":"nicht-anzeigen";
  e.freigabeDurchSerhat=true;
 }
 return {feed,docs,locale};
}
(async function(){
 let browser,verified=0;
 try {
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const viewport of viewports){
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
 const page=await context.newPage();let state=snapshot(false,"de"),errors=[];
 let corruptLocale=false,learningReady=true;
 page.on("pageerror",e=>errors.push(String(e)));
 await page.route("**/*",async route=>{
   const url=new URL(route.request().url()),pathname=url.pathname;
   if(pathname==="/"){
     return route.fulfill({status:200,contentType:"text/html",body:'<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="appView"><section id="dv3Home" style="max-width:min(calc(100% - 24px),850px);margin:auto"><button class="dv3-tawhid" style="display:block;width:100%;height:85px">Tawḥīd & ʿAqīdah</button><section>Neueste Beiträge</section></section></main></body></html>'});
   }
   if(pathname==="/assets/frauen/frauen-neufokus-v1.css")return route.fulfill({status:200,contentType:"text/css",body:css});
   if(pathname==="/content/focus-feed/feed-index.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(state.feed)});
   if(pathname==="/assets/frauen/frauen-neufokus-v1.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(launch)});
   if(pathname==="/assets/frauen/frauen-entry-locales-v1.json"){
     const data=JSON.parse(JSON.stringify(localeCatalog));
     if(corruptLocale)delete data.entries[launch.items[2].id].locales.ar;
     return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
   }
   if(pathname==="/lernen/frauen-wissen/"){
     return route.fulfill({status:learningReady?200:404,contentType:"text/html",body:learningReady?learningHtml:"Missing learning page"});
   }
   if(state.docs[pathname])return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(state.docs[pathname])});
   return route.fulfill({status:404,body:"Not found"});
 });
 await page.goto("https://dar-app.local/",{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>{
  window.__focusedRoute="";window.navigate=view=>{window.__focusedRoute=view};
  window.localStorage.setItem("darAdultPreferredLocaleV1","de");
  window.__testGender="neutral";
  window.DAR_VISITOR_SMART_PROFILE_V1={get:()=>({gender:window.__testGender})};
  // Capture genuine 48h timers while keeping this local Chromium fixture fast.
  const schedule=window.setTimeout.bind(window),cancel=window.clearTimeout.bind(window);
  window.__expiryCallbacks=new Map();let nextId=-100;
  window.setTimeout=(fn,delay,...args)=>{
   if(typeof fn==="function"&&delay>3600000){
    const id=nextId--;window.__expiryCallbacks.set(id,{fn,delay});return id;
   }
   return schedule(fn,delay,...args);
  };
  window.clearTimeout=id=>{
   if(window.__expiryCallbacks.delete(id))return;
   cancel(id);
  };
 });
 await page.addScriptTag({content:code});
 await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
 assert.equal(await page.locator("#darFrauenNeufokus48h").count(),0,"Draft banner visible on "+viewport.name);
 // A forged admin card with all 16 still hidden cannot bypass the public source gate.
 state=snapshot(true,"de");for(const p of Object.keys(state.docs))for(const e of state.docs[p].eintraege||[])if(launch.items.some(x=>x.id===e.kennung))e.quellenstatus="nicht-anzeigen";
 await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
 assert.equal(await page.locator("#darFrauenNeufokus48h").count(),0,"Hidden articles leaked into "+viewport.name);
 state=snapshot(true,"de");
 corruptLocale=true;
 await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
 assert.equal(await page.locator("#darFrauenNeufokus48h").count(),0,"Missing language must block focus on "+viewport.name);
 corruptLocale=false;
 learningReady=false;
 await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
 assert.equal(await page.locator("#darFrauenNeufokus48h").count(),0,"Missing lesson must block focus on "+viewport.name);
 learningReady=true;
 await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
 const banner=page.locator("#darFrauenNeufokus48h");
 await banner.waitFor({timeout:10000});
 assert.ok(await banner.isVisible(),viewport.name+" focus not visible");
 for(const gender of ["man","woman","neutral"]){
  await page.evaluate(gender=>{window.__testGender=gender;document.dispatchEvent(new Event("dar:visitor-profile-changed"))},gender);
  await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
  assert.ok(await banner.isVisible(),viewport.name+" spotlight hidden for "+gender+" profile");
 }
 assert.ok((await banner.innerText()).includes("16 neue Frauenbeiträge"));
 await banner.click();
 const modal=page.locator("#darFrauenNeufokusIndex");
 await modal.waitFor({timeout:10000});
 assert.equal(await modal.locator("a.dar-frauen-index-link").count(),16,
  viewport.name+" must open precisely 16 canonical release articles");
 assert.equal(await modal.locator("a.dar-frauen-index-link").first().getAttribute("href"),
  "#frauen/sahabiyyat/sahabiyyat-umm-haram-seeueberfahrt-20261106",
  viewport.name+" first release link is not the canonical reader");
 await modal.locator("a.dar-frauen-index-link").first().click();
 assert.equal(await page.evaluate(()=>window.location.hash),
  "#frauen/sahabiyyat/sahabiyyat-umm-haram-seeueberfahrt-20261106",
  viewport.name+" clicking a post must open its direct in-app route");
 assert.equal(await modal.count(),0,viewport.name+" article selection must close index");
 assert.equal(await page.evaluate(()=>window.__focusedRoute),"",
  "The global home focus must not jump directly to the generic Frauen hub");
 const measured=await banner.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,right:el.getBoundingClientRect().right,windowWidth:window.innerWidth}));
 assert.ok(measured.width>0&&measured.height>=135,viewport.name+" focus too small");
 assert.ok(measured.right<=measured.windowWidth+2,viewport.name+" focus horizontally clipped");
 for(const lang of regions){
  await page.evaluate(v=>{localStorage.setItem("darAdultPreferredLocaleV1",v);window.dispatchEvent(new Event("dar-adult-locale-changed"))},lang);
  assert.equal(await banner.getAttribute("lang"),lang,"Wrong displayed locale "+lang);
  assert.equal(await banner.getAttribute("dir"),["ar","ckb"].includes(lang)?"rtl":"ltr","Wrong focus direction "+lang);
  assert.ok((await banner.locator(".focus-title").innerText()).trim().length>=10,lang+" missing translated title");
  verified++;
 }
 // The public card must also disappear from the registered one-shot timeout;
 // there must be no extra wait until the 60-second background refresh.
 const timing=await page.evaluate(()=>[...window.__expiryCallbacks.values()].map(x=>x.delay));
 assert.equal(timing.length,1,viewport.name+" precise expiry callback not scheduled");
 assert.ok(timing[0]>3600000&&timing[0]<=48*3600000,viewport.name+" invalid 48h timer");
 await page.evaluate(expiryDate=>{
  const scheduled=[...window.__expiryCallbacks.values()][0];
  const normal=Date.now;
  Date.now=()=>expiryDate+1;scheduled.fn();Date.now=normal;
 },Date.parse(expires));
 assert.equal(await banner.count(),0,viewport.name+" focus not removed by its precise deadline timer");
 // 48h starts only from server publication and must expire without leaving stale card.
 state.feed.items.find(x=>x.id===id).expiresAt=new Date(date-60*1000).toISOString();
 await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
 assert.equal(await banner.count(),0,viewport.name+" expired card remained visible");
 assert.deepEqual(errors,[],viewport.name+" browser errors: "+errors.join("; "));
 await context.close();
 }
 assert.equal(verified,36);
 for(const row of launch.items){
  const a=source["/"+row.sourceFile].eintraege.find(x=>x.kennung===row.id);
  assert.equal(a.quellenstatus,"nicht-anzeigen");
 }
 assert.equal(focus.items.find(x=>x.id===id).status,"draft");
 console.log("PASS Frauen home 16-index: global male/female/neutral, 4 Chromium responsive layouts, 36 localized cards (RTL), all 16 direct canonical reader links and navigation, source/expiry fail-closed, unchanged repository data.");
 }finally{if(browser)await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
