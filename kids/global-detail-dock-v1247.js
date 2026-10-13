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
 if(!btn.classList.contains("kids-detail-dock-back"))btn.classList.add("kids-detail-dock-back");
 if(btn.getAttribute("aria-label")!=="Zurück")btn.setAttribute("aria-label","Zurück");
 if(btn.textContent)btn.textContent=""; // CSS chevron; preserve original click handler
 setText(q(bar,".kids-detail-appbar-title"),configTitle(c,root));
 setText(q(bar,".kids-detail-appbar-subtitle"),c.subtitle);
}
function initLegacy(id){
 const modal=document.getElementById(id);
 const bar=q(modal,":scope > .modal-shell > .modal-top");
 if(!bar)return;
 if(!bar.classList.contains("kids-detail-appbar"))bar.classList.add("kids-detail-appbar","kids-legacy-appbar");
 if(bar.getAttribute("data-kids-detail-dock")!=="v1247")bar.setAttribute("data-kids-detail-dock","v1247");
 const btn=q(bar,".close-btn");
 if(btn){
   if(!btn.classList.contains("kids-detail-dock-back"))btn.classList.add("kids-detail-dock-back");
   if(btn.getAttribute("aria-label")!=="Zurück")btn.setAttribute("aria-label","Zurück");
   if(btn.dataset.kidsDetailChevron!=="1"){
     btn.textContent="";
     btn.dataset.kidsDetailChevron="1";
   }
 }
 const copy=q(bar,".modal-title");
 if(copy&&!copy.classList.contains("kids-detail-appbar-copy"))copy.classList.add("kids-detail-appbar-copy");
}

/* KIDS_EXPLANATION_ACTIONS_V1249
 * Upgrade native explanation/audio buttons without cloning them.
 * The original listeners, disabled state and speech engines are preserved.
 * Future buttons with equivalent German labels adopt the same affordance.
 */
/* KIDS_NO_EXTERNAL_SOURCE_PROOF_ACTIONS_V1251
 * No external source-opening controls in the children's UI.
 * Bibliographical source text remains visible in each learning detail.
 * Exact action labels only; unrelated educational links remain available.
 */
function removeExternalSourceProofActions(){
  for(const el of document.querySelectorAll("a,button")){
    const label=String(el.getAttribute("aria-label")||el.textContent||"").replace(/\s+/g," ").trim();
    if(/^(?:Nachweis öffnen|Quelle öffnen|Beleg öffnen|Originalnachweis öffnen)$/i.test(label)){
      el.remove();
    }
  }
}

function upgradeExplanationActions(){
  const buttons=document.querySelectorAll("button");
  for(const btn of buttons){
    const present=btn.querySelector(":scope > .kids-explain-copy > strong");
    const label=(present?present.textContent:btn.textContent||"").replace(/\s+/g," ").trim();
    if(!/erklärung/i.test(label)||!/(?:hören|anhören|abspielen)/i.test(label)||label.length>80)continue;
    if(!present){
      const icon=document.createElement("span");icon.className="kids-explain-icon";icon.setAttribute("aria-hidden","true");
      const copy=document.createElement("span");copy.className="kids-explain-copy";
      const name=document.createElement("strong");name.textContent=label;
      const hint=document.createElement("small");
      hint.textContent=btn.disabled?"Audio wird vorbereitet":"Tippe hier und hör zu";
      const arrow=document.createElement("span");arrow.className="kids-explain-chevron";arrow.setAttribute("aria-hidden","true");
      copy.append(name,hint);
      btn.replaceChildren(icon,copy,arrow);
      btn.classList.add("kids-explain-action");
    }else{
      const hint=btn.querySelector(".kids-explain-copy small");
      const updated=btn.disabled?"Audio wird vorbereitet":"Tippe hier und hör zu";
      if(hint&&hint.textContent!==updated)hint.textContent=updated;
    }
    if(!btn.dataset.kidsExplainOriginalLabel)btn.dataset.kidsExplainOriginalLabel=label;
    const spokenLabel=label+(btn.disabled?", Audio wird vorbereitet":", Tippe hier und hör zu");
    if(btn.getAttribute("aria-label")!==spokenLabel)btn.setAttribute("aria-label",spokenLabel);
  }
}

/* KIDS_GLOBAL_PINNED_DETAIL_PORTAL_V1400
 * One *real* pinned appbar for any in-tab detail with:
 * .view.kids-detail-page > .kids-detail-appbar.
 * iOS WKWebView may scroll a sticky header together with its transformed
 * .view/.shell ancestors. Reparent the ORIGINAL bar to document.body while
 * retaining its click listeners and a measured layout spacer at its origin.
 * This is reusable for all future details, not a Salaf-specific clone.
 */
