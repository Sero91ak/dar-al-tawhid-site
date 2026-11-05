/* DĀR AL TAWḤĪD Q51 · one verified pair of Athar and nine editorial locale drafts.
   Same source+lesson identity in Web, iOS WKWebView and Android PWA.
   Locale is explicit ?lang= or darAdultPreferredLocaleV1; never the OS language.
   Mutates translations only. The original Arabic and evidence URLs stay untouched. */
(function(){
"use strict";
var source=document.getElementById("q51Source"),quizPage=document.getElementById("q51QuizPage");
if(!source&&!quizPage)return;
if(window.__darQ51LocalizedV1)return;window.__darQ51LocalizedV1=true;
var API="/assets/q51-locales.json?v=20261105-v1";
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var cached=null,manual="",step=0,score=0,answer=null;
function id(k){return document.getElementById(k)}
function text(k,v){var e=id(k);if(e)e.textContent=String(v==null?"":v)}
function norm(k){k=String(k||"").trim().toLowerCase().replace(/_/g,"-");if(k==="kr")k="ku";if(k==="ku-sorani")k="ckb";return CODES.indexOf(k)>=0?k:""}
function getStored(){try{return norm(localStorage.getItem("darAdultPreferredLocaleV1"))}catch(_){return ""}}
function explicit(){
 var p;
 try{p=new URL(document.baseURI||location.href).searchParams}catch(_){p=new URLSearchParams(location.search)}
 return norm(p.get("lang")||p.get("locale"));
}
function lang(){return manual||explicit()||getStored()||"de"}
function mark(code){document.documentElement.lang=code;document.documentElement.dir=code==="ar"||code==="ckb"?"rtl":"ltr";document.body.classList.toggle("q51-rtl",code==="ar"||code==="ckb");}
function locale(){var code=lang();return cached&&cached.locales[code]?code:"de"}
function active(){if(!cached)return null;var chosen=cached.locales[locale()];if(!chosen)return cached.locales.de;return chosen.approved===true?chosen:Object.assign({},cached.locales.de,{ui:chosen.ui,approved:false})}
function link(route){
 var u=new URL(route,document.baseURI||location.href);
 u.searchParams.set("lang",locale());
 return u.pathname+u.search;
}
function sourceRender(){
 var c=locale(),p=active();if(!p)return;
 mark(p.approved===true?c:"de");
 text("q51BrandTop",p.ui.headerLine);
 text("q51LanguageLabel","🌐 "+p.ui.language);
 text("q51Reference1","📝 aṭ-Ṭabarī · Ǧāmiʿ al-Bayān · Nr. 487 · 1/370");
 text("q51Reference2","📝 aṭ-Ṭabarī · Ǧāmiʿ al-Bayān · Nr. 480");
 text("q51Kicker",p.ui.source+" · Q51");
 text("q51Title",p.title);
 text("q51Intro",p.intro);
 text("q51H1",p.ui.explanation+" · Qatādah · Nr. 487");
 text("q51H2",p.ui.explanation+" · Qatādah · Nr. 480");
 text("q51H3",p.ui.classification);
 text("q51H4",p.ui.sources);
 text("q51EvidenceGroup1","🖋️ "+p.speaker1+" · "+p.ui.sources);
 text("q51EvidenceGroup2","🖋️ "+p.speaker2+" · "+p.ui.sources);
 text("q51Speaker1","🖋️ "+p.speaker1);
 text("q51Statement1","„"+p.statement1+"“");
 text("q51Speaker2","🖋️ "+p.speaker2);
 text("q51Statement2","„"+p.statement2+"“");
 text("q51Explain1",p.explain1);
 text("q51Explain2",p.explain2);
 text("q51Context",p.ui.explanation+": "+p.intro);
 text("q51Limit",p.ui.warning+": "+p.limitations);
 text("q51Takeaway",p.ui.result+": "+p.conclusion);
 text("q51Chain1",p.ui.chain+": "+cached.sourceChains.qatadah487);
 text("q51Chain2",p.ui.chain+": "+cached.sourceChains.qatadah480);
 text("q51EvidenceNote",p.ui.pageNote);
 text("q51Learning","📚 "+p.ui.study);
 var a=id("q51Learning");if(a)a.href=link("/lernen/tawhid-schoepfer-anbetung/");
 text("q51Review",p.approved?"":p.ui.review);
 var picker=id("q51Language");if(picker)picker.value=c;
 document.title=p.title+" | Q51 · DĀR AL TAWḤĪD";
}
function makeOption(label,index,c){
 var b=document.createElement("button");b.className="ql-option";b.type="button";
 b.setAttribute("aria-pressed",String(answer===index));
 var badge=document.createElement("span");badge.textContent=String.fromCharCode(65+index);
 var value=document.createElement("strong");value.textContent=label;
 b.append(badge,value);
 b.addEventListener("click",function(){
  if(answer!==null)return;
  answer=index;
  var q=active().questions[step];
  if(index===q.correct)score++;
  renderQuiz();
 });
 return b;
}
function renderQuiz(){
 var c=locale(),p=active();if(!p||!quizPage)return;
 mark(p.approved===true?c:"de");
 text("qlLanguageLabel","🌐 "+p.ui.language);
 text("qlEyebrow",p.ui.study+" · Q51");
 text("qlTitle",p.title);text("qlReview",p.approved?"":p.ui.review);
 var picker=id("qlLanguage");if(picker)picker.value=c;
 var q=p.questions[step];if(!q)return;
 text("qlStep",p.ui.question+" "+(step+1)+" "+p.ui.of+" "+p.questions.length);
 text("qlScore",score+" "+p.ui.correct);
 text("qlQuestion",q.q);
 var options=id("qlOptions");if(options){
  options.replaceChildren();
  q.a.forEach(function(choice,i){var b=makeOption(choice,i,c);if(answer!==null)b.disabled=true;options.appendChild(b)});
 }
 if(answer===null)text("qlFeedback","");
 else text("qlFeedback",(answer===q.correct?p.ui.correct:p.ui.incorrect)+" · "+q.why);
 text("qlNext",step===p.questions.length-1?p.ui.finish:p.ui.next);
 var next=id("qlNext");if(next)next.disabled=answer===null;
 text("qlResultTitle",p.ui.finish);
 text("qlResultScore",score+" "+p.ui.of+" "+p.questions.length+" · "+p.ui.correct);
 text("qlRetry",p.ui.restart);
 document.title=p.title+" | Q51 · "+p.ui.study+" · DĀR AL TAWḤĪD";
}
function onLocaleChanged(next){
 next=norm(next);if(!next||!cached||!cached.locales[next])return;
 manual=next;
 try{localStorage.setItem("darAdultPreferredLocaleV1",next)}catch(_){}
 if(quizPage){step=0;score=0;answer=null;id("quiz").hidden=false;id("qlFinished").hidden=true;}
 if(source)sourceRender();if(quizPage)renderQuiz();
 window.dispatchEvent(new CustomEvent("dar:q51:locale-ready",{detail:{locale:next,sourceId:"qsource:51"}}));
}
function attach(){
 var pick=id(source?"q51Language":"qlLanguage");
 if(pick)pick.addEventListener("change",function(){onLocaleChanged(pick.value)});
 if(quizPage){
  id("qlNext").addEventListener("click",function(){
   if(answer===null)return;
   if(step+1<active().questions.length){step++;answer=null;renderQuiz()}
   else{id("quiz").hidden=true;id("qlFinished").hidden=false;text("qlResultScore",score+" "+active().ui.of+" "+active().questions.length+" · "+active().ui.correct)}
  });
  id("qlRetry").addEventListener("click",function(){score=0;step=0;answer=null;id("quiz").hidden=false;id("qlFinished").hidden=true;renderQuiz()});
 }
 // Let the existing in-app link router and native fallback handle learning navigation.
 window.addEventListener("storage",function(ev){
  if(ev.key==="darAdultPreferredLocaleV1"&&!manual){if(source)sourceRender();if(quizPage)renderQuiz()}
 });
 window.addEventListener("message",function(ev){
  if(ev.origin!==location.origin||!ev.data||ev.data.type!=="DAR_ADULT_LOCALE_CHANGED")return;
  if(norm(ev.data.locale))onLocaleChanged(ev.data.locale);
 });
 window.addEventListener("dar-adult-locale-changed",function(ev){
  var next=norm(ev.detail&&ev.detail.locale);if(next)onLocaleChanged(next)
 });
}
var fallback=null;
attach();
fetch(API,{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("Q51 locale asset HTTP "+r.status);return r.json()})
.then(function(j){
 if(j.qSourceId!=="qsource:51"||!j.locales||CODES.some(function(c){return !j.locales[c]||j.locales[c].questions.length!==4}))throw Error("Incomplete Q51 locales");
 cached=j;
 if(source)sourceRender();if(quizPage)renderQuiz();
}).catch(function(e){
 console.warn("DĀR Q51 multilingual file unavailable; German original retained",e);
 cached=fallback;
 var w=id(source?"q51Review":"qlReview");if(w)w.textContent="Der Sprachkatalog ist momentan nicht abrufbar. Bitte die deutsche Originalquelle nutzen.";
});
})();