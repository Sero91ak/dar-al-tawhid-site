#!/usr/bin/env node
"use strict";
/* Browser-based, read-only Frauen hero diagnosis: public Test + visitor SPA.
   Preserve image/card/navigation logic; record actual computed layout on screen. */
const { chromium } = require("playwright");
const fs=require("node:fs");
const path=require("node:path");
const out=path.join(process.cwd(),"frauen-hero-live-evidence");
fs.mkdirSync(out,{recursive:true});
const all=[];
/* Serve the candidate assets at network-load time. Running the seam twice
 * creates duplicate MutationObserver/ResizeObserver subscriptions and produces
 * misleading freezes; the production browser gets exactly one runtime. */
const localCss=fs.readFileSync(path.join(process.cwd(),"assets/frauen/frauen-original-v1224-header-seam-v1405.css"),"utf8");
const localScript=fs.readFileSync(path.join(process.cwd(),"assets/frauen/frauen-hero-seam-runtime-v1407.js"),"utf8");
const localAdapter=fs.readFileSync(path.join(process.cwd(),"assets/frauen/frauen-live-adapter.js"),"utf8");
const routes=[
  {key:"visitor",url:"https://dar-al-tawhid.de/?frauen-hero-probe=1392#frauen"},
  {key:"visitor-android",url:"https://dar-al-tawhid.de/?frauen-hero-probe=1392#frauen"},
  {key:"test",url:"https://dar-al-tawhid.de/test/?frauen-hero-probe=1392#frauen"}
];
/* V1410: test the native finger path. Earlier wheel-only QA could pass
 * even when touchmove was cancelled or an invisible sticky layer ate taps. */
