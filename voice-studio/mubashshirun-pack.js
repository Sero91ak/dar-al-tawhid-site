(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={items:[],selected:"",visible:false,uploading:false};
function storyTextStandard(value){
  const raw=String(value||"").trim();
  return typeof window.normalizeKidsStoryText==="function"?window.normalizeKidsStoryText(raw):raw;
}
function syncStoryTextStandard(){
  const ta=$("#text");if(!ta)return"";
  const next=storyTextStandard(ta.value);
  if(next&&next!==String(ta.value||"").trim()){ta.value=next;ta.dispatchEvent(new Event("input",{bubbles:true}))}
  return next;
}
const URLS=[
  "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/kids/data/mubashshirun-stories.json?cb="+Date.now(),
  "https://dar-al-tawhid.de/kids/data/mubashshirun-stories.json?cb="+Date.now(),
  "/mubashshirun/library?cb="+Date.now()
];
async function engineRequest(path,options={}){
  if(typeof window.localRequest==="function")return window.localRequest(path,options);
  return fetch(path,options);
}
function injectStyle(){
  if($("#mubVoicePackStyle"))return;
  const st=document.createElement("style");st.id="mubVoicePackStyle";
  st.textContent=`
  #mubVoicePack{display:none;margin:0 0 16px;border:1px solid rgba(217,182,111,.18);border-radius:16px;background:linear-gradient(145deg,rgba(217,182,111,.045),rgba(255,255,255,.016));padding:14px}
  body.studio-page-sahaba #mubVoicePack{display:block}
  body.studio-page-sahaba #prophetPick{display:none!important}
  #mubVoicePack .mvp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}
  #mubVoicePack .mvp-kicker{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#d9b66f;font-weight:900}
  #mubVoicePack h2{margin:4px 0 3px;font-size:21px}
  #mubVoicePack .mvp-sub{font-size:10px;color:var(--muted);line-height:1.45}

  #mubVoicePack .mvp-master{border:1px solid rgba(217,182,111,.30);background:rgba(217,182,111,.07);color:#efd69a;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900;white-space:nowrap}\n  #mubVoicePack .mvp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  #mubVoicePack .mvp-item{border:1px solid var(--line);background:rgba(255,255,255,.022);border-radius:12px;padding:10px;text-align:left;color:#e8eeee;cursor:pointer}
  #mubVoicePack .mvp-item.active{border-color:rgba(217,182,111,.42);background:rgba(217,182,111,.055)}
  #mubVoicePack .mvp-item small{display:block;font-size:8px;color:#86aba8;letter-spacing:.08em;font-weight:900;margin-bottom:3px}
  #mubVoicePack .mvp-item b{display:block;font-size:11px;line-height:1.25}
  #mubVoicePack .mvp-item span{display:block;font-size:9px;color:#83979b;margin-top:4px;line-height:1.35}
  #mubVoicePack .mvp-selected{margin-top:10px;padding:11px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(0,0,0,.11);display:grid;gap:7px}
  #mubVoicePack .mvp-selected strong{font-size:12px}.mvp-source{font-size:9px;color:#819498;line-height:1.45}
  #mubVoicePack .mvp-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  #mubVoicePack .mvp-actions button{min-height:40px}
  #mubVoicePack .mvp-ready{font-size:9px;line-height:1.45;color:#9bd8ba}
  body.studio-page-sahaba .heading-row h1:after{content:" · Ṣaḥābah";color:#d9b66f}
  @media(max-width:720px){#mubVoicePack .mvp-grid{grid-template-columns:1fr}#mubVoicePack .mvp-head{display:grid}.mvp-actions{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(st);
}
function ensureTab(){
  const tabs=$(".cs-nav-tabs");if(!tabs)return null;
  let btn=$("#csSahabaTab");
  if(!btn){
    btn=document.createElement("button");btn.id="csSahabaTab";btn.className="cs-tab";btn.type="button";btn.textContent="Ṣaḥābah · 10";
    $("#csProphetTab")?.insertAdjacentElement("afterend",btn);
  }
  return btn;
}
function ensurePanel(){
  const host=$(".editor-panel");if(!host||$("#mubVoicePack"))return;
  const p=document.createElement("section");p.id="mubVoicePack";
  p.innerHTML=
    '<div class="mvp-head"><div><div class="mvp-kicker">Kids · al-ʿAšarah al-Mubaššarūn</div><h2>Die zehn Mubaschschirūn</h2><div class="mvp-sub">Pro Ṣaḥābī gibt es genau einen vollständigen Mastertext und genau ein Masteraudio. Die Kids-App verwendet diesen Inhalt für 4–10 Jahre; nur die Darstellung bleibt altersabhängig.</div></div>'+
    '<div class="mvp-master">MASTER · 4–10 JAHRE</div></div>'+
    '<div id="mvpGrid" class="mvp-grid"><div class="notice">Lade 10 Ṣaḥābah …</div></div>'+
    '<div id="mvpSelected" class="mvp-selected" hidden></div>'+
    '<input id="mvpAudioUploadInput" type="file" accept=".wav,.mp3,.m4a,.aac,audio/wav,audio/mpeg,audio/mp4,audio/aac" hidden>';
  const anchor=$("#prophetPick")||$(".heading-row");
  if(anchor)anchor.insertAdjacentElement("beforebegin",p);else host.prepend(p);

}
function setVisible(on){
  state.visible=!!on;
  document.body.classList.toggle("studio-page-sahaba",state.visible);
  const panel=$("#mubVoicePack");if(panel)panel.style.display=state.visible?"block":"none";
  const p=$("#prophetPick");if(p)p.hidden=state.visible;
  $("#csSahabaTab")?.classList.toggle("active",state.visible);
  if(state.visible)$("#csProphetTab")?.classList.remove("active");
}
function openPack(){
  window.setStudioPage?.("prophets");
  setVisible(true);
  if(!state.items.length)load();
  setTimeout(()=>$("#mubVoicePack")?.scrollIntoView({block:"start",behavior:"smooth"}),20);
}
function closePack(){setVisible(false)}
function scriptFor(item){return String(item?.scripts?.["9-10"]||item?.scripts?.["6-8"]||item?.scripts?.["4-5"]||"").trim()}
function current(){return state.items.find(x=>x.id===state.selected)||null}
function render(){
  ensurePanel();

  const g=$("#mvpGrid");if(!g)return;
  g.innerHTML=state.items.map((x,i)=>
    '<button class="mvp-item '+(x.id===state.selected?"active":"")+'" type="button" data-mvp-id="'+esc(x.id)+'">'+
      '<small>'+(i+1)+'/10 · ṢAḤĀBĪ</small><b>'+esc(x.name)+'</b><span>'+esc(x.summary||"")+'</span></button>'
  ).join("");
  g.querySelectorAll("[data-mvp-id]").forEach(b=>b.addEventListener("click",()=>{state.selected=b.dataset.mvpId;render();loadSelected(false)}));
  const it=current(),box=$("#mvpSelected");
  if(!it){box.hidden=true;return}
  box.hidden=false;
  box.innerHTML=
    '<strong>'+esc(it.name)+' · Master 4–10 Jahre</strong>'+
    '<div class="mvp-source">'+esc((it.sourceRefs||[]).join(" · "))+'</div>'+
    '<div class="mvp-actions"><button id="mvpLoad" class="btn secondary" type="button">Text in Voice laden</button><button id="mvpUpload" class="btn secondary" type="button">'+(state.uploading?'Datei wird geladen …':'Audio-Datei hochladen')+'</button><button id="mvpGenerate" class="btn primary" type="button">Laden &amp; Audio erzeugen</button><button id="mvpPublish" class="btn secondary" type="button">Geprüft in Kids übernehmen</button></div>'+
    '<div id="mvpReady" class="mvp-ready">Der vollständige Master-Storytext ist im großen Textfeld direkt bearbeitbar. „Audio-Datei hochladen“ verbindet genau ein Masteraudio mit '+esc(it.name)+' und übernimmt es automatisch für 4–10 Jahre.</div>';
  $("#mvpLoad")?.addEventListener("click",()=>loadSelected(true));
  $("#mvpUpload")?.addEventListener("click",()=>{
    const input=$("#mvpAudioUploadInput");
    if(input){input.value="";input.click()}
  });
  $("#mvpGenerate")?.addEventListener("click",async()=>{loadSelected(true);await new Promise(r=>setTimeout(r,80));$("#generateBtn")?.click()});
  $("#mvpPublish")?.addEventListener("click",publishCurrent);
}
function fileAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||""));
    reader.onerror=()=>reject(new Error("Audiodatei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}
async function uploadCurrent(file){
  const it=current();if(!it||!file)return false;
  const text=syncStoryTextStandard();
  const status=$("#mvpReady");
  if(text.length<80){if(status)status.textContent="Der Story-Text ist zu kurz. Text zuerst bearbeiten oder laden.";return false}
  if(Number(file.size||0)>64*1024*1024){if(status)status.textContent="Die Audiodatei ist größer als 64 MB.";return false}
  state.uploading=true;render();
  if($("#mvpReady"))$("#mvpReady").textContent=it.name+" · Masteraudio und aktueller Text werden für 4–10 Jahre fest zugeordnet …";
  try{
    if(typeof window.darVoiceAlignStoryFile!=="function")throw Error("Die exakte Mitlese-Synchronisierung ist noch nicht geladen.");
    if($("#mvpReady"))$("#mvpReady").textContent=it.name+" · Audio wird wortgenau mit dem Mastertext synchronisiert …";
    const alignment=await window.darVoiceAlignStoryFile(file,text);
    if(!Array.isArray(alignment?.timings)||!alignment.timings.length)throw Error("Keine Mitlese-Zeitstempel erhalten.");
    const dataUrl=await fileAsDataUrl(file);
    const ages=["4-5","6-8","9-10"],results=[];
    for(const age of ages){
      const r=await engineRequest("/story-media/upload",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          kind:"sahabi",id:it.id,age,text,
          filename:file.name||"story-audio",dataUrl,
          timings:alignment.timings,
          syncMode:alignment.syncMode||"elevenlabs-forced-alignment-v1",
          alignmentLoss:alignment.alignmentLoss
        })
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d.ok===false)throw Error(d.error||("Audio-Upload für "+age+" fehlgeschlagen."));
      results.push([age,d]);
    }
    if(!it.scripts||typeof it.scripts!=="object")it.scripts={};
    if(!it.audio||typeof it.audio!=="object")it.audio={};
    for(const [age,d] of results){
      it.scripts[age]=text;
      it.audio[age]={...(it.audio[age]||{}),url:d.url||"",durationSec:d.durationSec||0,status:"ready",manualUpload:true,masterAudio:true};
    }
    state.uploading=false;render();
    if($("#mvpReady"))$("#mvpReady").textContent=it.name+" · ein Masteraudio ist mit dem vollständigen Text für 4–10 Jahre in Kids übernommen.";
    return true;
  }catch(e){
    state.uploading=false;render();
    if($("#mvpReady"))$("#mvpReady").textContent=e.message||String(e);
    return false;
  }
}
async function publishCurrent(){
  const it=current();if(!it)return false;
  const btn=$("#mvpPublish"),status=$("#mvpReady"),text=syncStoryTextStandard();
  if(!text){if(status)status.textContent="Zuerst den Text laden und Audio erzeugen.";return false}
  if(typeof window.darVoiceQaIsConfirmed==="function"&&!window.darVoiceQaIsConfirmed()){
    if(status)status.textContent="Audio zuerst vollständig anhören und über „Aussprache bestätigen & übernehmen“ freigeben. Erst danach wird dieses Masteraudio für 4–10 Jahre in Kids veröffentlicht.";
    return false;
  }
  const old=btn?.textContent||"";
  if(btn){btn.disabled=true;btn.textContent="Übernehme …"}
  if(status)status.textContent="Geprüftes Serhat-Masteraudio wird automatisch allen Kids-Altersstufen 4–10 zugeordnet …";
  try{
    if(typeof window.darVoiceAlignCurrentStory!=="function")throw Error("Die exakte Mitlese-Synchronisierung ist noch nicht geladen.");
    if(status)status.textContent="Audio und Mastertext werden jetzt wortgenau für das automatische Mitlesen ausgerichtet …";
    const alignment=await window.darVoiceAlignCurrentStory(text);
    if(!Array.isArray(alignment?.timings)||!alignment.timings.length)throw Error("Keine Mitlese-Zeitstempel erhalten.");
    const ages=["4-5","6-8","9-10"],results=[];
    for(const age of ages){
      const r=await engineRequest("/mubashshirun/publish",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          id:it.id,age,text,
          timings:alignment.timings,
          syncMode:alignment.syncMode||"elevenlabs-forced-alignment-v1",
          alignmentLoss:alignment.alignmentLoss
        })
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d.ok===false)throw Error(d.error||("Übernahme für "+age+" fehlgeschlagen."));
      results.push([age,d]);
    }
    if(!it.audio||typeof it.audio!=="object")it.audio={};
    if(!it.scripts||typeof it.scripts!=="object")it.scripts={};
    for(const [age,d] of results){
      it.scripts[age]=text;
      it.audio[age]={...(it.audio[age]||{}),url:d.url||"",durationSec:d.durationSec||0,status:"ready",masterAudio:true};
    }
    const duration=Number(results[0]?.[1]?.durationSec||0);
    if(status)status.textContent=it.name+" · ein geprüftes Serhat-Masteraudio ist für 4–10 Jahre in Kids übernommen. "+(duration?("Dauer: "+Math.round(duration/60)+" Min."):"");
    render();
    return true;
  }catch(e){
    if(status)status.textContent=e.message||String(e);
    return false;
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old}
  }
}
function loadSelected(focus=true){
  const it=current();if(!it)return;
  const ta=$("#text"),style=$("#styleMode");
  if(ta){ta.value=scriptFor(it);ta.dispatchEvent(new Event("input",{bubbles:true}));if(focus)ta.focus()}
  if(style)style.value="kids_story";
  const title=$("#csTitle");if(title){title.value=it.name+" – Geschichte";title.dispatchEvent(new Event("input",{bubbles:true}))}
  const cat=$("#csCategory");if(cat)cat.value="Ṣaḥābah · al-ʿAšarah al-Mubaššarūn";
  const topic=$("#csTopic");if(topic)topic.value="Ṣaḥābah · authentische Sunnah";
  const person=$("#csProphet");if(person)person.value=it.id;
  const src=$("#csSources");if(src)src.value=(it.sourceRefs||[]).join("\\n");
  $("#analyzeBtn")?.click();
}
async function load(){
  let last=null;
  for(const url of URLS){
    try{
      const r=await fetch(url,{cache:"no-store"});
      if(!r.ok)throw Error("HTTP "+r.status);
      const d=await r.json();
      const arr=Array.isArray(d.items)?d.items:[];
      if(arr.length!==10)throw Error("Erwartet 10 Ṣaḥābah, erhalten "+arr.length);
      state.items=arr.slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99));
      if(!state.selected)state.selected=state.items[0]?.id||"";
      render();return;
    }catch(e){last=e}
  }
  const g=$("#mvpGrid");if(g)g.innerHTML='<div class="notice bad">Ṣaḥābah-Paket konnte nicht geladen werden: '+esc(last?.message||"unbekannt")+'</div>';
}
function bind(){
  injectStyle();ensurePanel();
  $("#mvpAudioUploadInput")?.addEventListener("change",e=>{
    const file=e.target.files&&e.target.files[0];
    if(file)uploadCurrent(file);
  });
  const btn=ensureTab();
  btn?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openPack()});
  $("#csProphetTab")?.addEventListener("click",()=>closePack());
  document.querySelectorAll("[data-cs-kind],#csPronunciationTab,#csAlphabetTab,#csFreeVoiceTab,#csSystemTab").forEach(x=>x.addEventListener("click",()=>closePack()));
}
function boot(){bind();load()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
window.mubVoicePack={open:openPack,close:closePack,load,loadSelected,publishCurrent,uploadCurrent,state};
})();