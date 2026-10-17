#!/usr/bin/env node
"use strict";
/* Mobile browser regression: visitor Frauen hero, real scroll and navigation.
   Preserve image/card/navigation logic; record actual computed layout on screen. */
const { chromium } = require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const out=path.join(process.cwd(),"frauen-hero-live-evidence");
fs.mkdirSync(out,{recursive:true});
const all=[];
const routes=[
  {key:"visitor",url:"https://dar-al-tawhid.de/?frauen-scroll-probe=1396#frauen"}
];
function snapshot(){
  const hero=document.querySelector(".frauen-library-pinned-header .frauen-library-hero");
  const stage=document.querySelector(".frauen-library-pinned-header");
  const heading=document.querySelector(".frauen-library-section-head");
  const app=document.querySelector("#appView");
  const shell=document.querySelector(".frauen-library-shell");
  const doc=document.scrollingElement;
  const pick=e=>{
    if(!e)return null;
    const r=e.getBoundingClientRect(),c=getComputedStyle(e);
    return {tag:e.tagName,id:e.id,classes:String(e.className).slice(0,180),
      top:Math.round(r.top),bottom:Math.round(r.bottom),
      left:Math.round(r.left),right:Math.round(r.right),
      width:Math.round(r.width),height:Math.round(r.height),
      display:c.display,visibility:c.visibility,opacity:c.opacity,
      position:c.position,overflowX:c.overflowX,overflowY:c.overflowY,
      backgroundImage:c.backgroundImage.slice(0,420),zIndex:c.zIndex,
      scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,
      clipPath:c.clipPath,transform:c.transform,
      parent:e.parentElement?String(e.parentElement.className).slice(0,120):""};
  };
  let ancestors=[];
  if(hero){for(let x=hero,n=0;x&&n<12;x=x.parentElement,n++)ancestors.push(pick(x));}
  return {hash:location.hash,theme:document.documentElement.getAttribute("data-theme"),
    bodyClass:document.body?.className,view:document.body?.getAttribute("data-frauen-view"),
    docScroll:doc?.scrollTop,windowY:scrollY,viewport:{w:innerWidth,h:innerHeight},
    hero:pick(hero),stage:pick(stage),heading:pick(heading),
    body:pick(document.body),html:pick(document.documentElement),
    safeGuardLoaded:!!window.__darFrauenHeroSafeEventsV1395,
    modalDiagnostics:[...document.querySelectorAll('dialog[open],[role="dialog"][aria-modal="true"]')].slice(0,8).map(e=>({
      html:e.outerHTML.slice(0,260),rects:e.getClientRects().length,visible:getComputedStyle(e).visibility,
      display:getComputedStyle(e).display,pointer:getComputedStyle(e).pointerEvents
    })),
    inlineStyles:{body:document.body?.getAttribute("style"),html:document.documentElement?.getAttribute("style")},
    app:pick(app),shell:pick(shell),ancestors,
    heroHtml:hero?.outerHTML.slice(0,400),
    shellChildren:shell?[...shell.children].slice(0,7).map(x=>({tag:x.tagName,cls:String(x.className).slice(0,150),head:x.outerHTML.slice(0,260)})):[],
    renderer:(()=>{
      try{
        const p=window.DARFrauenFiqh;
        const html=typeof p?.render==="function"?String(p.render("")):"";
        return {exists:!!p,render:typeof p?.render,
          generatedLength:html.length,generatedHero:html.includes("frauen-library-hero"),
          generatedStage:html.includes("frauen-library-pinned-header"),
          generatedHeader:html.slice(0,330)};
      }catch(e){return {error:String(e)}}
    })(),
    images:[...document.querySelectorAll(".frauen-library-card.has-visual")].slice(0,2).map(pick),
    scripts:[...document.querySelectorAll('script[src*="frauen-fiqh.js"]')].map(x=>x.src),
styles:[...document.querySelectorAll('link[rel="stylesheet"]')].filter(x=>/frauen/.test(x.href)).map(x=>x.href)};
}
(async()=>{
 let browser;let issues=[];
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const route of routes){
   const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"de-DE",userAgent:route.key==="visitor"?"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1"});
   const page=await context.newPage();const errors=[];
   const intercepted={document:0,visitorJs:0,visitorCss:0,removedLegacy:0};
   // Single navigation-aware interceptor: verify the same native iOS HTML
   // transformation as site-router and serve exact branch JS/CSS assets.
   await page.route("**/*",async requestRoute=>{
     const request=requestRoute.request();
     const url=new URL(request.url());
     const pathname=url.pathname;
     if(request.resourceType()==="document"&&pathname==="/"&&url.hostname==="dar-al-tawhid.de"){
       const response=await requestRoute.fetch();
       let html=await response.text();
       const legacy=/<script\b[^>]*\bsrc=["']\/test\/assets\/frauen\/frauen-fiqh\.js[^"']*["'][^>]*>\s*<\/script\s*>/gi;
       intercepted.removedLegacy=(html.match(legacy)||[]).length;
       html=html.replace(legacy,"");
       html=html.replace(/<link\b[^>]*\bhref=["']\/test\/assets\/frauen\/frauen-(?:fiqh|authority-v1292)\.css[^"']*["'][^>]*>/gi,"");
       html=html.replace(/<script\b[^>]*\bsrc=["']\/assets\/frauen\/frauen-fiqh\.js[^"']*["'][^>]*>\s*<\/script\s*>/gi,"");
       const newScript='<script defer src="/assets/frauen/frauen-fiqh.js?v=visitor-frauen-scroll-v1396"></script>';
       const adapter=/(<script\b[^>]*\bsrc=["']\/assets\/frauen\/frauen-live-adapter\.js[^"']*["'][^>]*>\s*<\/script\s*>)/i;
       if(!adapter.test(html))throw Error("Visitor production adapter script tag missing");
       html=html.replace(adapter,newScript+"$1");
       html=html.replace("/assets/frauen/frauen-authority-v1292.css?v=frauen-hero-v1390",
                         "/assets/frauen/frauen-authority-v1292.css?v=visitor-frauen-scroll-v1396");
       intercepted.document++;
       await requestRoute.fulfill({response,body:html});
       return;
     }
     if(pathname==="/assets/frauen/frauen-fiqh.js"){
       intercepted.visitorJs++;
       await requestRoute.fulfill({status:200,contentType:"application/javascript; charset=utf-8",
         body:fs.readFileSync(path.join(process.cwd(),"assets/frauen/frauen-fiqh.js"))});
       return;
     }
     if(pathname==="/assets/frauen/frauen-authority-v1292.css"){
       intercepted.visitorCss++;
       await requestRoute.fulfill({status:200,contentType:"text/css; charset=utf-8",
         body:fs.readFileSync(path.join(process.cwd(),"assets/frauen/frauen-authority-v1292.css"))});
       return;
     }
     if(pathname.startsWith("/test/assets/frauen/")&&
       /frauen-(?:fiqh|authority-v1292)\.(?:js|css)$/.test(pathname))
       throw Error("Native visitor still attempts to load a Test Frauen asset: "+pathname);
     await requestRoute.continue();
   });
   page.on("pageerror",e=>errors.push(String(e.message).slice(0,300)));
   const response=await page.goto(route.url,{waitUntil:"domcontentloaded",timeout:60000});
   console.log("VISITOR_LOAD_INTERCEPTED",JSON.stringify(intercepted));
   if(intercepted.document!==1||intercepted.visitorJs!==1||intercepted.visitorCss<1||intercepted.removedLegacy<1)throw Error("Visitor runtime load paths did not match expected native HTML: "+JSON.stringify(intercepted));
   await page.waitForTimeout(6000);
   let before=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-initial.png")});
   // Modified resources were intercepted on initial load, not injected later.
   await page.waitForTimeout(1100);
   let repaired=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-repaired.png")});

   // Real finger gesture, not a programmatic scrollTop assignment.
   const cdp=await context.newCDPSession(page);
   const startX=165,fromY=686,toY=297;
   await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:startX,y:fromY}]});
   for(let step=1;step<=14;step++){
     await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{
       x:startX,y:Math.round(fromY+(toY-fromY)*step/14)}]});
     await page.waitForTimeout(21);
   }
   await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
   await page.waitForTimeout(650);
   let afterTouch=await page.evaluate(snapshot);
   // Cross-check whether the browser actually exposes a scrolling root:
   // CDP touch synthesis may not scroll under a spoofed WebKit user-agent.
   await page.mouse.wheel(0,560);
   await page.waitForTimeout(300);
   let after=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-after-scroll.png")});
   all.push({key:route.key,status:response.status(),before,repaired,afterTouch,after,errors});
   console.log(JSON.stringify({route:route.key,status:response.status(),
    before:{bodyClass:before.bodyClass,theme:before.theme,view:before.view,scroll:before.docScroll,hero:before.hero,stage:before.stage,heading:before.heading,app:before.app,images:before.images.length,styles:before.styles,scripts:before.scripts,shellChildren:before.shellChildren,renderer:before.renderer},
    repaired:{hero:repaired.hero,stage:repaired.stage,heading:repaired.heading,renderer:repaired.renderer,body:repaired.body,html:repaired.html,inline:repaired.inlineStyles,guard:repaired.safeGuardLoaded,modals:repaired.modalDiagnostics,ancestors:repaired.ancestors.map(x=>({cls:x.classes,overflowX:x.overflowX,overflowY:x.overflowY}))},after:{scroll:after.docScroll,touchScroll:afterTouch.docScroll,body:after.body,hero:after.hero,stage:after.stage,heading:after.heading,ancestors:after.ancestors.map(x=>({cls:x.classes,overflowY:x.overflowY}))},errors}));
   if(before.app&&(!repaired.hero||repaired.hero.height<180||repaired.hero.bottom<100)){
     issues.push(route.key+" upper hero missing from first viewport");
   }
   if(before.app&&after.stage&&after.stage.bottom<100)issues.push(route.key+" stage scrolls off-screen");
   if(before.app && (before.scripts.length!==1||before.scripts[0].includes("/test/")))
     issues.push("visitor loaded duplicate/wrong Frauen script: "+JSON.stringify(before.scripts));
   if(before.app && after.docScroll<70)
     issues.push(route.key+" document cannot scroll after touch + wheel, scroll="+after.docScroll);
   if(before.app && afterTouch.docScroll<70)
     console.warn("TOUCH_DRIVER_WARNING",route.key,"CDP touch scroll was zero; wheel cross-check",after.docScroll);
   if(before.app && repaired.body && (repaired.body.overflowX!=="clip"||repaired.body.overflowY!=="visible"))
     issues.push(route.key+" body creates inactive scrollport: "+repaired.body.overflowX+"/"+repaired.body.overflowY);
   if(before.app && (!after.stage || after.stage.bottom<100))
     issues.push(route.key+" sticky hero disappears after touch swipe");
   // Leaving the Frauen route must preserve functional navigation.
   if(route.key==="visitor"){
     const nav=page.locator("#bottomNav .bottom-nav-btn").first();
     if(await nav.count()){
       await nav.click({timeout:7000});
       await page.waitForTimeout(500);
       const next=await page.evaluate(()=>({hash:location.hash,body:document.body.className,
          overflowX:document.body.style.getPropertyValue("overflow-x"),
          overflowY:document.body.style.getPropertyValue("overflow-y")}));
       console.log("NAVIGATION_RECOVERY",JSON.stringify(next));
       if(next.body.includes("is-frauen-route")&&next.hash!=="#frauen")issues.push("visitor Frauen route still active after bottom navigation");
     }
   }
   await context.close();
  }
 }catch(e){issues.push(String(e.stack||e));console.error(e);}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,"diagnosis.json"),JSON.stringify({all,issues},null,2));}
 if(issues.length){console.error("HERO_LIVE_FAILURES",issues);process.exitCode=1;}
})();
