(() => {
"use strict";

const WORKER_DEFAULT="https://dar-admin-publisher.sero91ak.workers.dev";
const WORKER_URL_KEY="darAdminWorkerPublishUrlV1";
const WORKER_SECRET_KEY="darAdminWorkerSecretV1";
let manifest=null;
let current=null;
let busy=false;
let playToken=0;
let heardSourceFile="";

const q=id=>document.getElementById(id);

function workerBase(){
  try{return String(localStorage.getItem(WORKER_URL_KEY)||WORKER_DEFAULT).replace(/\/publish\/?$/,"").replace(/\/$/,"")}
  catch{return WORKER_DEFAULT}
}
function workerSecret(){
  try{return String(localStorage.getItem(WORKER_SECRET_KEY)||"").trim()}catch{return""}
}
function headers(){
  const h={"Content-Type":"application/json",Accept:"application/json"};
  const s=workerSecret();
  if(s)h["X-Admin-Secret"]=s;
  return h;
}
async function adminApi(path,options={}){
  const r=await fetch(workerBase()+path,{...options,headers:{...headers(),...(options.headers||{})},cache:"no-store"});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d?.ok===false)throw Error(d?.error||("HTTP "+r.status));
  return d;
}
function setMsg(text,type=""){
  const el=q("alphabetPackMessage");
  if(!el)return;
  el.textContent=text||"";
  el.style.color=type==="good"?"var(--green)":type==="bad"?"var(--red)":type==="warn"?"var(--amber)":"";
}
function slotList(m){
  const out=[];
  const letters=m?.letters||{};
  Object.keys(letters).forEach(letterId=>{
    const l=letters[letterId]||{};
    if(l.name)out.push({letterId,kind:"name",key:"",slot:l.name,label:"Buchstabenname"});
    ["fatha","kasra","damma"].forEach(key=>{
      if(l.harakat?.[key])out.push({letterId,kind:"harakat",key,slot:l.harakat[key],label:key==="fatha"?"Fatḥa":key==="kasra"?"Kasra":"Ḍamma"});
    });
    if(l.word)out.push({letterId,kind:"word",key:"",slot:l.word,label:"Beispielwort"});
  });
  return out;
}
function isCanonicalSeriesSource(source,m){
  const s=source||{};
  return Boolean(
    s.sourceType==="external-human-pronunciation" &&
    s.sourceProvider==="Wikimedia Commons / Escuela Internacional de Árabe" &&
    s.sourceSpeaker==="Eiarabe" &&
    s.license==="CC-BY-4.0" &&
    /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(String(s.sourcePage||"")) &&
    /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\//i.test(String(s.url||"")) &&
    /por la Escuela Internacional de Árabe\.ogg$/i.test(String(s.sourceFile||"")) &&
    String(m?.policy?.canonicalVoiceId||"")==="eiarabe-alif-2026"
  );
}
function candidateForSlot(slot,m){
  const sources=Array.isArray(slot?.alternateSources)?slot.alternateSources:[];
  return sources.find(source=>isCanonicalSeriesSource(source,m))||null;
}
function candidateList(m){
  return slotList(m).map(item=>({...item,candidate:candidateForSlot(item.slot,m)}))
    .filter(item=>item.slot?.verified!==true&&item.candidate);
}
function canonicalAnchor(){
  const slot=manifest?.letters?.alif?.name;
  if(!slot||slot.verified!==true||!slot.url||slot.voiceProfileId!=="eiarabe-alif-2026"||slot.sameVoiceConfirmed!==true)return null;
  return slot;
}
function renderProgress(){
  const all=slotList(manifest);
  const done=all.filter(x=>x.slot?.verified===true&&x.slot?.url).length;
  const candidates=candidateList(manifest).length;
  if(q("alphabetPackProgress")){
    q("alphabetPackProgress").textContent=done+" / "+all.length+" Clips freigegeben · "+candidates+" gleicher-Stimmen-Kandidat"+(candidates===1?"":"en");
  }
  const ref=q("alphabetPackReferenceState");
  if(ref){
    const anchor=canonicalAnchor();
    ref.textContent=anchor
      ?"Referenzstimme aktiv: Alif · Escuela Internacional de Árabe / Eiarabe · CC BY 4.0"
      :"Referenzstimme fehlt oder ist nicht eindeutig verifiziert.";
    ref.style.color=anchor?"var(--green)":"var(--red)";
  }
}
function renderCurrent(){
  if(!current){
    if(q("alphabetPackLabel"))q("alphabetPackLabel").textContent="Kein weiterer Kandidat derselben Stimme gefunden";
    if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent="—";
    if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=true;
    if(q("alphabetPackRetryBtn"))q("alphabetPackRetryBtn").disabled=true;
    return;
  }
  if(q("alphabetPackLabel")){
    q("alphabetPackLabel").textContent=current.letterId.toUpperCase()+" · "+current.label+" · Eiarabe-Kandidat";
  }
  if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent=current.slot?.text||"—";
  const sourceLink=q("alphabetPackSourceLink");
  if(sourceLink){
    const page=String(current.candidate?.sourcePage||"");
    sourceLink.hidden=!/^https:\/\//i.test(page);
    if(!sourceLink.hidden)sourceLink.href=page;
  }
  const playing=q("alphabetPackNowPlaying");
  if(playing)playing.textContent="Noch nichts abgespielt";
  if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=true;
  if(q("alphabetPackRetryBtn"))q("alphabetPackRetryBtn").disabled=false;
}
async function loadManifest(){
  try{
    if(workerSecret()){
      const d=await adminApi("/api/admin/kids-alphabet-audio",{method:"GET"});
      manifest=d.manifest||null;
    }else{
      const r=await fetch("/test/kids/data/alphabet-audio.json?cb="+Date.now(),{cache:"no-store"});
      if(!r.ok)throw Error("Audio-Manifest nicht erreichbar");
      manifest=await r.json();
    }
    renderProgress();
    return manifest;
  }catch(e){
    setMsg(e.message||String(e),"bad");
    return null;
  }
}
function nextCandidate(){
  return candidateList(manifest)[0]||null;
}
function playerFullyHeard(){
  const p=q("alphabetPackPlayer");
  if(!p||!Number.isFinite(Number(p.duration))||Number(p.duration)<=0)return false;
  return Boolean(p.ended)||Number(p.currentTime)>=Math.max(0,Number(p.duration)-0.15);
}
function playExternal(url,{candidate=false,label=""}={}){
  const p=q("alphabetPackPlayer");
  if(!p)throw Error("Audio-Player nicht gefunden.");
  if(!/^https:\/\//i.test(String(url||"")))throw Error("Externe Audio-URL ist ungültig.");
  const token=++playToken;
  heardSourceFile="";
  if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=true;
  try{p.pause()}catch{}
  p.src=String(url);
  p.hidden=false;
  p.load();
  p.onended=()=>{
    if(token!==playToken)return;
    if(candidate&&current?.candidate){
      heardSourceFile=String(current.candidate.sourceFile||"");
      if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=false;
      setMsg("Kandidat vollständig angehört. Wenn die Stimme wirklich der Alif-Referenz entspricht, kannst du ihn jetzt bestätigen.","good");
    }else{
      setMsg((label||"Referenz")+" vollständig angehört. Jetzt den Kandidaten direkt dagegen hören.","good");
    }
  };
  p.onerror=()=>{
    if(token!==playToken)return;
    heardSourceFile="";
    setMsg("Audio konnte nicht geladen werden.","bad");
  };
  return p.play();
}
async function playReference(){
  const anchor=canonicalAnchor();
  if(!anchor){setMsg("Die Alif-Referenz ist nicht verfügbar.","bad");return}
  try{
    await playExternal(anchor.url,{candidate:false,label:"Alif-Referenz"});
    setMsg("Alif-Referenz läuft. Danach Bāʾ direkt vergleichen.","warn");
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }
}
async function playCurrentCandidate(){
  if(!current?.candidate){setMsg("Kein Kandidat derselben Stimme vorhanden.","warn");return}
  try{
    await playExternal(current.candidate.url,{candidate:true,label:current.slot?.text||"Kandidat"});
    setMsg("Kandidat läuft. Bitte vollständig anhören und mit Alif vergleichen.","warn");
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }
}
async function startNext(){
  if(busy)return;
  busy=true;
  const btn=q("alphabetPackNextBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Wird geladen …"}
  try{
    await loadManifest();
    current=nextCandidate();
    renderCurrent();
    if(!current){
      setMsg("Aktuell gibt es keine weitere frei lizenzierte Aufnahme aus derselben Eiarabe-Serie. Andere Sprecher bleiben gesperrt.","warn");
      return;
    }
    await playCurrentCandidate();
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old||"Nächsten Kandidaten anhören"}
    busy=false;
  }
}
async function approveCurrent(){
  if(busy||!current?.candidate)return;
  if(!workerSecret()){setMsg("Publisher-Verbindung fehlt. Freigabe kann ohne Admin-Publisher nicht gespeichert werden.","bad");return}
  if(heardSourceFile!==String(current.candidate.sourceFile||"")||!playerFullyHeard()){
    setMsg("Kandidat zuerst vollständig anhören. Die Freigabe bleibt bis zum Ende der Wiedergabe gesperrt.","bad");
    return;
  }

  busy=true;
  const btn=q("alphabetPackApproveBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Wird freigegeben …"}
  try{
    await adminApi("/api/admin/kids-alphabet-audio/verify-external",{
      method:"POST",
      body:JSON.stringify({
        letterId:current.letterId,
        kind:current.kind,
        key:current.key,
        text:String(current.slot?.text||""),
        sourceFile:String(current.candidate.sourceFile||"")
      })
    });
    setMsg("Aufnahme als gleiche Alif-Stimme bestätigt und freigegeben.","good");
    heardSourceFile="";
    await loadManifest();
    current=nextCandidate();
    renderCurrent();
    if(!current){
      setMsg("Bāʾ ist übernommen. Weitere frei lizenzierte Eiarabe-Buchstaben sind derzeit nicht vorhanden; fremde Stimmen bleiben gesperrt.","good");
    }
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }finally{
    if(btn){btn.disabled=!current;btn.textContent=old||"Vollständig gehört · gleiche Stimme bestätigen"}
    busy=false;
  }
}
async function retryCurrent(){
  if(busy||!current)return;
  await playCurrentCandidate();
}

q("alphabetPackReferenceBtn")?.addEventListener("click",playReference);
q("alphabetPackNextBtn")?.addEventListener("click",startNext);
q("alphabetPackApproveBtn")?.addEventListener("click",approveCurrent);
q("alphabetPackRetryBtn")?.addEventListener("click",retryCurrent);

loadManifest().then(()=>{
  current=nextCandidate();
  renderCurrent();
  if(!canonicalAnchor()){
    setMsg("Alif-Referenz fehlt. Externe Kandidaten werden nicht freigegeben.","bad");
  }else if(current){
    setMsg("Nächster Kandidat derselben Eiarabe-Serie ist bereit. Erst Alif, dann Kandidat anhören.");
  }else{
    setMsg("Keine weitere frei lizenzierte Aufnahme derselben Eiarabe-Serie gefunden.","warn");
  }
});
})();