const pinned=new Map();
function pinDetailPages(){
  const eligible=Array.from(document.querySelectorAll(".shell > .view.active.kids-detail-page"));
  for(const root of eligible){
    let record=pinned.get(root);
    const bar=record?.bar||root.querySelector(":scope > .kids-detail-appbar");
    if(!bar)continue;
    const modalOpen=root.id==="view-salaf"&&document.documentElement.classList.contains("salaf-detail-open");
    if(bar.hidden||modalOpen)continue;
    if(!record){
      const spacer=document.createElement("div");
      spacer.className="kids-detail-head-spacer";
      spacer.setAttribute("aria-hidden","true");
      root.insertBefore(spacer,bar);
      record={bar,spacer};
      pinned.set(root,record);
    }
    if(bar.parentElement!==document.body){
      bar.classList.add("kids-portal-appbar");
      bar.dataset.kidsPinnedDetail="v1410";
      document.body.appendChild(bar);
    }
    const css=getComputedStyle(root);
    for(const property of ["--kids-detail-head-bg","--kids-detail-head-line","--salaf-ink","--salaf-muted"]){
      const value=css.getPropertyValue(property).trim();
      if(value)bar.style.setProperty(property,value);
    }
    record.spacer.style.height=Math.max(68,Math.ceil(bar.getBoundingClientRect().height))+"px";
  }
  for(const [root,record] of pinned){
    const active=eligible.includes(root)&&!record.bar.hidden&&
      !(root.id==="view-salaf"&&document.documentElement.classList.contains("salaf-detail-open"));
    if(active)continue;
    if(record.spacer.isConnected&&record.bar.parentElement!==root){
      root.insertBefore(record.bar,record.spacer.nextSibling);
    }
    record.bar.classList.remove("kids-portal-appbar");
    record.bar.removeAttribute("data-kids-pinned-detail");
    record.bar.style.removeProperty("--kids-detail-head-bg");
    record.bar.style.removeProperty("--kids-detail-head-line");
    record.bar.style.removeProperty("--salaf-ink");
    record.bar.style.removeProperty("--salaf-muted");
    record.spacer.remove();
    pinned.delete(root);
  }
}
/* Salaf stories have a distinct full-screen reading overlay. Its header
 * belongs OUTSIDE the content's own overflow-y:auto scroller. */
function dockSalafStoryHeader(){
  const detail=document.getElementById("salafDetail");
  if(!detail)return;
  const scroll=detail.querySelector(".salaf-detail-scroll");
  const header=scroll?.querySelector(":scope > .salaf-story-nav");
  if(header){
    header.dataset.kidsPinnedDetail="v1410";
    detail.insertBefore(header,scroll);
  }
}
let syncing=false,queued=false;
function sync(){
 if(syncing)return;
 syncing=true;
 try{
   for(const c of S)initDetail(c);
   for(const id of LEGACY)initLegacy(id);
   dockSalafStoryHeader();
   pinDetailPages();
   upgradeExplanationActions();
   removeExternalSourceProofActions();
 }finally{syncing=false;}
}
function queue(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;sync()});
}
/* KIDS_TOP_SCROLL_BOUNDARY_V1411
 * iOS PWA/WKWebView may rubber-band the single page scroller despite
 * CSS overscroll-behavior. A portal-fixed header remains stationary while
 * the transparent in-flow head spacer and hero move DOWN, revealing a gap.
 *
 * Clamp only downward finger motion when every scrollable ancestor is
 * already at its top. Upward reading, momentum, horizontal gestures,
 * nested scrollers, audio buttons and ordinary navigation remain native.
 * Bound once in this shared controller: present and future Kids details.
 */
function installTopScrollBoundaryGuard(){
  const shell=document.querySelector(".shell");
  if(!shell||shell.dataset.kidsTopEdgeGuard)return;
  shell.dataset.kidsTopEdgeGuard="v1411";
  const detailSelector=".shell > .view.active.kids-detail-page, #salafDetail:not([hidden]), .modal.open, .duahub-detail.open";
  let previousX=null,previousY=null,startTarget=null;
  function scrollableAncestorAboveTop(target){
    for(let node=target;node&&node!==document.body;node=node.parentElement){
      if(!(node instanceof HTMLElement))continue;
      const overflowY=getComputedStyle(node).overflowY;
      if(!/^(auto|scroll|overlay)$/.test(overflowY))continue;
      if(node.scrollHeight>node.clientHeight+1&&node.scrollTop>0.5)return true;
    }
    return false;
  }
  document.addEventListener("touchstart",event=>{
    if(event.touches.length!==1){
      startTarget=null;previousX=null;previousY=null;return;
    }
    const touch=event.touches[0];
    previousX=touch.clientX;previousY=touch.clientY;
    startTarget=event.target instanceof Element&&event.target.closest(detailSelector)?event.target:null;
  },{capture:true,passive:true});
  document.addEventListener("touchmove",event=>{
    if(event.touches.length!==1||!startTarget||previousY===null)return;
    const touch=event.touches[0];
    const dx=touch.clientX-previousX,dy=touch.clientY-previousY;
    previousX=touch.clientX;previousY=touch.clientY;
    if(event.defaultPrevented||!event.cancelable||dy<=0||dy<=Math.abs(dx))return;
    if(!scrollableAncestorAboveTop(startTarget))event.preventDefault();
  },{capture:true,passive:false});
  function reset(){startTarget=null;previousX=null;previousY=null;}
  document.addEventListener("touchend",reset,{passive:true});
  document.addEventListener("touchcancel",reset,{passive:true});
}
function start(){
 installTopScrollBoundaryGuard();
 sync();
 const mo=new MutationObserver(queue);
 mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","aria-hidden"]});
 document.addEventListener("click",queue,true);
 // The iPhone safe inset can change after rotation, standalone resume or
 // address-bar transitions. Re-measure the exact fixed-rail height; never
 // allow hero content to occupy the measured slot.
 window.addEventListener("resize",queue,{passive:true});
 window.visualViewport?.addEventListener("resize",queue,{passive:true});
 window.addEventListener("orientationchange",queue,{passive:true});
 window.addEventListener("pageshow",queue);
 window.DARKidsDetailDock={ready:true,refresh:sync,version:"1410",pinDetailPages};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
