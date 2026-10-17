#!/usr/bin/env node
"use strict";
/* Android PWA browser smoke: the real Dar Test surface, never visitor/KIDS.
   Runs after test Worker deploy using a fresh Android/touch browser context. */
const fs=require("node:fs");
const path=require("node:path");
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
  // DAR_TEST_NATIVE_ANDROID_SWIPE_V1390: exercise real touch gestures BEFORE
  // unrelated image/hero QA can abort the run. Programmatic scrollTop alone
  // does not prove that Chrome accepts a physical finger swipe.
  findings.nativeSwipe=[];
  const cdp=await context.newCDPSession(page);
  async function testNativeSwipe(routeName,navIndex){
    if(routeName!=="posts"){
      await nav.nth(navIndex).tap({timeout:10000});
      await page.waitForTimeout(950);
    }
    const before=await page.evaluate(()=>{
      const els=[
        document.scrollingElement,document.querySelector("#appView"),
        document.querySelector(".dar-fold__rail"),
        document.querySelector(".dar-fold__pane")
      ].filter(Boolean);
      return {
        diagnosis:typeof window.__darTestScrollDiagnostic==="function"?
          window.__darTestScrollDiagnostic():null,
        surfaces:els.map(el=>({name:el===document.scrollingElement?"document":
          (el.id||el.className?.toString().slice(0,65)||el.tagName),
          top:el.scrollTop,extent:el.scrollHeight-el.clientHeight,
          touch:getComputedStyle(el).touchAction}))
      };
    });
    const {width,height}=page.viewportSize();
    const x=Math.round(width*.49),startY=Math.round(height*.74),
      endY=Math.round(height*.33);
    // DAR_TEST_TOUCH_PROBE_V1391: inspect the actual touched element and
    // whether Chrome delivers touch events; isolate synthetic driver failures.
    const touchHit=await page.evaluate(({x,y})=>{
      const node=document.elementFromPoint(x,y),chain=[];
      for(let el=node;el&&chain.length<14;el=el.parentElement){
        const cs=getComputedStyle(el);
        chain.push({tag:el.tagName,id:el.id||"",
          className:typeof el.className==="string"?el.className.slice(0,90):"",
          touch:cs.touchAction,overflowY:cs.overflowY,
          overscrollY:cs.overscrollBehaviorY,pointer:cs.pointerEvents});
      }
      return chain;
    },{x,y:startY});
    await page.evaluate(()=>{
      window.__darTestTouchTrace=[];
      for(const type of ["touchstart","touchmove","touchend","pointerdown","pointermove","pointerup"]){
        document.addEventListener(type,e=>{
          if(window.__darTestTouchTrace.length<80)
            window.__darTestTouchTrace.push({type,prevented:e.defaultPrevented,
              cancelable:e.cancelable,origin:e.target?.tagName||""});
        },{capture:true,passive:true,once:false});
      }
    });
    await cdp.send("Input.dispatchTouchEvent",{
      type:"touchStart",touchPoints:[{x,y:startY}]
    });
    for(let i=1;i<=12;i++){
      await cdp.send("Input.dispatchTouchEvent",{
        type:"touchMove",
        touchPoints:[{x,y:Math.round(startY+(endY-startY)*i/12)}]
      });
      await page.waitForTimeout(26);
    }
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await page.waitForTimeout(340);
    const after=await page.evaluate(()=>{
      const els=[
        document.scrollingElement,document.querySelector("#appView"),
        document.querySelector(".dar-fold__rail"),
        document.querySelector(".dar-fold__pane")
      ].filter(Boolean);
      return {
        diagnosis:typeof window.__darTestScrollDiagnostic==="function"?
          window.__darTestScrollDiagnostic():null,
        surfaces:els.map(el=>({name:el===document.scrollingElement?"document":
          (el.id||el.className?.toString().slice(0,65)||el.tagName),
          top:el.scrollTop,extent:el.scrollHeight-el.clientHeight}))
      };
    });
    const touchTrace=await page.evaluate(()=>window.__darTestTouchTrace||[]);
    const touchProbe={hit:touchHit,trace:touchTrace};
    const progressed=after.surfaces.some((v,i)=>
      v.top>(before.surfaces[i]?.top||0)+8);
    const hasContent=before.surfaces.some(v=>v.extent>50);
    const record={routeName,viewport:{width,height},hasContent,progressed,before,after,touchProbe};
    findings.nativeSwipe.push(record);
    await page.screenshot({path:path.join(out,"real-swipe-"+routeName+".png"),fullPage:false});
    console.log("Android finger swipe "+routeName+": "+(progressed?"PASS":"FAIL")+
      " "+JSON.stringify({hasContent,
        before:before.surfaces,after:after.surfaces}));
    if(!hasContent)throw Error("Android "+routeName+": no vertically scrollable content");
    if(!progressed){
      // A minimal independent scrolling document verifies the CDP gesture
      // itself. A failed control makes the diagnosis inconclusive, not app-only.
      const control=await context.newPage();
      await control.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><div style="height:3000px;background:linear-gradient(#fff,#333)">Scroll control</div>');
      await control.bringToFront();
      const controlCdp=await context.newCDPSession(control);
      await controlCdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y:startY,id:1}]});
      for(let i=1;i<=12;i++){
        await controlCdp.send("Input.dispatchTouchEvent",{type:"touchMove",
          touchPoints:[{x,y:Math.round(startY+(endY-startY)*i/12),id:1}]});
        await control.waitForTimeout(26);
      }
      await controlCdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
      await control.waitForTimeout(340);
      const controlY=await control.evaluate(()=>scrollY);
      await control.close();
      await page.bringToFront();
      findings.nativeSwipeControl={controlY,passed:controlY>8};
      console.log("Touch driver control: "+JSON.stringify(findings.nativeSwipeControl));
      throw Error("Android "+routeName+": "+(controlY>8?"physical swipe blocked in app":"CDP touch simulator failed baseline")+
        " "+JSON.stringify({diagnosis:after.diagnosis,hit:touchHit,trace:touchTrace}));
    }
  }
  await testNativeSwipe("posts",pidx);
  await testNativeSwipe("quran",qidx);
  await nav.nth(pidx).tap({timeout:10000});
  await page.waitForTimeout(650);

  // DAR_HADITH_DEPTH_LAYOUT_BROWSER_QA_V1386
  // Exercise real navigation through Work > Kitab > Bab > individual Hadith,
  // not just URL or CSS success. Never touches Kids or the visitor app.
  findings.hadithContinuity=[];
  for(const width of [390,1024]){
    const height=width===390?844:768;
    await page.setViewportSize({width,height});
    await page.evaluate(()=>{location.hash="#hadith";});
    await page.waitForFunction(()=>document.body.classList.contains("is-hadith-route") &&
      !!document.querySelector(".hadith-hub > .view-head"),null,{timeout:20000});
    await page.waitForFunction(()=>!!document.querySelector(
      ".hadith-hub .dua-theme-card[data-nav='hadith'][data-value]"
    ),null,{timeout:20000});
    let rootHeight=0;
    for(let depth=0;depth<=4;depth++){
      await page.waitForTimeout(500);
      const g=await page.evaluate(()=>{
        const hero=document.querySelector(".hadith-hub > .view-head,.hadith-detail > .post-reader-title");
        const rect=hero?.getBoundingClientRect();
        const c=hero&&getComputedStyle(hero);
        return {hash:location.hash,route:document.body.className,
          viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
          rect:rect&&{x:rect.x,right:rect.right,width:rect.width,height:rect.height},
          radius:c?.borderRadius,border:c?.borderLeftWidth,shadow:c?.boxShadow,
          background:c?.backgroundImage,backgroundSize:c?.backgroundSize};
      });
      let error="";
      if(!g.rect)error="missing Hadith hero";
      else if(g.rect.x< -3||g.rect.right>g.viewport+3||Math.abs(g.rect.x-(g.viewport-g.rect.right))>4)error="cropped or asymmetric hero";
      else if(g.rect.width<g.viewport-8)error="hero not full viewport width";
      else if(g.scrollWidth>g.viewport+3)error="horizontal overflow";
      else if(!/cover/.test(g.backgroundSize||""))error="not CSS background cover";
      else if(g.radius!=="0px"||g.border!=="0px"||g.shadow!=="none")error="floating image card border/shadow";
      if(depth===0)rootHeight=g.rect?.height||0;
      else if(g.rect&&Math.abs(rootHeight-g.rect.height)>3)error="height jump "+rootHeight+"→"+g.rect.height;
      findings.hadithContinuity.push({width,depth,...g,error});
      await page.screenshot({path:path.join(out,"hadith-"+width+"-depth-"+depth+".png"),fullPage:false});
      console.log("Hadith depth "+depth+" width "+width+" "+(error?"FAIL "+error:"PASS"));
      if(error)throw Error("Hadith "+width+" depth "+depth+": "+error+" "+JSON.stringify(g));
      if(depth===4)break;
      const next=page.locator("body.is-hadith-route .hadith-hub .dua-theme-card[data-nav='hadith'][data-value],body.is-hadith-route .hadith-hub .hadith-leaf-row[data-nav='hadith'][data-value]").first();
      await next.waitFor({state:"visible",timeout:20000});
      await next.click({timeout:12000});
      await page.waitForFunction((oldHash)=>location.hash!==oldHash,g.hash,{timeout:20000});
      await page.waitForFunction(()=>!!document.querySelector(
        ".hadith-hub > .view-head,.hadith-detail > .post-reader-title"),null,{timeout:20000});
    }
  }
  await page.setViewportSize({width:412,height:915});
  await nav.nth(pidx).click({timeout:12000});
  await page.waitForTimeout(600);
  // DAR_ADULT_RESPONSIVE_SIX_WIDTH_VISUAL_QA_V1383: real rendered DOM
  // in Android/touch Chromium. Keep this isolated to adult Dar Test.
  findings.responsive=[];
  const widths=[375,390,430,768,1024,1440];
  const matrix=widths.map(width=>({width,height:width<600?844:width<1100?1024:900}));
  matrix.push({width:844,height:390},{width:1024,height:768});
  for(const {width,height} of matrix){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(460);
    const geometry=await page.evaluate(()=>{
      const doc=document.documentElement;
      const vw=window.innerWidth;
      const measure=(element)=>{
        if(!element)return null;
        const rect=element.getBoundingClientRect();
        return {left:Math.round(rect.left*10)/10,right:Math.round(rect.right*10)/10,
          width:Math.round(rect.width*10)/10,top:Math.round(rect.top*10)/10,
          height:Math.round(rect.height*10)/10};
      };
      const app=document.querySelector("body.has-bottom-nav > .app");
      const stage=document.querySelector("#appView.view");
      const hero=document.querySelector("body.is-topics-route #appView .topics-hub > .view-head");
      const search=document.querySelector("body.is-topics-route #appView .topics-hub > :is(.search-pro-panel,.search-panel,#homeSearchBlock)");
      const label=document.querySelector("body.is-topics-route #appView .topics-hub > .topics-hub__label");
      const heroBg=hero?getComputedStyle(hero):null;
      const appRect=measure(app),heroRect=measure(hero),searchRect=measure(search),labelRect=measure(label);
      const centerDelta=(rect)=>rect?Math.round((rect.left-(vw-rect.right))*10)/10:null;
      return {vw,scrollWidth:doc.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
        app:appRect,stage:measure(stage),hero:heroRect,search:searchRect,label:labelRect,
        heroCenterDelta:centerDelta(heroRect),searchCenterDelta:centerDelta(searchRect),
        labelCenterDelta:centerDelta(labelRect),
        heroBackgroundImage:heroBg?.backgroundImage.slice(0,120)||"",
        heroBackgroundSize:heroBg?.backgroundSize||"",
        route:document.body.className};
    });
    const errors=[];
    if(Math.abs(geometry.vw-width)>2)errors.push("unexpected viewport "+geometry.vw+" vs "+width);
    if(!geometry.hero)errors.push("missing topics CSS hero");
    if(geometry.hero && Math.abs(geometry.heroCenterDelta)>3)errors.push("hero asymmetric "+geometry.heroCenterDelta+"px");
    if(geometry.hero && geometry.hero.width>geometry.vw+2)errors.push("hero wider than viewport");
    if(!/cover/.test(geometry.heroBackgroundSize))errors.push("hero background not cover");
    if(geometry.search&&Math.abs(geometry.searchCenterDelta)>3)errors.push("search asymmetric "+geometry.searchCenterDelta+"px");
    if(geometry.label&&Math.abs(geometry.labelCenterDelta)>3)errors.push("topics label asymmetric "+geometry.labelCenterDelta+"px");
    if(geometry.scrollWidth>geometry.vw+2)errors.push("document horizontal overflow "+geometry.scrollWidth+"px");
    if(geometry.bodyScrollWidth>geometry.vw+2)errors.push("body horizontal overflow "+geometry.bodyScrollWidth+"px");
    const entry={viewport:{width,height},geometry,errors};
    findings.responsive.push(entry);
    const capture="responsive-"+width+"x"+height;
    await page.screenshot({path:path.join(out,capture+".png"),fullPage:false});
    console.log("Responsive "+capture+": "+(errors.length?"FAIL "+errors.join("; "):"PASS"));
    if(errors.length)throw Error("Responsive geometry "+capture+": "+errors.join("; "));
  }
  await page.setViewportSize({width:915,height:412});
  await page.waitForTimeout(1400);
  await snapshot("landscape");
  await page.setViewportSize({width:412,height:915});
  await page.waitForTimeout(1400);
  await snapshot("portrait-return");
  // DAR_ADULT_GEOMETRY_SIX_VIEWPORTS_V1: computed boxes, not just CSS markers.
  // Real Chromium layout on the deployed adult /test/ surface; KIDS excluded.
  findings.responsive=[];
  const sizes=[
   [375,812,"iphone-small"],[390,844,"iphone"],[430,932,"iphone-large"],
   [768,1024,"ipad"],[1024,768,"ipad-landscape"],[1440,900,"desktop"],
   [812,375,"iphone-landscape"]
  ];
  async function geometry(label){
   const result=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const keys=[
     ".topics-hub > .view-head",
     ".topic-collection-page > .view-head",
     ".post-reader > .post-reader-title"
    ];
    const hero=keys.map(q=>document.querySelector(q)).find(Boolean);
    const content=document.querySelector(".topics-hub__label,.topic-collection-page .topic-collection,.post-reader .post-reader-main");
    function box(el){if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};}
    return {width,scrollWidth:document.documentElement.scrollWidth,bodyClass:document.body.className,
      hero:box(hero),content:box(content),hasCover:!!(hero&&getComputedStyle(hero).backgroundImage!=="none"),
      horizontalRail:!!document.querySelector(".dar-tl-filterbar")};
   });
   const fail=(why)=>{throw Error("Responsive "+label+": "+why+" "+JSON.stringify(result));};
   if(!result.hero||result.hero.width<120)fail("missing visible route hero");
   if(result.scrollWidth>result.width+3)fail("horizontal document overflow");
   if(result.hero.left< -3||result.hero.right>result.width+3)fail("hero cropped");
   if(Math.abs(result.hero.left-(result.width-result.hero.right))>4)fail("asymmetric hero margins");
   if(result.hero.left>24||result.width-result.hero.right>24)fail("hero not edge-filling");
   if(!result.hasCover)fail("hero background missing");
   if(result.content&&(result.content.left< -3||result.content.right>result.width+3))fail("content cropped");
   findings.responsive.push({label,...result});
   await page.screenshot({path:path.join(out,"responsive-"+label+".png"),fullPage:false});
  }
  for(const [width,height,label] of sizes){
   await page.setViewportSize({width,height});
   await nav.nth(pidx).click({timeout:15000});
   await page.waitForTimeout(950);
   await geometry(label+"-topics");
   const group=page.locator(".topics-hub .dar-tl-accordion").first();
   if(await group.count()){
    if(!(await group.evaluate(el=>el.hasAttribute("open")))){
     const summary=group.locator("summary");
     if(await summary.count())await summary.click();
    }
    // DAR_TEST_ANDROID_SCROLL_QA_V1388: validate actual split scroll ownership
    // and container-based card columns on the deployed Android /test page.
    const scrollProof=await page.evaluate(()=>{
      const fold=document.querySelector("#appView .dar-fold[data-fold-mode='dual']");
      const empty=!!fold?.querySelector(":scope > .dar-fold__pane > .dar-fold__empty");
      const rail=fold?.querySelector(":scope > .dar-fold__rail");
      const grid=rail?.querySelector(".dar-tl-accordion[open] .dar-tl-grid");
      const railWidth=rail?.getBoundingClientRect().width||0;
      const gridCss=grid?getComputedStyle(grid):null;
      const columnCount=gridCss?.display==="grid"
        ?gridCss.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length:0;
      const seen=new Set(),candidates=[];
      for(const el of [document.scrollingElement,document.body,
        document.querySelector("#appView"),rail,fold?.querySelector(".dar-fold__pane")]){
        if(!el||seen.has(el))continue;seen.add(el);
        const css=getComputedStyle(el),rect=el.getBoundingClientRect();
        if(css.display==="none"||css.visibility==="hidden"||rect.width<1)continue;
        const delta=el.scrollHeight-el.clientHeight;
        if(delta<36)continue;
        const start=el.scrollTop;
        el.scrollTop=Math.min(start+100,el.scrollHeight-el.clientHeight);
        const moved=el.scrollTop>start+3;
        el.scrollTop=start;
        candidates.push({name:el===document.scrollingElement?"document":
          el.id||el.className?.toString().slice(0,70)||el.tagName,
          delta,overflowY:css.overflowY,moved});
      }
      return {empty,railWidth,columnCount,
        foldOverflow:fold?getComputedStyle(fold).overflowY:null,
        candidates};
    });
    findings.screens.push({label:label+"-scroll-rail",scrollProof});
    if(scrollProof.empty&&scrollProof.foldOverflow==="hidden")
      throw Error("Android "+label+": empty Fold preview clips vertical scroll");
    if(scrollProof.railWidth>0&&scrollProof.railWidth<620&&scrollProof.columnCount>1)
      throw Error("Android "+label+": "+scrollProof.columnCount+
        " topic columns squeezed into "+scrollProof.railWidth+"px rail");
    if(scrollProof.candidates.length&&!scrollProof.candidates.some(x=>x.moved))
      throw Error("Android "+label+": visible content has no functional vertical scroller");
    const topic=page.locator(".topics-hub .topics-theme-card").first();
    if(await topic.count()){
     await topic.click({timeout:13000});
     await page.waitForTimeout(850);
     await geometry(label+"-category");
     const post=page.locator(".topic-collection-page .post-row").first();
     if(await post.count()){
      await post.click({timeout:13000});
      await page.waitForTimeout(850);
      await geometry(label+"-post");
     }else throw Error("Responsive "+label+": category has no clickable post row");
    }else throw Error("Responsive "+label+": no clickable topic card");
   }else throw Error("Responsive "+label+": no topic accordion");
  }
  findings.passed=true;
  console.log("Dar Test Android Chrome: HOME + QURAN + POSTS + ROTATION + SIX WIDTHS PASS");
 }catch(e){findings.passed=false;findings.failure=String(e.stack||e);console.error(findings.failure);process.exitCode=1}
 finally{fs.writeFileSync(path.join(out,"report.json"),JSON.stringify(findings,null,2));if(browser)await browser.close()}
})();
