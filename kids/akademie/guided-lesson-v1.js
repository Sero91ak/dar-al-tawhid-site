/* TAWḤĪD KIDS · source-bound guided lesson V1 (draft).
 * One task at a time; no AI answers, child logging, or unreviewed audio.
 * Arabic Qurʾān / validated Hadith metadata are read from the canonical lesson.
 */
(function(root){
"use strict";
const AGES=Object.freeze(["4-5","6-8","9-10"]);
const SIDQ=Object.freeze({
 "4-5":Object.freeze({
   warmup:"Wenn du aus Versehen etwas kaputt machst: Was kannst du ehrlich sagen?",
   pause:"Erzähle mit einem Satz, was Wahrhaftigkeit bedeutet.",
   help:"Erinnere dich an eine Situation, in der du die Wahrheit gesagt hast.",
   sourceQuestion:"Was bedeutet es, mit den Wahrhaftigen zu sein?"
 }),
 "6-8":Object.freeze({
   warmup:"Du hast beim Spielen aus Versehen ein Glas umgestoßen. Wie erklärst du es ehrlich?",
   pause:"Was ist der Unterschied zwischen einem Fehler und einer Lüge?",
   help:"Ein Fehler kann aus Versehen passieren. Eine Lüge ist bewusst unwahr.",
   sourceQuestion:"Wie hängen das Qurʾān-Gebot und die Lehre des Propheten ﷺ zusammen?"
 }),
 "9-10":Object.freeze({
   warmup:"Ein Freund wird für einen Fehler beschuldigt, den du beobachtet hast. Wie kannst du wahrhaftig und gerecht reagieren?",
   pause:"Warum ist es wichtig, eine Beobachtung von einer Vermutung zu unterscheiden?",
   help:"Frage dich: Was weiß ich wirklich, und was vermute ich nur? Bleibe sachlich und suche bei Bedarf Hilfe.",
   sourceQuestion:"Was belegt Qurʾān 9:119, und was erläutert der Ḥadīṯ zu den Folgen der Wahrhaftigkeit?"
 })
});
function model({lessonId,lesson,age}={}){
 const level=AGES.includes(age)?age:"6-8";
 const sidq=lessonId==="sidq"?SIDQ[level]:null;
 const topic=typeof lesson?.topic==="string"&&lesson.topic.trim()?lesson.topic.trim():
  lessonId==="sidq"?"Wahrhaftigkeit":"das heutige Thema";
 const goal=typeof lesson?.goal==="string"?lesson.goal:"";
 const quran=lesson?.quran||null,hadith=lesson?.hadith||null;
 return Object.freeze({
  age:level,topic,
  greetingTitle:level==="4-5"?"Heute entdecken wir":"Dein Lernziel",
  greeting:goal||(level==="4-5"?"Wir hören zu und lernen etwas Neues.":"Wir hören zu, denken nach und erklären das Gelernte."),
  warmup:sidq?.warmup||(level==="4-5"?
   "Was fällt dir zu unserem Thema ein?":
   level==="6-8"?"Welche Situation aus deinem Alltag erinnert dich an "+topic+"?":
   "Welche Frage möchtest du beim Lernen über "+topic+" klären?"),
  thinkTitle:level==="4-5"?"Denk einmal nach":level==="6-8"?"Jetzt überlegst du":"Prüfe deine Überlegung",
  think:sidq?.pause||(level==="4-5"?
   "Wie kannst du das mit deinen Worten erzählen?":
   level==="6-8"?"Wie würdest du jemandem erklären, was "+topic+" bedeutet?":
   "Welche Aussage aus dem Unterricht kannst du begründen, ohne eine neue Regel zu erfinden?"),
  help:sidq?.help||(level==="4-5"?
   "Du darfst den Satz noch einmal anschauen und jemanden fragen.":
   "Lies den Erklärungssatz erneut. Welche Wörter erklären das Thema am besten?"),
  sourceQuestion:sidq?.sourceQuestion||(level==="4-5"?
   "Was haben wir aus Qurʾān und Sunnah gelernt?":
   "Was steht im Qurʾān, was berichtet die Sunnah und was ist unser Alltagsbeispiel?"),
  source: Object.freeze({
   quranLabel:typeof quran?.label==="string"?quran.label:lessonId==="sidq"?"Sūrat at-Tawbah · 9:119":"",
   quranMeaning:typeof quran?.meaning==="string"?quran.meaning:lessonId==="sidq"?"Seid mit den Wahrhaftigen.":"",
   quranExcerpt:quran?.excerpt===true,
   hadithSource:typeof hadith?.source==="string"?hadith.source:lessonId==="sidq"?"Ṣaḥīḥ Muslim, Nr. 2607a":"",
   hadithMeaning:typeof hadith?.text==="string"?hadith.text:lessonId==="sidq"?"Wahrhaftigkeit führt zur Rechtschaffenheit.":""
  }),
  automaticTruthRating:false,
  approvedVoiceForNewText:false,
  externalShare:false
 });
}
function element(tag,cls,text){
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(typeof text==="string")n.textContent=text;
 return n;
}
function card(target,heading,body,kicker){
 if(!target)return null;
 target.replaceChildren();target.classList.add("academy-guided-card");
 const k=element("span","academy-guided-kicker",kicker);
 const h=element("h3","academy-guided-heading",heading);
 const p=element("p","academy-guided-text",body);
 target.append(k,h,p);return target;
}
function mountWelcome(target,args={}){
 const p=model(args);const rootNode=card(target,p.greetingTitle,p.greeting,"DEINE LERNREISE");if(!rootNode)return null;
 const reveal=element("button","academy-guided-action","Meine Einstiegsfrage ansehen");
 reveal.type="button";reveal.setAttribute("aria-expanded","false");
 const q=element("p","academy-guided-question",p.warmup);q.hidden=true;
 reveal.addEventListener("click",()=>{q.hidden=!q.hidden;reveal.setAttribute("aria-expanded",String(!q.hidden));});
 rootNode.append(reveal,q);return p;
}
function mountThinking(target,args={}){
 const p=model(args);const rootNode=card(target,p.thinkTitle,p.think,"BEVOR DU ZUR FRAGE GEHST");if(!rootNode)return null;
 rootNode.append(element("p","academy-guided-note","Du musst hier nichts eintippen. Denke selbst nach oder sprich mit einer vertrauten Person."));
 const reveal=element("button","academy-guided-action","Gedankenhilfe anzeigen");
 reveal.type="button";reveal.setAttribute("aria-expanded","false");
 const q=element("p","academy-guided-help",p.help);q.hidden=true;
 reveal.addEventListener("click",()=>{q.hidden=!q.hidden;reveal.setAttribute("aria-expanded",String(!q.hidden));});
 rootNode.append(reveal,q);return p;
}
function mountSources(target,args={}){
 const p=model(args);const rootNode=card(target,"Woher wissen wir das?",p.sourceQuestion,"BELEGE UND ERKLÄRUNG");if(!rootNode)return null;
 rootNode.append(element("p","academy-guided-note","Qurʾān, Sunnah und unser Alltagsbeispiel sind nicht dasselbe. Sie werden im Unterricht getrennt gezeigt."));
 const sourceList=element("dl","academy-guided-source-list");
 if(p.source.quranLabel){
  sourceList.append(element("dt","","Qurʾān"),element("dd","",p.source.quranLabel+(p.source.quranExcerpt?" · arabischer Textauszug":"")));
 }
 if(p.source.hadithSource){
  sourceList.append(element("dt","","Sunnah"),element("dd","",p.source.hadithSource));
 }
 if(!sourceList.children.length)sourceList.append(element("dt","","Quellen"),element("dd","","Sieh dir die Qurʾān- und Sunnah-Quellen oben an."));
 rootNode.append(sourceList);
 return p;
}
root.DARKidsAcademyGuidedLesson=Object.freeze({version:"v1-review-20261031",model,mountWelcome,mountThinking,mountSources});
})(typeof window!=="undefined"?window:globalThis);
