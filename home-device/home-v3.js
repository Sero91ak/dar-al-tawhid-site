/* DĀR HOME Next Generation V3 – independent UX layer over the proven V2 engine.
   No secrets, no GitHub write credentials and no local-network privilege assumptions. */
(()=>{'use strict';
 const ROOT='https://dar-al-tawhid.de';
 const KEY='dar-home-v3-preferences';
 const $=id=>document.getElementById(id);
 const icon=name=>ROOT+'/assets/dar-3d-icons/'+name+'.png';
 let wallpapers=[
  {id:'dar-wide',label:'DĀR · Weites Motiv',url:ROOT+'/assets/home-v1194/hero-wide-adobe.jpg'},
  {id:'prayer-cinema',label:'Gebet · Cinematic',url:ROOT+'/kids/assets/kids-salah-v1262/cinematic-still.jpg'},
  {id:'tv-kaaba-day',label:'Kaʿba · Tag',url:'/media/apple-tv/tv-kaaba-day.jpg',native:true},
  {id:'tv-kaaba-sunrise',label:'Kaʿba · Sonnenaufgang',url:'/media/apple-tv/tv-kaaba-sunrise.jpg',native:true},
  {id:'tv-kaaba-sunset',label:'Kaʿba · Sonnenuntergang',url:'/media/apple-tv/tv-kaaba-sunset.jpg',native:true},
  {id:'home-cinema',label:'DĀR · Cinematic',url:ROOT+'/test/assets/dar-3d-icons/dar-home-cinematic-hero.png'},
  {id:'kids-hero',label:'Moschee · Nachtmotiv',url:ROOT+'/kids/assets/kids-home-v1191/hero-static-reference.jpg'},
  {id:'abstract',label:'Klassisch · ohne Bild',url:''}
 ];
 let prefs={theme:'dark',wallpaper:'tv-kaaba-day',wallpaperMode:'manual',saverWallpaper:'same',adhanCinema:true,allowBackgroundUpdates:true};
 try{const from=JSON.parse(localStorage.getItem(KEY)||'{}');if(from&&typeof from==='object'&&!Array.isArray(from)){prefs={...prefs,...from}}}catch{}
 const safeHTML=(str)=>String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 function imageFor(name){let w=wallpapers.find(x=>x.id===name);if(name==='custom'){const raw=localStorage.getItem(KEY+'-wallpaper')||'';return /^data:image\/(?:png|jpeg|webp);base64,/i.test(raw)?raw:''}return w?.url||''}
 function automaticWallpaperId(){const hour=new Date().getHours(),period=hour>=6&&hour<17?'day':'night';let choices=wallpapers.filter(x=>x.native&&x.period===period);if(!choices.length)choices=wallpapers.filter(x=>x.native);return choices[Math.floor(Date.now()/21600000)%Math.max(1,choices.length)]?.id||'tv-kaaba-day'}
 function resolveWallpaper(name){return name==='auto'?automaticWallpaperId():name}
 function store(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){warn('Einstellungen konnten nicht gespeichert werden')}}
 function warn(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3900)}
 function apply(){
  const app=$('app');if(!app)return;
  app.dataset.homeTheme=prefs.theme==='light'?'light':'dark';
  const homeChoice=prefs.wallpaperMode==='auto'?'auto':prefs.wallpaper;
  const bg=imageFor(resolveWallpaper(homeChoice));
  app.style.backgroundImage=bg?'url("'+bg.replaceAll('"','%22')+'")':'none';
  const saver=$('saver');if(saver){
   const saverChoice=prefs.saverWallpaper==='same'?homeChoice:prefs.saverWallpaper;
   const sbg=imageFor(resolveWallpaper(saverChoice));
   saver.style.backgroundImage=sbg?'url("'+sbg.replaceAll('"','%22')+'")':'none';
  }
  const adhan=$('adhanVisual');if(adhan){
   adhan.style.backgroundImage=prefs.adhanCinema&&bg?'url("'+bg.replaceAll('"','%22')+'")':'none';
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
   const b=document.createElement('button');b.className='topbtn';b.id='h3ThemeToggle';b.title='Hell/Dunkel umschalten';b.innerHTML='<span aria-hidden="true" style="font-size:25px">☼</span>';
   b.addEventListener('click',()=>{prefs.theme=prefs.theme==='dark'?'light':'dark';store();apply()});
   top.parentNode.insertBefore(b,top);
  }
  const navIcons={openCities:'compass',showHadith:'hadith',showQuran:'quran',startSaver:'image'};
  for(const [id,name] of Object.entries(navIcons)){
   const b=$(id);if(!b||b.querySelector('.nav-icon'))continue;
   const img=document.createElement('img');img.src=icon(name);img.className='nav-icon';img.alt='';img.setAttribute('aria-hidden','true');b.insertBefore(img,b.firstChild);
  }
  const nav=document.querySelector('.footnav');
  if(nav&&!$('h3FooterSettings')){
   const b=document.createElement('button');b.id='h3FooterSettings';b.className='touchbutton';
   const i=new Image();i.src=icon('settings');i.className='nav-icon';i.alt='';
   b.append(i,document.createTextNode(' Einstellungen'));b.addEventListener('click',()=>top?.click());nav.append(b);
  }
  for(const btn of document.querySelectorAll('.prayer-cell')){
   if(btn.querySelector('img'))continue;
   const img=new Image();img.src=ROOT+'/test/assets/prayer-motifs/'+btn.dataset.prayer+'.webp';img.className='prayer-glyph';img.alt='';img.setAttribute('aria-hidden','true');
   img.addEventListener('error',()=>{img.src=icon('prayer')},{once:true});btn.insertBefore(img,btn.firstChild);
  }
 }
 function makeWallpaperGallery(){
  const parent=$('wallpaperOptions');if(!parent)return;
  parent.replaceChildren();
  const opts=wallpapers.slice();
  if(localStorage.getItem(KEY+'-wallpaper'))opts.push({id:'custom',label:'Eigenes Bild (nur dieses Gerät)',url:imageFor('custom')});
  for(const item of opts){
   const b=document.createElement('button');b.className='wallpaper-option';b.type='button';b.dataset.wallpaper=item.id;
   b.setAttribute('aria-pressed',String(prefs.wallpaper===item.id));
   if(item.url){const img=new Image();img.src=item.url;img.alt='Hintergrund: '+item.label;img.loading='lazy';b.append(img)}
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
   const entries=catalog.wallpapers.filter(x=>x&&/^[a-z0-9-]{2,48}$/.test(x.id||'')&&typeof x.label==='string'&&/^\/media\/apple-tv\/[A-Za-z0-9._-]+\.(?:jpg|webp|png)$/.test(x.url||''));
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
 function bind(){
  const sel=$('homeAppearance');if(sel)sel.addEventListener('change',()=>{prefs.theme=sel.value;store();apply()});
  const legacyTheme=$('theme');if(legacyTheme)legacyTheme.addEventListener('change',()=>{prefs.theme=legacyTheme.value==='ivory'?'light':'dark';const appearance=$('homeAppearance');if(appearance)appearance.value=prefs.theme;store();apply()});
  const saver=$('homeSaverBackground');if(saver){const options=[{id:'same',label:'Wie HOME-Hintergrund'},{id:'auto',label:'Automatisch nach Tageszeit'},...wallpapers.map(x=>({id:x.id,label:x.label}))];saver.replaceChildren(...options.map(x=>new Option(x.label,x.id)));saver.addEventListener('change',()=>{prefs.saverWallpaper=saver.value;store();apply()})}
  const wallMode=$('homeWallpaperMode');if(wallMode){wallMode.value=prefs.wallpaperMode;wallMode.addEventListener('change',()=>{prefs.wallpaperMode=wallMode.value;store();apply()})}
  const cin=$('homeCinemaBackground');if(cin)cin.addEventListener('change',()=>{prefs.adhanCinema=cin.checked;store();apply()});
  const upload=$('homeWallpaperUpload');if(upload)upload.addEventListener('change',()=>{
   const f=upload.files?.[0];if(!f)return;
   if(!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size>1.5*1024*1024){warn('Bitte PNG, JPG oder WebP bis 1,5 MB wählen');upload.value='';return}
   const r=new FileReader();r.onload=()=>{try{localStorage.setItem(KEY+'-wallpaper',String(r.result));prefs.wallpaper='custom';store();makeWallpaperGallery()}catch{warn('Bild zu groß für diesen Browser. Bitte kleiner exportieren.')}}
   r.readAsDataURL(f);
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
  const name=/Fajr|Ḍuhr|ʿAṣr|Maġrib|ʿIšāʾ/.exec(info)?.[0]||'Aḏān';
  const title=el.querySelector('.adhan-title');if(title)title.textContent=name==='Aḏān'?'Aḏān · Gebetszeit':name+' · Aḏān';
  el.dataset.cinema=prefs.adhanCinema?'on':'off';
 }
 function handleConnection(){
  const t=$('homeConnectionStatus');if(t)t.textContent=navigator.onLine?'Verbunden – DĀR-Livequellen werden regelmäßig geprüft':'Offline – lokale Gebetsberechnung; letzte gespeicherte Inhalte ggf. veraltet';
 }
 function init(){
  if(!$('app'))return;
  augmentBrand();bind();apply();loadMediaCatalog();setInterval(()=>{if(prefs.wallpaperMode==='auto'||prefs.saverWallpaper==='auto')apply()},300000);handleConnection();
  const el=$('adhanVisual');if(el)new MutationObserver(updateAdhanTitle).observe(el,{attributes:true,attributeFilter:['class']});
  window.addEventListener('online',handleConnection);window.addEventListener('offline',handleConnection);
  const i=document.querySelector('[data-tab="hintergrund"]');if(i){const img=document.createElement('img');img.src=icon('image');img.alt='';img.className='settings-icons';i.prepend(img)}
  document.querySelectorAll('.settings-tabs button[data-tab]').forEach(b=>{if(b.querySelector('img'))return;const m={standort:'compass',inhalte:'quran',adhan:'prayer',saver:'image',anzeige:'settings',verbindung:'widgets'};const t=m[b.dataset.tab];if(t){const a=new Image();a.src=icon(t);a.className='settings-icons';a.alt='';b.prepend(a)}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();