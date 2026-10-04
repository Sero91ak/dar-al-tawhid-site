/* Voice Studio 2.9.78 · page-focused navigation */
(() => {
"use strict";

const WORKER_DEFAULT="https://dar-admin-publisher.sero91ak.workers.dev";
const WORKER_URL_KEY="darAdminWorkerPublishUrlV1";
const WORKER_SECRET_KEY="darAdminWorkerSecretV1";
const STUDIO_DRAFT_KEY="darVoiceContentStudioDraftV1";

let studioKind="story";
let contentId="";
let savedRevision=0;
let stagingPublished=false;
let coverFile=null;
let coverRemoteUrl="";
let coverAsset=null;
let audioAsset=null;
let contentStatus="draft";
let productionPhase="draft";
let productionError="";
let quizDraft=[];
let gameDraft={type:"choice",summary:"",instructions:"",voiceCues:[]};
let legacyQuestion={};
let legacyClaimIds=[];
let legacyTags=[];
let inventoryState={legacy:[],staging:[],live:[]};
let busy=false;

function q(id){return document.getElementById(id)}
const KIDS_STORY_STANDARD_VERSION="kids-story-greeting-closing-v1";
const KIDS_STORY_INTRO="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh, liebe Kinder.";
const KIDS_STORY_OUTRO="Und الله weiß es am besten.\n\nMöge الله euch nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses, schenken.\n\nAs-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
function normalizeKidsStoryText(value){
  let text=String(value||"").trim();
  if(!text)return "";
  if(!text.startsWith(KIDS_STORY_INTRO))text=KIDS_STORY_INTRO+"\n\n"+text;
  if(!text.endsWith(KIDS_STORY_OUTRO))text=text+"\n\n"+KIDS_STORY_OUTRO;
  return text;
}
function syncKidsStoryStandard(){
  const ta=q("text");
  if(!ta||q("styleMode")?.value!=="kids_story")return false;
  const next=normalizeKidsStoryText(ta.value);
  if(!next||next===String(ta.value||"").trim())return false;
  ta.value=next;
  ta.dispatchEvent(new Event("input",{bubbles:true}));
  return true;
}
window.normalizeKidsStoryText=normalizeKidsStoryText;
window.KIDS_STORY_STANDARD_VERSION=KIDS_STORY_STANDARD_VERSION;
document.addEventListener("click",event=>{
  const id=event.target?.id||"";
  if(["generateBtn","analyzeBtn","csProduce","csQuickProduce","csSave","csPublishTest","csPublishLive"].includes(id))syncKidsStoryStandard();
},true);
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function workerBase(){
  try{return String(localStorage.getItem(WORKER_URL_KEY)||WORKER_DEFAULT).replace(/\/publish\/?$/,"").replace(/\/$/,"")}
  catch{return WORKER_DEFAULT}
}
function workerSecret(){
  try{return String(localStorage.getItem(WORKER_SECRET_KEY)||"").trim()}catch{return""}
}
function apiHeaders(){
  const h={"Content-Type":"application/json",Accept:"application/json"};
  const sec=workerSecret();
  if(sec)h["X-Admin-Secret"]=sec;
  return h;
}
async function adminApi(path,opt={}){
  const res=await fetch(workerBase()+path,{
    cache:"no-store",credentials:"omit",...opt,
    headers:{...apiHeaders(),...(opt.headers||{})}
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data?.ok===false)throw Error(data?.error||("Studio API "+res.status));
  return data;
}

async function browserStoryAlignment(file,text){
  const story=String(text||"").trim();
  const paragraphs=story.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  if(!file||paragraphs.length<1)throw Error("Story-Audio oder Absätze fehlen.");

  const weights=paragraphs.map(p=>{
    const words=(p.match(/[A-Za-zÀ-žĀ-žʿʾḤḥṢṣḌḍṬṭẒẓḎḏṮṯŠšǦǧĠġḪḫ0-9]+/g)||[]).length;
    return Math.max(1,words+.08*p.length);
  });
  const totalWeight=weights.reduce((a,b)=>a+b,0);

  async function metadataDuration(){
    return await new Promise((resolve,reject)=>{
      const a=document.createElement("audio"),url=URL.createObjectURL(file);
      a.preload="metadata";
      a.onloadedmetadata=()=>{const d=Number(a.duration||0);URL.revokeObjectURL(url);d>0?resolve(d):reject(Error("Audiodauer fehlt."))};
      a.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Audio konnte nicht analysiert werden."))};
      a.src=url;
    });
  }
  function weighted(duration,mode="browser-weighted-timeline-v1"){
    let acc=0;
    const starts=[0];
    for(let i=0;i<weights.length-1;i++){acc+=weights[i];starts.push(duration*(acc/totalWeight))}
    return {
      ok:true,
      timings:starts.map((st,i)=>({paragraphIndex:i,start:Number(st.toFixed(3)),end:Number((i+1<starts.length?starts[i+1]:duration).toFixed(3))})),
      syncMode:mode,
      alignmentLoss:null,
      alignedWords:paragraphs.reduce((n,p)=>n+(p.match(/\S+/g)||[]).length,0),
      alignedCharacters:story.length
    };
  }

  let ctx=null;
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)throw Error("WebAudio nicht verfügbar.");
    ctx=new AudioCtx();
    const buf=await file.arrayBuffer();
    const audio=await ctx.decodeAudioData(buf.slice(0));
    const duration=Number(audio.duration||0);
    if(!(duration>0))throw Error("Ungültige Audiodauer.");
    if(paragraphs.length===1)return weighted(duration,"browser-single-paragraph-v1");

    const ch=audio.getChannelData(0),sr=audio.sampleRate;
    const frame=Math.max(128,Math.round(sr*.025));
    const rms=[];
    for(let pos=0;pos<ch.length;pos+=frame){
      let sum=0,n=0;
      const end=Math.min(ch.length,pos+frame);
      for(let i=pos;i<end;i+=2){const v=ch[i];sum+=v*v;n++}
      rms.push(Math.sqrt(sum/Math.max(1,n)));
    }
    const sorted=rms.slice().sort((a,b)=>a-b);
    const q=p=>sorted[Math.min(sorted.length-1,Math.max(0,Math.floor((sorted.length-1)*p)))]||0;
    const low=q(.12),high=q(.82);
    const threshold=Math.max(.0008,Math.min(high*.22,low+(high-low)*.16));

    const silences=[];
    let open=-1;
    for(let i=0;i<rms.length;i++){
      const quiet=rms[i]<=threshold;
      if(quiet&&open<0)open=i;
      if((!quiet||i===rms.length-1)&&open>=0){
        const stop=quiet&&i===rms.length-1?i+1:i;
        const dur=(stop-open)*frame/sr;
        if(dur>=.14){
          const endSec=Math.min(duration,stop*frame/sr);
          if(endSec>.45&&endSec<duration-.45)silences.push({t:endSec,sil:dur,real:true});
        }
        open=-1;
      }
    }

    const expected=[];
    let acc=0;
    for(let i=0;i<weights.length-1;i++){acc+=weights[i];expected.push(duration*(acc/totalWeight))}
    const candidates=silences.slice();
    for(const t of expected){
      if(!candidates.some(x=>Math.abs(x.t-t)<.28))candidates.push({t,sil:0,real:false});
    }
    candidates.sort((a,b)=>a.t-b.t);

    const B=expected.length,N=candidates.length,INF=1e18,minGap=.35;
    let prev=new Array(N).fill(INF);
    const back=Array.from({length:B},()=>new Array(N).fill(-1));
    const cost=(b,j)=>{
      const t=candidates[j].t,exp=expected[b];
      const left=b?expected[b-1]:0,right=b===B-1?duration:expected[b+1];
      const scale=Math.max(1.6,.45*Math.min(exp-left,right-exp));
      const drift=((t-exp)/scale)**2;
      const bonus=Math.min(1.8,candidates[j].sil)*.72;
      return drift+(candidates[j].real?0:1.55)-bonus;
    };
    for(let j=0;j<N;j++)if(candidates[j].t>.4)prev[j]=cost(0,j);
    for(let b=1;b<B;b++){
      const cur=new Array(N).fill(INF);
      let best=INF,bestJ=-1,k=0;
      for(let j=0;j<N;j++){
        const limit=candidates[j].t-minGap;
        while(k<j&&candidates[k].t<=limit){if(prev[k]<best){best=prev[k];bestJ=k}k++}
        if(bestJ>=0){cur[j]=best+cost(b,j);back[b][j]=bestJ}
      }
      prev=cur;
    }
    let endJ=-1,best=INF;
    for(let j=0;j<N;j++)if(prev[j]<best){best=prev[j];endJ=j}
    if(endJ<0||!Number.isFinite(best))return weighted(duration);

    const ids=[endJ];
    for(let b=B-1;b>0;b--){const p=back[b][ids[ids.length-1]];if(p<0)return weighted(duration);ids.push(p)}
    ids.reverse();
    const boundaries=ids.map(j=>candidates[j].t);
    const points=[0,...boundaries,duration];
    return {
      ok:true,
      timings:paragraphs.map((_,i)=>({paragraphIndex:i,start:Number(points[i].toFixed(3)),end:Number(points[i+1].toFixed(3))})),
      syncMode:"browser-silence-aware-paragraph-v1",
      alignmentLoss:null,
      alignedWords:paragraphs.reduce((n,p)=>n+(p.match(/\S+/g)||[]).length,0),
      alignedCharacters:story.length,
      detectedSilences:silences.length
    };
  }catch(e){
    const duration=await metadataDuration();
    return weighted(duration);
  }finally{
    try{await ctx?.close?.()}catch(_){}
  }
}

async function alignStoryFile(file,text){
  if(!file)throw Error("Audiodatei fehlt.");
  const story=String(text||"").trim();
  if(!story)throw Error("Story-Text fehlt.");
  const secret=workerSecret();
  if(secret){
    try{
      const form=new FormData();
      form.append("file",file,file.name||"story-audio");
      form.append("text",story);
      const res=await fetch(workerBase()+"/voice-studio/api/align-story",{
        method:"POST",cache:"no-store",credentials:"omit",
        headers:{Accept:"application/json","X-Admin-Secret":secret},
        body:form
      });
      const data=await res.json().catch(()=>({}));
      if(res.ok&&data?.ok!==false&&Array.isArray(data?.timings)&&data.timings.length)return data;
      console.warn("[DĀR Voice] Cloud alignment fallback:",data?.error||res.status);
    }catch(e){
      console.warn("[DĀR Voice] Cloud alignment unavailable:",e);
    }
  }
  const fallback=await browserStoryAlignment(file,story);
  if(!Array.isArray(fallback?.timings)||!fallback.timings.length)throw Error("Mitlese-Synchronisierung konnte nicht erzeugt werden.");
  return fallback;
}

window.darVoiceAlignStoryFile=alignStoryFile;
window.darVoiceAlignCurrentStory=async function(text){
  const story=String(text||"").trim();
  if(!story)throw Error("Story-Text fehlt.");
  if(!lastAudio||lastGeneratedText!==story)throw Error("Die aktuelle Audio gehört nicht exakt zu diesem Story-Text.");
  const blob=await fetch(lastAudio).then(r=>{if(!r.ok)throw Error("Aktuelle Audio konnte nicht gelesen werden.");return r.blob()});
  const ext=(blob.type||"audio/wav").includes("mpeg")?".mp3":(blob.type||"").includes("mp4")?".m4a":".wav";
  const file=new File([blob],"dar-story"+ext,{type:blob.type||"audio/wav"});
  return alignStoryFile(file,story);
};
function setStudioMessage(msg,type=""){
  const el=q("csMessage"); if(!el)return;
  el.textContent=msg||"";
  el.className="cs-message "+(type||"");
}
function statusLabel(){
  if(productionPhase==="producing")return"Produktion läuft";
  if(productionPhase==="awaiting-qa")return"QA erforderlich";
  if(productionPhase==="ready")return"Bereit";
  if(productionPhase==="test-published")return"Test veröffentlicht";
  if(productionPhase==="live-published")return"Live veröffentlicht";
  if(productionPhase==="error")return"Fehler";
  if(contentStatus==="published"&&stagingPublished)return"Test veröffentlicht";
  if(contentStatus==="review")return"Prüfung";
  if(contentStatus==="published")return"Veröffentlicht";
  return"Entwurf";
}
function qaSnapshot(){
  const text=String(q("text")?.value||"").trim();
  const script=typeof voiceScript==="function"?voiceScript():text;
  const same=!!lastAudio&&lastGeneratedText===script;
  const cover=!!(coverFile||coverRemoteUrl||coverAsset?.url);
  const audio=!q("csModeListen")?.checked||same||!!audioAsset?.url;
  const pron=!q("csModeListen")?.checked||Boolean(qaConfirmed&&same)||Boolean(audioAsset?.url&&contentId);
  const title=!!String(q("csTitle")?.value||"").trim();
  return{text:!!text,title,cover,audio,pron,test:stagingPublished,live:productionPhase==="live-published"};
}
function renderWorkflow(){
  const state=qaSnapshot();
  const current=!state.text?"text":!state.audio||!state.pron?"audio":!state.cover?"cover":!state.test?"test":!state.live?"live":"live";
  document.querySelectorAll("[data-cs-step]").forEach(btn=>{
    const step=btn.dataset.csStep;
    let value="blocked";
    if(step==="text")value=state.text?"ready":current==="text"?"current":"blocked";
    if(step==="audio")value=(state.audio&&state.pron)?"ready":current==="audio"?"current":"blocked";
    if(step==="cover")value=state.cover?"ready":current==="cover"?"current":"blocked";
    if(step==="test")value=state.test?"ready":current==="test"?"current":"blocked";
    if(step==="live")value=state.live?"ready":current==="live"?"current":"blocked";
    btn.dataset.state=value;
  });
}
function goToWorkflowStep(step){
  window.setStudioPage?.("content");
  const target={
    text:q("text"),
    audio:q("playerWrap")||q("generate"),
    cover:q("csCover"),
    test:q("csPublishTest"),
    live:q("csPublishLive")
  }[step];
  if(!target)return;
  if(["TEXTAREA","INPUT","BUTTON"].includes(target.tagName))setTimeout(()=>target.focus?.({preventScroll:true}),60);
}
function focusNextProductionAction(){
  const state=qaSnapshot();
  if(!state.text)return goToWorkflowStep("text");
  if(!state.audio||!state.pron)return goToWorkflowStep("audio");
  if(!state.cover)return goToWorkflowStep("cover");
  if(!state.test)return goToWorkflowStep("test");
  if(!state.live)return goToWorkflowStep("live");
}
function renderStatus(){
  const el=q("csStatus"); if(!el)return;
  el.textContent=statusLabel();
  el.dataset.status=contentStatus;
  const live=q("csPublishLive");
  const quickLive=q("csQuickLive");
  const liveDisabled=busy||!stagingPublished;
  if(live)live.disabled=liveDisabled;
  if(quickLive)quickLive.disabled=liveDisabled;
  const produce=q("csQuickProduce");if(produce)produce.disabled=busy;
  const copy=q("csQuickCopy");if(copy)copy.disabled=!String(q("text")?.value||"").trim();
  renderWorkflow();
}
function injectStyles(){
  const st=document.createElement("style");
  st.id="contentStudioStyles";
  st.textContent=`
  .content-studio-nav{position:sticky;top:72px;z-index:28;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 4px 9px;background:linear-gradient(180deg,rgba(6,19,24,.98),rgba(6,19,24,.94));border-bottom:1px solid rgba(255,255,255,.07);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
  .content-studio-nav::-webkit-scrollbar{display:none}
  .cs-nav-tabs,.cs-fast-actions{display:flex;align-items:center;gap:6px;min-width:0}
  .cs-nav-tabs{overflow-x:auto;scrollbar-width:none;flex:1}.cs-nav-tabs::-webkit-scrollbar{display:none}
  .cs-fast-actions{margin-left:auto;flex:0 0 auto}
  .cs-fast-actions .btn{min-height:34px;padding:7px 10px;border-radius:10px;font-size:10px;white-space:nowrap}
  .cs-flow{display:flex;align-items:center;gap:4px;min-width:0}
  .cs-flow-step{appearance:none;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);color:#82979d;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:850;white-space:nowrap;cursor:pointer}
  .cs-flow-step[data-state="ready"]{color:#9bd8ba;border-color:rgba(121,190,160,.24);background:rgba(121,190,160,.045)}
  .cs-flow-step[data-state="current"]{color:#f0d59a;border-color:rgba(217,182,111,.35);background:rgba(217,182,111,.07)}
  .cs-flow-step[data-state="blocked"]{opacity:.48}
  .cs-flow-step:focus-visible{outline:2px solid rgba(217,182,111,.55);outline-offset:1px}
  .cs-fast-actions .primary{box-shadow:none}
  .cs-tab{border:1px solid var(--line);background:rgba(255,255,255,.026);color:#9fb0b4;border-radius:9px;padding:7px 9px;font-size:9px;font-weight:850;letter-spacing:.01em;white-space:nowrap;cursor:pointer}.cs-tab:hover{border-color:rgba(217,182,111,.25);color:#d6e0e1}
  .cs-tab.active{border-color:rgba(217,182,111,.42);background:rgba(217,182,111,.09);color:#f1d59a}
  .cs-meta{margin:0 0 14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025)}
  .cs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
  .cs-field{min-width:0}.cs-field.span2{grid-column:span 2}.cs-field.span4{grid-column:1/-1}
  .cs-field label{display:block;color:#81969b;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;margin:0 0 5px}
  .cs-field input,.cs-field select,.cs-field textarea{width:100%;border:1px solid var(--line);background:rgba(1,14,19,.62);color:#e9eeee;border-radius:9px;padding:9px 10px;min-height:38px;outline:none}
  .cs-field textarea{height:62px;min-height:62px;resize:vertical;line-height:1.4}
  .cs-modes{display:flex;gap:12px;align-items:center;min-height:38px}.cs-modes label{display:flex;gap:6px;align-items:center;margin:0;text-transform:none;letter-spacing:0;font-size:11px;color:#c6d2d4}.cs-modes input{width:auto;min-height:0}
  .cs-publish{display:grid;gap:9px}.cs-status-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .cs-status{font-size:10px;font-weight:900;padding:6px 9px;border-radius:999px;border:1px solid var(--line);color:#bdc9cc}.cs-status[data-status="review"]{color:#f0d29a;border-color:rgba(217,182,111,.3)}.cs-status[data-status="published"]{color:#a9ddc6;border-color:rgba(121,190,160,.3)}
  .cs-cover{position:relative;aspect-ratio:4/5;border:1px dashed rgba(217,182,111,.28);border-radius:14px;overflow:hidden;background:linear-gradient(145deg,#0b242c,#102c34);display:grid;place-items:center;cursor:pointer}
  .cs-cover.drag{border-color:#e2c47d;background:#173138}.cs-cover img{width:100%;height:100%;object-fit:cover;display:block}.cs-cover .empty{padding:18px;text-align:center;color:#7f969a;font-size:11px;line-height:1.5}
  .cs-cover-overlay{position:absolute;inset:auto 0 0;padding:14px 12px 11px;background:linear-gradient(transparent,rgba(1,10,15,.86));pointer-events:none}.cs-cover-overlay b{display:block;color:#fff;font:700 17px Georgia,serif;line-height:1.14}.cs-cover-overlay span{font-size:9px;color:#efd78e;font-weight:800}
  .cs-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cs-actions .btn{min-height:40px;font-size:11px}
  .cs-message{min-height:18px;font-size:10px;line-height:1.45;color:#93a7aa}.cs-message.good{color:#9bd8ba}.cs-message.warn{color:#f1c77c}.cs-message.bad{color:#ef9d9d}
  .cs-qa{display:grid;gap:6px}.cs-check{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}.cs-check:last-child{border:0}.cs-check b{font-size:10px}
  .cs-library{display:grid;gap:6px;max-height:180px;overflow:auto}.cs-item{border:1px solid var(--line);border-radius:9px;padding:8px;background:rgba(255,255,255,.025);cursor:pointer}.cs-item b{display:block;font-size:11px}.cs-item small{font-size:9px;color:#7f9499}
  .cs-disabled-pane{padding:20px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025);color:#879a9e;font-size:12px;line-height:1.6}
  .cs-structured{margin:0 0 14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.018)}
  .cs-structured[hidden]{display:none}.cs-structured h3{margin:0 0 10px;font-size:13px;color:#f0d59a}
  .cs-question{padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(0,0,0,.12);margin:8px 0}
  .cs-question-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.cs-question-head b{font-size:11px}.cs-question-head button{border:0;background:transparent;color:#df8686;cursor:pointer;font-size:11px}
  .cs-answer-grid,.cs-inline-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cs-add{width:100%;margin-top:8px}
  .cs-inventory-toolbar{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;margin-bottom:8px}
  .cs-inventory-toolbar input{min-width:0;border:1px solid var(--line);background:rgba(1,14,19,.62);color:#e9eeee;border-radius:9px;padding:9px 10px}
  .cs-inventory-toolbar .btn{min-width:40px;min-height:38px}
  .cs-inventory-summary{font-size:9px;color:#809397;line-height:1.45;margin:0 0 8px}
  .cs-inventory{display:grid;gap:7px;max-height:360px;overflow:auto;padding-right:2px}
  .cs-inventory-item{width:100%;text-align:left;border:1px solid var(--line);border-radius:11px;padding:9px;background:rgba(255,255,255,.025);color:#e8eeee}
  button.cs-inventory-item{cursor:pointer}.cs-inventory-item.editable:hover{border-color:rgba(217,182,111,.35);background:rgba(217,182,111,.05)}
  .cs-inventory-item b{display:block;font-size:11px;line-height:1.28}
  .cs-inventory-meta{display:block;margin-top:5px;font-size:9px;color:#7f9499;line-height:1.35}
  .cs-inventory-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
  .cs-chip{font-size:8px;font-weight:900;padding:3px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.09);color:#b8c7ca}
  .cs-chip.legacy{color:#e8d08c;border-color:rgba(232,208,140,.26)}.cs-chip.test{color:#9ecceb;border-color:rgba(112,175,220,.28)}.cs-chip.live{color:#a8ddc5;border-color:rgba(112,205,160,.28)}.cs-chip.internal{color:#e3b0df;border-color:rgba(195,125,190,.25)}
  @media(max-width:1240px){.content-studio-nav{align-items:flex-start;flex-direction:column;top:64px}.cs-nav-tabs,.cs-flow,.cs-fast-actions{width:100%;overflow-x:auto}.cs-fast-actions{margin-left:0}.cs-fast-actions .btn,.cs-flow-step{flex:0 0 auto}}
  @media(max-width:900px){.cs-grid{grid-template-columns:1fr 1fr}.cs-field.span4{grid-column:1/-1}}
  @media(max-width:600px){.cs-grid{grid-template-columns:1fr}.cs-field.span2,.cs-field.span4{grid-column:1}.cs-actions{grid-template-columns:1fr}.cs-fast-actions .btn{min-height:36px}}
  `;
  document.head.appendChild(st);
}
function navHtml(){
  return `<nav class="content-studio-nav" aria-label="Studio Bereiche und Schnellaktionen">
    <div class="cs-nav-tabs">
      <button id="csFreeVoiceTab" class="cs-tab" type="button">Erzeugen</button>
      <button id="csPronunciationTab" class="cs-tab" type="button">Aussprache</button>
      <button id="csProphetTab" class="cs-tab" type="button">Propheten</button>
      <button id="csSahabaTab" class="cs-tab" type="button">Ṣaḥābah · 10</button>
      <button class="cs-tab" data-cs-kind="story">Geschichten</button>
      <button class="cs-tab" data-cs-kind="quiz">Quiz</button>
      <button class="cs-tab" data-cs-kind="game">Spiele</button>
      <button id="csAlphabetTab" class="cs-tab" type="button">Alif–Yāʾ</button>
      <button class="cs-tab" data-cs-kind="ios">Inhalte</button>
      <button id="csSystemTab" class="cs-tab" type="button">System</button>
    </div>
    <div class="cs-flow" aria-label="Produktionsweg">
      <button class="cs-flow-step" type="button" data-cs-step="text">Text</button>
      <button class="cs-flow-step" type="button" data-cs-step="audio">Audio</button>
      <button class="cs-flow-step" type="button" data-cs-step="cover">Cover</button>
      <button class="cs-flow-step" type="button" data-cs-step="test">Test</button>
      <button class="cs-flow-step" type="button" data-cs-step="live">Live</button>
    </div>
    <div class="cs-fast-actions" aria-label="Schnellproduktion">
      <button id="csQuickNew" class="btn quiet" type="button" title="Neuen Inhalt starten">Neu</button>
      <button id="csQuickCopy" class="btn quiet" type="button" title="Aktuellen Text kopieren">Kopieren</button>
      <button id="csQuickProduce" class="btn primary" type="button" title="Audio und Cover vorbereiten · ⇧⌘E">Erzeugen</button>
      <button id="csQuickTest" class="btn secondary" type="button" title="In Test veröffentlichen · ⇧⌘T">Test</button>
      <button id="csQuickLive" class="btn secondary" type="button" title="Geprüfte Version live veröffentlichen" disabled>Live</button>
    </div>
  </nav>`;
}
function metaHtml(){
  return `<section id="csMeta" class="cs-meta">
    <div class="cs-grid">
      <div class="cs-field span2"><label for="csTitle">Titel</label><input id="csTitle" placeholder="z. B. Nūḥ und das Schiff"></div>
      <div class="cs-field"><label for="csCategory">Kategorie</label><input id="csCategory" value="Qurʾān · geprüft"></div>
      <div class="cs-field"><label for="csTopic">Thema</label><input id="csTopic" placeholder="Propheten · Tawḥīd"></div>
      <div class="cs-field"><label for="csProphet">Prophet / Person</label><input id="csProphet" placeholder="z. B. nuh"></div>
      <div class="cs-field"><label for="csAgeMin">Alter von</label><select id="csAgeMin"><option>4</option><option>5</option><option selected>6</option><option>7</option><option>8</option><option>9</option><option>10</option></select></div>
      <div class="cs-field"><label for="csAgeMax">Alter bis</label><select id="csAgeMax"><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option selected>10</option></select></div>
      <div class="cs-field"><label>Modus</label><div class="cs-modes"><label><input id="csModeRead" type="checkbox" checked> Lesen</label><label><input id="csModeListen" type="checkbox" checked> Hören</label></div></div>
      <div class="cs-field span4"><label for="csSources">Quellen / Nachweise</label><textarea id="csSources" placeholder="Eine Quelle pro Zeile, z. B. Qurʾān 11:36–44"></textarea></div>
    </div>
  </section>
  <section id="csStructured" class="cs-structured" hidden><div id="csStructuredBody"></div></section>`;
}
function publishHtml(){
  return `<section id="csPublishSection" class="side-section">
    <div class="side-title">Content Studio · Kids</div>
    <div class="cs-status-row"><span class="notice">Produktionspaket</span><span id="csStatus" class="cs-status" data-status="draft">Entwurf</span></div>
    <div id="csCover" class="cs-cover" tabindex="0">
      <div class="empty"><b>Cover</b><br>Bild hier hineinziehen<br>oder automatisch erzeugen</div>
      <div class="cs-cover-overlay"><span>DĀR AL TAWḤĪD Kids</span><b id="csCoverTitle">Neue Geschichte</b></div>
    </div>
    <input id="csCoverFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden>
    <div class="cs-actions" style="margin-top:8px">
      <button id="csCoverGenerate" class="btn secondary" type="button">Cover erzeugen</button>
      <button id="csCoverChoose" class="btn quiet" type="button">Bild hineinladen</button>
    </div>
    <div class="cs-actions" style="margin-top:7px">
      <button id="csProduce" class="btn primary" type="button">Audio + Cover vorbereiten</button>
      <button id="csSave" class="btn secondary" type="button">Entwurf speichern</button>
    </div>
    <div class="cs-qa" style="margin-top:9px">
      <div class="cs-check"><span>Text</span><b id="csQaText" class="warn">fehlt</b></div>
      <div class="cs-check"><span>Serhat-Audio</span><b id="csQaAudio" class="warn">fehlt</b></div>
      <div class="cs-check"><span>Aussprache</span><b id="csQaPron" class="warn">offen</b></div>
      <div class="cs-check"><span>Cover</span><b id="csQaCover" class="warn">fehlt</b></div>
    </div>
    <div class="cs-actions" style="margin-top:9px">
      <button id="csPublishTest" class="btn primary" type="button">In Test-Kids veröffentlichen</button>
      <button id="csPublishLive" class="btn secondary" type="button" disabled>Live veröffentlichen</button>
    </div>
    <details style="margin-top:9px">
      <summary>Admin-Verbindung</summary>
      <div class="advanced">
        <label for="csWorkerUrl">Worker</label><input id="csWorkerUrl">
        <label for="csSecret" style="margin-top:8px">Admin-Secret</label><input id="csSecret" type="password" autocomplete="off">
        <button id="csSaveConnection" class="btn quiet" type="button" style="width:100%;margin-top:8px">Verbindung lokal speichern</button>
      </div>
    </details>
    <div id="csMessage" class="cs-message"></div>
  </section>
  <section id="csLibrarySection" class="side-section">
    <div class="side-title">Inhalte & Veröffentlichung</div>
    <div class="cs-inventory-toolbar">
      <input id="csInventorySearch" type="search" placeholder="Titel, Prophet, Bereich …">
      <button id="csInventoryRefresh" class="btn quiet" type="button" title="Neu laden">↻</button>
    </div>
    <div id="csInventorySummary" class="cs-inventory-summary">Bestand wird geladen …</div>
    <div id="csLibrary" class="cs-inventory"><div class="notice">Bestand · Staging · Live werden geladen …</div></div>
  </section>`;
}
function prophetPickHtml(){
  return `<div class="prophet-pick" id="prophetPick">
    <div class="prophet-pick-head">
      <div class="prophet-pick-kicker">Kids · ein Auftrag · alle Altersstufen</div>
      <h2>Geschichten der Propheten</h2>
      <div class="notice" style="margin:0">Namen wählen · einen Text schreiben · Audio erzeugen · beim Propheten pushen. Lesen &amp; Hören und 4–5 / 6–8 / 9–10 werden automatisch zugeordnet.</div>
    </div>
    <select id="prophetPickId" hidden><option value="">— wählen —</option></select>
    <select id="prophetPickAge" hidden><option value="all" selected>alle</option></select>
    <div id="prophetPickList" class="prophet-pick-list"></div>
    <div id="prophetPickReady" class="notice">Ein Push je Prophet. Die Kids-App erkennt Audio, Lesetext und Altersstufe selbst.</div>
  </div>`;
}
function ensureProphetUi(){
  const editor=document.querySelector(".editor-panel");
  if(!editor)return;
  if(!q("prophetPick")) editor.insertAdjacentHTML("afterbegin",prophetPickHtml());
  const box=q("prophetPick");
  if(box && editor.firstChild!==box) editor.insertBefore(box,editor.firstChild);
}

function mount(){
  injectStyles();
  ensureProphetUi();
  if(q("csMeta"))return;
  injectStyles();
  const top=document.querySelector(".topbar");
  if(top)top.insertAdjacentHTML("afterend",navHtml());
  const heading=document.querySelector(".editor-panel .heading-row");
  if(heading)heading.insertAdjacentHTML("afterend",metaHtml());
  const oldKids=[...document.querySelectorAll(".side-section")].find(x=>x.querySelector(".side-title")?.textContent.trim()==="Kids-App");
  if(oldKids)oldKids.outerHTML=publishHtml(); else document.querySelector(".side-panel")?.insertAdjacentHTML("beforeend",publishHtml());

  q("csWorkerUrl").value=workerBase();
  q("csSecret").value=workerSecret();
  bind();
  restoreDraft();
  renderKindEditor();
  renderStatus();
  refreshQa();
  loadLibrary();
  setTimeout(()=>window.setStudioPage?.(window.studioPage||"prophets"),0);
}
function bind(){
  document.querySelectorAll("[data-cs-kind]").forEach(btn=>btn.addEventListener("click",()=>{
    window.setStudioPage?.("content");
    ["csProphetTab","csPronunciationTab","csAlphabetTab","csFreeVoiceTab","csSystemTab"].forEach(id=>q(id)?.classList.remove("active"));
    switchKind(btn.dataset.csKind);
  }));
  q("csProphetTab")?.addEventListener("click",()=>{
    switchKind("story");
    document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.remove("active"));
    window.setStudioPage?.("prophets");
  });
  q("csPronunciationTab")?.addEventListener("click",()=>window.setStudioPage?.("pronunciation"));
  q("csAlphabetTab")?.addEventListener("click",()=>window.setStudioPage?.("alphabet"));
  q("csFreeVoiceTab")?.addEventListener("click",()=>window.setStudioPage?.("free"));
  q("csSystemTab")?.addEventListener("click",()=>window.setStudioPage?.("system"));
  q("csTitle")?.addEventListener("input",()=>{q("csCoverTitle").textContent=q("csTitle").value||"Neue Geschichte";persistDraft();refreshQa();renderWorkflow()});
  ["csCategory","csTopic","csProphet","csAgeMin","csAgeMax","csModeRead","csModeListen","csSources"].forEach(id=>q(id)?.addEventListener("change",()=>{persistDraft();refreshQa()}));
  q("text")?.addEventListener("input",()=>{
    if(lastGeneratedText&&String(q("text")?.value||"").trim()!==lastGeneratedText){
      audioAsset=null;
      if(productionPhase!=="draft")setProductionPhase("draft");
      stagingPublished=false;
    }
    persistDraft();refreshQa();
  });
  q("csStructured")?.addEventListener("input",()=>{captureStructuredEditor();persistDraft();refreshQa()});
  q("csStructured")?.addEventListener("change",()=>{captureStructuredEditor();persistDraft();refreshQa()});
  q("csStructured")?.addEventListener("click",e=>{
    const add=e.target.closest?.("[data-cs-add-question]");
    if(add){quizDraft.push(blankQuizQuestion());renderKindEditor();persistDraft();refreshQa();return}
    const remove=e.target.closest?.("[data-cs-remove-question]");
    if(remove){quizDraft.splice(Number(remove.dataset.csRemoveQuestion),1);if(!quizDraft.length)quizDraft.push(blankQuizQuestion());renderKindEditor();persistDraft();refreshQa()}
  });
  q("csCoverChoose")?.addEventListener("click",()=>q("csCoverFile").click());
  q("csCoverFile")?.addEventListener("change",e=>handleCoverFile(e.target.files?.[0]));
  q("csCover")?.addEventListener("click",()=>q("csCoverFile").click());
  q("csCover")?.addEventListener("dragover",e=>{e.preventDefault();q("csCover").classList.add("drag")});
  q("csCover")?.addEventListener("dragleave",()=>q("csCover").classList.remove("drag"));
  q("csCover")?.addEventListener("drop",e=>{e.preventDefault();q("csCover").classList.remove("drag");handleCoverFile(e.dataTransfer?.files?.[0])});
  q("csCoverGenerate")?.addEventListener("click",generateCover);
  q("csProduce")?.addEventListener("click",produce);
  q("csSave")?.addEventListener("click",()=>saveDraftRemote(false));
  q("csPublishTest")?.addEventListener("click",publishTest);
  q("csPublishLive")?.addEventListener("click",publishLive);
  q("csQuickNew")?.addEventListener("click",newCurrentItem);
  q("csQuickCopy")?.addEventListener("click",copyCurrentText);
  q("csQuickProduce")?.addEventListener("click",produce);
  q("csQuickTest")?.addEventListener("click",publishTest);
  q("csQuickLive")?.addEventListener("click",publishLive);
  document.querySelectorAll("[data-cs-step]").forEach(btn=>btn.addEventListener("click",()=>goToWorkflowStep(btn.dataset.csStep)));
  q("csSaveConnection")?.addEventListener("click",saveConnection);
  q("csInventorySearch")?.addEventListener("input",renderInventory);
  q("csInventoryRefresh")?.addEventListener("click",()=>loadLibrary(true));
  document.addEventListener("click",e=>{
    const item=e.target.closest?.("[data-cs-item]");
    if(item)loadRemoteItem(item.dataset.csItem);
    const inv=e.target.closest?.("[data-cs-inventory]");
    if(inv){
      const source=inv.dataset.csSource||"";
      if(source==="live")loadLiveForEdit(inv.dataset.csInventory);
      else if(source==="staging")loadRemoteItem(inv.dataset.csInventory);
      else if(source==="legacy")loadLegacyForEdit(inv.dataset.csInventory);
    }
  });
  setInterval(refreshQa,1200);
}
function newCurrentItem(){
  persistDraft();
  contentId="";savedRevision=0;stagingPublished=false;contentStatus="draft";
  setProductionPhase("draft");productionError="";
  resetEditorForKind();
  renderKindEditor();
  renderStatus();refreshQa();persistDraft();
  q("csTitle")?.focus();
  setStudioMessage("Neuer Arbeitsentwurf bereit. Der vorherige lokale Entwurf bleibt gespeichert.","good");
}
async function copyCurrentText(){
  const value=String(q("text")?.value||"").trim();
  if(!value){setStudioMessage("Kein Text zum Kopieren vorhanden.","warn");return}
  try{
    await navigator.clipboard.writeText(value);
    setStudioMessage("Text kopiert.","good");
  }catch{
    q("text")?.focus();q("text")?.select();
    document.execCommand?.("copy");
    setStudioMessage("Text kopiert.","good");
  }
}
function effectiveKind(){return studioKind==="ios"?"lesson":studioKind}
function effectiveTarget(){return studioKind==="ios"?"ios":"kids"}
function draftKey(kind=studioKind){return STUDIO_DRAFT_KEY+"."+kind}
function quizBandForRange(min,max){
  min=Number(min||0);max=Number(max||99);
  if(min<=4&&max>=6)return"4-6";
  if(min<=7&&max>=8)return"7-8";
  return"9-10";
}
function setQuizAgeBand(band){
  const ranges={"4-6":[4,6],"7-8":[7,8],"9-10":[9,10]};
  const range=ranges[String(band||"")]||ranges["7-8"];
  if(q("csAgeMin"))q("csAgeMin").value=String(range[0]);
  if(q("csAgeMax"))q("csAgeMax").value=String(range[1]);
}
function blankQuizQuestion(){return{question:"",answers:[{label:"",correct:true},{label:"",correct:false}],success:"Richtig.",retry:"Versuche es noch einmal.",explanation:""}}
function setProductionPhase(phase,error=""){productionPhase=phase||"draft";productionError=error||"";renderStatus()}
function resetEditorForKind(){
  q("csTitle").value="";q("csTopic").value="";q("csProphet").value="";q("csSources").value="";q("text").value="";
  if(studioKind==="quiz"){q("csAgeMin").value="7";q("csAgeMax").value="8"}else{q("csAgeMin").value="6";q("csAgeMax").value="10"}
  q("csModeRead").checked=true;q("csModeListen").checked=true;
  q("csCategory").value=studioKind==="quiz"?"Quiz · geprüft":studioKind==="game"?"Spiel":studioKind==="ios"?"iOS · Inhalt":"Qurʾān · geprüft";
  coverFile=null;coverRemoteUrl="";coverAsset=null;audioAsset=null;quizDraft=[];gameDraft={type:"choice",summary:"",instructions:"",voiceCues:[]};
  legacyQuestion={};legacyClaimIds=[];legacyTags=[];
  q("csCover")?.querySelector("img")?.remove();q("csCoverTitle").textContent="Neuer Inhalt";
}
function renderKindEditor(){
  const wrap=q("csStructured"),body=q("csStructuredBody");if(!wrap||!body)return;
  if(studioKind==="quiz"){
    wrap.hidden=false;if(!quizDraft.length)quizDraft=[blankQuizQuestion()];
    const currentBand=quizBandForRange(q("csAgeMin")?.value,q("csAgeMax")?.value);
    body.innerHTML="<h3>Quiz-Aufbau</h3><div class=\"cs-field\" style=\"margin-bottom:10px\"><label for=\"csQuizAgeBand\">Quiz-Altersstufe</label><select id=\"csQuizAgeBand\"><option value=\"4-6\" "+(currentBand==="4-6"?"selected":"")+">4–6 Jahre</option><option value=\"7-8\" "+(currentBand==="7-8"?"selected":"")+">7–8 Jahre</option><option value=\"9-10\" "+(currentBand==="9-10"?"selected":"")+">9–10 Jahre</option></select></div>"+quizDraft.map((item,i)=>{
      const answers=Array.isArray(item.answers)?item.answers:[];
      const opts=[0,1,2,3].map(ai=>"<option value=\""+ai+"\" "+(answers[ai]?.correct?"selected":"")+">"+String.fromCharCode(65+ai)+"</option>").join("");
      const ans=[0,1,2,3].map(ai=>{const a=answers[ai]||{};return "<div class=\"cs-field\"><label>Antwort "+String.fromCharCode(65+ai)+"</label><input data-q-answer=\""+ai+"\" data-q-index=\""+i+"\" value=\""+escapeHtml(a.label||"")+"\"></div>"}).join("");
      return "<div class=\"cs-question\" data-cs-question=\""+i+"\"><div class=\"cs-question-head\"><b>Frage "+(i+1)+"</b><button type=\"button\" data-cs-remove-question=\""+i+"\">Entfernen</button></div><div class=\"cs-field\"><label>Frage</label><input data-q-field=\"question\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.question||"")+"\"></div><div class=\"cs-answer-grid\">"+ans+"</div><div class=\"cs-inline-grid\" style=\"margin-top:8px\"><div class=\"cs-field\"><label>Richtige Antwort</label><select data-q-field=\"correctIndex\" data-q-index=\""+i+"\">"+opts+"</select></div><div class=\"cs-field\"><label>Erfolg</label><input data-q-field=\"success\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.success||"Richtig.")+"\"></div></div><div class=\"cs-field\" style=\"margin-top:8px\"><label>Nochmal versuchen</label><input data-q-field=\"retry\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.retry||"Versuche es noch einmal.")+"\"></div><div class=\"cs-field\" style=\"margin-top:8px\"><label>Kurze Erklärung nach richtiger Antwort</label><input data-q-field=\"explanation\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.explanation||"")+"\"></div></div>";
    }).join("")+"<button class=\"btn quiet cs-add\" type=\"button\" data-cs-add-question>+ Frage hinzufügen</button>";
    q("csQuizAgeBand")?.addEventListener("change",e=>{setQuizAgeBand(e.target.value);persistDraft();refreshQa()});
  }else if(studioKind==="game"){
    wrap.hidden=false;
    body.innerHTML="<h3>Spiel-Aufbau</h3><div class=\"cs-inline-grid\"><div class=\"cs-field\"><label>Spieltyp</label><select id=\"csGameType\"><option value=\"choice\">Auswahlspiel</option><option value=\"listen\">Hörspiel</option><option value=\"memory\">Merkspiel</option><option value=\"sequence\">Reihenfolge</option></select></div><div class=\"cs-field\"><label>Kurzbeschreibung</label><input id=\"csGameSummary\" value=\""+escapeHtml(gameDraft.summary||"")+"\"></div></div><div class=\"cs-field\" style=\"margin-top:8px\"><label>Anleitung</label><textarea id=\"csGameInstructions\">"+escapeHtml(gameDraft.instructions||"")+"</textarea></div><div class=\"cs-field\" style=\"margin-top:8px\"><label>Serhat-Sprachbausteine · eine Zeile pro Satz</label><textarea id=\"csGameVoiceCues\" placeholder=\"Sehr gut!&#10;Versuche es noch einmal.\">"+escapeHtml((gameDraft.voiceCues||[]).join("\\n"))+"</textarea></div>";
    q("csGameType").value=gameDraft.type||"choice";
  }else{wrap.hidden=true;body.innerHTML=""}
}
function captureStructuredEditor(){
  if(studioKind==="quiz"){
    document.querySelectorAll("[data-cs-question]").forEach(node=>{
      const i=Number(node.dataset.csQuestion),item=quizDraft[i]||blankQuizQuestion();
      item.question=node.querySelector('[data-q-field="question"]')?.value||"";item.success=node.querySelector('[data-q-field="success"]')?.value||"Richtig.";item.retry=node.querySelector('[data-q-field="retry"]')?.value||"Versuche es noch einmal.";item.explanation=node.querySelector('[data-q-field="explanation"]')?.value||"";
      const correct=Number(node.querySelector('[data-q-field="correctIndex"]')?.value||0);
      item.answers=[0,1,2,3].map(ai=>({label:node.querySelector('[data-q-answer="'+ai+'"]')?.value||"",correct:ai===correct})).filter(a=>String(a.label||"").trim());quizDraft[i]=item;
    });
  }else if(studioKind==="game"){
    gameDraft={type:q("csGameType")?.value||gameDraft.type||"choice",summary:q("csGameSummary")?.value||"",instructions:q("csGameInstructions")?.value||"",voiceCues:String(q("csGameVoiceCues")?.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean)};
  }
}
function voiceScript(){
  captureStructuredEditor();
  if(studioKind==="quiz")return quizDraft.map(item=>[item.question,...(item.answers||[]).map(a=>a.label),item.success,item.retry].filter(Boolean).join(". ")).filter(Boolean).join("\n\n");
  if(studioKind==="game")return [gameDraft.instructions,...(gameDraft.voiceCues||[])].filter(Boolean).join("\n\n");
  const text=String(q("text")?.value||"").trim();
  return studioKind==="story"?normalizeKidsStoryText(text):text;
}
function switchKind(kind){
  persistDraft();studioKind=kind||"story";
  document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.toggle("active",x.dataset.csKind===studioKind));
  q("csProphetTab")?.classList.remove("active");
  const title=document.querySelector(".editor-panel h1"),lead=document.querySelector(".editor-panel .lead");
  resetEditorForKind();
  if(studioKind==="story"){title.textContent="Kids-Geschichte produzieren";lead.textContent="Text, Serhat-Stimme, Cover und Altersfreigabe als ein Paket produzieren und direkt in die Kids-App veröffentlichen.";q("styleMode").value="kids_story"}
  else if(studioKind==="quiz"){title.textContent="Kids-Quiz produzieren";lead.textContent="Fragen, Antworten, Erklärung und Serhat-Stimme als eigenes geprüftes Quiz-Paket.";q("styleMode").value="kids_lesson"}
  else if(studioKind==="game"){title.textContent="Kids-Spiel produzieren";lead.textContent="Spielinhalt und wiederverwendbare Serhat-Sprachbausteine getrennt von Geschichten produzieren.";q("styleMode").value="kids_lesson"}
  else{title.textContent="iOS Content Studio";lead.textContent="Text, Serhat-Stimme, Cover und Metadaten als separates Paket für die offizielle iOS-App.";q("styleMode").value="narration"}
  q("csPublishTest").textContent=studioKind==="ios"?"iOS Staging veröffentlichen":"In Test-Kids veröffentlichen";q("csPublishLive").textContent=studioKind==="ios"?"iOS Live veröffentlichen":"Live veröffentlichen";
  contentId="";savedRevision=0;stagingPublished=false;contentStatus="draft";setProductionPhase("draft");restoreDraft();renderKindEditor();refreshQa();loadLibrary();
}
function saveConnection(){
  try{
    localStorage.setItem(WORKER_URL_KEY,String(q("csWorkerUrl").value||WORKER_DEFAULT).trim());
    localStorage.setItem(WORKER_SECRET_KEY,String(q("csSecret").value||"").trim());
  }catch{}
  setStudioMessage("Admin-Verbindung lokal gespeichert.","good");
  loadLibrary();
}
function fields(){
  captureStructuredEditor();
  let text=String(q("text")?.value||"").trim();
  if(studioKind==="story")text=normalizeKidsStoryText(text);
  return{
    id:contentId,
    kind:effectiveKind(),
    appTarget:effectiveTarget(),
    status:contentStatus,
    title:String(q("csTitle")?.value||"").trim(),
    category:String(q("csCategory")?.value||"").trim(),
    topic:String(q("csTopic")?.value||"").trim(),
    prophetId:String(q("csProphet")?.value||"").trim(),
    ageMin:Number(q("csAgeMin")?.value||4),
    ageMax:Number(q("csAgeMax")?.value||10),
    ageBand:studioKind==="quiz"?quizBandForRange(q("csAgeMin")?.value,q("csAgeMax")?.value):"",
    modes:{read:!!q("csModeRead")?.checked,listen:!!q("csModeListen")?.checked},
    text,
    sourceRefs:String(q("csSources")?.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean),
    question:legacyQuestion&&typeof legacyQuestion==="object"?legacyQuestion:{},
    claimIds:[...legacyClaimIds],
    tags:[...legacyTags],
    cover:coverAsset||{},
    audio:audioAsset||{},
    quiz:studioKind==="quiz"?{ageBand:quizBandForRange(q("csAgeMin")?.value,q("csAgeMax")?.value),questions:quizDraft.map(x=>({...x,answers:(x.answers||[]).filter(a=>String(a.label||"").trim())}))}:null,
    game:studioKind==="game"?{...gameDraft,voiceCues:[...(gameDraft.voiceCues||[])]}:null,
    production:{phase:productionPhase,error:productionError},
    verification:"studio-review",
    qa:{
      text:!!text,
      cover:!!coverAsset?.url,
      audio:!q("csModeListen")?.checked||!!audioAsset?.url,
      pronunciation:!q("csModeListen")?.checked||Boolean(qaConfirmed)||Boolean(audioAsset?.url&&contentId),
      source:true
    },
    push:{enabled:effectiveTarget()==="kids"}
  };
}
function persistDraft(){
  try{
    captureStructuredEditor();
    localStorage.setItem(draftKey(),JSON.stringify({
      kind:studioKind,title:q("csTitle")?.value||"",category:q("csCategory")?.value||"",
      topic:q("csTopic")?.value||"",prophetId:q("csProphet")?.value||"",
      ageMin:q("csAgeMin")?.value||"6",ageMax:q("csAgeMax")?.value||"10",
      read:q("csModeRead")?.checked!==false,listen:q("csModeListen")?.checked!==false,
      sources:q("csSources")?.value||"",text:q("text")?.value||"",quiz:quizDraft,game:gameDraft,
      legacyQuestion,legacyClaimIds,legacyTags
    }));
  }catch{}
}
function restoreDraft(){
  try{
    const d=JSON.parse(localStorage.getItem(draftKey())||"null");if(!d)return;
    q("csTitle").value=d.title||"";q("csCategory").value=d.category||(studioKind==="quiz"?"Quiz · geprüft":studioKind==="game"?"Spiel":studioKind==="ios"?"iOS · Inhalt":"Qurʾān · geprüft");
    q("csTopic").value=d.topic||"";q("csProphet").value=d.prophetId||"";
    q("csAgeMin").value=d.ageMin||"6";q("csAgeMax").value=d.ageMax||"10";
    q("csModeRead").checked=d.read!==false;q("csModeListen").checked=d.listen!==false;
    q("csSources").value=d.sources||"";q("text").value=d.text||"";
    quizDraft=Array.isArray(d.quiz)?d.quiz:[];gameDraft=d.game&&typeof d.game==="object"?d.game:{type:"choice",summary:"",instructions:"",voiceCues:[]};
    legacyQuestion=d.legacyQuestion&&typeof d.legacyQuestion==="object"?d.legacyQuestion:{};
    legacyClaimIds=Array.isArray(d.legacyClaimIds)?d.legacyClaimIds:[];
    legacyTags=Array.isArray(d.legacyTags)?d.legacyTags:[];
    q("csCoverTitle").textContent=d.title||"Neuer Inhalt";
  }catch{}
}
function handleCoverFile(file){
  if(!file)return;
  if(!/^image\/(png|jpeg|webp|avif)$/i.test(file.type)){setStudioMessage("Bitte PNG, JPEG, WEBP oder AVIF verwenden.","bad");return}
  if(file.size>12*1024*1024){setStudioMessage("Cover ist größer als 12 MB.","bad");return}
  coverFile=file;coverRemoteUrl="";coverAsset=null;
  const url=URL.createObjectURL(file);renderCover(url);
  setStudioMessage("Cover übernommen. Beim Speichern wird es versioniert hochgeladen.","good");refreshQa();
}
function renderCover(url){
  const box=q("csCover"); if(!box)return;
  box.querySelector("img")?.remove();
  const img=document.createElement("img");img.src=url;img.alt="Cover Vorschau";box.prepend(img);
}
async function generateCover({internal=false}={}){
  if(busy&&!internal)return;
  if(!workerSecret()){setStudioMessage("Admin-Verbindung fehlt. Unter „Admin-Verbindung“ Secret eintragen.","warn");return}
  const f=fields();
  if(!f.title&&!f.topic&&!f.text){setStudioMessage("Für ein Cover zuerst Titel oder Text eingeben.","warn");return}
  q("csCoverGenerate").disabled=true;q("csCoverGenerate").textContent="Cover wird erzeugt …";
  try{
    const d=await adminApi("/api/admin/kids-content/cover/generate",{method:"POST",body:JSON.stringify(f)});
    coverRemoteUrl=d.cover?.url||"";coverFile=null;coverAsset=null;
    if(!coverRemoteUrl)throw Error("Cover-URL fehlt");
    renderCover(coverRemoteUrl);
    setStudioMessage("Kids-Cover erzeugt. Propheten-/Historienregeln wurden im Prompt erzwungen.","good");
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{q("csCoverGenerate").disabled=false;q("csCoverGenerate").textContent="Cover erzeugen";refreshQa()}
}
async function produce(){
  if(busy)return;
  if(studioKind==="story")syncKidsStoryStandard();
  captureStructuredEditor();
  busy=true;setProductionPhase("producing");setStudioMessage("Produktion läuft parallel: Stimme, Cover und Paket werden vorbereitet …","warn");
  try{
    const needsVoice=!!q("csModeListen")?.checked;
    const script=voiceScript();
    if((studioKind==="story"||studioKind==="ios")&&!String(q("text")?.value||"").trim())throw Error("Text fehlt.");
    if(studioKind==="quiz"&&!quizDraft.some(x=>String(x.question||"").trim()))throw Error("Mindestens eine Quiz-Frage fehlt.");
    if(studioKind==="game"&&!String(gameDraft.instructions||"").trim())throw Error("Spielanleitung fehlt.");
    if(needsVoice&&!script)throw Error("Sprechtext fehlt.");
    if((studioKind==="quiz"||studioKind==="game")&&script)q("text").value=script;
    const tasks=[];
    if(needsVoice&&(!lastAudio||lastGeneratedText!==script))tasks.push(generate());
    if(!coverFile&&!coverRemoteUrl&&!coverAsset&&workerSecret())tasks.push(generateCover({internal:true}));
    await Promise.all(tasks);
    if(workerSecret()&&!coverAsset?.url&&(coverFile||coverRemoteUrl))await uploadCover();
    setProductionPhase(needsVoice&&!qaConfirmed?"awaiting-qa":"ready");
    if(workerSecret())await checkpointPackage(productionPhase);
    setStudioMessage(needsVoice&&!qaConfirmed?"Audio und Cover vorbereitet. Aussprache anhören und bestätigen; danach ist Test-Publish frei.":"Produktionspaket ist bereit für den Test-Publish.","good");
    setTimeout(focusNextProductionAction,120);
  }catch(e){
    setProductionPhase("error",e.message||String(e));
    if(workerSecret()&&contentId){try{await checkpointPackage("error",productionError)}catch{}}
    setStudioMessage(e.message||String(e),"bad");
  }finally{busy=false;refreshQa()}
}
async function ensureId(){
  if(contentId)return contentId;
  if(!workerSecret())throw Error("Admin-Verbindung fehlt.");
  const d=await adminApi("/api/admin/kids-content/id",{method:"POST",body:JSON.stringify({kind:effectiveKind(),title:q("csTitle")?.value||""})});
  contentId=d.id||"";if(!contentId)throw Error("Content-ID konnte nicht erstellt werden.");
  return contentId;
}
function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||""));r.onerror=()=>reject(r.error||Error("Datei konnte nicht gelesen werden"));r.readAsDataURL(blob)});
}
async function uploadCover(){
  if(coverAsset?.url)return coverAsset;
  const id=await ensureId();
  let body=null;
  if(coverFile)body={id,role:"cover",staging:true,dataUrl:await blobToDataUrl(coverFile),originalName:coverFile.name,source:"studio-drop"};
  else if(coverRemoteUrl)body={id,role:"cover",staging:true,remoteUrl:coverRemoteUrl,source:"studio-generated"};
  else throw Error("Cover fehlt.");
  const d=await adminApi("/api/admin/kids-content/media",{method:"POST",body:JSON.stringify(body)});
  coverAsset=d.asset;renderCover(coverAsset.url);return coverAsset;
}
async function compactAudioBlob(){
  if(!lastAudio||lastGeneratedText!==String(q("text")?.value||"").trim())throw Error("Finale Audio für diesen Text fehlt.");
  if(!qaConfirmed)throw Error("Aussprache zuerst bestätigen.");
  const r=await localRequest("/publish-audio",{method:"GET"});
  if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.error||"App-Audio konnte nicht vorbereitet werden.")}
  return await r.blob();
}
async function uploadAudio(){
  if(audioAsset?.url&&lastGeneratedText===String(q("text")?.value||"").trim()&&Array.isArray(audioAsset?.timings)&&audioAsset.timings.length)return audioAsset;
  const id=await ensureId();
  const blob=await compactAudioBlob();
  const storyText=String(q("text")?.value||"").trim();
  let alignment=null;
  if(storyText){
    setStudioMessage("Audio wird exakt mit dem Lesetext synchronisiert …","warn");
    const file=new File([blob],"serhat-story.m4a",{type:blob.type||"audio/mp4"});
    alignment=await alignStoryFile(file,storyText);
    if(!Array.isArray(alignment?.timings)||!alignment.timings.length)throw Error("Keine Mitlese-Zeitstempel erhalten.");
  }
  const d=await adminApi("/api/admin/kids-content/media",{method:"POST",body:JSON.stringify({
    id,role:"audio",staging:true,dataUrl:await blobToDataUrl(blob),originalName:"serhat-story.m4a",source:"serhat-mlx-master"
  })});
  audioAsset={
    ...d.asset,
    codec:"aac-72k-mono",
    timings:alignment?.timings||[],
    syncMode:alignment?.syncMode||"",
    alignmentLoss:alignment?.alignmentLoss??null
  };
  try{audioAsset.durationSec=await getAudioDuration(blob)}catch{}
  return audioAsset;
}
function getAudioDuration(blob){
  return new Promise((resolve,reject)=>{
    const a=document.createElement("audio"),u=URL.createObjectURL(blob);
    a.preload="metadata";a.onloadedmetadata=()=>{const d=Number(a.duration||0);URL.revokeObjectURL(u);resolve(d)};
    a.onerror=()=>{URL.revokeObjectURL(u);reject(Error("Audio-Metadaten fehlen"))};a.src=u;
  });
}
async function prepareAssets(){
  const f=fields();
  const jobs=[];
  if(!coverAsset?.url)jobs.push(uploadCover());
  if(f.modes.listen&&!audioAsset?.url)jobs.push(uploadAudio());
  await Promise.all(jobs);
}
async function checkpointPackage(phase=productionPhase,error=""){
  await ensureId();
  productionPhase=phase||productionPhase;productionError=error||"";
  const payload={...fields(),id:contentId,staging:true,status:"draft",production:{phase:productionPhase,error:productionError}};
  const d=await adminApi("/api/admin/kids-content/save",{method:"POST",body:JSON.stringify(payload)});
  savedRevision=d.item?.revision||savedRevision;return d.item;
}
async function saveDraftRemote(withAssets){
  if(busy)return null;
  busy=true;contentStatus="draft";renderStatus();
  try{
    await ensureId();
    if(withAssets)await prepareAssets();
    const payload={...fields(),id:contentId,staging:true,status:"draft",production:{phase:productionPhase,error:productionError}};
    const d=await adminApi("/api/admin/kids-content/save",{method:"POST",body:JSON.stringify(payload)});
    savedRevision=d.item?.revision||savedRevision;contentStatus=d.item?.status||"draft";renderStatus();
    setStudioMessage("Entwurf sicher im Staging gespeichert.","good");await loadLibrary();return d.item;
  }catch(e){setStudioMessage(e.message||String(e),"bad");throw e}
  finally{busy=false;refreshQa()}
}
async function publishTest(){
  if(busy)return;
  busy=true;contentStatus="review";renderStatus();
  try{
    await ensureId();
    await prepareAssets();
    setProductionPhase("ready");
    const payload={...fields(),id:contentId,staging:true,status:"review",production:{phase:"ready",error:""}};
    const saved=await adminApi("/api/admin/kids-content/save",{method:"POST",body:JSON.stringify(payload)});
    savedRevision=saved.item?.revision||0;
    const pub=await adminApi("/api/admin/kids-content/publish",{method:"POST",body:JSON.stringify({id:contentId,live:false,sendPush:false})});
    contentStatus="published";stagingPublished=true;setProductionPhase("test-published");renderStatus();
    setStudioMessage(effectiveTarget()==="ios"?"iOS-Paket im Staging veröffentlicht. Kein Besucher-Push wurde gesendet.":"In Test-Kids veröffentlicht. Kein Besucher-Push wurde gesendet.","good");await loadLibrary();
    setTimeout(()=>goToWorkflowStep("live"),100);
    return pub;
  }catch(e){contentStatus="draft";renderStatus();setStudioMessage(e.message||String(e),"bad")}
  finally{busy=false;refreshQa()}
}
async function triggerKidsOwnerVoiceSync(){
  if(effectiveTarget()!=="kids")return null;
  try{
    const res=await fetch("/kids-voice/sync-start",{
      method:"POST",
      cache:"no-store",
      headers:{"Content-Type":"application/json",Accept:"application/json"},
      body:"{}"
    });
    if(!res.ok)throw Error("Kids-Voice-Sync HTTP "+res.status);
    return await res.json().catch(()=>({ok:true}));
  }catch(e){
    console.warn("Kids-Owner-Voice-Sync konnte nicht sofort gestartet werden:",e);
    return null;
  }
}

