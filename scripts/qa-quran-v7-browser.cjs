const {chromium}=require("playwright");
const fs=require("node:fs");
const base="https://dar-quran-players-showcase-v3.sero91ak.workers.dev";
const files=["dar-al-tawhid-quran-player-v7.html","tawhid-kids-quran-player-v7.html"];
const devices=[
 ["small-iphone",320,568],["android-compact",360,640],["iphone-se",375,667],
 ["iphone",390,844],["iphone-max",430,932],["android-wide",480,850],
 ["fold-closed",600,850],["fold-near-closed",719,960],
 ["fold-open",720,900],["tablet",820,1180],["ipad-landscape",1024,768],["desktop",1440,900]
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});let count=0,fail=0;
 fs.mkdirSync(".qa-quran-shots",{recursive:true});
 for(const file of files){
  for(const [label,width,height] of devices){
   count++;const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<720,hasTouch:width<720});
   const page=await ctx.newPage();const errs=[];page.on("pageerror",e=>errs.push(String(e)));
   try{
    const res=await page.goto(base+"/"+file+"?ci=v7-"+label,{waitUntil:"domcontentloaded",timeout:45000});
    if(res.status()!==200)throw Error("HTTP "+res.status());
    await page.waitForTimeout(1200);
    const data=await page.evaluate(()=>{
     const e=id=>document.querySelector(id),b=id=>{let r=e(id).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
     const tabs=e(".reader-tools").getBoundingClientRect();const dd=e("#audio");
     const reader=b(".verse-focus"),dock=b(".miniplay"),stage=b(".main-panel");
     return{
      bodyHeight:document.documentElement.scrollHeight,innerHeight,
      bodyWidth:document.documentElement.scrollWidth,innerWidth,
      stage,reader,dock,
      tabHeight:b(".reader-tools").height,
      visibleTabs:[...document.querySelectorAll(".reader-tools .tab")].every(z=>{let r=z.getBoundingClientRect();return r.width>38&&r.x>=tabs.x-3&&r.right<=tabs.right+3}),
      arabicLength:e("#quranText").textContent.trim().length,
      ArabicColor:getComputedStyle(e("#quranText")).color,
      readerBg:getComputedStyle(e(".verse-focus")).backgroundColor,
      externalCss:getComputedStyle(e(".main-panel")).backgroundColor,
      controlsVisible:["#play","#dockPrev","#dockNext","#seek"].every(x=>e(x).getBoundingClientRect().height>=29),
      frontImgCount:document.querySelectorAll(".hero-object").length,
      kid:e(".kid-actions")?b(".kid-actions").height:0
     };
    });
    if(errs.length)throw Error("JS errors: "+errs.join("; "));
    if(data.arabicLength<6)throw Error("Quran text did not render");
    if(data.tabHeight>50||!data.visibleTabs)throw Error("Tabs clipped or excessively tall "+JSON.stringify(data));
    if(!data.controlsVisible)throw Error("Player controls are not visible");
    if(width<720){
      if(data.bodyHeight>height+4||data.bodyWidth>width+4)throw Error("Document scroll or side overflow "+JSON.stringify(data));
      if(data.reader.height>height*.46)throw Error("Too much blank paper "+JSON.stringify(data));
      if(data.reader.bottom>data.dock.y)throw Error("Reader obscured by dock");
      if(data.dock.x<5||data.dock.right>width-5||data.dock.height>90)throw Error("Player dock disproportionate "+JSON.stringify(data));
      if(data.stage.bottom>data.dock.y+6)throw Error("Stage overlaps audio capsule");
      await page.locator('[data-open-panel="surahs"]').click({timeout:6000});
      if(!await page.locator("#surahs").isVisible())throw Error("Surah panel failed to open");
      let search=page.locator(".v5-surah-search");if(!await search.isVisible())throw Error("Surah search missing");
      await search.fill("1");
      let remaining=await page.locator("#surahs .sura-button:not(.v5-hidden)").count();
      if(remaining<1||remaining>6)throw Error("Surah pagination malfunction "+remaining);
      await page.keyboard.press("Escape");
      await page.locator('[data-open-panel="settings"]').click({timeout:6000});
      if(!await page.locator("#settings").isVisible())throw Error("Settings failed to open");
      if(!await page.locator("#reciter").isVisible())throw Error("Reciter inaccessible");
      await page.keyboard.press("Escape");
    }
    if(file.startsWith("dar-")){
      let rp=page.locator("#quickRepeat");await rp.click({timeout:6000});
      if((await page.locator("#repeat").inputValue())!=="ayah")throw Error("Quick repeat not synced");
      await rp.click();if((await page.locator("#repeat").inputValue())!=="none")throw Error("Quick repeat not off");
    }else if(width>=360){
      await page.locator("#kidHear").count()||(()=>{throw Error("KIDS actions gone")})();
    }
    if(["small-iphone","iphone","iphone-max","fold-open","tablet"].includes(label))
      await page.screenshot({path:".qa-quran-shots/"+file.replace(".html","")+"-"+label+".png",fullPage:false});
    console.log("PASS",file,label,JSON.stringify({readerH:Math.round(data.reader.height),tabH:Math.round(data.tabHeight),dockH:Math.round(data.dock.height),bodyOverflow:data.bodyHeight-height,ArabicColor:data.ArabicColor}));
   }catch(e){fail++;console.error("FAIL",file,label,e.message);await page.screenshot({path:".qa-quran-shots/FAIL-"+file+"-"+label+".png"}).catch(()=>{})}
   await ctx.close();
  }
 }
 await browser.close();console.log("RESULT",count-fail,"/",count);
 if(fail)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
