/* DĀR public website only · canonical, surface-owned home publications v1.
   Desktop/browser pageRoot. No native app, Kids, push, prayer or route overrides. */
(function(){
"use strict";
if(window.__darDesktopRecentPremiumV1)return;
window.__darDesktopRecentPremiumV1=true;
var root=document.getElementById("pageRoot"),loaded=null,fetching=false;
if(!root)return;
function node(tag,klass,text){var x=document.createElement(tag);if(klass)x.className=klass;if(text!=null)x.textContent=String(text);return x}
function berlinDay(d){var a=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d),m={};a.forEach(function(x){m[x.type]=x.value});return Date.parse(m.year+"-"+m.month+"-"+m.day+"T00:00:00Z")/86400000}
function pick(posts,now){
 var today=berlinDay(now||new Date()),seen=new Set();
 var valid=(posts||[]).filter(function(p){var date=new Date(p&&p.date||"");if(!p||!p.id||!p.title||!Number.isFinite(date.getTime())||berlinDay(date)>today||seen.has(String(p.id)))return false;seen.add(String(p.id));return true})
  .sort(function(a,b){return Date.parse(b.date)-Date.parse(a.date)||String(a.id).localeCompare(String(b.id))});
 var fresh=valid.filter(function(p){return today-berlinDay(new Date(p.date))<5});
 return {posts:fresh.length?fresh:valid.slice(0,1),isFresh:!!fresh.length};
}
function url(p){return "/?page=beitrag&id="+encodeURIComponent(p.id)}
function labelDate(p){var d=new Date(p.date);return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Berlin"}).format(d)}
function textSample(p){return String(p.excerpt||p.body||"").replace(/\s+/g," ").trim().slice(0,310)}
function current(){return(new URLSearchParams(location.search).get("page")||"start").toLowerCase()==="start"}
function render(){
 if(!current()||!loaded)return;
 var section=root.querySelector(".dar-v8-recent");
 if(!section||section.dataset.darPremiumRendered==="1")return;
 var selection=pick(loaded),posts=selection.posts;
 section.dataset.darPremiumRendered="1";
 section.classList.add("dar-desktop-premium-recent");
 section.replaceChildren();
 var head=node("div","dar-desktop-recent-heading");
 var kicker=node("span","dar-desktop-recent-kicker","NEUE VERÖFFENTLICHUNGEN");
 var title=node("h2","dar-desktop-recent-heading-title","Aktuelle Beiträge");
 var headingCopy=node("div","dar-desktop-recent-heading-copy");headingCopy.append(kicker,title);
 head.appendChild(headingCopy);
 var archive=node("a","dar-desktop-recent-all","Alle Beiträge");archive.href="/?page=beitraege";archive.classList.add("desktop-link");archive.dataset.page="beitraege";head.appendChild(archive);
 section.appendChild(head);
 var line=node("div","dar-desktop-recent-rule");line.setAttribute("aria-hidden","true");section.appendChild(line);
 if(!posts.length){section.appendChild(node("p","dar-desktop-recent-empty","Zurzeit sind keine veröffentlichten Beiträge im Index verfügbar."));return}
 if(!selection.isFresh)section.appendChild(node("p","dar-desktop-recent-older","Zuletzt veröffentlicht"));
 var viewport=node("div","dar-desktop-recent-viewport");
 viewport.tabIndex=0;viewport.setAttribute("aria-label","Veröffentlichungen horizontal durchblättern");
 var track=node("div","dar-desktop-recent-track");
 posts.forEach(function(p,i){
  var article=node("article","dar-desktop-recent-slide");
  var meta=node("div","dar-desktop-recent-meta",labelDate(p)+" · "+String(p.category||"Beitrag"));article.appendChild(meta);
  article.appendChild(node("h3","dar-desktop-recent-title",p.title));
  var excerpt=textSample(p);if(excerpt)article.appendChild(node("p","dar-desktop-recent-excerpt",excerpt));
  var source=String(p.reference||p.work||p.speaker||"").trim();
  if(source)article.appendChild(node("p","dar-desktop-recent-source",source.slice(0,180)));
  var read=node("a","dar-desktop-recent-read","Beitrag lesen ↗");read.href=url(p);read.classList.add("desktop-link");read.dataset.page="beitrag";article.appendChild(read);
  article.setAttribute("aria-label","Beitrag "+(i+1)+" von "+posts.length);
  track.appendChild(article);
 });
 viewport.appendChild(track);section.appendChild(viewport);
 var bottom=node("div","dar-desktop-recent-footer");
 var controls=node("div","dar-desktop-recent-controls");
 var prev=node("button","dar-desktop-recent-prev","‹"),next=node("button","dar-desktop-recent-next","›"),count=node("span","dar-desktop-recent-count","01 / "+String(posts.length).padStart(2,"0"));
 prev.type=next.type="button";prev.setAttribute("aria-label","Vorheriger Beitrag");next.setAttribute("aria-label","Nächster Beitrag");count.setAttribute("aria-live","polite");
 controls.append(prev,count,next);bottom.appendChild(controls);
 var toggle=node("button","dar-desktop-recent-toggle","Alle aktuellen Beiträge anzeigen");
 toggle.type="button";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","darDesktopRecentFlatList");
 bottom.appendChild(toggle);section.appendChild(bottom);
 var flat=node("div","dar-desktop-recent-flat-list");flat.id="darDesktopRecentFlatList";flat.hidden=true;
 posts.forEach(function(p,i){
  var row=node("a","dar-desktop-recent-list-row");row.href=url(p);row.classList.add("desktop-link");row.dataset.page="beitrag";
  row.append(node("span","dar-desktop-recent-list-index",String(i+1).padStart(2,"0")),node("strong","dar-desktop-recent-list-title",p.title),node("span","dar-desktop-recent-list-arrow","↗"));
  flat.appendChild(row);
 });
 section.appendChild(flat);
 var index=0,rtl=getComputedStyle(track).direction==="rtl";
 function update(){
  count.textContent=String(index+1).padStart(2,"0")+" / "+String(posts.length).padStart(2,"0");
  prev.disabled=index===0;next.disabled=index===posts.length-1;
 }
 function go(i){
  index=Math.max(0,Math.min(posts.length-1,i));
  track.scrollTo({left:(rtl?-1:1)*index*track.clientWidth,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  update();
 }
 prev.addEventListener("click",function(){go(index-1)});next.addEventListener("click",function(){go(index+1)});
 var scrolling=false;track.addEventListener("scroll",function(){if(scrolling)return;scrolling=true;requestAnimationFrame(function(){scrolling=false;var w=track.clientWidth||1;index=Math.max(0,Math.min(posts.length-1,Math.round(Math.abs(track.scrollLeft)/w)));update()})},{passive:true});
 toggle.addEventListener("click",function(){flat.hidden=!flat.hidden;toggle.setAttribute("aria-expanded",String(!flat.hidden));toggle.textContent=flat.hidden?"Alle aktuellen Beiträge anzeigen":"Beitragsübersicht schließen"});
 viewport.addEventListener("keydown",function(ev){if(ev.target!==viewport)return;if(ev.key==="ArrowRight"){ev.preventDefault();go(index+(rtl?-1:1))}if(ev.key==="ArrowLeft"){ev.preventDefault();go(index+(rtl?1:-1))}});
 update();
}
function load(){
 if(fetching||loaded)return;
 fetching=true;
 fetch("/data/desktop-posts-index.json",{cache:"no-store",credentials:"same-origin"}).then(function(r){if(!r.ok)throw Error("post index "+r.status);return r.json()}).then(function(j){if(!j||!Array.isArray(j.posts))throw Error("invalid posts");loaded=j.posts;render()}).catch(function(err){console.warn("DĀR desktop posts:",err);var section=root.querySelector(".dar-v8-recent");if(section&&current()){section.setAttribute("data-dar-recent-error","1")}}).finally(function(){fetching=false});
}
function sync(){if(current()){render();load()}}
var queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;sync()})}
if(window.MutationObserver)new MutationObserver(function(changes){if(changes.some(function(m){return m.type==="childList"&&m.target===root}))queue()}).observe(root,{childList:true});
window.addEventListener("popstate",queue);window.addEventListener("pageshow",queue);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",queue,{once:true});else queue();
})();
