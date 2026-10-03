(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let pack=[];
function ageLabel(k){return k==="4-5"?"4–5":k==="9-10"?"9–10":"6–8"}
function setText(item,age,autoGenerate){
  const ta=$("#text"); if(!ta)return;
  const text=String(item?.scripts?.[age]||"").trim(); if(!text)return;
  ta.value=text;
  ta.dispatchEvent(new Event("input",{bubbles:true}));
  const style=$("#styleMode"); if(style){style.value="kids_story";style.dispatchEvent(new Event("change",{bubbles:true}))}
  try{
    localStorage.setItem("dar.voice.mubashshirun.selection.v1",JSON.stringify({id:item.id,age}));
  }catch(_){}
  const msg=$("#mubVoiceState");
  if(msg)msg.textContent=item.name+" · Alter "+ageLabel(age)+" · "+(text.match(/\S+/g)||[]).length+" Wörter geladen. Fuṣḥā-Begriffe jetzt prüfen.";
  $("#analyzeBtn")?.click();
  ta.focus();
  if(autoGenerate){
    setTimeout(()=>$("#generateBtn")?.click(),180);
  }
}
function render(host){
  host.innerHTML=
    '<div class="mub-voice-head"><div><small>KIDS · ṢAḤĀBAH</small><h3>Die zehn Mubaschschirūn</h3><p>10 quellengeprüfte Geschichten · drei Altersfassungen · Fuṣḥā-Prüfung über die bestehende Voice-Engine.</p></div><span class="mub-voice-count">10</span></div>'+
    '<div id="mubVoiceState" class="notice">Geschichte wählen. Text wird direkt in den Erzählungs-Editor geladen.</div>'+
    '<div class="mub-voice-list">'+pack.map((it,i)=>
      '<div class="mub-voice-row" data-id="'+esc(it.id)+'">'+
        '<div class="mub-voice-copy"><b>'+(i+1)+'. '+esc(it.name)+'</b><span dir="rtl">'+esc(it.nameAr||"")+' رضي الله عنه</span><small>'+esc(it.summary||"")+'</small></div>'+
        '<div class="mub-voice-actions">'+
          '<button type="button" data-age="4-5">4–5</button><button type="button" data-age="6-8">6–8</button><button type="button" data-age="9-10">9–10</button>'+
          '<button type="button" class="produce" data-produce="6-8">Audio 6–8 erzeugen</button>'+
        '</div>'+
      '</div>'
    ).join("")+'</div>';
  host.querySelectorAll(".mub-voice-row").forEach(row=>{
    const item=pack.find(x=>x.id===row.dataset.id);
    row.querySelectorAll("[data-age]").forEach(b=>b.addEventListener("click",()=>setText(item,b.dataset.age,false)));
    row.querySelectorAll("[data-produce]").forEach(b=>b.addEventListener("click",()=>setText(item,b.dataset.produce,true)));
  });
}
function injectStyle(){
  if($("#mubVoiceStyle"))return;
  const style=document.createElement("style");style.id="mubVoiceStyle";
  style.textContent=`
#mubVoicePack{margin-top:16px;padding:15px;border:1px solid rgba(217,182,111,.20);border-radius:16px;background:rgba(217,182,111,.035)}
.mub-voice-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:10px}.mub-voice-head small{display:block;color:#d9b66f;font-size:9px;letter-spacing:.12em;font-weight:900}.mub-voice-head h3{margin:3px 0 5px;font-size:20px}.mub-voice-head p{margin:0;color:var(--muted);font-size:10px;line-height:1.45}.mub-voice-count{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(217,182,111,.24);color:#e3c27d;font-weight:900;background:rgba(217,182,111,.06)}
.mub-voice-list{display:grid;gap:7px;margin-top:10px}.mub-voice-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.018)}
.mub-voice-copy b{display:block;font-size:12px}.mub-voice-copy span{display:block;font-family:"Geeza Pro","Noto Naskh Arabic",serif;font-size:15px;margin-top:2px;color:#eef2f4}.mub-voice-copy small{display:block;color:var(--muted);font-size:9px;line-height:1.4;margin-top:3px}
.mub-voice-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.mub-voice-actions button{border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.035);color:#d6e0e6;padding:7px 8px;font-size:9px;font-weight:800;cursor:pointer}.mub-voice-actions button.produce{border-color:rgba(217,182,111,.26);background:rgba(217,182,111,.08);color:#efd296}
@media(max-width:760px){.mub-voice-row{grid-template-columns:1fr}.mub-voice-actions{justify-content:flex-start}.mub-voice-head p{max-width:250px}}
`;
  document.head.appendChild(style);
}
async function load(){
  const prophet=$("#prophetPick");if(!prophet||$("#mubVoicePack"))return;
  injectStyle();
  const host=document.createElement("section");host.id="mubVoicePack";
  prophet.appendChild(host);
  host.innerHTML='<div class="notice">Mubaschschirūn-Texte werden geladen …</div>';
  const urls=[
    "https://dar-al-tawhid.de/kids/data/mubashshirun-stories.json?cb="+Date.now(),
    "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/kids/data/mubashshirun-stories.json?cb="+Date.now()
  ];
  for(const url of urls){
    try{
      const r=await fetch(url,{cache:"no-store"});
      if(!r.ok)continue;
      const d=await r.json();
      if(Array.isArray(d.items)&&d.items.length===10){pack=d.items;render(host);return}
    }catch(_){}
  }
  host.innerHTML='<div class="notice warn">Mubaschschirūn-Bibliothek konnte nicht geladen werden.</div>';
}
function boot(){
  let n=0;const t=setInterval(()=>{
    n++; if($("#prophetPick")){clearInterval(t);load()}
    else if(n>120)clearInterval(t);
  },100);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();