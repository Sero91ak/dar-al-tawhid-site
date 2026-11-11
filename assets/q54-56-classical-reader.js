/* DĀR AL TAWḤĪD · Classical sources Q54-56, no change to protected push lanes.
 * One canonical Q source per text; unapproved theological translations fall back to German.
 */
(async function(){
 "use strict";
 const root=document.querySelector("[data-dar-classic-source]");
 if(!root)return;
 const q=Number(root.dataset.cardNumber);
 if(![54,55,56].includes(q))return;
 const screen=root.dataset.screen==="lesson"?"lesson":"source";
 const known=["de","ar","en","tr","ku","ckb","bs","fr","es"];
 const names={de:"Deutsch",ar:"العربية",en:"English",tr:"Türkçe",ku:"Kurmancî",ckb:"سۆرانی",bs:"Bosanski",fr:"Français",es:"Español"};
 const notices={
  ar:"لم تُعتمد الترجمة الشرعية بعد؛ يُعرض النص الألماني المراجع.",
  en:"This religious translation has not been approved. The reviewed German text is shown.",
  tr:"Dinî çeviri henüz onaylanmadı. İncelenmiş Almanca metin gösteriliyor.",
  ku:"Wergera dînî hîn nehatiye erêkirin; metna almanî ya kontrolkirî tê nîşandan.",
  ckb:"وەرگێڕانی ئایینی هێشتا پەسەند نەکراوە؛ دەقی ئەڵمانیی پشکنراو پیشان دەدرێت.",
  bs:"Vjerski prijevod još nije odobren. Prikazan je provjereni njemački tekst.",
  fr:"La traduction religieuse n'est pas validée ; le texte allemand vérifié est affiché.",
  es:"La traducción religiosa no está aprobada. Se muestra el texto alemán revisado."
 };
 const t=id=>document.getElementById(id);
 const main=t("darClassicMain");
 let doc;
 try {
  const response=await fetch("/assets/q"+q+"-classical-source.json",{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  doc=await response.json();
  if(doc.qSourceId!==q||doc.contentId!==root.dataset.contentId)throw Error("Quellen-ID stimmt nicht überein");
 }catch(e){main.textContent="Quellendaten nicht verfügbar. "+e.message;return;}
 const hasApproved=code=>doc.approvedLocales.includes(code);
 const getQueryLang=()=>{try{return new URL(location.href).searchParams.get("lang")||""}catch(_){return""}};
 function readLang(){
  const query=getQueryLang();if(known.includes(query))return query;
  try{const cached=localStorage.getItem("darAdultPreferredLocaleV1");if(known.includes(cached))return cached}catch(_){}
  return "de";
 }
 let chosen=readLang(),step=0,score=0,answered=false;
 function setText(id,text){const el=t(id);if(el)el.textContent=text||"";}
 function addBlock(targetId,title,paragraph){
  const el=t(targetId);if(!el)return;el.replaceChildren();
  const h=document.createElement("h3");h.textContent=title;
  const p=document.createElement("p");p.textContent=paragraph;
  el.append(h,p);
 }
 function markLang(el,code){if(!el)return;el.lang=code;el.dir=code==="ar"||code==="ckb"?"rtl":"ltr";}
 function linkTo(page){return page+"?lang="+encodeURIComponent(chosen);}
 function update(){
  const selected=chosen;
  const approved=hasApproved(selected);
  const active=approved?selected:"de";
  const text=doc.locales[active],labels=doc.locales[selected]?.ui||text.ui;
  const rtl=selected==="ar"||selected==="ckb";
  document.documentElement.lang=selected;
  document.documentElement.dir=rtl?"rtl":"ltr";
  root.dir=rtl?"rtl":"ltr";
  setText("darSourceLangLabel",labels.language);
  const picker=t("darSourceLang");if(picker)picker.value=selected;
  setText("darLocaleNotice",approved?"":notices[selected]||"Die Übersetzung ist noch nicht fachlich freigegeben. Die geprüfte deutsche Fassung wird angezeigt.");
  const notice=t("darLocaleNotice");if(notice)notice.hidden=approved;
  if(screen==="source"){
   setText("darSourceQuoteTitle",labels.statement||"Aussage");
   setText("darSourceArabicTitle",labels.original||"Arabischer Originalwortlaut");
   setText("darEvidenceTitle",labels.evidence||"Direkte Quellen");
   setText("darSourceQuoteMeta",({de:"Sinngemäße Übersetzung eines abgegrenzten arabischen Auszugs; das Original bleibt unverändert.",ar:"ترجمة تفسيرية لمقطع عربي محدد؛ ويبقى النص الأصلي كما هو.",en:"Contextual translation of a specific Arabic excerpt; the original text remains unchanged.",tr:"Belirli bir Arapça alıntının anlamına uygun çevirisidir; asıl metin değiştirilmemiştir.",ku:"Wergera maneyî ya beşekî erebî ye; metna eslî bê guhertin dimîne.",ckb:"وەرگێڕانێکی ماناییی بڕگەیەکی عەرەبییە؛ دەقی ڕەسەن ناگۆڕدرێت.",bs:"Prijevod značenja ograničenog arapskog odlomka; izvorni tekst ostaje neizmijenjen.",fr:"Traduction du sens d'un extrait arabe délimité ; le texte original reste inchangé.",es:"Traducción del sentido de un fragmento árabe delimitado; el original permanece intacto."})[selected]||"");
   setText("darSourceTitle",text.title);
   setText("darSourceCitation",doc.citation);
   setText("darSourceQuote",text.quote);
   markLang(t("darSourceQuote"),active);
   setText("darSourceArabic",doc.originalArabic);
   markLang(t("darSourceArabic"),"ar");
   const sections=[
    ["darSourceHistory",labels.context,text.context],
    ["darSourceExplanation",labels.explanation,text.explanation],
    ["darSourceBoundary",labels.boundary,text.boundary],
    ["darSourceApplication",labels.application,text.application],
    ["darSourceConclusion",labels.conclusion||"Fazit",text.conclusion]
   ];
   sections.forEach(row=>addBlock(...row));
   const lesson=t("darSourceLearn");
   if(lesson){lesson.textContent="📚 "+labels.learning;lesson.href=linkTo(doc.learningPath)}
  }else{
   setText("darLessonHeading",text.title);
   const back=t("darLessonBack");
   if(back){back.href=linkTo("/q/"+q+"/");back.textContent=labels.backToSource||"Zur Quellenkarte"}
   step=0;score=0;renderQuestion(text,labels);
  }
 }
 function renderQuestion(locale,labels){
  const qs=locale.questions,options=t("darLessonChoices"),f=t("darLessonFeedback"),next=t("darLessonNext"),again=t("darLessonAgain");
  if(!options)return;
  options.replaceChildren();
  f.textContent="";
  answered=false;
  if(step>=qs.length){
    setText("darLessonCount",labels.result||"Ergebnis");
    setText("darLessonQuestion",score+" / "+qs.length);
    next.hidden=true;again.hidden=false;
    again.textContent=labels.restart||"Erneut beginnen";
    return;
  }
  const qn=qs[step];
  setText("darLessonCount",(labels.question||"Frage")+" "+(step+1)+" / "+qs.length);
  setText("darLessonQuestion",qn.q);
  next.hidden=false;next.disabled=true;next.textContent=labels.next||"Weiter";
  again.hidden=true;
  qn.answers.forEach((answer,i)=>{
   const button=document.createElement("button");button.type="button";button.className="dar-classic-choice";
   button.textContent=answer;button.setAttribute("aria-pressed","false");
   button.addEventListener("click",()=>{
    if(answered)return;answered=true;
    if(i===qn.correct)score++;
    for(const sibling of options.children)sibling.disabled=true;
    button.setAttribute("aria-pressed","true");
    f.textContent=(i===qn.correct?(labels.correct||"Richtig"):(labels.wrong||"Nicht richtig"))+". "+qn.why;
    next.disabled=false;
   });options.append(button);
  });
 }
 const pick=t("darSourceLang");
 if(pick)pick.addEventListener("change",()=>{
  chosen=known.includes(pick.value)?pick.value:"de";
  try{localStorage.setItem("darAdultPreferredLocaleV1",chosen)}catch(_){}
  try{const url=new URL(location.href);url.searchParams.set("lang",chosen);history.replaceState(history.state,"",url.pathname+url.search)}catch(_){}
  update();
 });
 if(screen==="lesson"){
  t("darLessonNext")?.addEventListener("click",()=>{
   if(!answered)return;
   step++;
   const active=hasApproved(chosen)?chosen:"de";
   renderQuestion(doc.locales[active],doc.locales[chosen]?.ui||doc.locales[active].ui);
  });
  t("darLessonAgain")?.addEventListener("click",()=>{step=0;score=0;const active=hasApproved(chosen)?chosen:"de";renderQuestion(doc.locales[active],doc.locales[chosen]?.ui||doc.locales[active].ui)});
 }
 update();
})();