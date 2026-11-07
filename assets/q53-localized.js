/* DĀR Q53 reader & lesson: one canonical Q, nine UI languages, German audited text until full religious translations receive independent approval. */
(function () {
"use strict";
var CODES=["de","ar","en","tr","ku","ckb","bs","fr","es"];
var LABEL={de:"Sprache",ar:"اللغة",en:"Language",tr:"Dil",ku:"Ziman",ckb:"زمان",bs:"Jezik",fr:"Langue",es:"Idioma"};
var NOTICE={
de:"",
ar:"الترجمة العربية لم تُعتمد بعد. يُعرض النص الألماني الأصلي إلى حين المراجعة.",
en:"An independently approved English translation is not yet available. The German original is displayed.",
tr:"Türkçe çeviri henüz onaylanmadı. Kontrol edilen Almanca özgün metin gösteriliyor.",
ku:"Wergera kurdî hîn nehatiye pejirandin; metna almanî tê nîşandan.",
ckb:"وەرگێڕانی سۆرانی هێشتا پەسەند نەکراوە؛ دەقی ئەڵمانی پیشان دەدرێت.",
bs:"Bosanski prijevod još nije odobren; prikazan je provjereni njemački tekst.",
fr:"La traduction française n’est pas encore validée ; le texte allemand est affiché.",
es:"La traducción al español aún no ha sido aprobada; se muestra el texto alemán verificado."
};
var source=document.getElementById("q53Source"),lesson=document.getElementById("q53QuizPage");
if(!source&&!lesson||window.__darQ53LocaleV1)return;
window.__darQ53LocaleV1=true;
var el=function(id){return document.getElementById(id)};
function normalize(s){s=String(s||"").toLowerCase().replace(/_/g,"-");return CODES.includes(s)?s:""}
function query(){try{return normalize(new URL(location.href).searchParams.get("lang"))}catch(_){return ""}}
function saved(){try{return normalize(localStorage.getItem("darAdultPreferredLocaleV1"))}catch(_){return ""}}
function current(){return query()||saved()||"de"}
function apply(code,explicit){
 code=normalize(code)||"de";
 var rtl=code==="ar"||code==="ckb";
 document.documentElement.lang=code;document.documentElement.dir=rtl?"rtl":"ltr";
 var panel=source||lesson;panel.setAttribute("lang",code);panel.setAttribute("dir",rtl?"rtl":"ltr");
 var pick=el("q53Lang")||el("q53QuizLang");if(pick)pick.value=code;
 var name=el("q53LangLabel")||el("q53QuizLangLabel");if(name)name.textContent=LABEL[code];
 var note=el("q53Notice")||el("q53QuizNotice");if(note){note.textContent=NOTICE[code];note.hidden=code==="de"}
 var original=source?.querySelector(".q53-ar");if(original){original.setAttribute("lang","ar");original.setAttribute("dir","rtl")}
 var german=source?.querySelector(".q53-quote");if(german){german.setAttribute("lang","de");german.setAttribute("dir","ltr")}
 var link=el("q53Learn");if(link)link.href="/lernen/ghibah-ukhuwah/"+(code==="de"?"":"?lang="+encodeURIComponent(code));
 if(explicit){
  try{localStorage.setItem("darAdultPreferredLocaleV1",code)}catch(_){}
  try{if(location.protocol==="https:" && (/^\/q\/53\/$/.test(location.pathname)||/^\/lernen\/ghibah-ukhuwah\/$/.test(location.pathname))){var u=new URL(location.href);u.searchParams.set("lang",code);history.replaceState(history.state,"",u.pathname+u.search)}}catch(_){}
 }
}
var select=el("q53Lang")||el("q53QuizLang");
if(select)select.addEventListener("change",function(){apply(select.value,true)});
apply(current(),false);
if(!lesson)return;
var questions=[
 {q:"Wovor warnte al-Fuḍayl ibn ʿIyāḍ?",a:["Vor dem Lesen von Büchern","Vor übler Nachrede (Ghībah)","Vor zulässiger Arbeit"],c:1,x:"Der Āṯār verbindet die Verbreitung von Ghībah mit dem Verlust aufrichtiger Brüderlichkeit."},
 {q:"Was beschreibt das Gleichnis von Gold und Silber auf Holz?",a:["Eine schön wirkende Außenseite bei innerem Mangel","Ein Handelsgesetz über Schmuck","Eine Vorschrift über Eigentum"],c:0,x:"Die äußere Erscheinung kann gut aussehen, obwohl das Innere durch Fehlverhalten beschädigt ist."},
 {q:"Von wem stammt die überlieferte Aussage?",a:["Von einem anonymen Händler","Unmittelbar vom Propheten ﷺ","Von al-Fuḍayl ibn ʿIyāḍ"],c:2,x:"Es ist eine Aussage al-Fuḍayls, kein als marfūʿ nachgewiesener Prophetenḥadīṯ."},
 {q:"Was ist eine passende Lehre für das eigene Verhalten?",a:["Andere ständig öffentlich kritisieren","Die Zunge vor Ghībah schützen","Sich nur um äußeres Ansehen kümmern"],c:1,x:"Tazkiyah verlangt, die eigene Zunge zu behüten und die Ehre anderer zu achten."}
];
var step=0,correct=0,locked=false;
function render(){
 var area=el("q53QuizQuestion"),opts=el("q53QuizOptions"),feed=el("q53QuizFeedback"),num=el("q53QuizStep"),next=el("q53QuizNext"),restart=el("q53QuizRestart");
 if(!area||!opts)return;
 if(step>=questions.length){area.textContent="Ergebnis";opts.replaceChildren();num.textContent=correct+" / "+questions.length+" richtige Antworten";feed.textContent="Die Rechenschaft beginnt mit dem eigenen Verhalten.";next.hidden=true;restart.hidden=false;return;}
 var q=questions[step];locked=false;num.textContent="Frage "+(step+1)+" / "+questions.length;area.textContent=q.q;opts.replaceChildren();feed.textContent="";next.disabled=true;next.hidden=false;restart.hidden=true;
 q.a.forEach(function(ans,i){var b=document.createElement("button");b.type="button";b.className="q53-option";b.textContent=ans;b.setAttribute("aria-pressed","false");b.addEventListener("click",function(){if(locked)return;locked=true;b.setAttribute("aria-pressed","true");if(i===q.c)correct++;feed.textContent=(i===q.c?"Richtig. ":"Nicht richtig. ")+q.x;next.disabled=false;Array.from(opts.children).forEach(function(btn){btn.disabled=true})});opts.appendChild(b)});
}
el("q53QuizNext")?.addEventListener("click",function(){if(locked){step++;render()}});
el("q53QuizRestart")?.addEventListener("click",function(){step=0;correct=0;render()});
render();
})();
