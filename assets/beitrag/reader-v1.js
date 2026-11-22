/* DĀR AL TAWḤĪD · Universal canonical post reader WITHOUT Q-number.
 * The URL uses the source system's existing canonical article ID.
 * Nine complete locale texts, the original source, original editorial
 * explanation and the existing language-aware learning module.
 * All data read from a verified original entry; no duplicate article text.
 */
(function(w,d){
"use strict";
if(w.__DAR_NONQ_READER_V1)return;
w.__DAR_NONQ_READER_V1=true;
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var NAMES={de:"Deutsch",ar:"العربية",en:"English",tr:"Türkçe",ku:"Kurmancî",ckb:"سۆرانی",bs:"Bosanski",fr:"Français",es:"Español"};
var UI={
de:{brand:"WISSEN · BEITRAG",reading:"Beitrag lesen",lang:"Sprache auswählen",languageStatus:"Alle neun Sprachfassungen verfügbar",reported:"Die überlieferte Aussage",explanation:"Erklärung zum Bericht",explanationType:"Belegnahe redaktionelle Erläuterung · kein zugeschriebenes Gelehrtenzitat",lesson:"Lehre und Nutzen",source:"Originalquelle und Nachweis",sourceGo:"Originalquelle öffnen",learn:"Lernbereich",learnHelp:"Vertiefe dein Verständnis mit den vier Fragen zu diesem Beitrag. Die Inhalte stehen auch dort in neun Sprachen bereit.",learnGo:"Zum Lernbereich · 4 Fragen",back:"Zur Beitragsübersicht",excerpt:"Kurzer arabischer Originalauszug",excerptNote:"Nur Auszug, nicht der vollständige arabische Ḥadīṯ",unavailable:"Dieser Beitrag ist noch nicht freigegeben oder nicht vollständig in neun Sprachen vorhanden.",failed:"Der Beitrag kann momentan nicht geladen werden.",footer:"Aussage, Erklärung, Lehre und Quelle stammen aus derselben geprüften Beitragskennung."},
ar:{brand:"المعرفة · المقال",reading:"قراءة المقال",lang:"اختر اللغة",languageStatus:"متاح بتسع لغات",reported:"نص الرواية",explanation:"شرح الرواية",explanationType:"توضيح تحريري مرتبط بالمصدر، وليس اقتباسًا من عالم",lesson:"الفائدة المستنبطة",source:"المصدر الأصلي والدليل",sourceGo:"فتح المصدر الأصلي",learn:"قسم التعلّم",learnHelp:"أربع أسئلة لفهم هذه الرواية، متاحة باللغات التسع.",learnGo:"التعلّم · ٤ أسئلة",back:"العودة إلى المقالات",excerpt:"مقتطف عربي من الرواية",excerptNote:"هذا مقتطف فقط وليس متن الحديث كاملًا",unavailable:"هذا المقال غير معتمد للنشر أو تنقصه بعض اللغات.",failed:"تعذّر تحميل المقال.",footer:"الرواية والشرح والفائدة والمصدر مرتبطة بمعرّف واحد موثق."},
en:{brand:"KNOWLEDGE · ARTICLE",reading:"Read article",lang:"Select language",languageStatus:"Available in nine languages",reported:"The reported statement",explanation:"Explanation of the report",explanationType:"Source-grounded editorial explanation · not attributed to a classical scholar",lesson:"Lesson and benefit",source:"Original source and evidence",sourceGo:"Open original source",learn:"Learning section",learnHelp:"Deepen your understanding with four questions about this report, available in all nine languages.",learnGo:"Learning · 4 questions",back:"Back to articles",excerpt:"Short original Arabic excerpt",excerptNote:"A short excerpt, not the complete Arabic ḥadīth",unavailable:"This report is not approved for publication or lacks nine complete translations.",failed:"This article could not be loaded.",footer:"The report, explanation, lesson and source share one verified article identifier."},
tr:{brand:"İLİM · YAZI",reading:"Yazıyı oku",lang:"Dil seç",languageStatus:"Dokuz dilde mevcut",reported:"Aktarılan rivayet",explanation:"Rivayetin açıklaması",explanationType:"Kaynağa dayanan editoryal açıklama · âlim sözü olarak sunulmaz",lesson:"Ders ve fayda",source:"Asıl kaynak ve delil",sourceGo:"Asıl kaynağı aç",learn:"Öğrenme bölümü",learnHelp:"Dokuz dilde mevcut dört soruyla bu rivayeti daha iyi öğren.",learnGo:"Öğren · 4 soru",back:"Yazılara dön",excerpt:"Arapça asıl metinden kısa alıntı",excerptNote:"Tam Arapça hadis metni değildir",unavailable:"Bu yazı henüz onaylanmadı veya dokuz dilde tamamlanmadı.",failed:"Yazı yüklenemedi.",footer:"Rivayet, açıklama, ders ve kaynak aynı doğrulanmış yazıya bağlıdır."},
ku:{brand:"ZANÎN · NIVÎS",reading:"Nivîsê bixwîne",lang:"Ziman hilbijêre",languageStatus:"Di neh zimanan de heye",reported:"Rivayeta hatiye neqilkirin",explanation:"Ravekirina rivayetê",explanationType:"Ravekirina edîtorî ku li ser çavkaniyê ye · ne gotina alimê kevn",lesson:"Ders û sûd",source:"Çavkaniya bingehîn û delîl",sourceGo:"Çavkaniyê veke",learn:"Beşa fêrbûnê",learnHelp:"Bi çar pirsan vê rivayetê fêr bibe; hemû neh ziman hene.",learnGo:"Fêrbûn · 4 pirs",back:"Vegere nivîsan",excerpt:"Parçeyeke kurt a Erebî",excerptNote:"Tenê parçeyek e, ne hemû metna hadîsê",unavailable:"Ev nivîs nehatiye pejirandin an jî wergerên neh zimanan ne temam in.",failed:"Nivîs nehate barkirin.",footer:"Rivayet, ravekirin, ders û çavkanî bi heman nasnameya nivîsê ve girêdayî ne."},
ckb:{brand:"زانست · بابەت",reading:"خوێندنەوەی بابەت",lang:"هەڵبژاردنی زمان",languageStatus:"بە نۆ زمان بەردەستە",reported:"دەقی ڕیوایەت",explanation:"ڕوونکردنەوەی ڕیوایەت",explanationType:"ڕوونکردنەوەی دەستکاریکراو بە پشتبەستن بە سەرچاوە، نەک وتەی زانایەکی کۆن",lesson:"وانە و سوود",source:"سەرچاوەی ڕەسەن و بەڵگە",sourceGo:"کردنەوەی سەرچاوە",learn:"بەشی فێربوون",learnHelp:"بە چوار پرسیار تێگەیشتنت قووڵ بکەرەوە؛ بە هەموو نۆ زمانەکە.",learnGo:"فێربوون · ٤ پرسیار",back:"گەڕانەوە بۆ بابەتەکان",excerpt:"بڕگەیەکی کورتی عەرەبی",excerptNote:"تەنها بڕگەیەکە، نەک تەواوی دەقی حەدیس",unavailable:"ئەم بابەتە پەسەند نەکراوە یان وەرگێڕانی نۆ زمانەکەی تەواو نییە.",failed:"بابەت بار نەکرا.",footer:"ڕیوایەت و ڕوونکردنەوە و وانە و سەرچاوە لە هەمان ناسنامەی بابەتەوەن."},
bs:{brand:"ZNANJE · ČLANAK",reading:"Pročitaj članak",lang:"Izaberi jezik",languageStatus:"Dostupno na devet jezika",reported:"Preneseni izvještaj",explanation:"Objašnjenje predaje",explanationType:"Uredničko objašnjenje utemeljeno na izvoru · nije citat klasičnog učenjaka",lesson:"Pouka i korist",source:"Izvor i dokaz",sourceGo:"Otvori izvorni dokaz",learn:"Odjel za učenje",learnHelp:"Produbi razumijevanje kroz četiri pitanja dostupna na svih devet jezika.",learnGo:"Učenje · 4 pitanja",back:"Nazad na članke",excerpt:"Kratak arapski izvornik",excerptNote:"Samo odlomak, ne cijeli arapski hadis",unavailable:"Članak nije odobren ili prevodi na devet jezika nisu potpuni.",failed:"Članak se ne može učitati.",footer:"Predaja, objašnjenje, pouka i izvor vezani su za jednu potvrđenu oznaku članka."},
fr:{brand:"SAVOIR · ARTICLE",reading:"Lire l’article",lang:"Choisir la langue",languageStatus:"Disponible en neuf langues",reported:"Le récit transmis",explanation:"Explication du récit",explanationType:"Explication éditoriale fondée sur la source, non attribuée à un savant classique",lesson:"Enseignement et bénéfice",source:"Source originale et preuve",sourceGo:"Ouvrir la source originale",learn:"Espace d’apprentissage",learnHelp:"Approfondissez ce récit avec quatre questions disponibles dans les neuf langues.",learnGo:"Apprendre · 4 questions",back:"Retour aux articles",excerpt:"Court extrait arabe original",excerptNote:"Extrait seulement, et non le ḥadīth arabe complet",unavailable:"Cet article n’est pas approuvé ou ses neuf traductions sont incomplètes.",failed:"Impossible de charger cet article.",footer:"Le récit, l’explication, la leçon et la source partagent le même identifiant vérifié."},
es:{brand:"CONOCIMIENTO · ARTÍCULO",reading:"Leer artículo",lang:"Seleccionar idioma",languageStatus:"Disponible en nueve idiomas",reported:"El relato transmitido",explanation:"Explicación del relato",explanationType:"Explicación editorial basada en la fuente · no es una cita de un erudito clásico",lesson:"Enseñanza y beneficio",source:"Fuente original y evidencia",sourceGo:"Abrir fuente original",learn:"Área de aprendizaje",learnHelp:"Profundiza con cuatro preguntas disponibles en los nueve idiomas.",learnGo:"Aprender · 4 preguntas",back:"Volver a los artículos",excerpt:"Breve extracto árabe original",excerptNote:"Solo un extracto, no el ḥadīth árabe completo",unavailable:"Este artículo no está aprobado o sus nueve traducciones están incompletas.",failed:"No se pudo cargar el artículo.",footer:"El relato, la explicación, la enseñanza y la fuente comparten un solo identificador verificado."}
};
var root=d.getElementById("darNonQReader");if(!root)return;
function norm(x){x=String(x||"").trim().toLowerCase().replace(/_/g,"-");if(x==="kr")x="ku";if(x==="ku-sorani")x="ckb";if(CODES.includes(x))return x;var p=x.split("-")[0];return CODES.includes(p)?p:"de"}
function params(){return new URL(w.location.href).searchParams}
function chosen(){var q=params().get("lang");if(q)return norm(q);try{return norm(w.localStorage.getItem("darAdultPreferredLocaleV1"))}catch(_){return "de"}}
function elt(tag,cl,value){var v=d.createElement(tag);if(cl)v.className=cl;if(value!=null)v.textContent=String(value);return v}
function append(parent){for(var i=1;i<arguments.length;i++)parent.appendChild(arguments[i]);return parent}
function h(tag,text){return elt(tag,"",text)}
function origin(){var v=params().get("from");return v==="test"||v==="pwa"?v:""}
function pathFor(id,code,type){return "/wissen/beitrag/?id="+encodeURIComponent(id)+"&lang="+encodeURIComponent(code)+(type==="frauen"?"":"&type="+encodeURIComponent(type))+(origin()?"&from="+origin():"")}
function backUrl(type){var from=origin();if(from==="test")return type==="frauen"?"/test/#frauen":"/test/#home";if(from==="pwa")return type==="frauen"?"/pwa/?pwa=1#frauen":"/pwa/?pwa=1#home";var native=/DarAlTawhid-iOS|DarAlTawhidOfficialIOS|DarAlTawhidAndroid/i.test(navigator.userAgent);if(native)return type==="frauen"?"/?native_ios=1#frauen":"/?native_ios=1#home";return type==="frauen"?"/?page=frauen":"/"}
async function readJson(url){var r=await fetch(url,{cache:"no-store",credentials:"same-origin"});if(!r.ok)throw Error("HTTP "+r.status+" "+url);return r.json()}
function showError(str){root.replaceChildren(elt("p","dar-post-error",str));root.setAttribute("aria-busy","false")}
function section(n,label,value,style){
 if(typeof value!=="string"||!value.trim())return null;
 var el=elt("section","dar-post-section"+(style?" "+style:""));
 var heading=elt("header","dar-post-section-head");
 append(heading,elt("span","dar-post-number",String(n).padStart(2,"0")),elt("h2","",label));
 append(el,heading,elt("p","dar-post-body",value));return el
}
function validUrl(u){try{var x=new URL(u);return x.protocol==="https:"&&!!x.hostname}catch(_){return false}}
function languageSelect(code,id,type,t){
 var header=elt("div","dar-post-controls");
 var controls=elt("div","dar-post-langs");var label=elt("label","",t.lang);
 var select=elt("select","dar-post-lang-select");select.id="darPostLangSelect";label.htmlFor=select.id;
 for(const c of CODES){var o=elt("option","",NAMES[c]);o.value=c;o.selected=c===code;select.appendChild(o)}
 select.addEventListener("change",function(){w.location.assign(pathFor(id,norm(select.value),type))});
 controls.appendChild(label);controls.appendChild(select);
 controls.appendChild(elt("small","dar-post-language-status",t.languageStatus));
 var back=elt("a","dar-post-back",t.back);back.href=backUrl(type);
 header.appendChild(controls);header.appendChild(back);return header
}
function render(original,entry,pack,code,id,type,kind){
 var t=UI[code];d.documentElement.lang=code;d.documentElement.dir=code==="ar"||code==="ckb"?"rtl":"ltr";
 d.title=pack.title+" · DĀR AL TAWḤĪD";
 var frag=d.createDocumentFragment();
 var hero=elt("header","dar-post-hero");hero.lang=code;hero.dir=d.documentElement.dir;
 append(hero,elt("div","dar-post-mark","DĀR AL TAWḤĪD"),
 elt("span","dar-post-kicker",t.brand),
 elt("h1","dar-post-title",pack.title),
 elt("p","dar-post-summary",pack.preview||pack.statement));
 frag.appendChild(hero);
 frag.appendChild(languageSelect(code,id,type,t));
 var block=section(1,pack.labels?.statement||t.reported,pack.statement);
 if(block)frag.appendChild(block);
 if(original.arabischerOriginalauszug&&original.arabischerOriginalauszugNachweis===entry.sourceUrl
   &&String(original.arabischerOriginalauszugStatus||"").includes("abgeglichen")){
  var excerpt=section(2,t.excerpt,original.arabischerOriginalauszug);
  if(excerpt){excerpt.querySelector(".dar-post-body").classList.add("dar-post-arabic");
   excerpt.querySelector(".dar-post-body").lang="ar";excerpt.querySelector(".dar-post-body").dir="rtl";
   excerpt.appendChild(elt("p","dar-post-editorial-label",t.excerptNote));frag.appendChild(excerpt)}
 }
 block=section(3,t.explanation,pack.sharh,"dar-post-section--explanation");
 if(block){block.appendChild(elt("p","dar-post-editorial-label",t.explanationType));frag.appendChild(block)}
 block=section(4,pack.labels?.lesson||t.lesson,pack.lesson);
 if(block)frag.appendChild(block);
 var source=section(5,pack.labels?.source||t.source,pack.source);
 if(source){
  var anchor=elt("a","dar-post-source-link",t.sourceGo);anchor.href=entry.sourceUrl;anchor.target="_blank";anchor.rel="noopener noreferrer";anchor.referrerPolicy="no-referrer";
  source.appendChild(anchor);frag.appendChild(source)
 }
 var learning=elt("section","dar-post-learning");append(learning,elt("h2","",t.learn),elt("p","",t.learnHelp));
 var l=elt("a","dar-post-learning-link",t.learnGo);
 l.href=kind.learningUrl+"?id="+encodeURIComponent(id)+"&lang="+encodeURIComponent(code)+(type==="frauen"?"":"&type="+encodeURIComponent(type))+(origin()?"&from="+origin():"");
 learning.appendChild(l);frag.appendChild(learning);
 frag.appendChild(elt("p","dar-post-footer",t.footer));
 root.replaceChildren(frag);root.setAttribute("aria-busy","false");
 root.setAttribute("data-canonical-content-id",id);
 root.setAttribute("data-canonical-content-type",type);
 root.setAttribute("data-reader-locale",code);
}
async function load(){
 var code=chosen(),t=UI[code],id=String(params().get("id")||"").trim();
 var type=String(params().get("type")||"frauen").trim();
 if(!/^[a-z0-9-]{3,160}$/.test(id)||!/^[a-z0-9-]+$/.test(type)){showError(t.unavailable);return}
 try{
  var registry=await readJson("/assets/beitrag/reader-catalogs-v1.json?v=1");
  var kind=registry.catalogs?.[type],required=kind?.requiredLocales;
  if(!kind||!Array.isArray(required)||CODES.some(c=>!required.includes(c))||
     !/^\/lernen\/[a-z0-9/-]+\/$/.test(kind.learningUrl)){showError(t.unavailable);return}
  var catalog=await readJson(kind.localeCatalogUrl+"?reader=1");
  var entry=catalog.entries?.[id];
  if(!entry||entry.id!==id||!catalog.entryIds?.includes(id)||!kind.sourceFiles?.[entry.area]||
     !validUrl(entry.sourceUrl)||CODES.some(c=>{
      var p=entry.locales?.[c];return !p||["title","statement","preview","sharh","lesson","source"].some(k=>typeof p[k]!=="string"||!p[k].trim())
     })){showError(t.unavailable);return}
  var doc=await readJson(kind.sourceFiles[entry.area]+"?reader=1");
  var found=doc.eintraege?.filter(x=>x.kennung===id)||[];
  if(found.length!==1||found[0].quellenstatus!=="geprueft"||found[0].freigabeDurchSerhat!==true||
     found[0].direktnachweisUrl!==entry.sourceUrl||
     (found[0].contentId&&found[0].contentId!==id)||
     (found[0].localeCatalogId&&found[0].localeCatalogId!==id)){showError(t.unavailable);return}
  render(found[0],entry,entry.locales[code],code,id,type,kind);
 }catch(error){try{console.warn("Canonical non-Q reader failed",error)}catch(_){}
  showError(t.failed)}
}
load();
})(window,document);
