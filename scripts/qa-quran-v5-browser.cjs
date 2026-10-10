/* V5 isolated Cloudflare preview: responsive device, drawer, contrast and player QA. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const base='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
const files=['dar-al-tawhid-quran-player-v3.html','tawhid-kids-quran-player-v3.html'];
const sizes=[['micro',320,568],['small',360,640],['compact',375,667],['iphone',390,844],['max',430,932],['wide',680,730],['hingeClosed',719,820],['hingeOpen',720,820],['tablet',820,1180],['tabletWide',1024,768],['foldOpen',920,760],['desktop',1440,900]];
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
       heroLoaded:hero?hero.complete&&hero.naturalWidth>50:false,
       backgroundHero:getComputedStyle(document.querySelector('.scene'),'::before').backgroundImage.includes('visuals'),
       bodyScroll:document.documentElement.scrollHeight-innerHeight,
       appWidth:box('.app').width,
       verseHeight:Math.round(box('.verse-focus').height),
       dockTop:Math.round(box('.miniplay').top),
       panelBottom:Math.round(box('.main-panel').bottom),
       textChars:document.querySelector('#quranText').textContent.trim().length,
       quranColor:style('.quran-text').color,
       translationColor:style('.translation').color,
       bgColor:style('.verse-focus').backgroundColor,
       heroHeight:Math.round(box('.scene').height),
       foregroundHero:!!hero&&getComputedStyle(hero).display!=='none',
       visibleReaderTabs:[...document.querySelectorAll('.reader-tools .tab')].every(x=>{const r=x.getBoundingClientRect(),p=document.querySelector('.reader-tools').getBoundingClientRect();return r.left>=p.left-2&&r.right<=p.right+2&&r.width>38}),
       repeatAvailable:!!document.querySelector('#quickRepeat'),
       actionsHeight:document.querySelector('.kid-actions')?.getBoundingClientRect().height||0
      }
    });
    if(!v.loadedCss||!v.backgroundHero||(file.startsWith('tawhid-')&&!v.heroLoaded))throw new Error('Missing CSS/hero image: '+JSON.stringify(v));
    if(file.startsWith('dar-')&&v.foregroundHero)throw new Error('Adult hero still contains toy 3D object: '+JSON.stringify(v));
    if(v.verseHeight<55)throw new Error('Verse viewport too small '+JSON.stringify(v));
    if(file.startsWith('dar-') && (v.quranColor!=='rgb(25, 56, 67)' || v.translationColor!=='rgb(53, 70, 75)'))
      throw new Error('Adult cream paper text contrast incorrect '+JSON.stringify(v));
    if(file.startsWith('tawhid-') && v.quranColor!=='rgb(23, 74, 117)')
      throw new Error('KIDS light reader contrast incorrect '+JSON.stringify(v));
    if(width<720&&!v.visibleReaderTabs)throw new Error('Reader tools clipped/horizontally scroll: '+JSON.stringify(v));
    if(width<720&&v.bodyScroll>3)throw new Error('Phone document overflow '+JSON.stringify(v));
    if(width<720&&v.panelBottom>v.dockTop+15)throw new Error('Player overlaps audio dock '+JSON.stringify(v));
    if(errors.length)throw new Error('JS pageerror '+errors.join('; '));
    if(file.startsWith('dar-')){
      if(!v.repeatAvailable)throw new Error('No direct repeat control');
      const repeat=page.locator('#quickRepeat'),value=page.locator('#repeat');
      await repeat.click({timeout:4500});
      if((await value.inputValue())!=='ayah'||(await repeat.getAttribute('aria-pressed'))!=='true')throw new Error('Repeat shortcut did not sync with settings');
      await repeat.click({timeout:4500});
      if((await value.inputValue())!=='none')throw new Error('Repeat shortcut did not toggle off');
    }
    if(width<720){
      await page.locator('[data-open-panel="surahs"]').first().click({timeout:4000});
      await page.waitForTimeout(200);
      if(!await page.locator('#surahs').isVisible())throw new Error('Surah navigation did not open');
      await page.keyboard.press('Escape');await page.waitForTimeout(200);
    }
    if(['iphone','micro','tablet','foldOpen'].includes(device))await page.screenshot({path:'.qa-quran-shots/'+file.replace('.html','')+'-v5-'+device+'.png'});
    console.log('PASS',file,device,JSON.stringify(v));
   }catch(e){failed++;console.error('FAIL',file,device,String(e));await page.screenshot({path:'.qa-quran-shots/error-'+file+'-'+device+'.png'}).catch(()=>{});}
   finally{await page.close();}
  }
 }
 await browser.close();
 if(failed){console.error(failed+' device QA failures');process.exit(1)}
})().catch(e=>{console.error(e);process.exit(1)});
