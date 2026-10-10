/* DĀR AL TAWḤĪD KIDS Academy V11: sequential school-mode progression.
 * Each learner has ONE unfinished lesson. Future subjects show titles only.
 * Same-device progress is profile+age scoped. No claim of cloud syncing.
 * Workdays Mon/Tue/Thu/Fri unlock one NEW lesson after previous completion;
 * Wed/Sat are review, Sun is voluntary; no shortcut via direct deep links.
 */
(function(root){
 "use strict";
 const WEEK=Object.freeze({
  0:{mode:"free",label:"Freies Lernen oder Pause"},
  1:{mode:"new",label:"Neues Thema"},
  2:{mode:"new",label:"Neues Thema"},
  3:{mode:"review",label:"Wiederholung"},
  4:{mode:"new",label:"Neues Thema"},
  5:{mode:"new",label:"Neues Thema"},
  6:{mode:"review",label:"Wiederholung"}
 });
 function dayKey(date){
  const d=date instanceof Date?date:new Date(date);
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
 }
 function sequence(topics){
  const groups=["akhlaq","adab","fiqh","aqidah"],ordered=[],seen=new Set();
  const lists=groups.map(g=>topics[g]||[]);
  for(let i=0;i<Math.max(...lists.map(a=>a.length));i++){
   for(const group of lists){
    const id=group[i];
    if(id&&!seen.has(id)){seen.add(id);ordered.push(id)}
   }
  }
  return ordered;
 }
 function evaluate({topics,records={},drafts={},now=new Date(),forceFirst=true}){
  const ids=sequence(topics);
  const date=now instanceof Date?now:new Date(now);
  const today=dayKey(date), weekday=date.getDay(),mode=WEEK[weekday].mode;
  const complete=ids.filter(x=>!!records[x]);
  const fresh=ids.find(x=>!records[x])||null;
  const firstIndex=fresh?ids.indexOf(fresh):-1;
  const prerequisite=firstIndex>0?ids[firstIndex-1]:null;
  const prerequisiteRecord=prerequisite?records[prerequisite]:null;
  const previousAt=Number(prerequisiteRecord?.firstCompletedAt||prerequisiteRecord?.completedAt||0);
  const previousDay=previousAt>0?dayKey(new Date(previousAt)):null;
  const hasPrior=firstIndex===0||!!prerequisiteRecord;
  const newDay=firstIndex===0||(previousDay!==null&&today>previousDay);
  // A child's first class can start immediately on any weekday.
  const canOpenNew=!!fresh&&hasPrior&&newDay&&(firstIndex===0&&forceFirst||mode==="new");
  // One grandfathered unfinished pre-V11 draft may always be resumed,
  // never several independent drafts: preserve learning without mass unlock.
  const existingDrafts=ids.map(x=>({id:x,d:drafts[x]}))
   .filter(x=>!records[x.id]&&x.d&&Number.isFinite(Number(x.d.savedAt))&&Number(x.d.savedAt)>0
     &&Number(x.d.savedAt)<=date.getTime()
     /* previously started class remains resumable indefinitely */
     &&(Number(x.d.step)>0||Number(x.d.qIndex)>0))
   .sort((a,b)=>Number(b.d.savedAt)-Number(a.d.savedAt));
  const resumeId=existingDrafts[0]?.id||null;
  const nextId=resumeId||fresh;
  const accessibleNew=resumeId||canOpenNew?nextId:null;
  const due=complete.filter(x=>Number(records[x].nextDue)>0&&Number(records[x].nextDue)<=date.getTime())
   .sort((a,b)=>Number(records[a].nextDue)-Number(records[b].nextDue));
  const reviewId=due[0]||complete.slice().sort((a,b)=>Number(records[a]?.completedAt||0)-Number(records[b]?.completedAt||0))[0]||null;
  const recommendation=accessibleNew||reviewId||null;
  const kind=accessibleNew?"new":due.length?"due":reviewId?"review":fresh?"locked":"none";
  function access(lessonId){
   if(!ids.includes(lessonId))return "unknown";
   if(records[lessonId])return "review";
   if(lessonId===accessibleNew)return resumeId===lessonId?"resume":"new";
   return "locked";
  }
  return {ids,today,mode,weekday,completed:complete.length,total:ids.length,upcoming:fresh,
   active:accessibleNew,resumeId,canOpenNew,recommendation,kind,dueCount:due.length,
   nextUnlockHint:mode==="new"&&!newDay?"Nach Abschluss frühestens am nächsten neuen Unterrichtstag":
    mode!=="new"&&firstIndex>0?"Am nächsten neuen Unterrichtstag (Mo, Di, Do oder Fr)":"Nach Abschluss der vorherigen Lektion",
   access};
 }
 root.DARKidsAcademySchool=Object.freeze({version:"v11-20261010",WEEK,dayKey,sequence,evaluate});
})(typeof window!=="undefined"?window:globalThis);