async function fingerSwipe(page,x,y1,y2){
  const cdp=await page.context().newCDPSession(page);
  try{
    await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y:y1,id:1}]});
    for(let k=1;k<=12;k++){
      await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y1+(y2-y1)*k/12,id:1}]});
      await page.waitForTimeout(18);
    }
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  }finally{await cdp.detach();}
  await page.waitForTimeout(350);
}
async function nativeTouchProbe(page,route){
  const errors=[];
  await page.evaluate(()=>{
    if(window.__darTouchAuditPreventInstalled)return;
    window.__darTouchAuditPreventInstalled=true;
    window.__darTouchAuditCalls=[];
    window.__darTouchAuditRepaints=[];
    const origScrollTo=window.scrollTo;
    window.scrollTo=function(){
      if(window.__darTouchAuditRepaints.length<30)
        window.__darTouchAuditRepaints.push({kind:"scrollTo",args:[...arguments],stack:String(new Error().stack).slice(0,620),at:performance.now()});
      return origScrollTo.apply(this,arguments);
    };
    const app=document.getElementById("appView");
    if(app)new MutationObserver(list=>{
      if(window.__darTouchAuditRepaints.length<30)
        window.__darTouchAuditRepaints.push({kind:"mutation",count:list.length,scroll:window.scrollY,at:performance.now()});
    }).observe(app,{childList:true,subtree:false});
    document.addEventListener("dar:frauen-render",()=>{
      if(window.__darTouchAuditRepaints.length<30)
        window.__darTouchAuditRepaints.push({kind:"frauen-render",scroll:window.scrollY,at:performance.now()});
    });
    const original=Event.prototype.preventDefault;
    Event.prototype.preventDefault=function(){
      if(/^(touchstart|touchmove|touchend|pointerdown|pointermove|pointerup|click|mousedown)$/.test(this.type)&&window.__darTouchAuditCalls.length<40){
        const t=this.target;
        window.__darTouchAuditCalls.push({
          scroll:window.scrollY,type:this.type,cancelable:this.cancelable,
          target:t&&String(t.className).slice(0,80),
          stack:String(new Error().stack||"").slice(0,900)
        });
      }
      return original.apply(this,arguments);
    };
  });
  await page.evaluate(()=>{
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
    window.scrollTo(0,0);
  });
  await page.waitForTimeout(180);
  const start=await page.evaluate(snapshot);
  await fingerSwipe(page,190,202,396); // Pull away from the top on the photo
  const pulled=await page.evaluate(snapshot);
  await fingerSwipe(page,205,669,342); // Normal down-page reading swipe
  const scrolled=await page.evaluate(snapshot);
  if((pulled.docScroll||0)>2)errors.push("top_pull_exposes_blank_space");
  if((scrolled.docScroll||0)<50)errors.push("native_finger_swipe_does_not_scroll");
  // In a single-use diagnostic context, isolate whether the iOS native root,
  // a false "keyboard open" flag or touch-action CSS prevents vertical pan.
  const touchExperiments=[];
  if(route.key==="visitor"&&(scrolled.docScroll||0)<50){
    await fingerSwipe(page,18,620,310);
    touchExperiments.push({mode:"left-gutter-touch",scroll:await page.evaluate(()=>window.scrollY)});
    await page.evaluate(()=>window.scrollTo(0,0));
    await fingerSwipe(page,190,423,198);
    touchExperiments.push({mode:"section-heading-touch",scroll:await page.evaluate(()=>window.scrollY)});
    await page.evaluate(()=>window.scrollTo(0,0));
    for(const mode of ["pan-y","keyboard-off","native-class-off","root-viewport","native-overflow-body"]){
      await page.evaluate(mode=>{
        if(mode==="pan-y"){
          for(const el of [document.documentElement,document.body,document.querySelector(".app"),document.getElementById("appView")]){
            if(el)el.style.setProperty("touch-action","pan-y","important");
          }
        }else if(mode==="keyboard-off"){
          document.documentElement.classList.remove("adaptive-keyboard-open");
        }else if(mode==="native-class-off"){
          document.documentElement.classList.remove("dar-ios-native-app");
        }else if(mode==="root-viewport"){
          const html=document.documentElement;
          html.style.setProperty("height","100dvh","important");
          html.style.setProperty("min-height","100dvh","important");
          html.style.setProperty("overflow-y","auto","important");
          html.style.setProperty("overflow-x","clip","important");
        }else if(mode==="native-overflow-body"){
          document.body.style.setProperty("overflow-y","auto","important");
          document.body.style.setProperty("height","100dvh","important");
        }
      },mode);
      await fingerSwipe(page,205,669,342);
      touchExperiments.push({mode,scroll:await page.evaluate(()=>window.scrollY),
        scrollport:await page.evaluate(()=>({
          htmlClient:document.documentElement.clientHeight,htmlScroll:document.documentElement.scrollHeight,
          bodyClient:document.body.clientHeight,bodyScroll:document.body.scrollHeight,
          viewport:innerHeight
        })),
        focus:await page.evaluate(()=>document.activeElement?.tagName),
        htmlClass:await page.evaluate(()=>document.documentElement.className)});
      await page.evaluate(mode=>{
        window.scrollTo(0,0);
        if(mode==="pan-y"){
          for(const el of [document.documentElement,document.body,document.querySelector(".app"),document.getElementById("appView")]){
            if(el)el.style.removeProperty("touch-action");
          }
        }else if(mode==="keyboard-off")document.documentElement.classList.add("adaptive-keyboard-open");
        else if(mode==="native-class-off")document.documentElement.classList.add("dar-ios-native-app");
        else if(mode==="root-viewport"){
          for(const p of ["height","min-height","overflow-y","overflow-x"])document.documentElement.style.removeProperty(p);
        }else if(mode==="native-overflow-body"){
          document.body.style.removeProperty("height");
          document.body.style.setProperty("overflow-y","visible","important");
        }
      },mode);
    }
  }
  const preventLog=await page.evaluate(()=>({
    stoppedBy:window.__darTouchAuditCalls||[],
    repaints:window.__darTouchAuditRepaints||[],
    hasOfficialApp:!!window.DAR_IOS_NATIVE_APP||!!window.DAR_OFFICIAL_IOS_APP,
    oldPwaBlocked:!!window.DAR_IOS_VISITOR_BLOCKED,
    htmlClass:document.documentElement.className,
    bodyClass:document.body.className,
    gestureTarget:(()=>{
      const hit=document.elementFromPoint(205,669);
      return hit?[hit,...(function*(e){while(e?.parentElement){e=e.parentElement;yield e;}})(hit)].slice(0,12).map(e=>({
        tag:e.tagName,cls:String(e.className).slice(0,85),
        touchAction:getComputedStyle(e).touchAction,
        overflowY:getComputedStyle(e).overflowY,
        overflowX:getComputedStyle(e).overflowX
      })):null;
    })()
  }));
  if(scrolled.stage&&Math.abs(scrolled.stage.top-(start.stage?start.stage.top:scrolled.stage.top))>4)errors.push("sticky_stage_moved_on_native_swipe");
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(170);
  const focused=await page.evaluate(()=>{
    const input=document.querySelector("#appView [data-frauen-q]");
    if(!input)return {exists:false};
    const rect=input.getBoundingClientRect();
    return {exists:true,x:Math.round(rect.left+rect.width/2),y:Math.round(rect.top+rect.height/2)};
  });
  const lockVisible=await page.evaluate(()=>{
    const el=document.getElementById("darTestLock");
    if(!el)return false;
    const c=getComputedStyle(el),r=el.getBoundingClientRect();
    return c.display!=="none"&&c.visibility!=="hidden"&&r.width>100&&r.height>100;
  });
  if(focused.exists&&focused.y>0&&focused.y<852&&!lockVisible){
    focused.hitStack=await page.evaluate(({x,y})=>document.elementsFromPoint(x,y).slice(0,8).map(e=>({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,80),touchAction:getComputedStyle(e).touchAction})),focused);
    await page.touchscreen.tap(focused.x,focused.y);
    await page.waitForTimeout(180);
    focused.active=await page.evaluate(()=>document.activeElement?.matches('[data-frauen-q]')||false);
    if(!focused.active)errors.push("search_does_not_receive_real_touch_focus");
    await page.evaluate(()=>{if(document.activeElement?.blur)document.activeElement.blur();});
  }
  await page.evaluate(()=>window.scrollTo(0,530));
  await page.waitForTimeout(230);
  const card=await page.evaluate(()=>{
    const stage=document.querySelector(".frauen-library-pinned-header");
    const dock=document.querySelector("#bottomNav,.bottom-nav,[data-bottom-nav-root]");
    const min=stage?stage.getBoundingClientRect().bottom+15:110;
    const max=dock?Math.min(innerHeight-40,dock.getBoundingClientRect().top-14):innerHeight-90;
    const nodes=[...document.querySelectorAll("#appView .frauen-library-card[data-nav=frauen],#appView .frauen-library-area-card[data-nav=frauen]")];
    let best=null;
    for(const n of nodes){
      const q=n.getBoundingClientRect(),y=Math.round(Math.max(min+20,Math.min(max-20,(q.top+q.bottom)/2)));
      if(y<=min||y>=max||q.top>y||q.bottom<y)continue;
      const x=Math.round(q.left+q.width/2);
      const hit=document.elementFromPoint(x,y);
      const sample={x,y,value:n.getAttribute("data-value"),top:q.top,bottom:q.bottom,
        stageBottom:min,dockTop:max,hit:!!hit&&(hit===n||n.contains(hit)),
        hitStack:document.elementsFromPoint(x,y).slice(0,7).map(e=>({id:e.id,cls:String(e.className).slice(0,75),pointer:getComputedStyle(e).pointerEvents}))};
      if(!best||sample.hit)best=sample;
      if(sample.hit)break;
    }
    return best;
  });
  const beforeHash=await page.evaluate(()=>location.hash);
  if(!card)errors.push("cannot_find_visible_navigable_card");
  else if(!card.hit&&!lockVisible)errors.push("sticky_or_overlay_steals_card_touch");
  else if(card.hit&&!lockVisible){
    await page.touchscreen.tap(card.x,card.y);
    await page.waitForTimeout(600);
    card.afterHash=await page.evaluate(()=>location.hash);
    if(card.afterHash===beforeHash)errors.push("card_touch_did_not_navigate");
  }
  console.log("FRAUEN_NATIVE_TOUCH_PROBE",JSON.stringify({route:route.key,touchExperiments,preventLog,start:{scroll:start.docScroll,stage:start.stage?.top},pulled:{scroll:pulled.docScroll,stage:pulled.stage?.top},scrolled:{scroll:scrolled.docScroll,stage:scrolled.stage?.top},focused,card,beforeHash,errors}));
  return {touchExperiments,preventLog,start:{scroll:start.docScroll,stage:start.stage?.top},pulled:{scroll:pulled.docScroll,stage:pulled.stage?.top},scrolled:{scroll:scrolled.docScroll,stage:scrolled.stage?.top},focused,card,beforeHash,errors};
}
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
    styles:[...document.querySelectorAll('link[rel="stylesheet"]')].filter(x=>/frauen/.test(x.href)).map(x=>x.href)};
}
(async()=>{
 let browser;let issues=[];
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const route of routes){
   const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"de-DE",userAgent:route.key==="visitor"?"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1 DarAlTawhid-iOS":route.key==="visitor-android"?"Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36 DarAlTawhidAndroid":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1"});
   const page=await context.newPage();const errors=[];
   await page.route("**/assets/frauen/frauen-original-v1224-header-seam-v1405.css?*",intercept=>intercept.fulfill({status:200,contentType:"text/css; charset=utf-8",body:localCss}));
   await page.route("**/assets/frauen/frauen-hero-seam-runtime-v1407.js?*",intercept=>intercept.fulfill({status:200,contentType:"application/javascript; charset=utf-8",body:localScript}));
   await page.route("**/assets/frauen/frauen-live-adapter.js?*",intercept=>intercept.fulfill({status:200,contentType:"application/javascript; charset=utf-8",body:localAdapter}));
   page.on("pageerror",e=>errors.push(String(e.message).slice(0,300)));
   const response=await page.goto(route.url,{waitUntil:"domcontentloaded",timeout:60000});
   await page.waitForTimeout(6000);
   let before=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-initial.png")});
   // One mounted production runtime: no duplicate injected listeners.
   if(!localCss.includes("DAR_FRAUEN_PINNED_HERO_UNDER_SCROLL_V1407")||
      !localScript.includes("maxGap=Math.max(480"))throw Error("Current Frauen sticky rail missing");
   let repaired=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-repaired.png")});
   const touch=await nativeTouchProbe(page,route);
   for(const error of touch.errors)issues.push(route.key+" "+error);
   // Real card taps navigate away. Return to the original route before wheel QA.
   if(await page.evaluate(()=>location.hash!=="#frauen")){
     await page.goto(route.url,{waitUntil:"domcontentloaded",timeout:60000});
     await page.waitForTimeout(3500);
   }

   await page.mouse.wheel(0,560);
   await page.waitForTimeout(330);
   await page.waitForTimeout(450);
   let after=await page.evaluate(snapshot);
   await page.screenshot({path:path.join(out,route.key+"-after-scroll.png")});
   all.push({key:route.key,status:response.status(),before,repaired,after,touch,errors});
   console.log(JSON.stringify({route:route.key,status:response.status(),
    before:{bodyClass:before.bodyClass,theme:before.theme,view:before.view,scroll:before.docScroll,hero:before.hero,stage:before.stage,heading:before.heading,app:before.app,images:before.images.length,styles:before.styles,shellChildren:before.shellChildren,renderer:before.renderer},
    repaired:{hero:repaired.hero,stage:repaired.stage,heading:repaired.heading,renderer:repaired.renderer,body:repaired.body,html:repaired.html,inline:repaired.inlineStyles,ancestors:repaired.ancestors.map(x=>({cls:x.classes,overflowX:x.overflowX,overflowY:x.overflowY}))},after:{scroll:after.docScroll,body:after.body,hero:after.hero,stage:after.stage,heading:after.heading,ancestors:after.ancestors.map(x=>({cls:x.classes,overflowY:x.overflowY}))},errors}));
   if(before.app&&(!repaired.hero||repaired.hero.height<180||repaired.hero.bottom<100)){
     issues.push(route.key+" upper hero missing from first viewport");
   }
   if(before.app&&after.stage&&after.stage.bottom<100)issues.push(route.key+" stage scrolls off-screen");
   if(before.app&&before.app.scrollHeight>before.app.clientHeight+200&&after.docScroll<100)issues.push(route.key+" content cannot scroll normally");
   await context.close();
  }
 }catch(e){issues.push(String(e.stack||e));console.error(e);}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,"diagnosis.json"),JSON.stringify({all,issues},null,2));}
 if(issues.length){console.error("HERO_LIVE_FAILURES",issues);process.exitCode=1;}
})();
