/* DĀR AL TAWḤĪD · Universal non-Q learning fallback.
 * Four recall cards sourced directly from the approved nine-language pack.
 * No invented distractors or unverified scholar statements. Existing women
 * entries continue using their original 4-question multiple-choice quiz. */
(function(w,d){
"use strict";
if(w.__DAR_NONQ_LEARNING_V1)return;w.__DAR_NONQ_LEARNING_V1=true;
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var LANG={de:"Deutsch",ar:"العربية",en:"English",tr:"Türkçe",ku:"Kurmancî",ckb:"سۆرانی",bs:"Bosanski",fr:"Français",es:"Español"};
var LABEL={
de:{brand:"Beitrag verstehen",lang:"Sprache",intro:"Vier Fragen. Denke zuerst über die Aussage nach und zeige dann die belegte Antwort an.",step:"Frage",of:"von",show:"Antwort anzeigen",answer:"Belegte Antwort",next:"Nächste Frage",done:"Noch einmal lernen",back:"Zum vollständigen Beitrag",source:"Originalquelle öffnen",missing:"Dieser Beitrag ist noch nicht freigegeben.",error:"Lerninhalt konnte nicht geladen werden.",questions:["Welche Begebenheit ist hier überliefert?","Was sagt der Bericht im Einzelnen?","Welche Lehre wird aus dieser Überlieferung gezogen?","Wie wird der Text belegnah erklärt?"]},
ar:{brand:"فهم المقال",lang:"اللغة",intro:"أربع أسئلة. فكّر أولًا ثم اعرض الجواب المستند إلى النص.",step:"السؤال",of:"من",show:"إظهار الجواب",answer:"الجواب الموثق",next:"السؤال التالي",done:"إعادة التعلّم",back:"العودة إلى المقال كاملًا",source:"فتح المصدر الأصلي",missing:"لم تتم الموافقة على نشر هذا المقال.",error:"تعذّر تحميل مادة التعلّم.",questions:["ما الواقعة المذكورة في هذه الرواية؟","ماذا ورد في نص الرواية بالتفصيل؟","ما الفائدة المستنبطة من هذا الخبر؟","كيف يفسّر النص في حدود ما ثبت؟"]},
en:{brand:"Understand the report",lang:"Language",intro:"Four questions. Think about the report, then reveal the source-grounded answer.",step:"Question",of:"of",show:"Reveal answer",answer:"Source-based answer",next:"Next question",done:"Study again",back:"Return to full article",source:"Open original source",missing:"This article has not been approved.",error:"Learning content is unavailable.",questions:["Which event is reported?","What does the report state?","What lesson follows from this report?","What explanation remains supported by the source?"]},
tr:{brand:"Rivayeti anla",lang:"Dil",intro:"Dört soru. Önce düşün, sonra kaynaklı cevabı göster.",step:"Soru",of:"/",show:"Cevabı göster",answer:"Kaynağa dayalı cevap",next:"Sonraki soru",done:"Yeniden öğren",back:"Yazının tamamına dön",source:"Asıl kaynağı aç",missing:"Bu yazı henüz onaylanmadı.",error:"Öğrenme içeriği yüklenemedi.",questions:["Bu rivayette hangi olay aktarılmaktadır?","Rivayette ayrıntılı olarak ne anlatılır?","Bu rivayetten hangi ders çıkarılır?","Kaynağın sınırları içinde hangi açıklama yapılır?"]},
ku:{brand:"Rivayetê fêm bike",lang:"Ziman",intro:"Çar pirs. Berî bersivê bifikire, paşê bersiva çavkanîdar bibîne.",step:"Pirs",of:"ji",show:"Bersivê nîşan bide",answer:"Bersiva çavkanîdar",next:"Pirsê din",done:"Dîsa fêr bibe",back:"Vegere nivîsa tevahî",source:"Çavkaniya eslî veke",missing:"Ev nivîs hê nehatiye pejirandin.",error:"Naveroka fêrbûnê nehate barkirin.",questions:["Di vê rivayetê de kîjan bûyer heye?","Rivayet bi berfirehî çi dibêje?","Ji vê rivayetê kîjan ders tê girtin?","Kîjan ravekirin bi çavkaniyê re li hev tê?"]},
ckb:{brand:"تێگەیشتن لە ڕیوایەت",lang:"زمان",intro:"چوار پرسیار. سەرەتا بیر بکەرەوە، پاشان وەڵامی پشتبەستوو بە سەرچاوە ببینە.",step:"پرسیار",of:"لە",show:"نیشاندانی وەڵام",answer:"وەڵامی بەڵگەدار",next:"پرسیاری داهاتوو",done:"دووبارە فێربە",back:"گەڕانەوە بۆ بابەتی تەواو",source:"کردنەوەی سەرچاوە",missing:"ئەم بابەتە هێشتا پەسەند نەکراوە.",error:"ناوەڕۆکی فێربوون بارنەکرا.",questions:["کام ڕووداو لەم ڕیوایەتەدا هاتووە؟","دەقی ڕیوایەتەکە بە وردی چی دەڵێت؟","کام وانە لەم ڕیوایەتە وەردەگیرێت؟","کام ڕوونکردنەوە پشتبەستوو بە سەرچاوەیە؟"]},
bs:{brand:"Razumijevanje predaje",lang:"Jezik",intro:"Četiri pitanja. Najprije razmisli, zatim otkrij odgovor utemeljen na izvoru.",step:"Pitanje",of:"od",show:"Prikaži odgovor",answer:"Potvrđeni odgovor",next:"Sljedeće pitanje",done:"Uči ponovo",back:"Vrati se cijelom članku",source:"Otvori izvorni dokaz",missing:"Članak još nije odobren.",error:"Nije moguće učitati lekciju.",questions:["Koji događaj se prenosi u predaji?","Šta se u predaji detaljno navodi?","Koja pouka proizlazi iz predaje?","Koje objašnjenje ostaje u okviru izvora?"]},
fr:{brand:"Comprendre le récit",lang:"Langue",intro:"Quatre questions. Réfléchissez avant de révéler la réponse fondée sur la source.",step:"Question",of:"sur",show:"Afficher la réponse",answer:"Réponse fondée sur la source",next:"Question suivante",done:"Réviser",back:"Retour à l’article complet",source:"Ouvrir la source originale",missing:"Cet article n’est pas encore approuvé.",error:"Impossible de charger la leçon.",questions:["Quel événement est relaté ?","Que dit exactement le récit ?","Quel enseignement peut-on en tirer ?","Quelle explication est étayée par la source ?"]},
es:{brand:"Comprender el relato",lang:"Idioma",intro:"Cuatro preguntas. Reflexiona primero y después revela la respuesta sustentada por la fuente.",step:"Pregunta",of:"de",show:"Mostrar respuesta",answer:"Respuesta fundamentada",next:"Siguiente pregunta",done:"Volver a aprender",back:"Volver al artículo completo",source:"Abrir fuente original",missing:"Este artículo aún no está aprobado.",error:"No se pudo cargar la lección.",questions:["¿Qué acontecimiento se transmite?","¿Qué dice exactamente el relato?","¿Qué enseñanza se extrae del relato?","¿Qué explicación está respaldada por la fuente?"]}
};
var root=d.getElementById("darNonQCourse");if(!root)return;
function el(tag,cl,value){var v=d.createElement(tag);if(cl)v.className=cl;if(value!=null)v.textContent=String(value);return v}
function query(){return new URL(w.location.href).searchParams}
function norm(code){code=String(code||"").toLowerCase().replace(/_/g,"-");if(code==="ku-sorani")code="ckb";if(code==="kr")code="ku";return CODES.includes(code)?code:CODES.includes(code.split("-")[0])?code.split("-")[0]:"de"}
var id=String(query().get("id")||""),type=String(query().get("type")||"frauen");
var code=norm(query().get("lang")||"de"),lab=LABEL[code];
d.documentElement.lang=code;d.documentElement.dir=code==="ar"||code==="ckb"?"rtl":"ltr";
function articleUrl(){var from=query().get("from");return "/wissen/beitrag/?id="+encodeURIComponent(id)+"&lang="+code+(type==="frauen"?"":"&type="+encodeURIComponent(type))+(from==="test"||from==="pwa"?"&from="+from:"")}
function message(text){root.replaceChildren(el("p","dar-post-error",text));root.setAttribute("aria-busy","false")}
async function json(url){var r=await w.fetch(url,{cache:"no-store",credentials:"same-origin"});if(!r.ok)throw Error("HTTP "+r.status);return r.json()}
function selector(){
 var box=el("div","dar-post-controls");var l=el("label","",lab.lang);
 var select=el("select","dar-post-lang-select");select.id="darStudyLang";l.htmlFor=select.id;
 for(const k of CODES){var opt=el("option","",LANG[k]);opt.value=k;opt.selected=k===code;select.appendChild(opt)}
 select.addEventListener("change",function(){var u=new URL(w.location.href);u.searchParams.set("lang",select.value);w.location.assign(u.toString())});
 box.appendChild(l);box.appendChild(select);return box
}
function start(pack,sourceUrl){
 var stage=0,answers=[pack.preview,pack.statement,pack.lesson,pack.sharh];
 root.setAttribute("data-canonical-content-id",id);
 root.setAttribute("data-reader-locale",code);
 root.setAttribute("aria-busy","false");
 function render(){
  root.replaceChildren();
  var hero=el("header","dar-post-hero");
  hero.appendChild(el("div","dar-post-mark","DĀR AL TAWḤĪD"));
  hero.appendChild(el("span","dar-post-kicker",lab.brand));
  hero.appendChild(el("h1","dar-post-title",pack.title));
  hero.appendChild(el("p","dar-post-summary",lab.intro));
  root.appendChild(hero);root.appendChild(selector());
  var card=el("section","dar-study-card");
  card.appendChild(el("p","dar-study-step",lab.step+" "+(stage+1)+" "+lab.of+" "+answers.length));
  var progress=el("div","dar-study-progress");progress.setAttribute("aria-hidden","true");
  for(var i=0;i<answers.length;i++){var bar=el("span");if(i<=stage)bar.className="active";progress.appendChild(bar)}
  card.appendChild(progress);
  card.appendChild(el("h2","dar-study-question",lab.questions[stage]));
  var show=el("button","dar-study-show",lab.show);show.type="button";
  var answer=el("div","dar-study-answer");answer.hidden=true;
  answer.appendChild(el("h3","",lab.answer));answer.appendChild(el("p","",answers[stage]));
  var next=el("button","dar-study-next",stage===answers.length-1?lab.done:lab.next);
  next.type="button";next.hidden=true;
  show.addEventListener("click",function(){answer.hidden=false;next.hidden=false;show.hidden=true});
  next.addEventListener("click",function(){stage=(stage+1)%answers.length;render()});
  card.appendChild(show);card.appendChild(answer);card.appendChild(next);
  var controls=el("div","dar-study-controls");
  var back=el("a","",lab.back);back.href=articleUrl();
  var source=el("a","",lab.source);source.href=sourceUrl;source.target="_blank";source.rel="noopener noreferrer";
  controls.appendChild(back);controls.appendChild(source);
  card.appendChild(controls);root.appendChild(card);
 }
 render()
}
(async function(){
 if(!/^[a-z0-9-]{3,160}$/.test(id)||!/^[a-z0-9-]+$/.test(type)){message(lab.missing);return}
 try{
  var registry=await json("/assets/beitrag/reader-catalogs-v1.json?v=1"),kind=registry.catalogs?.[type];
  if(!kind||!kind.sourceFiles||!kind.localeCatalogUrl){message(lab.missing);return}
  var catalog=await json(kind.localeCatalogUrl+"?reader=1"),entry=catalog.entries?.[id];
  if(!entry||!catalog.entryIds?.includes(id)||!kind.sourceFiles[entry.area]||
     CODES.some(c=>{var p=entry.locales?.[c];return !p||!["title","preview","statement","lesson","sharh"].every(k=>p[k]?.trim())})){message(lab.missing);return}
  var source=await json(kind.sourceFiles[entry.area]+"?reader=1");
  var rows=source.eintraege?.filter(x=>x.kennung===id)||[];
  if(rows.length!==1||rows[0].quellenstatus!=="geprueft"||rows[0].freigabeDurchSerhat!==true||
     rows[0].direktnachweisUrl!==entry.sourceUrl){message(lab.missing);return}
  start(entry.locales[code],entry.sourceUrl)
 }catch(e){try{console.warn("Non-Q study",e)}catch(_){}
  message(lab.error)}
})();
})(window,document);
