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
  {key:"visitor",url:"https://dar-al-tawhid.de/?frauen-hero-probe=1413#frauen"},
  {key:"visitor-android",url:"https://dar-al-tawhid.de/?frauen-hero-probe=1413#frauen"},
  {key:"test",url:"https://dar-al-tawhid.de/test/?frauen-hero-probe=1413#frauen"}
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
  const mobileEventAudit=await page.evaluate(()=>{
    window.__frauenMobileEvents=[];
    const p=["touchstart","touchmove","touchend","pointerdown","pointerup","click","focusin","focusout","scroll"];
    for(const name of p)document.addEventListener(name,e=>{
      if(window.__frauenMobileEvents.length>=95)return;
      const target=e.target;
      window.__frauenMobileEvents.push({
        name,scrollY:window.scrollY,canceled:e.defaultPrevented,
        cancelable:e.cancelable,
        isTrusted:e.isTrusted,
        target:target?.tagName+"/"+String(target?.className||"").slice(0,45),
        active:document.activeElement?.tagName+"/"+String(document.activeElement?.className||"").slice(0,45)
      });
    },{capture:true,passive:true});
    return true;
  });
  await page.evaluate(()=>{
    if(window.__darTouchAuditPreventInstalled)return;
    window.__darTouchAuditPreventInstalled=true;
    window.__darTouchAuditCalls=[];
    window.__darTouchAuditRepaints=[];
    window.__frauenDebugTraces=[];
    function trace(kind,detail){
      if(window.__frauenDebugTraces.length<65)
        window.__frauenDebugTraces.push({kind,detail,scroll:window.scrollY,at:performance.now(),stack:String(new Error().stack||"").slice(0,550)});
    }
    for(const name of ["focus","blur"]){
      const orig=HTMLElement.prototype[name];
      HTMLElement.prototype[name]=function(){
        if(this.matches?.("[data-frauen-q]")||this.matches?.("input")||this===document.activeElement)
          trace(name,{tag:this.tagName,cls:String(this.className),isConnected:this.isConnected});
        return orig.apply(this,arguments);
      };
    }
    const origIntoView=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(){
      trace("scrollIntoView",{tag:this.tagName,cls:String(this.className).slice(0,50)});
      return origIntoView.apply(this,arguments);
    };
    const desc=Object.getOwnPropertyDescriptor(Element.prototype,"scrollTop");
    if(desc?.set&&desc?.get){
      for(const el of [document.documentElement,document.body]){
        Object.defineProperty(el,"scrollTop",{
          configurable:true,
          get(){return desc.get.call(this)},
          set(y){trace("scrollTop direct set",{tag:this.tagName,y});return desc.set.call(this,y)}
        });
      }
    }
    const origScroll=window.scroll;
    if(origScroll)window.scroll=function(){trace("window.scroll",[...arguments]);return origScroll.apply(this,arguments)};
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
      if(/^(touchstart|touchmove|touchend|pointerdown|pointerup|click|mousedown)$/.test(this.type)&&window.__darTouchAuditCalls.length<40){
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
  const isolation=[];
  if(route.key==="visitor"&&(scrolled.docScroll||0)<50){
    const modes=["no-anchor","no-shift","scroll-root-strict","html-flow-auto","fixed-hero","disable-both-minimal-fixed-header","no-app-effects"];
    for(const mode of modes){
      await page.evaluate(mode=>{
        const links=[...document.querySelectorAll('link[rel="stylesheet"]')];
        for(const l of links){
          const name=new URL(l.href,location.href).pathname;
          if(mode==="disable-brand-css"&&name==="/assets/dar-adult-brand-header-v2.css")l.disabled=true;
          if(mode==="disable-profile-css"&&name==="/assets/dar-visitor-profile-picker-v1.css")l.disabled=true;
          if(mode==="disable-both"&&/\/assets\/(dar-adult-brand-header-v2|dar-visitor-profile-picker-v1)\.css$/.test(name))l.disabled=true;
          if(mode==="disable-group-4"&&/\/assets\/(dar-adult-top-scroll-boundary-v1|dar-visitor-frontstage-v1|dar-adult-brand-header-v2|dar-visitor-smart-profile-v1|dar-visitor-profile-picker-v1|dar-visitor-daily-hub-v1|dar-visitor-onboarding-v1|adult-fold-global-v1)\.css$/.test(name))l.disabled=true;
        }
        const own=document.getElementById("frauenCandidateExperiment");
        if(own)own.remove();
        const add=(css)=>{const el=document.createElement("style");el.id="frauenCandidateExperiment";el.textContent=css;document.head.appendChild(el)};
        if(mode==="no-anchor")add("html,body,.app,#appView,.frauen-library-shell,.frauen-library-pinned-header{overflow-anchor:none!important;scroll-behavior:auto!important;scroll-snap-type:none!important}");
        if(mode==="no-shift")add("body.is-frauen-route #appView .frauen-library-shell{margin-top:0!important;transform:none!important;translate:none!important}");
        if(mode==="scroll-root-strict")add("html{height:auto!important;min-height:100vh!important;overflow-x:clip!important;overflow-y:auto!important;}body.is-frauen-route{height:auto!important;min-height:100vh!important;overflow-x:clip!important;overflow-y:visible!important}body.is-frauen-route .app{height:auto!important;overflow:visible!important}body.is-frauen-route #appView{height:auto!important;overflow:visible!important}");
        if(mode==="html-flow-auto")add("html,body{height:auto!important;min-height:0!important;overflow-y:visible!important;overflow-x:clip!important;scroll-behavior:auto!important}html{overflow-y:auto!important}");
        if(mode==="fixed-hero")add("body.is-frauen-route #appView .frauen-library-pinned-header{position:fixed!important;top:48px!important;left:22px!important;right:22px!important;width:auto!important;margin:0!important}body.is-frauen-route #appView .frauen-library-section-head{margin-top:266px!important}");
        if(mode==="disable-both-minimal-fixed-header"){
          links.filter(l=>l.href.includes("/assets/dar-adult-brand-header-v2.css")||l.href.includes("/assets/dar-visitor-profile-picker-v1.css")).forEach(l=>l.disabled=true);
          add("#darAdultBrandHeaderV2{position:fixed!important;z-index:730!important;top:0!important;left:0!important;width:100%!important;height:48px!important;background:#f4f6f0!important;display:flex!important;align-items:center!important}#darAdultBrandHeaderSpacerV2{display:block!important;height:48px!important;max-height:48px!important}body.is-frauen-route #appView .frauen-library-pinned-header{top:48px!important;position:sticky!important}");
        }
        if(mode==="no-app-effects")add("body.is-frauen-route .app,body.is-frauen-route #appView,body.is-frauen-route .frauen-library-shell{will-change:auto!important;contain:none!important;transform:none!important;filter:none!important;perspective:none!important;backdrop-filter:none!important}");
        if(mode==="release-root-overscroll"){
          document.documentElement.style.setProperty("overscroll-behavior","auto","important");
          document.documentElement.style.setProperty("touch-action","auto","important");
          document.body.style.setProperty("overscroll-behavior","auto","important");
          document.body.style.setProperty("touch-action","auto","important");
        }
        if(mode==="hero-nonsticky"){
          const el=document.querySelector(".frauen-library-pinned-header");
          if(el)el.style.setProperty("position","relative","important");
        }
        if(mode==="header-nonfixed"){
          const el=document.getElementById("darAdultBrandHeaderV2");
          if(el)el.style.setProperty("position","relative","important");
        }
        window.scrollTo(0,0);
      },mode);
      await page.waitForTimeout(120);
      await fingerSwipe(page,205,669,342);
      isolation.push({mode,...await page.evaluate(()=>({
        y:scrollY,scrollOwner:document.scrollingElement?.tagName,
        htmlHeight:document.documentElement.clientHeight,
        headerBottom:document.getElementById("darAdultBrandHeaderV2")?.getBoundingClientRect().bottom,
        stageTop:document.querySelector(".frauen-library-pinned-header")?.getBoundingClientRect().top
      }))});
      await page.evaluate(()=>{
        document.getElementById("frauenCandidateExperiment")?.remove();
        document.querySelectorAll('link[rel="stylesheet"]').forEach(e=>e.disabled=false);
        for(const el of [document.documentElement,document.body]){
          el.style.removeProperty("overscroll-behavior");
          el.style.removeProperty("touch-action");
        }
        const h=document.getElementById("darAdultBrandHeaderV2");
        if(h)h.style.removeProperty("position");
        const stage=document.querySelector(".frauen-library-pinned-header");
        if(stage)stage.style.removeProperty("position");
        window.scrollTo(0,0);
      });
      await page.waitForTimeout(130);
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
    focused.programmaticFocus=await page.evaluate(()=>{
      const input=document.querySelector("#appView [data-frauen-q]");
      if(!input)return false;
      input.focus({preventScroll:true});
      return document.activeElement===input;
    });
    focused.programmaticActive=await page.evaluate(()=>document.activeElement?.matches('[data-frauen-q]')||false);
    focused.focusState=await page.evaluate(()=>{
      const x=document.querySelector("#appView [data-frauen-q]");
      let n=x,parents=[];
      while(n&&parents.length<14){
        const st=getComputedStyle(n);
        parents.push({tag:n.tagName,id:n.id,cls:String(n.className).slice(0,90),
          inert:n.inert,attrInert:n.hasAttribute?.("inert"),ariaHidden:n.getAttribute?.("aria-hidden"),
          display:st.display,visibility:st.visibility,pointer:st.pointerEvents,contentVisibility:st.contentVisibility,focusable:!!n.matches?.(':focus')});
        n=n.parentElement;
      }
      return {active:document.activeElement?.outerHTML?.slice(0,230),parents};
    });
    focused.disabled=await page.evaluate(()=>document.querySelector("#appView [data-frauen-q]")?.disabled||false);
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
  const debugTraces=await page.evaluate(()=>window.__frauenDebugTraces||[]);
  const eventAudit=await page.evaluate(()=>window.__frauenMobileEvents||[]);
  console.log("FRAUEN_NATIVE_TOUCH_PROBE",JSON.stringify({route:route.key,isolation,eventAudit,debugTraces,preventLog,start:{scroll:start.docScroll,stage:start.stage?.top},pulled:{scroll:pulled.docScroll,stage:pulled.stage?.top},scrolled:{scroll:scrolled.docScroll,stage:scrolled.stage?.top},focused,card,beforeHash,errors}));
  return {isolation,eventAudit,debugTraces,preventLog,start:{scroll:start.docScroll,stage:start.stage?.top},pulled:{scroll:pulled.docScroll,stage:pulled.stage?.top},scrolled:{scroll:scrolled.docScroll,stage:scrolled.stage?.top},focused,card,beforeHash,errors};
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
   // Establish a vanilla HTML5 control on exactly the SAME CDP mobile
   // context. Without this, failing synthetic touch events on CSS1Compat
   // would be misdiagnosed as a Frauen app regression.
   const control=await context.newPage();
   await control.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><input id="controlInput" style="height:46px;width:90%" placeholder="touch"><div style="height:2800px">Scroll body</div></body></html>');
   await fingerSwipe(control,205,669,342);
   const controlScroll=await control.evaluate(()=>({compat:document.compatMode,y:scrollY,scroller:document.scrollingElement?.tagName}));
   await control.evaluate(()=>scrollTo(0,0));
   await control.touchscreen.tap(190,22);
   const controlFocus=await control.evaluate(()=>document.activeElement?.id==="controlInput");
   console.log("FRAUEN_TOUCH_CONTROL",JSON.stringify({route:route.key,controlScroll,controlFocus}));
   await control.close();
   const page=await context.newPage();const errors=[];
   await page.route("**/assets/frauen/frauen-original-v1224-header-seam-v1405.css?*",intercept=>intercept.fulfill({status:200,contentType:"text/css; charset=utf-8",body:localCss}));
   await page.route("**/assets/frauen/frauen-hero-seam-runtime-v1407.js?*",intercept=>intercept.fulfill({status:200,contentType:"application/javascript; charset=utf-8",body:localScript}));
   await page.route("**/assets/frauen/frauen-live-adapter.js?*",intercept=>intercept.fulfill({status:200,contentType:"application/javascript; charset=utf-8",body:localAdapter}));
   page.on("pageerror",e=>errors.push(String(e.message).slice(0,300)));
   const response=await page.goto(route.url,{waitUntil:"domcontentloaded",timeout:60000});
   await page.waitForTimeout(6000);
   const docMode=await page.evaluate(()=>({
     mode:document.compatMode,doctype:document.doctype?.name||null,
     scroller:document.scrollingElement?.tagName||null,
     firstNode:document.firstChild?.nodeName||null
   }));
   console.log("FRAUEN_HTML5_NATIVE",JSON.stringify({route:route.key,docMode}));
   if(docMode.mode!=="CSS1Compat"||docMode.doctype!=="html"||docMode.scroller!=="HTML")
     issues.push(route.key+" HTML5 doctype/scroll owner invalid "+JSON.stringify(docMode));
   const clearance=await page.evaluate(()=>{
     const h=document.getElementById("darAdultBrandHeaderV2")||document.getElementById("darTestBrandHeaderV1");
     const stage=document.querySelector("#appView .frauen-library-pinned-header");
     const search=document.querySelector("#appView .frauen-library-pinned-header [data-frauen-q]");
     return {brandBottom:h?.getBoundingClientRect().bottom,heroStageTop:stage?.getBoundingClientRect().top,
       searchVisible:!!search&&search.getBoundingClientRect().height>12};
   });
   console.log("FRAUEN_HERO_TOUCH_CLEARANCE",JSON.stringify({route:route.key,clearance}));
   if(route.key!=="test"&&Number.isFinite(clearance.brandBottom)&&Number.isFinite(clearance.heroStageTop)&&
     Math.abs(clearance.heroStageTop-clearance.brandBottom)>12)
     issues.push(route.key+" brand-to-sticky gap visible "+JSON.stringify(clearance));
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
   all.push({key:route.key,status:response.status(),docMode,clearance,before,repaired,after,touch,errors});
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
