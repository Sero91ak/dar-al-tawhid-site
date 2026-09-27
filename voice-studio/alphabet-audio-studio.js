(() => {
"use strict";

const WORKER_DEFAULT="https://dar-admin-publisher.sero91ak.workers.dev";
const WORKER_URL_KEY="darAdminWorkerPublishUrlV1";
const WORKER_SECRET_KEY="darAdminWorkerSecretV1";
let manifest=null;
let current=null;
let busy=false;
let arabicReferenceReady=false;
let currentRenderReferenceReady=false;

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
  const s=workerSecret();if(s)h["X-Admin-Secret"]=s;
  return h;
}
async function adminApi(path,options={}){
  const r=await fetch(workerBase()+path,{...options,headers:{...headers(),...(options.headers||{})},cache:"no-store"});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d?.ok===false)throw Error(d?.error||("HTTP "+r.status));
  return d;
}
function setMsg(text,type=""){
  const el=q("alphabetPackMessage");if(!el)return;
  el.textContent=text||"";
  el.style.color=type==="good"?"var(--green)":type==="bad"?"var(--red)":type==="warn"?"var(--amber)":"";
}
function setReferenceState(ok,detail=""){
  arabicReferenceReady=ok===true;
  const el=q("alphabetPackReferenceState");
  if(el){
    el.textContent=arabicReferenceReady
      ?"Arabische Master-Referenz: bereit · Serhat_AR_MASTER.wav"
      :"Arabische Master-Referenz: fehlt · ~/SerhatVoice/Serhat_AR_MASTER.wav";
    el.style.color=arabicReferenceReady?"var(--green)":"var(--red)";
    if(detail)el.title=detail;
  }
  return arabicReferenceReady;
}
async function refreshArabicReferenceState({quiet=false}={}){
  try{
    const r=await localRequest("/health",{method:"GET"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d?.ok===false)throw Error(d?.last_error||d?.error||("HTTP "+r.status));
    return setReferenceState(d?.reference_arabic_dedicated===true);
  }catch(e){
    setReferenceState(false,e?.message||String(e));
    if(!quiet)setMsg("Arabische Master-Referenz konnte nicht geprüft werden. Engine-Verbindung kontrollieren.","bad");
    return false;
  }
}
function requireArabicReference(){
  if(arabicReferenceReady)return true;
  throw Error("Strenger Alif-Bāʾ-Modus blockiert: geprüfte arabische Master-Referenz fehlt. Lege Serhat_AR_MASTER.wav in ~/SerhatVoice/ ab und prüfe die Engine erneut.");
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
function renderProgress(){
  const all=slotList(manifest),done=all.filter(x=>x.slot?.verified===true&&x.slot?.url).length;
  if(q("alphabetPackProgress"))q("alphabetPackProgress").textContent=done+" / "+all.length+" Clips verifiziert";
}
function renderCurrent(){
  if(!current){
    if(q("alphabetPackLabel"))q("alphabetPackLabel").textContent="Noch kein Slot gewählt";
    if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent="—";
    return;
  }
  if(q("alphabetPackLabel"))q("alphabetPackLabel").textContent=current.letterId.toUpperCase()+" · "+current.label;
  if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent=current.slot?.text||"—";
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
function nextPending(){
  const all=slotList(manifest);
  return all.find(x=>!(x.slot?.verified===true&&x.slot?.url))||null;
}
function exactTextReady(){
  return !!current&&String(q("text")?.value||"").trim()===String(current.slot?.text||"").trim();
}
async function prepareCurrent({generateNow=true}={}){
  if(!current)return;
  currentRenderReferenceReady=false;
  const refOk=await refreshArabicReferenceState({quiet:true});
  if(!refOk)requireArabicReference();
  const text=String(current.slot?.text||"").trim();
  if(!text)throw Error("Slot-Text fehlt.");
  const editor=q("text");
  editor.value=text;
  editor.dispatchEvent(new Event("input",{bubbles:true}));
  const mode=q("styleMode");
  if(mode){mode.value="kids_lesson";mode.dispatchEvent(new Event("change",{bubbles:true}))}
  if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=true;
  if(q("alphabetPackRetryBtn"))q("alphabetPackRetryBtn").disabled=false;
  setMsg("Slot geladen. Exakter arabischer Text wird erzeugt.","warn");
  if(generateNow){
    await generate();
    const refStillOk=await refreshArabicReferenceState({quiet:true});
    if(!refStillOk)throw Error("Arabische Master-Referenz war nach dem Rendern nicht mehr aktiv. Clip wird nicht zur Freigabe zugelassen.");
    currentRenderReferenceReady=true;
    if(!exactTextReady()||String(lastGeneratedText||"").trim()!==text){
      throw Error("Erzeugtes Audio gehört nicht mehr exakt zu diesem Slot.");
    }
    setMsg("Audio vollständig anhören. Erst danach freigeben.","warn");
    if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=false;
  }
}
async function startNext(){
  if(busy)return;
  busy=true;
  const btn=q("alphabetPackNextBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Wird vorbereitet …"}
  try{
    await loadManifest();
    current=nextPending();
    renderCurrent();
    if(current){
      const refOk=await refreshArabicReferenceState({quiet:true});
      if(!refOk){
        currentRenderReferenceReady=false;
        setMsg("0 ungeprüfte Fallbacks: Für Alif-Bāʾ wird zuerst eine eigene arabische Master-Referenz benötigt. Erwartet: ~/SerhatVoice/Serhat_AR_MASTER.wav","bad");
        return;
      }
    }
    if(!current){
      setMsg("Alle 140 Alif-Bāʾ-Clips sind verifiziert.","good");
      if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=true;
      if(q("alphabetPackRetryBtn"))q("alphabetPackRetryBtn").disabled=true;
      return;
    }
    await prepareCurrent({generateNow:true});
  }catch(e){
    setMsg(e.message||String(e),"bad");
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old||"Nächsten Clip erzeugen"}
    busy=false;
  }
}
function playerFullyHeard(){
  const p=q("player");
  if(!p||!Number.isFinite(Number(p.duration))||Number(p.duration)<=0)return false;
  return Boolean(p.ended)||Number(p.currentTime)>=Math.max(0,Number(p.duration)-0.15);
}
function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(String(r.result||""));
    r.onerror=()=>reject(r.error||Error("Audio konnte nicht gelesen werden."));
    r.readAsDataURL(blob);
  });
}
function mediaId(x){
  const suffix=x.kind==="harakat"?x.key:x.kind;
  return "alphabet-"+x.letterId+"-"+suffix;
}
async function approveCurrent(){
  if(busy||!current)return;
  const refOk=await refreshArabicReferenceState({quiet:true});
  if(!refOk){setMsg("Freigabe blockiert: die eigene arabische Master-Referenz ist nicht aktiv.","bad");return}
  if(!currentRenderReferenceReady){setMsg("Freigabe blockiert: dieser Clip wurde nicht nachweislich mit der aktiven arabischen Master-Referenz erzeugt. Clip neu erzeugen.","bad");return}
  if(!workerSecret()){setMsg("Publisher-Verbindung fehlt. Zuerst den Admin-Publisher verbinden.","bad");return}
  if(!exactTextReady()||String(lastGeneratedText||"").trim()!==String(current.slot?.text||"").trim()){
    setMsg("Text oder Audio wurde nach dem Rendern verändert. Clip neu erzeugen.","bad");return;
  }
  if(!lastAudio){setMsg("Für diesen Slot fehlt erzeugtes Audio.","bad");return}
  if(!playerFullyHeard()){setMsg("Clip zuerst vollständig anhören. Eine Teilwiedergabe darf nicht freigegeben werden.","bad");return}

  busy=true;
  const btn=q("alphabetPackApproveBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Wird geprüft …"}
  try{
    await confirmQA();
    if(!qaConfirmed)throw Error("Aussprache-QA wurde nicht bestätigt.");

    const pr=await localRequest("/publish-audio",{method:"GET"});
    if(!pr.ok){
      const d=await pr.json().catch(()=>({}));
      throw Error(d.error||"Kompaktes App-Audio konnte nicht erstellt werden.");
    }
    const blob=await pr.blob();
    if(!blob.size)throw Error("Leere App-Audiodatei.");

    const up=await adminApi("/api/admin/kids-content/media",{
      method:"POST",
      body:JSON.stringify({
        id:mediaId(current),
        role:"audio",
        staging:true,
        dataUrl:await blobToDataUrl(blob),
        originalName:mediaId(current)+".m4a",
        source:"serhat-alphabet-dedicated-arabic-human-reviewed"
      })
    });
    if(!up.asset?.key)throw Error("Audio-Upload lieferte keinen Asset-Pfad.");

    await adminApi("/api/admin/kids-alphabet-audio/verify",{
      method:"POST",
      body:JSON.stringify({
        letterId:current.letterId,
        kind:current.kind,
        key:current.key,
        text:String(current.slot?.text||""),
        asset:up.asset
      })
    });

    setMsg("Clip verifiziert und veröffentlicht. Nächster Slot wird vorbereitet.","good");
    await loadManifest();
    current=nextPending();
    renderCurrent();
    if(current){
      await prepareCurrent({generateNow:true});
    }else{
      setMsg("Alle 140 Alif-Bāʾ-Clips sind verifiziert.","good");
      if(q("alphabetPackRetryBtn"))q("alphabetPackRetryBtn").disabled=true;
    }
  }catch(e){
    setMsg(e.message||String(e),"bad");
  }finally{
    if(btn){btn.disabled=!current;btn.textContent=old||"Angehört & freigeben"}
    busy=false;
  }
}
function normalizedReferenceBlob(file){
  const name=String(file?.name||"").toLowerCase();
  const ext=(name.match(/\.(wav|m4a|aac|mp3)$/)||[])[1]||"";
  const fallback={wav:"audio/wav",m4a:"audio/mp4",aac:"audio/aac",mp3:"audio/mpeg"}[ext]||"";
  const mime=String(file?.type||"").toLowerCase();
  const useType=mime.indexOf("audio/")===0?mime:fallback;
  if(!useType)throw Error("Dateiformat nicht erkannt. Verwende WAV, M4A, AAC oder MP3.");
  return mime===useType?file:new Blob([file],{type:useType});
}
async function installArabicReferenceFile(file){
  if(busy||!file)return;
  if(Number(file.size||0)>32*1024*1024){setMsg("Arabische Master-Aufnahme ist größer als 32 MB.","bad");return}
  busy=true;
  const btn=q("alphabetPackReferenceBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Master wird geprüft …"}
  try{
    const dataUrl=await blobToDataUrl(normalizedReferenceBlob(file));
    const r=await localRequest("/arabic-reference",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({filename:String(file.name||"Serhat_AR_MASTER"),dataUrl})
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d?.ok===false)throw Error(d?.error||("HTTP "+r.status));
    const ready=await refreshArabicReferenceState({quiet:true});
    if(!ready)throw Error("Die Datei wurde verarbeitet, aber nicht als eigene arabische Master-Referenz erkannt.");
    currentRenderReferenceReady=false;
    const sec=Number(d?.durationSeconds||0);
    setMsg("Arabische Master-Referenz bereit"+(sec?" · "+sec.toFixed(1)+" s":"")+". Jetzt kann der erste Alif-Bāʾ-Clip streng erzeugt werden.","good");
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old||"Arabische Master-Aufnahme laden"}
    busy=false;
  }
}

