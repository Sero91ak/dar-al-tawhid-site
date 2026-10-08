/* DĀR KIDS MAJLIS · common deterministic Sunnah/teaching retrieval.
   Shared unchanged by the Cloudflare Worker and the local Kids preview.
   German source translations are never passed off as Arabic original text. */
const AGES=new Set(["4–5","6–8","9–10"]);
function normalizeWords(value){
 return String(value||"").normalize("NFKD").toLowerCase()
  .replace(/[\u0300-\u036f\u064b-\u065f]/g,"").replace(/[ʿʾ‘’ʼ]/g,"")
  .replace(/ß/g,"ss").replace(/[^a-z0-9\u0621-\u064a]+/g," ")
  .replace(/\s+/g," ").trim();
}
function phraseIn(hay,phrase){
 return !!phrase&&(" "+hay+" ").includes(" "+phrase+" ");
}
function plausible(row){
 if(!row||!["hadith","early","lesson"].includes(row.kind)||
    typeof row.id!=="string"||!/^[-a-z0-9]+$/.test(row.id)||
    !row.title||!row.explanation||!row.source||
    !Array.isArray(row.ages)||!row.ages.length||
    !row.ages.every(x=>AGES.has(x))||!Array.isArray(row.triggers)||!row.triggers.length)return false;
 if(row.kind==="hadith")return row.sourceStatus==="verified"&&row.grade==="Ṣaḥīḥ"&&
   !!row.text&&/^Ṣaḥīḥ (?:al-Buḫārī|Muslim) · Nr\. \d+$/.test(row.source)&&
   (!row.id.startsWith("catalog-")||(
     /^apple-tv\/hadith\/series\/001-050\/HAD-\d{4}\.json$/.test(row.sourceCorpus||"")&&
     row.independentScholarlyAudit===false&&/^HAD-\d{4}$/.test(row.canonicalId||"")));
 if(row.kind==="early")return row.sourceStatus==="verified"&&!!row.person&&!!row.text&&
   /^Ṣaḥīḥ (?:Muslim|al-Buḫārī) · Nr\. \d+$/.test(row.source);
 return row.sourceStatus==="existing_lesson_not_independently_reaudited"&&
   Array.isArray(row.sourceRefs)&&row.sourceRefs.length>0&&
   row.sourceRefs.every(ref=>/^(Qurʾān \d|Ṣaḥīḥ (?:Muslim|al-Buḫārī) \d)/.test(ref));
}
function candidateScore(question,row){
 const q=normalizeWords(question);
 let points=0;
 for(const term of row.triggers){
  const t=normalizeWords(term);
  if(!t)continue;
  if(/^\d{1,6}$/.test(t)){
   if(/\b(hadith|hadit|hadis|buchari|bukhari|muslim|nr|nummer)\b/.test(q)&&phraseIn(q,t))
    points=Math.max(points,110);
   continue;
  }
  if(t.length>=4&&phraseIn(q,t))points=Math.max(points,20+Math.min(18,t.length)/6+t.split(" ").length*2);
 }
 const title=normalizeWords(row.title);
 if(title.length>=7&&phraseIn(q,title))points=Math.max(points,38);
 return points;
}
function address(gender){return gender==="girl"?"Gern, meine liebe Schwester! ":"Gern, mein lieber Bruder! ";}
function expose(row,age,gender){
 const safeGender=gender==="girl"?"girl":"boy";
 if(!row.ages.includes(age))return {id:"age_restricted",
  text:address(safeGender)+"Dieses Wissen ist für deine Altersstufe noch nicht freigegeben. Bitte lerne es mit deinen Eltern.",
  source:null,media:null};
 const source=String(row.source);
 let body="";
 if(row.kind==="hadith")body="In unserer Ḥadīṯ-Bibliothek findest du „"+row.title+"“. "+(row.translationLabel?.startsWith("Auszug")?"Der belegte Auszug aus der vorhandenen deutschen Übertragung lautet: ":"Die vorhandene deutsche Übertragung lautet: ")+"„"+row.text+"“ Für dich bedeutet das: "+row.explanation;
 else if(row.kind==="early")body="Von "+row.person+" ist in unserer Quellenbibliothek diese Aussage überliefert: „"+row.text+"“ Was du daraus lernen kannst: "+row.explanation;
 else body="In unserem Lernkapitel „"+row.title+"“ erklären wir: "+row.explanation+" Diese Zusammenfassung ist kein wörtliches Ḥadīṯ-Zitat. Lies die angegebenen Qurʾān- und Sunnah-Belege dazu.";
 const media={kind:row.kind,title:row.title,text:row.kind==="lesson"?null:row.text,
   explanation:row.explanation,source,sourceRefs:row.kind==="lesson"?row.sourceRefs:[],
   sourceUrl:row.sourceUrl||null,grade:row.grade||null,person:row.person||null,
   translationLabel:row.translationLabel||(row.kind==="hadith"||row.kind==="early"?"Vorhandene deutsche Übertragung":"Lernzusammenfassung")};
 return {id:"kb:sunnah:"+row.id,text:address(safeGender)+body,source,media};
}
export function findSunnahFromCorpus(question,age,gender,data){
 if(typeof question!=="string"||question.length>350||!question.trim()||
    !data||data.schemaVersion!==1||!Array.isArray(data.items)||data.items.length>200)return null;
 const scored=data.items.filter(plausible).map(row=>({row,points:candidateScore(question,row)}))
  .filter(v=>v.points>=20).sort((a,b)=>b.points-a.points);
 if(!scored.length||scored[1]&&scored[0].points-scored[1].points<2)return null;
 return expose(scored[0].row,age,gender);
}
export function findSunnahByIdFromCorpus(id,age,gender,data){
 if(typeof id!=="string"||!/^kb:sunnah:[-a-z0-9]+$/.test(id)||
    !data||data.schemaVersion!==1||!Array.isArray(data.items))return null;
 const row=data.items.find(x=>"kb:sunnah:"+x.id===id);
 return plausible(row)?expose(row,age,gender):null;
}
export const majlisSunnahTesting={normalizeWords,phraseIn,plausible,candidateScore};
