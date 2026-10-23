/* DĀR ADMIN · Adaptive Command Navigation V1
 * Enhances existing navigation. Does not modify authentication, publishing or content data.
 * Routes every click through Admin's existing #adminTabSelect change handler. */
(()=>{"use strict";
 const items=[
  ["start","Start","⌂","ÜBERSICHT"],
  ["quellen","Beiträge","▤","REDAKTION"],
  ["social","Redaktionsatelier","✎","REDAKTION"],
  ["actions","Neuer Beitrag","+","REDAKTION"],
  ["news","News","◈","INHALTE"],
  ["ordner","Ordner","☷","INHALTE"],
  ["feed","Feed / Im Fokus","▥","INHALTE"],
  ["bibliothek","Bibliothek","▣","INHALTE"],
  ["kurzlinks","Kurzlinks","↗","VERWALTUNG"],
  ["kennwoerter","Kennwörter","⌑","VERWALTUNG"],
  ["settings","Einstellungen","⚙","VERWALTUNG"],
  ["tech","Technik","⌘","VERWALTUNG"],
  ["besucher","Besucher","◉","ANALYSE"],
  ["wochenanalyse","Wochenanalyse","▤","ANALYSE"],
  ["quiz-stats","Quiz-Statistik","◇","ANALYSE"]
 ];
 const primary=["start","quellen","social","actions"];
 const label=Object.fromEntries(items.map(([id,caption])=>[id,caption]));
 let rail,bar,more,queued=false;
 function adminActive(){
  const top=document.getElementById("topbar");
  const panel=document.getElementById("panel");
  return !!(top&&!top.hidden&&panel&&!panel.querySelector(".login"));
 }
 function current(){
  return document.getElementById("adminTabSelect")?.value||"start";
 }
 function navigate(id){
  const select=document.getElementById("adminTabSelect");
  if(!select||![...select.options].some(x=>x.value===id))return;
  if(id===current()){more&&more.setAttribute("hidden","");return}
  select.value=id;
  select.dispatchEvent(new Event("change",{bubbles:true}));
  more&&more.setAttribute("hidden","");
  queueSync();
 }
 function navButton(item,type){
  const [id,caption,glyph]=item;
  const b=document.createElement("button");
  b.type="button";
  b.className=type==="bottom"?"dar-bottom-link":"dar-nav-link";
  b.dataset.darNavigate=id;
  b.setAttribute("aria-label",caption);
  const icon=document.createElement("span");
  icon.className=type==="bottom"?"dar-bottom-icon":"dar-nav-index";
  icon.setAttribute("aria-hidden","true");
  icon.textContent=type==="bottom"?glyph:String(items.findIndex(x=>x[0]===id)+1).padStart(2,"0");
  const text=document.createElement("span");
  text.textContent=caption;
  b.append(icon,text);
  b.onclick=()=>navigate(id);
  return b;
 }
 function buildRail(){
  if(rail)return;
  rail=document.createElement("aside");rail.className="dar-command-rail";rail.setAttribute("aria-label","DĀR Admin Hauptnavigation");
  const header=document.createElement("div");header.className="dar-rail-header";
  header.innerHTML="<small>DĀR AL TAWḤĪD</small><strong>Command Center</strong><small>ADMINISTRATION</small>";
  const content=document.createElement("nav");content.className="dar-rail-scroll";
  let group="";
  items.forEach(item=>{
    if(item[3]!==group){
      group=item[3];
      const label=document.createElement("div");
      label.className="dar-rail-label";label.textContent=group;content.appendChild(label);
    }
    content.appendChild(navButton(item,"rail"));
  });
  const footer=document.createElement("div");footer.className="dar-rail-footer";
  footer.textContent="DĀR ADMIN · Alle Bereiche";
  rail.append(header,content,footer);
  document.body.appendChild(rail);
 }
 function buildMobile(){
  if(bar)return;
  bar=document.createElement("nav");bar.className="dar-mobile-command";bar.setAttribute("aria-label","Admin Schnellnavigation");
  primary.forEach(id=>{
   const item=items.find(x=>x[0]===id);bar.appendChild(navButton(item,"bottom"));
  });
  const other=document.createElement("button");other.type="button";
  other.className="dar-bottom-link";other.dataset.darMore="true";
  other.setAttribute("aria-label","Weitere Admin-Bereiche");
  other.setAttribute("aria-expanded","false");
  other.innerHTML='<span class="dar-bottom-icon" aria-hidden="true">☷</span><span>Mehr</span>';
  other.onclick=()=>{
   if(!more)return;
   const opening=more.hidden;
   more.hidden=!opening;
   other.setAttribute("aria-expanded",String(opening));
   syncState();
  };
  bar.appendChild(other);
  more=document.createElement("nav");more.className="dar-mobile-more";more.hidden=true;
  more.setAttribute("aria-label","Weitere Admin-Bereiche");
  items.filter(x=>!primary.includes(x[0])).forEach(item=>more.appendChild(navButton(item,"rail")));
  document.body.append(more,bar);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&more&&!more.hidden){
      more.hidden=true;other.setAttribute("aria-expanded","false")
    }
  });
 }
 function updateViewportCapacity(){
  const client=document.documentElement.clientWidth||window.innerWidth||0;
  const visual=window.visualViewport?.width||client;
  const width=Math.max(0,Math.min(client,visual));
  const height=window.visualViewport?.height||window.innerHeight||0;
  const touch=window.matchMedia?.("(pointer:coarse)")?.matches===true;
  // A touch device can be an unfolded phone, tablet or an app in split-window mode.
  const foldMedium=touch&&width>=650&&width<1680;
  document.body.classList.toggle("dar-admin-fold-viewport",foldMedium);
  document.body.dataset.darWindowCapacity=width<680?"compact":width<1200?"medium":"wide";
  document.body.classList.toggle("dar-admin-visual-window",client>0&&visual>260&&client-visual>60);
  document.documentElement.style.setProperty("--dar-admin-window-width",width+"px");
  document.documentElement.style.setProperty("--dar-admin-window-height",height+"px");
 }
 function syncState(){
  updateViewportCapacity();
  if(!adminActive()){
   document.body.classList.add("dar-admin-login");
   document.body.classList.remove("dar-admin-workspace","dar-editorial-fullscreen");
   if(rail)rail.hidden=true;
   if(bar)bar.hidden=true;
   if(more)more.hidden=true;
   return;
  }
  document.body.classList.remove("dar-admin-login");
  document.body.classList.add("dar-admin-workspace");
  buildRail();buildMobile();
  rail.hidden=false;bar.hidden=false;
  const id=current();
  document.querySelectorAll("[data-dar-navigate]").forEach(node=>{
    const active=node.dataset.darNavigate===id;
    node.classList.toggle("active",active);
    if(active)node.setAttribute("aria-current","page");else node.removeAttribute("aria-current");
  });
  const moreButton=bar.querySelector("[data-dar-more]");
  if(moreButton){
    moreButton.classList.toggle("active",!primary.includes(id));
    moreButton.setAttribute("aria-expanded",String(!more.hidden));
  }
 }
 function queueSync(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;syncState()});
 }
 function boot(){
  const panel=document.getElementById("panel"),top=document.getElementById("topbar");
  if(!panel||!top)return;
  const observer=new MutationObserver(queueSync);
  observer.observe(panel,{childList:true});
  observer.observe(top,{attributes:true,attributeFilter:["hidden"]});
  document.addEventListener("change",event=>{if(event.target?.id==="adminTabSelect")queueSync()});
  window.addEventListener("resize",queueSync,{passive:true});
  window.addEventListener("orientationchange",queueSync,{passive:true});
  window.visualViewport?.addEventListener("resize",queueSync,{passive:true});
  // The Fold multi-window width may change without a device orientation event.
  const rootResize=new ResizeObserver(queueSync);rootResize.observe(document.documentElement);
  document.addEventListener("click",event=>{
    if(more&&!more.hidden&&!event.target.closest(".dar-mobile-more,.dar-mobile-command")){
      more.hidden=true;bar?.querySelector("[data-dar-more]")?.setAttribute("aria-expanded","false")
    }
  },true);
  queueSync();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
 else boot();
})();