async function retryCurrent(){
  if(busy||!current)return;
  currentRenderReferenceReady=false;
  busy=true;
  const btn=q("alphabetPackRetryBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Wird neu erzeugt …"}
  try{await prepareCurrent({generateNow:true})}
  catch(e){setMsg(e.message||String(e),"bad")}
  finally{if(btn){btn.disabled=false;btn.textContent=old||"Clip neu erzeugen"}busy=false}
}

q("alphabetPackNextBtn")?.addEventListener("click",startNext);
q("alphabetPackApproveBtn")?.addEventListener("click",approveCurrent);
q("alphabetPackRetryBtn")?.addEventListener("click",retryCurrent);
q("alphabetPackReferenceBtn")?.addEventListener("click",()=>q("alphabetPackReferenceFile")?.click());
q("alphabetPackReferenceFile")?.addEventListener("change",function(){
  const file=this.files&&this.files[0];
  this.value="";
  if(file)installArabicReferenceFile(file);
});
Promise.all([loadManifest(),refreshArabicReferenceState({quiet:true})]).then(()=>{
  current=nextPending();
  renderCurrent();
  if(!current){
    setMsg("Alle 140 Alif-Bāʾ-Clips sind verifiziert.","good");
  }else if(!arabicReferenceReady){
    setMsg("Produktion gesperrt, bis ~/SerhatVoice/Serhat_AR_MASTER.wav als eigene arabische Referenz erkannt wird.","bad");
  }else{
    setMsg("Nächster offener Slot ist bereit. „Nächsten Clip erzeugen“ startet die Produktion.");
  }
});
})();