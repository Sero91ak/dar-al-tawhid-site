(() => {
"use strict";

const WORKER_DEFAULT="https://dar-admin-publisher.sero91ak.workers.dev";
const WORKER_URL_KEY="darAdminWorkerPublishUrlV1";
const WORKER_SECRET_KEY="darAdminWorkerSecretV1";
const TARGET_VOICE="serhat-owner-voice-2026";
const ALPHABET_GENERATION_PROFILE="fusha-strict-v2";

let manifest=null;
let current=null;
let busy=false;
let candidateBlob=null;
let candidateUrl="";
let candidateHeard=false;
let candidatePreviewId="";
let candidateExistingMaster=false;
let variant=0;
let batchPollTimer=0;
let batchAutoStarted=false;

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
  const r=await fetch(workerBase()+path,{
    ...options,
    headers:{...headers(),...(options.headers||{})},
    cache:"no-store"
  });
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
function publisherState(){
  const el=q("alphabetPublisherState");
  if(!el)return;
  if(workerSecret()){
    el.textContent="Cloudflare Publisher: optional eingerichtet · nicht für Alif–Yāʾ-Master nötig";
    el.style.color="var(--muted)";
  }else{
    el.textContent="Alif–Yāʾ arbeitet lokal · kein Cloudflare-/GitHub-Code erforderlich";
    el.style.color="var(--green)";
  }
}
function slotList(m){
  const out=[];
  const letters=m?.letters||{};
  Object.keys(letters).forEach(letterId=>{
    const l=letters[letterId]||{};
    if(l.name)out.push({letterId,kind:"name",key:"",slot:l.name,label:"Buchstabenname"});
    ["fatha","kasra","damma"].forEach(key=>{
      if(l.harakat?.[key])out.push({
        letterId,kind:"harakat",key,slot:l.harakat[key],
        label:key==="fatha"?"Fatḥah":key==="kasra"?"Kasrah":"Ḍammah"
      });
    });
    if(l.word)out.push({letterId,kind:"word",key:"",slot:l.word,label:"Beispielwort"});
  });
  return out;
}
function isOwnerMaster(item){
  const slot=item?.slot||{};
  return Boolean(
    slot.verified===true &&
    slot.linguisticVerified===true &&
    slot.url &&
    (slot.sourceVoice==="authorized-owner-voice" || slot.voiceProfileId===TARGET_VOICE)
  );
}
function pendingList(m){return slotList(m).filter(item=>!isOwnerMaster(item))}
function slotForMaster(m,master){
  const letter=m?.letters?.[master?.letterId];
  if(!letter)return null;
  if(master.kind==="name")return letter.name||null;
  if(master.kind==="word")return letter.word||null;
  if(master.kind==="harakat")return letter.harakat?.[master.key]||null;
  return null;
}
async function applyLocalMasters(){
  if(!manifest)return;
  try{
    const r=await fetch("/alphabet/state?cb="+Date.now(),{cache:"no-store"});
    if(!r.ok)return;
    const d=await r.json();
    for(const master of (d?.masters||[])){
      const slot=slotForMaster(manifest,master);
      if(!slot)continue;
      const linguisticVerified=master?.linguisticVerified===true;
      Object.assign(slot,{
        verified:linguisticVerified,
        linguisticVerified,
        technicalQaPassed:true,
        reviewStatus:linguisticVerified?"approved":"needs-human-review",
        sourceVoice:"authorized-owner-voice",
        voiceProfileId:TARGET_VOICE,
        sourceType:"local-owner-candidate",
        localMaster:true,
        localMasterUrl:String(master.url||""),
        localMasterFilename:String(master.filename||""),
        localMasterConfirmedAt:String(master.confirmedAt||""),
        reviewedAt:String(master.reviewedAt||"")
      });
      if(linguisticVerified&&master.url)slot.url=String(master.url);
    }
  }catch{}
}
function alifPronunciationReference(){
  const policyUrl=String(manifest?.policy?.pronunciationReferenceUrl||"").trim();
  if(policyUrl){
    return {
      url:policyUrl,
      text:String(manifest?.policy?.canonicalVoiceAnchorText||"أَلِف"),
      sourceType:"external-human-pronunciation",
      sourceProvider:String(manifest?.policy?.canonicalVoiceLabel||"Eiarabe Alif")
    };
  }
  const slot=manifest?.letters?.alif?.name;
  if(!slot?.url)return null;
  return slot;
}
function clearCandidate(){
  candidateHeard=false;
  candidatePreviewId="";
  candidateExistingMaster=false;
  candidateBlob=null;
  if(candidateUrl){URL.revokeObjectURL(candidateUrl);candidateUrl=""}
  const p=q("alphabetPackPlayer");
  if(p){try{p.pause()}catch{};p.removeAttribute("src");p.hidden=true}
  const approve=q("alphabetPackApproveBtn");
  if(approve)approve.disabled=true;
  const retry=q("alphabetPackRetryBtn");
  if(retry)retry.disabled=true;
  const now=q("alphabetPackNowPlaying");
  if(now)now.textContent="Noch kein Serhat-Kandidat erzeugt";
}
function renderProgress(){
  if(!manifest){
    if(q("alphabetPackProgress"))q("alphabetPackProgress").textContent="Alphabet-Audio-Manifest nicht geladen";
    const ref=q("alphabetPackReferenceState");
    if(ref){
      ref.textContent="Alif-Aussprache-Referenz wartet auf das Manifest.";
      ref.style.color="var(--amber)";
    }
    publisherState();
    return;
  }
  const all=slotList(manifest);
  const done=all.filter(isOwnerMaster).length;
  if(q("alphabetPackProgress")){
    q("alphabetPackProgress").textContent=done+" / "+all.length+" sprachlich bestätigt · "+(all.length-done)+" prüfen";
  }
  const ref=q("alphabetPackReferenceState");
  if(ref){
    const anchor=alifPronunciationReference();
    ref.textContent=anchor
      ?"Aussprache-Referenz: Alif · Eiarabe. Zielstimme: Serhat Abu Malik."
      :"Alif-Aussprache-Referenz fehlt.";
    ref.style.color=anchor?"var(--green)":"var(--amber)";
  }
  publisherState();
}
function renderCurrent(){
  if(!manifest){
    if(q("alphabetPackLabel"))q("alphabetPackLabel").textContent="Alphabet-Audio-Manifest nicht geladen";
    if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent="!";
    if(q("alphabetPackGenerateBtn"))q("alphabetPackGenerateBtn").disabled=true;
    if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=true;
    if(q("alphabetPackRetryBtn"))q("alphabetPackRetryBtn").disabled=true;
    return;
  }
  if(!current){
    if(q("alphabetPackLabel"))q("alphabetPackLabel").textContent="Alphabet-Audio-Pack vollständig";
    if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent="✓";
    if(q("alphabetPackGenerateBtn"))q("alphabetPackGenerateBtn").disabled=true;
    if(q("alphabetPackApproveBtn"))q("alphabetPackApproveBtn").disabled=true;
    return;
  }
  if(q("alphabetPackLabel")){
    q("alphabetPackLabel").textContent=
      current.letterId.toUpperCase()+" · "+current.label+" · sprachliche Prüfung";
  }
  if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent=current.slot?.text||"—";
  if(q("alphabetPackGenerateBtn"))q("alphabetPackGenerateBtn").disabled=false;
  const refBtn=q("alphabetPackReferenceBtn");
  const ref=currentPronunciationReference();
  if(refBtn){
    refBtn.disabled=!ref;
    refBtn.textContent=ref?"Menschliche Referenz hören":"Keine Referenz hinterlegt";
  }
  clearCandidate();
  if(current.slot?.localMasterUrl){
    loadExistingMasterCandidate();
  }
}
async function fetchManifestJson(url,options={}){
  const r=await fetch(url,{cache:"no-store",...options});
  if(!r.ok)throw Error("HTTP "+r.status);
  const d=await r.json();
  if(d?.content&&typeof d.content==="string"){
    const decoded=atob(d.content.replace(/\s+/g,""));
    const bytes=Uint8Array.from(decoded,ch=>ch.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  }
  return d;
}
async function loadManifest(){
  const errors=[];
  manifest=null;

  try{
    const local=await fetchManifestJson("/studio/alphabet-audio.json?cb="+Date.now());
    if(local?.letters?.alif)manifest=local;
    else throw Error("lokale Manifest-Datei ist ungültig");
  }catch(e){errors.push("Lokal: "+(e?.message||String(e)))}

  if(!manifest){
    try{
      const api="https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/kids/data/alphabet-audio.json?ref=main&cb="+Date.now();
      const remote=await fetchManifestJson(api,{
        headers:{Accept:"application/vnd.github.raw+json"}
      });
      if(remote?.letters?.alif)manifest=remote;
      else throw Error("GitHub lieferte kein gültiges Alphabet-Manifest");
    }catch(e){errors.push("GitHub: "+(e?.message||String(e)))}
  }

  if(!manifest){
    renderProgress();
    setMsg("Alphabet-Audio-Manifest konnte nicht geladen werden. "+errors.join(" · "),"bad");
    return null;
  }

  await applyLocalMasters();
  renderProgress();
  return manifest;
}
function nextPending(){
  if(!manifest)return null;
  return pendingList(manifest)[0]||null;
}
function currentPronunciationReference(){
  if(current?.slot){
    const alts=Array.isArray(current.slot.alternateSources)?current.slot.alternateSources:[];
    const ext=alts.find(a=>
      String(a?.sourceType||"").startsWith("external-") &&
      String(a?.url||"").trim()
    );
    if(ext)return ext;
  }
  if(current?.letterId==="alif"&&current?.kind==="name"){
    return alifPronunciationReference();
  }
  return null;
}
async function loadExistingMasterCandidate(){
  if(!current?.slot?.localMasterUrl)return;
  try{
    const r=await fetch(String(current.slot.localMasterUrl),{cache:"no-store"});
    if(!r.ok)throw Error("Lokaler Serhat-Kandidat konnte nicht geladen werden.");
    candidateBlob=await r.blob();
    if(!candidateBlob.size)throw Error("Lokaler Serhat-Kandidat ist leer.");
    candidateExistingMaster=true;
    candidatePreviewId="";
    candidateUrl=URL.createObjectURL(candidateBlob);
    const p=q("alphabetPackPlayer");
    if(!p)return;
    p.src=candidateUrl;
    p.hidden=false;
    p.onended=()=>{
      candidateHeard=true;
      q("alphabetPackApproveBtn").disabled=false;
      setMsg("Bestehenden Serhat-Clip vollständig gehört. Nur bei sprachlich korrekter Aussprache bestätigen.","warn");
    };
    p.onerror=()=>setMsg("Bestehender Serhat-Clip konnte nicht abgespielt werden.","bad");
    q("alphabetPackRetryBtn").disabled=false;
    q("alphabetPackNowPlaying").textContent="Vorhandener Serhat-Clip · sprachlich noch nicht bestätigt";
    setMsg("Dieser Clip hat nur technische QA bestanden. Bitte anhören; bei Fehlern eine neue Variante erzeugen.","warn");
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }
}

async function playReference(){
  if(!manifest){setMsg("Alphabet-Audio-Manifest ist noch nicht geladen.","warn");return}
  const slot=currentPronunciationReference();
  if(!slot?.url){
    setMsg("Für diesen Clip ist noch keine externe menschliche Aussprache-Referenz hinterlegt.","warn");
    return;
  }
  const p=q("alphabetPackPlayer");
  if(!p)return;
  try{
    p.pause();
    p.src=String(slot.url);
    p.hidden=false;
    p.onended=()=>setMsg("Menschliche Aussprache-Referenz vollständig gehört. Jetzt mit dem Serhat-Clip vergleichen.","good");
    q("alphabetPackNowPlaying").textContent="Menschliche Aussprache-Referenz · "+String(slot.sourceProvider||"Arabisch");
    await p.play();
  }catch(e){setMsg(e?.message||String(e),"bad")}
}
async function generateCandidate(){
  if(busy||!current)return;
  busy=true;
  const btn=q("alphabetPackGenerateBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Serhat-Stimme wird erzeugt …"}
  try{
    clearCandidate();
    candidateExistingMaster=false;
    const slotId=[current.letterId,current.kind,current.key||"main"].join("-");
    const r=await fetch("/alphabet/preview",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        text:String(current.slot?.text||""),
        slotId,
        variant
      }),
      cache:"no-store"
    });
    if(!r.ok){
      const d=await r.json().catch(()=>({}));
      throw Error(d.error||"Serhat-Kandidat konnte nicht erzeugt werden.");
    }
    candidatePreviewId=String(r.headers.get("X-Alphabet-Preview-Id")||"").trim();
    candidateBlob=await r.blob();
    if(!candidateBlob.size)throw Error("Leere Audiodatei erhalten.");
    if(!candidatePreviewId)throw Error("Serhat-Kandidat hat keine lokale Bestätigungs-ID erhalten.");
    candidateUrl=URL.createObjectURL(candidateBlob);
    const p=q("alphabetPackPlayer");
    p.src=candidateUrl;p.hidden=false;
    p.onended=()=>{
      candidateHeard=true;
      q("alphabetPackApproveBtn").disabled=false;
      setMsg("Serhat-Kandidat vollständig gehört. Wenn Aussprache und Stimme stimmen, jetzt als Master bestätigen.","good");
    };
    p.onerror=()=>setMsg("Serhat-Kandidat konnte nicht abgespielt werden.","bad");
    q("alphabetPackRetryBtn").disabled=false;
    q("alphabetPackNowPlaying").textContent="Serhat-Kandidat · Variante "+(variant+1);
    setMsg("Kandidat erzeugt. Bitte vollständig anhören.","warn");
    await p.play().catch(()=>{});
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old||"Serhat-Kandidat erzeugen"}
    busy=false;
  }
}
async function regenerateCandidate(){
  variant=(variant+1)%20;
  await generateCandidate();
}
function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(Error("Audio konnte nicht für den Publisher vorbereitet werden."));
    reader.onload=()=>resolve(String(reader.result||""));
    reader.readAsDataURL(blob);
  });
}
async function approveCurrent(){
  if(busy||!current||!candidateBlob)return;
  if(!candidateHeard){
    setMsg("Bitte den Serhat-Kandidaten zuerst vollständig anhören.","warn");
    return;
  }
  if(!candidateExistingMaster&&!candidatePreviewId){
    setMsg("Lokale Bestätigungs-ID fehlt. Bitte Kandidat neu erzeugen.","bad");
    return;
  }

  busy=true;
  const btn=q("alphabetPackApproveBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Master wird lokal gespeichert …"}
  try{
    const slotId=[current.letterId,current.kind,current.key||"main"].join("-");
    const endpoint=candidateExistingMaster?"/alphabet/review-approve":"/alphabet/confirm";
    const payload=candidateExistingMaster
      ?{slotId}
      :{
          previewId:candidatePreviewId,
          slotId,
          letterId:current.letterId,
          kind:current.kind,
          key:current.key||"",
          text:String(current.slot?.text||"")
        };
    const r=await fetch(endpoint,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload),
      cache:"no-store"
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d?.ok===false)throw Error(d?.error||"Serhat-Master konnte lokal nicht gespeichert werden.");

    setMsg("Sprachlich bestätigt: Dieser Serhat-Clip ist jetzt als Lern-Master freigegeben.","good");
    variant=0;
    await loadManifest();
    current=nextPending();
    renderCurrent();
  }catch(e){
    setMsg(e?.message||String(e),"bad");
  }finally{
    if(btn){btn.textContent=old||"Als Serhat-Master bestätigen";btn.disabled=!candidateHeard}
    busy=false;
  }
}
async function retryCurrent(){
  const p=q("alphabetPackPlayer");
  if(!candidateUrl||!p){setMsg("Zuerst einen Serhat-Kandidaten erzeugen.","warn");return}
  candidateHeard=false;
  q("alphabetPackApproveBtn").disabled=true;
  p.src=candidateUrl;p.hidden=false;
  p.onended=()=>{
    candidateHeard=true;
    q("alphabetPackApproveBtn").disabled=false;
    setMsg("Kandidat vollständig gehört. Bei korrekter Aussprache bestätigen.","good");
  };
  q("alphabetPackNowPlaying").textContent="Serhat-Kandidat erneut";
  await p.play().catch(()=>{});
}


