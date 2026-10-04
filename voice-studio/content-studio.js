/* Voice Studio 2.9.104 · Ṣaḥābah texts + direct audio file workspace */
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
let audioAssetText="";
let directAudioFile=null;
let directAudioAlignment=null;
let directAudioText="";
let directAudioObjectUrl="";
let contentStatus="draft";
let productionPhase="draft";
let productionError="";
let quizDraft=[];
let quizCatalogState={items:[],total:0,counts:{},voice:{},loaded:false,loading:false,error:""};
let quizCatalogSelectedId="";
let gameDraft={type:"choice",summary:"",instructions:"",voiceCues:[]};
let legacyQuestion={};
let legacyClaimIds=[];
let legacyTags=[];
let inventoryState={legacy:[],staging:[],live:[]};
let existingStoryTarget=null;
let busy=false;
let inventoryFilter="";

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
  if(!ta||existingStoryTarget||q("styleMode")?.value!=="kids_story")return false;
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
  const ownerAudio=directAudioReadyForCurrentText();
  const cover=!!(coverFile||coverRemoteUrl||coverAsset?.url);
  const boundAsset=!!audioAsset?.url&&(!audioAssetText||audioAssetText===script);
  const audio=!q("csModeListen")?.checked||ownerAudio||same||boundAsset;
  const pron=!q("csModeListen")?.checked||ownerAudio||Boolean(qaConfirmed&&same)||Boolean(boundAsset&&contentId);
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
  .cs-audio-drop{margin-top:9px;padding:11px 12px;border:1px dashed rgba(217,182,111,.34);border-radius:12px;background:rgba(217,182,111,.035);display:grid;gap:7px;cursor:pointer}
  .cs-audio-drop.drag{border-color:#ead18f;background:rgba(217,182,111,.09)}
  .cs-audio-drop.ready{border-style:solid;border-color:rgba(81,199,143,.42);background:rgba(42,144,96,.055)}
  .cs-audio-drop-head{display:flex;align-items:center;justify-content:space-between;gap:9px}.cs-audio-drop-head b{font-size:11px}.cs-audio-drop-head span{font-size:9px;color:#8ea1a4}
  .cs-audio-drop-actions{display:flex;gap:6px;flex-wrap:wrap}.cs-audio-drop-actions .btn{min-height:34px;padding:7px 9px;font-size:10px}
  #csDirectAudioPlayer{width:100%;height:36px}
  .cs-qa{display:grid;gap:6px}.cs-check{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}.cs-check:last-child{border:0}.cs-check b{font-size:10px}
  .cs-library{display:grid;gap:6px;max-height:180px;overflow:auto}.cs-item{border:1px solid var(--line);border-radius:9px;padding:8px;background:rgba(255,255,255,.025);cursor:pointer}.cs-item b{display:block;font-size:11px}.cs-item small{font-size:9px;color:#7f9499}
  .cs-disabled-pane{padding:20px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025);color:#879a9e;font-size:12px;line-height:1.6}
  .cs-structured{margin:0 0 14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.018)}
  .cs-structured[hidden]{display:none}.cs-structured h3{margin:0 0 10px;font-size:13px;color:#f0d59a}
  .cs-question{padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(0,0,0,.12);margin:8px 0}
  .cs-question-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.cs-question-head b{font-size:11px}.cs-question-head button{border:0;background:transparent;color:#df8686;cursor:pointer;font-size:11px}
  .cs-answer-grid,.cs-inline-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cs-add{width:100%;margin-top:8px}
  .cs-quiz-catalog{margin:0 0 14px;padding:13px;border:1px solid rgba(217,182,111,.18);border-radius:14px;background:linear-gradient(180deg,rgba(217,182,111,.035),rgba(255,255,255,.012))}
  .cs-quiz-catalog-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:9px}.cs-quiz-catalog-head h3{margin:0!important}.cs-quiz-catalog-head small{display:block;color:#7f9499;font-size:9px;line-height:1.4;margin-top:3px}
  .cs-quiz-catalog-count{font-size:10px;font-weight:900;color:#f0d59a;white-space:nowrap;padding:5px 8px;border:1px solid rgba(217,182,111,.22);border-radius:999px}
  .cs-quiz-catalog-toolbar{display:grid;grid-template-columns:minmax(180px,1.6fr) minmax(110px,.7fr) minmax(120px,.8fr) auto;gap:7px;margin-bottom:8px}
  .cs-quiz-catalog-toolbar input,.cs-quiz-catalog-toolbar select{min-width:0;border:1px solid var(--line);background:rgba(1,14,19,.62);color:#e9eeee;border-radius:9px;padding:8px 9px;min-height:38px}
  .cs-quiz-catalog-summary{font-size:9px;color:#809397;line-height:1.45;margin:0 0 8px}
  .cs-quiz-catalog-layout{display:grid;grid-template-columns:minmax(270px,.9fr) minmax(0,1.15fr);gap:9px;min-height:300px}
  .cs-quiz-catalog-list{display:grid;gap:6px;max-height:430px;overflow:auto;padding-right:2px;align-content:start}
  .cs-quiz-catalog-item{appearance:none;width:100%;text-align:left;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.022);color:#e7eeee;padding:9px 10px;cursor:pointer}
  .cs-quiz-catalog-item:hover{border-color:rgba(217,182,111,.34);background:rgba(217,182,111,.04)}.cs-quiz-catalog-item.active{border-color:rgba(217,182,111,.58);background:rgba(217,182,111,.08)}
  .cs-quiz-catalog-item-head{display:flex;align-items:center;gap:6px;font-size:8px;font-weight:900;color:#91a3a7;text-transform:uppercase;letter-spacing:.04em}.cs-quiz-catalog-item-head .voice{margin-left:auto}
  .cs-quiz-catalog-item b{display:block;font-size:11px;line-height:1.35;margin-top:5px}
  .cs-voice-published{color:#92ddb8}.cs-voice-local{color:#f0d18f}.cs-voice-missing{color:#e99797}
  .cs-quiz-detail{border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(0,0,0,.10);padding:12px;min-width:0}
  .cs-quiz-detail h4{font-size:15px;line-height:1.35;margin:2px 0 8px}.cs-quiz-detail-meta{font-size:9px;color:#8ea0a4;margin-bottom:9px}.cs-quiz-detail-source{font-size:9px;color:#d7c18d;margin-top:9px;line-height:1.45}
  .cs-quiz-answer-preview{display:grid;gap:5px}.cs-quiz-answer-preview div{padding:7px 9px;border:1px solid var(--line);border-radius:9px;font-size:10px}.cs-quiz-answer-preview div.correct{border-color:rgba(81,199,143,.34);color:#a9e5c7;background:rgba(81,199,143,.05)}
  .cs-quiz-detail-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.cs-quiz-detail-actions .btn{min-height:36px;font-size:10px}
  #csQuizCatalogPlayer{width:100%;height:38px;margin-top:9px}
  @media(max-width:900px){.cs-quiz-catalog-toolbar{grid-template-columns:1fr 1fr}.cs-quiz-catalog-toolbar input{grid-column:1/-1}.cs-quiz-catalog-layout{grid-template-columns:1fr}.cs-quiz-catalog-list{max-height:280px}}
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
      <button id="csSahabiyyatTab" class="cs-tab" type="button">Ṣaḥābiyyāt · 14</button>
      <button id="csAudioFilesTab" class="cs-tab" type="button">Audio-Dateien</button>
      <button class="cs-tab" data-cs-kind="story">Geschichten</button>
      <button class="cs-tab" data-cs-kind="dua">Duʿāʾ</button>
      <button class="cs-tab" data-cs-kind="narration">Erzählungen</button>
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
    <div id="csAudioDrop" class="cs-audio-drop" tabindex="0">
      <div class="cs-audio-drop-head"><b>Audio-Dateien hochladen</b><span id="csAudioFileName">MP3 · M4A · WAV · AAC</span></div>
      <div class="notice"><b>Klicken oder Drag & Drop:</b> Zuerst einen vorhandenen Text öffnen. Danach die fertige Audiodatei hier anklicken/auswählen oder direkt aus dem Finder hineinziehen. Audio und Text werden exakt miteinander verknüpft.</div>
      <input id="csAudioFile" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav" hidden>
      <div class="cs-audio-drop-actions">
        <button id="csAudioChoose" class="btn secondary" type="button">Audio auswählen</button>
        <button id="csAudioClear" class="btn quiet" type="button" hidden>Entfernen</button>
      </div>
      <audio id="csDirectAudioPlayer" controls preload="metadata" hidden></audio>
    </div>
    <div class="cs-actions" style="margin-top:7px">
      <button id="csProduce" class="btn primary" type="button">Audio + Cover vorbereiten</button>
      <button id="csSave" class="btn secondary" type="button">Entwurf speichern</button>
    </div>
    <button id="csDirectKids" class="btn primary" type="button" style="width:100%;margin-top:7px">Geprüfte Datei direkt in Kids</button>
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
  setTimeout(()=>{
    let requested="";
    try{requested=String(new URLSearchParams(location.search).get("kind")||"").trim().toLowerCase()}catch{}
    if(["story","dua","narration","quiz","game","ios"].includes(requested)){
      window.setStudioPage?.("content");
      switchKind(requested);
      return;
    }
    window.setStudioPage?.(window.studioPage||"prophets");
  },0);
}
function bind(){
  document.querySelectorAll("[data-cs-kind]").forEach(btn=>btn.addEventListener("click",()=>{
    inventoryFilter="";
    window.setStudioPage?.("content");
    ["csProphetTab","csSahabaTab","csSahabiyyatTab","csAudioFilesTab","csPronunciationTab","csAlphabetTab","csFreeVoiceTab","csSystemTab"].forEach(id=>q(id)?.classList.remove("active"));
    switchKind(btn.dataset.csKind);
  }));
  q("csProphetTab")?.addEventListener("click",()=>{
    inventoryFilter="";
    switchKind("story");
    document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.remove("active"));
    q("csSahabaTab")?.classList.remove("active");
  q("csSahabiyyatTab")?.classList.remove("active");
    q("csAudioFilesTab")?.classList.remove("active");
    window.setStudioPage?.("prophets");
  });
  q("csSahabaTab")?.addEventListener("click",async()=>{
    inventoryFilter="sahaba";
    switchKind("story");
    window.setStudioPage?.("content");
    document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.remove("active"));
    ["csProphetTab","csSahabiyyatTab","csAudioFilesTab","csPronunciationTab","csAlphabetTab","csFreeVoiceTab","csSystemTab"].forEach(id=>q(id)?.classList.remove("active"));
    q("csSahabaTab")?.classList.add("active");
    const title=document.querySelector(".editor-panel h1"),lead=document.querySelector(".editor-panel .lead");
    if(title)title.textContent="Ṣaḥābah-Geschichten";
    if(lead)lead.textContent="Einen Ṣaḥābī und eine Altersfassung anklicken. Der vollständige vorhandene Text wird direkt ins Voice-Studio geladen; danach Audio anklicken oder aus dem Finder hineinziehen.";
    await loadLibrary(true);
    q("csLibrarySection")?.scrollIntoView?.({behavior:"smooth",block:"start"});
  });
  q("csSahabiyyatTab")?.addEventListener("click",async()=>{
    inventoryFilter="sahabiyyat";
    switchKind("story");
    window.setStudioPage?.("content");
    document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.remove("active"));
    ["csProphetTab","csSahabaTab","csAudioFilesTab","csPronunciationTab","csAlphabetTab","csFreeVoiceTab","csSystemTab"].forEach(id=>q(id)?.classList.remove("active"));
    q("csSahabiyyatTab")?.classList.add("active");
    const title=document.querySelector(".editor-panel h1"),lead=document.querySelector(".editor-panel .lead");
    if(title)title.textContent="Ṣaḥābiyyāt-Geschichten";
    if(lead)lead.textContent="Eine Ṣaḥābiyyah und eine Altersfassung anklicken. Der vollständige vorhandene Mastertext wird direkt ins Voice-Studio geladen; danach Audio erzeugen oder MP3/M4A hineinziehen und direkt in Kids veröffentlichen.";
    await loadLibrary(true);
    q("csLibrarySection")?.scrollIntoView?.({behavior:"smooth",block:"start"});
  });
  q("csAudioFilesTab")?.addEventListener("click",()=>{
    window.setStudioPage?.("content");
    document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.remove("active"));
    ["csProphetTab","csSahabaTab","csSahabiyyatTab","csPronunciationTab","csAlphabetTab","csFreeVoiceTab","csSystemTab"].forEach(id=>q(id)?.classList.remove("active"));
    q("csAudioFilesTab")?.classList.add("active");
    const title=document.querySelector(".editor-panel h1"),lead=document.querySelector(".editor-panel .lead");
    if(title)title.textContent="Audio-Dateien";
    if(lead)lead.textContent="Vorhandenen Text öffnen oder einfügen. Danach MP3, M4A, AAC oder WAV per Klick auswählen oder direkt aus dem Finder in die Upload-Zone ziehen.";
    setTimeout(()=>q("csAudioDrop")?.scrollIntoView?.({behavior:"smooth",block:"center"}),80);
    setTimeout(()=>q("csAudioDrop")?.focus?.(),140);
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
    if(directAudioFile&&directAudioText!==voiceScript()){
      resetDirectAudioSelection();
      audioAsset=null;audioAssetText="";
      stagingPublished=false;
    }
    if(audioAsset?.url&&audioAssetText&&audioAssetText!==voiceScript()){
      audioAsset=null;audioAssetText="";
      stagingPublished=false;
      if(productionPhase!=="draft")setProductionPhase("draft");
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
  q("csAudioChoose")?.addEventListener("click",e=>{e.stopPropagation();q("csAudioFile")?.click()});
  q("csAudioFile")?.addEventListener("change",e=>handleDirectAudioFile(e.target.files?.[0]));
  q("csAudioClear")?.addEventListener("click",e=>{e.stopPropagation();resetDirectAudioSelection();refreshQa();setStudioMessage("Direkte Audio entfernt.","good")});
  q("csAudioDrop")?.addEventListener("click",e=>{if(!e.target.closest("button,audio"))q("csAudioFile")?.click()});
  q("csAudioDrop")?.addEventListener("dragover",e=>{e.preventDefault();q("csAudioDrop")?.classList.add("drag")});
  q("csAudioDrop")?.addEventListener("dragleave",()=>q("csAudioDrop")?.classList.remove("drag"));
  q("csAudioDrop")?.addEventListener("drop",e=>{e.preventDefault();q("csAudioDrop")?.classList.remove("drag");handleDirectAudioFile(e.dataTransfer?.files?.[0])});
  q("csDirectKids")?.addEventListener("click",publishDirectKids);
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
  existingStoryTarget=null;contentId="";savedRevision=0;stagingPublished=false;contentStatus="draft";
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
function effectiveKind(){
  if(studioKind==="ios"||studioKind==="dua")return"lesson";
  if(studioKind==="narration")return"story";
  return studioKind;
}
function effectiveTarget(){return studioKind==="ios"?"ios":"kids"}
function studioSectionTag(){
  return studioKind==="dua"?"studio:dua":studioKind==="narration"?"studio:narration":"";
}
function studioKindForItem(item={}){
  if(item.appTarget==="ios")return"ios";
  const tags=Array.isArray(item.tags)?item.tags.map(String):[];
  const category=String(item.category||"").toLowerCase();
  const topic=String(item.topic||"").toLowerCase();
  if(tags.includes("studio:dua")||/du[ʿ'’]?a|bittgebet/.test(category+" "+topic))return"dua";
  if(tags.includes("studio:narration")||/erzähl|erzaehl|narration/.test(category+" "+topic))return"narration";
  return item.kind||"story";
}
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
function quizVoiceStateLabel(state){
  if(state==="published")return"Audio live";
  if(state==="local")return"Audio lokal";
  return"Audio fehlt";
}
function quizVoiceStateClass(state){
  return state==="published"?"cs-voice-published":state==="local"?"cs-voice-local":"cs-voice-missing";
}
function quizCatalogHtml(){
  return '<div class="cs-quiz-catalog" id="csQuizCatalog">'+
    '<div class="cs-quiz-catalog-head"><div><h3>Quiz-Fragenübersicht</h3><small>Jede Kids-Frage einzeln auswählen, Quelle prüfen und Serhat-Audio testen.</small></div><span id="csQuizCatalogCount" class="cs-quiz-catalog-count">lädt …</span></div>'+
    '<div class="cs-quiz-catalog-toolbar">'+
      '<input id="csQuizCatalogSearch" type="search" placeholder="Nr., Frage, Thema oder Quelle suchen …">'+
      '<select id="csQuizCatalogAge"><option value="">Alle Altersstufen</option><option value="4-6">4–6 Jahre</option><option value="7-8">7–8 Jahre</option><option value="9-10">9–10 Jahre</option></select>'+
      '<select id="csQuizCatalogVoice"><option value="">Alle Voice-Status</option><option value="published">Audio live</option><option value="local">Audio nur lokal</option><option value="missing">Audio fehlt</option></select>'+
      '<button id="csQuizCatalogSync" class="btn quiet" type="button">Fehlende Stimmen syncen</button>'+
    '</div>'+
    '<div id="csQuizCatalogSummary" class="cs-quiz-catalog-summary">Quizbestand wird geladen …</div>'+
    '<div class="cs-quiz-catalog-layout"><div id="csQuizCatalogList" class="cs-quiz-catalog-list"></div><div id="csQuizCatalogDetail" class="cs-quiz-detail">Frage auswählen …</div></div>'+
  '</div>';
}
async function loadQuizCatalog(force=false){
  if(quizCatalogState.loading)return;
  if(quizCatalogState.loaded&&!force){renderQuizCatalog();return}
  quizCatalogState.loading=true;quizCatalogState.error="";
  renderQuizCatalog();
  try{
    const r=await fetch("/kids-quiz/catalog?cb="+Date.now(),{cache:"no-store"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok===false)throw Error(d.error||"Quizbestand konnte nicht geladen werden.");
    quizCatalogState={...d,loaded:true,loading:false,error:""};
    if(!quizCatalogSelectedId&&d.items?.length)quizCatalogSelectedId=d.items[0].id;
  }catch(e){
    quizCatalogState={...quizCatalogState,loaded:false,loading:false,error:e.message||String(e)};
  }
  renderQuizCatalog();
}
function filteredQuizCatalog(){
  const search=String(q("csQuizCatalogSearch")?.value||"").trim().toLowerCase();
  const age=String(q("csQuizCatalogAge")?.value||"");
  const voice=String(q("csQuizCatalogVoice")?.value||"");
  return (quizCatalogState.items||[]).filter(item=>{
    if(age&&item.ageBand!==age)return false;
    if(voice&&item.voiceState!==voice)return false;
    if(!search)return true;
    const hay=[item.number,item.id,item.category,item.topic,item.question,item.source].join(" ").toLowerCase();
    return hay.includes(search);
  });
}
function renderQuizCatalog(){
  const list=q("csQuizCatalogList"),detail=q("csQuizCatalogDetail"),summary=q("csQuizCatalogSummary"),count=q("csQuizCatalogCount");
  if(!list||!detail||!summary||!count)return;
  if(quizCatalogState.loading){
    count.textContent="lädt …";summary.textContent="Quizbestand und Voice-Status werden frisch geladen …";list.innerHTML="";detail.textContent="Bitte kurz warten …";return;
  }
  if(quizCatalogState.error){
    count.textContent="Fehler";summary.textContent=quizCatalogState.error;list.innerHTML='<button class="btn quiet" id="csQuizCatalogRetry" type="button">Erneut laden</button>';detail.textContent="";q("csQuizCatalogRetry")?.addEventListener("click",()=>loadQuizCatalog(true));return;
  }
  const all=quizCatalogState.items||[];
  const rows=filteredQuizCatalog();
  const v=quizCatalogState.voice||{};
  count.textContent=String(quizCatalogState.total||all.length)+" Fragen";
  summary.textContent=rows.length+" angezeigt · Audio live "+Number(v.published||0)+" · nur lokal "+Number(v.local||0)+" · fehlt "+Number(v.missing||0);
  if(!rows.length){
    list.innerHTML='<div class="notice">Keine Frage passt zu diesem Filter.</div>';detail.textContent="Filter ändern oder Suche leeren.";return;
  }
  if(!rows.some(x=>x.id===quizCatalogSelectedId))quizCatalogSelectedId=rows[0].id;
  list.innerHTML=rows.map(item=>
    '<button type="button" class="cs-quiz-catalog-item '+(item.id===quizCatalogSelectedId?"active":"")+'" data-cs-quiz-id="'+escapeHtml(item.id)+'">'+
      '<span class="cs-quiz-catalog-item-head">#'+String(item.number).padStart(3,"0")+' · '+escapeHtml(item.ageBand)+' · '+escapeHtml(item.category)+'<span class="voice '+quizVoiceStateClass(item.voiceState)+'">'+quizVoiceStateLabel(item.voiceState)+'</span></span>'+
      '<b>'+escapeHtml(item.question)+'</b>'+
    '</button>'
  ).join("");
  renderQuizCatalogDetail();
}
function selectedQuizCatalogItem(){
  return (quizCatalogState.items||[]).find(x=>x.id===quizCatalogSelectedId)||null;
}
function renderQuizCatalogDetail(){
  const box=q("csQuizCatalogDetail"),item=selectedQuizCatalogItem();if(!box)return;
  if(!item){box.textContent="Frage auswählen …";return}
  const answers=(item.answers||[]).map((a,i)=>'<div class="'+(a.correct?"correct":"")+'">'+String.fromCharCode(65+i)+' · '+escapeHtml(a.label||"")+(a.correct?" · richtig":"")+'</div>').join("");
  box.innerHTML=
    '<div class="cs-quiz-detail-meta">#'+String(item.number).padStart(3,"0")+' · '+escapeHtml(item.ageBand)+' · '+escapeHtml(item.category)+' · <span class="'+quizVoiceStateClass(item.voiceState)+'">'+quizVoiceStateLabel(item.voiceState)+'</span></div>'+
    '<h4>'+escapeHtml(item.question)+'</h4>'+
    '<div class="cs-quiz-answer-preview">'+answers+'</div>'+
    (item.explanation?'<div class="notice" style="margin-top:9px">'+escapeHtml(item.explanation)+'</div>':"")+
    '<div class="cs-quiz-detail-source"><b>Quelle:</b> '+escapeHtml(item.source||"—")+'</div>'+
    '<audio id="csQuizCatalogPlayer" controls preload="none" x-webkit-airplay="deny" disableremoteplayback '+(item.audioUrl?"":"hidden")+'></audio>'+
    '<div class="cs-quiz-detail-actions">'+
      '<button class="btn secondary" type="button" data-cs-quiz-action="play" '+(item.audioUrl?"":"disabled")+'>Serhat-Audio hören</button>'+
      '<button class="btn quiet" type="button" data-cs-quiz-action="render">'+(item.voiceState==="missing"?"Audio erzeugen":"Audio lokal neu erzeugen")+'</button>'+
      '<button class="btn quiet" type="button" data-cs-quiz-action="edit">In Editor übernehmen</button>'+
    '</div>';
}
function bindQuizCatalogUi(){
  q("csQuizCatalogSearch")?.addEventListener("input",renderQuizCatalog);
  q("csQuizCatalogAge")?.addEventListener("change",renderQuizCatalog);
  q("csQuizCatalogVoice")?.addEventListener("change",renderQuizCatalog);
  q("csQuizCatalogSync")?.addEventListener("click",syncQuizCatalogVoice);
  q("csQuizCatalogList")?.addEventListener("click",e=>{
    const btn=e.target.closest?.("[data-cs-quiz-id]");if(!btn)return;
    quizCatalogSelectedId=btn.dataset.csQuizId||"";renderQuizCatalog();
  });
  q("csQuizCatalogDetail")?.addEventListener("click",e=>{
    const btn=e.target.closest?.("[data-cs-quiz-action]");if(!btn)return;
    const action=btn.dataset.csQuizAction;
    if(action==="play")playSelectedQuizAudio();
    else if(action==="render")renderSelectedQuizAudio(btn);
    else if(action==="edit")useSelectedQuizInEditor();
  });
}
function playSelectedQuizAudio(){
  const item=selectedQuizCatalogItem(),player=q("csQuizCatalogPlayer");if(!item||!player||!item.audioUrl)return;
  player.hidden=false;player.src=item.audioUrl+(item.audioUrl.includes("?")?"&":"?")+"cb="+Date.now();player.play().catch(()=>{});
}
async function renderSelectedQuizAudio(btn){
  const item=selectedQuizCatalogItem();if(!item||!btn)return;
  const old=btn.textContent;btn.disabled=true;btn.textContent="Serhat erzeugt …";
  try{
    const r=await fetch("/kids-quiz/render-one",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id}),cache:"no-store"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok===false)throw Error(d.error||"Audio konnte nicht erzeugt werden.");
    quizCatalogSelectedId=item.id;
    await loadQuizCatalog(true);
    setStudioMessage("Frage #"+item.number+" ist lokal mit deiner Serhat-Stimme bereit. Der nächste Kids-Voice-Sync kann sie direkt veröffentlichen.","good");
    setTimeout(playSelectedQuizAudio,80);
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{btn.disabled=false;btn.textContent=old}
}
async function syncQuizCatalogVoice(){
  const btn=q("csQuizCatalogSync");if(!btn)return;
  const old=btn.textContent;btn.disabled=true;btn.textContent="Sync startet …";
  try{
    const r=await fetch("/kids-voice/sync-start",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",cache:"no-store"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok===false)throw Error(d.error||"Kids-Voice-Sync konnte nicht gestartet werden.");
    setStudioMessage("Kids-Voice-Sync läuft. Fehlende Quiz-Audios werden im Hintergrund ergänzt und anschließend in die Kids-App übertragen.","good");
    setTimeout(()=>loadQuizCatalog(true),2200);
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{btn.disabled=false;btn.textContent=old}
}
function useSelectedQuizInEditor(){
  const item=selectedQuizCatalogItem();if(!item)return;
  setQuizAgeBand(item.ageBand);
  if(q("csTitle"))q("csTitle").value="Quiz #"+String(item.number).padStart(3,"0")+" · "+(item.topic||item.category||"");
  if(q("csTopic"))q("csTopic").value=item.topic||"";
  if(q("csCategory"))q("csCategory").value=item.category||"Quiz · geprüft";
  if(q("csSources"))q("csSources").value=item.source||"";
  quizDraft=[{
    question:item.question||"",
    answers:(item.answers||[]).map(a=>({label:a.label||"",correct:!!a.correct})),
    success:item.success||"Richtig. Sehr gut!",
    retry:item.retry||"Noch nicht. Hör gut zu und versuch es noch einmal.",
    explanation:item.explanation||""
  }];
  renderKindEditor();persistDraft();refreshQa();
  setStudioMessage("Frage #"+item.number+" wurde in den Editor übernommen.","good");
}
function blankQuizQuestion(){return{question:"",answers:[{label:"",correct:true},{label:"",correct:false}],success:"Richtig.",retry:"Versuche es noch einmal.",explanation:""}}
function setProductionPhase(phase,error=""){productionPhase=phase||"draft";productionError=error||"";renderStatus()}
function resetEditorForKind(){
  q("csTitle").value="";q("csTopic").value="";q("csProphet").value="";q("csSources").value="";q("text").value="";
  if(studioKind==="quiz"){q("csAgeMin").value="7";q("csAgeMax").value="8"}else{q("csAgeMin").value="6";q("csAgeMax").value="10"}
  q("csModeRead").checked=true;q("csModeListen").checked=true;
  q("csCategory").value=studioKind==="quiz"?"Quiz · geprüft":studioKind==="game"?"Spiel":studioKind==="ios"?"iOS · Inhalt":studioKind==="dua"?"Duʿāʾ · geprüft":studioKind==="narration"?"Erzählung · geprüft":"Qurʾān · geprüft";
  coverFile=null;coverRemoteUrl="";coverAsset=null;audioAsset=null;audioAssetText="";resetDirectAudioSelection();quizDraft=[];gameDraft={type:"choice",summary:"",instructions:"",voiceCues:[]};
  legacyQuestion={};legacyClaimIds=[];legacyTags=[];
  q("csCover")?.querySelector("img")?.remove();q("csCoverTitle").textContent="Neuer Inhalt";
}
function renderKindEditor(){
  const wrap=q("csStructured"),body=q("csStructuredBody");if(!wrap||!body)return;
  if(studioKind==="quiz"){
    wrap.hidden=false;if(!quizDraft.length)quizDraft=[blankQuizQuestion()];
    const currentBand=quizBandForRange(q("csAgeMin")?.value,q("csAgeMax")?.value);
    body.innerHTML=quizCatalogHtml()+"<h3>Quiz-Aufbau</h3><div class=\"cs-field\" style=\"margin-bottom:10px\"><label for=\"csQuizAgeBand\">Quiz-Altersstufe</label><select id=\"csQuizAgeBand\"><option value=\"4-6\" "+(currentBand==="4-6"?"selected":"")+">4–6 Jahre</option><option value=\"7-8\" "+(currentBand==="7-8"?"selected":"")+">7–8 Jahre</option><option value=\"9-10\" "+(currentBand==="9-10"?"selected":"")+">9–10 Jahre</option></select></div>"+quizDraft.map((item,i)=>{
      const answers=Array.isArray(item.answers)?item.answers:[];
      const opts=[0,1,2,3].map(ai=>"<option value=\""+ai+"\" "+(answers[ai]?.correct?"selected":"")+">"+String.fromCharCode(65+ai)+"</option>").join("");
      const ans=[0,1,2,3].map(ai=>{const a=answers[ai]||{};return "<div class=\"cs-field\"><label>Antwort "+String.fromCharCode(65+ai)+"</label><input data-q-answer=\""+ai+"\" data-q-index=\""+i+"\" value=\""+escapeHtml(a.label||"")+"\"></div>"}).join("");
      return "<div class=\"cs-question\" data-cs-question=\""+i+"\"><div class=\"cs-question-head\"><b>Frage "+(i+1)+"</b><button type=\"button\" data-cs-remove-question=\""+i+"\">Entfernen</button></div><div class=\"cs-field\"><label>Frage</label><input data-q-field=\"question\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.question||"")+"\"></div><div class=\"cs-answer-grid\">"+ans+"</div><div class=\"cs-inline-grid\" style=\"margin-top:8px\"><div class=\"cs-field\"><label>Richtige Antwort</label><select data-q-field=\"correctIndex\" data-q-index=\""+i+"\">"+opts+"</select></div><div class=\"cs-field\"><label>Erfolg</label><input data-q-field=\"success\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.success||"Richtig.")+"\"></div></div><div class=\"cs-field\" style=\"margin-top:8px\"><label>Nochmal versuchen</label><input data-q-field=\"retry\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.retry||"Versuche es noch einmal.")+"\"></div><div class=\"cs-field\" style=\"margin-top:8px\"><label>Kurze Erklärung nach richtiger Antwort</label><input data-q-field=\"explanation\" data-q-index=\""+i+"\" value=\""+escapeHtml(item.explanation||"")+"\"></div></div>";
    }).join("")+"<button class=\"btn quiet cs-add\" type=\"button\" data-cs-add-question>+ Frage hinzufügen</button>";
    q("csQuizAgeBand")?.addEventListener("change",e=>{setQuizAgeBand(e.target.value);persistDraft();refreshQa()});
    setTimeout(()=>{bindQuizCatalogUi();loadQuizCatalog();},0);
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
  return studioKind==="story"&&!existingStoryTarget?normalizeKidsStoryText(text):text;
}
function switchKind(kind){
  persistDraft();existingStoryTarget=null;studioKind=kind||"story";
  document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.toggle("active",x.dataset.csKind===studioKind));
  q("csProphetTab")?.classList.remove("active");
  q("csSahabaTab")?.classList.remove("active");
  q("csAudioFilesTab")?.classList.remove("active");
  const title=document.querySelector(".editor-panel h1"),lead=document.querySelector(".editor-panel .lead");
  resetEditorForKind();
  if(studioKind==="story"){title.textContent="Kids-Geschichten";lead.textContent="Vorhandenen Text öffnen oder neuen Text schreiben · Stimme erzeugen oder fertige Audio direkt hochladen · anschließend in Kids veröffentlichen.";q("styleMode").value="kids_story"}
  else if(studioKind==="dua"){title.textContent="Duʿāʾ · Hören & Lernen";lead.textContent="Duʿāʾ-Text auswählen, deine fertige Audio direkt zuordnen oder neu erzeugen und mit kurzem Weg in Kids veröffentlichen.";q("styleMode").value="dua"}
  else if(studioKind==="narration"){title.textContent="Erzählungen";lead.textContent="Erzähltexte auswählen, deine fertige Audio zuordnen oder neu erzeugen und direkt als Kids-Inhalt bereitstellen.";q("styleMode").value="narration"}
  else if(studioKind==="quiz"){title.textContent="Kids-Quiz produzieren";lead.textContent="Fragen, Antworten, Erklärung und Serhat-Stimme als eigenes geprüftes Quiz-Paket.";q("styleMode").value="kids_lesson"}
  else if(studioKind==="game"){title.textContent="Kids-Spiel produzieren";lead.textContent="Spielinhalt und wiederverwendbare Serhat-Sprachbausteine getrennt von Geschichten produzieren.";q("styleMode").value="kids_lesson"}
  else{title.textContent="iOS Content Studio";lead.textContent="Text, Serhat-Stimme, Cover und Metadaten als separates Paket für die offizielle iOS-App.";q("styleMode").value="narration"}
  q("csPublishTest").textContent=studioKind==="ios"?"iOS Staging veröffentlichen":"In Test-Kids veröffentlichen";q("csPublishLive").textContent=studioKind==="ios"?"iOS Live veröffentlichen":"Live veröffentlichen";
  if(q("csDirectKids"))q("csDirectKids").hidden=studioKind==="ios";
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
  if(studioKind==="story"&&!existingStoryTarget)text=normalizeKidsStoryText(text);
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
    tags:Array.from(new Set([...legacyTags,...(studioSectionTag()?[studioSectionTag()]:[])])),
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
    q("csTitle").value=d.title||"";q("csCategory").value=d.category||(studioKind==="quiz"?"Quiz · geprüft":studioKind==="game"?"Spiel":studioKind==="ios"?"iOS · Inhalt":studioKind==="dua"?"Duʿāʾ · geprüft":studioKind==="narration"?"Erzählung · geprüft":"Qurʾān · geprüft");
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
function resetDirectAudioSelection(){
  if(directAudioObjectUrl){try{URL.revokeObjectURL(directAudioObjectUrl)}catch{}}
  directAudioObjectUrl="";directAudioFile=null;directAudioAlignment=null;directAudioText="";
  const player=q("csDirectAudioPlayer");if(player){player.pause();player.removeAttribute("src");player.hidden=true}
  const name=q("csAudioFileName");if(name)name.textContent="MP3 · M4A · WAV · AAC";
  q("csAudioDrop")?.classList.remove("ready");
  if(q("csAudioClear"))q("csAudioClear").hidden=true;
  if(q("csAudioFile"))q("csAudioFile").value="";
}
function directAudioReadyForCurrentText(){
  return !!directAudioFile&&!!directAudioAlignment&&directAudioText===voiceScript();
}
function directReferenceKind(){
  if(studioKind==="dua")return"dua";
  if(studioKind==="narration")return"narration";
  return"story";
}
function localReferenceLearningAvailable(){
  // localRequest routes either straight to the Mac engine or through the authenticated
  // same-origin Cloud GPU gateway. Owner audio/text memory therefore works on Mac,
  // iPhone and iPad without requiring a local IP connection.
  try{return typeof localRequest==="function"}catch(_){return false}
}
async function registerDirectAudioLearning(){
  if(!directAudioReadyForCurrentText()||!localReferenceLearningAvailable())return null;
  const dataUrl=await blobToDataUrl(directAudioFile);
  const id=contentId||("studio-"+Date.now());
  const ageMin=Math.max(4,Number(q("csAgeMin")?.value||4));
  const ageMax=Math.max(ageMin,Number(q("csAgeMax")?.value||10));
  const res=await localRequest("/content-audio/reference",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      kind:directReferenceKind(),
      id,
      age:ageMin+"-"+ageMax,
      text:voiceScript(),
      filename:directAudioFile.name||"serhat-owner-audio",
      dataUrl,
      timings:directAudioAlignment?.timings||[],
      syncMode:directAudioAlignment?.syncMode||""
    })
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data?.ok===false)throw Error(data?.error||"Audio/Text-Referenz konnte lokal nicht gelernt werden.");
  return data;
}
async function handleDirectAudioFile(file){
  if(!file)return;
  const script=voiceScript();
  if(!script){setStudioMessage("Öffne oder füge zuerst den fertigen Text ein. Danach kann die Audio exakt diesem Inhalt zugeordnet werden.","warn");return}
  const ext=String(file.name||"").toLowerCase().split(".").pop();
  if(!String(file.type||"").startsWith("audio/")&&!["mp3","m4a","aac","wav"].includes(ext)){setStudioMessage("Bitte MP3, M4A, AAC oder WAV verwenden.","bad");return}
  if(file.size>30*1024*1024){setStudioMessage("Die Audiodatei ist größer als 30 MB. Bitte als MP3/M4A komprimieren, damit Upload und Kids-Publish sicher durchlaufen.","bad");return}
  setStudioMessage("Audio wird dem geöffneten Text zugeordnet und für Mitlesen synchronisiert …","warn");
  try{
    const alignment=await alignStoryFile(file,script);
    if(!Array.isArray(alignment?.timings)||!alignment.timings.length)throw Error("Keine Mitlese-Zeitstempel erhalten.");
    resetDirectAudioSelection();
    directAudioFile=file;directAudioAlignment=alignment;directAudioText=script;
    directAudioObjectUrl=URL.createObjectURL(file);
    const player=q("csDirectAudioPlayer");if(player){player.src=directAudioObjectUrl;player.hidden=false}
    if(q("csAudioFileName"))q("csAudioFileName").textContent=file.name+" · "+Math.max(1,Math.round(file.size/1024))+" KB";
    q("csAudioDrop")?.classList.add("ready");if(q("csAudioClear"))q("csAudioClear").hidden=false;
    audioAsset=null;audioAssetText="";stagingPublished=false;if(productionPhase!=="draft")setProductionPhase("draft");
    setStudioMessage("Fertige Audio ist dem aktuellen Text zugeordnet. Keine neue Sprachgenerierung nötig.","good");
    refreshQa();
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
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
    if(["story","dua","narration","ios"].includes(studioKind)&&!String(q("text")?.value||"").trim())throw Error("Text fehlt.");
    if(studioKind==="quiz"&&!quizDraft.some(x=>String(x.question||"").trim()))throw Error("Mindestens eine Quiz-Frage fehlt.");
    if(studioKind==="game"&&!String(gameDraft.instructions||"").trim())throw Error("Spielanleitung fehlt.");
    if(needsVoice&&!script)throw Error("Sprechtext fehlt.");
    if((studioKind==="quiz"||studioKind==="game")&&script)q("text").value=script;
    const tasks=[];
    if(needsVoice&&!directAudioReadyForCurrentText()&&(!lastAudio||lastGeneratedText!==script))tasks.push(generate());
    if(!coverFile&&!coverRemoteUrl&&!coverAsset&&workerSecret())tasks.push(generateCover({internal:true}));
    await Promise.all(tasks);
    if(workerSecret()&&!coverAsset?.url&&(coverFile||coverRemoteUrl))await uploadCover();
    setProductionPhase(needsVoice&&!qaConfirmed?"awaiting-qa":"ready");
    if(workerSecret()&&!existingStoryTarget)await checkpointPackage(productionPhase);
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
  const script=voiceScript();
  if(audioAsset?.url&&audioAssetText===script&&Array.isArray(audioAsset?.timings)&&audioAsset.timings.length)return audioAsset;
  const id=await ensureId();
  const manual=directAudioReadyForCurrentText();
  const blob=manual?directAudioFile:await compactAudioBlob();
  const storyText=script;
  let alignment=manual?directAudioAlignment:null;
  let uploadName=manual?(directAudioFile.name||"serhat-owner-audio"):"serhat-story.m4a";
  if(storyText&&!alignment){
    setStudioMessage("Audio wird mit dem Lesetext synchronisiert …","warn");
    const file=new File([blob],uploadName,{type:blob.type||"audio/mp4"});
    alignment=await alignStoryFile(file,storyText);
    if(!Array.isArray(alignment?.timings)||!alignment.timings.length)throw Error("Keine Mitlese-Zeitstempel erhalten.");
  }
  const dataUrl=await blobToDataUrl(blob);
  const d=await adminApi("/api/admin/kids-content/media",{method:"POST",body:JSON.stringify({
    id,role:"audio",staging:true,dataUrl,originalName:uploadName,source:manual?"manual-owner-upload":"serhat-mlx-master"
  })});
  audioAsset={
    ...d.asset,
    codec:manual?"owner-upload":"aac-72k-mono",
    timings:alignment?.timings||[],
    syncMode:alignment?.syncMode||"",
    alignmentLoss:alignment?.alignmentLoss??null,
    ownerApproved:manual
  };
  audioAssetText=script;
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
  if(existingStoryTarget)return null;
  await ensureId();
  productionPhase=phase||productionPhase;productionError=error||"";
  const payload={...fields(),id:contentId,staging:true,status:"draft",production:{phase:productionPhase,error:productionError}};
  const d=await adminApi("/api/admin/kids-content/save",{method:"POST",body:JSON.stringify(payload)});
  savedRevision=d.item?.revision||savedRevision;return d.item;
}
async function saveDraftRemote(withAssets){
  if(existingStoryTarget){
    persistDraft();
    setStudioMessage("Bestehende Propheten-/Ṣaḥābah-Geschichte: Der Text bleibt unverändert. Audio über „Direkt in Kids“ aktualisieren.","good");
    return null;
  }
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

function existingStoryKindLabel(kind){
  return kind==="prophet"?"Propheten-Geschichte":kind==="sahabiyyat"?"Ṣaḥābiyyāt-Geschichte":"Ṣaḥābah-Geschichte";
}
async function publishExistingStoryAudioDirect(){
  if(busy||!existingStoryTarget)return null;
  if(!workerSecret()){setStudioMessage("Admin-Verbindung fehlt. Einmal verbinden, danach bleibt der Direktweg verfügbar.","warn");return null}
  const script=voiceScript();
  if(!script){setStudioMessage("Der hinterlegte Erzähltext fehlt.","bad");return null}
  const manual=directAudioReadyForCurrentText();
  const generated=!!lastAudio&&lastGeneratedText===script&&Boolean(qaConfirmed);
  if(!manual&&!generated){
    setStudioMessage("Zuerst fertige MP3/M4A hochladen oder Audio mit deiner Stimme erzeugen und einmal bestätigen.","warn");
    return null;
  }
  if(!confirm(existingStoryKindLabel(existingStoryTarget.kind)+" · "+existingStoryTarget.age.replace("-","–")+" jetzt mit dieser Audio direkt im bestehenden Kids-Bereich aktualisieren?"))return null;
  busy=true;renderStatus();
  setStudioMessage("Direktweg läuft: exakter Text → Audio → bestehender Kids-Bereich …","warn");
  try{
    let blob,file,alignment,originalName;
    if(manual){
      blob=directAudioFile;
      file=directAudioFile;
      alignment=directAudioAlignment;
      originalName=directAudioFile.name||"serhat-owner-audio";
    }else{
      blob=await compactAudioBlob();
      originalName="serhat-voice-"+existingStoryTarget.itemId+"-"+existingStoryTarget.age+".m4a";
      file=new File([blob],originalName,{type:blob.type||"audio/mp4"});
      alignment=await alignStoryFile(file,script);
    }
    if(!Array.isArray(alignment?.timings)||!alignment.timings.length)throw Error("Mitlese-Zeitstempel fehlen.");
    const durationSec=await getAudioDuration(blob);
    const dataUrl=await blobToDataUrl(blob);
    const result=await adminApi("/api/admin/kids-existing-story/audio",{
      method:"POST",
      body:JSON.stringify({
        storyKind:existingStoryTarget.kind,
        itemId:existingStoryTarget.itemId,
        age:existingStoryTarget.age,
        text:script,
        dataUrl,
        originalName,
        durationSec,
        timings:alignment.timings,
        syncMode:alignment.syncMode||"",
        triggerDeploy:true
      })
    });
    existingStoryTarget={...existingStoryTarget,existingAudio:result.asset||null};
    setProductionPhase("live-published");
    setStudioMessage(
      existingStoryKindLabel(existingStoryTarget.kind)+
      " · "+existingStoryTarget.age.replace("-","–")+" aktualisiert. Audio und Mitlese-Zeiten sind direkt im bestehenden Kids-Bereich gespeichert.",
      "good"
    );
    if(manual&&localReferenceLearningAvailable()){
      const learnId=existingStoryTarget.kind+"-"+existingStoryTarget.itemId+"-"+existingStoryTarget.age;
      localRequest("/content-audio/reference",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          kind:"story",id:learnId,age:existingStoryTarget.age,text:script,
          filename:originalName,dataUrl,timings:alignment.timings,syncMode:alignment.syncMode||""
        })
      }).catch(()=>null);
    }
    await loadLibrary(true);
    return result;
  }catch(e){
    setProductionPhase("error",e.message||String(e));
    setStudioMessage(e.message||String(e),"bad");
    return null;
  }finally{busy=false;renderStatus();refreshQa()}
}

async function publishDirectKids(){
  if(busy||effectiveTarget()!=="kids")return;
  if(existingStoryTarget)return publishExistingStoryAudioDirect();
  if(!workerSecret()){setStudioMessage("Admin-Verbindung fehlt. Einmal verbinden, danach bleibt der Kurzweg verfügbar.","warn");return}
  const script=voiceScript();
  if(!String(q("csTitle")?.value||"").trim()){setStudioMessage("Titel fehlt.","warn");return}
  if(!script){setStudioMessage("Text fehlt.","warn");return}
  if(q("csModeListen")?.checked&&!audioAsset?.url&&!directAudioReadyForCurrentText()){
    setStudioMessage("Für den Direktweg zuerst deine fertige Audio hochladen. Neu erzeugte Audio bitte einmal anhören und bestätigen.","warn");return
  }
  if(!confirm("Diesen geprüften Inhalt jetzt direkt in DĀR AL TAWḤĪD Kids veröffentlichen?"))return;
  busy=true;renderStatus();setStudioMessage("Kurzweg läuft: Medien → Test-Sicherung → Kids live …","warn");
  try{
    if(!coverAsset?.url){
      if(!coverFile&&!coverRemoteUrl)await generateCover({internal:true});
      if(!coverAsset?.url&&(coverFile||coverRemoteUrl))await uploadCover();
    }
    if(q("csModeListen")?.checked&&!audioAsset?.url)await uploadAudio();
    if(!coverAsset?.url)throw Error("Cover fehlt.");
    await ensureId();
    setProductionPhase("ready");
    let payload={...fields(),id:contentId,staging:true,status:"review",production:{phase:"ready",error:""}};
    const saved=await adminApi("/api/admin/kids-content/save",{method:"POST",body:JSON.stringify(payload)});
    savedRevision=saved.item?.revision||savedRevision;
    await adminApi("/api/admin/kids-content/publish",{method:"POST",body:JSON.stringify({id:contentId,live:false,sendPush:false})});
    const pub=await adminApi("/api/admin/kids-content/publish",{method:"POST",body:JSON.stringify({id:contentId,live:true,sendPush:false,triggerDeploy:true})});
    contentStatus="published";stagingPublished=true;setProductionPhase("live-published");renderStatus();
    setStudioMessage("Live in Kids veröffentlicht. Datei, Text und Mitlese-Synchronisierung sind als ein Paket verbunden.","good");
    if(directAudioReadyForCurrentText()&&localReferenceLearningAvailable()){
      registerDirectAudioLearning().then(()=>{
        console.info("[DĀR Voice] Eigentümer-Audio/Text-Referenz dauerhaft gelernt.");
      }).catch(e=>{
        console.warn("[DĀR Voice] Referenzlernen im Hintergrund fehlgeschlagen:",e);
      });
    }
    triggerKidsOwnerVoiceSync();
    await loadLibrary(true);
    return pub;
  }catch(e){
    setProductionPhase("error",e.message||String(e));
    setStudioMessage(e.message||String(e),"bad");
  }finally{busy=false;refreshQa()}
}
async function publishTest(){
  if(existingStoryTarget)return publishExistingStoryAudioDirect();
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
  if(existingStoryTarget)return publishExistingStoryAudioDirect();
  if(busy||!stagingPublished)return;
  if(!confirm(effectiveTarget()==="ios"?"Diese geprüfte Version jetzt LIVE für die iOS-Inhalte veröffentlichen?":"Diese geprüfte Version jetzt LIVE in Kids veröffentlichen und den passenden Kids-Push senden?"))return;
  busy=true;renderStatus();
  try{
    const pub=await adminApi("/api/admin/kids-content/publish",{method:"POST",body:JSON.stringify({id:contentId,live:true,sendPush:effectiveTarget()==="kids",triggerDeploy:true})});
    contentStatus="published";setProductionPhase("live-published");renderStatus();
    const p=pub.push||{};
    setStudioMessage(effectiveTarget()==="ios"?"iOS-Inhalt live veröffentlicht.":(p.sent?"Live veröffentlicht · Kids-Push gesendet.":"Live veröffentlicht · Push: "+(p.reason||"kein Empfänger")),effectiveTarget()==="ios"||p.sent?"good":"warn");
    await loadLibrary(true);
    if(effectiveTarget()==="kids"){
      await triggerKidsOwnerVoiceSync();
      if(directAudioReadyForCurrentText()&&localReferenceLearningAvailable()){
        registerDirectAudioLearning().then(()=>{
          console.info("[DĀR Voice] Eigentümer-Audio/Text-Referenz dauerhaft gelernt.");
        }).catch(e=>{
          console.warn("[DĀR Voice] Referenzlernen im Hintergrund fehlgeschlagen:",e);
        });
      }
    }
    setTimeout(()=>q("csLibrarySection")?.scrollIntoView?.({behavior:"smooth",block:"center"}),100);
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{busy=false;renderStatus();refreshQa()}
}

function inventoryKey(item){
  const title=String(item?.title||item?.id||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const slug=title.replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||String(item?.id||"");
  return studioKindForItem(item||{})+":"+slug;
}
function inventoryKindLabel(item){
  const k=studioKindForItem(item||{});
  return k==="quiz"?"Quiz":k==="game"?"Spiel":k==="dua"?"Duʿāʾ":k==="narration"?"Erzählung":k==="ios"?"iOS-Inhalt":"Geschichte";
}
async function fetchExistingKidsJson(path){
  const clean=String(path||"").replace(/^\/+/, "");
  const urls=[];
  try{
    if(location.hostname==="dar-al-tawhid.de"||location.hostname.endsWith(".dar-al-tawhid.de"))urls.push("/"+clean+"?cb="+Date.now());
  }catch{}
  urls.push("https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/"+clean+"?cb="+Date.now());
  let lastError=null;
  for(const url of urls){
    try{
      const r=await fetch(url,{cache:"no-store",mode:"cors"});
      if(!r.ok)throw Error("HTTP "+r.status);
      return await r.json();
    }catch(e){lastError=e}
  }
  throw lastError||Error("Kids-Bestand nicht erreichbar: "+clean);
}
function legacyQuestionByAges(question,ageMin,ageMax){
  if(!question||typeof question!=="object"||!String(question.question||"").trim())return {};
  const out={};
  if(Number(ageMin||4)<=5&&Number(ageMax||10)>=4)out["4–5"]={...question};
  if(Number(ageMin||4)<=8&&Number(ageMax||10)>=6)out["6–8"]={...question};
  if(Number(ageMin||4)<=10&&Number(ageMax||10)>=9)out["9–10"]={...question};
  return out;
}
function normalizeLegacyStory(item){
  if(!item||item.verification!=="approved")return null;
  return{
    ...item,
    kind:"story",appTarget:"kids",
    modes:{read:true,listen:true},
    cover:{url:"/kids/assets/kids-art/section-stories-v1097.png?v=1097-real3",source:"existing-kids-art",type:"cover"},
    tags:["legacy-kids","legacy-story","legacy-id:"+String(item.id||"")],
    verification:"approved"
  };
}
function normalizeLegacyDua(item){
  if(!item||item.verification!=="verified")return null;
  const ageMin=Number(item.ageMin||4),ageMax=Number(item.ageMax||10);
  const text=[String(item.childPrompt||"").trim(),String(item.meaning||"").trim()].filter(Boolean).join("\n\n");
  if(!text)return null;
  return{
    id:"legacy-"+String(item.id||item.canonicalId||"dua"),
    kind:"lesson",appTarget:"kids",
    ageMin,ageMax,
    title:String(item.title||"Duʿāʾ"),
    category:"Duʿāʾ · geprüft",
    topic:String(item.scene||item.type||"Duʿāʾ"),
    text,
    sourceRefs:[String(item.source||"").trim()].filter(Boolean),
    question:legacyQuestionByAges(item.quiz,ageMin,ageMax),
    claimIds:[],
    tags:["studio:dua","legacy-kids","legacy-dua","legacy-id:"+String(item.id||""),"canonical-id:"+String(item.canonicalId||"")].filter(Boolean),
    modes:{read:true,listen:true},
    cover:{url:"/kids/assets/quiz-scenes/topic-dua.svg?v=20261004-topic1",source:"existing-kids-art",type:"cover"},
    verification:"verified",
    legacySource:item
  };
}
function normalizeLegacyNarration(item){
  if(!item||!String(item.text||"").trim())return null;
  return{
    id:"legacy-narration-"+String(item.id||"story"),
    kind:"story",appTarget:"kids",
    ageMin:4,ageMax:10,
    title:String(item.title||"Erzählung"),
    category:"Adab · Erzählung",
    topic:"Erzählung",
    text:String(item.text||"").trim(),
    sourceRefs:[],
    question:item.question&&typeof item.question==="object"?item.question:{},
    claimIds:[],
    tags:["studio:narration","legacy-kids","legacy-narration","legacy-id:"+String(item.id||"")],
    modes:{read:true,listen:true},
    cover:{url:"/kids/assets/quiz-scenes/topic-adab.svg?v=20261004-topic1",source:"existing-kids-art",type:"cover"},
    verification:"prepared"
  };
}

function ageRangeForStoryBand(age){
  const a=String(age||"").replace(/[–—]/g,"-");
  return a==="4-5"?[4,5]:a==="6-8"?[6,8]:a==="9-10"?[9,10]:[4,10];
}
function legacyQuizFromStory(item){
  const question=String(item?.question||"").trim();
  const answers=Array.isArray(item?.answers)?item.answers:[];
  const correct=Math.max(0,Number(item?.correct||0));
  if(!question||answers.length<2)return{};
  return{
    question,
    answers:answers.map((label,index)=>({label:String(label||""),correct:index===correct})),
    success:"Richtig.",
    retry:"Hör die Geschichte noch einmal aufmerksam."
  };
}
function normalizeExistingProphetStories(item){
  if(!item||!String(item.id||"").trim())return[];
  const scripts=item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  const quiz=legacyQuizFromStory(item);
  return["4-5","6-8","9-10"].map(age=>{
    const text=String(scripts[age]||item.voiceScript||"").trim();
    if(!text)return null;
    const range=ageRangeForStoryBand(age);
    return{
      id:"existing-prophet-"+String(item.id)+"-"+age,
      kind:"story",appTarget:"kids",ageMin:range[0],ageMax:range[1],
      title:String(item.storyTitle||item.title||item.name||item.id)+" · "+age.replace("-","–")+" Jahre",
      category:"Propheten · Geschichte",topic:String(item.name||item.id),
      prophetId:String(item.id||""),text,
      sourceRefs:Array.isArray(item.sourceRefs)?item.sourceRefs:[],
      question:Object.keys(quiz).length?{[age.replace("-","–")]:quiz}:{},
      claimIds:[],tags:["legacy-kids","legacy-existing-story","existing-story:prophet","legacy-id:"+String(item.id)],
      modes:{read:true,listen:true},
      cover:item.cover?{url:String(item.cover),source:"existing-kids-art",type:"cover"}:{url:"/kids/assets/kids-art/section-stories-v1097.png?v=1097-real3",source:"existing-kids-art",type:"cover"},
      existingAudio:item.audio?.[age]||null,
      existingStory:{kind:"prophet",itemId:String(item.id),age},
      verification:"approved"
    };
  }).filter(Boolean);
}
function normalizeExistingMubashshirunStories(item){
  if(!item||!String(item.id||"").trim())return[];
  const scripts=item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  const quiz=legacyQuizFromStory(item);
  return["4-5","6-8","9-10"].map(age=>{
    const text=String(scripts[age]||"").trim();
    if(!text)return null;
    const range=ageRangeForStoryBand(age);
    return{
      id:"existing-mubashshirun-"+String(item.id)+"-"+age,
      kind:"story",appTarget:"kids",ageMin:range[0],ageMax:range[1],
      title:String(item.name||item.short||item.id)+" · "+age.replace("-","–")+" Jahre",
      category:"Ṣaḥābah · Geschichte",topic:String(item.trait||item.category||"Ṣaḥābah"),
      text,
      sourceRefs:Array.isArray(item.sourceRefs)?item.sourceRefs:[],
      question:Object.keys(quiz).length?{[age.replace("-","–")]:quiz}:{},
      claimIds:[],tags:["legacy-kids","legacy-existing-story","existing-story:mubashshirun","legacy-id:"+String(item.id)],
      modes:{read:true,listen:true},
      cover:item.cover?{url:String(item.cover),source:"existing-kids-art",type:"cover"}:{url:"/kids/assets/kids-art/section-stories-v1097.png?v=1097-real3",source:"existing-kids-art",type:"cover"},
      existingAudio:item.audio?.[age]||null,
      existingStory:{kind:"mubashshirun",itemId:String(item.id),age},
      verification:"approved"
    };
  }).filter(Boolean);
}
function normalizeExistingSahabiyyatStories(item){
  if(!item||!String(item.id||"").trim())return[];
  const scripts=item.scripts&&typeof item.scripts==="object"?item.scripts:{};
  const quiz=legacyQuizFromStory(item);
  return["4-5","6-8","9-10"].map(age=>{
    const text=String(scripts[age]||"").trim();
    if(!text)return null;
    const range=ageRangeForStoryBand(age);
    return{
      id:"existing-sahabiyyat-"+String(item.id)+"-"+age,
      kind:"story",appTarget:"kids",ageMin:range[0],ageMax:range[1],
      title:String(item.name||item.short||item.id)+" · "+age.replace("-","–")+" Jahre",
      category:"Ṣaḥābiyyāt · Geschichte",topic:String(item.trait||item.category||"Ṣaḥābiyyāt"),
      text,
      sourceRefs:Array.isArray(item.sourceRefs)?item.sourceRefs:[],
      question:Object.keys(quiz).length?{[age.replace("-","–")]:quiz}:{},
      claimIds:[],tags:["legacy-kids","legacy-existing-story","existing-story:sahabiyyat","legacy-id:"+String(item.id)],
      modes:{read:true,listen:true},
      cover:item.cover?{url:String(item.cover),source:"existing-kids-art",type:"cover"}:{url:"/kids/assets/kids-art/section-stories-v1097.png?v=1097-real3",source:"existing-kids-art",type:"cover"},
      existingAudio:item.audio?.[age]||null,
      existingStory:{kind:"sahabiyyat",itemId:String(item.id),age},
      verification:"approved"
    };
  }).filter(Boolean);
}
async function fetchLegacyKidsInventory(){
  const results=await Promise.allSettled([
    fetchExistingKidsJson("kids/data/stories-authentic.json"),
    fetchExistingKidsJson("kids/data/dua-kids.json"),
    fetchExistingKidsJson("kids/data/short-stories-voice.json"),
    fetchExistingKidsJson("kids/data/prophet-stories.json"),
    fetchExistingKidsJson("kids/data/mubashshirun-stories.json"),
    fetchExistingKidsJson("kids/data/sahabiyyat-stories.json")
  ]);
  const stories=results[0].status==="fulfilled"&&Array.isArray(results[0].value?.items)
    ?results[0].value.items.map(normalizeLegacyStory).filter(Boolean):[];
  const duas=results[1].status==="fulfilled"&&Array.isArray(results[1].value?.items)
    ?results[1].value.items.map(normalizeLegacyDua).filter(Boolean):[];
  const narrations=results[2].status==="fulfilled"&&Array.isArray(results[2].value?.items)
    ?results[2].value.items.map(normalizeLegacyNarration).filter(Boolean):[];
  const prophets=results[3].status==="fulfilled"&&Array.isArray(results[3].value?.items)
    ?results[3].value.items.flatMap(normalizeExistingProphetStories):[];
  const mubashshirun=results[4].status==="fulfilled"&&Array.isArray(results[4].value?.items)
    ?results[4].value.items.flatMap(normalizeExistingMubashshirunStories):[];
  const sahabiyyat=results[5].status==="fulfilled"&&Array.isArray(results[5].value?.items)
    ?results[5].value.items.flatMap(normalizeExistingSahabiyyatStories):[];
  const all=[...prophets,...mubashshirun,...sahabiyyat,...stories,...duas,...narrations];
  if(!all.length){
    const failed=results.filter(x=>x.status==="rejected").map(x=>x.reason?.message||String(x.reason||"")).filter(Boolean);
    throw Error(failed.join(" · ")||"Bestehender Kids-Bestand ist leer.");
  }
  return all;
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
    const item=row.staging||row.live||row.legacy||{};
    const itemStudioKind=studioKindForItem(item);
    const tags=Array.isArray(item.tags)?item.tags.map(String):[];
    if(inventoryFilter==="sahaba"&&!tags.includes("existing-story:mubashshirun"))return false;
    if(inventoryFilter==="sahabiyyat"&&!tags.includes("existing-story:sahabiyyat"))return false;
    const sectionMatch=studioKind==="ios"
      ?item.appTarget==="ios"
      :studioKind==="dua"
      ?itemStudioKind==="dua"
      :studioKind==="narration"
      ?itemStudioKind==="narration"
      :studioKind==="quiz"
      ?item.kind==="quiz"
      :studioKind==="game"
      ?item.kind==="game"
      :studioKind==="story"
      ?(item.kind==="story"&&itemStudioKind!=="narration")
      :true;
    if(!sectionMatch)return false;
    if(!term)return true;
    return [row.title,item.prophetId,item.category,item.kind,item.topic,(item.tags||[]).join(" ")].join(" ").toLowerCase().includes(term);
  });
  if(summary)summary.textContent=inventoryFilter==="sahaba"
    ?("Ṣaḥābah-Texte · "+rows.length+" Altersfassungen · anklicken → Text + Audio-Upload")
    :inventoryFilter==="sahabiyyat"
      ?("Ṣaḥābiyyāt-Texte · "+rows.length+" Altersfassungen · anklicken → Text + Audio-Upload")
      :("Bestand "+inventoryState.legacy.length+" · Studio intern/Test "+inventoryState.staging.length+" · Studio live "+inventoryState.live.length+" · zusammen "+all.length);
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
    return open+'<b>'+escapeHtml(row.title||active.id)+'</b><span class="cs-inventory-meta">'+escapeHtml(inventoryKindLabel(active))+' · '+escapeHtml(age)+' · Text '+(textOk?"✓":"–")+' · Audio '+(audioOk?"✓":"–")+' · Cover '+(coverOk?"✓":"–")+escapeHtml(editHint)+'</span><span class="cs-inventory-chips">'+chips.join("")+'</span>'+close;
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
  studioKind=studioKindForItem(x);
  existingStoryTarget=x.existingStory?{...x.existingStory,title:x.title||"",existingAudio:x.existingAudio||null}:null;
  contentId=existingStoryTarget?"":(x.id||"");
  savedRevision=0;
  contentStatus="draft";
  stagingPublished=false;
  productionPhase="draft";
  productionError="";
  document.querySelectorAll("[data-cs-kind]").forEach(b=>b.classList.toggle("active",b.dataset.csKind===studioKind));
  q("styleMode").value=studioKind==="dua"?"dua":studioKind==="narration"?"narration":"kids_story";
  q("csPublishTest").textContent="In Test-Kids veröffentlichen";
  q("csPublishLive").textContent="Live veröffentlichen";
  q("csTitle").value=x.title||"";
  q("csCategory").value=x.category||(studioKind==="dua"?"Duʿāʾ · geprüft":studioKind==="narration"?"Adab · Erzählung":"Qurʾān · geprüft");
  q("csTopic").value=x.topic||x.scene||"";
  q("csProphet").value=x.prophetId||"";
  q("csAgeMin").value=String(x.ageMin||4);
  q("csAgeMax").value=String(x.ageMax||10);
  q("csModeRead").checked=x.modes?.read!==false;
  q("csModeListen").checked=x.modes?.listen!==false;
  q("csSources").value=(x.sourceRefs||[]).join("\n");
  q("text").value=x.text||"";
  legacyQuestion=x.question&&typeof x.question==="object"?x.question:{};
  legacyClaimIds=Array.isArray(x.claimIds)?[...x.claimIds]:[];
  legacyTags=Array.isArray(x.tags)?[...x.tags]:["legacy-kids",x.id?("legacy-id:"+x.id):""].filter(Boolean);
  coverAsset=x.cover?.url?x.cover:null;audioAsset=existingStoryTarget?null:(x.audio?.url?x.audio:null);audioAssetText=existingStoryTarget?"":String(x.text||"").trim();coverFile=null;coverRemoteUrl="";resetDirectAudioSelection();
  quizDraft=[];gameDraft={type:"choice",summary:"",instructions:"",voiceCues:[]};
  q("csCover")?.querySelector("img")?.remove();
  if(coverAsset?.url)renderCover(coverAsset.url);
  q("csCoverTitle").textContent=x.title||"Inhalt";
  renderKindEditor();
  if(typeof renderAnalysis==="function")renderAnalysis();
  renderStatus();refreshQa();persistDraft();
  setStudioMessage(
    existingStoryTarget
      ?(existingStoryKindLabel(existingStoryTarget.kind)+" · Alter "+existingStoryTarget.age.replace("-","–")+" geöffnet. Exakter vorhandener Text ist bereit: Audio erzeugen oder fertige MP3/M4A hochladen → direkt in den bestehenden Kids-Bereich.")
      :((studioKind==="dua"?"Duʿāʾ":studioKind==="narration"?"Erzählung":"Geschichte")+" aus dem vorhandenen Kids-Bestand geöffnet. Text ist sofort bereit: Audio erzeugen oder fertige MP3/M4A hochladen → direkt Kids veröffentlichen."),
    "good"
  );
  setTimeout(()=>goToWorkflowStep("text"),80);
  if(existingStoryTarget?.kind==="mubashshirun"){
    inventoryFilter="sahaba";
    q("csSahabaTab")?.classList.add("active");
    q("csSahabiyyatTab")?.classList.remove("active");
    setTimeout(()=>q("csAudioDrop")?.scrollIntoView?.({behavior:"smooth",block:"center"}),260);
  }else if(existingStoryTarget?.kind==="sahabiyyat"){
    inventoryFilter="sahabiyyat";
    q("csSahabiyyatTab")?.classList.add("active");
    q("csSahabaTab")?.classList.remove("active");
    setTimeout(()=>q("csAudioDrop")?.scrollIntoView?.({behavior:"smooth",block:"center"}),260);
  }
}

async function loadLiveForEdit(id){
  existingStoryTarget=null;
  const x=inventoryState.live.find(i=>i.id===id);
  if(!x){setStudioMessage("Live-Inhalt wurde nicht gefunden.","bad");return}
  studioKind=studioKindForItem(x);
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
  audioAssetText=String(x.text||"").trim();
  quizDraft=Array.isArray(x.quiz?.questions)?x.quiz.questions:[];
  gameDraft=x.game&&typeof x.game==="object"?x.game:{type:"choice",summary:"",instructions:"",voiceCues:[]};
  coverFile=null;
  coverRemoteUrl="";
  resetDirectAudioSelection();
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
  existingStoryTarget=null;
  try{
    const d=await adminApi("/api/admin/kids-content?staging=1",{method:"GET"});
    const x=(d.index?.items||[]).find(i=>i.id===id);if(!x)return;
    studioKind=studioKindForItem(x);contentId=x.id;savedRevision=x.revision||0;contentStatus=x.status||"draft";stagingPublished=x.status==="published";productionPhase=x.production?.phase||(stagingPublished?"test-published":"draft");productionError=x.production?.error||"";
    document.querySelectorAll("[data-cs-kind]").forEach(b=>b.classList.toggle("active",b.dataset.csKind===studioKind));
    q("csTitle").value=x.title||"";q("csCategory").value=x.category||"";q("csTopic").value=x.topic||"";q("csProphet").value=x.prophetId||"";
    q("csAgeMin").value=String(x.ageMin||4);q("csAgeMax").value=String(x.ageMax||10);q("csModeRead").checked=x.modes?.read!==false;q("csModeListen").checked=x.modes?.listen!==false;
    q("csSources").value=(x.sourceRefs||[]).join("\n");q("text").value=x.text||"";
    legacyQuestion=x.question&&typeof x.question==="object"?x.question:{};
    legacyClaimIds=Array.isArray(x.claimIds)?[...x.claimIds]:[];
    legacyTags=Array.isArray(x.tags)?[...x.tags]:[];
    coverAsset=x.cover?.url?x.cover:null;audioAsset=x.audio?.url?x.audio:null;audioAssetText=String(x.text||"").trim();
    quizDraft=Array.isArray(x.quiz?.questions)?x.quiz.questions:[];gameDraft=x.game&&typeof x.game==="object"?x.game:{type:"choice",summary:"",instructions:"",voiceCues:[]};
    coverFile=null;coverRemoteUrl="";resetDirectAudioSelection();if(coverAsset?.url)renderCover(coverAsset.url);q("csCoverTitle").textContent=x.title||"Inhalt";
    renderKindEditor();if(typeof renderAnalysis==="function")renderAnalysis();renderStatus();refreshQa();setStudioMessage("Staging-Paket geladen.","good");setTimeout(()=>goToWorkflowStep("text"),80);
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
}
function refreshQa(){
  if(!q("csQaText"))return;
  captureStructuredEditor();
  const text=String(q("text")?.value||"").trim(),script=voiceScript(),same=!!lastAudio&&lastGeneratedText===script,ownerAudio=directAudioReadyForCurrentText();
  const cover=!!(coverFile||coverRemoteUrl||coverAsset?.url);
  const boundAsset=!!audioAsset?.url&&(!audioAssetText||audioAssetText===script);
  const audio=!q("csModeListen")?.checked||ownerAudio||same||boundAsset;
  const pron=!q("csModeListen")?.checked||ownerAudio||Boolean(qaConfirmed&&same)||Boolean(boundAsset&&contentId);
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
  const direct=q("csDirectKids");if(direct)direct.disabled=busy||effectiveTarget()!=="kids"||!contentOk||!cover||!audio||!pron||!q("csTitle")?.value.trim();
  renderStatus();
}
function paintQa(id,ok,label){const el=q(id);if(!el)return;el.textContent=label;el.className=ok?"good":"warn"}

window.DarContentStudio={mount,fields,loadLibrary,publishTest,publishLive,publishDirectKids,handleDirectAudioFile,registerDirectAudioLearning,generateCover,produce,newCurrentItem,copyCurrentText,goToWorkflowStep,focusNextProductionAction,switchKind};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();