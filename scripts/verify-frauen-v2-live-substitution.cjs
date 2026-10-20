#!/usr/bin/env node
"use strict";
/* Read-only production HTML probe with browser-local script replacement.
 * The public website continues serving its frozen adapter. No cookies from
 * real users, no authentication bypass, no writes or deployment. */
const {chromium,webkit}=require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const variant=fs.readFileSync(path.join(root,"assets/frauen/frauen-live-adapter-scroll-safe-v2.js"),"utf8");
const stickyCSS=fs.readFileSync(path.join(root,"assets/frauen/frauen-sticky-scroll-safe-v2.css"),"utf8");
const stickyJS=fs.readFileSync(path.join(root,"assets/frauen/frauen-sticky-scroll-safe-v2.js"),"utf8");
const out=path.join(root,"frauen-v2-real-site-evidence");
fs.mkdirSync(out,{recursive:true});
const targets=[
 {id:"ios-native-webkit",engine:webkit,width:393,height:852,mobile:true,ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS"},
 {id:"android-pwa-chromium",engine:chromium,width:412,height:915,mobile:true,url:"https://dar-al-tawhid.de/pwa/?v2SafetyAudit=20261018#frauen",ua:"Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"},
 {id:"ios-chromium-control",engine:chromium,width:393,height:852,mobile:true,ua:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS"}
];
const results=[],failures=[];
function probe(){
 const app=document.getElementById("appView"),
 hero=app?.querySelector(".frauen-library-hero"),
 search=app?.querySelector(".frauen-library-search-wrap,.frauen-library-list-controls"),
 input=search?.querySelector("input"),
 card=app?.querySelector(".frauen-library-card,.frauen-library-area-card");
 const rc=e=>{const r=e?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,height:r.height,width:r.width}:null};
 return {url:location.href,htmlClass:document.documentElement.className,
   bodyClass:document.body.className,view:document.body.dataset.frauenView,
   scroll:window.scrollY,appOverflow:app?getComputedStyle(app).overflowY:null,
   hero:rc(hero),heroBackground:hero?getComputedStyle(hero).backgroundImage.slice(0,380):null,
   heroPosition:hero?getComputedStyle(hero).position:null,heroParent:hero?.parentElement?.className,
   search:rc(search),searchPosition:search?getComputedStyle(search).position:null,
   searchStickyTop:search?getComputedStyle(search).top:null,input:!!input,
   card:rc(card),legacyStage:document.querySelectorAll(".dar-immersive-hero-stage").length,
   passwordGate:!!document.querySelector("input[type=password]")};
}
async function scenario(target){
 const ctxName=target.id, browser=await target.engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:target.width,height:target.height},
   deviceScaleFactor:2,isMobile:target.mobile,hasTouch:target.mobile,
   userAgent:target.ua,serviceWorkers:"block",locale:"de-DE"});
 const page=await context.newPage(),errors=[],images=[];let replaced=0;let outcome={id:ctxName};
 page.on("pageerror",err=>errors.push(err.message.slice(0,350)));
 page.on("response",r=>{if(/\/frauen\/library-v1224\/03-erste-generationen\.jpg/.test(r.url()))images.push(r.status());});
 await page.route("**/assets/frauen/frauen-live-adapter.js*",async(route)=>{
    replaced++;
    await route.fulfill({status:200,contentType:"text/javascript",body:variant});
 });
 try{
   const url=target.url||"https://dar-al-tawhid.de/?v2SafetyAudit=20261018#frauen";
   const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
   if(response?.status()!==200)throw Error("HTTP status "+response?.status());
   await page.waitForFunction(()=>document.querySelector("#appView .frauen-library-hero")&&document.body.classList.contains("is-frauen-route"),{timeout:20000});
   await page.waitForTimeout(2000);
   // The Android PWA mounts the Frauen renderer directly and does not request
   // the iOS/native adapter. Its sticky/scroll CSS is checked independently;
   // never claim it received the native adapter.
   if(!replaced&&ctxName!=="android-pwa-chromium")
     throw Error("V2 adapter was NOT substituted on native iOS route");
   if(ctxName==="android-pwa-chromium"&&replaced)
     throw Error("Unexpected PWA adapter routing change; inspect independently");
   await page.evaluate(()=>document.documentElement.setAttribute("data-dar-frauen-scroll-safe","1"));
   await page.addStyleTag({content:stickyCSS});
   await page.addScriptTag({content:stickyJS});
   await page.waitForFunction(()=>!!document.querySelector(".frauen-library-shell[style*='--dar-frauen-search-sticky-top']"),{timeout:10000});
   const before=await page.evaluate(probe);
   if(!before.hero||before.hero.height<230)throw Error("Missing Frauen Hero");
   if(!before.heroBackground?.includes("03-erste-generationen.jpg"))throw Error("Original Frauen photo missing");
   if(before.heroPosition!=="sticky"||before.searchPosition!=="sticky")throw Error("Hero/Search sticky not applied "+JSON.stringify(before));
   if(before.legacyStage)throw Error("V1 DOM reparenting detected");
   if(before.appOverflow!=="visible")throw Error("Nested overflow still captures sticky: "+JSON.stringify(before));
   await page.screenshot({path:path.join(out,ctxName+"-before.png")});
   await page.evaluate(()=>window.scrollTo(0,620));
   await page.waitForTimeout(420);
   const after=await page.evaluate(probe);
   if(after.scroll<250)throw Error("Scroll reset during actual app render: "+JSON.stringify({before,after}));
   if(Math.abs(after.hero.top)>4)throw Error("Hero moved instead of pinning: "+after.hero.top);
   const ideal=parseFloat(after.searchStickyTop)||0;
   if(Math.abs(after.search.top-ideal)>5)throw Error("Search not pinned to Hero: "+JSON.stringify({actual:after.search.top,target:ideal}));
   if(after.card&&after.card.top>=before.card.top-120)throw Error("Cards did not scroll beneath Hero");
   await page.screenshot({path:path.join(out,ctxName+"-scroll.png")});
   const oldHero=await page.evaluate(()=>{window.__stickyV2Hero=document.querySelector("#appView .frauen-library-hero");return document.scrollingElement.scrollTop});
   await page.evaluate(()=>{if(typeof window.render==="function")window.render()});
   await page.waitForTimeout(300);
   const again=await page.evaluate(()=>({scroll:document.scrollingElement.scrollTop,sameHero:window.__stickyV2Hero===document.querySelector("#appView .frauen-library-hero")}));
   if(ctxName==="android-pwa-chromium"&&!again.sameHero){
     const diagnostic=await page.evaluate(()=>({
       windowRender:(String(window.render||"")).slice(0,1900),
       route:typeof window.readRoute==="function"?window.readRoute():null,
       frauApi:!!window.DARFrauenFiqh,
       parent:document.querySelector("#appView .frauen-library-hero")?.parentElement?.className||null
     }));
     console.log("FRAUEN_ANDROID_DIRECT_RENDER_DIAGNOSTIC "+JSON.stringify(diagnostic).slice(0,3200));
   }
   if(Math.abs(again.scroll-oldHero)>5||!again.sameHero)throw Error("Same-route render still resets/remounts "+JSON.stringify(again));
   await page.evaluate(()=>window.scrollTo(0,0));
   const locator=page.locator("#appView .frauen-library-search-wrap [data-frauen-q],#appView .frauen-library-list-controls [data-frauen-q]").first();
   await locator.fill("Fiqh",{timeout:8000});
   await page.waitForTimeout(360);
   const query=await page.locator("#appView [data-frauen-q]").first().inputValue({timeout:4000});
   // The protected Frauen renderer intentionally canonicalizes search text to
   // lowercase (setQ(currentAbschnitt, v.toLowerCase())). Case is not lost content.
   if(query.toLocaleLowerCase("de")!=="fiqh")throw Error("Search input lost user text: "+query);
   await page.screenshot({path:path.join(out,ctxName+"-search.png")});
   outcome={id:ctxName,pass:true,replaced,before:{hero:before.hero,search:before.search},after:{hero:after.hero,search:after.search,scroll:after.scroll},typing:query,renderStable:true,imageRequests:images,errors};
   if(errors.some(x=>/TypeError|ReferenceError|SyntaxError/.test(x)))throw Error("JS errors: "+errors.join(" | "));
   console.log("FRAUEN_REAL_SUBSTITUTION_PASS "+JSON.stringify(outcome).slice(0,4500));
 }catch(err){
   outcome={id:ctxName,pass:false,replaced,error:String(err.stack||err).slice(0,1100),errors,images};
   failures.push(outcome);
   console.error("FRAUEN_REAL_SUBSTITUTION_FAIL "+JSON.stringify(outcome).slice(0,3000));
   try{await page.screenshot({path:path.join(out,ctxName+"-FAIL.png")})}catch(e){}
 }finally{
   results.push(outcome);
   await context.close();await browser.close();
 }
}
(async()=>{
 for(const target of targets)await scenario(target);
 fs.writeFileSync(path.join(out,"results.json"),JSON.stringify({results,failures},null,2));
 console.log("FRAUEN_REAL_SUBSTITUTION_SUMMARY "+JSON.stringify({passed:results.filter(x=>x.pass).length,failed:failures.length}));
 if(failures.length)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
