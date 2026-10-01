(() => {
"use strict";
const ORDER=[
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","ishaq","yaqub",
  "yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman",
  "ilyas","alyasa","yunus","zakariyya","yahya","isa","muhammad"
];
const RANK=new Map(ORDER.map((id,i)=>[id,i]));
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
  if(item.id==="muhammad")return [item.nameAr||"","ﷺ"].filter(Boolean).join(" ");
  return [item.nameAr||"","عليه السلام"].filter(Boolean).join(" ");
}
function sorted(list){
  const map=new Map((Array.isArray(list)?list:[]).map(x=>[x.id,x]));
  return ORDER.map(id=>map.get(id)).filter(Boolean);
}
function listVars(id){
  const i=RANK.get(id)??0;
  return "--sprite-pos:"+(i/(ORDER.length-1)*100).toFixed(4)+"%";
}
function heroVars(id){
  const i=RANK.get(id)??0;
  const group=Math.floor(i/5)+1;
  const within=i%5;
  const count=group===5?5:5;
  const pos=(within/(count-1)*100).toFixed(4)+"%";
  return {
    css:"--hero-sprite:var(--hero"+group+");--hero-pos:"+pos+";--hero-x:52%",
    group,within
  };
}
function render(){
  $("#storyList").innerHTML=items.map(item=>
    '<button class="story" type="button" data-id="'+esc(item.id)+'" style="'+listVars(item.id)+'">'+
      '<span class="story-bg" aria-hidden="true"></span>'+
      '<span class="story-copy">'+
        '<span class="eyebrow">'+(item.id==="adam"?"UNSER ERSTER PROPHET":"UNSER PROPHET")+'</span>'+
        '<h2>'+esc(item.name)+(item.id==="muhammad"?" ﷺ":"")+'</h2>'+
        '<span class="arabic" dir="rtl">'+esc(ar(item))+'</span>'+
        '<span class="story-time">◷ &nbsp;ca. '+minutes(item)+' Min.</span>'+
      '</span>'+
      '<span class="story-go" aria-hidden="true">›</span>'+
    '</button>'
  ).join("");
  document.querySelectorAll(".story").forEach(b=>b.addEventListener("click",()=>openDetail(b.dataset.id)));
}
function storyText(item){
  const s=String(item?.scripts?.["6-8"]||item?.voiceScript||"").trim();
  return s||(item?.chapters||[]).join("\n\n");
}
function openDetail(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  const hero=$("#detailHero");
  hero.dataset.id=id;
  hero.setAttribute("style",heroVars(id).css);
  $("#detailTitle").textContent=item.name+(id==="muhammad"?" ﷺ":"");
  $("#detailArabic").textContent=ar(item);
  $("#detailSummary").textContent=item.summary||"";
  $("#detailMinutes").textContent="ca. "+minutes(item)+" Min.";
  const raw=storyText(item);
  $("#readingCard").innerHTML="<h2>Die Geschichte von "+esc(item.name)+(id==="muhammad"?" ﷺ":"")+"</h2>"+
    raw.split(/\n{2,}/).filter(Boolean).map(p=>"<p>"+esc(p)+"</p>").join("");
  $("#listView").hidden=true;
  $("#detailView").hidden=false;
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
document.addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(b)setMode(b.dataset.mode)});
$("#backBtn").addEventListener("click",closeDetail);
fetch("/kids/data/prophet-stories.json?v="+Date.now(),{cache:"no-store"})
  .then(r=>{if(!r.ok)throw new Error("data "+r.status);return r.json()})
  .then(data=>{items=sorted(data.items);render();setMode("read")})
  .catch(err=>{$("#storyList").innerHTML='<div style="padding:24px">Daten konnten nicht geladen werden.</div>';console.warn(err)});
})();
