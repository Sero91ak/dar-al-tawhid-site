/* DĀR AL TAWḤĪD – one canonical Q source, one ID, nine adult languages.
 * Q1–Q48 legacy presentation owner; Q49+ retain their own reviewed adapters.
 * A user can always select a language. Missing/unreviewed manuscripts NEVER
 * masquerade as approved or silently invent Arabic quotations/Isnād.
 * Original citations, external hrefs, speaker attributions and Arabic source
 * blocks are not modified by this adapter. */
(function(window,document){
"use strict";
if(window.__DARQLegacyNineLanguageV1)return;
var match=location.pathname.match(/^\/q\/([1-9]\d?)\/?(?:index\.html)?$/);
if(!match)return;
var number=Number(match[1]);if(number>48)return;
window.__DARQLegacyNineLanguageV1=true;
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"],STORAGE="darAdultPreferredLocaleV1";
var manifest=null,selectedManual="",requested="",originals=[],baseTitle=document.title;
var CODE_LABELS={"de":"Deutsch","ar":"العربية","en":"English","tr":"Türkçe","ku":"Kurmancî","ckb":"سۆرانی","bs":"Bosanski","fr":"Français","es":"Español"};
var UI={
de:{language:"Sprache",draft:"Übersetzung in redaktioneller und fachlicher Prüfung. Quellen und arabischer Originalwortlaut bleiben unverändert.",fallback:"Für diesen Quellenbeleg liegt noch keine geprüfte Übersetzung vor. Der deutsche Originaltext wird angezeigt.",unavailable:"Sprachdatei derzeit nicht verfügbar. Deutscher Originaltext wird angezeigt.",tagline:"Beiträge nach Qurʾān, Sunnah & Āthār",speaker:"Sprecher",topic:"Thema",sources:"Quellen",note:"Hinweis",status:"Status",source:"Quelle",original:"Originalnachweis öffnen",marked:"markierte Stelle",unmarked:"Originalquelle ohne Markierung",pdf:"PDF/Scan öffnen",second:"Zweiter Textnachweis",extra:"Zusätzliche interne Seite",internal:"Interne Quellenseite",fallbackLink:"Fallback",originalText:"Originaltext öffnen",sourceOpening:"Quelle öffnen"},
ar:{language:"اللغة",draft:"هذه الترجمة مسودة قيد المراجعة اللغوية والعلمية. تبقى المصادر والنصوص العربية الأصلية دون تغيير.",fallback:"لا تتوفر ترجمة معتمدة لهذا الدليل بعد. يُعرض النص الألماني الأصلي.",unavailable:"ملف اللغة غير متاح حاليًا. يُعرض النص الألماني الأصلي.",tagline:"مقالات من القرآن والسنة وآثار السلف",speaker:"القائل",topic:"الموضوع",sources:"المصادر",note:"تنبيه",status:"الحكم",source:"المصدر",original:"فتح المصدر الأصلي",marked:"الموضع المحدد",unmarked:"المصدر الأصلي دون تحديد",pdf:"فتح ملف PDF/المسح",second:"دليل نصي ثانٍ",extra:"صفحة داخلية إضافية",internal:"صفحة المصدر الداخلية",fallbackLink:"رابط بديل",originalText:"فتح النص الأصلي",sourceOpening:"فتح المصدر"},
en:{language:"Language",draft:"Translation draft pending linguistic and scholarly review. Original sources and Arabic wording are unchanged.",fallback:"No approved translation is available for this source yet. The original German text is shown.",unavailable:"Language data is currently unavailable. The original German text is shown.",tagline:"Articles based on Qurʾān, Sunnah and reports of the early generations",speaker:"Speaker",topic:"Topic",sources:"Sources",note:"Note",status:"Status",source:"Source",original:"Open original evidence",marked:"highlighted passage",unmarked:"Original source without highlight",pdf:"Open PDF/scan",second:"Second textual reference",extra:"Additional internal page",internal:"Internal source page",fallbackLink:"Alternative link",originalText:"Open original text",sourceOpening:"Open source"},
tr:{language:"Dil",draft:"Bu çeviri, dil ve ilmî inceleme bekleyen bir taslaktır. Asıl kaynaklar ve Arapça metinler değiştirilmemiştir.",fallback:"Bu kaynak için henüz onaylı çeviri yok. Almanca asıl metin gösteriliyor.",unavailable:"Dil dosyası şu anda erişilemiyor. Almanca asıl metin gösteriliyor.",tagline:"Kur’an, Sünnet ve selef rivayetlerine dayanan yazılar",speaker:"Söyleyen",topic:"Konu",sources:"Kaynaklar",note:"Not",status:"Durum",source:"Kaynak",original:"Asıl delili aç",marked:"işaretli bölüm",unmarked:"İşaretsiz asıl kaynak",pdf:"PDF/taramayı aç",second:"İkinci metin delili",extra:"Ek dahili sayfa",internal:"Dahili kaynak sayfası",fallbackLink:"Yedek bağlantı",originalText:"Asıl metni aç",sourceOpening:"Kaynağı aç"},
ku:{language:"Ziman",draft:"Ev werger pêşnivîsek e û hê nirxandina zimanî û ilmî dixwaze. Çavkanî û nivîsarên erebî yên orîjînal nayên guhertin.",fallback:"Ji bo vê çavkaniyê hê wergera pejirandî tune ye. Nivîsara orîjînal a almanî tê nîşandan.",unavailable:"Pelê zimanê niha nayê gihîştin. Nivîsara almanî tê nîşandan.",tagline:"Nivîsên li ser Qurʾān, Sunnah û āṯārên pêşiyan",speaker:"Gotinvan",topic:"Mijar",sources:"Çavkanî",note:"Têbînî",status:"Rewş",source:"Çavkanî",original:"Belgeya orîjînal veke",marked:"cîhê nîşankirî",unmarked:"Çavkaniya orîjînal bê nîşan",pdf:"PDF/scan veke",second:"Belgeya nivîskî ya duyem",extra:"Rûpela navxweyî ya zêde",internal:"Rûpela çavkaniya navxweyî",fallbackLink:"Girêdana cîgir",originalText:"Nivîsara orîjînal veke",sourceOpening:"Çavkaniyê veke"},
ckb:{language:"زمان",draft:"ئەم وەرگێڕانە ڕەشنووسە و پێویستی بە پشکنینی زمانەوانی و زانستی هەیە. سەرچاوەکان و دەقی عەرەبیی ڕەسەن ناگۆڕدرێن.",fallback:"هێشتا وەرگێڕانی پەسەندکراو بۆ ئەم بەڵگەیە نییە. دەقی ئەڵمانیی ڕەسەن پیشان دەدرێت.",unavailable:"فایلی زمان ئێستا بەردەست نییە. دەقی ئەڵمانی پیشان دەدرێت.",tagline:"بابەتەکان لەسەر بنەمای قورئان و سوننەت و ئاسار",speaker:"وتەبێژ",topic:"بابەت",sources:"سەرچاوەکان",note:"تێبینی",status:"پلە",source:"سەرچاوە",original:"کردنەوەی بەڵگەی ڕەسەن",marked:"شوێنی دیاریکراو",unmarked:"سەرچاوەی ڕەسەن بەبێ نیشانە",pdf:"کردنەوەی PDF/سکان",second:"بەڵگەی دەقی دووەم",extra:"پەڕەی ناوخۆیی زیادە",internal:"پەڕەی سەرچاوەی ناوخۆیی",fallbackLink:"بەستەری جێگرەوە",originalText:"کردنەوەی دەقی ڕەسەن",sourceOpening:"کردنەوەی سەرچاوە"},
bs:{language:"Jezik",draft:"Ovaj prijevod je nacrt i čeka jezičku i stručnu provjeru. Izvorni dokazi i arapski tekst ostaju nepromijenjeni.",fallback:"Za ovaj izvor još nema odobrenog prijevoda. Prikazan je izvorni njemački tekst.",unavailable:"Jezička datoteka trenutno nije dostupna. Prikazan je njemački izvornik.",tagline:"Prilozi na temelju Kurʾāna, Sunneta i predaja prvih generacija",speaker:"Govornik",topic:"Tema",sources:"Izvori",note:"Napomena",status:"Status",source:"Izvor",original:"Otvori izvorni dokaz",marked:"označeno mjesto",unmarked:"Izvor bez oznake",pdf:"Otvori PDF/sken",second:"Drugi tekstualni dokaz",extra:"Dodatna interna stranica",internal:"Interna stranica izvora",fallbackLink:"Rezervni link",originalText:"Otvori izvorni tekst",sourceOpening:"Otvori izvor"},
fr:{language:"Langue",draft:"Cette traduction est un brouillon en attente de vérification linguistique et scientifique. Les sources et les originaux arabes restent inchangés.",fallback:"Aucune traduction approuvée n'est disponible pour cette source. Le texte allemand original est affiché.",unavailable:"Le fichier linguistique est momentanément indisponible. Le texte allemand original est affiché.",tagline:"Articles fondés sur le Coran, la Sunnah et les récits des premières générations",speaker:"Auteur de la parole",topic:"Sujet",sources:"Sources",note:"Note",status:"Statut",source:"Source",original:"Ouvrir le témoignage original",marked:"passage indiqué",unmarked:"Source originale sans repère",pdf:"Ouvrir le PDF/scan",second:"Deuxième attestation textuelle",extra:"Page interne complémentaire",internal:"Page de source interne",fallbackLink:"Lien de secours",originalText:"Ouvrir le texte original",sourceOpening:"Ouvrir la source"},
es:{language:"Idioma",draft:"Esta traducción es un borrador pendiente de revisión lingüística y especializada. Las fuentes y los originales árabes permanecen intactos.",fallback:"Todavía no existe una traducción aprobada para esta fuente. Se muestra el texto original alemán.",unavailable:"El archivo de idioma no está disponible. Se muestra el original alemán.",tagline:"Artículos basados en el Corán, la Sunnah y las narraciones tempranas",speaker:"Autor de la declaración",topic:"Tema",sources:"Fuentes",note:"Nota",status:"Estado",source:"Fuente",original:"Abrir prueba original",marked:"pasaje señalado",unmarked:"Fuente original sin marcar",pdf:"Abrir PDF/escaneo",second:"Segunda referencia textual",extra:"Página interna adicional",internal:"Página de fuente interna",fallbackLink:"Enlace alternativo",originalText:"Abrir texto original",sourceOpening:"Abrir fuente"}
};
function node(tag,klass,content){var x=document.createElement(tag);if(klass)x.className=klass;if(content!=null)x.textContent=String(content);return x}
function norm(k){k=String(k||"").trim().toLowerCase().replace(/_/g,"-");if(k==="kr")k="ku";if(k==="ku-sorani")k="ckb";return CODES.indexOf(k)>=0?k:""}
function saved(){try{return norm(localStorage.getItem(STORAGE))}catch(_){return ""}}
function explicit(){try{var u=new URL(location.href);return norm(u.searchParams.get("lang")||u.searchParams.get("locale"))}catch(_){return ""}}
function current(){return selectedManual||explicit()||saved()||"de"}
function find(s){return document.querySelector(s)}
function remember(el){if(el&&!originals.some(function(t){return t[0]===el}))originals.push([el,el.textContent])}
function set(el,v){if(!el||v==null)return;remember(el);el.textContent=String(v)}
function restore(){originals.forEach(function(t){t[0].textContent=t[1]});document.title=baseTitle}
function setupBar(){
 var header=find(".qsource-page .qsource-header"),page=find(".qsource-page");if(!header||!page)return null;
 var bar=node("div","q-legacy-language-v1");bar.id="qLegacyLanguageV1";
 var lab=node("label","q-legacy-language-label");lab.htmlFor="qLegacyLanguageSelect";
 var sel=node("select","q-legacy-language-select");sel.id="qLegacyLanguageSelect";
 var code=current();CODES.forEach(function(k){var o=node("option","",CODE_LABELS[k]);o.value=k;sel.appendChild(o)});
 var note=node("p","q-legacy-language-status");note.id="qLegacyLanguageStatus";note.setAttribute("role","status");
 bar.append(lab,sel,note);
 var after=find(".rq-topbar")||header;after.insertAdjacentElement("afterend",bar);
 var css=node("style");css.textContent=
 "#qLegacyLanguageV1{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 0;margin:10px 0 15px;border-bottom:1px solid var(--rq-line,#9c8865);box-sizing:border-box;max-width:100%}"+
 "#qLegacyLanguageV1 .q-legacy-language-label{font:750 .83rem/1.3 system-ui;color:var(--rq-ink,inherit)}"+
 "#qLegacyLanguageV1 .q-legacy-language-select{font:600 15px/1.4 system-ui;min-width:130px;max-width:100%;min-height:44px;border:1px solid #aa9363;border-radius:11px;background:var(--rq-surface,#fff);color:var(--rq-ink,#243229);padding:7px 10px}"+
 "#qLegacyLanguageV1 .q-legacy-language-status{flex-basis:100%;font:500 .79rem/1.55 system-ui;opacity:.84;margin:0;color:var(--rq-ink,inherit)}"+
 "#qLegacyLanguageV1[dir=rtl]{direction:rtl;text-align:right}"+
 ".qsource-page.q-legacy-rtl .qsource-quote,.qsource-page.q-legacy-rtl .qsource-title{text-align:right;direction:rtl}"+
 "@media(max-width:410px){#qLegacyLanguageV1{gap:7px}#qLegacyLanguageV1 .q-legacy-language-select{flex:1;min-width:0}}";
 document.head.appendChild(css);
 sel.addEventListener("change",function(){choose(sel.value)});
 return{bar:bar,label:lab,select:sel,status:note};
}
var controls=null;
function validatePack(p){
 if(!p||typeof p!=="object")return false;
 var target=["title","quote","topic","speaker","section","noteBody","noteLabel","linkTitles","linkSubs"];
 if(target.some(function(k){return p[k]===undefined||p[k]===null}))return false;
 return Array.isArray(p.linkTitles)&&Array.isArray(p.linkSubs)&&p.linkTitles.length>0&&p.linkTitles.length===p.linkSubs.length;
}
function render(){
 if(!controls)return;
 var code=current(),ui=UI[code]||UI.de;
 controls.bar.dir=(code==="ar"||code==="ckb")?"rtl":"ltr";
 controls.label.textContent="🌐 "+ui.language;
 controls.select.setAttribute("aria-label",ui.language+" · Q"+number);
 controls.select.value=code;
 restore();
 var pack=manifest&&manifest.pages&&manifest.pages[String(number)];
 var chosen=pack&&pack.locales&&pack.locales[code];
 var hasTranslation=code!=="de"&&validatePack(chosen);
 var canTranslate=hasTranslation&&pack.canonicalTitle===find(".qsource-title")?.textContent&&pack.canonicalQuote===find(".qsource-quote")?.textContent&&chosen.linkTitles.length===document.querySelectorAll("a.qsource-link").length;
 var page=find(".qsource-page");
 if(page)page.classList.toggle("q-legacy-rtl",!!(canTranslate&&(code==="ar"||code==="ckb")));
 if(!canTranslate){
  document.documentElement.lang="de";document.documentElement.dir="ltr";
  if(page){page.lang="de";page.dir="ltr"}
  controls.status.textContent=code==="de"?"":(!manifest?ui.unavailable:ui.fallback);
 }else{
  var title=find(".qsource-title"),quote=find(".qsource-quote"),tagline=find(".qsource-brand-top");
  set(title,chosen.title);set(quote,chosen.quote);set(tagline,ui.tagline);
  var meta=Array.prototype.slice.call(document.querySelectorAll(".qsource-meta-row"));
  if(meta[0]){set(meta[0].querySelector(".qsource-meta-label"),ui.speaker);set(meta[0].querySelector(".qsource-meta-value"),chosen.speaker)}
  if(meta[1]){set(meta[1].querySelector(".qsource-meta-label"),ui.topic);set(meta[1].querySelector(".qsource-meta-value"),chosen.topic)}
  if(meta[2]){set(meta[2].querySelector(".qsource-meta-label"),ui.sources);if(chosen.sourceMeta)set(meta[2].querySelector(".qsource-meta-value"),chosen.sourceMeta)}
  set(find(".qsource-section-title"),chosen.section);
  var note=document.querySelector(".qsource-section p:not(.qsource-arabic)");
  if(note&&note.querySelector("b")){
    var label=note.querySelector("b"),tail=label.nextSibling;
    set(label,chosen.noteLabel+":");if(tail&&tail.nodeType===3)set(tail," "+chosen.noteBody);
  }
  if(chosen.listItems){Array.prototype.slice.call(document.querySelectorAll(".qsource-section ol li")).forEach(function(el,i){if(chosen.listItems[i])set(el,chosen.listItems[i])})}
  var links=Array.prototype.slice.call(document.querySelectorAll("a.qsource-link"));
  links.forEach(function(a,i){set(a.querySelector(".qsource-link-title"),chosen.linkTitles[i]);set(a.querySelector(".qsource-link-sub"),chosen.linkSubs[i])});
  // Name, grade, source numbers, Arabic originals and every href remain as authored.
  document.documentElement.lang=code;document.documentElement.dir=(code==="ar"||code==="ckb")?"rtl":"ltr";
  if(page){page.lang=code;page.dir=document.documentElement.dir}
  document.title=chosen.title+" · Q"+number+" | DĀR AL TAWḤĪD";
  controls.status.textContent=ui.draft;
 }
 if(window.CustomEvent)window.dispatchEvent(new CustomEvent("dar:qlegacy:locale-ready",{detail:{qId:number,locale:code,translated:!!canTranslate,approved:false}}));
}
function choose(c){
 c=norm(c);if(!c)return;
 selectedManual=c;
 try{localStorage.setItem(STORAGE,c)}catch(_){}
 try{var u=new URL(location.href);u.searchParams.set("lang",c);history.replaceState(history.state,"",u.pathname+u.search+u.hash)}catch(_){}
 render();
}
function init(){
 controls=setupBar();if(!controls)return;
 render();
 fetch("/assets/q-legacy-locales-v1.json?v=20261106-batch1",{cache:"no-store",credentials:"same-origin"})
  .then(function(r){if(!r.ok)throw Error("Q legacy locale HTTP "+r.status);return r.json()})
  .then(function(j){if(j.schemaVersion!==1||!j.pages||!Array.isArray(j.languages)||CODES.some(function(c){return j.languages.indexOf(c)<0}))throw Error("Invalid Q locale registry");manifest=j;render()})
  .catch(function(e){console.warn("[Q locales] original preserved",e);manifest=null;render()});
 window.addEventListener("popstate",render);
 window.addEventListener("storage",function(e){if(e.key===STORAGE&&!selectedManual)render()});
 window.addEventListener("dar-adult-locale-changed",function(e){var c=norm(e.detail&&e.detail.locale);if(c)choose(c)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);