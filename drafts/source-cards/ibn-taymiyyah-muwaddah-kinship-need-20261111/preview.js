/* Source and lesson preview for the canonical content ID.
 * Deliberately no Q number and no publication endpoint until owner authorization.
 * All nine content variants are drafts pending editorial verification.
 */
(async function () {
  "use strict";
  const supported=["de","ar","en","tr","ku","ckb","bs","fr","es"];
  const $=id=>document.getElementById(id);
  const source=$("dar-source-preview"),lesson=$("dar-lesson-preview");
  if(!source&&!lesson)return;
  let doc;
  try{
    const response=await fetch("./manifest.json",{cache:"no-store"});
    if(!response.ok)throw new Error("Manifest nicht erreichbar: "+response.status);
    doc=await response.json();
  }catch(error){$("error").textContent="Entwurfsdaten können nicht geladen werden: "+error.message;return;}
  function readLang(){
    const explicit=new URL(location.href).searchParams.get("lang");
    if(supported.includes(explicit))return explicit;
    try{const saved=localStorage.getItem("darAdultPreferredLocaleV1");if(supported.includes(saved))return saved;}catch(_){}
    return "de";
  }
  function put(id,value){const node=$(id);if(node)node.textContent=value||"";}
  function labelled(id,label,value){const target=$(id);if(!target)return;target.replaceChildren();const heading=document.createElement("h2");heading.textContent=label;const para=document.createElement("p");para.textContent=value||"";target.append(heading,para);}
  function readText(v){const p=document.createElement("p");p.textContent=v;return p;}
  let active=readLang(),quizIndex=0,answersCorrect=0,quizLocked=false;
  function render(){
    const l=doc.locales[active],ui=l.ui,rtl=l.dir==="rtl";
    document.documentElement.lang=active;
    document.documentElement.dir=rtl?"rtl":"ltr";
    put("draft-notice",ui.notPublished+" · "+doc.contentId);
    put("language-label",ui.language);
    $("language").value=active;
    put("title",l.title);
    put("reference",doc.citation);
    if(source){
      labelled("translated",ui.statement,l.quote);
      labelled("historical",ui.context,l.context);
      labelled("explanation",ui.explanation,l.explanation);
      labelled("boundary",ui.boundary,l.boundary);
      labelled("application",ui.application,l.application);
      labelled("summary",active==="de"?"Fazit":ui.explanation,l.conclusion);
      put("original-label",ui.original);
      put("original",doc.originalArabic);
      const orig=$("original");orig.lang="ar";orig.dir="rtl";
      put("evidence-label",ui.evidence);
      const links=$("evidence-links");links.replaceChildren();
      for(const item of doc.links){
        const a=document.createElement("a");
        a.className="qsource-link web";a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";
        const strong=document.createElement("strong");strong.className="qsource-link-title";strong.textContent=item.label;
        a.append(strong);links.append(a);
      }
      put("learn-link-label",ui.learning);
      $("learn-link").href="./lesson.html?lang="+encodeURIComponent(active);
    }else{
      labelled("lesson-context",ui.context,l.context);
      labelled("lesson-boundary",ui.boundary,l.boundary);
      put("source-link-label",active==="de"?"Zur Quellenkarte":"↩ "+ui.original);
      $("source-link").href="./index.html?lang="+encodeURIComponent(active);
      quizIndex=0;answersCorrect=0;renderQuestion();
    }
  }
  function renderQuestion(){
    const l=doc.locales[active],ui=l.ui,qs=l.questions;
    const opts=$("answers"),feedback=$("feedback");
    opts.replaceChildren();feedback.textContent="";quizLocked=false;
    if(quizIndex>=qs.length){
      put("question-progress",ui.result);
      put("question-text",answersCorrect+" / "+qs.length);
      $("next").hidden=true;$("restart").hidden=false;return;
    }
    const q=qs[quizIndex];put("question-progress",ui.question+" "+(quizIndex+1)+" / "+qs.length);
    put("question-text",q.q);
    $("next").hidden=false;$("next").disabled=true;put("next",ui.next);
    $("restart").hidden=true;put("restart",ui.restart);
    q.answers.forEach((answer,i)=>{
      const b=document.createElement("button");b.type="button";b.className="quiz-choice";b.textContent=answer;
      b.addEventListener("click",()=>{
        if(quizLocked)return;
        quizLocked=true;if(i===q.correct)answersCorrect++;
        feedback.textContent=(i===q.correct?ui.correct:ui.wrong)+". "+q.why;
        [...opts.children].forEach(node=>node.disabled=true);
        b.setAttribute("aria-pressed","true");$("next").disabled=false;
      });
      opts.append(b);
    });
  }
  $("language").addEventListener("change",()=>{
    active=supported.includes($("language").value)?$("language").value:"de";
    try{localStorage.setItem("darAdultPreferredLocaleV1",active)}catch(_){}
    const url=new URL(location.href);url.searchParams.set("lang",active);
    history.replaceState(history.state,"",url.pathname+url.search);
    render();
  });
  if(lesson){
    $("next").addEventListener("click",()=>{if(!quizLocked)return;quizIndex++;renderQuestion()});
    $("restart").addEventListener("click",()=>{quizIndex=0;answersCorrect=0;renderQuestion()});
  }
  render();
})();