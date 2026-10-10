const {chromium}=require("playwright");
const host="https://dar-quran-players-showcase-v3.sero91ak.workers.dev";
const files=[["adult","dar-al-tawhid-quran-player-v9.html"],["kids","tawhid-kids-quran-player-v9.html"]];
const sizes=[["tiny",320,568],["small",375,667],["iphone",390,844],["max",430,932],["fold",719,850],["fold-open",720,900],["ipad",820,1180],["ipad-wide",1024,768]];
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let passed=0,failed=0;const errors=[];
for(const [type,file] of files){
 for(const [screen,width,height] of sizes){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<720,hasTouch:width<720});
  const page=await ctx.newPage();const jsErr=[];page.on("pageerror",e=>jsErr.push(String(e)));
  try{
   const response=await page.goto(host+"/"+file+"?ci=v9-"+type+"-"+screen,{waitUntil:"domcontentloaded",timeout:40000});
   if(response.status()!==200)throw Error("HTTP "+response.status());
   await page.waitForTimeout(350);
   const data=await page.evaluate(()=>{
    const box=s=>{let r=document.querySelector(s).getBoundingClientRect();return {x:r.x,right:r.right,top:r.top,bottom:r.bottom,height:r.height}};
    return {scroll:document.documentElement.scrollHeight-innerHeight,width:document.documentElement.scrollWidth,
     stage:box("#stage"),dock:box(".media-dock"),play:box("#play"),
     quranText:document.getElementById("quranText").textContent.length,
     title:document.getElementById("topSurah").textContent,bridge:!!window.QURAN_V9_BRIDGE,
     menuControls:!!document.getElementById("v9MarkDifficult"),focused:getComputedStyle(document.querySelector(".transport .play"),"::before").top};
   });
   if(jsErr.length)throw Error("JS "+jsErr.join("; "));
   if(!data.bridge||data.quranText<5||!data.menuControls)throw Error("V9 boot incomplete "+JSON.stringify(data));
   if(width<720&&(data.scroll>4||data.width>width+4||data.stage.bottom>data.dock.top+3))throw Error("mobile overflow "+JSON.stringify(data));
   if(data.play.height<43||data.play.height>70)throw Error("play target wrong "+JSON.stringify(data));
   await page.locator("#openMenu").click();
   await page.locator("[data-panel='progress']").click();
   await page.locator("#v9MarkDifficult").click();
   const count=await page.locator("#v9DifficultCount").innerText();
   if(count!=="1")throw Error("manual difficulty marker did not persist "+count);
   await page.locator("#v9MarkLearned").click();
   if((await page.locator("#v9LearnedCount").innerText())!=="1")throw Error("learned flag not saved");
   await page.locator("#sheetClose").click();
   if(type==="adult"){
    await page.locator("#openMenu").click();await page.locator("[data-panel='settings']").click();
    await page.locator("#v9PlaybackMode").selectOption("sequential_surah");
    await page.locator("#v9ReciterMode").selectOption("per_ayah");
    await page.locator("#sheetClose").click();
    await page.evaluate(()=>window.QURAN_V9_BRIDGE.goto(1,7,false));
    await page.evaluate(async()=>await window.QURAN_V9_QUEUE.skip(1));
    let step=await page.evaluate(()=>window.QURAN_V9_BRIDGE.snapshot());
    if(step.surah!==2||step.ayah!==1||step.reciter==="Alafasy_128kbps")throw Error("surah transition and per-ayah reciter rotation: "+JSON.stringify(step));
    await page.evaluate(()=>window.QURAN_V9_BRIDGE.goto(2,282,false));
    await page.waitForTimeout(250);
    const long=await page.evaluate(()=>{
     const reader=document.querySelector(".focus-copy");
     return {length:document.getElementById("quranText").textContent.length,scroll:reader.scrollHeight-reader.clientHeight,
     documentScroll:document.documentElement.scrollHeight-innerHeight};});
    if(long.length<350||long.scroll<10||width<720&&long.documentScroll>4)throw Error("Long Āyah not in independent scrolling stage "+JSON.stringify(long));
    if(screen==="iphone"){
     await page.locator("#openMenu").click();await page.locator("[data-panel='settings']").click();
     await page.locator("#v9PlaybackMode").selectOption("shuffle_ayah");
     await page.locator("#sheetClose").click();
     await page.evaluate(async()=>{Math.random=()=>0.61;await window.QURAN_V9_QUEUE.skip(1)});
     const ran=await page.evaluate(()=>window.QURAN_V9_BRIDGE.snapshot());
     if(!ran.surah||!ran.ayah||ran.surah===2&&ran.ayah===282)throw Error("Shuffle did not transition "+JSON.stringify(ran));
    }
   }else{
    await page.locator("#kidWords").click();
    const words=await page.locator("#quranText .kword.on").count();
    if(words!==1)throw Error("KIDS word selection not working: "+words);
    await page.locator("#kidComplete").click();
    if((await page.locator("#learnCount").innerText())!=="1")throw Error("KIDS learned tracking missing");
   }
   console.log("PASS_V9",type,screen,JSON.stringify({viewport:width+"x"+height,stage:Math.round(data.stage.height),dock:Math.round(data.dock.height),title:data.title}));
   passed++;
   if(["iphone","tiny","ipad"].includes(screen)){
    const fs=require("node:fs");fs.mkdirSync(".qa-v9-screens",{recursive:true});
    await page.screenshot({path:".qa-v9-screens/"+type+"-"+screen+".png",fullPage:false});
   }
  }catch(err){failed++;errors.push(type+" "+screen+": "+err.message);console.log("FAIL_V9",type,screen,err.message);}
  await ctx.close();
 }
}
await browser.close();
console.log("V9_QA_RESULT",passed,"/",passed+failed);
if(failed)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
