/* V4 isolated Cloudflare preview only: basic device render/interaction QA. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const base='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
const files=['dar-al-tawhid-quran-player-v3.html','tawhid-kids-quran-player-v3.html'];
const sizes=[['iphone',390,844],['small',375,667],['tiny',320,568],['tablet',820,1180],['landscape',920,760],['desktop',1440,900]];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 fs.mkdirSync('.qa-quran-shots',{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 let failed=0;
 for(const file of files){
  for(const [device,width,height] of sizes){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<720,isMobile:width<720});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    const response=await page.goto(base+'/'+file+'?qa=20261010-v4',{waitUntil:'domcontentloaded',timeout:45000});
    if(response.status()!==200)throw new Error('HTTP '+response.status());
    await page.waitForTimeout(1700);
    const v=await page.evaluate(()=>{
      const style=x=>getComputedStyle(document.querySelector(x));
      const box=x=>document.querySelector(x).getBoundingClientRect();
      const hero=document.querySelector('.hero-object');
      return {
       loadedCss:style('.verse-focus').borderRadius!=='0px'&&style('.verse-focus').backgroundImage.includes('gradient'),
       heroLoaded:hero.complete&&hero.naturalWidth>50,
       backgroundHero:getComputedStyle(document.querySelector('.scene'),'::before').backgroundImage.includes('visuals'),
       bodyScroll:document.documentElement.scrollHeight-innerHeight,
       appWidth:box('.app').width,
       verseHeight:Math.round(box('.verse-focus').height),
       dockTop:Math.round(box('.miniplay').top),
       panelBottom:Math.round(box('.main-panel').bottom),
       textChars:document.querySelector('#quranText').textContent.trim().length,
       quranColor:style('.quran-text').color,
       bgColor:style('.verse-focus').backgroundColor,
       heroHeight:Math.round(box('.scene').height),
       actionsHeight:document.querySelector('.kid-actions')?.getBoundingClientRect().height||0
      }
    });
    if(!v.loadedCss||!v.backgroundHero||!v.heroLoaded)throw new Error('Missing CSS/hero image: '+JSON.stringify(v));
    if(v.verseHeight<55)throw new Error('Verse viewport too small '+JSON.stringify(v));
    if(width<720&&v.bodyScroll>3)throw new Error('Phone document overflow '+JSON.stringify(v));
    if(width<720&&v.panelBottom>v.dockTop+15)throw new Error('Player overlaps audio dock '+JSON.stringify(v));
    if(errors.length)throw new Error('JS pageerror '+errors.join('; '));
    if(width<720){
      await page.locator('[data-open-panel="surahs"]').first().click({timeout:4000});
      await page.waitForTimeout(200);
      if(!await page.locator('#surahs').isVisible())throw new Error('Surah navigation did not open');
      await page.keyboard.press('Escape');await page.waitForTimeout(200);
    }
    if(['iphone','tiny','tablet'].includes(device))await page.screenshot({path:'.qa-quran-shots/'+file.replace('.html','')+'-'+device+'.png'});
    console.log('PASS',file,device,JSON.stringify(v));
   }catch(e){failed++;console.error('FAIL',file,device,String(e));await page.screenshot({path:'.qa-quran-shots/error-'+file+'-'+device+'.png'}).catch(()=>{});}
   finally{await page.close();}
  }
 }
 await browser.close();
 if(failed){console.error(failed+' device QA failures');process.exit(1)}
})().catch(e=>{console.error(e);process.exit(1)});
