/* DĀR AL TAWḤĪD — DĀR TEST only — immersive Muṣḥaf V3.
 * Original 604 page artwork / canonical boundaries for Arabic-only reading.
 * No new audio player, no changes to the existing Quran route engine.
 * Page artwork: Miftah-Fentaw/Quran-Images (MIT publication, upstream attributed).
 * Page boundaries: Mushaf-Learning/quran-text (Tanzil-derived).
 */
(function () {
  "use strict";
  if (!/^\/test(?:\/|$)/.test(location.pathname) && !/^dar-al-tawhid-test\./.test(location.hostname)) return;
  if (window.__DAR_TEST_MUSHAF_IMMERSIVE_V3__) return;
  window.__DAR_TEST_MUSHAF_IMMERSIVE_V3__ = true;

  const ID="darMushafImmersiveV3",STORE="darMushafTestBookPrefsV1";
  const META="/content/quran/surahs.json",PAGES="/test/data/quran-madinah-pages-604.json";
  const ART="https://raw.githubusercontent.com/Miftah-Fentaw/Quran-Images/main/webp/";
  const ART_PNG="https://raw.githubusercontent.com/Miftah-Fentaw/Quran-Images/main/png/";
  const LANGS=[
    ["de","Deutsch","de.bubenheim","Bubenheim & Elyas"],
    ["en","English","en.sahih","Sahih International"],
    ["tr","Türkçe","tr.diyanet","Diyanet İşleri"],
    ["bs","Bosanski","bs.korkut","Besim Korkut"],
    ["fr","Français","fr.hamidullah","Muhammad Hamidullah"],
    ["es","Español","es.garcia","Isa García"],
    ["ckb","سۆرانی","ku.asan","Asan"],
    ["ku","Kurmancî","","noch keine geprüfte Ausgabe"]
  ];
  const TEXT={
    de:["Muṣḥaf vorbereiten","Wähle den Inhalt. Danach öffnet sich das Buch bildschirmfüllend.","Arabischer Originaltext","Lautschrift","Bedeutungsübersetzung","Sprache der Übersetzung","Ausgabe / Übersetzer","Normal lesen","Buch öffnen","Einstellungen","Schließen","Seite","Zurück","Weiter","Keine bestätigte Übersetzung für diese Sprache.","Beim Laden fehlen Daten. Bitte Verbindung oder Sprache prüfen.","Echte 604-seitige Muṣḥaf-Ausgabe (Arabisch). Kombinierte Lernansichten verwenden dieselben Seitenabschnitte mit zusätzlichem Text.","Tippe einmal auf das Buch, um die Bedienelemente einzublenden.","Quelle: Quran-Images / Miftah Fentaw; Seitenstruktur: Tanzil."],
    en:["Prepare Muṣḥaf","Choose the content, then open the book in full screen.","Original Arabic","Transliteration","Translation of meanings","Translation language","Edition / translator","Normal reader","Open book","Settings","Close","Page","Back","Next","No verified translation is available for this language.","Unable to load the page or translation. Check network and edition.","Authentic 604-page Arabic layout. Combined learning views add text to the same page intervals.","Tap the book once to show controls.","Source: Quran-Images / Miftah Fentaw; pagination: Tanzil."],
    tr:["Mushafı hazırla","İçeriği seç, sonra kitabı tam ekran aç.","Arapça asıl metin","Okunuş","Meâl","Meâl dili","Çeviri / yazar","Normal oku","Kitabı aç","Ayarlar","Kapat","Sayfa","Geri","İleri","Bu dil için doğrulanmış çeviri yok.","Sayfa veya çeviri yüklenemedi.","Gerçek 604 sayfalık Arapça Mushaf. Öğrenme görünümünde ek metin kullanılır.","Denetimleri görmek için kitaba dokun.","Kaynak: Quran-Images / Miftah Fentaw."],
    ar:["إعدادات المصحف","اختر المحتوى ثم افتح المصحف بملء الشاشة.","النص العربي الأصلي","النطق بالحروف","ترجمة المعاني","لغة الترجمة","الترجمة / المترجم","القراءة العادية","افتح المصحف","الإعدادات","إغلاق","صفحة","السابق","التالي","لا توجد ترجمة موثقة لهذه اللغة.","تعذّر تحميل الصفحة أو الترجمة.","المصحف العربي في ٦٠٤ صفحات، مع وضع تعليمي للنصوص الإضافية.","المس الصفحة لإظهار الأدوات.","المصدر: Quran-Images / Miftah Fentaw."],
    fr:["Préparer le Muṣḥaf","Choisissez le contenu, puis ouvrez le livre en plein écran.","Texte arabe original","Translittération","Traduction du sens","Langue de traduction","Édition / auteur","Lecture normale","Ouvrir le livre","Réglages","Fermer","Page","Retour","Suivant","Aucune traduction vérifiée pour cette langue.","Impossible de charger la page ou la traduction.","Véritable muṣḥaf arabe de 604 pages, lecture parallèle avec texte complémentaire.","Touchez le livre pour afficher les commandes.","Source : Quran-Images / Miftah Fentaw."],
    es:["Preparar el Muṣḥaf","Elige el contenido y abre el libro a pantalla completa.","Texto árabe original","Transliteración","Traducción del significado","Idioma de traducción","Edición / traductor","Lectura normal","Abrir libro","Ajustes","Cerrar","Página","Atrás","Siguiente","No hay traducción verificada para este idioma.","No se pudo cargar la página o traducción.","Muṣḥaf árabe auténtico de 604 páginas; lectura paralela con texto adicional.","Toca el libro para mostrar los controles.","Fuente: Quran-Images / Miftah Fentaw."],
    bs:["Postavke Mushafa","Odaberi sadržaj, zatim otvori knjigu na cijelom ekranu.","Izvorni arapski tekst","Transliteracija","Prijevod značenja","Jezik prijevoda","Prijevod / autor","Obično čitanje","Otvori knjigu","Postavke","Zatvori","Stranica","Nazad","Naprijed","Nema provjerenog prijevoda za ovaj jezik.","Stranica ili prijevod se ne mogu učitati.","Pravi arapski mushaf od 604 stranice; dodatni tekst za učenje.","Dodirni knjigu da prikažeš kontrole.","Izvor: Quran-Images / Miftah Fentaw."],
    ku:["Mîhengên Muṣḥafê","Naverokê hilbijêre, paşê pirtûkê li hemû ekranê veke.","Nivîsa erebî","Veguhastina tîpan","Wergera wateyê","Zimanê wergerê","Werger / nivîskar","Xwendina asayî","Pirtûkê veke","Mîheng","Bigire","Rûpel","Paş","Pêş","Wergereke piştrastkirî tune.","Rûpel an werger nehat barkirin.","Muṣḥafa erebî ya 604 rûpelî.","Li pirtûkê bike da kontrol derkevin.","Çavkanî: Quran-Images / Miftah Fentaw."],
    ckb:["ڕێکخستنی موسحەف","ناوەڕۆک هەڵبژێرە، پاشان کتێبەکە بە تەواوی شاشە بکەرەوە.","دەقی عەرەبی","نووسینی دەنگی","وەرگێڕانی ماناکان","زمانی وەرگێڕان","وەرگێڕ / نووسەر","خوێندنەوەی ئاسایی","کردنەوەی کتێب","ڕێکخستنەکان","داخستن","لاپەڕە","پاشەوە","دواتر","وەرگێڕانی پشتڕاستکراو نییە.","بارکردنی لاپەڕە یان وەرگێڕان سەرکەوتوو نەبوو.","موسحەفی عەرەبی ٦٠٤ لاپەڕە.","بۆ پیشاندانی کۆنتڕۆڵەکان لە کتێبەکە بدە.","سەرچاوە: Quran-Images / Miftah Fentaw."]
  };

  let view=null,opts=null,trigger=null,book=null,left=null,right=null,flip=null,controls=null;
  let pages=[],meta=[],pageBase=1,display={arabic:true,latin:false,translation:false},language="de",editionId="de.bubenheim";
  let scrollLock="",restoreFocus=null,readerReturnFocus=null,savedBookPage=1,lastUI=0,uiTimer=null,routeWatcher=null;
  let loadGeneration=0,renderBusy=false,drag=null,flipState=null,flipping=false;
  const surahCache=new Map(),translationCache=new Map(),pageCache=new Map(),imgPrefetch=new Map();

  function el(id){return document.getElementById(id);}
  function pad(n){return String(n).padStart(3,"0");}
  function num(n,a,b){return Math.min(b,Math.max(a,Number(n)||a));}
  function safe(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function loc(){
    let language=String(document.documentElement.lang||"de").toLowerCase().split("-")[0];
    try{const s=localStorage.getItem("darAdultPreferredLocaleV1");if(TEXT[s])language=s;}catch(_){}
    return TEXT[language]?language:"de";
  }
  function w(){return TEXT[loc()];}
  function pageWidthCount(){return window.matchMedia("(min-width:540px)").matches?2:1;}
  function isImageMode(){return display.arabic&&!display.latin&&!display.translation;}
  function snapshot(){return {surah:pages.length?pages[Math.min(603,pageBase-1)]?.sura||1:1,mode:display.arabic?"ar":"de",display,language,edition:editionId,bookPage:pageBase};}
  function store(){try{localStorage.setItem(STORE,JSON.stringify(snapshot()));}catch(_){}}
  function restore(){
    try{
      const state=JSON.parse(localStorage.getItem(STORE)||"{}");
      if(state?.display){
        display={arabic:!!state.display.arabic,latin:!!state.display.latin,translation:!!state.display.translation};
        if(!Object.values(display).some(Boolean))display.arabic=true;
      }
      if(LANGS.some(l=>l[0]===state?.language))language=state.language;
      if(/^[a-z]{2,4}\.[a-z0-9-]+$/.test(String(state?.edition||"")))editionId=state.edition;
      savedBookPage=num(state?.bookPage,1,604);return savedBookPage;
    }catch(_){savedBookPage=1;return 1;}
  }
  function verseKey(x){return x.sura*1000+x.aya;}
  function getPageFor(sura,ayah){
    let best=1;
    for(const p of pages){if(verseKey(p)<=sura*1000+ayah)best=p.page;else break;}
    return best;
  }
  function initialPosition(){
    let match=/(?:surah|sura|chapter|s)=(\d{1,3})/i.exec(location.hash||"");
    let aya=/(?:ayah|aya|verse)=(\d{1,3})/i.exec(location.hash||"");
    if(match)return getPageFor(num(match[1],1,114),num(aya?.[1],1,286));
    const btn=document.querySelector("[data-quran-continue]");
    const a=btn&&/^(\d{1,3}):(\d{1,3})$/.exec(btn.getAttribute("data-quran-continue")||"");
    if(a)return getPageFor(num(a[1],1,114),num(a[2],1,286));
    return savedBookPage;
  }
  function spreadStart(page){
    page=num(page,1,604);
    return pageWidthCount()===2?(page%2===1?page:page-1):page;
  }
  async function readJSON(url){
    const r=await fetch(url,{credentials:url.startsWith("/")?"same-origin":"omit",cache:"default"});
    if(!r.ok)throw new Error("HTTP "+r.status+" "+url);
    return r.json();
  }
  async function loadMap(){
    if(pages.length===604)return;
    const data=await readJSON(PAGES);
    if(!Array.isArray(data?.pages)||data.pages.length!==604||
      !data.pages.every((p,i)=>p.page===i+1&&p.sura>=1&&p.sura<=114&&p.aya>=1))
      throw new Error("604-Seiten-Index ungültig");
    pages=data.pages;
  }
  async function loadMeta(){
    if(meta.length===114)return;
    const v=await readJSON(META);
    if(!Array.isArray(v?.surahs)||v.surahs.length!==114)throw new Error("Sūrah-Katalog ungültig");
    meta=v.surahs;
  }
  async function surahData(no){
    if(!surahCache.has(no))surahCache.set(no,readJSON("/content/quran/"+pad(no)+".json").then(v=>{
      if(Number(v.id)!==no||!Array.isArray(v.verses)||v.verses.length!==v.total_verses)throw new Error("Sūrah-Daten unvollständig");
      return v;
    }).catch(e=>{surahCache.delete(no);throw e;}));
    return surahCache.get(no);
  }
  function translationId(){
    const info=LANGS.find(l=>l[0]===language);
    if(!info||!info[2]||editionId!==info[2])throw new Error("Edition nicht freigegeben");
    return editionId;
  }
  async function translationData(no){
    if(language==="de")return null;
    const id=translationId(),key=id+"-"+no;
    if(!translationCache.has(key))translationCache.set(key,readJSON("https://api.alquran.cloud/v1/surah/"+no+"/"+encodeURIComponent(id)).then(obj=>{
      const verses=obj?.data?.ayahs;
      if(!Array.isArray(verses))throw new Error("Übersetzung nicht vollständig");
      const m=new Map(verses.map(v=>[Number(v.numberInSurah),String(v.text||"")]));
      if(m.size!==verses.length||[...m.values()].some(v=>!v.trim()))throw new Error("Übersetzung nicht vollständig");
      return m;
    }).catch(e=>{translationCache.delete(key);throw e;}));
    return translationCache.get(key);
  }
  function imageSrc(p){return ART+pad(p)+".webp";}
  function fallbackSrc(p){return ART_PNG+p+".png";}
  function mountImageHandlers(scope){
    scope.querySelectorAll("img[data-mushaf-page]").forEach(img=>{
      img.addEventListener("error",function(){
        if(this.dataset.source==="webp"){this.dataset.source="png";this.src=fallbackSrc(Number(this.dataset.mushafPage));}
        else{this.classList.add("damx-image-error");this.alt="Muṣḥaf-Seite konnte nicht geladen werden";}
      },{once:false});
    });
  }
  function imageMarkup(p){
    if(p<1||p>604)return '<div class="damx-empty" aria-hidden="true"></div>';
    return '<div class="damx-art"><img draggable="false" decoding="async" alt="Muṣḥaf · Seite '+p+'" data-mushaf-page="'+p+'" data-source="webp" src="'+imageSrc(p)+'"></div>';
  }
  function prefetch(p){
    if(p<1||p>604||imgPrefetch.has(p))return;
    const image=new Image();imgPrefetch.set(p,image);
    image.decoding="async";image.src=imageSrc(p);
    image.onerror=function(){if(!image.dataset.fallback){image.dataset.fallback="1";image.src=fallbackSrc(p);}};
    if(imgPrefetch.size>12){
      const oldest=imgPrefetch.keys().next().value;imgPrefetch.delete(oldest);
    }
  }
  function pageVerses(p){
    const start=pages[p-1],next=pages[p]||{sura:115,aya:1};
    if(!start)return Promise.resolve([]);
    const ids=[];
    for(let no=start.sura;no<=Math.min(114,next.sura);no++)ids.push(no);
    return Promise.all(ids.map(async no=>{
      const chapter=await surahData(no),translation=display.translation?await translationData(no):null;
      return chapter.verses.filter(v=>{
        const pos=no*1000+Number(v.id);
        return pos>=verseKey(start)&&pos<verseKey(next);
      }).map(v=>({no,v,translated:language==="de"?String(v.de||""):translation?.get(Number(v.id))||""}));
    })).then(sections=>sections.flat());
  }
  function studyVerse(row){
    const n=Number(row.v.id),a=[];
    if(display.arabic)a.push('<span class="damx-ar" lang="ar" dir="rtl">'+safe(row.v.ar)+' <b class="damx-ayah">۞'+n+'</b></span>');
    if(display.latin)a.push('<span class="damx-latin" lang="en" dir="ltr">'+safe(row.v.tr_readable||row.v.tr_academic||row.v.tr||"")+'</span>');
    if(display.translation)a.push('<span class="damx-translate" lang="'+safe(language)+'" dir="'+(language==="ckb"?"rtl":"ltr")+'">'+safe(row.translated)+' <small>('+row.no+':'+n+')</small></span>');
    return '<span class="damx-passage">'+a.join("")+'</span>';
  }
  function studyPageMarkup(p,rows){
    let title=meta.find(m=>m.id===pages[p-1]?.sura);
    return '<div class="damx-study">'+
      '<div class="damx-study-title"><span>'+safe(title?.transliteration||"Qurʾān")+'</span><span>'+p+' / 604</span></div>'+
      '<div class="damx-study-body" dir="'+(display.arabic?"rtl":language==="ckb"?"rtl":"ltr")+'">'+rows.map(studyVerse).join("")+'</div>'+
      '<div class="damx-study-foot">DĀR AL TAWḤĪD · '+safe(LANGS.find(l=>l[0]===language)?.[3]||"")+'</div>'+
    '</div>';
  }
  async function markup(p) {
    if(p<1||p>604)return '<div class="damx-empty" aria-hidden="true"></div>';
    if(isImageMode())return imageMarkup(p);
    const key=p+"-"+JSON.stringify(display)+"-"+language+"-"+editionId;
    if(pageCache.has(key))return pageCache.get(key);
    const promise=pageVerses(p).then(rows=>studyPageMarkup(p,rows)).catch(e=>{pageCache.delete(key);throw e;});
    pageCache.set(key,promise);
    if(pageCache.size>18)pageCache.delete(pageCache.keys().next().value);
    return promise;
  }
  function setStatus(message){
    const status=el("damxStatus");
    if(status){status.textContent=message||"";status.hidden=!message;}
  }
  function pageUpdate(){
    const p=el("damxPageIndex");if(p)p.textContent=w()[11]+" "+pageBase+"–"+Math.min(604,pageBase+pageWidthCount()-1)+" / 604";
    const back=el("damxPrevious"),next=el("damxNext");
    if(back)back.disabled=pageBase<=1||flipping||renderBusy;
    if(next)next.disabled=pageBase+pageWidthCount()>604||flipping||renderBusy;
    const select=el("damxSurah");
    if(select&&meta.length){
      const ch=pages[Math.min(603,pageBase-1)]?.sura;
      if(ch)select.value=String(ch);
    }
  }
  async function renderAt(p){
    if(!view||view.hidden)return;
    const token=++loadGeneration,first=spreadStart(p);
    renderBusy=true;pageUpdate();setStatus("");
    try{
      const [rh,lh]=await Promise.all([markup(first),pageWidthCount()===2?markup(first+1):Promise.resolve("")]);
      if(token!==loadGeneration||view.hidden)return;
      pageBase=first;
      right.innerHTML=rh;left.innerHTML=lh;
      mountImageHandlers(right);mountImageHandlers(left);
      if(isImageMode())for(const n of [first-2,first-1,first+2,first+3,first+4])prefetch(n);
      store();
    }catch(error){if(token===loadGeneration){setStatus(w()[15]);}}
    finally{if(token===loadGeneration){renderBusy=false;pageUpdate();}}
  }
  async function startFlip(direction){
    if(!view||view.hidden||flipping||renderBusy)return null;
    const step=pageWidthCount(),target=pageBase+direction*step;
    if(target<1||target>604)return null;
    flipping=true;pageUpdate();
    try {
      const two=step===2;
      const front=direction>0?(two?left.innerHTML:right.innerHTML):right.innerHTML;
      const backPage=direction>0?target:target+(two?1:0);
      const [behind,back]=await Promise.all([markup(direction>0?(two?target+1:target):target),markup(backPage)]);
      if(!view||view.hidden)throw new Error("closed");
      if(direction>0){if(two)left.innerHTML=behind;else right.innerHTML=behind;}
      else{right.innerHTML=behind;}
      mountImageHandlers(right);mountImageHandlers(left);
      flip.hidden=false;flip.dataset.direction=direction>0?"next":"previous";
      flip.innerHTML='<div class="damx-flip-front">'+front+'</div><div class="damx-flip-back">'+back+'</div>';
      mountImageHandlers(flip);
      flipState={direction,target,progress:0};
      applyFlip(0);
      return flipState;
    }catch(e){flipping=false;flipState=null;flip.hidden=true;renderAt(pageBase);return null;}
  }
  function applyFlip(p){
    if(!flipState)return;
    p=num(p,0,1);flipState.progress=p;
    const deg=flipState.direction>0?p*180:-p*180;
    flip.style.transform="rotateY("+deg.toFixed(2)+"deg)";
    flip.style.setProperty("--damx-progress",p.toFixed(4));
    if(book)book.style.setProperty("--damx-shadow",(Math.sin(p*Math.PI)*.3).toFixed(3));
  }
  function animateFlip(goal){
    if(!flipState)return;
    const start=flipState.progress,delta=goal-start;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduced||Math.abs(delta)<.001){settleFlip(goal);return;}
    const duration=Math.max(160,Math.min(480,Math.abs(delta)*430)),t0=performance.now();
    function frame(t){
      if(!flipState||!view||view.hidden)return;
      const k=Math.min(1,(t-t0)/duration),e=1-Math.pow(1-k,3);
      applyFlip(start+delta*e);
      if(k<1)requestAnimationFrame(frame);else settleFlip(goal);
    }
    requestAnimationFrame(frame);
  }
  function settleFlip(goal){
    if(!flipState)return;
    const next=goal===1?flipState.target:pageBase;
    flipState=null;flipping=false;flip.hidden=true;flip.innerHTML="";flip.style.transform="";
    if(book)book.style.setProperty("--damx-shadow","0");
    renderAt(next);
  }
  async function turn(direction){
    if(flipping||renderBusy)return;
    const f=await startFlip(direction);
    if(f)animateFlip(1);
  }
  function bookPointerDown(ev){
    if(ev.button!==0 || flipping || renderBusy || opts&&!opts.hidden)return;
    if(ev.target.closest("button,select,.damx-controls"))return;
    drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,nowX:ev.clientX,started:performance.now(),direction:0,pending:null,moved:false,released:false};
    try{book.setPointerCapture(ev.pointerId);}catch(_){}
  }
  function bookPointerMove(ev){
    const d=drag;if(!d||d.id!==ev.pointerId)return;
    d.nowX=ev.clientX;
    const dx=ev.clientX-d.x,dy=ev.clientY-d.y;
    if(!d.direction){
      if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.1)return;
      d.direction=dx>0?1:-1;d.moved=true;
      d.pending=startFlip(d.direction).then(f=>{
        if(!f||!drag||drag!==d)return;
        let x=drag.nowX-d.x;
        applyFlip(num(Math.abs(x)/(book.clientWidth/Math.max(1,pageWidthCount())*.87),0,1));
      });
    }else if(flipState){
      applyFlip(num(Math.abs(dx)/(book.clientWidth/Math.max(1,pageWidthCount())*.87),0,1));
    }
  }
  function bookPointerUp(ev){
    const d=drag;if(!d||d.id!==ev.pointerId)return;
    drag=null;
    try{book.releasePointerCapture(ev.pointerId);}catch(_){}
    if(!d.moved){showUI();return;}
    const elapsed=Math.max(30,performance.now()-d.started);
    const distance=Math.abs(d.nowX-d.x);
    const commit=distance>book.clientWidth/Math.max(1,pageWidthCount())*.22||(distance/elapsed)>.7;
    Promise.resolve(d.pending).then(()=>{
      if(flipState)animateFlip(commit?1:0);
    });
  }
  function showUI(){
    if(!view||view.hidden)return;
    view.classList.add("damx-ui-visible");lastUI=Date.now();
    clearTimeout(uiTimer);
    uiTimer=setTimeout(()=>{
      if(view&&!view.hidden&&(!opts||opts.hidden)&&!flipping&&Date.now()-lastUI>=2500)view.classList.remove("damx-ui-visible");
    },2750);
  }
  function closeBook(){
    if(!view||view.hidden)return;
    ++loadGeneration;drag=null;flipState=null;flipping=false;renderBusy=false;
    flip.hidden=true;view.hidden=true;view.classList.remove("damx-ui-visible");
    document.documentElement.classList.remove("damx-fullscreen");
    document.body.style.overflow=scrollLock;
    clearTimeout(uiTimer);
    if(readerReturnFocus?.isConnected)readerReturnFocus.focus({preventScroll:true});
  }
  function validateOptions(){
    const arabic=el("damxArabic").checked,latin=el("damxLatin").checked,translation=el("damxTranslation").checked;
    const lang=el("damxLanguage").value;
    const validChoice=LANGS.some(l=>l[0]===lang&&(!translation||!!l[2]));
    const valid=(arabic||latin||translation)&&validChoice;
    el("damxLaunch").disabled=!valid;
    el("damxEditionRow").hidden=!translation;
    el("damxLangRow").hidden=!translation;
    el("damxOptionsHint").textContent=!validChoice&&translation?w()[14]:w()[16];
    const edition=LANGS.find(l=>l[0]===lang)||LANGS[0];
    el("damxEditionValue").textContent=edition[3]||"";
  }
  function closeOptions(){
    if(!opts||opts.hidden)return;
    opts.hidden=true;
    if(view&&!view.hidden){view.removeAttribute("aria-hidden");showUI();}
    else if(restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});
  }
  function showOptions(){
    if(!opts)makeOptions();
    restoreFocus=view&&!view.hidden?el("damxConfig")||document.activeElement:document.activeElement;
    opts.hidden=false;
    opts.querySelector("h2").textContent=w()[0];
    opts.querySelector(".damx-intro").textContent=w()[1];
    ["damxArabicLabel","damxLatinLabel","damxTranslationLabel","damxLanguageLabel","damxEditionLabel","damxNormal","damxLaunch"].forEach((id,i)=>{
      el(id).textContent=w()[[2,3,4,5,6,7,8][i]];
    });
    el("damxArabic").checked=display.arabic;
    el("damxLatin").checked=display.latin;
    el("damxTranslation").checked=display.translation;
    el("damxLanguage").value=language;
    if(view&&!view.hidden)view.setAttribute("aria-hidden","true");
    validateOptions();
    el("damxArabic").focus({preventScroll:true});
  }
  async function confirmOptions(){
    display={arabic:el("damxArabic").checked,latin:el("damxLatin").checked,translation:el("damxTranslation").checked};
    language=el("damxLanguage").value;
    editionId=(LANGS.find(l=>l[0]===language)||LANGS[0])[2];
    if(!Object.values(display).some(Boolean)||display.translation&&!editionId){validateOptions();return;}
    pageCache.clear();
    const wasOpen=view&&!view.hidden,oldPage=pageBase;
    closeOptions();
    try{
      if(!view)makeBook();
      if(!wasOpen){
        scrollLock=document.body.style.overflow;
        readerReturnFocus=trigger||document.activeElement;
        document.body.style.overflow="hidden";view.hidden=false;
        document.documentElement.classList.add("damx-fullscreen");
      }
      if(!pages.length)await loadMap();
      if(!meta.length)await loadMeta();
      const select=el("damxSurah");
      select.innerHTML=meta.map(s=>'<option value="'+Number(s.id)+'">'+Number(s.id)+". "+safe(s.transliteration||s.name)+'</option>').join("");
      await renderAt(wasOpen?oldPage:initialPosition());
      view.classList.remove("damx-ui-visible");
      showUI();
      setTimeout(()=>{if(view&&!view.hidden)view.classList.remove("damx-ui-visible");},1700);
    }catch(e){
      setStatus(w()[15]);showUI();
    }
  }
  function makeOptions(){
    opts=document.createElement("section");opts.id="damxOptions";opts.className="damx-options";opts.hidden=true;
    opts.setAttribute("role","dialog");opts.setAttribute("aria-modal","true");opts.setAttribute("aria-labelledby","damxOptionsTitle");
    opts.innerHTML='<div class="damx-card">'+
      '<header class="damx-options-head"><div><small>DĀR AL TAWḤĪD · MUṢḤAF</small><h2 id="damxOptionsTitle"></h2><p class="damx-intro"></p></div><button class="damx-close-options" type="button" aria-label="Schließen">×</button></header>'+
      '<div class="damx-checkboxes">'+
      '<label><input id="damxArabic" type="checkbox"><span id="damxArabicLabel"></span></label>'+
      '<label><input id="damxLatin" type="checkbox"><span id="damxLatinLabel"></span></label>'+
      '<label><input id="damxTranslation" type="checkbox"><span id="damxTranslationLabel"></span></label></div>'+
      '<div class="damx-option-row" id="damxLangRow"><label id="damxLanguageLabel" for="damxLanguage"></label><select id="damxLanguage">'+
      LANGS.map(l=>'<option value="'+l[0]+'">'+safe(l[1])+'</option>').join("")+'</select></div>'+
      '<div class="damx-option-row" id="damxEditionRow"><span id="damxEditionLabel"></span><strong id="damxEditionValue"></strong></div>'+
      '<p class="damx-opt-help" id="damxOptionsHint"></p>'+
      '<div class="damx-options-buttons"><button id="damxNormal" type="button"></button><button id="damxLaunch" type="button"></button></div>'+
      '<p class="damx-credit">'+safe(w()[18])+'</p></div>';
    document.body.appendChild(opts);
    ["damxArabic","damxLatin","damxTranslation","damxLanguage"].forEach(id=>el(id).addEventListener("change",validateOptions));
    el("damxNormal").addEventListener("click",()=>{closeOptions();if(view&&!view.hidden)closeBook();});
    el("damxLaunch").addEventListener("click",confirmOptions);
    opts.querySelector(".damx-close-options").addEventListener("click",closeOptions);
    opts.addEventListener("keydown",e=>{
      if(e.key==="Escape"){e.stopPropagation();closeOptions();}
      if(e.key!=="Tab")return;
      const focusables=[...opts.querySelectorAll("button:not(:disabled),input,select")].filter(n=>!n.closest("[hidden]"));
      const first=focusables[0],last=focusables.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
  }
  function makeBook(){
    view=document.createElement("section");view.id=ID;view.className="damx-overlay";view.hidden=true;
    view.setAttribute("role","dialog");view.setAttribute("aria-modal","true");view.setAttribute("aria-label","Muṣḥaf");
    view.innerHTML='<main id="damxBook" class="damx-book">'+
      '<div class="damx-under-pages"><article id="damxLeft" class="damx-page damx-left" aria-label="Linke Seite"></article>'+
      '<article id="damxRight" class="damx-page damx-right" aria-label="Rechte Seite"></article></div>'+
      '<div id="damxFlip" class="damx-flip" hidden></div>'+
      '<div class="damx-spine" aria-hidden="true"></div></main>'+
      '<div class="damx-controls" id="damxControls">'+
        '<div class="damx-controls-top"><span class="damx-logo">DĀR AL TAWḤĪD</span>'+
        '<select id="damxSurah" aria-label="Sūrah"></select>'+
        '<button type="button" id="damxConfig" aria-label="Muṣḥaf-Einstellungen">⚙</button>'+
        '<button type="button" id="damxExit" aria-label="Buch schließen">×</button></div>'+
        '<div class="damx-controls-bottom"><button type="button" id="damxPrevious" aria-label="Zurückblättern">‹</button>'+
        '<span id="damxPageIndex" aria-live="polite">Seite 1 / 604</span>'+
        '<button type="button" id="damxNext" aria-label="Weiterblättern">›</button></div>'+
      '</div><p id="damxStatus" class="damx-error" role="status" hidden></p>';
    document.body.appendChild(view);
    book=el("damxBook");left=el("damxLeft");right=el("damxRight");flip=el("damxFlip");controls=el("damxControls");
    el("damxConfig").addEventListener("click",showOptions);el("damxExit").addEventListener("click",closeBook);
    el("damxPrevious").addEventListener("click",()=>turn(-1));el("damxNext").addEventListener("click",()=>turn(1));
    el("damxSurah").addEventListener("change",e=>{
      const no=num(e.target.value,1,114);
      const page=getPageFor(no,1);renderAt(page);
    });
    book.addEventListener("pointerdown",bookPointerDown);book.addEventListener("pointermove",bookPointerMove);
    book.addEventListener("pointerup",bookPointerUp);book.addEventListener("pointercancel",bookPointerUp);
    book.addEventListener("contextmenu",e=>e.preventDefault());
    view.addEventListener("keydown",e=>{
      if(opts&&!opts.hidden)return;
      if(e.key==="Escape"){e.preventDefault();closeBook();}
      if(e.target&&/SELECT|INPUT|TEXTAREA/.test(e.target.tagName||""))return;
      if(e.key==="ArrowLeft"){e.preventDefault();turn(1);}
      if(e.key==="ArrowRight"){e.preventDefault();turn(-1);}
      if(e.key==="Tab")showUI();
    });
    window.addEventListener("resize",()=>{
      if(view&&!view.hidden&&!flipping){pageCache.clear();renderAt(pageBase);}
    },{passive:true});
  }
  function mountTrigger(){
    const reading=document.body.classList.contains("is-quran-reader-route");
    const overview=document.body.classList.contains("is-quran-overview");
    const host=reading?el("qrcActions"):overview?document.querySelector("#qovHeader .qov-icon-actions"):null;
    if(!host){
      if(trigger){trigger.remove();trigger=null;}
      if(view&&!view.hidden)closeBook();
      return;
    }
    if(trigger?.parentNode===host)return;
    if(trigger)trigger.remove();
    trigger=document.createElement("button");trigger.id="damxOpenTrigger";trigger.type="button";
    trigger.className=(reading?"qrc-icon-btn":"qov-icon-btn")+" damx-trigger";
    trigger.textContent="▣";trigger.setAttribute("aria-label","Muṣḥaf öffnen");trigger.title="Muṣḥaf öffnen";
    trigger.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();showOptions();});
    host.appendChild(trigger);
  }
  function boot(){
    restore();mountTrigger();
    let scheduled=false;
    const tick=()=>{
      if(scheduled)return;scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;mountTrigger();});
    };
    routeWatcher=new MutationObserver(tick);
    routeWatcher.observe(document.body,{attributes:true,attributeFilter:["class"]});
    const app=el("appView");if(app)routeWatcher.observe(app,{childList:true,subtree:true});
    window.addEventListener("hashchange",tick);window.addEventListener("pageshow",tick);
    loadMap().catch(()=>{ /* open path reports errors visibly */ });
  }
  window.DarMushafImmersiveTestV3={open:showOptions,close:closeBook};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();