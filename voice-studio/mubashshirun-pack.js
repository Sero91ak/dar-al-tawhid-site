(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={items:[],selected:"",age:"6-8",visible:false};
const URLS=[
  "/mubashshirun/library?cb="+Date.now(),
  "https://dar-al-tawhid.de/kids/data/mubashshirun-stories.json?cb="+Date.now(),
  "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/kids/data/mubashshirun-stories.json?cb="+Date.now()
];
function injectStyle(){
  if($("#mubVoicePackStyle"))return;
  const st=document.createElement("style");st.id="mubVoicePackStyle";
  st.textContent=\`
  #mubVoicePack{display:none;margin:0 0 16px;border:1px solid rgba(217,182,111,.18);border-radius:16px;background:linear-gradient(145deg,rgba(217,182,111,.045),rgba(255,255,255,.016));padding:14px}
  body.studio-page-sahaba #mubVoicePack{display:block}
  body.studio-page-sahaba #prophetPick{display:none!important}
  #mubVoicePack .mvp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}
  #mubVoicePack .mvp-kicker{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#d9b66f;font-weight:900}
  #mubVoicePack h2{margin:4px 0 3px;font-size:21px}
  #mubVoicePack .mvp-sub{font-size:10px;color:var(--muted);line-height:1.45}
  #mubVoicePack .mvp-age{display:flex;gap:5px;flex-wrap:wrap}
  #mubVoicePack .mvp-age button{border:1px solid var(--line);background:rgba(255,255,255,.025);color:#b8c7ca;border-radius:999px;padding:7px 9px;font-size:9px;font-weight:900}
  #mubVoicePack .mvp-age button.active{border-color:rgba(217,182,111,.36);background:rgba(217,182,111,.08);color:#efd69a}
  #mubVoicePack .mvp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  #mubVoicePack .mvp-item{border:1px solid var(--line);background:rgba(255,255,255,.022);border-radius:12px;padding:10px;text-align:left;color:#e8eeee;cursor:pointer}
  #mubVoicePack .mvp-item.active{border-color:rgba(217,182,111,.42);background:rgba(217,182,111,.055)}
  #mubVoicePack .mvp-item small{display:block;font-size:8px;color:#86aba8;letter-spacing:.08em;font-weight:900;margin-bottom:3px}
  #mubVoicePack .mvp-item b{display:block;font-size:11px;line-height:1.25}
  #mubVoicePack .mvp-item span{display:block;font-size:9px;color:#83979b;margin-top:4px;line-height:1.35}
  #mubVoicePack .mvp-selected{margin-top:10px;padding:11px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(0,0,0,.11);display:grid;gap:7px}
  #mubVoicePack .mvp-selected strong{font-size:12px}.mvp-source{font-size:9px;color:#819498;line-height:1.45}
  #mubVoicePack .mvp-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  #mubVoicePack .mvp-actions button{min-height:40px}
  #mubVoicePack .mvp-ready{font-size:9px;line-height:1.45;color:#9bd8ba}
  body.studio-page-sahaba .heading-row h1:after{content:" · Ṣaḥābah";color:#d9b66f}
  @media(max-width:720px){#mubVoicePack .mvp-grid{grid-template-columns:1fr}#mubVoicePack .mvp-head{display:grid}.mvp-actions{grid-template-columns:1fr!important}}
  \`;
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
    '<div class="mvp-head"><div><div class="mvp-kicker">Kids · al-ʿAšarah al-Mubaššarūn</div><h2>Die zehn Mubaschschirūn</h2><div class="mvp-sub">Quellengeprüfte Texte sind fertig vorbereitet. Ṣaḥābī wählen · Altersfassung laden · Fuṣḥā prüfen · Serhat-Audio erzeugen.</div></div>'+
    '<div class="mvp-age"><button type="button" data-mvp-age="4-5">4–5</button><button type="button" data-mvp-age="6-8" class="active">6–8</button><button type="button" data-mvp-age="9-10">9–10</button></div></div>'+
    '<div id="mvpGrid" class="mvp-grid"><div class="notice">Lade 10 Ṣaḥābah …</div></div>'+
    '<div id="mvpSelected" class="mvp-selected" hidden></div>';
  const anchor=$("#prophetPick")||$(".heading-row");
  if(anchor)anchor.insertAdjacentElement("beforebegin",p);else host.prepend(p);
  p.querySelectorAll("[data-mvp-age]").forEach(b=>b.addEventListener("click",()=>{state.age=b.dataset.mvpAge;render();loadSelected(false)}));
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
function scriptFor(item){return String(item?.scripts?.[state.age]||item?.scripts?.["6-8"]||"").trim()}
function current(){return state.items.find(x=>x.id===state.selected)||null}
function render(){
  ensurePanel();
  document.querySelectorAll("[data-mvp-age]").forEach(b=>b.classList.toggle("active",b.dataset.mvpAge===state.age));
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
    '<strong>'+esc(it.name)+' · '+(state.age==="4-5"?"4–5 Jahre":state.age==="9-10"?"9–10 Jahre":"6–8 Jahre")+'</strong>'+
    '<div class="mvp-source">'+esc((it.sourceRefs||[]).join(" · "))+'</div>'+
    '<div class="mvp-actions"><button id="mvpLoad" class="btn secondary" type="button">Text in Voice laden</button><button id="mvpGenerate" class="btn primary" type="button">Laden &amp; Audio erzeugen</button></div>'+
    '<div class="mvp-ready">Fuṣḥā-Begriffe und رضي الله عنه laufen anschließend durch dieselbe strenge Ausspracheprüfung wie die Prophetengeschichten.</div>';
  $("#mvpLoad")?.addEventListener("click",()=>loadSelected(true));
  $("#mvpGenerate")?.addEventListener("click",async()=>{loadSelected(true);await new Promise(r=>setTimeout(r,80));$("#generateBtn")?.click()});
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
  const btn=ensureTab();
  btn?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openPack()});
  $("#csProphetTab")?.addEventListener("click",()=>closePack());
  document.querySelectorAll("[data-cs-kind],#csPronunciationTab,#csAlphabetTab,#csFreeVoiceTab,#csSystemTab").forEach(x=>x.addEventListener("click",()=>closePack()));
}
function boot(){bind();load()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
window.mubVoicePack={open:openPack,close:closePack,load,loadSelected,state};
})();