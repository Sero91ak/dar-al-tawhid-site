/* TAWḤĪD KIDS · Safe teach-back V1. Review-only, no audio/no tracking. */
(function(root){
 "use strict";
 const DATA={
  sidq:["Du hast aus Versehen etwas kaputt gemacht. Wie sagst du ehrlich, was passiert ist?","Warum ist Wahrhaftigkeit wichtig?"],
  "akhlaq-sabr":["Du musst auf etwas warten. Wie bleibst du geduldig und bittest bei Bedarf um Hilfe?","Bedeutet Ṣabr, dass man nicht traurig sein darf?"],
  "akhlaq-amanah":["Ein Freund leiht dir ein Buch. Wie gehst du mit diesem Vertrauen um?","Wie zeigst du Amānah bei geliehenen Dingen?"],
  "adab-salam":["Ein Freund begrüßt dich mit Salām. Wie erwiderst du seinen Gruß freundlich?","Warum erwidern wir einen guten Gruß?"],
  "adab-worte":["Du bist anderer Meinung als ein Freund. Wie antwortest du freundlich und ehrlich?","Wie kannst du widersprechen, ohne jemanden zu beleidigen?"],
  "adab-respekt":["Ein Elternteil bittet dich freundlich um eine kleine Hilfe. Wie antwortest du?","Wie kannst du respektvoll sprechen und trotzdem eigene Grenzen wahren?"],
  "fiqh-taharah":["Du möchtest dich vor dem Gebet reinigen. Welche Fragen kannst du einer Lehrperson stellen?","Ist normale Sauberkeit immer dasselbe wie rituelle Reinheit?"],
  "fiqh-wudu":["Du weißt einen Schritt bei der Gebetswaschung nicht mehr. Was machst du?","Warum sollten wir den Wuḍūʾ-Ablauf nicht selbst erfinden?"],
  "fiqh-salah":["Du möchtest beten lernen. Wie kannst du dir das Gebet zeigen lassen?","Warum ist das Vorbild des Propheten ﷺ beim Gebet wichtig?"],
  "aqidah-tawhid":["Du möchtest ein Duʿāʾ sprechen. An wen richtest du dein Bittgebet?","Was bedeutet Tawḥīd?"],
  "aqidah-iman":["Jemand fragt dich, woran Muslime glauben. Wie kannst du es erklären?","Woher lernen wir die Grundlagen des Īmān?"],
  "aqidah-ikhlas":["Du hilfst einem Menschen, obwohl niemand zuschaut. Was ist dir dabei wichtig?","Welche Rolle spielt die Absicht bei guten Taten?"]
 };
 const AGES=["4-5","6-8","9-10"];
 function plan({lessonId,lesson,age}={}){
  const level=AGES.includes(age)?age:"6-8",entry=DATA[lessonId],topic=lesson?.topic||"dein Thema";
  const scenario=entry?.[0]||"Erinnere dich an ein Beispiel zum Thema "+topic+". Was würdest du tun?";
  const question=entry?.[1]||"Wie würdest du "+topic+" einem Freund erklären?";
  return Object.freeze({level,scenario,question,
   quran:lesson?.quran?.label||(lessonId==="sidq"?"Qurʾān 9:119":""),
   hadith:lesson?.hadith?.source||(lessonId==="sidq"?"Ṣaḥīḥ Muslim 2607a":""),
   excerpt:lesson?.quran?.excerpt===true,automaticGrading:false,audioApproved:false});
 }
 function make(tag,cls,text){
  const el=document.createElement(tag);
  if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;
 }
 function mount(target,settings={}){
  if(!target)return null;
  const p=plan(settings);target.replaceChildren();target.className="academy-teach-dialog";
  target.append(make("h4","","Denk nach · Finde Belege · Frag jemanden"));
  target.append(make("p","academy-teach-note","Du darfst in Ruhe überlegen. Hier wird keine freie Antwort automatisch bewertet."));
  const controls=make("div","academy-teach-tabs");
  controls.setAttribute("role","group");controls.setAttribute("aria-label","Wissen weitergeben");
  const detail=make("section","academy-teach-detail");detail.setAttribute("aria-live","polite");
  const question=make("p","academy-teach-question"),hint=make("p","academy-teach-note");
  const evidence=make("div","academy-teach-evidence");
  const back=make("button","academy-teach-action","Die Belege im Unterricht ansehen");back.type="button";
  back.addEventListener("click",()=>{if(typeof settings.onEvidence==="function")settings.onEvidence();});
  const parent=make("div","academy-teach-parent");
  const reveal=make("button","academy-teach-action","Für Eltern: TAWḤĪD KIDS entdecken");reveal.type="button";
  reveal.setAttribute("aria-expanded","false");
  const panel=make("div","academy-teach-parent-panel");panel.hidden=true;
  panel.append(make("p","","Ihr könnt euch die Lernakademie gemeinsam ansehen. Es werden keine Kinderantworten oder Lernstände geteilt."));
  const link=make("a","academy-teach-link","TAWḤĪD KIDS gemeinsam öffnen");link.href="/kids/";link.rel="noreferrer";panel.append(link);
  reveal.addEventListener("click",()=>{panel.hidden=!panel.hidden;reveal.setAttribute("aria-expanded",String(!panel.hidden));});
  parent.append(reveal,panel);
  const labels=["Nachdenken","Woher weiß ich das?","Frag jemanden"];
  const tabs=labels.map((label,index)=>{
   const b=make("button","academy-teach-tab",label);b.type="button";
   b.addEventListener("click",()=>show(index));controls.append(b);return b;
  });
  detail.append(question,hint,evidence,back,parent);target.append(controls,detail);
  function show(index){
   tabs.forEach((b,i)=>b.setAttribute("aria-pressed",String(i===index)));
   evidence.replaceChildren();evidence.hidden=index!==1;back.hidden=index!==1;parent.hidden=index!==2;
   question.textContent=index===0?p.scenario:index===1?"Welche Belege wurden in dieser Lektion genannt?":p.question;
   hint.textContent=index===0?p.level==="4-5"?"Erzähle einem vertrauten Menschen, was du denkst.":"Überlege, welche Antwort zum Unterricht passt, und begründe sie.":
    index===1?"Schau den dritten Unterrichtsschritt zusammen mit einer vertrauten erwachsenen Person an.":
    "Stelle deine Frage einem vertrauten Menschen. Hört euch gegenseitig zu und schaut bei Unsicherheit gemeinsam die Belege nach.";
   if(index===1){
    if(p.quran)evidence.append(make("p","","Qurʾān: "+p.quran+(p.excerpt?" (arabischer Textauszug)":"")));
    if(p.hadith)evidence.append(make("p","","Sunnah: "+p.hadith));
    if(!p.quran&&!p.hadith)evidence.append(make("p","","Die Quellen findest du im dritten Unterrichtsschritt."));
   }
  }
  show(0);return p;
 }
 root.DARKidsAcademyTeachBack=Object.freeze({version:"v1-20261031-review",plan,mount,curatedIds:Object.freeze(Object.keys(DATA))});
})(typeof window!=="undefined"?window:globalThis);
