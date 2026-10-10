const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const host='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
 const cases=[
 ['adult', 'dar-al-tawhid-quran-player-v7.html',390,844],
 ['kids', 'tawhid-kids-quran-player-v7.html',390,844],
 ['adult-tiny','dar-al-tawhid-quran-player-v7.html',320,568],
 ['kids-tiny','tawhid-kids-quran-player-v7.html',320,568]
 ];
 for(const [name,file,width,height] of cases){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await page.goto(host+'/'+file+'?shot='+name,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(900);
  const metrics=await page.evaluate(()=>{let el=document.querySelector('.verse-focus');return {containerHeight:el.clientHeight,scrollHeight:el.scrollHeight,visibleArabic:document.querySelector('#quranText').textContent,buttons:[...document.querySelectorAll('.page-actions button')].length}});
  console.log('V7_METRICS '+name+': '+JSON.stringify(metrics));
  const bytes=await page.screenshot({type:'jpeg',quality:51,animations:'disabled'});
  const s=bytes.toString('base64'),chunk=2900,count=Math.ceil(s.length/chunk);
  console.log('V7_IMAGE_BEGIN '+name+' '+count);
  for(let i=0;i<count;i++)console.log('V7_IMAGE '+name+' '+i+' '+s.slice(i*chunk,(i+1)*chunk));
  console.log('V7_IMAGE_END '+name);
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
