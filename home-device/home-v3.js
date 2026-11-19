/* DĀR HOME Next Generation V3 – independent UX layer over the proven V2 engine.
   No secrets, no GitHub write credentials and no local-network privilege assumptions. */
(()=>{'use strict';
 const ROOT='https://dar-al-tawhid.de';
 const KEY='dar-home-v3-preferences';
 const $=id=>document.getElementById(id);
 const icon=name=>ROOT+'/assets/dar-3d-icons/'+name+'.png';
 let wallpapers=[
  {id:'dar-wide',label:'DĀR · Weites Motiv',url:ROOT+'/assets/home-v1194/hero-wide-adobe.jpg'},
  {id:'dar-mobile',label:'DĀR · Hochformat-Motiv',url:ROOT+'/assets/home-v1194/hero-mobile-adobe.jpg'},
  {id:'dar-study',label:'DĀR · Wissensraum',url:ROOT+'/assets/home-v1194/study-runway.jpg'},
  {id:'prayer-cinema',label:'Gebet · Cinematic',url:ROOT+'/kids/assets/kids-salah-v1262/cinematic-still.jpg'},
  {id:'tv-kaaba-day',label:'Kaʿba · Tag',url:'/media/apple-tv/tv-kaaba-day.jpg',native:true},
  {id:'tv-kaaba-sunrise',label:'Kaʿba · Sonnenaufgang',url:'/media/apple-tv/tv-kaaba-sunrise.jpg',native:true},
  {id:'tv-kaaba-sunset',label:'Kaʿba · Sonnenuntergang',url:'/media/apple-tv/tv-kaaba-sunset.jpg',native:true},
  {id:'home-cinema',label:'DĀR · Cinematic',url:ROOT+'/test/assets/dar-3d-icons/dar-home-cinematic-hero.png'},
  {id:'kids-hero',label:'Moschee · Nachtmotiv',url:ROOT+'/kids/assets/kids-home-v1191/hero-static-reference.jpg'},
  {id:'abstract',label:'Klassisch · ohne Bild',url:''}
 ];
 let prefs={theme:'dark',wallpaper:'tv-kaaba-day',wallpaperMode:'manual',reduceMotion:false,saverWallpaper:'same',adhanCinema:true,allowBackgroundUpdates:true};
 try{const from=JSON.parse(localStorage.getItem(KEY)||'{}');if(from&&typeof from==='object'&&!Array.isArray(from)){prefs={...prefs,...from}}}catch{}
 const safeHTML=(str)=>String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 function imageFor(name){let w=wallpapers.find(x=>x.id===name);if(name==='custom'){const raw=localStorage.getItem(KEY+'-wallpaper')||'';return /^data:image\/(?:png|jpeg|webp);base64,/i.test(raw)?raw:''}return w?.url||''}
 function automaticWallpaperId(){const hour=new Date().getHours(),period=hour>=6&&hour<17?'day':'night';let choices=wallpapers.filter(x=>x.native&&(x.period===period||x.period==='any'));if(!choices.length)choices=wallpapers.filter(x=>x.native);return choices[Math.floor(Date.now()/21600000)%Math.max(1,choices.length)]?.id||'tv-kaaba-day'}
 function resolveWallpaper(name){return name==='auto'?automaticWallpaperId():name}
 function store(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){warn('Einstellungen konnten nicht gespeichert werden')}}
 function warn(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3900)}
 function apply(){
  const app=$('app');if(!app)return;
  app.classList.toggle('reduced-motion',!!prefs.reduceMotion);
  const motionControl=$('homeReduceMotion');if(motionControl)motionControl.checked=!!prefs.reduceMotion;
  app.dataset.homeTheme=prefs.theme==='light'?'light':'dark';
  const homeChoice=prefs.wallpaperMode==='auto'?'auto':prefs.wallpaper;
  const bg=imageFor(resolveWallpaper(homeChoice));
  app.style.backgroundImage=bg?'url("'+bg.replaceAll('"','%22')+'")':'none';
  app.style.backgroundSize=bg?'cover':'';
  app.style.backgroundPosition=bg?'center':'';
  app.style.backgroundRepeat='no-repeat';
  app.style.setProperty('--home-artwork-opacity',bg?(prefs.theme==='light'?'0.10':'0.19'):'1');
  const saver=$('saver');if(saver){
   const saverChoice=prefs.saverWallpaper==='same'?homeChoice:prefs.saverWallpaper;
   const sbg=imageFor(resolveWallpaper(saverChoice));
   saver.style.backgroundImage=sbg?'url("'+sbg.replaceAll('"','%22')+'")':'none';
   saver.style.backgroundSize=sbg?'cover':'';
   saver.style.backgroundPosition=sbg?'center':'';
   saver.style.backgroundRepeat='no-repeat';
  }
  const adhan=$('adhanVisual');if(adhan){
   const fallback='/media/apple-tv/tv-kaaba-day.jpg';
   const selected=prefs.adhanCinema&&bg?bg:fallback;
   adhan.style.backgroundImage='url("'+selected.replaceAll('"','%22')+'")';
  }
  const mode=$('homeAppearance');if(mode)mode.value=prefs.theme;
  const legacyTheme=$('theme');if(legacyTheme)legacyTheme.value=prefs.theme==='light'?'ivory':'night';
  const wallMode=$('homeWallpaperMode');if(wallMode)wallMode.value=prefs.wallpaperMode;
  const saverMode=$('homeSaverBackground');if(saverMode)saverMode.value=prefs.saverWallpaper;
  const cinema=$('homeCinemaBackground');if(cinema)cinema.checked=!!prefs.adhanCinema;
  const preview=$('wallpaperOptions');if(preview)preview.querySelectorAll('button[data-wallpaper]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wallpaper===prefs.wallpaper)));
  const themeQuick=$('h3ThemeToggle');if(themeQuick)themeQuick.setAttribute('aria-label',prefs.theme==='dark'?'Helles Erscheinungsbild wählen':'Dunkles Erscheinungsbild wählen');
 }
 function augmentBrand(){
  const mark=document.querySelector('.logo-mark');
  if(mark){mark.textContent='';const i=new Image();i.src='/media/apple-tv/tv-brand-mark.png';i.alt='DĀR AL TAWḤĪD Markenzeichen';i.onerror=()=>{if(i.dataset.fallback!=='remote'){i.dataset.fallback='remote';i.src=ROOT+'/app-logo-original.png'}else mark.textContent='دار'};mark.append(i)}
  const small=document.querySelector('.brand-mini');if(small)small.textContent='H O M E  ·  SMART PRAYER DISPLAY';
  const top=$('openSettings');
  if(top&&!$('h3ThemeToggle')){
   const b=document.createElement('button');b.className='topbtn';b.id='h3ThemeToggle';b.title='Hell/Dunkel umschalten';b.innerHTML='';const themeIcon=new Image();themeIcon.src=icon('spark');themeIcon.className='h3-action-icon';themeIcon.alt='';themeIcon.setAttribute('aria-hidden','true');b.append(themeIcon);
   b.addEventListener('click',()=>{prefs.theme=prefs.theme==='dark'?'light':'dark';store();apply()});
   top.parentNode.insertBefore(b,top);
  }
  const actionIcons={openSettings:'settings',addCity:'compass',previewCities:'calendar',testQuran:'headphones',h4ShowVerse:'quran',h4ShowHadith:'hadith',loadNewContent:'more',previewAdhan:'bell',previewFajrAdhan:'bell',saverPreview:'image',homeGalleryReset:'home',homeRefreshNow:'widgets',syncNow:'widgets',stopAdhan:'bell'};
  for(const [id,name] of Object.entries(actionIcons)){
   const b=$(id);if(!b||b.querySelector('.h3-action-icon')||b.classList.contains('round'))continue;
   const img=document.createElement('img');img.src=icon(name);img.className='h3-action-icon';img.alt='';img.setAttribute('aria-hidden','true');b.classList.add('h3-icon-action');b.insertBefore(img,b.firstChild);
  }
  const sectionIcons=[['.times-band','prayer']];
  for(const [selector,name] of sectionIcons){const section=document.querySelector(selector);if(section&&!section.querySelector(':scope > .h3-section-emblem')){const img=new Image();img.src=icon(name);img.className='h3-section-emblem';img.alt='';img.setAttribute('aria-hidden','true');section.prepend(img)}}
  const nav=document.querySelector('.footnav');
  if(nav&&!$('h3FooterSettings')){
   const b=document.createElement('button');b.id='h3FooterSettings';b.className='touchbutton';
   const i=new Image();i.src=icon('settings');i.className='nav-icon';i.alt='';
   b.append(i,document.createTextNode(' Einstellungen'));b.addEventListener('click',()=>top?.click());nav.append(b);
  }
  for(const btn of document.querySelectorAll('.prayer-cell')){btn.querySelector('.prayer-glyph')?.remove();}
 }
 function makeWallpaperGallery(){
  const parent=$('wallpaperOptions');if(!parent)return;
  parent.replaceChildren();
  const opts=wallpapers.slice();
  if(localStorage.getItem(KEY+'-wallpaper'))opts.push({id:'custom',label:'Eigenes Bild (nur dieses Gerät)',url:imageFor('custom')});
  for(const item of opts){
   const b=document.createElement('button');b.className='wallpaper-option';b.type='button';b.dataset.wallpaper=item.id;
   b.setAttribute('aria-pressed',String(prefs.wallpaper===item.id));
   if(item.url){const img=new Image();img.src=item.thumbnail||item.url;img.alt='Hintergrund: '+item.label;img.loading='lazy';b.append(img)}
   else{const blank=document.createElement('div');blank.style.cssText='aspect-ratio:16/9;background:linear-gradient(130deg,#09272a,#224c3e);border-radius:7px';b.append(blank)}
   const title=document.createElement('strong');title.textContent=item.label;b.append(title);
   b.addEventListener('click',()=>{prefs.wallpaper=item.id;prefs.wallpaperMode='manual';const mode=$('homeWallpaperMode');if(mode)mode.value='manual';store();apply()});parent.append(b);
  }
  apply();
 }
 async function loadMediaCatalog(){
  try{
   const r=await fetch('/media/apple-tv/catalog.json',{cache:'no-store'});
   if(!r.ok)return;
   const catalog=await r.json();
   if(catalog?.schemaVersion!==1||!Array.isArray(catalog.wallpapers))return;
   const mediaPath=/^\/media\/apple-tv\/[A-Za-z0-9._-]+\.(?:jpg|webp|png)$/;
   const entries=catalog.wallpapers.filter(x=>x&&/^[a-z0-9-]{2,48}$/.test(x.id||'')&&typeof x.label==='string'&&mediaPath.test(x.url||'')&&(!x.thumbnail||mediaPath.test(x.thumbnail)));
   if(!entries.length)return;
   const preferred=prefs.wallpaper;
   const ids=new Set(entries.map(x=>x.id));
   wallpapers=[...wallpapers.filter(x=>!x.native&&!ids.has(x.id)),...entries.map(x=>({...x,native:true}))];
   const saverSelect=$('homeSaverBackground');
   if(saverSelect){const options=[{id:'same',label:'Wie HOME-Hintergrund'},{id:'auto',label:'Automatisch nach Tageszeit'},...wallpapers.map(x=>({id:x.id,label:x.label}))];saverSelect.replaceChildren(...options.map(x=>new Option(x.label,x.id)));saverSelect.value=options.some(x=>x.id===prefs.saverWallpaper)?prefs.saverWallpaper:'same';}
   if(!wallpapers.some(x=>x.id===preferred)){
    prefs.wallpaper=wallpapers.some(x=>x.id===catalog.defaultWallpaper)?catalog.defaultWallpaper:entries[0].id;
    store();
   }
   makeWallpaperGallery();
  }catch(e){/* use the bundled fallback gallery when the catalog is offline */}
 }
 function bindAppearancePicker(){
  const opener=$('openAppearance'),picker=$('appearancePopover');if(!opener||!picker)return;
  const close=()=>{picker.hidden=true;opener.setAttribute('aria-expanded','false')};
  const sync=()=>picker.querySelectorAll('[data-home-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.homeThemeChoice===(prefs.theme==='light'?'light':'dark'))));
  opener.addEventListener('click',event=>{event.stopPropagation();picker.hidden=!picker.hidden;opener.setAttribute('aria-expanded',String(!picker.hidden));if(!picker.hidden)sync()});
  picker.addEventListener('click',event=>{event.stopPropagation();const button=event.target.closest('[data-home-theme-choice]');if(!button)return;const choice=button.dataset.homeThemeChoice;prefs.theme=choice==='light'?'light':'dark';store();apply();window.darHomeApplyThemeChoice?.(prefs.theme);sync();close()});
  document.addEventListener('click',event=>{if(!picker.hidden&&!picker.contains(event.target)&&event.target!==opener&&!opener.contains(event.target))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!picker.hidden){close();opener.focus({preventScroll:true})}});
 }
 function bind(){
  const sel=$('homeAppearance');if(sel)sel.addEventListener('change',()=>{prefs.theme=sel.value;store();apply()});
  const legacyTheme=$('theme');if(legacyTheme)legacyTheme.addEventListener('change',()=>{prefs.theme=legacyTheme.value==='ivory'?'light':'dark';const appearance=$('homeAppearance');if(appearance)appearance.value=prefs.theme;store();apply()});
  const saver=$('homeSaverBackground');if(saver){const options=[{id:'same',label:'Wie HOME-Hintergrund'},{id:'auto',label:'Automatisch nach Tageszeit'},...wallpapers.map(x=>({id:x.id,label:x.label}))];saver.replaceChildren(...options.map(x=>new Option(x.label,x.id)));saver.addEventListener('change',()=>{prefs.saverWallpaper=saver.value;store();apply()})}
  const wallMode=$('homeWallpaperMode');if(wallMode){wallMode.value=prefs.wallpaperMode;wallMode.addEventListener('change',()=>{prefs.wallpaperMode=wallMode.value;store();apply()})}
  const motionControl=$('homeReduceMotion');if(motionControl){motionControl.checked=!!prefs.reduceMotion;motionControl.addEventListener('change',()=>{prefs.reduceMotion=motionControl.checked;store();apply()})}
  const cin=$('homeCinemaBackground');if(cin)cin.addEventListener('change',()=>{prefs.adhanCinema=cin.checked;store();apply()});
  const upload=$('homeWallpaperUpload');if(upload)upload.addEventListener('change',async()=>{
   const file=upload.files?.[0];if(!file)return;
   if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>20*1024*1024){warn('Bitte JPG, PNG oder WebP bis 20 MB wählen');upload.value='';return}
   try{
    let blob=file;
    if('createImageBitmap' in window){
     const bitmap=await createImageBitmap(file),scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));
     const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
     const ctx=canvas.getContext('2d',{alpha:false});ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
     blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84))||file;
    }
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)});
    localStorage.setItem(KEY+'-wallpaper',data);prefs.wallpaper='custom';prefs.wallpaperMode='manual';store();makeWallpaperGallery();warn('Eigenes Hintergrundbild übernommen');
   }catch{warn('Bild konnte nicht gespeichert werden. Bitte ein kleineres Bild wählen.')}
   finally{upload.value=''}
  });
  $('homeGalleryReset')?.addEventListener('click',()=>{prefs.wallpaper='tv-kaaba-day';prefs.wallpaperMode='manual';prefs.saverWallpaper='same';localStorage.removeItem(KEY+'-wallpaper');store();makeWallpaperGallery();const m=$('homeWallpaperMode');if(m)m.value=prefs.wallpaperMode});
  $('homeAudioUnlock')?.addEventListener('click',()=>{warn('Audio-Freigabe: bitte im Aḏān-Reiter „Aḏān einmalig testen“ drücken. Browser-Autoplay bleibt geräteabhängig.')});
  $('homeRefreshNow')?.addEventListener('click',()=>{$('syncNow')?.click()});
  $('homeAppPairing')?.addEventListener('click',()=>warn('Sichere WLAN-Kopplung erfordert eine native Geräte-Bridge. Noch nicht freigeschaltet.'));
  $('theme')?.addEventListener('change',()=>{prefs.theme=$('theme').value==='ivory'?'light':'dark';store();apply()});
  $('saveSettings')?.addEventListener('click',()=>{if($('homeAppearance'))prefs.theme=$('homeAppearance').value;store();setTimeout(apply,0)});
  makeWallpaperGallery();
 }
 function updateAdhanTitle(){
  const el=$('adhanVisual');if(!el?.classList.contains('active'))return;
  const info=$('adhanInfo')?.textContent||'';
  const key=el.dataset.prayerKey||'',isTest=key==='test'||key.startsWith('test:'),prayerKey=key.startsWith('test:')?key.slice(5):key;const name=key==='test'?'Aḏān-Test':({fajr:'Faǧr',dhuhr:'Ḍuhr',asr:'ʿAṣr',maghrib:'Maġrib',isha:'ʿIšāʾ'}[prayerKey]||'Aḏān');
  const title=el.querySelector('.adhan-title');if(title)title.textContent=isTest?(name==='Aḏān-Test'?'Aḏān · Hörprobe':name+' · Hörprobe'):name==='Aḏān'?'Aḏān · Gebetszeit':name+' · Aḏān';
  el.dataset.cinema=prefs.adhanCinema?'on':'off';
 }
 function handleConnection(){
  const t=$('homeConnectionStatus');if(t)t.textContent=navigator.onLine?'Verbunden – DĀR-Livequellen werden regelmäßig geprüft':'Offline – lokale Gebetsberechnung; letzte gespeicherte Inhalte ggf. veraltet';
 }

 const picker=$('surahPicker'), opener=$('openSurahPicker'), search=$('surahSearch'), list=$('surahList'), nativeSelect=$('surah');
 function renderSurahPicker(query=''){
  if(!list||!nativeSelect)return;
  const q=String(query).trim().toLocaleLowerCase(),selected=String(nativeSelect.value);
  list.replaceChildren();
  for(const option of nativeSelect.options){
   const id=String(option.value),raw=String(option.textContent||''),title=raw.replace(/^\d+\s*·\s*/,'').split(' · ')[0].trim();
   if(q&&!id.includes(q)&&!raw.toLocaleLowerCase().includes(q))continue;
   const b=document.createElement('button');b.type='button';b.className='surah-option';b.setAttribute('role','option');b.setAttribute('aria-selected',String(id===selected));b.dataset.surah=id;
   const n=document.createElement('span');n.className='surah-number';n.textContent=id;
   const name=document.createElement('span');name.className='surah-name';name.textContent=title;
   const meaning=document.createElement('span');meaning.className='surah-meaning';meaning.textContent='Sūrah '+id;
   name.append(meaning);b.append(n,name);b.addEventListener('click',()=>{nativeSelect.value=id;nativeSelect.dispatchEvent(new Event('change',{bubbles:true}));closeSurahPicker()});list.append(b);
  }
 }
 function closeSurahPicker(){if(!picker)return;picker.hidden=true;opener?.setAttribute('aria-expanded','false');opener?.focus()}
 opener?.addEventListener('click',()=>{if(!picker)return;renderSurahPicker(search?.value||'');picker.hidden=false;opener.setAttribute('aria-expanded','true');search?.focus()});
 $('closeSurahPicker')?.addEventListener('click',closeSurahPicker);picker?.addEventListener('click',e=>{if(e.target===picker)closeSurahPicker()});search?.addEventListener('input',()=>renderSurahPicker(search.value));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&picker&&!picker.hidden)closeSurahPicker()});
 const dataObserver=new MutationObserver(()=>{if(picker&&!picker.hidden)renderSurahPicker(search?.value||'')});if(nativeSelect)dataObserver.observe(nativeSelect,{childList:true});
 nativeSelect?.addEventListener('change',()=>{if(picker&&!picker.hidden)renderSurahPicker(search?.value||'')});
 function renderHijriDate(){const targets=[$('hijriHeader'),$('calendarPanelHijri')].filter(Boolean);let value='Hiǧrī-Datum nicht verfügbar';try{value=new Intl.DateTimeFormat('de-DE-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'}).format(new Date())}catch{try{value=new Intl.DateTimeFormat('de-DE-u-ca-islamic',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'}).format(new Date())}catch{}}targets.forEach(el=>el.textContent=value)}
 const localRoute={active:null,returnFocus:null,hideTimer:0};
 function addViewSettings(view){
  const host=view.querySelector('.quran-reader-actions,.home-view-head,.tadabbur-head');if(!host||host.querySelector('[data-home-settings]'))return;
  const button=document.createElement('button');button.type='button';button.className='route-settings';button.dataset.homeSettings='';button.setAttribute('aria-label','Einstellungen öffnen');button.title='Einstellungen';
  const img=new Image();img.src=icon('settings');img.alt='';img.setAttribute('aria-hidden','true');button.append(img);host.append(button);
 }
 function openLocalView(id){
  const view=$(id),screen=$('mainScreen');if(!view||!screen||localRoute.active===id)return;
  clearTimeout(localRoute.hideTimer);const previous=localRoute.active&&$(localRoute.active);
  if(previous){previous.classList.remove('is-active');previous.classList.add('is-leaving')}else localRoute.returnFocus=document.activeElement;
  document.querySelectorAll('.home-view').forEach(x=>{if(x!==previous&&x!==view){x.hidden=true;x.classList.remove('is-active','is-leaving')}});
  screen.hidden=false;screen.inert=true;screen.setAttribute('aria-hidden','true');screen.classList.add('view-covered');
  view.hidden=false;view.inert=false;view.removeAttribute('aria-hidden');view.classList.remove('is-leaving','is-active');view.classList.add('route-entering');void view.offsetWidth;
  document.body.classList.add('home-view-open');localRoute.active=id;addViewSettings(view);
  requestAnimationFrame(()=>{view.classList.remove('route-entering');view.classList.add('is-active')});
  if(previous)localRoute.hideTimer=setTimeout(()=>{previous.hidden=true;previous.classList.remove('is-leaving')},360);
  view.querySelector('[data-close-home-view]')?.focus({preventScroll:true});
  if(id==='quranReaderPanel')document.dispatchEvent(new Event('dar:quran-reader-open'));
 }
 function closeLocalViews(){
  if(!localRoute.active)return;const active=$(localRoute.active),screen=$('mainScreen');localRoute.active=null;clearTimeout(localRoute.hideTimer);
  active?.classList.remove('is-active');active?.classList.add('is-leaving');
  if(screen){screen.hidden=false;screen.inert=false;screen.removeAttribute('aria-hidden');screen.classList.remove('view-covered')}
  document.body.classList.remove('home-view-open');
  localRoute.hideTimer=setTimeout(()=>{document.querySelectorAll('.home-view').forEach(x=>{x.hidden=true;x.classList.remove('is-leaving','is-active')});localRoute.returnFocus?.focus?.({preventScroll:true});localRoute.returnFocus=null},360);
 }
 let routeSwipeStart=null;
 document.addEventListener('pointerdown',e=>{if(!localRoute.active||e.pointerType==='mouse'||e.target.closest('button,a,input,select,textarea,[role=button]')){routeSwipeStart=null;return}routeSwipeStart={x:e.clientX,y:e.clientY}},{passive:true});
 document.addEventListener('pointerup',e=>{if(!routeSwipeStart)return;const dx=e.clientX-routeSwipeStart.x,dy=e.clientY-routeSwipeStart.y;routeSwipeStart=null;if(dx>88&&Math.abs(dx)>Math.abs(dy)*1.25)closeLocalViews()},{passive:true});
 document.addEventListener('click',e=>{if(e.target.closest('[data-home-settings]'))window.darHomeEnterSettings?.('standort')});
 function bindQuranReader(){
  const panel=$('quranReaderPanel'),surahSelect=$('readerSurah'),reciterSelect=$('readerReciter'),api=()=>window.darQuranReaderAPI;
  if(!panel||!surahSelect||!api())return;
  const cache=new Map();let requestKey='';
  function options(){const a=api();if(!a)return;const cur=a.state(),ss=a.surahs(),rr=a.reciters();if(!surahSelect.options.length)ss.forEach(x=>surahSelect.add(new Option(x.id+' · '+x.name,x.id)));if(!reciterSelect.options.length)rr.forEach(x=>reciterSelect.add(new Option(x.name,x.edition)));surahSelect.value=String(cur.surah);reciterSelect.value=cur.reciter;$('readerSurahLabel').textContent=(ss.find(x=>x.id===cur.surah)?.name||'Sūrah '+cur.surah)+' · '+cur.ayah;$('readerProgress').textContent='Āyah '+cur.ayah+' · '+(ss.find(x=>x.id===cur.surah)?.count||'');$('readerPlay').textContent=cur.playing?'Ⅱ　Pause':'▶　Wiedergabe'}
  async function render(){const a=api();if(!a)return;const st=a.state(),key=st.surah+':'+st.ayah;options();if(requestKey===key)return;requestKey=key;const ar=$('readerArabic'),de=$('readerGerman'),tr=$('readerTransliterationText'),status=$('readerStatus');if(cache.has(key)){const v=cache.get(key);ar.textContent=v.ar;de.textContent=v.de;tr.textContent=v.tr||'Lautschrift nicht verfügbar';tr.hidden=!$('readerShowTransliteration').checked;status.textContent='';return}ar.textContent='…';de.textContent='Übersetzung wird geladen …';status.textContent='Versdaten werden geladen.';try{const total=a.surahs().slice(0,st.surah-1).reduce((n,x)=>n+Number(x.count||0),0),url='https://api.alquran.cloud/v1/ayah/'+(total+st.ayah);const data=await Promise.all([fetch(url+'/quran-uthmani').then(r=>r.json()),fetch(url+'/de.bubenheim').then(r=>r.json()),fetch(url+'/en.transliteration').then(r=>r.json())]);const v={ar:data[0]?.data?.text||'Arabischer Text nicht verfügbar.',de:data[1]?.data?.text||'Deutsche Übersetzung nicht verfügbar.',tr:data[2]?.data?.text||''};cache.set(key,v);if(requestKey!==key)return;ar.textContent=v.ar;de.textContent=v.de;tr.textContent=v.tr||'Lautschrift nicht verfügbar';tr.hidden=!$('readerShowTransliteration').checked;status.textContent=''}catch{if(requestKey===key){ar.textContent='';de.textContent='Übersetzung konnte nicht geladen werden.';status.textContent='Qurʾān-Textdienst nicht erreichbar.'}}}
  $('readerSurah').addEventListener('change',()=>{api().selectSurah(surahSelect.value);render()});$('readerReciter').addEventListener('change',()=>{api().selectReciter(reciterSelect.value);options()});$('readerPrevious').addEventListener('click',()=>api().skip(-1));$('readerNext').addEventListener('click',()=>api().skip(1));$('readerPlay').addEventListener('click',()=>{api().play();setTimeout(options,100)});$('readerShowTransliteration').checked=true;$('readerShowTransliteration').addEventListener('change',()=>{api().setTransliteration($('readerShowTransliteration').checked?'show':'hide');$('readerTransliterationText').hidden=!$('readerShowTransliteration').checked});document.addEventListener('dar:quran-state',()=>{if(!panel.hidden){render();options()}});document.addEventListener('dar:quran-reader-open',render);
 }
 function bindHomeActions(){
  document.querySelectorAll('[data-home-action="prayer"]').forEach(b=>b.addEventListener('click',()=>{closeLocalViews();const section=$('times');section?.classList.add('home-focus');document.querySelector('.prayer-cell.active')?.focus({preventScroll:true});setTimeout(()=>section?.classList.remove('home-focus'),1800)}));
  document.querySelectorAll('[data-home-action="quran"]').forEach(b=>b.addEventListener('click',()=>openLocalView('quranReaderPanel')));
  ['openCalendarPanel','calendarCardButton'].forEach(id=>$(id)?.addEventListener('click',()=>openLocalView('calendarPanel')));
  $('openHadithPanel')?.addEventListener('click',()=>{openLocalView('hadithPanel');document.dispatchEvent(new CustomEvent('dar:open-hadith'))});
  $('nextHadithPanel')?.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('dar:next-hadith')));
  document.querySelectorAll('[data-close-home-view]').forEach(b=>b.addEventListener('click',closeLocalViews));
  document.querySelectorAll('.home-view').forEach(v=>v.addEventListener('click',e=>{if(e.target===v)closeLocalViews()}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLocalViews()});
  document.addEventListener('dar:open-hadith',()=>{window.setTimeout(()=>{const h=window.darHomeHadith;const text=$('hadithPanelText'),kind=$('hadithPanelKind'),source=$('hadithPanelSource'),narrator=$('hadithPanelNarrator');if(h){if(text)text.textContent=h.text||'';if(kind)kind.textContent=h.kind||'Ḥadīṯ';if(source)source.textContent=h.source||'Quelle nicht verfügbar';if(narrator)narrator.textContent=h.narrator||''}},0)});
 }
 function init(){
  if(!$('app'))return;
  augmentBrand();bind();bindAppearancePicker();bindHomeActions();bindQuranReader();apply();renderHijriDate();loadMediaCatalog();setInterval(()=>{if(prefs.wallpaperMode==='auto'||prefs.saverWallpaper==='auto')apply()},300000);handleConnection();
  const el=$('adhanVisual');if(el)new MutationObserver(updateAdhanTitle).observe(el,{attributes:true,attributeFilter:['class']});
  window.addEventListener('online',handleConnection);window.addEventListener('offline',handleConnection);
  const i=document.querySelector('[data-tab="hintergrund"]');if(i){const img=document.createElement('img');img.src=icon('image');img.alt='';img.className='settings-icons';i.prepend(img)}
  document.querySelectorAll('.settings-tabs button[data-tab]').forEach(b=>{if(b.querySelector('img'))return;const m={standort:'compass',inhalte:'quran',adhan:'prayer',saver:'image',hintergrund:'image',anzeige:'settings',verbindung:'widgets'};const t=m[b.dataset.tab];if(t){const a=new Image();a.src=icon(t);a.className='settings-icons';a.alt='';b.prepend(a)}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();