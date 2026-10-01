(() => {
"use strict";
const DATA_URL="/kids/data/prophet-stories.json";
const ORDER=[
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail","ishaq","yaqub",
  "yusuf","ayyub","shuayb","musa","harun","dhul-kifl","dawud","sulayman",
  "ilyas","alyasa","yunus","zakariyya","yahya","isa","muhammad"
];
const ART={
  adam:{scene:"garden",sceneX:46,sceneY:57,artScale:1.02,artX:-2,artY:3,detailScale:1.30,detailX:0,detailY:2},
  idris:{scene:"library",sceneX:49,sceneY:48,artScale:1.04,artX:-1,artY:2,detailScale:1.32,detailX:0,detailY:1},
  nuh:{scene:"ocean",sceneX:48,sceneY:54,artScale:1.12,artX:-2,artY:4,detailScale:1.58,detailX:5,detailY:-3},
  hud:{scene:"desert",sceneX:52,sceneY:56,artScale:1.07,artX:-1,artY:4,detailScale:1.35,detailX:1,detailY:2},
  salih:{scene:"desert",sceneX:54,sceneY:57,artScale:1.04,artX:-2,artY:4,detailScale:1.33,detailX:0,detailY:2},
  ibrahim:{scene:"desert",sceneX:47,sceneY:54,artScale:1.05,artX:-1,artY:3,detailScale:1.34,detailX:0,detailY:1},
  lut:{scene:"night",sceneX:52,sceneY:58,artScale:1.02,artX:-1,artY:2,detailScale:1.30,detailX:0,detailY:1},
  ismail:{scene:"desert",sceneX:50,sceneY:55,artScale:1.04,artX:-1,artY:3,detailScale:1.32,detailX:0,detailY:1},
  ishaq:{scene:"desert",sceneX:48,sceneY:55,artScale:1.03,artX:-1,artY:3,detailScale:1.31,detailX:0,detailY:1},
  yaqub:{scene:"mountain",sceneX:50,sceneY:53,artScale:1.06,artX:-1,artY:2,detailScale:1.33,detailX:0,detailY:1},
  yusuf:{scene:"royal",sceneX:47,sceneY:58,artScale:1.04,artX:-1,artY:2,detailScale:1.32,detailX:0,detailY:1},
  ayyub:{scene:"water",sceneX:48,sceneY:57,artScale:1.03,artX:-1,artY:2,detailScale:1.31,detailX:0,detailY:1},
  shuayb:{scene:"desert",sceneX:51,sceneY:55,artScale:1.03,artX:-1,artY:3,detailScale:1.31,detailX:0,detailY:1},
  musa:{scene:"water",sceneX:52,sceneY:55,artScale:1.06,artX:-2,artY:2,detailScale:1.35,detailX:0,detailY:1},
  harun:{scene:"mountain",sceneX:52,sceneY:53,artScale:1.03,artX:-1,artY:2,detailScale:1.31,detailX:0,detailY:1},
  "dhul-kifl":{scene:"mountain",sceneX:48,sceneY:54,artScale:1.02,artX:-1,artY:2,detailScale:1.30,detailX:0,detailY:1},
  dawud:{scene:"royal",sceneX:49,sceneY:58,artScale:1.03,artX:-1,artY:2,detailScale:1.31,detailX:0,detailY:1},
  sulayman:{scene:"royal",sceneX:51,sceneY:57,artScale:1.05,artX:-1,artY:2,detailScale:1.33,detailX:0,detailY:1},
  ilyas:{scene:"mountain",sceneX:48,sceneY:52,artScale:1.03,artX:-1,artY:2,detailScale:1.31,detailX:0,detailY:1},
  alyasa:{scene:"garden",sceneX:49,sceneY:56,artScale:1.02,artX:-1,artY:2,detailScale:1.30,detailX:0,detailY:1},
  yunus:{scene:"ocean",sceneX:52,sceneY:55,artScale:1.07,artX:-1,artY:3,detailScale:1.38,detailX:1,detailY:1},
  zakariyya:{scene:"garden",sceneX:47,sceneY:56,artScale:1.02,artX:-1,artY:2,detailScale:1.30,detailX:0,detailY:1},
  yahya:{scene:"water",sceneX:48,sceneY:56,artScale:1.02,artX:-1,artY:2,detailScale:1.30,detailX:0,detailY:1},
  isa:{scene:"night",sceneX:49,sceneY:56,artScale:1.03,artX:-1,artY:2,detailScale:1.31,detailX:0,detailY:1},
  muhammad:{scene:"night",sceneX:52,sceneY:60,artScale:1.04,artX:-1,artY:2,detailScale:1.32,detailX:0,detailY:1}
};
let items=[],mode="read";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const art=id=>ART[id]||ART.muhammad;
const sceneUrl=id=>"/kids/assets/prophet-scenes/"+art(id).scene+".webp";
const symbolUrl=id=>"/kids/assets/prophet-symbols/"+encodeURIComponent(id)+".webp";
const honorific=item=>item.id==="muhammad"?"ﷺ":(item.disputed?"":"عليه السلام");
const arabic=item=>[item.nameAr||"",honorific(item)].filter(Boolean).join(" ");
function minutes(item){
  const m=Number(item?.voiceProduction?.estimatedMinutes||0);
  if(m>0)return Math.max(1,Math.round(m));
  const text=String(item?.voiceScript||"");
  return Math.max(2,Math.min(9,Math.ceil((text.match(/\S+/g)||[]).length/105)));
}
function sorted(list){
  const rank=new Map(ORDER.map((id,i)=>[id,i]));
  return (Array.isArray(list)?list:[]).filter(x=>x&&x.id).sort((a,b)=>(rank.get(a.id)??999)-(rank.get(b.id)??999));
}
function vars(item){
  const a=art(item.id);
  return [
    "--scene:url('"+sceneUrl(item.id)+"')",
    "--scene-x:"+a.sceneX+"%",
    "--scene-y:"+a.sceneY+"%",
    "--art-scale:"+a.artScale,
    "--art-x:"+a.artX+"%",
    "--art-y:"+a.artY+"%",
    "--detail-scene-x:"+a.sceneX+"%",
    "--detail-scene-y:"+a.sceneY+"%",
    "--detail-scale:"+a.detailScale,
    "--detail-x:"+a.detailX+"%",
    "--detail-y:"+a.detailY+"%"
  ].join(";");
}
function renderList(){
  const host=$("#prList");
  host.innerHTML=items.map(item=>
    '<button class="pr-row" data-id="'+esc(item.id)+'" type="button" style="'+esc(vars(item))+'">'+
      '<span class="pr-row-bg" aria-hidden="true"></span>'+
      '<span class="pr-row-art" aria-hidden="true"><img src="'+esc(symbolUrl(item.id))+'" alt=""></span>'+
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
  const s=item?.scripts?.["6-8"]||item?.voiceScript||"";
  if(s.trim())return s.trim();
  return (item?.chapters||[]).join("\n\n");
}
function openDetail(id){
  const item=items.find(x=>x.id===id);if(!item)return;
  const panel=$("#prDetailView");
  panel.dataset.id=id;
  $("#prDetailHero").setAttribute("style",vars(item));
  $("#prDetailSymbol").src=symbolUrl(id);
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
  $("#prListView").hidden=true;
  panel.hidden=false;
  window.scrollTo({top:0,behavior:"instant"});
  history.replaceState(null,"","?id="+encodeURIComponent(id));
}
function closeDetail(){
  $("#prDetailView").hidden=true;
  $("#prListView").hidden=false;
  history.replaceState(null,"",location.pathname);
  window.scrollTo({top:0,behavior:"instant"});
}
function setMode(next){
  mode=next;
  document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  const reading=$("#prReading");
  if(reading)reading.style.display=mode==="listen"?"none":"block";
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-mode]");
  if(b)setMode(b.dataset.mode);
});
$("#prBack").addEventListener("click",closeDetail);

const extra=document.createElement("style");
extra.textContent=
'.pr-clock{-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2.2\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'8\'/%3E%3Cpath d=\'M12 7v5l3 2\'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2.2\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'8\'/%3E%3Cpath d=\'M12 7v5l3 2\'/%3E%3C/svg%3E") center/contain no-repeat}.pr-age{-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Ccircle cx=\'12\' cy=\'7\' r=\'3\'/%3E%3Cpath d=\'M5 21c.7-5 3-8 7-8s6.3 3 7 8z\'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Ccircle cx=\'12\' cy=\'7\' r=\'3\'/%3E%3Cpath d=\'M5 21c.7-5 3-8 7-8s6.3 3 7 8z\'/%3E%3C/svg%3E") center/contain no-repeat}';
document.head.appendChild(extra);

fetch(DATA_URL+"?v="+Date.now(),{cache:"no-store"})
  .then(r=>{if(!r.ok)throw new Error("data "+r.status);return r.json()})
  .then(data=>{
    items=sorted(data.items);
    renderList();
    setMode("read");
    const id=new URLSearchParams(location.search).get("id");
    if(id&&items.some(x=>x.id===id))openDetail(id);
  })
  .catch(err=>{
    $("#prList").innerHTML='<div style="padding:22px;color:#fff">Referenzdaten konnten nicht geladen werden.</div>';
    console.warn("[Prophet reference]",err);
  });
})();