async function publishLive(){
  if(busy||!stagingPublished)return;
  if(!confirm(effectiveTarget()==="ios"?"Diese geprüfte Version jetzt LIVE für die iOS-Inhalte veröffentlichen?":"Diese geprüfte Version jetzt LIVE in Kids veröffentlichen und den passenden Kids-Push senden?"))return;
  busy=true;renderStatus();
  try{
    const pub=await adminApi("/api/admin/kids-content/publish",{method:"POST",body:JSON.stringify({id:contentId,live:true,sendPush:effectiveTarget()==="kids",triggerDeploy:true})});
    contentStatus="published";setProductionPhase("live-published");renderStatus();
    const p=pub.push||{};
    setStudioMessage(effectiveTarget()==="ios"?"iOS-Inhalt live veröffentlicht.":(p.sent?"Live veröffentlicht · Kids-Push gesendet.":"Live veröffentlicht · Push: "+(p.reason||"kein Empfänger")),effectiveTarget()==="ios"||p.sent?"good":"warn");
    await loadLibrary(true);
    if(effectiveTarget()==="kids")await triggerKidsOwnerVoiceSync();
    setTimeout(()=>q("csLibrarySection")?.scrollIntoView?.({behavior:"smooth",block:"center"}),100);
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{busy=false;renderStatus();refreshQa()}
}

function inventoryKey(item){
  const title=String(item?.title||item?.id||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  return title.replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||String(item?.id||"");
}
function inventoryKindLabel(kind){
  return kind==="quiz"?"Quiz":kind==="game"?"Spiel":kind==="lesson"?"iOS-Inhalt":"Geschichte";
}
async function fetchLegacyKidsInventory(){
  const urls=[];
  try{
    if(location.hostname==="dar-al-tawhid.de"||location.hostname.endsWith(".dar-al-tawhid.de"))urls.push("/kids/data/stories-authentic.json?cb="+Date.now());
  }catch{}
  urls.push("https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/kids/data/stories-authentic.json?cb="+Date.now());
  let lastError=null;
  for(const url of urls){
    try{
      const r=await fetch(url,{cache:"no-store",mode:"cors"});
      if(!r.ok)throw Error("HTTP "+r.status);
      const d=await r.json();
      return Array.isArray(d?.items)?d.items.filter(x=>x?.verification==="approved"):[];
    }catch(e){lastError=e}
  }
  throw lastError||Error("Bestehender Kids-Bestand nicht erreichbar");
}
function mergedInventory(){
  const map=new Map();
  const add=(item,source)=>{
    if(!item)return;
    const key=inventoryKey(item);
    const row=map.get(key)||{key,title:item.title||item.id,legacy:null,staging:null,live:null};
    row[source]=item;
    if(item.title)row.title=item.title;
    map.set(key,row);
  };
  inventoryState.legacy.forEach(x=>add(x,"legacy"));
  inventoryState.staging.forEach(x=>add(x,"staging"));
  inventoryState.live.forEach(x=>add(x,"live"));
  return [...map.values()].sort((a,b)=>String(a.title).localeCompare(String(b.title),"de"));
}
function renderInventory(){
  const box=q("csLibrary"),summary=q("csInventorySummary");if(!box)return;
  const term=String(q("csInventorySearch")?.value||"").trim().toLowerCase();
  const all=mergedInventory();
  const rows=all.filter(row=>{
    if(!term)return true;
    const item=row.staging||row.live||row.legacy||{};
    return [row.title,item.prophetId,item.category,item.kind,item.topic].join(" ").toLowerCase().includes(term);
  });
  if(summary)summary.textContent="Bestand "+inventoryState.legacy.length+" · Studio intern/Test "+inventoryState.staging.length+" · Studio live "+inventoryState.live.length+" · zusammen "+all.length;
  if(!rows.length){box.innerHTML='<div class="notice">Keine passenden Inhalte gefunden.</div>';return}
  box.innerHTML=rows.map(row=>{
    const active=row.staging||row.live||row.legacy||{};
    const chips=[];
    if(row.legacy)chips.push('<span class="cs-chip legacy">BESTAND</span><span class="cs-chip test">TEST-KIDS</span>');
    if(row.staging)chips.push('<span class="cs-chip '+(row.staging.status==="published"?"test":"internal")+'">'+(row.staging.status==="published"?"STUDIO TEST":"INTERN")+'</span>');
    if(row.live)chips.push('<span class="cs-chip live">LIVE</span>');
    const textOk=!!String(active.text||"").trim();
    const audioOk=!!String((row.staging||row.live)?.audio?.url||"").trim();
    const coverOk=!!String((row.staging||row.live)?.cover?.url||"").trim();
    const age=(Number(active.ageMin)||4)+"–"+(Number(active.ageMax)||10)+" J.";
    const source=row.staging?"staging":row.live?"live":row.legacy?"legacy":"";
    const id=(row.staging||row.live||row.legacy)?.id||"";
    const open=source?'<button type="button" class="cs-inventory-item editable" data-cs-inventory="'+escapeHtml(id)+'" data-cs-source="'+source+'">':'<div class="cs-inventory-item">';
    const close=source?'</button>':'</div>';
    const editHint=source==='live'?' · anklicken zum Bearbeiten':source==='staging'?' · Arbeitsversion öffnen':source==='legacy'?' · anklicken zum Übernehmen':'';
    return open+'<b>'+escapeHtml(row.title||active.id)+'</b><span class="cs-inventory-meta">'+escapeHtml(inventoryKindLabel(active.kind||"story"))+' · '+escapeHtml(age)+' · Text '+(textOk?"✓":"–")+' · Audio '+(audioOk?"✓":"–")+' · Cover '+(coverOk?"✓":"–")+escapeHtml(editHint)+'</span><span class="cs-inventory-chips">'+chips.join("")+'</span>'+close;
  }).join("");
}
async function loadLibrary(force=false){
  const box=q("csLibrary");if(!box)return;
  if(force)box.innerHTML='<div class="notice">Bestand wird neu geladen …</div>';
  const jobs=[fetchLegacyKidsInventory()];
  if(workerSecret()){
    jobs.push(adminApi("/api/admin/kids-content?staging=1",{method:"GET"}));
    jobs.push(adminApi("/api/admin/kids-content?staging=0",{method:"GET"}));
  }else{
    jobs.push(Promise.resolve({index:{items:[]}}));
    jobs.push(Promise.resolve({index:{items:[]}}));
  }
  const [legacy,staging,live]=await Promise.allSettled(jobs);
  inventoryState={
    legacy:legacy.status==="fulfilled"?legacy.value:[],
    staging:staging.status==="fulfilled"?(staging.value.index?.items||[]):[],
    live:live.status==="fulfilled"?(live.value.index?.items||[]):[]
  };
  renderInventory();
  if(legacy.status==="rejected"&&!workerSecret())setStudioMessage("Kids-Bestand konnte nicht geladen werden. Admin-Verbindung ist ebenfalls nicht gesetzt.","warn");
}

async function loadLegacyForEdit(id){
  const x=inventoryState.legacy.find(i=>i.id===id);
  if(!x){setStudioMessage("BESTAND-Inhalt wurde nicht gefunden.","bad");return}
  studioKind="story";
  contentId=x.id||"";
  savedRevision=0;
  contentStatus="draft";
  stagingPublished=false;
  productionPhase="draft";
  productionError="";
  document.querySelectorAll("[data-cs-kind]").forEach(b=>b.classList.toggle("active",b.dataset.csKind===studioKind));
  q("styleMode").value="kids_story";
  q("csPublishTest").textContent="In Test-Kids veröffentlichen";
  q("csPublishLive").textContent="Live veröffentlichen";
  q("csTitle").value=x.title||"";
  q("csCategory").value=x.category||"Qurʾān · geprüft";
  q("csTopic").value=x.scene||"";
  q("csProphet").value=x.prophetId||"";
  q("csAgeMin").value=String(x.ageMin||4);
  q("csAgeMax").value=String(x.ageMax||10);
  q("csModeRead").checked=true;
  q("csModeListen").checked=true;
  q("csSources").value=(x.sourceRefs||[]).join("\n");
  q("text").value=x.text||"";
  legacyQuestion=x.question&&typeof x.question==="object"?x.question:{};
  legacyClaimIds=Array.isArray(x.claimIds)?[...x.claimIds]:[];
  legacyTags=["legacy-kids",x.id?("legacy-id:"+x.id):""].filter(Boolean);
  coverAsset=null;audioAsset=null;coverFile=null;coverRemoteUrl="";
  quizDraft=[];gameDraft={type:"choice",summary:"",instructions:"",voiceCues:[]};
  q("csCover")?.querySelector("img")?.remove();
  q("csCoverTitle").textContent=x.title||"Inhalt";
  renderKindEditor();
  if(typeof renderAnalysis==="function")renderAnalysis();
  renderStatus();refreshQa();persistDraft();
  setStudioMessage("BESTAND-Inhalt übernommen. Original bleibt unverändert. Text, Alter, Prophet, Quellen und vorhandene Quizfragen sind im Studio-Arbeitsentwurf erhalten. Jetzt Cover/Serhat-Audio vorbereiten und zuerst in Test-Kids veröffentlichen.","good");
  setTimeout(()=>goToWorkflowStep("text"),80);
}

async function loadLiveForEdit(id){
  const x=inventoryState.live.find(i=>i.id===id);
  if(!x){setStudioMessage("Live-Inhalt wurde nicht gefunden.","bad");return}
  studioKind=x.appTarget==="ios"?"ios":(x.kind||"story");
  contentId=x.id;
  savedRevision=x.revision||0;
  contentStatus="draft";
  stagingPublished=false;
  productionPhase="draft";
  productionError="";
  document.querySelectorAll("[data-cs-kind]").forEach(b=>b.classList.toggle("active",b.dataset.csKind===studioKind));
  q("csTitle").value=x.title||"";
  q("csCategory").value=x.category||"";
  q("csTopic").value=x.topic||"";
  q("csProphet").value=x.prophetId||"";
  q("csAgeMin").value=String(x.ageMin||4);
  q("csAgeMax").value=String(x.ageMax||10);
  q("csModeRead").checked=x.modes?.read!==false;
  q("csModeListen").checked=x.modes?.listen!==false;
  q("csSources").value=(x.sourceRefs||[]).join("\n");
  q("text").value=x.text||"";
  legacyQuestion=x.question&&typeof x.question==="object"?x.question:{};
  legacyClaimIds=Array.isArray(x.claimIds)?[...x.claimIds]:[];
  legacyTags=Array.isArray(x.tags)?[...x.tags]:[];
  coverAsset=x.cover?.url?x.cover:null;
  audioAsset=x.audio?.url?x.audio:null;
  quizDraft=Array.isArray(x.quiz?.questions)?x.quiz.questions:[];
  gameDraft=x.game&&typeof x.game==="object"?x.game:{type:"choice",summary:"",instructions:"",voiceCues:[]};
  coverFile=null;
  coverRemoteUrl="";
  q("csCover")?.querySelector("img")?.remove();
  if(coverAsset?.url)renderCover(coverAsset.url);
  q("csCoverTitle").textContent=x.title||"Inhalt";
  renderKindEditor();
  if(typeof renderAnalysis==="function")renderAnalysis();
  renderStatus();
  refreshQa();
  persistDraft();
  setStudioMessage("Live-Version als Arbeitskopie geladen. Deine Änderungen gehen zuerst nur ins Staging; die aktuelle Live-Version bleibt unverändert, bis du erneut Test → Live veröffentlichst.","good");
  setTimeout(()=>goToWorkflowStep("text"),80);
}

async function loadRemoteItem(id){
  try{
    const d=await adminApi("/api/admin/kids-content?staging=1",{method:"GET"});
    const x=(d.index?.items||[]).find(i=>i.id===id);if(!x)return;
    studioKind=x.appTarget==="ios"?"ios":(x.kind||"story");contentId=x.id;savedRevision=x.revision||0;contentStatus=x.status||"draft";stagingPublished=x.status==="published";productionPhase=x.production?.phase||(stagingPublished?"test-published":"draft");productionError=x.production?.error||"";
    document.querySelectorAll("[data-cs-kind]").forEach(b=>b.classList.toggle("active",b.dataset.csKind===studioKind));
    q("csTitle").value=x.title||"";q("csCategory").value=x.category||"";q("csTopic").value=x.topic||"";q("csProphet").value=x.prophetId||"";
    q("csAgeMin").value=String(x.ageMin||4);q("csAgeMax").value=String(x.ageMax||10);q("csModeRead").checked=x.modes?.read!==false;q("csModeListen").checked=x.modes?.listen!==false;
    q("csSources").value=(x.sourceRefs||[]).join("\n");q("text").value=x.text||"";
    legacyQuestion=x.question&&typeof x.question==="object"?x.question:{};
    legacyClaimIds=Array.isArray(x.claimIds)?[...x.claimIds]:[];
    legacyTags=Array.isArray(x.tags)?[...x.tags]:[];
    coverAsset=x.cover?.url?x.cover:null;audioAsset=x.audio?.url?x.audio:null;
    quizDraft=Array.isArray(x.quiz?.questions)?x.quiz.questions:[];gameDraft=x.game&&typeof x.game==="object"?x.game:{type:"choice",summary:"",instructions:"",voiceCues:[]};
    coverFile=null;coverRemoteUrl="";if(coverAsset?.url)renderCover(coverAsset.url);q("csCoverTitle").textContent=x.title||"Inhalt";
    renderKindEditor();if(typeof renderAnalysis==="function")renderAnalysis();renderStatus();refreshQa();setStudioMessage("Staging-Paket geladen.","good");setTimeout(()=>goToWorkflowStep("text"),80);
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
}
function refreshQa(){
  if(!q("csQaText"))return;
  captureStructuredEditor();
  const text=String(q("text")?.value||"").trim(),script=voiceScript(),same=!!lastAudio&&lastGeneratedText===script;
  const cover=!!(coverFile||coverRemoteUrl||coverAsset?.url);
  const audio=!q("csModeListen")?.checked||same||!!audioAsset?.url;
  const pron=!q("csModeListen")?.checked||Boolean(qaConfirmed&&same)||Boolean(audioAsset?.url&&contentId);
  const quizOk=quizDraft.length>0&&quizDraft.every(x=>String(x.question||"").trim()&&(x.answers||[]).filter(a=>String(a.label||"").trim()).length>=2&&(x.answers||[]).filter(a=>a.correct).length===1);
  const gameOk=Boolean(String(gameDraft.instructions||"").trim());
  const contentOk=studioKind==="quiz"?quizOk:studioKind==="game"?gameOk:Boolean(text);
  paintQa("csQaText",contentOk,contentOk?(studioKind==="quiz"?"Fragen bereit":studioKind==="game"?"Spiel bereit":"bereit"):"fehlt");
  paintQa("csQaCover",cover,cover?"bereit":"fehlt");paintQa("csQaAudio",audio,audio?"bereit":"fehlt");paintQa("csQaPron",pron,pron?"bestätigt":"offen");
  if(productionPhase==="awaiting-qa"&&contentOk&&cover&&audio&&pron)productionPhase="ready";
  const test=q("csPublishTest");
  const testDisabled=busy||!contentOk||!cover||!audio||!pron||!q("csTitle")?.value.trim();
  if(test)test.disabled=testDisabled;
  const quickTest=q("csQuickTest");if(quickTest)quickTest.disabled=testDisabled;
  const quickCopy=q("csQuickCopy");if(quickCopy)quickCopy.disabled=!text;
  const quickProduce=q("csQuickProduce");if(quickProduce)quickProduce.disabled=busy;
  renderStatus();
}
function paintQa(id,ok,label){const el=q(id);if(!el)return;el.textContent=label;el.className=ok?"good":"warn"}

window.DarContentStudio={mount,fields,loadLibrary,publishTest,publishLive,generateCover,produce,newCurrentItem,copyCurrentText,goToWorkflowStep,focusNextProductionAction,switchKind};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();