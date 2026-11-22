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
const websiteReader=fs.readFileSync(path.join(root,"assets/frauen/frauen-desktop-entry-v1.js"),"utf8");
const source=Object.fromEntries(launch.sourceFiles.map(p=>["/"+p,read(p)]));
const originalStatus=new Map(launch.items.map(row=>[row.id,
 source["/"+row.sourceFile].eintraege.find(e=>e.kennung===row.id)?.quellenstatus]));
const localeCatalog=read("assets/frauen/frauen-entry-locales-v1.json");
const learningHtml=fs.readFileSync(path.join(root,"lernen/frauen-wissen/index.html"),"utf8");
const id=launch.focusId,regions=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const originalFocusStatus=focus.items.find(x=>x.id===id)?.status;
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
     return route.fulfill({status:200,contentType:"text/html",body:'<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="is-home-route"><main id="appView"><section id="dv3Home" style="max-width:min(calc(100% - 24px),850px);margin:auto"><button class="dv3-tawhid" style="display:block;width:100%;height:85px">Tawḥīd & ʿAqīdah</button><section>Neueste Beiträge</section></section></main></body></html>'});
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
 await page.goto("https://dar-app.local/#home",{waitUntil:"domcontentloaded"});
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
 const measured=await banner.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,right:el.getBoundingClientRect().right,windowWidth:window.innerWidth}));
 assert.ok(measured.width>0&&measured.height>=135,viewport.name+" focus too small");
 assert.ok(measured.right<=measured.windowWidth+2,viewport.name+" focus horizontally clipped");
 await banner.click();
 const modal=page.locator("#darFrauenNeufokusIndex");
 await modal.waitFor({timeout:10000});
 assert.equal(await modal.locator("a.dar-frauen-index-link").count(),16,
  viewport.name+" must open precisely 16 canonical release articles");
 assert.equal(await modal.locator("a.dar-frauen-index-link").first().getAttribute("href"),
 "/wissen/beitrag/?id=sahabiyyat-umm-haram-seeueberfahrt-20261106&lang=de",
 viewport.name+" focus entry must link to universal nine-language non-Q reader");
 await modal.locator(".dar-frauen-index-close").click();
 assert.equal(await modal.count(),0,viewport.name+" focus dialog must close correctly");
 await banner.waitFor({state:"visible",timeout:10000});
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
 // Real public desktop/mobile website uses #pageRoot, never #dv3Home.
 // This guards against the original bug where tests only mocked the native home.
 for(const websiteViewport of [{name:"public-desktop",width:1280,height:800},{name:"public-mobile",width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:websiteViewport.width,height:websiteViewport.height}});
  const page=await context.newPage(),issues=[];
  page.on("pageerror",e=>issues.push(String(e)));
  page.route("**/*",async route=>{
   const u=new URL(route.request().url()),p=u.pathname,key=u.searchParams.get("page")||"start";
   if(p==="/"){
    const body=key==="frauen"
     ?'<main id="pageRoot"><section class="page-intro">Frauen im Islam</section><section class="v8-women-layout">Aktuelle V8-Frauenrubrik ohne alten womenReal-Container</section></main>'
     :'<main id="pageRoot"><section class="page-intro">DĀR AL TAWḤĪD Startseite</section><section>Wissensgrundlagen</section></main>';
    return route.fulfill({status:200,contentType:"text/html",body:'<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="dar-v8-home" data-dar-v8-route="'+key+'">'+body+'<script defer src="/assets/frauen/frauen-neufokus-v1.js"></script><script defer src="/assets/frauen/frauen-desktop-entry-v1.js"></script></body></html>'});
   }
   if(p==="/assets/frauen/frauen-neufokus-v1.js")return route.fulfill({status:200,contentType:"application/javascript",body:code});
   if(p==="/assets/frauen/frauen-desktop-entry-v1.js")return route.fulfill({status:200,contentType:"application/javascript",body:websiteReader});
   if(p==="/assets/frauen/frauen-neufokus-v1.css")return route.fulfill({status:200,contentType:"text/css",body:css});
   if(p==="/content/focus-feed/feed-index.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(snapshot(true,"de").feed)});
   if(p==="/assets/frauen/frauen-neufokus-v1.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(launch)});
   if(p==="/assets/frauen/frauen-entry-locales-v1.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(localeCatalog)});
   if(p==="/lernen/frauen-wissen/")return route.fulfill({status:200,contentType:"text/html",body:learningHtml});
   if(source[p])return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(source[p])});
   return route.fulfill({status:404,body:"Not found"});
  });
  await page.goto("https://dar-app.local/?page=start",{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
  const card=page.locator("#pageRoot > #darFrauenNeufokus48h");
  await card.waitFor({timeout:10000});
  assert.ok(await card.isVisible(),websiteViewport.name+" real #pageRoot focus invisible");
  const dimensions=await card.evaluate(e=>({width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}));
  assert.ok(dimensions.width>0&&dimensions.right<=websiteViewport.width+3,websiteViewport.name+" focus offscreen");
  await card.click();
  const modal=page.locator("#darFrauenNeufokusIndex");
  await modal.waitFor();
  assert.equal(await modal.locator("a.dar-frauen-index-link").count(),16,websiteViewport.name+" missing release links");
  for(const [index,entry] of launch.items.entries()){
  const expected="/wissen/beitrag/?id="+encodeURIComponent(entry.id)+"&lang=de";
  assert.equal(await modal.locator("a.dar-frauen-index-link").nth(index).getAttribute("href"),expected,
   websiteViewport.name+" article "+(index+1)+" should open Q-style standalone reader");
 }
 await modal.locator(".dar-frauen-index-close").click();
 await page.goto("https://dar-app.local/?page=wisssen",{waitUntil:"domcontentloaded"});
  assert.equal(await page.locator("#darFrauenNeufokus48h").count(),0,websiteViewport.name+" focus leaked onto unrelated website page");
  assert.deepEqual(issues,[],websiteViewport.name+" JS errors: "+issues.join("; "));
  await context.close();
 }

 // The ACTUAL Android-native visitor home is #darHomeHtmlParityV1, a sibling
 // of the hidden legacy #appView. This exact omission caused the live outage.
 {
  const ctx=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  const docs=snapshot(true,"de");
  await page.route("**/*",async route=>{
   const u=new URL(route.request().url()),p=u.pathname;
   if(p==="/")return route.fulfill({status:200,contentType:"text/html",body:
    '<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>'+
    '<body class="is-home-route">'+
    '<main id="appView" style="display:none"><section id="dv3Home">hidden legacy</section><section class="home-v380-shell">hidden</section></main>'+
    '<section id="darHomeHtmlParityV1" style="display:block;padding:15px;width:100%;box-sizing:border-box">'+
    '<div class="dhp-content"><div class="dhp-welcome" style="height:65px">Aktueller DĀR Start</div>'+
    '<div class="dhp-search-box" style="height:48px">Wissen suchen</div><div class="dhp-quran-section">Qurʾān</div></div></section>'+
    '</body></html>'});
   if(p==="/assets/frauen/frauen-neufokus-v1.css")return route.fulfill({status:200,contentType:"text/css",body:css});
   if(p==="/content/focus-feed/feed-index.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(docs.feed)});
   if(p==="/assets/frauen/frauen-neufokus-v1.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(launch)});
   if(p==="/assets/frauen/frauen-entry-locales-v1.json")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(localeCatalog)});
   if(p==="/lernen/frauen-wissen/")return route.fulfill({status:200,contentType:"text/html",body:learningHtml});
   if(docs.docs[p])return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(docs.docs[p])});
   return route.fulfill({status:404,body:"not found"});
  });
  await page.goto("https://dar-app.local/#home",{waitUntil:"domcontentloaded"});
  await page.addScriptTag({content:code});
  await page.evaluate(()=>window.DARFrauenNeufokusV1.refresh());
  const current=page.locator("#darHomeHtmlParityV1 .dhp-content > #darFrauenNeufokus48h");
  await current.waitFor({state:"visible",timeout:10000});
  assert.equal(await page.locator("#appView #darFrauenNeufokus48h").count(),0,
    "Never mount in the hidden legacy native #appView");
  assert.equal((await page.evaluate(()=>window.DARFrauenNeufokusV1.diagnostics())).home,"native-frontstage");
  assert.ok(await current.isVisible(),"Native parity home-focus must be visible to visitors");
  await current.click();
  const links=page.locator("#darFrauenNeufokusIndex a.dar-frauen-index-link");
  await links.first().waitFor();
  assert.equal(await links.count(),16,"Actual native parity focus needs all 16 direct routes");
  assert.ok((await links.first().getAttribute("href")).startsWith("/wissen/beitrag/?id="),
    "Native parity must retain existing Frauen reader route");
  await ctx.close();
 }
 assert.equal(verified,36);
 for(const row of launch.items){
  const a=source["/"+row.sourceFile].eintraege.find(x=>x.kennung===row.id);
  assert.equal(a.quellenstatus,originalStatus.get(row.id),"Browser fixture must not mutate source state");
 }
 assert.equal(focus.items.find(x=>x.id===id).status,originalFocusStatus,"The browser fixture must not mutate the real repository focus status");
 console.log("PASS Frauen 48h: native 4 viewports/36 locale cards, real visible parity frontstage with hidden legacy appView; public website #pageRoot on desktop+mobile; 16 direct canonical desktop readers each, global profiles, RTL, source/expiry fail-closed, immutable registry.");
 }finally{if(browser)await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
