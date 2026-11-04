/* DĀR AL TAWḤĪD Q50 · one verified pair of Athar and nine editorial locale drafts.
   Same source+lesson identity in Web, iOS WKWebView and Android PWA.
   Locale is explicit ?lang= or darAdultPreferredLocaleV1; never the OS language.
   Mutates translations only. The original Arabic and evidence URLs stay untouched. */
(function(){
"use strict";
var source=document.getElementById("q50Source"),quizPage=document.getElementById("q50QuizPage");
if(!source&&!quizPage)return;
if(window.__darQ50LocalizedV1)return;window.__darQ50LocalizedV1=true;
var API="/assets/q50-locales.json?v=20261104-staging-v1";
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
function mark(code){document.documentElement.lang=code;document.documentElement.dir=code==="ar"||code==="ckb"?"rtl":"ltr";document.body.classList.toggle("q50-rtl",code==="ar"||code==="ckb");}
function locale(){var code=lang();return cached&&cached.locales[code]?code:"de"}
function active(){return cached&&cached.locales[locale()]}
function link(route){
 var u=new URL(route,document.baseURI||location.href);
 u.searchParams.set("lang",locale());
 return u.pathname+u.search;
}
function sourceRender(){
 var c=locale(),p=active();if(!p)return;
 mark(c);
 text("q50Kicker",p.ui.source+" · Q50");
 text("q50Title",p.title);
 text("q50Intro",p.intro);
 text("q50H1",p.ui.explanation+" · Ibn Sīrīn");
 text("q50H2",p.ui.chain+" · Ibn al-Mubārak");
 text("q50H3",p.ui.classification);
 text("q50H4",p.ui.sources);
 text("q50Speaker1","🖋️ "+p.speaker1);
 text("q50Statement1","„"+p.statement1+"“");
 text("q50Speaker2","🖋️ "+p.speaker2);
 text("q50Statement2","„"+p.statement2+"“");
 text("q50Explain1",p.explain1);
 text("q50Explain2",p.explain2);
 text("q50Context",p.ui.explanation+": "+p.intro);
 text("q50Limit",p.ui.warning+": "+p.limitations);
 text("q50Takeaway",p.ui.result+": "+p.conclusion);
 text("q50Chain1",p.ui.chain+": "+cached.sourceChains.ibnSirin);
 text("q50Chain2",p.ui.chain+": "+cached.sourceChains.ibnMubarak);
 var entries=["Muslim · Muqaddimah 26 · 1/14","Dorar · Ibn Sīrīn","Muslim · Muqaddimah · Isnād","Muslim · Muqaddimah 32 · 1/16","Ibn aṣ-Ṣalāḥ · ʿUlūm al-Ḥadīṯ 256","Al-ʿIrāqī · at-Taqyīd wa-l-Īḍāḥ"];
 Array.from(source.querySelectorAll(".qsource-link-title")).forEach(function(e,i){e.textContent=entries[i]||e.textContent});
 Array.from(source.querySelectorAll(".qsource-link-sub")).forEach(function(e){e.textContent=p.ui.sources});
 text("q50EvidenceNote",p.ui.sources+" · Muslim, Muqaddimah 26 und 32. Die Buchpaginierung kann je nach Ausgabe abweichen.");
 text("q50Learning","📚 "+p.ui.study);
 var a=id("q50Learning");if(a)a.href=link("/lernen/wissen-ist-religion/");
 text("q50Review",p.approved?"":p.ui.review);
 text("q50Language",c);var picker=id("q50Language");if(picker)picker.value=c;
 document.title=p.title+" | Q50 · DĀR AL TAWḤĪD";
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
 mark(c);
 text("qlEyebrow",p.ui.study+" · Q50");
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
 document.title=p.title+" | Q50 · "+p.ui.study+" · DĀR AL TAWḤĪD";
}
function onLocaleChanged(next){
 next=norm(next);if(!next||!cached||!cached.locales[next])return;
 manual=next;
 try{localStorage.setItem("darAdultPreferredLocaleV1",next)}catch(_){}
 if(source)sourceRender();if(quizPage)renderQuiz();
 window.dispatchEvent(new CustomEvent("dar:q50:locale-ready",{detail:{locale:next,sourceId:"qsource:50"}}));
}
function attach(){
 var pick=id(source?"q50Language":"qlLanguage");
 if(pick)pick.addEventListener("change",function(){onLocaleChanged(pick.value)});
 if(quizPage){
  id("qlNext").addEventListener("click",function(){
   if(answer===null)return;
   if(step+1<active().questions.length){step++;answer=null;renderQuiz()}
   else{id("quiz").hidden=true;id("qlFinished").hidden=false;text("qlResultScore",score+" "+active().ui.of+" "+active().questions.length+" · "+active().ui.correct)}
  });
  id("qlRetry").addEventListener("click",function(){score=0;step=0;answer=null;id("quiz").hidden=false;id("qlFinished").hidden=true;renderQuiz()});
 }
 if(source){
  var a=id("q50Learning");
  if(a)a.addEventListener("click",function(ev){
   if(window.parent===window||!window.parent.postMessage)return;
   ev.preventDefault();window.parent.postMessage({type:"DAR_Q50_READER_NAV_V1",path:link("/lernen/wissen-ist-religion/")},location.origin);
  });
 }
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
var fallback={
qSourceId:"qsource:50",sourceChains:{
ibnSirin:"Ḥasan ibn ar-Rabīʿ → Ḥammād ibn Zayd → Ayyūb und Hišām → Muḥammad ibn Sīrīn.",
ibnMubarak:"Muḥammad ibn ʿAbdillāh ibn Quhzāḏ → ʿAbdān ibn ʿUṯmān → Ibn al-Mubārak."},
locales:{de:{
name:"Deutsch",dir:"ltr",approved:false,title:"DIESES WISSEN IST RELIGION",
speaker1:"Muḥammad ibn Sīrīn (raḥimahullāh)",statement1:"Wahrlich, dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.",
speaker2:"ʿAbdullāh ibn al-Mubārak (raḥimahullāh)",statement2:"Der Isnād gehört zur Religion. Gäbe es keinen Isnād, könnte jeder sagen, was er wollte.",
intro:"Beide Āthār stehen in der Einleitung zu Ṣaḥīḥ Muslim.",explain1:"Wissen bedarf zuverlässiger Quellen.",explain2:"Die Überlieferungskette macht eine Zuschreibung überprüfbar.",limitations:"Eine Kette allein ist noch kein Authentizitätsbeweis.",conclusion:"Quelle und Überlieferer prüfen.",
ui:{source:"Quellenprüfung",study:"Lernbereich",sources:"Originalnachweise",chain:"Isnād",classification:"Einordnung",explanation:"Erläuterung",warning:"Grenzen",result:"Fazit",question:"Frage",of:"von",next:"Weiter",correct:"Richtig",incorrect:"Nicht richtig",finish:"Ergebnis",restart:"Erneut lernen",review:"Deutsche Notfallfassung"},
questions:[
{q:"Wozu ruft Ibn Sīrīn auf?",a:["Alles ungeprüft weiterzugeben","Zu prüfen, von wem wir die Religion nehmen","Nur auf die Länge zu achten","Alle Ketten abzulehnen"],correct:1,why:"Auf die Herkunft religiösen Wissens achten."},
{q:"Was ist Isnād?",a:["Meinung","Buchtitel","Kette von Überlieferern","Gebetszeit"],correct:2,why:"Die Kette der Berichterstatter."},
{q:"Wer sagte, der Isnād sei Teil der Religion?",a:["Ibn al-Mubārak","Abū Hurayrah","ʿUmar","Ibn ʿAbbās"],correct:0,why:"Ibn al-Mubārak."},
{q:"Reicht die Existenz einer Kette zur Authentizität?",a:["Ja","Macht alle Worte prophetisch","Prüfung verboten","Nein, sie muss untersucht werden"],correct:3,why:"Die Verbindung und Zuverlässigkeit müssen geprüft werden."}
]}}};
attach();
fetch(API,{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("Q50 locale asset HTTP "+r.status);return r.json()})
.then(function(j){
 if(j.qSourceId!=="qsource:50"||!j.locales||CODES.some(function(c){return !j.locales[c]||j.locales[c].questions.length!==4}))throw Error("Incomplete Q50 locales");
 cached=j;
 if(source)sourceRender();if(quizPage)renderQuiz();
}).catch(function(e){
 console.warn("DĀR Q50 multilingual file unavailable; German original retained",e);
 cached=fallback;if(source)sourceRender();if(quizPage)renderQuiz();
});
})();