(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let pack=[];
const selectedAge=new Map();
function ageLabel(k){return k==="4-5"?"4–5":k==="9-10"?"9–10":"6–8"}
function minutes(item,age){
  const p=item?.voiceProduction?.ageProfiles?.[age];
  if(p?.estimatedMinutes)return p.estimatedMinutes+" Min.";
  const t=String(item?.scripts?.[age]||"");
  return Math.max(4,Math.round((t.match(/\S+/g)||[]).length/85))+" Min.";
}
function setText(item,age,autoGenerate){
  const ta=$("#text"); if(!ta||!item)return;
  const text=String(item?.scripts?.[age]||"").trim(); if(!text)return;
  selectedAge.set(item.id,age);
  const row=document.querySelector('.mub-voice-row[data-id="'+CSS.escape(item.id)+'"]');
  row?.querySelectorAll("[data-age]").forEach(b=>b.classList.toggle("active",b.dataset.age===age));
  ta.value=text;
  ta.dispatchEvent(new Event("input",{bubbles:true}));
  const style=$("#styleMode"); if(style){style.value="kids_story";style.dispatchEvent(new Event("change",{bubbles:true}))}
  try{localStorage.setItem("dar.voice.mubashshirun.selection.v2",JSON.stringify({id:item.id,age}))}catch(_){}
  const msg=$("#mubVoiceState");
  const words=(text.match(/\S+/g)||[]).length;
  if(msg)msg.textContent=item.name+" · Alter "+ageLabel(age)+" · "+words+" Wörter · ca. "+minutes(item,age)+" geladen. Fuṣḥā-Strengprüfung läuft über die bestehende Voice-Engine.";
  $("#analyzeBtn")?.click();
  ta.focus();
  if(autoGenerate)setTimeout(()=>$("#generateBtn")?.click(),220);
}
function render(host){
  host.innerHTML=
    '<div class="mub-voice-head"><div><small>KIDS · ṢAḤĀBAH · EIGENER BEREICH</small><h3>Die zehn al-Mubaššarūn</h3><p>10 quellengeprüfte Geschichten · 4–5 / 6–8 / 9–10 · Fuṣḥā-Strengprüfung · Serhat Voice.</p></div><span class="mub-voice-count">10</span></div>'+
    '<div id="mubVoiceState" class="notice">Ṣaḥābī und Altersfassung wählen. Der fertige Text wird direkt in den Erzählungs-Editor geladen.</div>'+
    '<div class="mub-voice-list">'+pack.map((it,i)=>{
      const defaultAge=selectedAge.get(it.id)||"6-8";
      return '<div class="mub-voice-row" data-id="'+esc(it.id)+'">'+
        '<div class="mub-voice-copy"><b>'+(i+1)+'. '+esc(it.name)+'</b><span dir="rtl">'+esc(it.nameAr||"")+' رضي الله عنه</span><small>'+esc(it.summary||"")+'</small><em>4–5: '+esc(minutes(it,"4-5"))+' · 6–8: '+esc(minutes(it,"6-8"))+' · 9–10: '+esc(minutes(it,"9-10"))+'</em></div>'+
        '<div class="mub-voice-actions">'+
          '<div class="mub-age-set"><button type="button" data-age="4-5" class="'+(defaultAge==="4-5"?"active":"")+'">4–5</button><button type="button" data-age="6-8" class="'+(defaultAge==="6-8"?"active":"")+'">6–8</button><button type="button" data-age="9-10" class="'+(defaultAge==="9-10"?"active":"")+'">9–10</button></div>'+
          '<button type="button" class="produce" data-produce>Gewählte Fassung als Audio erzeugen</button>'+
        '</div>'+
      '</div>';
    }).join("")+'</div>';
  host.querySelectorAll(".mub-voice-row").forEach(row=>{
    const item=pack.find(x=>x.id===row.dataset.id);
    row.querySelectorAll("[data-age]").forEach(b=>b.addEventListener("click",()=>setText(item,b.dataset.age,false)));
    row.querySelector("[data-produce]")?.addEventListener("click",()=>setText(item,selectedAge.get(item.id)||"6-8",true));
  });
}
function injectStyle(){
  if($("#mubVoiceStyle"))return;
  const style=document.createElement("style");style.id="mubVoiceStyle";
  style.textContent=`
#mubVoicePack{padding:17px;border:1px solid rgba(217,182,111,.20);border-radius:16px;background:rgba(217,182,111,.035)}
#mubVoicePack[hidden]{display:none!important}
.mub-voice-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:10px}.mub-voice-head small{display:block;color:#d9b66f;font-size:9px;letter-spacing:.12em;font-weight:900}.mub-voice-head h3{margin:3px 0 5px;font-size:22px}.mub-voice-head p{margin:0;color:var(--muted);font-size:10px;line-height:1.45}.mub-voice-count{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(217,182,111,.24);color:#e3c27d;font-weight:900;background:rgba(217,182,111,.06)}
.mub-voice-list{display:grid;gap:8px;margin-top:11px}.mub-voice-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,auto);gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.018)}
.mub-voice-copy b{display:block;font-size:12px}.mub-voice-copy span{display:block;font-family:"Geeza Pro","Noto Naskh Arabic",serif;font-size:16px;margin-top:2px;color:#eef2f4}.mub-voice-copy small{display:block;color:var(--muted);font-size:9px;line-height:1.4;margin-top:3px}.mub-voice-copy em{display:block;color:#d8bd79;font-style:normal;font-size:8px;margin-top:5px}
.mub-voice-actions{display:grid;gap:6px}.mub-age-set{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.mub-voice-actions button{border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.035);color:#d6e0e6;padding:8px 9px;font-size:9px;font-weight:800;cursor:pointer}.mub-voice-actions [data-age].active{border-color:rgba(217,182,111,.42);background:rgba(217,182,111,.10);color:#f2d796}.mub-voice-actions button.produce{border-color:rgba(217,182,111,.28);background:rgba(217,182,111,.09);color:#efd296;min-height:36px}
body.studio-page-mubashshirun #prophetPick{display:none!important}
body.studio-page-mubashshirun #mubVoicePack{display:block!important}
@media(max-width:760px){.mub-voice-row{grid-template-columns:1fr}.mub-voice-head p{max-width:260px}}
`;
  document.head.appendChild(style);
}
function deactivate(){
  document.body.classList.remove("studio-page-mubashshirun");
  const host=$("#mubVoicePack");if(host)host.hidden=true;
}
function activate(){
  window.setStudioPage?.("prophets");
  setTimeout(()=>{
    document.body.classList.add("studio-page-mubashshirun");
    $("#csProphetTab")?.classList.remove("active");
    $("#csMubashshirunTab")?.classList.add("active");
    const host=$("#mubVoicePack");if(host)host.hidden=false;
    $("#prophetPick")?.setAttribute("aria-hidden","true");
  },0);
}
function ensureTab(){
  if($("#csMubashshirunTab"))return;
  const p=$("#csProphetTab");if(!p)return;
  const b=document.createElement("button");
  b.id="csMubashshirunTab";b.className="cs-tab";b.type="button";b.textContent="10 Ṣaḥābah";
  p.insertAdjacentElement("afterend",b);
  b.addEventListener("click",activate);
  p.addEventListener("click",()=>{deactivate();$("#prophetPick")?.removeAttribute("aria-hidden")});
  document.querySelectorAll("[data-cs-kind],#csPronunciationTab,#csAlphabetTab,#csFreeVoiceTab,#csSystemTab").forEach(x=>x.addEventListener("click",()=>{deactivate();$("#prophetPick")?.removeAttribute("aria-hidden")}));
}
async function load(){
  const prophet=$("#prophetPick");if(!prophet)return;
  injectStyle();ensureTab();
  let host=$("#mubVoicePack");
  if(!host){
    host=document.createElement("section");host.id="mubVoicePack";host.hidden=true;
    prophet.insertAdjacentElement("afterend",host);
  }
  host.innerHTML='<div class="notice">Mubaschschirūn-Texte werden geladen …</div>';
  const urls=[
    "https://dar-al-tawhid.de/kids/data/mubashshirun-stories.json?cb="+Date.now(),
    "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/kids/data/mubashshirun-stories.json?cb="+Date.now()
  ];
  for(const url of urls){
    try{
      const r=await fetch(url,{cache:"no-store"});if(!r.ok)continue;
      const d=await r.json();
      if(Array.isArray(d.items)&&d.items.length===10){
        pack=d.items.slice().sort((a,b)=>Number(a.displayOrder||99)-Number(b.displayOrder||99));
        try{
          const saved=JSON.parse(localStorage.getItem("dar.voice.mubashshirun.selection.v2")||"null");
          if(saved?.id&&saved?.age)selectedAge.set(saved.id,saved.age);
        }catch(_){}
        render(host);return;
      }
    }catch(_){}
  }
  host.innerHTML='<div class="notice warn">Mubaschschirūn-Bibliothek konnte nicht geladen werden.</div>';
}
function boot(){
  let n=0;const t=setInterval(()=>{
    n++;
    if($("#prophetPick")&&$("#csProphetTab")){clearInterval(t);load()}
    else if(n>160)clearInterval(t);
  },100);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();