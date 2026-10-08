/* MAJLIS al-ʿILM: deterministic retrieval from approved Kids material.
   No generative claims, no invented verses, no unrestricted fatwa engine. */
import INDEX from "../kids/data/majlis-knowledge-v1.json";

const STOP=new Set(["ich","du","er","sie","wir","ihr","es","mein","meine","dein","deine","das","dies","diese","dieses","ist","sind","war","wird","wurde","und","oder","was","wer","wie","wann","wo","welche","welcher","welches","gibt","gibt es","hat","haben","dem","den","der","des","die","ein","eine","einen","einem","fur","für","an","am","im","in","mit","zur","zum","von","vom","auf","uber","über","bei","mich","mir","bitte","etwas","mochte","möchte","wissen","finden","lerne","lernen","erklart","erklärt","bedeutet","frage","fragen","mir","mehr","jetzt","denn","kommt","steht","aus","quran","koran","qurʾan","qurān","dua","duʿa","duʿā","bittgebet","vers","surah","sure","sura","sūrah","allah","allāh","erzahle","erzählen"]);
function norm(value){
 return String(value||"").normalize("NFKD").toLocaleLowerCase("de-DE")
  .replace(/[\u064B-\u065F\u0670]/g,"").replace(/[\u0300-\u036f]/g,"")
  .replace(/ß/g,"ss").replace(/ä/g,"a").replace(/ö/g,"o").replace(/ü/g,"u")
  .replace(/[\u2018\u2019ʿʾ‘’\u02bf]/g,"").replace(/[^a-z0-9\u0621-\u064a]+/g," ").replace(/\s+/g," ").trim();
}
function keywords(input){return norm(input).split(" ").filter(w=>w.length>2&&!STOP.has(w));}
function ageBounds(age){if(age==="4–5")return [4,5];if(age==="9–10")return [9,10];return [6,8];}
function available(item,age){
 const [min,max]=ageBounds(age);
 return Number(item.ageMin)<=min&&Number(item.ageMax)>=max;
}
function isDuaIntent(raw){
 const q=norm(raw);
 return /(\bdua\b|\bbittgebet\b|\bbitte\b.*\ballah\b|\barabisch\b|duʿā|دعاء|اللهم|ربنا|ربي|\bspreche\b|\blernen\b)/i.test(String(raw))||
  /\bdua\b|\bbittgebet\b|\bschutzgebet\b|\bgebet\s+vor\b/.test(q);
}
function score(query,itemText){
 const q=keywords(query),d=new Set(keywords(itemText));
 if(!q.length)return {points:0,matched:0,words:0};
 let matched=0;
 for(const t of q)if(d.has(t))matched++;
 return {points:matched/Math.max(2,q.length),matched,words:q.length};
}
function mediaForDua(row){
 if(!row||!row.audio?.arabic||!row.audio?.german||!row.audio?.slow)return null;
 if(!row.audio.arabic.startsWith("/kids/assets/kids-dua-arabic-audio/")||
    !row.audio.german.startsWith("/kids/assets/kids-dua-audio/")||
    !row.audio.slow.startsWith("/kids/assets/kids-dua-arabic-slow-audio/"))return null;
 const ref=Array.isArray(row.quranRefs)?row.quranRefs.find(v=>Number(v.surah)>0&&Number(v.ayah)>0):null;
 return {kind:"dua",id:row.id,title:row.title,arabic:row.arabic,transliteration:row.transliteration,
  meaning:row.meaning,source:row.source,audio:{arabic:row.audio.arabic,arabicSlow:row.audio.slow,german:row.audio.german},
  segments:(row.segments||[]).filter(s=>s.audioUrl?.startsWith("/kids/assets/kids-dua-word-audio/")).slice(0,30),
  quran:ref?quranMedia(ref.surah,ref.ayah):null};
}
function quranMedia(surah,ayah){
 const s=Number(surah),a=Number(ayah),counts=INDEX.quran?.ayahCounts||[];
 if(!Number.isInteger(s)||!Number.isInteger(a)||s<1||s>114||a<1||a>Number(counts[s-1]))return null;
 const global=counts.slice(0,s-1).reduce((x,y)=>x+y,0)+a;
 return {kind:"quran",surah:s,ayah:a,reference:"Qurʾān "+s+":"+a,
  reciter:"Mišārī Rāšid al-ʿAfāsī",recitationUrl:"/quran-audio/ar.alafasy/"+global+".mp3?v=1063"};
}
function profilePrefix(gender,style){
 const whom=gender==="girl"?"Schwester":"Bruder";
 return style==="unknown"?"Allāhu aʿlam – Allah weiß es am besten, liebe"+(gender==="girl"?"":"r")+" "+whom+". ":
  "Gern, mein"+(gender==="girl"?"e liebe":" lieber")+" "+whom+"! ";
}
function personalize(text,gender){
 return profilePrefix(gender)+String(text||"");
}
function undefinedAnswer(gender){
 return {id:"unknown",text:profilePrefix(gender,"unknown")+
  "Dazu habe ich im geprüften Lernkorpus keinen eindeutigen Beleg gefunden. Ich möchte nichts erfinden. Frag deine Eltern, dann könnt ihr gemeinsam nach einer zuverlässigen Quelle suchen.",source:null,media:null};
}
function findExplicitVerse(raw,gender){
 const q=norm(raw);
 // Require Qurʾān context or a conventional Sūrah:Āyah notation.
 if(!/\b(quran|koran|qur|surah|sura|sure|vers|ayah|ayat)\b/i.test(q)&&!/\b\d{1,3}\s*:\s*\d{1,3}\b/.test(raw))return null;
 const number=String(raw).match(/(?:\b(?:sura|surah|sure|sūrah)\s*)?(\d{1,3})\s*[:/]\s*(\d{1,3})\b/u);
 if(!number)return null;
 const media=quranMedia(Number(number[1]),Number(number[2]));
 if(!media)return null;
 return {id:"verse:"+media.surah+":"+media.ayah,
  text:personalize("Du meinst "+media.reference+". Du kannst die Rezitation unten direkt anhören. Den genauen arabischen Wortlaut und die Übersetzung kannst du auch im Qurʾān-Bereich öffnen. Ich dichte keinen Versinhalt dazu.",gender),
  source:media.reference,media};
}
function findDua(raw,age,gender){
 const q=keywords(raw);
 if(q.length===0)return null;
 // Phrases like "Duʿāʾ vor dem Schlafen" are precise enough, but unrelated
 // partial terms such as "Allah" never identify a Duʿāʾ.
 const wantsDua=isDuaIntent(raw);
 const normalized=norm(raw);
 let best=null;
 for(const row of INDEX.duas){
   const title=norm(row.title),meaning=norm(row.meaning),arabic=norm(row.arabic);
   const canonical=norm(row.transliteration),prompt=norm(row.childPrompt);
   const exactArabic=arabic.length>=8&&normalized.includes(arabic);
   const exactTranslit=canonical.length>=9&&normalized.includes(canonical);
   const titleHit=title.length>=7&&(normalized.includes(title)||title.includes(normalized)&&normalized.length>=7);
   let total=0;
   const rank=score(raw,[row.title,row.childPrompt,row.meaning].join(" "));
   if(exactArabic||exactTranslit)total=13;
   else if(titleHit)total=10;
   else if(wantsDua){
     total=(rank.matched>=2?5+rank.points*2:rank.matched===1?2+rank.points:0);
     // Exact named routines (sleep, wake, eating) in a Dua request
     // are unambiguous when the title contains that action.
     if(rank.matched===1&&rank.words<=2&&title.split(" ").some(w=>q.includes(w)))total=4;
   }
   if(total>=4&&(!best||total>best.total))best={row,total};
 }
 if(!best)return null;
 const row=best.row;
 if(!available(row,age))return {id:"age_restricted",text:personalize("Dieses Duʿāʾ ist für ältere Kinder freigegeben. Ich zeige dir lieber etwas Passendes für dein Alter. Frag deine Eltern nach dem passenden Lernbereich.",gender),source:null,media:null};
 const media=mediaForDua(row);
 if(!media)return null;
 const content="Hier ist die geprüfte Duʿāʾ „"+row.title+"“. Du kannst sie lesen, auf Arabisch in Fuṣḥā hören oder langsam Wort für Wort lernen. Die Bedeutung lautet: "+row.meaning;
 return {id:"kb:dua:"+row.id,text:personalize(content,gender),source:row.source,media};
}
function findQuiz(raw,age,gender){
 const q=keywords(raw);if(q.length<2)return null;
 let best=null,second=null;
 for(const row of INDEX.quiz){
   const rank=score(raw,[row.question,row.topic].join(" "));
   const question=norm(row.question),user=norm(raw);
   const exact=question===user&&user.length>=16;
   const ratio=rank.points;
   if(!exact&&!(rank.matched>=3&&ratio>=0.70))continue;
   const points=exact?20:rank.matched+ratio*3;
   if(!available(row,age))continue;
   if(!best||points>best.points){second=best;best={row,points};}
   else if(!second||points>second.points)second={row,points};
 }
 if(!best||second&&Math.abs(best.points-second.points)<0.06)return null;
 const row=best.row;
 // These snippets reuse the approved quiz's answer and explanation exactly.
 return {id:"kb:quiz:"+row.id,
   text:personalize("Unsere geprüfte Lernfrage lautet: „"+row.question+"“ Die richtige Antwort ist: "+row.correct+". "+row.explanation,gender),
   source:row.source,media:null};
}
function allahAlam(gender){return undefinedAnswer(gender);}
function findKnowledge(question,age,gender){
 const q=String(question||"").trim();
 if(!q||q.length>350)return null;
 const g=gender==="girl"?"girl":"boy";
 return findExplicitVerse(q,g)||findDua(q,age,g)||findQuiz(q,age,g)||null;
}
function findKnowledgeById(id,age,gender){
 const s=String(id||"");
 if(s.startsWith("kb:dua:")){
  const row=INDEX.duas.find(x=>x.id===s.slice(7));
  if(!row||!available(row,age))return null;
  const media=mediaForDua(row);if(!media)return null;
  return {id:s,text:personalize("Hier ist die geprüfte Duʿāʾ „"+row.title+"“. Du kannst sie lesen, auf Arabisch in Fuṣḥā hören oder langsam Wort für Wort lernen. Die Bedeutung lautet: "+row.meaning,gender),source:row.source,media};
 }
 if(s.startsWith("kb:quiz:")){
  const row=INDEX.quiz.find(x=>x.id===s.slice(8));
  if(!row||!available(row,age))return null;
  return {id:s,text:personalize("Unsere geprüfte Lernfrage lautet: „"+row.question+"“ Die richtige Antwort ist: "+row.correct+". "+row.explanation,gender),source:row.source,media:null};
 }
 if(s.startsWith("verse:")){
  const m=s.match(/^verse:(\d{1,3}):(\d{1,3})$/);
  return m?findExplicitVerse("Qurʾān "+m[1]+":"+m[2],gender):null;
 }
 return null;
}
function mediaForCanonicalId(id,age){
 const row=INDEX.duas.find(x=>String(x.canonicalId||"")===String(id));
 return row&&available(row,age)?mediaForDua(row):null;
}
export {findKnowledge,findKnowledgeById,mediaForCanonicalId,quranMedia,allahAlam,profilePrefix};
export const majlisKnowledgeTest={norm,keywords,score,findDua,findQuiz,available};