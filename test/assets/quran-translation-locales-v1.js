/* DĀR AL TAWḤĪD · Qurʾān-Leser, neun Sprachen für die Übersetzung der Bedeutungen.
 * Der arabische Text bleibt der Qurʾān. Deutsch bleibt Bubenheim/Elyas in content/quran. */
(function(w){
  "use strict";
  if(w.DarQuranTranslationLocalesV1)return;
  var ORDER=["de","ar","en","tr","ku","ckb","bs","fr","es"];
  var LOCALES={
    de:{id:"de",name:"Deutsch",translator:"Bubenheim & Elyas",direction:"ltr"},
    ar:{id:"ar",name:"العربية",translator:"العربية",direction:"rtl"},
    en:{id:"en",name:"English",translator:"Saheeh International",direction:"ltr"},
    tr:{id:"tr",name:"Türkçe",translator:"Diyanet Vakfı",direction:"ltr"},
    ku:{id:"ku",name:"Kurdî",translator:"Ismail Sageri",direction:"rtl"},
    ckb:{id:"ckb",name:"سۆرانی",translator:"Muhammad Salih Bamoki",direction:"rtl"},
    bs:{id:"bs",name:"Bosanski",translator:"Rowwad",direction:"ltr"},
    fr:{id:"fr",name:"Français",translator:"Muhammad Hamidullah",direction:"ltr"},
    es:{id:"es",name:"Español",translator:"Noor International",direction:"ltr"}
  };
  var UI={
    de:{aria:"Übersetzung der Bedeutungen wählen",note:"Übersetzung der Bedeutungen. Der arabische Text ist der Qurʾān.",loading:"Übersetzung wird geladen.",error:"Diese Übersetzung ist gerade nicht erreichbar."},
    ar:{aria:"اختيار ترجمة المعاني",note:"ترجمة المعاني. النص العربي هو القرآن.",loading:"جارٍ تحميل الترجمة.",error:"هذه الترجمة غير متاحة الآن."},
    en:{aria:"Choose a translation of the meanings",note:"Translation of the meanings. The Arabic text is the Qurʾān.",loading:"Loading the translation.",error:"This translation is not available right now."},
    tr:{aria:"Anlam meali seç",note:"Anlam meali. Arapça metin Kur'an'dır.",loading:"Meal yükleniyor.",error:"Bu meal şu an açılamıyor."},
    ku:{aria:"Wergera wateyê hilbijêre",note:"Wergera wateyê. Nivîsa erebî Qurʾān e.",loading:"Wergerr tê barkirin.",error:"Ev wergerr niha nayê vekirin."},
    ckb:{aria:"وەرگێڕانی واتاکان هەڵبژێرە",note:"وەرگێڕانی واتاکان. دەقی عەرەبی قورئانە.",loading:"وەرگێڕان دادەگیرێت.",error:"ئەم وەرگێڕانە ئێستا بەردەست نییە."},
    bs:{aria:"Odaberi prijevod značenja",note:"Prijevod značenja. Arapski tekst je Kur'an.",loading:"Prijevod se učitava.",error:"Ovaj prijevod trenutno nije dostupan."},
    fr:{aria:"Choisir une traduction des sens",note:"Traduction des sens. Le texte arabe est le Coran.",loading:"Chargement de la traduction.",error:"Cette traduction est indisponible pour le moment."},
    es:{aria:"Elegir una traducción de los significados",note:"Traducción de los significados. El texto árabe es el Corán.",loading:"Cargando la traducción.",error:"Esta traducción no está disponible ahora."}
  };
  var KEY="darQuranTranslationLocaleV1";
  var APP="darAdultPreferredLocaleV1";
  var cache=new Map();
  var inflight=new Map();
  function pad(n){return String(n).padStart(3,"0")}
  function known(code){return ORDER.indexOf(code)>=0}
  function read(key){
    try{return String(w.localStorage.getItem(key)||"").toLowerCase().replace("_","-")}catch(e){return ""}
  }
  function uiLocale(){var code=read(APP);return known(code)?code:"de"}
  function explicit(){var code=read(KEY);return known(code)?code:""}
  function resolved(){
    var chosen=explicit();
    if(chosen)return chosen;
    var app=uiLocale();
    return known(app)?app:"de";
  }
  function text(key){
    var pack=UI[uiLocale()]||UI.de;
    return pack[key]||UI.de[key]||"";
  }
  function current(){return LOCALES[resolved()]||LOCALES.de}
  function ready(surahId){
    var loc=resolved();
    if(loc==="de"||loc==="ar")return true;
    return cache.has(loc+":"+Number(surahId));
  }
  function status(surahId){
    var loc=resolved();
    if(loc==="de"||loc==="ar")return "ready";
    var key=loc+":"+Number(surahId);
    if(!cache.has(key))return "missing";
    return cache.get(key)?"ready":"error";
  }
  function meaning(surahId,verse){
    var loc=resolved();
    if(loc==="ar")return "";
    if(loc==="de")return String(verse&&verse.de||"");
    var ayahs=cache.get(loc+":"+Number(surahId));
    if(!ayahs)return "";
    var textValue=ayahs[Number(verse&&verse.id)-1];
    return textValue?String(textValue):"";
  }
  function ensure(surahId){
    var loc=resolved();
    var n=Number(surahId);
    if(loc==="de"||loc==="ar"||!n)return Promise.resolve(null);
    var key=loc+":"+n;
    if(cache.has(key))return Promise.resolve(cache.get(key));
    if(inflight.has(key))return inflight.get(key);
    var job=fetch("/content/quran-translations/"+loc+"/"+pad(n)+".json",{cache:"force-cache"}).then(function(res){
      if(!res.ok)throw new Error(String(res.status));
      return res.json();
    }).then(function(doc){
      var ayahs=doc&&Array.isArray(doc.ayahs)?doc.ayahs:null;
      cache.set(key,ayahs&&ayahs.length?ayahs:null);
      return cache.get(key);
    }).catch(function(){
      cache.set(key,null);
      return null;
    }).finally(function(){inflight.delete(key)});
    inflight.set(key,job);
    return job;
  }
  function setLocale(code){
    if(!known(code))return;
    try{w.localStorage.setItem(KEY,code)}catch(e){}
  }
  function escapeHtml(value){
    return String(value??"").replace(/[&<>"']/g,function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m];
    });
  }
  function chromeHtml(surahId){
    var active=resolved();
    var meta=LOCALES[active]||LOCALES.de;
    var uiDir=["ar","ckb"].indexOf(uiLocale())>=0?"rtl":"ltr";
    var buttons=ORDER.map(function(code){
      var item=LOCALES[code];
      var on=code===active;
      return '<button type="button" data-quran-lang="'+item.id+'" lang="'+item.id+'" dir="'+item.direction+'" aria-pressed="'+(on?"true":"false")+'" class="'+(on?"is-active":"")+'" >'+escapeHtml(item.name)+'</button>';
    }).join("");
    var state=status(surahId);
    var credit=meta.translator+" · "+text("note");
    if(state==="missing")credit=text("loading");
    if(state==="error")credit=text("error");
    return '<nav class="qrc-lang" dir="'+uiDir+'" aria-label="'+escapeHtml(text("aria"))+'">'+buttons+'</nav><p class="qrc-lang-credit" dir="'+uiDir+'">'+escapeHtml(credit)+'</p>';
  }
  function refreshReader(){
    var route=w.currentRoute;
    if(!route||route.view!=="quran-surah"||typeof w.render!=="function")return;
    var id=Number(String(route.value||"").split("/")[0]);
    Promise.resolve(ensure(id)).then(function(){
      if(w.currentRoute&&w.currentRoute.view==="quran-surah")w.render();
    });
  }
  w.addEventListener("dar-adult-locale-changed",refreshReader);
  var registry=w.DARAdultComponentI18nV1;
  if(registry&&typeof registry.register==="function"){
    try{registry.register("quran-meaning-lang",UI)}catch(e){}
  }
  w.DarQuranTranslationLocalesV1={
    order:ORDER,
    locales:LOCALES,
    ui:UI,
    resolved:resolved,
    current:current,
    ready:ready,
    status:status,
    meaning:meaning,
    ensure:ensure,
    setLocale:setLocale,
    chromeHtml:chromeHtml
  };
})(window);
