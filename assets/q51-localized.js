/* DĀR AL TAWḤĪD Q51 · one verified pair of Athar and nine editorial locale drafts.
   Same source+lesson identity in Web, iOS WKWebView and Android PWA.
   Locale is explicit ?lang= or darAdultPreferredLocaleV1; never the OS language.
   Mutates translations only. The original Arabic and evidence URLs stay untouched. */
(function(){
"use strict";
var source=document.getElementById("q51Source"),quizPage=document.getElementById("q51QuizPage");
if(!source&&!quizPage)return;
if(window.__darQ51LocalizedV1)return;window.__darQ51LocalizedV1=true;
var API="/assets/q51-locales.json?v=20261105-nine-preview-v4";
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
function mark(code){var rtl=code==="ar"||code==="ckb",dir=rtl?"rtl":"ltr";document.documentElement.lang=code;document.documentElement.dir=dir;var pane=source||quizPage;if(pane){pane.lang=code;pane.dir=dir}document.body.classList.toggle("q51-rtl",rtl);}
function locale(){var code=lang();return cached&&cached.locales[code]?code:"de"}
function active(){if(!cached)return null;var chosen=cached.locales[locale()];if(!chosen)return cached.locales.de;return chosen}
function link(route){
 var u=new URL(route,document.baseURI||location.href);
 u.searchParams.set("lang",locale());
 return u.pathname+u.search;
}
function sourceRender(){
 var c=locale(),p=active();if(!p)return;
 mark(c);
 text("q51BrandTop",p.ui.headerLine);
 text("q51LanguageLabel","🌐 "+p.ui.language);
 var sourcePicker=id("q51Language");if(sourcePicker)sourcePicker.setAttribute("aria-label",p.ui.language+" · "+p.ui.source+" / "+p.ui.study);
 text("q51Reference1","📝 aṭ-Ṭabarī · Ǧāmiʿ al-Bayān · 487 · 1/370");
 text("q51Reference2","📝 aṭ-Ṭabarī · Ǧāmiʿ al-Bayān · 480");
 text("q51Kicker",p.ui.source+" · Q51");
 text("q51Title",p.title);
 text("q51Intro",p.intro);
 text("q51H1",p.ui.explanation+" · Qatādah · Nr. 487");
 text("q51H2",p.ui.explanation+" · Qatādah · Nr. 480");
 text("q51H3",p.ui.classification);
 text("q51H4",p.ui.sources);
 text("q51TabariAttribution","Abū Ǧaʿfar aṭ-Ṭabarī · "+(p.ui.tabariAttribution||p.ui.explanation)+" · al-Baqarah 2:22 · 488–490");
 text("q51EvidenceGroup1","🖋️ "+p.speaker1+" · "+p.ui.sources);
 text("q51EvidenceGroup2","🖋️ "+p.speaker2+" · "+p.ui.sources);
 text("q51Speaker1","🖋️ "+p.speaker1);
 text("q51Statement1","„"+p.statement1+"“");
 text("q51Speaker2","🖋️ "+p.speaker2);
 text("q51Statement2","„"+p.statement2+"“");
 text("q51Explain1",p.explain1);
 text("q51Explain2",p.explain2);
 text("q51Context",p.tabariContext);
 text("q51Limit",p.ui.warning+": "+p.limitations);
 text("q51Takeaway",p.ui.result+": "+p.conclusion);
 text("q51Chain1",p.ui.chain+": "+cached.sourceChains.qatadah487);
 text("q51Chain2",p.ui.chain+": "+cached.sourceChains.qatadah480);
 text("q51EvidenceNote",p.ui.pageNote);
 var referenceTitles=["① aṭ-Ṭabarī · Ǧāmiʿ al-Bayān · 1/370 · 487","② aṭ-Ṭabarī · Ǧāmiʿ al-Bayān · 1/393 · 487","③ aṭ-Ṭabarī · Ǧāmiʿ al-Bayān · 480","④ aṭ-Ṭabarī · al-Baqarah 2:22 · 490"];
 var subtitles=["Islamweb · "+p.ui.arabic,"Shamela · "+p.ui.sources,"Islamweb · "+p.ui.explanation+" · andād","Islamweb · "+p.ui.explanation+" · aṭ-Ṭabarī"];
 Array.from(source.querySelectorAll(".qsource-link-title")).forEach(function(e,i){if(referenceTitles[i])e.textContent=referenceTitles[i]});
 Array.from(source.querySelectorAll(".qsource-link-sub")).forEach(function(e,i){if(subtitles[i])e.textContent=subtitles[i]});
 text("q51Learning","📚 "+p.ui.study);
 var a=id("q51Learning");if(a){a.href=link("/lernen/tawhid-schoepfer-anbetung/");a.setAttribute("aria-label",p.ui.study)}
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
 mark(c);
 text("qlLanguageLabel","🌐 "+p.ui.language);
 var quizPicker=id("qlLanguage");if(quizPicker)quizPicker.setAttribute("aria-label",p.ui.language+" · "+p.ui.study);
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
 // Keep manual selection shareable and persistent on page reload, not just this in-memory session.
 try{var u=new URL(location.href);u.searchParams.set("lang",next);history.replaceState(history.state,"",u.pathname+u.search+u.hash)}catch(_){}
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
var fallback={qSourceId:"qsource:51",sourceChains:{"qatadah487":"Bišr → Yazīd → Saʿīd → Qatādah.","qatadah480":"Bišr ibn Muʿāḏ → Yazīd → Saʿīd → Qatādah."},locales:{de:{"name":"Deutsch","title":"DEN SCHÖPFER ANERKENNEN GENÜGT NICHT","speaker1":"Qatādah ibn Diʿāmah (raḥimahullāh)","statement1":"Ihr wisst, dass Allah euch erschaffen hat und die Himmel und die Erde erschaffen hat. Dennoch stellt ihr Ihm andere als Ebenbürtige zur Seite.","speaker2":"Qatādah ibn Diʿāmah (raḥimahullāh)","statement2":"Mit ‚Ebenbürtigen‘ sind Gleichgestellte gemeint. [Sinngemäße Worterklärung]","intro":"Qatādahs zwei Āthār im Tafsīr zu al-Baqarah 2:22 und aṭ-Ṭabarīs eigene Auslegung zum Tawḥīd.","explain1":"Qatādah macht den Widerspruch deutlich, wenn jemand Allah als Schöpfer anerkennt, Ihm aber andere gleichstellt.","explain2":"Das arabische Wort andād steht für Wesenheiten oder Dinge, die Allah gleichgestellt werden. Qatādah erläutert es als ʿudalāʾ (Gleichgestellte).","limitations":"Beide Aussagen sind maqṭūʿe Worte eines Tābiʿī und keine Prophetenḥadīṯe. Die Dokumentation des Isnād ist keine abschließende Einstufung. Aus allgemeinen Aussagen folgt kein ungeprüftes Einzelurteil über Personen.","conclusion":"Der Tawḥīd umfasst nicht nur die Anerkennung Allahs als Schöpfer, sondern auch seine alleinige Anbetung. Ihm darf kein Teilhaber zur Seite gestellt werden.","questions":[{"q":"Was betont Qatādah in al-Baqarah 2:22?","a":["Die Schöpfung sei ohne Schöpfer entstanden.","Man kann Allah als Schöpfer kennen und Ihm dennoch Teilhaber beigesellen.","Jede Überlieferung sei prophetisch.","Die Anbetung anderer sei erlaubt."],"correct":1,"why":"Er kritisiert, dem Schöpfer trotz dieser Erkenntnis andere gleichzustellen."},{"q":"Was bedeutet das Wort andād an dieser Stelle?","a":["Gebetszeiten","Bücher","Allah gleichgestellte Wesenheiten","Die Engel allein"],"correct":2,"why":"Qatādah erklärt andād hier durch ʿudalāʾ: Gleichgestellte."},{"q":"Wer hat diese beiden Aussagen im Tafsīr überliefert?","a":["Qatādah ibn Diʿāmah","Abū Hurayrah","Ibn al-Mubārak","Imām Mālik"],"correct":0,"why":"Beide Āthār werden Qatādah zugeschrieben und von aṭ-Ṭabarī angeführt."},{"q":"Ist das Wissen um Allah als Schöpfer allein schon die vollständige Verwirklichung des Tawḥīd?","a":["Ja, die Art der Anbetung ist bedeutungslos.","Jeder Mensch wird dadurch automatisch sündlos.","Die Frage ist im Qurʾān nicht behandelt.","Nein, die Anbetung muss Allah allein gelten."],"correct":3,"why":"Der Vers verbietet Gleichstellungen und verlangt die alleinige Ausrichtung der Anbetung auf Allah."}],"dir":"ltr","ui":{"source":"Quellenprüfung","study":"Lernbereich öffnen","sources":"Originalnachweise","chain":"Überlieferungsweg","classification":"Einordnung","explanation":"Erläuterung","warning":"Grenzen der Aussage","result":"Fazit","arabic":"Arabischer Originalwortlaut","language":"Sprache","start":"Lernen beginnen","question":"Frage","of":"von","next":"Weiter","evaluate":"Antwort prüfen","correct":"Richtig","incorrect":"Nicht richtig","finish":"Ergebnis","restart":"Erneut lernen","home":"Startseite","review":"Sprachfassung in redaktioneller Prüfung","headerLine":"Wissen aus Qurʾān, Sunnah und Āthār","pageNote":"Die Seitenangaben folgen der genannten Ausgabe; andere Druckausgaben können anders paginiert sein."},"approved":true,"translationStatus":"canonical-german-original-owner-authorized"}}};
attach();
fetch(API,{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("Q51 locale asset HTTP "+r.status);return r.json()})
.then(function(j){
 if(j.qSourceId!=="qsource:51"||!j.locales||CODES.some(function(c){var p=j.locales[c];return !p||!p.post||!p.ui||!p.ui.tabariAttribution||!p.tabariContext||!p.statement1||!p.statement2||!p.conclusion||!Array.isArray(p.questions)||p.questions.length!==4}))throw Error("Incomplete Q51 locales");
 cached=j;
 if(source)sourceRender();if(quizPage)renderQuiz();
}).catch(function(e){
 console.warn("DĀR Q51 multilingual file unavailable; German original retained",e);
 cached=fallback;
 if(source)sourceRender();if(quizPage)renderQuiz();
 var w=id(source?"q51Review":"qlReview");if(w)w.textContent="Der Sprachkatalog ist momentan nicht abrufbar. Die deutsche Originalfassung wird angezeigt.";
});
})();