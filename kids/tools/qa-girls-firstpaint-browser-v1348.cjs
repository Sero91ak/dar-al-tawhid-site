"use strict";
/* Visual computation guard for independent KIDS V1348 preview; no child account data. */
const {chromium,webkit}=require("playwright");
const assert=require("node:assert/strict");
const BASE="https://dar-kids-ipad-preview.sero91ak.workers.dev";
const devices=[
  {name:"iPhone",width:414,height:896},
  {name:"iPad-mini-landscape",width:1024,height:768},
  {name:"iPad-Air-landscape",width:1180,height:820}
];
const results=[];
(async()=>{
  const engine=process.env.KIDS_QA_ENGINE==="webkit"?webkit:chromium;
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:["--no-sandbox"]}:{})});
  try{
    for(const device of devices)for(const gender of ["boy","girl"]){
      const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:1,hasTouch:true,isMobile:device.width<700});
      await ctx.addInitScript(g=>{
        const id="qa-preview-"+g;
        try{
          localStorage.setItem("kids.activeProfile",id);
          localStorage.setItem("kids.profiles.v1",JSON.stringify([{id,gender:g,age:"6–8",name:"QA",data:{}}]));
          localStorage.removeItem("kids.guest.v1");
          localStorage.removeItem("kids.profile.restoreTab");
        }catch(e){}
      },gender);
      const page=await ctx.newPage();
      let pageErrors=[];
      page.on("pageerror",e=>pageErrors.push(String(e).slice(0,240)));
      const res=await page.goto(BASE+"/kids/start?qa=firstpaint-v1348", {waitUntil:"domcontentloaded",timeout:60000});
      assert.equal(res.status(),200,gender+" "+device.name+" HTTP status");
      await page.waitForFunction(()=>document.querySelector(".app")?.dataset.gender&&document.querySelector(".big-choice-grid"),{timeout:30000});
      await page.waitForTimeout(700);
      const state=await page.evaluate(()=>{
        const el=s=>document.querySelector(s);
        const css=(s,p)=>{let e=el(s);return e?getComputedStyle(e,p||null):null};
        const root=document.documentElement,app=el(".app"),home=el("#view-today");
        const q=css("#view-today .choice.quran","::before");
        const ac=css("#view-today .academy-pilot-entry");
        const h=css("#view-today .kids-salah-home-world");
        const b=css("#view-today .choice.story","::before");
        return {boot:root.dataset.kidsBootGender,active:app?.dataset.gender,
          theme:el('meta[name="theme-color"]')?.content,
          quranImage:q?.backgroundImage,storiesImage:b?.backgroundImage,
          academyBackground:ac?.backgroundImage,prayerBackground:h?.backgroundImage,
          homeVisible:home?.classList.contains("active"),
          cardCount:el("#view-today .big-choice-grid")?.children?.length||0,
          academyDisplay:ac?.display,bodyBg:css("body")?.backgroundColor};
      });
      assert.equal(state.boot,gender,device.name+" early gender");
      assert.equal(state.active,gender,device.name+" active gender");
      assert.equal(state.homeVisible,true,device.name+" active home");
      assert.ok(state.cardCount>=3,device.name+" choices missing");
      assert.ok(state.prayerBackground&&state.prayerBackground.includes("hero-home.png"),device.name+" approved photo missing");
      if(gender==="girl"){
        assert.equal(state.theme,"#241b35",device.name+" girls theme-color");
        assert.ok(state.quranImage.includes("world-quran.png"),"Original girls Qur'an art missing");
        assert.ok(state.quranImage.includes("rgba(37, 22, 45"),"Blue overlay on girls Qur'an remains");
        assert.ok(state.storiesImage.includes("rgba(35, 22, 35"),"Blue overlay on girls books remains");
        assert.ok(state.academyBackground.includes("rgb(80, 49, 75"),"Girls academy blue card remains");
      }else{
        assert.equal(state.theme,"#0c2636",device.name+" boys theme-color");
        assert.ok(!state.academyBackground.includes("rgb(80, 49, 75"),"Boys academy inherited girl color");
      }
      console.log("BROWSER_V1348_OK",device.name,gender,JSON.stringify({boot:state.boot,cardCount:state.cardCount,theme:state.theme,homeVisible:state.homeVisible,academy:state.academyBackground.slice(0,85),pageErrors:pageErrors.slice(0,2)}));
      await ctx.close();
      results.push(state);
    }
    /* Simulate the exact pre-prayer-module startup window.
       The approved hero must paint immediately, without obsolete images. */
    for(const gender of ["girl","boy"]){
      const c=await browser.newContext({viewport:{width:414,height:896},deviceScaleFactor:1,isMobile:true,hasTouch:true});
      await c.addInitScript(g=>{
        try{
          const id="qa-firstpaint-"+g;
          localStorage.setItem("kids.activeProfile",id);
          localStorage.setItem("kids.profiles.v1",JSON.stringify([{id,gender:g,age:"6–8",name:"QA",data:{}}]));
        }catch(e){}
      },gender);
      const page=await c.newPage();
      await page.route("**/kids/prayer-stage-v1261.js*",route=>route.abort("failed"));
      const response=await page.goto(BASE+"/kids/start?qa=before-prayer-v1348",{waitUntil:"domcontentloaded",timeout:60000});
      assert.equal(response.status(),200);
      const first=await page.evaluate(()=>{
        const hero=document.querySelector("#view-today > .hero");
        return {gender:document.querySelector(".app")?.dataset.gender,
          background:hero?getComputedStyle(hero).backgroundImage:"",
          oldPseudo:hero?getComputedStyle(hero,"::before").display:""};
      });
      assert.equal(first.gender,gender,"first-frame gender");
      assert.ok(first.background.includes("hero-home.png?v=1274"),"Initial old artwork still appears");
      assert.ok(!/warm-world|hero-clean-reference|hero-poster/.test(first.background),"Legacy wallpaper in initial frame");
      assert.equal(first.oldPseudo,"none","Legacy hero pseudo still paints");
      console.log("KIDS_FIRST_FRAME_V1348_OK",gender,engine===webkit?"WebKit":"Chromium");
      await c.close();
    }
    console.log("KIDS_GIRLS_BROWSER_V1348_COMPLETE: "+results.length+" views, all computed palette and photo checks passed");
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
