/* KIDS_GLOBAL_DETAIL_DOCK_V1247
 * Shared docked title/back header for content details.
 * Reparents the original back control: its click listeners and swipe/back
 * integration continue to work unchanged. Never touches the bottom tabs.
 */
(function(){
"use strict";
if(window.DARKidsDetailDock?.ready)return;
const S=[
 {id:"psModal",host:".ps-sheet",back:"#psClose",title:"#psTitle",subtitle:"Propheten · Geschichte",before:"#psScroll"},
 {id:"msModal",host:".ms-sheet",back:"#msClose",title:"#msTitle",subtitle:"Ṣaḥābah · Geschichte",before:"#msScroll"},
 {id:"syModal",host:".ms-sheet",back:"#syClose",title:"#syTitle",subtitle:"Ṣaḥābiyyāt · Geschichte",before:"#syScroll"},
 {id:"dlModal",host:".ms-sheet",back:"#dlClose",title:"#dlTitle",subtitle:"Dīn-Lektion · Qurʾān & Sunnah",before:"#dlScroll"},
 {id:"ghPlayer",host:"#ghPlayer",back:"#ghPlayerBack",title:"#ghPlayerTitle",subtitle:"Geschichten des Īmān · Hören & Lesen",before:"#ghPlayerScroll"},
 {id:"duaHubDetail",host:"#duaHubDetail",back:"#duaHubBack",title:"#duaHubDetailTitle",subtitle:"Mein Duʿāʾ · Lernen & Lesen",before:"#duaHubDetailScroll"}
];
const LEGACY=["knowledgeModal","duaModal","storyModal","quranModal","fullQuranModal","quizModal"];
const q=(root,sel)=>root?.querySelector(sel)||null;
function setText(el,text){
 if(el&&el.textContent!==text)el.textContent=text;
}
function configTitle(c,root){
 const raw=q(root,c.title)?.textContent?.trim()||"";
 return raw.replace(/\s+/g," ").slice(0,130)||"Wissen entdecken";
}
function initDetail(c){
 const root=document.getElementById(c.id);
 if(!root)return;
 const host=c.host===("#"+c.id)?root:q(root,c.host);
 const btn=q(root,c.back);
 if(!host||!btn)return;
 let bar=q(host,":scope > .kids-detail-appbar");
 if(!bar){
   bar=document.createElement("header");
   bar.className="kids-detail-appbar";
   bar.setAttribute("data-kids-detail-dock","v1247");
   const copy=document.createElement("div");copy.className="kids-detail-appbar-copy";
   const title=document.createElement("strong");title.className="kids-detail-appbar-title";
   const sub=document.createElement("span");sub.className="kids-detail-appbar-subtitle";
   copy.append(title,sub);bar.append(copy);
   const anchor=q(host,c.before);
   if(anchor)host.insertBefore(bar,anchor);else host.prepend(bar);
 }
 if(btn.parentElement!==bar)bar.insertBefore(btn,bar.firstChild);
 btn.classList.add("kids-detail-dock-back");
 btn.setAttribute("aria-label","Zurück");
 if(btn.textContent)btn.textContent=""; // CSS chevron; preserve original click handler
 setText(q(bar,".kids-detail-appbar-title"),configTitle(c,root));
 setText(q(bar,".kids-detail-appbar-subtitle"),c.subtitle);
}
function initLegacy(id){
 const modal=document.getElementById(id);
 const bar=q(modal,":scope > .modal-shell > .modal-top");
 if(!bar)return;
 bar.classList.add("kids-detail-appbar","kids-legacy-appbar");
 bar.setAttribute("data-kids-detail-dock","v1247");
 const btn=q(bar,".close-btn");
 if(btn){
   btn.classList.add("kids-detail-dock-back");
   btn.setAttribute("aria-label","Zurück");
   if(btn.dataset.kidsDetailChevron!=="1"){
     btn.textContent="";
     btn.dataset.kidsDetailChevron="1";
   }
 }
 const copy=q(bar,".modal-title");
 if(copy)copy.classList.add("kids-detail-appbar-copy");
}
let syncing=false,queued=false;
function sync(){
 if(syncing)return;
 syncing=true;
 try{
   for(const c of S)initDetail(c);
   for(const id of LEGACY)initLegacy(id);
 }finally{syncing=false;}
}
function queue(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;sync()});
}
function start(){
 sync();
 const mo=new MutationObserver(queue);
 mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","aria-hidden"]});
 document.addEventListener("click",queue,true);
 window.addEventListener("pageshow",queue);
 window.DARKidsDetailDock={ready:true,refresh:sync,version:"1247"};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
