/* DĀR AL TAWḤĪD Q1–Q48 · shared language shell.
 * Changes only authored German UI fields and explicitly available draft fields.
 * Arabic originals, isnads, primary source URLs and grading never mutate.
 * Q49–Q51 retain their independently reviewed/adapted own implementations. */
(function(window,document){
"use strict";
if(window.__DARLegacyQLocaleV1)return;
var match=location.pathname.match(/^\/q\/([1-9]|[1-3][0-9]|4[0-8])\/(?:index\.html)?$/);
if(!match)return;
window.__DARLegacyQLocaleV1=true;
var NUMBER=Number(match[1]),KEY="darAdultPreferredLocaleV1";
var LANGS=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var STRINGS={
de:{language:"Sprache",review:"Teilweise übersetzter Entwurf. Die fachliche und sprachliche Prüfung steht noch aus; nicht übersetzte Passagen bleiben im deutschen Original.",missing:"Für diesen Beleg liegt noch keine vollständige, geprüfte Übersetzung vor. Die religiösen Aussagen und Erläuterungen bleiben deshalb im deutschen Original.",speaker:"Sprecher",topic:"Thema",sources:"Quellen",source:"Quelle",opening:"Originalnachweis öffnen",original:"Originalquelle ohne Markierung",scan:"PDF/Scan öffnen",text:"Textnachweis mit Markierung",internal:"Interne Quellenseite",note:"Hinweis",status:"Status",chain:"Isnād-Bereich",arabic:"Originalwortlaut",main:"Hauptquellen",mainRefs:"Hauptquellen und Fundstellen",evidence:"Originalquellen und Fundstellen",copyright:"Nicht geprüfte Sprachfassung"},
ar:{language:"اللغة",review:"مسودة مترجمة جزئيًا لم تُراجع بعد علميًا أو لغويًا. تبقى المقاطع غير المترجمة بالألمانية.",missing:"لا تتوفر ترجمة كاملة ومراجعة لهذا المصدر بعد. تبقى الأقوال والشروح الدينية بالألمانية الأصلية.",speaker:"القائل",topic:"الموضوع",sources:"المصادر",source:"المصدر",opening:"فتح الدليل الأصلي",original:"المصدر الأصلي دون تحديد",scan:"فتح ملف PDF/النسخة المصورة",text:"دليل نصي مع تحديد",internal:"صفحة المصدر الداخلية",note:"تنبيه",status:"الحكم",chain:"سلسلة الإسناد",arabic:"النص العربي الأصلي",main:"المصادر الأساسية",mainRefs:"المصادر الأساسية ومواضعها",evidence:"المصادر الأصلية ومواضعها",copyright:"ترجمة غير معتمدة"},
en:{language:"Language",review:"Partially translated draft, pending linguistic and scholarly review. Untranslated passages remain in the German original.",missing:"No complete, reviewed translation is available for this source. Religious statements and explanations therefore remain in their German original.",speaker:"Speaker",topic:"Topic",sources:"Sources",source:"Source",opening:"Open original reference",original:"Original source without highlighting",scan:"Open PDF/scan",text:"Marked text reference",internal:"Internal source page",note:"Note",status:"Status",chain:"Chain of transmission",arabic:"Original Arabic wording",main:"Primary sources",mainRefs:"Primary sources and references",evidence:"Original sources and references",copyright:"Unreviewed translation"},
tr:{language:"Dil",review:"Kısmen çevrilmiş taslak; dil ve ilmî inceleme henüz tamamlanmadı. Çevrilmeyen bölümler Almanca asıl metin olarak kalır.",missing:"Bu kaynak için henüz tam ve incelenmiş bir çeviri mevcut değil. Dinî ifadeler ve açıklamalar Almanca asıllarıyla gösterilir.",speaker:"Söyleyen",topic:"Konu",sources:"Kaynaklar",source:"Kaynak",opening:"Asıl kaynağı aç",original:"İşaretlenmemiş asıl kaynak",scan:"PDF/taramayı aç",text:"İşaretli metin kanıtı",internal:"Dahili kaynak sayfası",note:"Not",status:"Durum",chain:"Rivayet zinciri",arabic:"Arapça özgün metin",main:"Temel kaynaklar",mainRefs:"Temel kaynaklar ve yerleri",evidence:"Asıl kaynaklar ve atıflar",copyright:"İncelenmemiş çeviri"},
ku:{language:"Ziman",review:"Ev wergera qismî hîn nehatîye vekolîna zimanî û zanistî. Beşên newergerandî bi almanî dimînin.",missing:"Ji bo vê çavkaniyê wergera temam û pejirandî hîn tune ye. Gotin û şîroveyên dînî bi almaniya bingehîn dimînin.",speaker:"Axaftvan",topic:"Mijar",sources:"Çavkanî",source:"Çavkanî",opening:"Çavkaniya orîjînal veke",original:"Çavkaniya bê nîşankirin",scan:"PDF/scan veke",text:"Belgeya nivîsî ya nîşankirî",internal:"Rûpela çavkaniya hundirîn",note:"Têbînî",status:"Rewş",chain:"Zincîra rivayetê",arabic:"Gotina erebî ya orîjînal",main:"Çavkaniyên bingehîn",mainRefs:"Çavkanî û referansên bingehîn",evidence:"Çavkaniyên orîjînal û referans",copyright:"Wergera chưa-nehatîye pejirandin"},
ckb:{language:"زمان",review:"ئەم وەرگێڕانە بەشێکی تەواو نەکراوە و هێشتا پشکنینی زمانەوانی و زانستی نەکراوە. بەشە وەرنەگێڕدراوەکان بە ئەڵمانی دەمێننەوە.",missing:"هێشتا وەرگێڕانێکی تەواو و پشکنراو بۆ ئەم سەرچاوەیە نییە؛ وتە و ڕوونکردنەوە ئایینییەکان بە ئەڵمانی دەمێننەوە.",speaker:"وتەبێژ",topic:"بابەت",sources:"سەرچاوەکان",source:"سەرچاوە",opening:"کردنەوەی بەڵگەی ڕەسەن",original:"سەرچاوەی ڕەسەن بێ نیشانە",scan:"کردنەوەی PDF/سکان",text:"بەڵگەی دەقی نیشانکراو",internal:"پەڕەی ناوخۆی سەرچاوە",note:"تێبینی",status:"دۆخ",chain:"زنجیرەی ڕیوایەت",arabic:"دەقی عەرەبی ڕەسەن",main:"سەرچاوە سەرەکییەکان",mainRefs:"سەرچاوە و ئاماژە سەرەکییەکان",evidence:"سەرچاوە ڕەسەنەکان و ئاماژەکان",copyright:"وەرگێڕانی پشکنراو نییە"},
bs:{language:"Jezik",review:"Djelimično preveden nacrt čeka jezičku i stručnu provjeru. Neprevedeni dijelovi ostaju na izvornom njemačkom.",missing:"Za ovaj izvor još nema potpunog, provjerenog prijevoda. Vjerske izjave i objašnjenja ostaju u njemačkom originalu.",speaker:"Govornik",topic:"Tema",sources:"Izvori",source:"Izvor",opening:"Otvori izvorni dokaz",original:"Izvor bez označavanja",scan:"Otvori PDF/sken",text:"Označeni tekstualni dokaz",internal:"Interna izvorna stranica",note:"Napomena",status:"Status",chain:"Lanac prenosilaca",arabic:"Izvorni arapski tekst",main:"Glavni izvori",mainRefs:"Glavni izvori i reference",evidence:"Izvorni dokazi i reference",copyright:"Nepregledan prijevod"},
fr:{language:"Langue",review:"Traduction partielle en cours de révision linguistique et scientifique. Les passages non traduits restent en allemand.",missing:"Aucune traduction complète et vérifiée n'est encore disponible pour cette source. Les propos religieux et les explications restent dans leur version originale allemande.",speaker:"Auteur de la parole",topic:"Sujet",sources:"Sources",source:"Source",opening:"Ouvrir la référence originale",original:"Source originale sans surlignage",scan:"Ouvrir le PDF/scan",text:"Preuve textuelle surlignée",internal:"Page interne de la source",note:"Remarque",status:"Statut",chain:"Chaîne de transmission",arabic:"Texte arabe original",main:"Sources principales",mainRefs:"Sources principales et références",evidence:"Sources originales et références",copyright:"Traduction non validée"},
es:{language:"Idioma",review:"Borrador parcialmente traducido, pendiente de revisión lingüística y académica. Los pasajes sin traducir permanecen en alemán.",missing:"Todavía no hay una traducción completa y revisada de esta fuente. Los dichos religiosos y las explicaciones permanecen en su versión original alemana.",speaker:"Autor de la cita",topic:"Tema",sources:"Fuentes",source:"Fuente",opening:"Abrir referencia original",original:"Fuente original sin resaltar",scan:"Abrir PDF/escaneo",text:"Prueba textual resaltada",internal:"Página interna de la fuente",note:"Nota",status:"Estado",chain:"Cadena de transmisión",arabic:"Texto árabe original",main:"Fuentes principales",mainRefs:"Fuentes principales y referencias",evidence:"Fuentes originales y referencias",copyright:"Traducción no revisada"}
};
var UI_ORIGINAL={
 "Sprecher":"speaker","Thema":"topic","Quellen":"sources","Quelle":"source","Originalnachweis öffnen":"opening",
 "Originalquelle ohne Markierung":"original","PDF/Scan öffnen":"scan","PDF / Scan öffnen":"scan",
 "Textnachweis mit Markierung":"text","Interne Quellenseite":"internal","Hinweis:":"note",
 "Status:":"status","Isnād-Bereich":"chain","Originalwortlaut":"arabic","Arabischer Originalwortlaut":"arabic",
 "Hauptquellen":"main","Hauptquellen und Fundstellen":"mainRefs","Originalquellen und Fundstellen":"evidence"
};
var originals=new WeakMap(),manifest=null,choice="";
function norm(code){code=String(code||"").trim().toLowerCase().replace(/_/g,"-");if(code==="kr")code="ku";return LANGS.indexOf(code)>=0?code:"";}
function selected(){if(choice)return choice;try{var url=new URL(location.href),q=norm(url.searchParams.get("lang")||url.searchParams.get("locale"));if(q)return q}catch(_){}try{return norm(localStorage.getItem(KEY))||"de"}catch(_){return"de"}}
function original(el){if(!el)return "";if(!originals.has(el))originals.set(el,el.textContent);return originals.get(el)}
function set(el,str){if(!el)return;original(el);if(el.textContent!==str)el.textContent=str}
function find(sel){return document.querySelector(sel)}
function sourceReferenceIsImmutable(el){return el.matches&&el.matches(".qsource-arabic, .q51-ar, .q49-ar, [lang='ar'], [dir='rtl']");}
function keep(node,value){if(!node||sourceReferenceIsImmutable(node))return;set(node,value)}
function notice(code,pageData){
 var wrapper=find("#darQLegacyLanguageV1");if(!wrapper)return;
 var n=wrapper.querySelector(".dar-q-language-notice"),l=STRINGS[code];
 if(!n)return;
 if(code==="de"){n.hidden=true;n.textContent="";return}
 var hasDraft=!!(pageData&&pageData.locales&&pageData.locales[code]&&pageData.locales[code].title);
 n.hidden=false;n.textContent=hasDraft?l.review:l.missing;
}
function makePicker(){
 if(find("#darQLegacyLanguageV1"))return;
 var page=find(".qsource-page");if(!page)return;
 var section=document.createElement("section");section.id="darQLegacyLanguageV1";section.className="dar-q-language";
 var label=document.createElement("label");label.htmlFor="darQSourceLanguage";label.className="dar-q-language-label";
 var select=document.createElement("select");select.id="darQSourceLanguage";select.setAttribute("aria-label","Sprache / Language");
 var names={de:"Deutsch",ar:"العربية",en:"English",tr:"Türkçe",ku:"Kurmancî",ckb:"سۆرانی",bs:"Bosanski",fr:"Français",es:"Español"};
 LANGS.forEach(function(code){var option=document.createElement("option");option.value=code;option.textContent=names[code];select.appendChild(option)});
 var status=document.createElement("p");status.className="dar-q-language-notice";status.setAttribute("role","status");
 section.append(label,select,status);
 var hero=find(".qsource-hero");if(hero)hero.parentNode.insertBefore(section,hero);else page.insertBefore(section,page.firstChild);
 select.addEventListener("change",function(){
  var lang=norm(select.value);if(!lang)return;choice=lang;
  try{localStorage.setItem(KEY,lang)}catch(_){}
  try{var u=new URL(location.href);u.searchParams.set("lang",lang);history.replaceState(history.state,"",u.pathname+u.search+u.hash)}catch(_){}
  render();
  window.dispatchEvent(new CustomEvent("dar:q-legacy:locale-ready",{detail:{number:NUMBER,locale:lang}}));
 });
}
function textBlocks(data,code){
 var x=data&&data.locales&&data.locales[code];
 var baseline=data&&data.locales&&data.locales.de;
 var title=find(".qsource-title"),quote=find(".qsource-quote"),topic=find(".qsource-meta-row:nth-child(2) .qsource-meta-value");
 if(title)keep(title,code!=="de"&&x&&x.title?x.title:original(title));
 if(quote)keep(quote,code!=="de"&&x&&x.quote?("„"+x.quote.replace(/^„|“$/g,"")+"“"):original(quote));
 if(topic)keep(topic,code!=="de"&&x&&x.topic?x.topic:original(topic));
 if(x&&x.title)document.title=x.title+" · Q"+NUMBER+" | DĀR AL TAWḤĪD";
 else document.title=original(find(".qsource-title"))+" · Q"+NUMBER+" | DĀR AL TAWḤĪD";
}
function uiLabels(code){
 var dict=STRINGS[code];if(!dict)return;
 var selectors=[".qsource-meta-label",".qsource-section-title",".qsource-link-title",".qsource-section b"];
 selectors.forEach(function(sel){document.querySelectorAll(sel).forEach(function(el){
  if(sourceReferenceIsImmutable(el))return;
  var base=original(el),key=UI_ORIGINAL[base.trim()],val=key?dict[key]:base;
  if(!key&&sel===".qsource-link-title"&&/ öffnen$/.test(base))val=base.replace(/ öffnen$/,code==="de"?" öffnen":code==="ar"?" · فتح":code==="tr"?" · aç":code==="en"?" · open":code==="fr"?" · ouvrir":code==="es"?" · abrir":code==="bs"?" · otvori":code==="ku"?" · veke":" · کردنەوە");
  keep(el,val);
 })});
 var brand=find(".qsource-brand-top");if(brand){
  var brandOriginal=original(brand);
  var brandLabels={de:"Beiträge nach Qurʾān, Sunnah & Āthār",ar:"مقالات على هدي القرآن والسنة والآثار",en:"Posts based on Qurʾān, Sunnah & Athār",tr:"Kur’an, Sünnet ve Âsâr'a dayalı yazılar",ku:"Nivîs li ser Qurʾān, Sunnet û Āthār",ckb:"نووسراوەکان بەپێی قورئان و سوننەت و ئاسار",bs:"Objave prema Kur'anu, sunnetu i predajama",fr:"Articles fondés sur le Coran, la Sunna et les traditions",es:"Publicaciones basadas en el Corán, la Sunna y los relatos"};
  if(brandOriginal==="Beiträge nach Qurʾān, Sunnah & Āthār")keep(brand,brandLabels[code]);
 }
 var logo=find(".qsource-social a.web");if(logo)logo.setAttribute("aria-label",dict.source+" · DĀR AL TAWḤĪD");
 var label=find(".dar-q-language-label");if(label)label.textContent="🌐 "+dict.language;
 var picker=find("#darQSourceLanguage");if(picker)picker.setAttribute("aria-label",dict.language);
}
function render(){
 var code=selected(),pageData=manifest&&manifest.pages&&manifest.pages[String(NUMBER)];
 var picker=find("#darQSourceLanguage");if(picker)picker.value=code;
 document.documentElement.lang=code;document.documentElement.dir=(code==="ar"||code==="ckb"?"rtl":"ltr");
 uiLabels(code);
 textBlocks(pageData,code);
 notice(code,pageData);
 // The Arabic original is never treated as a translation or overwritten.
 document.querySelectorAll(".qsource-arabic").forEach(function(el){el.lang="ar";el.dir="rtl"});
}
function start(){
 makePicker();render();
 fetch("/assets/q1-q48-translation-catalog-v1.json?v=20261106-draft1",{cache:"no-store",credentials:"same-origin"})
 .then(function(res){if(!res.ok)throw Error("Locale catalog unavailable");return res.json()})
 .then(function(j){if(j.schemaVersion!==1||!j.pages||!j.pages[String(NUMBER)]||j.pages[String(NUMBER)].qSourceId!=="qsource:"+NUMBER)throw Error("Q source ID mismatch");manifest=j;render()})
 .catch(function(e){console.warn("DĀR Q"+NUMBER+" locale catalog unavailable; original content retained",e)});
}
var css=document.createElement("style");css.id="darQLegacyLanguageStyleV1";
css.textContent=".dar-q-language{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:12px 0 18px;padding:12px 16px;border:1px solid rgba(172,142,83,.54);border-radius:14px;background:var(--rq-page,transparent);color:inherit}.dar-q-language-label{font:750 13px system-ui,sans-serif}.dar-q-language select{flex:1;min-width:145px;max-width:260px;min-height:44px;border:1px solid rgba(172,142,83,.72);border-radius:10px;padding:8px 10px;font:600 14px system-ui,sans-serif;background:var(--rq-page,#f8f5ef);color:var(--rq-ink,#29372e)}.dar-q-language select:focus-visible{outline:2px solid #b49b6b;outline-offset:3px}.dar-q-language-notice{flex-basis:100%;margin:0;font:500 12px/1.65 system-ui,sans-serif;opacity:.86}.dar-q-language-notice[hidden]{display:none}html[dir=rtl] .dar-q-language,html[dir=rtl] .qsource-meta-row{direction:rtl;text-align:right}html[dir=rtl] .qsource-hero,html[dir=rtl] .qsource-section{text-align:right}.qsource-arabic{direction:rtl;unicode-bidi:isolate}";
(document.head||document.documentElement).appendChild(css);
window.addEventListener("dar-adult-locale-changed",function(e){if(e.detail&&norm(e.detail.locale)){choice=norm(e.detail.locale);render()}});
window.addEventListener("storage",function(e){if(e.key===KEY&&!choice)render()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
