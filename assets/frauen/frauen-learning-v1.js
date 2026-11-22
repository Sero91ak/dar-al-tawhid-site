/* DĀR AL TAWḤĪD · FRAUEN LERNBEREICH 16 · v1
 * Four source-grounded comprehension questions per canonical article, nine
 * complete languages, internal /lernen/ route; NO invented Q-number.
 * Fails closed: a hidden or unapproved source article cannot be studied.
 */
(function(global){
"use strict";
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var FILES={sahabiyyat:"/data/frauen-sahabiyyat.json","muetter-der-glaeubigen":"/data/frauen-muetter-der-glaeubigen.json",fiqh:"/data/frauen-fiqh.json"};
var L={
de:{brand:"Lernbereich · Frauenwissen",status:"Verstehen statt auswendig raten",number:"Frage",of:"von",next:"Weiter",finish:"Ergebnis ansehen",again:"Erneut lernen",right:"Richtig.",wrong:"Noch nicht richtig.",source:"Originalquelle öffnen",back:"Beitrag in der App öffnen",ready:"Die zugehörige Quelle ist noch nicht freigegeben.",failed:"Der Lerninhalt konnte nicht geladen werden.",score:"Richtige Antworten",loading:"Lernbereich wird geladen…",questions:["Welche Begebenheit ist in diesem Bericht überliefert?","Welche Aussage gibt den überlieferten Inhalt zutreffend wieder?","Welche Lehre gehört zu dieser Überlieferung?","Welche Erklärung bleibt innerhalb des nachgewiesenen Inhalts?"]},
ar:{brand:"التعلّم · معرفة النساء",status:"فهم النصوص لا التخمين",number:"السؤال",of:"من",next:"التالي",finish:"عرض النتيجة",again:"إعادة التعلّم",right:"إجابة صحيحة.",wrong:"ليست الإجابة الصحيحة.",source:"فتح المصدر الأصلي",back:"فتح المقال في التطبيق",ready:"لم تتم الموافقة على هذا النص للنشر بعد.",failed:"تعذّر تحميل مادة التعلّم.",score:"الإجابات الصحيحة",loading:"يُحمَّل قسم التعلّم…",questions:["أي واقعة وردت في هذه الرواية؟","أي عبارة توافق مضمون الرواية؟","ما الفائدة المرتبطة بهذه الرواية؟","أي شرح يلتزم بالمضمون الثابت في المصدر؟"]},
en:{brand:"Learning · Women's knowledge",status:"Understand the report",number:"Question",of:"of",next:"Next",finish:"See results",again:"Study again",right:"Correct.",wrong:"Not quite.",source:"Open original source",back:"Open article in app",ready:"This source article has not been approved for publication.",failed:"The learning content could not be loaded.",score:"Correct answers",loading:"Loading learning area…",questions:["Which event is reported here?","Which account matches the transmitted report?","Which lesson belongs to this narration?","Which explanation stays within the verified report?"]},
tr:{brand:"Öğrenme · Kadınlar hakkında bilgi",status:"Rivayeti anlayarak öğren",number:"Soru",of:"/",next:"İleri",finish:"Sonucu gör",again:"Yeniden öğren",right:"Doğru.",wrong:"Henüz doğru değil.",source:"Asıl kaynağı aç",back:"Uygulamada içeriği aç",ready:"Bu rivayet henüz yayın için onaylanmadı.",failed:"Öğrenme içeriği yüklenemedi.",score:"Doğru cevaplar",loading:"Öğrenme bölümü yükleniyor…",questions:["Bu rivayette hangi olay anlatılmaktadır?","Hangi ifade nakledilen olaya uygundur?","Bu rivayetten hangi ders çıkarılır?","Hangi açıklama kaynakta sabit olan sınırlar içinde kalır?"]},
ku:{brand:"Fêrbûn · Zanîna jinan",status:"Rivayetê bi têgihiştinê fêr bibin",number:"Pirs",of:"ji",next:"Pêşve",finish:"Encamê bibîne",again:"Dîsa fêr bibe",right:"Rast e.",wrong:"Hê ne rast e.",source:"Çavkaniya eslî veke",back:"Nivîsê di sepanê de veke",ready:"Ev rivayet hê ji bo weşanê nehatiye pejirandin.",failed:"Naveroka fêrbûnê nehate barkirin.",score:"Bersivên rast",loading:"Beşa fêrbûnê tê barkirin…",questions:["Di vê rivayetê de kîjan bûyer hatiye vegotin?","Kîjan gotin bi naveroka rivayetê re li hev tê?","Kîjan fêrgeh ji vê rivayetê tê standin?","Kîjan ravekirin di nav sînorên çavkaniya piştrastkirî de dimîne?"]},
ckb:{brand:"فێربوون · زانیاری ژنان",status:"تێگەیشتن لە ڕیوایەت",number:"پرسیار",of:"لە",next:"دواتر",finish:"بینینی ئەنجام",again:"دووبارە فێربە",right:"ڕاستە.",wrong:"هێشتا ڕاست نییە.",source:"کردنەوەی سەرچاوەی ئەسڵی",back:"کردنەوەی بابەت لە ئەپەکەدا",ready:"ئەم ڕیوایەتە هێشتا بۆ بڵاوکردنەوە پەسەند نەکراوە.",failed:"ناوەڕۆکی فێربوون بارنەکرا.",score:"وەڵامە ڕاستەکان",loading:"بەشی فێربوون بار دەکرێت…",questions:["کام ڕووداو لەم ڕیوایەتەدا هاتووە؟","کام وتە لەگەڵ ناوەڕۆکی ڕیوایەتەکەدا دەگونجێت؟","کام سوود لەم ڕیوایەتەوە وەردەگیرێت؟","کام ڕوونکردنەوە لە سنووری ئەوەی سەلمێنراوە دەمێنێتەوە؟"]},
bs:{brand:"Učenje · Znanje o ženama",status:"Razumjeti predaju",number:"Pitanje",of:"od",next:"Dalje",finish:"Pogledaj rezultat",again:"Uči ponovo",right:"Tačno.",wrong:"Još nije tačno.",source:"Otvori izvorni dokaz",back:"Otvori članak u aplikaciji",ready:"Ova predaja još nije odobrena za objavljivanje.",failed:"Nije moguće učitati sadržaj za učenje.",score:"Tačni odgovori",loading:"Učitavanje lekcije…",questions:["Koji je događaj prenesen u ovoj predaji?","Koja tvrdnja odgovara prenesenom izvještaju?","Koja pouka proizlazi iz ove predaje?","Koje objašnjenje ostaje unutar potvrđenog sadržaja?"]},
fr:{brand:"Apprendre · Savoir des femmes",status:"Comprendre la transmission",number:"Question",of:"sur",next:"Suivant",finish:"Voir le résultat",again:"Recommencer",right:"Correct.",wrong:"Ce n'est pas encore correct.",source:"Ouvrir la source originale",back:"Ouvrir l'article dans l'application",ready:"Cette transmission n'est pas encore autorisée à la publication.",failed:"Le contenu pédagogique n'a pas pu être chargé.",score:"Réponses correctes",loading:"Chargement du module…",questions:["Quel événement est rapporté dans cette transmission ?","Quel récit correspond au texte transmis ?","Quelle leçon appartient à cette transmission ?","Quelle explication reste fidèle au contenu établi ?"]},
es:{brand:"Aprender · Conocimiento de las mujeres",status:"Comprender la narración",number:"Pregunta",of:"de",next:"Siguiente",finish:"Ver resultado",again:"Volver a aprender",right:"Correcto.",wrong:"Todavía no es correcto.",source:"Abrir fuente original",back:"Abrir artículo en la aplicación",ready:"Este relato todavía no está aprobado para su publicación.",failed:"No se pudo cargar el contenido de aprendizaje.",score:"Respuestas correctas",loading:"Cargando aprendizaje…",questions:["¿Qué acontecimiento se transmite en este relato?","¿Qué afirmación coincide con el relato transmitido?","¿Qué enseñanza corresponde a esta narración?","¿Qué explicación se mantiene dentro del contenido acreditado?"]}};
function lang(x){x=String(x||"").trim().toLowerCase().replace(/_/g,"-");if(x==="ku-sorani")return"ckb";if(x==="kr")return"ku";if(CODES.indexOf(x)>=0)return x;var k=x.split("-")[0];if(k==="kr")k="ku";return CODES.indexOf(k)>=0?k:"de"}
function firstSentence(s){var t=String(s||"").trim();var match=t.match(/^[^.!?؟。]+[.!?؟。](?=\s|$)/u);return(match?match[0]:t).trim()}
function compact(s){return String(s||"").replace(/\s+/g," ").trim()}
function pickOptions(index,field,packs){
 var entries=packs.filter(Boolean),self=entries[index],c=compact(self[field]);if(!c)throw Error("Empty learning field "+field);
 var wrong=[];for(var k=1;k<entries.length&&wrong.length<2;k++){
   var idx=(index+k)%entries.length; // visit each approved candidate once, even when exactly three are published
   if(idx===index)continue;
   var v=compact(entries[idx][field]);if(v&&v!==c&&!wrong.includes(v))wrong.push(v);
 }
 if(wrong.length!==2)throw Error("Not enough distinct comprehension distractors");
 var options=[c,wrong[0],wrong[1]],rotation=(index+field.length)%3;
 options=options.slice(rotation).concat(options.slice(0,rotation));
 return{options:options,answer:options.indexOf(c)};
}
function questions(id,entryIds,entries,code,approvedIds){
 code=lang(code);
 if(!approvedIds||typeof approvedIds.has!=="function")throw Error("Verified published source cohort required");
 var eligible=entryIds.filter(x=>approvedIds.has(x));
 var idx=eligible.indexOf(id);if(idx<0)throw Error("Canonical article is not approved");
 if(eligible.length<3)throw Error("Not enough verified published entries for a safe quiz");
 var packs=eligible.map(x=>entries[x]&&entries[x].locales&&entries[x].locales[code]);
 if(packs.some(p=>!p||!p.statement||!p.preview||!p.lesson||!p.sharh))throw Error("Incomplete learning locale");
 var fields=["preview","statement","lesson","sharh"],definitions=L[code].questions;
 return fields.map(function(field,n){var opts=pickOptions(idx,field==="statement"?"statementExcerpt":field,
    packs.map(p=>Object.assign({},p,{statementExcerpt:firstSentence(p.statement)})));
   return{question:definitions[n],options:opts.options,answer:opts.answer,explanation:n<2?packs[idx].lesson:packs[idx].sharh,field:field};
 });
}
var api={CODES:CODES,labels:L,lang:lang,questions:questions,sourceFiles:FILES};
if(typeof module==="object"&&module.exports)module.exports=api;
global.DARFrauenLearningV1=api;
})(typeof window!=="undefined"?window:globalThis);

