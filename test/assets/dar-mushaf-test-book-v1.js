/* DĀR AL TAWḤĪD · Test-only immersive Muṣḥaf book preview.
   Reads the existing Quran JSON; does not create/modify any audio controller.
   Preview leaf grouping is NOT the canonical Madinah 604-page layout. */
(function () {
  "use strict";
  if (!/^\/test(?:\/|$)/.test(location.pathname) && !/^dar-al-tawhid-test\./.test(location.hostname)) return;
  if (window.__DAR_MUSHAF_TEST_BOOK_V1__) return;
  window.__DAR_MUSHAF_TEST_BOOK_V1__ = true;
  var ROOT = "darMushafTestBook", trigger, root, chapterSelect, leftPage, rightPage;
  var meta = [], chapter = null, leafs = [], spread = 0, surahNo = 1, mode = "ar", loadingToken = 0, turning = false, observer, ready = false;
  var lastFocused = null, previousOverflow = "", referenceAyah = 1;
  var STORE = "darMushafTestBookPrefsV1";
  var lastViewCount = window.matchMedia && window.matchMedia("(max-width:620px)").matches ? 1 : 2;
  var display = { arabic:true, latin:false, translation:false }, language = "de", editionId = "de.bubenheim";
  var editionName = "Bubenheim & Elyas", translationVerses = {}, optionsPanel, priorOptionsFocus, optionFromBook = false;
  var editions = null, catalogPromise = null;
  var LANGUAGES = [
    {id:"de",name:"Deutsch",source:"de.bubenheim"},
    {id:"en",name:"English",source:"en.sahih"},
    {id:"tr",name:"Türkçe",source:"tr.diyanet"},
    {id:"bs",name:"Bosanski",source:"bs.korkut"},
    {id:"fr",name:"Français",source:"fr.hamidullah"},
    {id:"es",name:"Español",source:"es.garcia"},
    {id:"ckb",name:"سۆرانی",source:"ku.asan"},
    {id:"ku",name:"Kurmancî",source:null}
  ];
  var LOCAL_TEXT = {
    de:{heading:"Muṣḥaf vorbereiten",sub:"Wähle deine Leseausgabe. Der normale Qurʾān-Leser bleibt unverändert.",arabic:"Arabischer Originaltext",latin:"Lautschrift",translation:"Bedeutungsübersetzung",lang:"Sprache der Übersetzung",edition:"Übersetzung / Herausgeber",normal:"Normal weiterlesen",open:"Muṣḥaf öffnen",settings:"Einstellungen",ready:"Quellenprüfung vor dem Öffnen",loading:"Übersetzungen werden geprüft …",unavailable:"Für diese Sprache ist hier noch keine geprüfte Ausgabe vorhanden. Wähle eine andere Sprache oder lies Arabisch ohne Übersetzung.",failure:"Die Übersetzung konnte nicht geladen werden. Bitte erneut versuchen oder Arabisch wählen.",note:"Vorläufige Seitenaufteilung, kein 604-seitiger Madīnah-Satz.",choose:"Wähle mindestens eine Textdarstellung."},
    en:{heading:"Prepare Muṣḥaf",sub:"Choose your reading view. The normal Quran reader stays unchanged.",arabic:"Original Arabic",latin:"Transliteration",translation:"Translation of meanings",lang:"Translation language",edition:"Translation / author",normal:"Continue in reader",open:"Open Muṣḥaf",settings:"Settings",ready:"Check sources before opening",loading:"Checking available translations …",unavailable:"No verified translation is available for this language here yet. Select another language or read Arabic only.",failure:"Unable to load the translation. Try again or choose Arabic.",note:"Provisional pages, not the 604-page Madīnah layout.",choose:"Select at least one text display."},
    tr:{heading:"Mushaf ayarları",sub:"Okuma görünümünü seç. Normal Kur’an okuyucu değişmez.",arabic:"Arapça asıl metin",latin:"Okunuş",translation:"Meâl",lang:"Meâl dili",edition:"Çeviri / yazar",normal:"Normal okumaya dön",open:"Mushafı aç",settings:"Ayarlar",ready:"Kaynağı kontrol et",loading:"Çeviriler kontrol ediliyor …",unavailable:"Bu dil için doğrulanmış çeviri henüz yok.",failure:"Çeviri yüklenemedi.",note:"Önizleme sayfaları; 604 sayfalık Medine Mushafı değil.",choose:"En az bir metin seç."},
    ar:{heading:"إعدادات المصحف",sub:"اختر طريقة القراءة. القارئ العادي يبقى كما هو.",arabic:"النص العربي الأصلي",latin:"النطق بالحروف",translation:"ترجمة المعاني",lang:"لغة الترجمة",edition:"الترجمة / المترجم",normal:"القراءة العادية",open:"افتح المصحف",settings:"الإعدادات",ready:"التحقق من المصدر",loading:"جار التحقق من الترجمات …",unavailable:"لا توجد ترجمة موثقة لهذه اللغة حاليًا.",failure:"تعذّر تحميل الترجمة.",note:"صفحات تجريبية وليست طبعة المدينة ذات ٦٠٤ صفحات.",choose:"اختر نوعًا واحدًا على الأقل."},
    fr:{heading:"Préparer le muṣḥaf",sub:"Choisissez l’affichage. Le lecteur normal reste disponible.",arabic:"Texte arabe original",latin:"Translittération",translation:"Traduction du sens",lang:"Langue de traduction",edition:"Traduction / auteur",normal:"Lecture normale",open:"Ouvrir le muṣḥaf",settings:"Réglages",ready:"Vérifier la source",loading:"Recherche des traductions …",unavailable:"Aucune traduction vérifiée disponible pour cette langue.",failure:"Impossible de charger la traduction.",note:"Pagination d’essai, non édition de Médine à 604 pages.",choose:"Choisissez au moins un affichage."},
    es:{heading:"Configurar muṣḥaf",sub:"Elige la lectura. El lector normal no cambia.",arabic:"Texto árabe original",latin:"Transliteración",translation:"Traducción del significado",lang:"Idioma de traducción",edition:"Traducción / autor",normal:"Lectura normal",open:"Abrir muṣḥaf",settings:"Ajustes",ready:"Comprobar fuentes",loading:"Buscando traducciones …",unavailable:"Aún no hay traducción verificada para este idioma.",failure:"No se pudo cargar la traducción.",note:"Paginación provisional, no edición de Medina de 604 páginas.",choose:"Elige al menos una vista."},
    bs:{heading:"Postavke mushafa",sub:"Odaberi način čitanja. Obični čitač ostaje nepromijenjen.",arabic:"Izvorni arapski tekst",latin:"Transliteracija",translation:"Prijevod značenja",lang:"Jezik prijevoda",edition:"Prijevod / autor",normal:"Nastavi čitati",open:"Otvori mushaf",settings:"Postavke",ready:"Provjeri izvore",loading:"Provjera prijevoda …",unavailable:"Za ovaj jezik još nema provjerenog prijevoda.",failure:"Prijevod nije moguće učitati.",note:"Privremene stranice, ne medinska verzija od 604 stranice.",choose:"Odaberi najmanje jedan prikaz."},
    ku:{heading:"Mîhengên Muṣḥafê",sub:"Şêwaza xwendinê hilbijêre. Xwînerê asayî dimîne.",arabic:"Nivîsa erebî",latin:"Veguhastina tîpan",translation:"Wergera wateyê",lang:"Zimanê wergerê",edition:"Werger / nivîskar",normal:"Xwendina asayî",open:"Muṣḥafê veke",settings:"Mîheng",ready:"Çavkaniyê kontrol bike",loading:"Werger têne vekolîn …",unavailable:"Ji bo vî zimanî wergereke piştrastkirî tune.",failure:"Werger nehat barkirin.",note:"Rûpelên ceribandinê, ne çapê 604 rûpelî.",choose:"Kêmî yek nîşandanê hilbijêre."},
    ckb:{heading:"ڕێکخستنی موسحەف",sub:"شێوازی خوێندنەوە هەڵبژێرە. خوێنەری ئاسایی دەمێنێتەوە.",arabic:"دەقی عەرەبی",latin:"نووسینی دەنگی",translation:"وەرگێڕانی ماناکان",lang:"زمانی وەرگێڕان",edition:"وەرگێڕان / وەرگێڕ",normal:"خوێندنەوەی ئاسایی",open:"کردنەوەی موسحەف",settings:"ڕێکخستنەکان",ready:"پشکنینی سەرچاوە",loading:"پشکنینی وەرگێڕان …",unavailable:"وەرگێڕانی پشتڕاستکراو بۆ ئەم زمانە نییە.",failure:"بارکردنی وەرگێڕان سەرکەوتوو نەبوو.",note:"لاپەڕەکانی تاقیکردنەوە؛ نەک چاپی ٦٠٤ لاپەڕەی مەدینە.",choose:"لانیکەم یەک جۆر هەڵبژێرە."}
  };
  function words() {
    var l=String(document.documentElement.lang||"").toLowerCase().split("-")[0];
    try {var stored=localStorage.getItem("darAdultPreferredLocaleV1");if(LOCAL_TEXT[stored])l=stored;}catch(_){}
    return LOCAL_TEXT[l]||LOCAL_TEXT.de;
  }
  function selectionValid(){return display.arabic||display.latin||display.translation;}
  function isRightToLeft(){return !display.arabic && display.translation && language==="ckb";}
  function savePrefs(){safeStore({surah:surahNo,display:display,language:language,edition:editionId,mode:mode});}
  function originLabel(){return language==="de"?"Bubenheim & Elyas":editionName;}
  function readingSummary(){var w=words(),parts=[];if(display.arabic)parts.push(w.arabic);if(display.latin)parts.push(w.latin);if(display.translation)parts.push(LANGUAGES.find(function(x){return x.id===language;})?.name||language);return parts.join(" · ");}
  var DICT = {
    de: ["Muṣḥaf", "Buchansicht", "Muṣḥaf öffnen", "Buch schließen", "Sūrah", "Arabisch", "Mit Lautschrift", "Mit Deutsch", "Taǧwīd · folgt", "Zurückblättern", "Weiterblättern", "Vorschauseite", "Qurʾān wird geladen …", "Qurʾān-Daten konnten nicht geladen werden.", "Testoberfläche · originale Versdaten · vorläufige Seiteneinteilung"],
    en: ["Muṣḥaf", "Book view", "Open Muṣḥaf", "Close book", "Surah", "Arabic", "With transliteration", "With German", "Tajwīd · coming", "Previous page", "Next page", "Preview page", "Loading Qurʾān …", "Unable to load Qurʾān data.", "Test surface · original verse data · provisional pagination"]
  };
  function t() { return /^en\b/i.test(document.documentElement.lang || "") ? DICT.en : DICT.de; }
  function byId(id) { return document.getElementById(id); }
  function escapeHtml(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function num(n,min,max) { return Math.min(max,Math.max(min,Math.floor(Number(n)||min))); }
  function pad(n) { return String(n).padStart(3,"0"); }
  function safeStore(data) { try { localStorage.setItem(STORE,JSON.stringify(data)); } catch (_) {} }
  function previousSelection() {
    try {
      var saved=JSON.parse(localStorage.getItem(STORE)||"{}");
      if(saved&&typeof saved==="object"){
        if(saved.display && typeof saved.display==="object"){
          display={arabic:!!saved.display.arabic,latin:!!saved.display.latin,translation:!!saved.display.translation};
        } else if(saved.mode==="latin") display={arabic:true,latin:true,translation:false};
        else if(saved.mode==="de") display={arabic:true,latin:false,translation:true};
        if(LANGUAGES.some(function(x){return x.id===saved.language;}))language=saved.language;
        if(/^[a-z]{2,4}\.[a-z0-9-]+$/.test(String(saved.edition||"")))editionId=saved.edition;
        if(!selectionValid())display.arabic=true;
        return num(saved.surah,1,114);
      }
    }catch(_){}
    return 1;
  }

  function detectedPosition() {
    var found = /(?:surah|sura|chapter|s)=(\d{1,3})(?:[&#?]|$)/i.exec(location.hash || "");
    var ay = /(?:ayah|aya|verse)=(\d{1,3})(?:[&#?]|$)/i.exec(location.hash || "");
    if (found) return {surah:num(found[1],1,114),ayah:num(ay&&ay[1],1,286)};
    var continueButton = document.querySelector("[data-quran-continue]");
    var pair = continueButton && /^(\d{1,3}):(\d{1,3})$/.exec(continueButton.getAttribute("data-quran-continue")||"");
    if(pair) return {surah:num(pair[1],1,114),ayah:num(pair[2],1,286)};
    return {surah:previousSelection(),ayah:1};
  }
  function pageMarkup(items,ix) {
    var w=t(),title=chapter?chapter.name:"",roman=chapter?(chapter.transliteration||""):"";
    var text=items.map(function(v){
      var n=num(v.id,1,286),ar=escapeHtml(v.ar||""),latin=escapeHtml(v.tr_readable||v.tr_academic||v.tr||"");
      var translation=language==="de"?String(v.de||""):String(translationVerses[n]||"");
      var seg=[];
      if(display.arabic)seg.push('<div class="dam-verse-ar" lang="ar" dir="rtl">'+ar+' <span class="dam-verse-number" aria-label="Āyah '+n+'">﴿'+n+'﴾</span></div>');
      if(display.latin)seg.push('<div class="dam-verse-secondary dam-verse-latin" lang="en" dir="ltr">'+latin+'</div>');
      if(display.translation)seg.push('<div class="dam-verse-secondary dam-verse-translation" lang="'+escapeHtml(language)+'" dir="'+(isRightToLeft()?"rtl":"ltr")+'">'+escapeHtml(translation)+' <span class="dam-trans-number">('+n+')</span></div>');
      return '<div class="dam-verse" data-verse="'+n+'">'+seg.join("")+'</div>';
    }).join("");
    return '<div class="dam-page-inner"><header class="dam-page-head"><span>'+escapeHtml(roman)+'</span><span lang="ar" dir="rtl">'+escapeHtml(title)+'</span></header>'+
      '<div class="dam-page-content" dir="'+(display.arabic?"rtl":isRightToLeft()?"rtl":"ltr")+'">'+(text||'<div class="dam-empty" aria-hidden="true">✦</div>')+'</div>'+
      '<footer class="dam-page-footer"><span>'+w[11]+'</span><span>'+(ix+1)+'</span></footer></div>';
  }
  function groupVerses() {
    leafs=[];if(!chapter||!Array.isArray(chapter.verses))return;
    var current=[],weight=0,limit=(display.arabic?245:0)+(display.latin?65:0)+(display.translation?50:0);
    limit=display.arabic && !display.latin && !display.translation?280:Math.max(165,limit-55);
    chapter.verses.forEach(function(v){
      var n=Number(v.id),len=(display.arabic?String(v.ar||"").length*1.1:0)+
        (display.latin?String(v.tr_readable||v.tr||"").length*.7:0)+
        (display.translation?(language==="de"?String(v.de||""):String(translationVerses[n]||"")).length*.8:0)+38;
      if(current.length&&(weight+len>limit||current.length>=4)){leafs.push(current);current=[];weight=0;}
      current.push(v);weight+=len;
    });
    if(current.length)leafs.push(current);
    if(!leafs.length)leafs=[[]];
  }

  function perView() { return window.matchMedia && window.matchMedia("(max-width:620px)").matches ? 1 : 2; }
  function updateControls() {
    if(!root)return;
    var count=Math.max(1,Math.ceil(leafs.length/perView()));
    byId("damPageCount").textContent=(spread+1)+" / "+count;
    byId("damBack").disabled=turning||spread<=0;
    byId("damNext").disabled=turning||spread>=count-1;
    var summary=byId("damViewSummary");if(summary)summary.textContent=readingSummary();
    var credit=byId("damAttribution");if(credit)credit.textContent=display.translation ? originLabel() : "Ḥafṣ · ʿUthmānī";
  }

  function render() {
    if(!root || !chapter) return;
    leftPage.innerHTML=perView()===2 ? pageMarkup(leafs[spread*2+1]||[],spread*2+1) : "";
    rightPage.innerHTML=pageMarkup(leafs[spread*perView()]||[],spread*perView());
    leftPage.scrollTop=0;rightPage.scrollTop=0;
    updateControls();
  }
  function goToAyah(ayah) {
    var target=Math.max(1,Number(ayah)||1), idx=leafs.findIndex(function(a){return a.some(function(v){return Number(v.id)===target;});});
    spread=Math.max(0,Math.floor(Math.max(0,idx)/perView()));render();
  }
  function turn(delta) {
    if(turning || !chapter) return;
    var next=spread+delta, max=Math.ceil(leafs.length/perView())-1;
    if(next<0 || next>max)return;
    var sheet=byId("damFlipSheet"), surface=byId("damBook");
    if(!sheet || !surface)return;
    var reduced=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduced){spread=next;render();return;}
    turning=true;updateControls();
    var oldRight=rightPage.innerHTML,oldLeft=leftPage.innerHTML;
    sheet.innerHTML='<div class="dam-flip-front">'+(delta>0?oldRight:oldLeft)+'</div><div class="dam-flip-back">'+(delta>0?pageMarkup(leafs[next*perView()+(perView()===2?1:0)]||[],next*perView()+(perView()===2?1:0)):pageMarkup(leafs[next*perView()]||[],next*perView()))+'</div>';
    sheet.hidden=false;surface.classList.add(delta>0?"dam-anim-next":"dam-anim-back");
    var finished=false;
    function done(){
      if(finished)return;finished=true;
      surface.classList.remove("dam-anim-next","dam-anim-back");
      sheet.hidden=true;sheet.innerHTML="";
      spread=next;turning=false;render();
    }
    sheet.addEventListener("animationend",done,{once:true});
    window.setTimeout(done,750);
  }
  async function loadMeta() {
    if(meta.length)return;
    var response=await fetch("/content/quran/surahs.json",{credentials:"same-origin"});
    if(!response.ok)throw new Error("Sūrah-Verzeichnis HTTP "+response.status);
    var obj=await response.json();if(!obj || !Array.isArray(obj.surahs)||obj.surahs.length!==114)throw new Error("Sūrah-Verzeichnis unvollständig");
    meta=obj.surahs;
    chapterSelect.innerHTML=meta.map(function(s){return '<option value="'+num(s.id,1,114)+'">'+num(s.id,1,114)+". "+escapeHtml(s.transliteration||s.name||"Sūrah")+'</option>';}).join("");
  }
  async function loadTranslation(number,expectedCount,token) {
    translationVerses={};
    if(!display.translation||language==="de")return;
    var known=LANGUAGES.find(function(x){return x.id===language;});
    if(!known || !known.source || !editionId || !new RegExp("^"+known.source.split(".")[0].replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&")+"\\.").test(editionId))throw new Error("Keine geprüfte Übersetzung");
    var response=await fetch("https://api.alquran.cloud/v1/surah/"+number+"/"+encodeURIComponent(editionId),{cache:"default",mode:"cors"});
    if(!response.ok)throw new Error("Translation HTTP "+response.status);
    var json=await response.json(), verses=json && json.data && json.data.ayahs;
    if(!Array.isArray(verses)||verses.length!==expectedCount)throw new Error("Übersetzungsdaten unvollständig");
    var map={};
    verses.forEach(function(v){if(v&&v.numberInSurah&&typeof v.text==="string")map[Number(v.numberInSurah)]=v.text;});
    if(Object.keys(map).length!==expectedCount)throw new Error("Verszuordnung unvollständig");
    if(token===loadingToken)translationVerses=map;
  }
  async function loadChapter(number,ayah) {
    var token=++loadingToken;surahNo=num(number,1,114);referenceAyah=num(ayah||1,1,286);
    var status=byId("damStatus");status.textContent=t()[12];status.hidden=false;
    chapterSelect.value=String(surahNo);
    try{
      await loadMeta();if(token!==loadingToken)return;
      chapterSelect.value=String(surahNo);
      var response=await fetch("/content/quran/"+pad(surahNo)+".json",{credentials:"same-origin"});
      if(!response.ok)throw new Error("Sūrah HTTP "+response.status);
      var data=await response.json();if(token!==loadingToken)return;
      if(Number(data.id)!==surahNo||!Array.isArray(data.verses)||data.verses.length!==Number(data.total_verses))throw new Error("Unvollständige Versdaten");
      await loadTranslation(surahNo,data.verses.length,token);if(token!==loadingToken)return;
      chapter=data;groupVerses();goToAyah(referenceAyah);savePrefs();status.hidden=true;
    }catch(e){
      if(token!==loadingToken)return;
      chapter=null;leftPage.innerHTML="";rightPage.innerHTML="";
      status.textContent=display.translation&&language!=="de"?words().failure:t()[13];
      status.hidden=false;byId("damPageCount").textContent="–";
    }
  }
  async function fetchCatalog(){
    if(editions)return editions;
    if(!catalogPromise)catalogPromise=fetch("https://api.alquran.cloud/v1/edition/type/translation",{mode:"cors",cache:"default"})
      .then(function(r){if(!r.ok)throw new Error("Catalogue HTTP "+r.status);return r.json();})
      .then(function(json){
        if(!Array.isArray(json.data))throw new Error("Edition-Katalog fehlt");
        editions=json.data.filter(function(e){return e&&e.format==="text"&&e.type==="translation"&&/^[a-z]{2,4}\.[a-z0-9-]+$/.test(String(e.identifier||""));});
        return editions;
      }).catch(function(e){catalogPromise=null;throw e;});
    return catalogPromise;
  }
  function availableForLanguage(lang) {
    var known=LANGUAGES.find(function(x){return x.id===lang;});if(!known||!known.source)return[];
    if(lang==="de")return [{identifier:"de.bubenheim",name:"Bubenheim & Elyas"}];
    if(!editions)return[];
    // Deliberately restrict to explicitly selected source editions; no unreviewed authors.
    return editions.filter(function(e){return e.identifier===known.source;});
  }
  function setOptionStatus(text,isError){
    if(!optionsPanel)return;
    var status=byId("damOptionsStatus");status.textContent=text||"";status.dataset.error=String(!!isError);
  }
  async function syncEditions(){
    if(!optionsPanel||optionsPanel.hidden)return;
    var selector=byId("damTranslationEdition"), langBox=byId("damTranslationLanguage"), w=words();
    var lang=langBox.value;language=lang;selector.innerHTML="";
    var button=byId("damLaunchBook");button.disabled=false;
    var visible=byId("damShowTranslation").checked;
    byId("damEditionGroup").hidden=!visible;
    byId("damTranslationGroup").hidden=!visible;
    if(!visible){setOptionStatus(w.note,false);return;}
    if(lang==="ku"){
      editionId="";selector.disabled=true;button.disabled=true;setOptionStatus(w.unavailable,true);return;
    }
    if(lang==="de"){
      editionId="de.bubenheim";editionName="Bubenheim & Elyas";selector.disabled=false;
      selector.innerHTML='<option value="de.bubenheim">Bubenheim & Elyas · lokal</option>';
      setOptionStatus(w.note,false);return;
    }
    selector.disabled=true;button.disabled=true;setOptionStatus(w.loading,false);
    try{
      await fetchCatalog();
      if(!optionsPanel||optionsPanel.hidden||langBox.value!==lang||!byId("damShowTranslation").checked)return;
      var available=availableForLanguage(lang);
      if(!available.length){editionId="";setOptionStatus(w.unavailable,true);return;}
      selector.innerHTML=available.map(function(o){return '<option value="'+escapeHtml(o.identifier)+'">'+escapeHtml(o.name||o.englishName||o.identifier)+'</option>';}).join("");
      var chosen=available.find(function(x){return x.identifier===editionId;})||
        available.find(function(x){return x.identifier===(LANGUAGES.find(function(l){return l.id===lang;})||{}).source;})||available[0];
      editionId=chosen.identifier;editionName=chosen.name||chosen.englishName||chosen.identifier;
      selector.value=editionId;selector.disabled=false;button.disabled=false;setOptionStatus(w.note,false);
    }catch(e){editionId="";button.disabled=true;setOptionStatus(w.failure,true);}
  }
  function optionsFocusTrap(e) {
    var candidates=Array.from(optionsPanel.querySelectorAll("button:not(:disabled),select:not(:disabled),input:not(:disabled)")).filter(function(n){return n.getClientRects().length>0;});
    if(!candidates.length)return;
    if(e.key==="Tab"){
      var first=candidates[0],last=candidates[candidates.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  }
  function closeOptions(refocus) {
    if(!optionsPanel||optionsPanel.hidden)return;
    optionsPanel.hidden=true;
    if(root)root.removeAttribute("aria-hidden");
    if(refocus){
      var target=optionFromBook?byId("damBookSettings"):priorOptionsFocus;
      if(target&&target.isConnected)target.focus({preventScroll:true});
    }
  }
  function normalReader(){
    closeOptions(false);if(root&&!root.hidden)closeBook();
    else if(priorOptionsFocus&&priorOptionsFocus.isConnected)priorOptionsFocus.focus({preventScroll:true});
  }
  function makeOptions(){
    var w=words();optionsPanel=document.createElement("section");
    optionsPanel.id="damMushafOptions";optionsPanel.className="dam-options-overlay";optionsPanel.hidden=true;
    optionsPanel.setAttribute("role","dialog");optionsPanel.setAttribute("aria-modal","true");optionsPanel.setAttribute("aria-labelledby","damOptTitle");
    optionsPanel.innerHTML='<div class="dam-options-panel">'+
      '<div class="dam-options-head"><div><span class="dam-options-kicker">DĀR AL TAWḤĪD · TEST</span><h2 id="damOptTitle">'+escapeHtml(w.heading)+'</h2><p id="damOptSub">'+escapeHtml(w.sub)+'</p></div><button type="button" class="dam-options-x" id="damOptionsX" aria-label="Schließen">×</button></div>'+
      '<div class="dam-options-types">'+
        '<label><input type="checkbox" id="damShowArabic"><span class="dam-options-check-name" id="damArLabel">'+escapeHtml(w.arabic)+'</span></label>'+
        '<label><input type="checkbox" id="damShowLatin"><span class="dam-options-check-name" id="damLatinLabel">'+escapeHtml(w.latin)+'</span></label>'+
        '<label><input type="checkbox" id="damShowTranslation"><span class="dam-options-check-name" id="damTransLabel">'+escapeHtml(w.translation)+'</span></label>'+
      '</div>'+
      '<div class="dam-translation-controls" id="damTranslationGroup"><label id="damLangLabel" for="damTranslationLanguage">'+escapeHtml(w.lang)+'</label><select id="damTranslationLanguage"></select></div>'+
      '<div class="dam-translation-controls" id="damEditionGroup"><label id="damEditionLabel" for="damTranslationEdition">'+escapeHtml(w.edition)+'</label><select id="damTranslationEdition"></select></div>'+
      '<div class="dam-options-info" id="damOptionsStatus" role="status"></div>'+
      '<div class="dam-options-actions"><button type="button" id="damUseNormal">'+escapeHtml(w.normal)+'</button><button type="button" id="damLaunchBook">'+escapeHtml(w.open)+'</button></div>'+
      '</div>';
    document.body.appendChild(optionsPanel);
    byId("damOptionsX").addEventListener("click",function(){closeOptions(true);});
    byId("damUseNormal").addEventListener("click",normalReader);
    byId("damLaunchBook").addEventListener("click",function(){
      display={arabic:byId("damShowArabic").checked,latin:byId("damShowLatin").checked,translation:byId("damShowTranslation").checked};
      if(!selectionValid()){setOptionStatus(words().choose,true);return;}
      language=byId("damTranslationLanguage").value;
      editionId=display.translation?byId("damTranslationEdition").value:editionId;
      var found=availableForLanguage(language).find(function(x){return x.identifier===editionId;});
      if(display.translation&&!found){setOptionStatus(words().unavailable,true);return;}
      editionName=found?(found.name||found.englishName||editionId):editionName;
      var current=chapter&&leafs[spread*perView()]&&leafs[spread*perView()][0];
      var position=optionFromBook&&current?{surah:surahNo,ayah:Number(current.id)}:detectedPosition();
      savePrefs();closeOptions(false);openBook(position);
    });
    ["damShowArabic","damShowLatin","damShowTranslation"].forEach(function(id){byId(id).addEventListener("change",function(){
      if(!byId("damShowArabic").checked&&!byId("damShowLatin").checked&&!byId("damShowTranslation").checked){
        this.checked=true;setOptionStatus(words().choose,true);return;
      }
      syncEditions();
    });});
    byId("damTranslationLanguage").addEventListener("change",syncEditions);
    byId("damTranslationEdition").addEventListener("change",function(){
      editionId=this.value;var found=availableForLanguage(language).find(function(x){return x.identifier===editionId;});
      editionName=found?(found.name||found.englishName||editionId):editionId;
    });
    optionsPanel.addEventListener("keydown",function(e){if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeOptions(true);return;}optionsFocusTrap(e);});
  }
  function openOptions(){
    if(!optionsPanel)makeOptions();
    var w=words();optionFromBook=!!(root&&!root.hidden);
    priorOptionsFocus=document.activeElement;
    byId("damOptTitle").textContent=w.heading;byId("damOptSub").textContent=w.sub;
    byId("damArLabel").textContent=w.arabic;byId("damLatinLabel").textContent=w.latin;byId("damTransLabel").textContent=w.translation;
    byId("damLangLabel").textContent=w.lang;byId("damEditionLabel").textContent=w.edition;
    byId("damUseNormal").textContent=w.normal;byId("damLaunchBook").textContent=w.open;
    byId("damShowArabic").checked=display.arabic;byId("damShowLatin").checked=display.latin;byId("damShowTranslation").checked=display.translation;
    byId("damTranslationLanguage").innerHTML=LANGUAGES.map(function(l){return '<option value="'+l.id+'">'+escapeHtml(l.name)+'</option>';}).join("");
    byId("damTranslationLanguage").value=language;
    optionsPanel.hidden=false;
    if(root&&!root.hidden)root.setAttribute("aria-hidden","true");
    syncEditions();
    byId("damShowArabic").focus({preventScroll:true});
  }

  function closeBook() {
    if(!root||root.hidden)return;
    ++loadingToken;turning=false;root.hidden=true;
    document.documentElement.classList.remove("dam-book-open");
    document.body.style.overflow=previousOverflow;
    if(lastFocused&&lastFocused.isConnected)lastFocused.focus({preventScroll:true});
  }
  function openBook(position) {
    if(!root)makeUI();
    if(root.hidden){
      lastFocused=priorOptionsFocus&&priorOptionsFocus.isConnected?priorOptionsFocus:document.activeElement;
      previousOverflow=document.body.style.overflow;
      document.body.style.overflow="hidden";root.hidden=false;
      document.documentElement.classList.add("dam-book-open");
    }
    position=position||detectedPosition();
    loadChapter(position.surah,position.ayah);
    byId("damClose").focus({preventScroll:true});
  }

  function makeUI() {
    var w=t(),ui=words();
    root=document.createElement("section");root.id=ROOT;root.className="dam-overlay";root.hidden=true;
    root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label",w[0]);
    root.innerHTML='<div class="dam-shell"><header class="dam-header">'+
      '<div class="dam-brand"><span class="dam-brand-kicker">DĀR AL TAWḤĪD · TEST</span><strong>'+w[0]+'</strong><span id="damViewSummary"></span></div>'+
      '<div class="dam-header-actions"><button type="button" id="damBookSettings" class="dam-book-settings">'+escapeHtml(ui.settings)+'</button><button type="button" id="damClose" class="dam-close" aria-label="'+w[3]+'">×</button></div></header>'+
      '<div class="dam-toolbar"><label class="dam-surah-label" for="damSurah">'+w[4]+'</label><select id="damSurah" class="dam-select" aria-label="'+w[4]+'"><option value="1">Al-Fātiḥah</option></select><span class="dam-source" id="damAttribution"></span></div>'+
      '<div class="dam-stage"><div id="damBook" class="dam-book"><div class="dam-book-pages"><article id="damLeft" class="dam-page dam-page-left" aria-label="Linke Buchseite"></article><article id="damRight" class="dam-page dam-page-right" aria-label="Rechte Buchseite"></article><div id="damFlipSheet" class="dam-flip-sheet" hidden></div><div class="dam-gutter" aria-hidden="true"></div></div></div><div id="damStatus" class="dam-status" role="status"></div></div>'+
      '<footer class="dam-foot"><button type="button" id="damBack" aria-label="'+w[9]+'">‹ <span>'+w[9]+'</span></button><div class="dam-progress"><span id="damPageCount">–</span><small>'+w[14]+'</small></div><button type="button" id="damNext" aria-label="'+w[10]+'"><span>'+w[10]+'</span> ›</button></footer></div>';
    document.body.appendChild(root);
    chapterSelect=byId("damSurah");leftPage=byId("damLeft");rightPage=byId("damRight");
    byId("damClose").addEventListener("click",closeBook);
    byId("damBookSettings").addEventListener("click",openOptions);
    byId("damBack").addEventListener("click",function(){turn(-1);});
    byId("damNext").addEventListener("click",function(){turn(1);});
    chapterSelect.addEventListener("change",function(){loadChapter(chapterSelect.value,1);});
    var startX=0,startY=0;
    byId("damBook").addEventListener("touchstart",function(e){if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY;}},{passive:true});
    byId("damBook").addEventListener("touchend",function(e){if(!e.changedTouches.length)return;var dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3)turn(dx<0?1:-1);},{passive:true});
    root.addEventListener("keydown",function(e){
      if(optionsPanel&&!optionsPanel.hidden)return;
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeBook();return;}
      if(e.key==="ArrowLeft"&&!/SELECT|INPUT/.test(e.target.tagName)){e.preventDefault();turn(1);}
      if(e.key==="ArrowRight"&&!/SELECT|INPUT/.test(e.target.tagName)){e.preventDefault();turn(-1);}
      if(e.key==="Tab"){var b=Array.from(root.querySelectorAll("button:not(:disabled),select")).filter(function(x){return x.getClientRects().length;});if(!b.length)return;var first=b[0],last=b[b.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    updateControls();
  }

  function mountTrigger() {
    var isReader=document.body.classList.contains("is-quran-reader-route");
    var isOverview=document.body.classList.contains("is-quran-overview");
    var actions=isReader?byId("qrcActions"):isOverview?document.querySelector("#qovHeader .qov-icon-actions"):null;
    if(!actions) {
      if(trigger)trigger.remove();
      trigger=null;
      if(root&&!root.hidden)closeBook();
      if(optionsPanel&&!optionsPanel.hidden)closeOptions(false);
      return;
    }
    if(trigger&&trigger.parentElement===actions)return;
    if(trigger)trigger.remove();
    trigger=document.createElement("button");trigger.type="button";trigger.id="damMushafTrigger";
    trigger.className=(isReader?"qrc-icon-btn":"qov-icon-btn")+" dam-trigger";
    trigger.textContent="▣";trigger.title=t()[2];
    trigger.setAttribute("aria-label",t()[2]);trigger.setAttribute("aria-haspopup","dialog");
    trigger.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();openOptions();});
    actions.appendChild(trigger);
  }
  function boot() {
    if(ready||!document.body)return;ready=true;
    previousSelection();mountTrigger();
    var pending=false;
    function schedule(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;mountTrigger();});}
    observer=new MutationObserver(function(){schedule();});
    observer.observe(document.body,{attributes:true,attributeFilter:["class"]});
    var app=byId("appView");if(app)observer.observe(app,{childList:true,subtree:true});
    window.addEventListener("hashchange",schedule);
    window.addEventListener("pageshow",schedule);
    window.addEventListener("resize",function(){
      var current=perView();if(current===lastViewCount)return;
      var first=leafs[spread*lastViewCount]&&leafs[spread*lastViewCount][0];
      lastViewCount=current;
      if(root&&!root.hidden&&chapter&&first)goToAyah(first.id);
    },{passive:true});
  }
  window.DarMushafTestBook={open:openOptions,openBook:openBook,close:closeBook};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();