function isLocalVoiceStudio(){
  return /^(127\.0\.0\.1|localhost)$/i.test(location.hostname||"");
}
function setBatchUi(state){
  const btn=q("alphabetPackBatchBtn");
  const line=q("alphabetPackBatchState");
  const running=Boolean(state?.running);
  if(btn){
    btn.disabled=running;
    btn.textContent=running
      ?"Fuṣḥā-Paket wird neu erzeugt …"
      :"Fuṣḥā-Alphabet + Quiz erzeugen";
  }
  if(!line)return;

  const progress=Math.max(0,Math.min(100,Number(state?.progress||0)));
  const completed=Number(state?.completed||0);
  const total=Number(state?.total||141);
  const phase=String(state?.phase||"idle");
  const current=String(state?.current||"").trim();
  const error=String(state?.error||"").trim();

  if(error){
    line.textContent="Automatik gestoppt: "+error;
    line.style.color="var(--red)";
    return;
  }
  if(running){
    line.textContent=progress+" % · "+completed+"/"+total+" · "+(current||"Serhat Engine arbeitet …");
    line.style.color="var(--gold2)";
    return;
  }
  if(phase==="complete"){
    const published=Boolean(state?.repoPublished);
    const publishMsg=String(state?.repoPublishMessage||state?.repoPublishError||"").trim();
    line.textContent=published
      ?"Fertig: Fuṣḥā-Alphabet, Quiz und Begrüßung wurden mit deiner Serhat-Stimme erzeugt und direkt in die Kids-App übertragen. Duʿāʾ, Wissen und Kurzgeschichten laufen separat über den automatischen Kids-Voice-Sync."
      :"Audio-Paket vollständig erzeugt. "+(publishMsg||"Der automatische GitHub-Push ist auf diesem Mac noch nicht angemeldet.");
    line.style.color=published?"var(--green)":"var(--amber)";
    return;
  }
  line.textContent="Bereit: Fuṣḥā-Strengmodus erzeugt alle 140 Alphabet-Kandidaten mit der aktuellen Aussprache-Engine neu.";
  line.style.color="var(--muted)";
}
async function readBatchState(){
  try{
    const r=await fetch("/alphabet/batch-state?cb="+Date.now(),{cache:"no-store"});
    if(!r.ok)return null;
    const d=await r.json();
    setBatchUi(d);
    return d;
  }catch{return null}
}
function stopBatchPolling(){
  if(batchPollTimer){clearInterval(batchPollTimer);batchPollTimer=0}
}
function beginBatchPolling(){
  stopBatchPolling();
  batchPollTimer=setInterval(async()=>{
    const state=await readBatchState();
    if(!state)return;
    if(!state.running){
      stopBatchPolling();
      if(state.phase==="complete"){
        await loadManifest();
        current=nextPending();
        renderCurrent();
      }
    }
  },1800);
}
async function startFullBatch(auto=false){
  if(!isLocalVoiceStudio()){
    if(!auto)setMsg("Der automatische 140-Clip-Batch läuft nur in der installierten Mac-App.","warn");
    return;
  }
  if(busy)return;
  try{
    const r=await fetch("/alphabet/batch-start",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:"{}",
      cache:"no-store"
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d?.ok===false)throw Error(d?.error||"Komplettes Serhat-Paket konnte nicht gestartet werden.");
    setBatchUi(d);
    setMsg(
      "Fuṣḥā-Neuerzeugung läuft: Alle 140 Alphabet-Kandidaten werden mit der aktuellen Strenglogik neu erstellt; alte Kandidaten aus früheren Engines werden nicht wiederverwendet. Quiz und Begrüßung bleiben in diesem Paket. Duʿāʾ, Wissen und Kurzgeschichten werden unabhängig davon automatisch vom Kids-Voice-Sync ergänzt.",
      "good"
    );
    beginBatchPolling();
  }catch(e){
    if(!auto)setMsg(e?.message||String(e),"bad");
  }
}
async function maybeAutoStartFullBatch(){
  if(batchAutoStarted||!isLocalVoiceStudio()||!manifest)return;
  batchAutoStarted=true;

  // 2.9.64: NIEMALS mehr beim Öffnen des Studios automatisch 140/226
  // Sprachclips erzeugen. Dieser frühere Auto-Start belegte die einzige lokale
  // Synthese-Engine und ließ Wort-Schnelltest, Freistimme und "Audio erzeugen"
  // wie eingefroren wirken. Ein Gesamtbatch startet ausschließlich nach dem
  // bewussten Klick auf den Batch-Button.
  const state=await readBatchState();
  if(state?.running){
    setMsg("Ein zuvor bewusst gestarteter Alphabet-/Quiz-Batch läuft. Interaktive Sprachaufträge haben Vorrang.","warn");
    beginBatchPolling();
    return;
  }
}

q("alphabetPackReferenceBtn")?.addEventListener("click",playReference);
q("alphabetPackGenerateBtn")?.addEventListener("click",generateCandidate);
q("alphabetPackRegenerateBtn")?.addEventListener("click",regenerateCandidate);
q("alphabetPackApproveBtn")?.addEventListener("click",approveCurrent);
q("alphabetPackRetryBtn")?.addEventListener("click",retryCurrent);
q("alphabetPackBatchBtn")?.addEventListener("click",()=>startFullBatch(false));

loadManifest().then(()=>{
  current=nextPending();
  renderCurrent();
  if(!manifest)return;
  if(current){
    setMsg("Fuṣḥā-Strengmodus aktiv. Kandidaten aus älteren Alphabet-Engines werden automatisch neu erzeugt; nur Kandidaten aus "+ALPHABET_GENERATION_PROFILE+" dürfen wiederverwendet werden.");
  }else{
    setMsg("Alle Alphabet-/Ḥarakāt-/Wort-Clips sind sprachlich bestätigt. Die Aussprache-Referenzen bleiben separat erhalten.","good");
  }
  readBatchState().then(state=>{
    if(state?.running)beginBatchPolling();
    maybeAutoStartFullBatch();
  });
});
})();

