(() => {
"use strict";

const WORKER_DEFAULT="https://dar-admin-publisher.sero91ak.workers.dev";
const WORKER_URL_KEY="darAdminWorkerPublishUrlV1";
const WORKER_SECRET_KEY="darAdminWorkerSecretV1";
const TARGET_VOICE="serhat-owner-voice-2026";

let manifest=null;
let current=null;
let busy=false;
let candidateBlob=null;
let candidateUrl="";
let candidateHeard=false;
let variant=0;

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
    el.textContent="Cloudflare Publisher: verbunden · nur Speichern/Veröffentlichen";
    el.style.color="var(--green)";
  }else{
    el.textContent="Cloudflare Publisher: nicht verbunden · Erzeugen/Hören lokal möglich";
    el.style.color="var(--amber)";
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
    slot.url &&
    (slot.sourceVoice==="authorized-owner-voice" || slot.voiceProfileId===TARGET_VOICE)
  );
}
function pendingList(m){return slotList(m).filter(item=>!isOwnerMaster(item))}
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
    q("alphabetPackProgress").textContent=done+" / "+all.length+" Serhat-Master bestätigt · "+(all.length-done)+" offen";
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
      current.letterId.toUpperCase()+" · "+current.label+" · Serhat-Lernstimme";
  }
  if(q("alphabetPackArabic"))q("alphabetPackArabic").textContent=current.slot?.text||"—";
  if(q("alphabetPackGenerateBtn"))q("alphabetPackGenerateBtn").disabled=false;
  clearCandidate();
}
async function fetchManifestJson(url,options={}){
  const r=await fetch(url,{cache:"no-store",...options});
  if(!r.ok)throw Error("HTTP "+r.status);
  const d=await r.json();
  if(d?.content&&typeof d.content==="string"){
    const decoded=atob(d.content.replace(/\\s+/g,""));
    const bytes=Uint8Array.from(decoded,ch=>ch.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  }
  return d;
}
async function loadManifest(){
  const errors=[];
  manifest=null;

  if(workerSecret()){
    try{
      const d=await adminApi("/api/admin/kids-alphabet-audio",{method:"GET"});
      if(d?.manifest?.letters?.alif)manifest=d.manifest;
      else throw Error("Publisher lieferte kein gültiges Alphabet-Manifest");
    }catch(e){errors.push("Publisher: "+(e?.message||String(e)))}
  }

  if(!manifest){
    try{
      const local=await fetchManifestJson("/studio/alphabet-audio.json?cb="+Date.now());
      if(local?.letters?.alif)manifest=local;
      else throw Error("lokale Manifest-Datei ist ungültig");
    }catch(e){errors.push("Lokal: "+(e?.message||String(e)))}
  }

  if(!manifest){
    try{
      const api="https://api.github.com/repos/Sero91ak/dar-al-tawhid-site/contents/test/kids/data/alphabet-audio.json?ref=main&cb="+Date.now();
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

  renderProgress();
  return manifest;
}
function nextPending(){
  if(!manifest)return null;
  return pendingList(manifest)[0]||null;
}
async function playReference(){
  if(!manifest){setMsg("Alphabet-Audio-Manifest ist noch nicht geladen.","warn");return}
  const slot=alifPronunciationReference();
  if(!slot?.url){setMsg("Alif-Aussprache-Referenz fehlt im Manifest.","bad");return}
  const p=q("alphabetPackPlayer");
  if(!p)return;
  try{
    p.pause();
    p.src=String(slot.url);
    p.hidden=false;
    p.onended=()=>setMsg("Alif-Aussprache-Referenz vollständig gehört. Jetzt Serhat-Kandidat erzeugen.","good");
    q("alphabetPackNowPlaying").textContent="Aussprache-Referenz: Alif";
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
    candidateBlob=await r.blob();
    if(!candidateBlob.size)throw Error("Leere Audiodatei erhalten.");
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
  if(!workerSecret()){
    setMsg("Cloudflare Publisher ist nicht verbunden. Stimme ist lokal erzeugt, kann aber noch nicht in die Kids-App gespeichert werden.","bad");
    publisherState();
    return;
  }

  busy=true;
  const btn=q("alphabetPackApproveBtn"),old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Master wird gespeichert …"}
  try{
    const dataUrl=await blobToDataUrl(candidateBlob);
    const id=[
      "alphabet",
      current.letterId,
      current.kind,
      current.key||"main"
    ].join("-");
    const uploaded=await adminApi("/api/admin/kids-content/media",{
      method:"POST",
      body:JSON.stringify({
        id,
        role:"audio",
        staging:true,
        dataUrl,
        originalName:id+".wav",
        source:"serhat-local-voice"
      })
    });
    const asset=uploaded?.asset;
    if(!asset?.key)throw Error("Publisher hat keinen Audio-Pfad zurückgegeben.");

    await adminApi("/api/admin/kids-alphabet-audio/verify",{
      method:"POST",
      body:JSON.stringify({
        letterId:current.letterId,
        kind:current.kind,
        key:current.key,
        text:String(current.slot?.text||""),
        asset
      })
    });

    setMsg("Bestätigt: dieser Clip ist jetzt ein fester Serhat-Master für den Kids-Lernbereich.","good");
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

q("alphabetPackReferenceBtn")?.addEventListener("click",playReference);
q("alphabetPackGenerateBtn")?.addEventListener("click",generateCandidate);
q("alphabetPackRegenerateBtn")?.addEventListener("click",regenerateCandidate);
q("alphabetPackApproveBtn")?.addEventListener("click",approveCurrent);
q("alphabetPackRetryBtn")?.addEventListener("click",retryCurrent);

loadManifest().then(()=>{
  current=nextPending();
  renderCurrent();
  if(!manifest)return;
  if(current){
    setMsg("Bereit. Alif ist als feste Aussprache-Referenz geladen. Dieser Clip wird lokal mit deiner Serhat-Stimme erzeugt. Cloudflare wird erst nach deiner Bestätigung zum Speichern verwendet.");
  }else{
    setMsg("Alle Alphabet-/Ḥarakāt-/Wort-Clips sind als Serhat-Master bestätigt. Die Alif-Aussprache-Referenz bleibt separat erhalten.","good");
  }
});
})();