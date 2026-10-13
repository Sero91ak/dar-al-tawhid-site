/* DĀR AL TAWḤĪD KIDS — Quiz Joy V1.
   Presentation only: never touches the 900 catalog entries, answer keys,
   memorization storage, voice manifest or age selection. */
(function(){
"use strict";
var modal=document.getElementById("quizModal");
if(!modal)return;
var stage=document.getElementById("quizStage");
var body=document.getElementById("quizBody");
var dashboard=document.getElementById("quizLearningDashboard");
var library=document.getElementById("quizLibraryPanel");

function band(){return modal.getAttribute("data-quiz-band")||"7-8"}
function current(){
  try{
    var q=window.currentQuiz,idx=Number(window.currentQuizIndex||0);
    return Array.isArray(q)&&idx>=0&&idx<q.length?q[idx]:null;
  }catch(_){return null}
}
function yesNo(q){
  if(!q||!Array.isArray(q.answers)||q.answers.length!==2)return false;
  var labels=q.answers.map(function(a){return String(a.label||"").trim().toLocaleLowerCase("de-DE")});
  return labels.indexOf("ja")!==-1&&labels.indexOf("nein")!==-1;
}
function seed(q){
  var raw=String(q&&q.id||q&&q.number||"1");
  var m=raw.match(/(\d+)$/);
  return m?Number(m[1]):raw.length;
}
function coaching(q){
  var n=seed(q);
  if(band()==="4-6"){
    if(yesNo(q)){
      var prompts=[
        "Was denkst du? Tippe auf Ja, wenn du glaubst, dass es stimmt. Sonst auf Nein.",
        "Überlege einen Moment: Stimmt das? Dann wähle Ja. Wenn nicht, wähle Nein.",
        "Du darfst in Ruhe nachdenken. Ist es richtig? Wähle Ja oder Nein."
      ];return prompts[n%prompts.length];
    }
    return "Schau dir die Antworten in Ruhe an. Welche passt am besten?";
  }
  if(band()==="9-10"){
    return [
      "Überlege in Ruhe und entscheide, welche Antwort am besten passt.",
      "Was hast du darüber gelernt? Wähle deine Antwort.",
      "Vergleiche die Möglichkeiten und triff deine Entscheidung."
    ][n%3];
  }
  return [
    "Hör gut zu und überlege: Welche Antwort hältst du für richtig?",
    "Du hast Zeit zum Nachdenken. Tippe auf deine Antwort.",
    "Lies die Antworten in Ruhe und wähle die beste aus."
  ][n%3];
}
function sceneLine(q){
  var n=seed(q);
  if(band()==="4-6")return ["Du darfst mitraten!","Komm, wir lernen!","Deine Entdeckerfrage"][n%3];
  if(band()==="9-10")return ["Zeig, was du weißt","Denk in Ruhe nach","Deine Wissensfrage"][n%3];
  return ["Bereit zum Mitdenken?","Eine neue Entdeckung","Dein Wissensabenteuer"][n%3];
}
function augmentRound(){
  if(!modal.classList.contains("quiz-round-mode"))return;
  var scene=document.getElementById("quizScene");
  var question=document.getElementById("quizQuestion");
  var help=document.getElementById("quizHelp");
  if(!scene||!question||!help||scene.dataset.quizJoy==="1")return;
  var q=current();
  if(!q||String(q.question||"").trim()!==question.textContent.trim())return;
  scene.dataset.quizJoy="1";
  scene.classList.add("quiz-joy-mission");
  var copy=document.createElement("div");
  copy.className="quiz-joy-scene-copy";
  var title=document.createElement("strong");
  title.textContent=sceneLine(q);
  var deco=document.createElement("span");
  deco.className="quiz-joy-sparkle";
  deco.setAttribute("aria-hidden","true");
  copy.appendChild(title);copy.appendChild(deco);scene.appendChild(copy);
  help.textContent=coaching(q);
  help.setAttribute("aria-live","off");
  var answers=document.getElementById("quizAnswers");
  if(answers){
    answers.setAttribute("aria-label","Wähle deine Antwort");
    [].forEach.call(answers.querySelectorAll("button.quiz-answer"),function(btn){
      btn.setAttribute("aria-pressed","false");
      btn.addEventListener("click",function(){
        [].forEach.call(answers.querySelectorAll("button.quiz-answer"),function(b){b.setAttribute("aria-pressed",String(b===btn))});
      });
    });
  }
  var listen=document.getElementById("quizListen");
  if(listen)listen.setAttribute("aria-label","Die Frage und die Antworten noch einmal anhören");
}
function augmentDashboard(){
  var dash=document.getElementById("quizLearningDashboard");
  if(!dash||!modal.classList.contains("quiz-dashboard-mode"))return;
  if(dash.querySelector(".quiz-joy-welcome"))return;
  var first=dash.querySelector(".quiz-dash-head");
  if(!first)return;
  var panel=document.createElement("section");panel.className="quiz-joy-welcome";
  panel.setAttribute("aria-label","Dein Quiz-Abenteuer");
  var small=document.createElement("small");small.textContent="Dein Quiz-Abenteuer";
  var title=document.createElement("strong");title.textContent=band()==="4-6"?"Komm, wir entdecken!":band()==="9-10"?"Wissen macht Freude":"Entdecke, was du weißt!";
  var note=document.createElement("p");note.textContent="Jede Frage ist eine neue Gelegenheit, etwas Schönes zu lernen.";
  panel.appendChild(small);panel.appendChild(title);panel.appendChild(note);
  first.parentNode.insertBefore(panel,first);
}
function augmentLibrary(){
  var panel=document.getElementById("quizLibraryPanel");
  if(!panel||!modal.classList.contains("quiz-library-mode"))return;
  var hint=document.getElementById("quizLibraryMetaHint");
  if(hint&&hint.textContent==="Antippen = direkt testen")hint.textContent="Frage antippen und loslegen";
  var search=document.getElementById("quizLibrarySearch");
  if(search)search.setAttribute("aria-label","Nach Frage, Thema oder Nummer suchen");
}
function refresh(){
  augmentRound();augmentDashboard();augmentLibrary();
}
var scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  Promise.resolve().then(function(){scheduled=false;refresh()});
}
var observer=new MutationObserver(function(mutations){
  for(var i=0;i<mutations.length;i++){
    var m=mutations[i];
    if(m.type==="attributes"&&m.target!==modal)continue;
    if(m.type==="childList"){
      var target=m.target;
      /* Changes to added welcome/mission nodes are settled by idempotent checks. */
      if(target.closest&&target.closest(".quiz-joy-welcome,.quiz-joy-scene-copy"))continue;
    }
    schedule();break;
  }
});
observer.observe(modal,{attributes:true,attributeFilter:["class","data-quiz-band"],subtree:false});
/* The catalog/dashboard are lazy-created on first open; follow the stage for life,
   not just during a short loading timeout. */
if(stage)observer.observe(stage,{childList:true,subtree:true});
refresh();
})();