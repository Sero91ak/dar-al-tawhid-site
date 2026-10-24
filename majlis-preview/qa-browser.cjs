const { chromium, devices } = require('playwright');
const base='https://dar-majlis-nova-v3-preview.sero91ak.workers.dev/';
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
for(const width of [390,820,1440]){
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,hasTouch:width===390});
 await context.addInitScript(()=>localStorage.setItem('dar-heritage-seen','true'));
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#page-home.active',{timeout:15000});
 await page.waitForTimeout(300);
 const brand=await page.locator('.brandcopy strong').innerText();if(!brand.includes('DĀR AL TAWḤĪD'))throw Error('Brand '+width);
 const topSearch=await page.locator('.topbar .searchbar').evaluate(e=>getComputedStyle(e).display);if(topSearch!=='none')throw Error('Header search still visible '+width);
 if(await page.locator('#communityTg svg').count()!==1)throw Error('Original Telegram social icon missing '+width);
 if(width<681){
   await page.locator('.tabbar button[data-go="more"]').click();
 } else {
   await page.locator('#btnMenu').click();
 }
 await page.waitForSelector('.modal.open .more-grid');
 if(await page.locator('.more-cell').count()<15)throw Error('Not all More items '+width);
 await page.locator('.modal.open .more-cell[data-go="posts"]').click();
 await page.waitForSelector('#page-posts.active');
 if(await page.locator('#postList .editorial-entry').count()<3)throw Error('Posts missing '+width);
 await page.locator('#postList [data-post]').first().click();
 await page.waitForSelector('.modal.open .manuscript-reader');
 if(await page.locator('.manuscript-author').count()!==1||await page.locator('.share-social svg').count()<4)throw Error('Reader/share '+width);
 const reader=await page.locator('.manuscript-reader').innerText();if(reader.includes('2026-10-21'))throw Error('Archive dates are visible in reader');
 await page.locator('#closeModal').click();
 await page.waitForTimeout(200);
 if(width<681) await page.locator('.tabbar button[data-go="quran"]').click();
 else await page.locator('#sidenav [data-go="quran"]').click();
 await page.waitForSelector('#page-quran.active .school-verse');
 await page.locator('.school-tabs [data-qmode="learn"]').click();
 const learnState=await page.evaluate(()=>({mode:document.querySelector('.school-tabs .on')?.getAttribute('data-qmode'),qClass:document.querySelector('#surahText')?.className,section:document.querySelector('#page-quran')?.className,visible:getComputedStyle(document.querySelector('#surahText')).display}));
 console.log('QURAN DEBUG '+width+' '+JSON.stringify(learnState)+' PAGE ERR '+JSON.stringify(errors.slice(-4)));
 await page.waitForSelector('.quran-mode-learn',{timeout:2500});
 await page.locator('.school-verse [data-translation]').first().click();
 const label=await page.locator('.school-verse [data-translation]').first().innerText();
 if(!label.includes('anzeigen'))throw Error('Learning toggle '+width);
 await page.locator('[data-qfont="1"]').click();
 if(width<681)await page.locator('.tabbar button[data-go="more"]').click();else await page.locator('#topTheme').click();
 if(width<681){await page.locator('.modal.open [data-go="settings"]').click();await page.locator('#topTheme').click()}
 await page.waitForSelector('.modal.open .appearance-option');
 if(await page.locator('.modal.open .appearance-option').count()<9)throw Error('Themes missing '+width);
 await page.locator('.modal.open [data-appearance="royal"]').click();
 const theme=await page.locator('body').getAttribute('data-appearance');if(theme!=='royal')throw Error('Royal theme switch '+width);
 const scroll=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(scroll>5)throw Error('Horizontal overflow '+width+' : '+scroll);
 if(errors.length)throw Error('Browser JS '+width+': '+errors.slice(0,3).join('; '));
 console.log('BROWSER QA OK '+width+'px; 3D nav, More popup, reader, share SVG, Quran learn and theme.');
 await context.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
