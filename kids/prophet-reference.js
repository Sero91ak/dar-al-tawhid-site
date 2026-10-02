(() => {
"use strict";

const ORDER=["adam","idris","nuh","hud","salih"];
const ART={
  adam:{card:"/kids/assets/prophets-v100/adam-card.jpg?v=8"},
  idris:{card:"/kids/assets/prophets-v100/idris-card.jpg?v=8"},
  nuh:{card:"/kids/assets/prophets-v100/nuh-card.jpg?v=8",hero:"/kids/assets/prophets-v100/nuh-hero.jpg?v=8"},
  hud:{card:"/kids/assets/prophets-v100/hud-card.jpg?v=8"},
  salih:{card:"/kids/assets/prophets-v100/salih-card.jpg?v=8"}
};

let items=[],mode="read";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function minutes(item){
  const m=Number(item?.voiceProduction?.estimatedMinutes||0);
  if(m>0)return Math.max(2,Math.min(9,Math.round(m)));
  const text=String(item?.scripts?.["6-8"]||item?.voiceScript||"");
  return Math.max(2,Math.min(9,Math.ceil((text.match(/\S+/g)||[]).length/105)));
}
function ar(item){
  return [item.nameAr||"","عليه السلام"].filter(Boolean).join(" ");
}
function sorted(list){
  const map=new Map((Array.isArray(list)?list:[]).map(x=>[x.id,x]));
  return ORDER.map(id=>map.get(id)).filter(Boolean);
}
function render(){
  $("#storyList").innerHTML=items.map((item,index)=>{
    const src=ART[item.id]?.card||"";
    const eager=index<2?' loading="eager" fetchpriority="high"':' loading="lazy"';
    return '<button class="story" type="button" data-id="'+esc(item.id)+'">'+
      '<img class="story-art" src="'+esc(src)+'" alt="" decoding="async"'+eager+'>'+
      '<span class="story-copy">'+
        '<span class="eyebrow">'+(item.id==="adam"?"UNSER ERSTER PROPHET":"UNSER PROPHET")+'</span>'+
        '<h2>'+esc(item.name)+'</h2>'+
        '<span class="arabic" dir="rtl">'+esc(ar(item))+'</span>'+
        '<span class="story-time">◷ &nbsp;ca. '+minutes(item)+' Min.</span>'+
      '</span>'+
      '<span class="story-go" aria-hidden="true">›</span>'+
    '</button>';
  }).join("");
  document.querySelectorAll(".story").forEach(b=>b.addEventListener("click",()=>openDetail(b.dataset.id)));
}
function storyText(item){
  const s=String(item?.scripts?.["6-8"]||item?.voiceScript||"").trim();
  return s||(item?.chapters||[]).join("\n\n");
}
function openDetail(id){
  const item=items.find(x=>x.id===id);
  if(!item)return;
  const art=ART[id]||{};
  $("#detailHero").dataset.id=id;
  $("#detailArt").src=art.hero||art.card||"";
  $("#detailArt").alt="";
  $("#detailEyebrow").textContent=id==="adam"?"UNSER ERSTER PROPHET":"UNSER PROPHET";
  $("#detailTitle").textContent=item.name;
  $("#detailArabic").textContent=ar(item);
  $("#detailSummary").textContent=item.summary||"";
  $("#detailMinutes").textContent="ca. "+minutes(item)+" Min.";
  const raw=storyText(item);
  $("#readingCard").innerHTML="<h2>Die Geschichte von "+esc(item.name)+"</h2>"+
    raw.split(/\n{2,}/).filter(Boolean).map(p=>"<p>"+esc(p)+"</p>").join("");
  $("#listView").hidden=true;
  $("#detailView").hidden=false;
  setMode(mode);
  window.scrollTo({top:0,behavior:"instant"});
}
function closeDetail(){
  $("#detailView").hidden=true;
  $("#listView").hidden=false;
  window.scrollTo({top:0,behavior:"instant"});
}
function setMode(next){
  mode=next;
  document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $("#readingCard").style.display=mode==="listen"?"none":"block";
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-mode]");
  if(b)setMode(b.dataset.mode);
});
$("#backBtn").addEventListener("click",closeDetail);

fetch("/kids/data/prophet-stories.json?v=8",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw new Error("data "+r.status);return r.json()})
  .then(data=>{items=sorted(data.items);render();setMode("read")})
  .catch(err=>{
    $("#storyList").innerHTML='<div style="padding:24px">Daten konnten nicht geladen werden.</div>';
    console.warn(err);
  });
})();