(function(w,d){
"use strict";
if(!d||!d.getElementById)return;
var q=d.getElementById("quiz");if(!q)return;
var api=w.DARFrauenLearningV1;var url;
try{url=new URL(d.baseURI||w.location.href)}catch(e){url=new URL(w.location.href)}
var id=String(url.searchParams.get("id")||"").trim();
var code=api.lang(url.searchParams.get("lang")||((function(){try{return w.localStorage.getItem("darAdultPreferredLocaleV1")}catch(_){return"de"}})()));
var lab=api.labels[code],RTL=code==="ar"||code==="ckb";
d.documentElement.lang=code;d.documentElement.dir=RTL?"rtl":"ltr";
 d.title="DĀR AL TAWḤĪD · "+lab.brand;
function elem(tag,cl,text){var x=d.createElement(tag);if(cl)x.className=cl;if(text!=null)x.textContent=text;return x}
function clear(){q.replaceChildren()}
function message(msg){clear();q.append(elem("p","fw-message",msg))}
function safeJson(response){if(!response.ok)throw Error("HTTP "+response.status);return response.json()}
var entryIds,entries,entry,sourceUrl,sourceStatus,stage=0,correct=0,answered=false,items=[];
function bottomLink(){var a=elem("a","fw-link",lab.back);a.href="/wissen/beitrag/?id="+encodeURIComponent(id)+"&lang="+encodeURIComponent(code);a.target="_top";return a}
var READ_LABELS={
 de:"Die vollständige Aussage erneut lesen",ar:"إعادة قراءة النص الكامل",en:"Read the complete statement again",
 tr:"Tam açıklamayı yeniden oku",ku:"Gotina tevahî dîsa bixwîne",ckb:"دووبارە خوێندنەوەی دەقی تەواو",
 bs:"Ponovo pročitaj cijeli tekst",fr:"Relire le texte complet",es:"Volver a leer el texto completo"
};
var LANG_LABELS={
 de:"Sprache",ar:"اللغة",en:"Language",tr:"Dil",ku:"Ziman",ckb:"زمان",bs:"Jezik",fr:"Langue",es:"Idioma"
};
var LANGUAGE_NAMES={
 de:"Deutsch",ar:"العربية",en:"English",tr:"Türkçe",ku:"Kurmancî",
 ckb:"سۆرانی",bs:"Bosanski",fr:"Français",es:"Español"
};
function languageControl(){
 var wrap=elem("div","fw-language-control"),label=elem("label","",LANG_LABELS[code]);
 var select=elem("select","fw-language-select");select.id="fwReaderLanguage";
 label.htmlFor=select.id;select.setAttribute("aria-label",LANG_LABELS[code]);
 api.CODES.forEach(function(c){var o=elem("option","",LANGUAGE_NAMES[c]);o.value=c;o.selected=c===code;select.append(o)});
 select.addEventListener("change",function(){
  var u=new URL(w.location.href);u.searchParams.set("lang",select.value);
  // Preserve canonical source ID, restart only the learner in chosen locale.
  w.location.assign(u.toString());
 });
 wrap.append(label,select);return wrap
}
function core(){
 clear();q.append(elem("div","fw-brand","DĀR AL TAWḤĪD"),elem("p","fw-overline",lab.brand),elem("h1","fw-title",entry.locales[code].title),elem("p","fw-subtitle",lab.status),languageControl());
 // Optional full reading reference for learning, not a second contribution.
 // The statement, lesson and editorial explanation come from the exact same
 // language pack and original canonical ID as the main women reader.
 var pack=entry.locales[code],labels=pack.labels||{};
 var details=elem("details","fw-reading-reference");
 var summary=elem("summary","fw-reading-toggle",READ_LABELS[code]);
 details.append(summary);
 [["fw-reading-statement",labels.statement,pack.statement],
  ["fw-reading-lesson",labels.lesson,pack.lesson],
  ["fw-reading-sharh",labels.sharh,pack.sharh],
  ["fw-reading-source",labels.source,pack.source]].forEach(function(parts){
   var row=elem("section",parts[0]);
   row.append(elem("h3","fw-reading-label",parts[1]||lab.source),
              elem("p","fw-reading-body",parts[2]));
   details.append(row);
  });
 q.append(details);
}
function render(moveFocus){
 core();
 var item=items[stage];var count=elem("div","fw-count",lab.number+" "+(stage+1)+" "+lab.of+" "+items.length);q.append(count);
 var line=elem("div","fw-progress");for(var i=0;i<items.length;i++){var el=elem("i");el.className=i===stage?"active":i<stage?"done":"";line.append(el)}q.append(line);
 var questionHeading=elem("h2","fw-question",item.question);
 questionHeading.tabIndex=-1;q.append(questionHeading);
 var answers=elem("div","fw-answers"),result=elem("p","fw-feedback");result.setAttribute("aria-live","polite");
 var next=elem("button","fw-next",stage===items.length-1?lab.finish:lab.next);next.type="button";next.disabled=true;
 item.options.forEach(function(option,index){
  var b=elem("button","fw-answer");b.type="button";
  var letter=elem("span","fw-letter",String.fromCharCode(65+index)),txt=elem("span","fw-answer-text",option);
  b.append(letter,txt);b.addEventListener("click",function(){
   if(answered)return;
   answered=true;if(index===item.answer)correct++;
   Array.prototype.forEach.call(answers.children,function(x,j){x.disabled=true;x.setAttribute("data-state",j===item.answer?"correct":j===index?"wrong":"neutral")});
   result.textContent=(index===item.answer?lab.right:lab.wrong)+" "+item.explanation;
   result.setAttribute("data-state",index===item.answer?"correct":"wrong");next.disabled=false;next.focus();
  });answers.append(b)
 });
 q.append(answers,result,next);
 next.addEventListener("click",function(){if(!answered)return;if(stage===items.length-1)finish();else{stage++;answered=false;render(true)}});
 var links=elem("div","fw-links");
 var s=elem("a","fw-link fw-source",lab.source);s.href=sourceUrl;s.target="_blank";s.rel="noopener noreferrer";links.append(s);
 if(w.self===w.top)links.append(bottomLink());
 q.append(links);
 if(moveFocus&&typeof questionHeading.focus==="function")questionHeading.focus();
}
function finish(){
 core();
 var resultHeading=elem("h2","fw-result",lab.score+": "+correct+" / "+items.length);
 resultHeading.tabIndex=-1;q.append(resultHeading);
 var retry=elem("button","fw-next",lab.again);retry.type="button";retry.addEventListener("click",function(){stage=0;correct=0;answered=false;render(true)});q.append(retry);
 var source=elem("a","fw-link fw-source",lab.source);source.href=sourceUrl;source.target="_blank";source.rel="noopener noreferrer";q.append(source);
 if(w.self===w.top)q.append(bottomLink());
 if(typeof resultHeading.focus==="function")resultHeading.focus();
}
(async function(){
 message(lab.loading);
 try{
  if(!/^[a-z0-9-]+$/.test(id))throw Error("Invalid canonical ID");
  var catalog=await w.fetch("/assets/frauen/frauen-entry-locales-v1.json?v=20261118-batch16-learning",{cache:"no-store"}).then(safeJson);
  entry=catalog.entries&&catalog.entries[id];entryIds=catalog.entryIds;entries=catalog.entries;
  if(!entry||!Array.isArray(entryIds)||!entryIds.includes(id)||!entry.locales||!entry.locales[code])throw Error("Article not in locale catalog");
  if(!api.sourceFiles[entry.area])throw Error("Unknown female knowledge area");
  var source=await w.fetch(api.sourceFiles[entry.area]+"?v=20261118-batch16-learning",{cache:"no-store"}).then(safeJson);
  var original=(source.eintraege||[]).filter(e=>e.kennung===id);
  if(original.length!==1||original[0].quellenstatus!=="geprueft"||original[0].freigabeDurchSerhat!==true){
    message(lab.ready);return;
  }
  if(entry.sourceUrl!==original[0].direktnachweisUrl)throw Error("Original source mismatch");
  sourceUrl=entry.sourceUrl;
  // No unpublished article can become a comprehension distractor.
  var verified=new Set();
  var areas=Object.keys(api.sourceFiles);
  var records=await Promise.all(areas.map(function(area){
    return area===entry.area?Promise.resolve(source):w.fetch(api.sourceFiles[area]+"?v=20261118-batch16-learning",{cache:"no-store"}).then(safeJson);
  }));
  records.forEach(function(doc){
    (doc.eintraege||[]).forEach(function(e){
      var loc=entries[e.kennung];
      if(e.quellenstatus==="geprueft"&&e.freigabeDurchSerhat===true&&
         loc&&loc.sourceUrl===e.direktnachweisUrl&&
         loc.id===e.kennung&&e.contentId===e.kennung&&
         e.localeCatalogId===e.kennung)verified.add(e.kennung);
    });
  });
  items=api.questions(id,entryIds,entries,code,verified);
  if(items.length!==4||items.some(x=>x.options.length!==3))throw Error("Incomplete comprehension quiz");
  render();
 }catch(e){try{console.warn("DAR women learning",e)}catch(_){}message(lab.failed)}
})();
})(window,document);
