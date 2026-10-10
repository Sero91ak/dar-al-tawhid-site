/* V8 Tadabbur/browser integration: covers canonical lookup + UI/transport. */
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const host='https://dar-quran-players-showcase-v3.sero91ak.workers.dev';
let canonical=0,cases=0,fail=0;
for(const surah of [1,103,112]){
 const response=await fetch(host+'/tadabbur/'+String(surah).padStart(3,'0')+'.json');
 if(response.status!==200)throw Error('Canonical '+surah+' HTTP '+response.status);
 const doc=await response.json();
 if(doc.surah!==surah||typeof doc.entries!=='object')throw Error('Canonical invalid '+surah);
 canonical+=Object.keys(doc.entries).length;
 console.log('CANONICAL_SURAH_OK',surah,Object.keys(doc.entries).length);
}
for(const [type,file] of [['adult','dar-al-tawhid-quran-player-v8.html'],['kids','tawhid-kids-quran-player-v8.html']]){
 for(const [device,width,height] of [['tiny',320,568],['iphone',390,844],['tablet',820,1180]]){
  cases++;const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<720,hasTouch:width<720});
  const errors=[];page.on('pageerror',x=>errors.push(String(x)));
  try{
   const r=await page.goto(host+'/'+file+'?ci=v8.3-canonical-'+device,{waitUntil:'domcontentloaded',timeout:45000});
   if(r.status()!==200)throw Error('HTML '+r.status());
   await page.waitForTimeout(700);
   let v=await page.evaluate(()=>{
    const b=x=>{const r=document.querySelector(x).getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    return {bodyScroll:document.documentElement.scrollHeight-window.innerHeight,htmlWidth:document.documentElement.scrollWidth,
      arabic:document.querySelector('#quranText').textContent.trim().length,stage:b('#stage'),dock:b('.media-dock'),tab:b('.focus-switch')}
   });
   if(errors.length)throw Error('JS '+errors.join('; '));
   if(v.arabic<5||v.dock.height<80)throw Error('Incomplete reader '+JSON.stringify(v));
   if(width<720&&(v.bodyScroll>3||v.htmlWidth>width+2||v.stage.bottom>v.dock.top+2))throw Error('Reader/dock overflow '+JSON.stringify(v));
   await page.locator('#openMenu').click();
   if(!await page.locator('.sheet-overlay').evaluate(el=>el.classList.contains('open')))throw Error('Menu did not open');
   await page.locator('[data-panel="display"]').click();
   const latinBefore=await page.locator('[data-layer="lat"]').evaluate(el=>el.classList.contains('active'));
   await page.locator('[data-layer="lat"]').click();
   const latinAfter=await page.locator('[data-layer="lat"]').evaluate(el=>el.classList.contains('active'));
   if(latinAfter===latinBefore)throw Error('Lautschrift display toggle failed');
   await page.locator('[data-panel="settings"]').click();
   if(!await page.locator('#reciter').isVisible())throw Error('Reciter controls missing');
   await page.locator('#sheetClose').click();
   if(await page.locator('.sheet-overlay').evaluate(el=>el.classList.contains('open')))throw Error('Menu did not close');
   await page.locator('[data-mode="understand"]').click();
   await page.waitForTimeout(800);
   if(!await page.locator('#commentBox').isVisible())throw Error('Tadabbur focus not visible');
   const exp=await page.locator('#commentBox').innerText();
   if(!/tadabbur|erklärung/i.test(exp))throw Error('Tadabbur context missing: '+exp);
   if(exp.includes('Der geprüfte Tadabbur-Katalog wird'))throw Error('Old unhelpful placeholder still visible');
   await page.locator('[data-mode="read"]').click();
   if(await page.locator('#commentBox').isVisible())throw Error('Tadabbur stayed visible in reading focus');
   const repeat=page.locator('#quickRepeat');await repeat.click();
   if(await page.locator('#repeat').inputValue()!=='ayah')throw Error('Repeat failed');
   await repeat.click();if(await page.locator('#repeat').inputValue()!=='none')throw Error('Repeat off failed');
   if(type==='kids'){
    await page.locator('#kidComplete').click();
    if(!await page.locator('body').evaluate(el=>el.classList.contains('award')))throw Error('KIDS achievement feedback missing');
   }
   console.log('PASS',type,device,JSON.stringify({stage:Math.round(v.stage.height),dock:Math.round(v.dock.height),scroll:v.bodyScroll}));
  }catch(e){fail++;console.error('FAIL',type,device,e.message);}
  finally{await page.close()}
 }
}
// Verify one actual canonical sample for the supported demo Sūrahs, when present.
for(const surah of [1,103,112]){
 const doc=await (await fetch(host+'/tadabbur/'+String(surah).padStart(3,'0')+'.json')).json();
 const verse=Object.keys(doc.entries||{})[0];if(!verse)continue;
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await page.goto(host+'/dar-al-tawhid-quran-player-v8.html?surah='+surah+'&qa=source',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(650);
  for(let i=1;i<Number(verse);i++)await page.locator('#dockNext').click();
  await page.locator('[data-mode="understand"]').click();
  await page.waitForTimeout(900);
  let msg=await page.locator('#commentBox').innerText();
  if(!msg.includes(doc.entries[verse].text))throw Error('Actual canonical text mismatch '+surah+':'+verse+' excerpt '+msg.slice(0,180));
  console.log('CANONICAL_VERSE_RENDER_PASS',surah+':'+verse);
 }finally{await page.close()}
 break;
}
await browser.close();console.log('V8_CANONICAL_RESULT',cases-fail,'/',cases,'canonical_sample_records',canonical);
if(fail)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
