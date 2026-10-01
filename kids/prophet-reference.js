(() => {
"use strict";
const DATA_URL="/kids/data/prophet-stories.json";
const ORDER=[
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","ishaq","yaqub",
  "yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman",
  "ilyas","alyasa","yunus","zakariyya","yahya","isa","muhammad"
];
let items=[],mode="read";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const honorific=item=>item.id==="muhammad"?"ﷺ":(item.disputed?"":"عليه السلام");
const arabic=item=>[item.nameAr||"",honorific(item)].filter(Boolean).join(" ");
const rank=new Map(ORDER.map((id,i)=>[id,i]));
function minutes(item){
  const m=Number(item?.voiceProduction?.estimatedMinutes||0);
  if(m>0)return Math.max(1,Math.round(m));
  const text=String(item?.scripts?.["6-8"]||item?.voiceScript||"");
  return Math.max(2,Math.min(9,Math.ceil((text.match(/\S+/g)||[]).length/105)));
}
function sorted(list){
  return (Array.isArray(list)?list:[]).filter(x=>x&&x.id&&rank.has(x.id)).sort((a,b)=>rank.get(a.id)-rank.get(b.id));
}
function spritePos(id){
  const i=rank.get(id)??0;
  return (i/(ORDER.length-1)*100).toFixed(4)+"%";
}
function vars(item){return "--sprite-pos:"+spritePos(item.id)}
function renderList(){
  const host=$("#prList");
  host.innerHTML=items.map(item=>
    '<button class="pr-row" data-id="'+esc(item.id)+'" type="button" style="'+vars(item)+'">'+
      '<span class="pr-row-bg" aria-hidden="true"></span>'+
      '<span class="pr-row-copy">'+
        '<span class="pr-row-meta">'+(item.disputed?"IKHTILĀF":"QURʾĀN GEPRÜFT")+' · CA. '+minutes(item)+' MIN.</span>'+
        '<span class="pr-row-title">'+esc(item.name)+(item.id==="muhammad"?" ﷺ":"")+'</span>'+
        '<span class="pr-row-ar" dir="rtl">'+esc(arabic(item))+'</span>'+
      '</span>'+
      '<span class="pr-row-go" aria-hidden="true">›</span>'+
    '</button>'
  ).join("");
  host.querySelectorAll(".pr-row").forEach(row=>row.addEventListener("click",()=>openDetail(row.dataset.id)));
}
function scriptFor(item){
  const s=String(item?.scripts?.["6-8"]||item?.voiceScript||"").trim();
  return s || (item?.chapters||[]).join("\n\n");
}
function openDetail(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  const panel=$("#prDetailView");
  panel.dataset.id=id;
  $("#prDetailHero").setAttribute("style",vars(item));
  $("#prTitle").textContent=item.name+(id==="muhammad"?" ﷺ":"");
  $("#prArabic").textContent=arabic(item);
  $("#prSummary").textContent=item.summary||"";
  $("#prPills").innerHTML=
    '<span class="pr-pill"><span class="pr-ico pr-clock"></span>ca. '+minutes(item)+' Min.</span>'+
    '<span class="pr-pill"><span class="pr-ico pr-age"></span>Alter 6–8</span>'+
    '<span class="pr-pill"><span class="pr-ico pr-book"></span>Qurʾān · geprüft</span>';
  const text=scriptFor(item);
  $("#prReading").innerHTML=text.split(/\n{2,}/).filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join("")+
    '<div class="pr-source"><strong>Quellen:</strong> '+esc((item.sourceRefs||[]).join(" · "))+'</div>';
  $("#prListView").hidden=true;panel.hidden=false;
  window.scrollTo({top:0,behavior:"instant"});
  history.replaceState(null,"","?id="+encodeURIComponent(id));
}
function closeDetail(){
  $("#prDetailView").hidden=true;$("#prListView").hidden=false;
  history.replaceState(null,"",location.pathname);
  window.scrollTo({top:0,behavior:"instant"});
}
function setMode(next){
  mode=next;
  document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  const reading=$("#prReading");if(reading)reading.style.display=mode==="listen"?"none":"block";
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(b)setMode(b.dataset.mode)});
$("#prBack").addEventListener("click",closeDetail);
fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"})
  .then(r=>{if(!r.ok)throw new Error("data "+r.status);return r.json()})
  .then(data=>{
    items=sorted(data.items);renderList();setMode("read");
    const id=new URLSearchParams(location.search).get("id");
    if(id&&items.some(x=>x.id===id))openDetail(id);
  })
  .catch(err=>{
    $("#prList").innerHTML='<div style="padding:22px;color:#fff">Referenzdaten konnten gerade nicht geladen werden.</div>';
    console.warn("[Prophet reference]",err);
  });
})();
