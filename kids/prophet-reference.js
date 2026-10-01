(() => {
"use strict";
const FIRST=["adam","idris","nuh","hud","salih"];
const POS={adam:"0%",idris:"25%",nuh:"50%",hud:"75%",salih:"100%"};
let items=[],mode="read";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function minutes(item){
  const m=Number(item?.voiceProduction?.estimatedMinutes||0);
  if(m>0)return Math.max(2,Math.min(9,Math.round(m)));
  const text=String(item?.scripts?.["6-8"]||item?.voiceScript||"");
  return Math.max(2,Math.min(9,Math.ceil((text.match(/\S+/g)||[]).length/105)));
}
function ar(item){return [item.nameAr||"",item.id==="muhammad"?"ﷺ":"عليه السلام"].filter(Boolean).join(" ")}
function sorted(list){
  const map=new Map((Array.isArray(list)?list:[]).map(x=>[x.id,x]));
  return FIRST.map(id=>map.get(id)).filter(Boolean);
}
function render(){
  $("#storyList").innerHTML=items.map(item=>
    '<button class="story" type="button" data-id="'+esc(item.id)+'" style="--sprite-pos:'+POS[item.id]+'">'+
      '<span class="story-bg" aria-hidden="true"></span>'+
      '<span class="story-copy">'+
        '<span class="eyebrow">'+(item.id==="adam"?"UNSER ERSTER PROPHET":"UNSER PROPHET")+'</span>'+
        '<h2>'+esc(item.name)+'</h2>'+
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
  $("#detailTitle").textContent=item.name;
  $("#detailArabic").textContent=ar(item);
  $("#detailSummary").textContent=item.summary||"";
  $("#detailMinutes").textContent="ca. "+minutes(item)+" Min.";
  const raw=storyText(item);
  $("#readingCard").innerHTML="<h2>Die Geschichte von "+esc(item.name)+"</h2>"+
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
