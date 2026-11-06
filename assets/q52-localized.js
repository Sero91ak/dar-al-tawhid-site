/* DAR_Q52_FULL_NINE_LOCALE_READER_V2
 * Source Q52 and the linked four-question lesson share one locale file.
 * Selection is explicit ?lang= or existing DĀR preference; NO OS inference.
 * Preserve canonical Q52, original Arabic matn and external evidence hrefs.
 * Neither reader nor quiz requires additional UI framework.
 */
(function(){
"use strict";
var source=document.getElementById("q52Source");
var quiz=document.getElementById("q52QuizPage");
if(!source&&!quiz)return;
if(window.__darQ52FullLocaleV2)return;window.__darQ52FullLocaleV2=true;
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var API="/assets/q52-locales.json?v=20261106-nine-full-v2";
var STORAGE="darAdultPreferredLocaleV1";
var data=null,manual="",step=0,score=0,chosen=null;
var order=[[2,0,3,1],[1,3,0,2],[3,1,2,0],[2,1,0,3]];
var $=function(id){return document.getElementById(id)};
function set(id,value){var el=$(id);if(el)el.textContent=String(value==null?"":value)}
function normalize(code){code=String(code||"").trim().toLowerCase().replace(/_/g,"-");if(code==="kr")code="ku";if(code==="ku-sorani")code="ckb";return CODES.includes(code)?code:""}
function param(){
 try{
  var base=document.baseURI||location.href;
  var u=new URL(base);
  var direct=u.searchParams.get("lang")||u.searchParams.get("locale");
  return normalize(direct);
 }catch(_){return ""}
}
function stored(){try{return normalize(localStorage.getItem(STORAGE))}catch(_){return ""}}
function selected(){return manual||param()||stored()||"de"}
function active(){
 var code=selected();return data&&data.locales&&data.locales[code]?code:"de";
}
function mark(code){
 var rtl=code==="ar"||code==="ckb",dir=rtl?"rtl":"ltr";
 document.documentElement.lang=code;document.documentElement.dir=dir;
 (source||quiz).setAttribute("lang",code);
 (source||quiz).setAttribute("dir",dir);
 document.body.classList.toggle("q52-rtl",rtl);
 var picker=$(source?"q52Lang":"lang");
 if(picker){picker.value=code;picker.setAttribute("aria-label",data.locales[code].ui.lang)}
}
function setPreferred(code){
 manual=normalize(code)||"de";
 try{localStorage.setItem(STORAGE,manual)}catch(_){}
 // The srcdoc reader has an about:srcdoc URL; never replace its history
 // or alter the canonical Q52 route. A manual ?lang= is permitted.
 try{
  if(/^https?:$/.test(location.protocol)&&
    (/^\/q\/52\/$/.test(location.pathname)||/^\/lernen\/khadijah-salam-paradies\/$/.test(location.pathname))){
   var u=new URL(location.href);u.searchParams.set("lang",manual);
   history.replaceState(history.state,"",u.pathname+u.search);
  }
 }catch(_){}
 render();
}
function sourceRender(pack,code){
 var u=pack.ui;
 set("q52BrandTop",u.brand);
 set("q52LangLabel",u.lang);
 set("q52Kicker",u.kicker+" · Q52");
 set("q52Title",pack.title);
 set("q52Intro",pack.intro);
 set("q52OriginalTitle",u.original);
 set("q52Reference",pack.reference);
 set("q52GermanTitle",u.statement);
 set("q52Statement",pack.statement);
 set("q52SharhTitle",u.sharh);
 set("q52SharhStatement",pack.sharh);
 set("q52EvidenceTitle",u.proof);
 set("q52Evidence1Title",pack.evidence1);
 set("q52Evidence1Sub",pack.evidence1Sub);
 set("q52Evidence2Title",pack.evidence2);
 set("q52Evidence2Sub",pack.evidence2Sub);
 set("q52EvidenceNote",pack.note);
 set("q52Learning","📚 "+u.learn);
 set("q52Notice","");
 var a=$("q52Learning");
 if(a){a.href="/lernen/khadijah-salam-paradies/?lang="+encodeURIComponent(code);a.setAttribute("aria-label",u.learn+" · Q52")}
 var home=source.querySelector(".qsource-social a.web");
 if(home)home.setAttribute("aria-label",u.home+" · DĀR AL TAWḤĪD");
 for(var id of ["q52Statement","q52SharhStatement","q52Reference","q52EvidenceNote"]){
  var e=$(id);if(e){e.lang=code;e.dir=code==="ar"||code==="ckb"?"rtl":"ltr"}
 }
 var orig=source.querySelector(".q52-ar");
 if(orig){orig.lang="ar";orig.dir="rtl"} // never localize/rewrite primary Arabic matn
 document.title=pack.title+" · Q52 | DĀR AL TAWḤĪD";
}
function renderQuiz(pack,code){
 var u=pack.ui;
 set("q52QuizTitle",pack.title);
 set("langLabel",u.lang);
 var qEl=$("quiz"),res=$("result");
 if(qEl)qEl.setAttribute("aria-label",u.quiz+" · Q52");
 var btn=$("next");if(btn)btn.textContent=u.next;
 btn=$("retry");if(btn)btn.textContent=u.retry;
 set("resultTitle",u.result);set("notice","");
 if(step>=pack.questions.length){
  if(qEl)qEl.hidden=true;
  if(res)res.hidden=false;
  set("resultScore",score+" / "+pack.questions.length+" "+u.correct);
  return;
 }
 if(qEl)qEl.hidden=false;
 if(res)res.hidden=true;
 var q=pack.questions[step],viewOrder=order[step]||[2,0,3,1];
 set("step",u.question+" "+(step+1)+" "+u.of+" "+pack.questions.length);
 set("question",q.q);
 var box=$("answers");
 if(box){
  box.textContent="";
  box.lang=code;box.dir=(code==="ar"||code==="ckb")?"rtl":"ltr";
  viewOrder.forEach(function(sourceIdx,optionIdx){
   var button=document.createElement("button");
   button.className="ql-option";button.type="button";
   button.textContent=q.a[sourceIdx];
   button.disabled=chosen!==null;
   button.setAttribute("aria-pressed",String(chosen===sourceIdx));
   button.setAttribute("aria-label",String.fromCharCode(65+optionIdx)+": "+q.a[sourceIdx]);
   button.addEventListener("click",function(){
    if(chosen!==null)return;
    chosen=sourceIdx;
    if(sourceIdx===0)score++;
    render();
   });
   box.appendChild(button);
  });
 }
 set("feedback",chosen===null?"":(chosen===0?u.yes:u.no)+" "+q.why);
 var next=$("next");if(next)next.disabled=chosen===null;
 document.title=pack.title+" · "+u.quiz+" | DĀR AL TAWḤĪD";
}
function render(){
 if(!data)return;
 var code=active(),pack=data.locales[code];
 mark(code);
 if(source)sourceRender(pack,code);
 if(quiz)renderQuiz(pack,code);
}
function bindPicker(id){
 var el=$(id);if(el)el.addEventListener("change",function(){setPreferred(el.value)});
}
bindPicker(source?"q52Lang":"lang");
if(quiz){
 var nxt=$("next");if(nxt)nxt.addEventListener("click",function(){if(chosen===null)return;step++;chosen=null;render()});
 var retry=$("retry");if(retry)retry.addEventListener("click",function(){step=0;score=0;chosen=null;render()});
}
fetch(API,{cache:"no-store"}).then(function(response){if(!response.ok)throw Error("Q52 locale file HTTP "+response.status);return response.json()}).then(function(j){
 if(!j||j.qSourceId!==52||!j.locales)throw Error("Q52 locale schema invalid");
 for(var code of CODES){
  var p=j.locales[code];
  if(!p||!p.statement||!p.sharh||!p.ui||!Array.isArray(p.questions)||p.questions.length!==4)
   throw Error("Q52 locale incomplete: "+code);
 }
 data=j;
 render();
}).catch(function(err){
 try{console.error("DAR Q52 language",err)}catch(_){}
 // Do not falsely present a German answer as a requested translated one.
 if(quiz){set("notice","Die Lernfragen können gerade nicht geladen werden.");set("question","Lernfragen zurzeit nicht verfügbar.");}
 if(source)set("q52Notice","Sprachdatei nicht verfügbar; es wird die deutsche Ausgangsfassung angezeigt.");
});
})();