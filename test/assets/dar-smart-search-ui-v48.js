/* DĀR Test Home v4.8 — multilingual & typo-tolerant search suggestions. */
(function(){"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__DarTestSearchV48)return;window.__DarTestSearchV48=true;
const F=window.DarTestFuzzyCore;if(!F)return;
let catalog=[],loading=null,panel=null,active=null,timer=0,queued=false;
const sections=[
 ["Tawḥīd und ʿAqīdah","Themen","topics","tauhid tawhid tevhid aqida akida allahs einheit"],
 ["Īmān und Glaube","Themen","topics","iman imaan iman glauben glaube"],
 ["Qurʾān und Tafsīr","Qurʾān","quran","koran quran vers sure sura tafsir"],
 ["Ḥadīṯ und Sunnah","Ḥadīṯ","hadith","hadith hadis sunna überlieferungen"],
 ["Bücher und Quellen","Werke","books","bibliothek bücher buch werke originalquellen"],
 ["Ṣaḥābah, Salaf und Gelehrte","Gelehrte","scholars","gelehrter imam sahaba salaf"],
 ["Duʿāʾ und Dhikr","Bittgebete","duas","dua bittgebet gedenken zikr"],
 ["Frauen und Fiqh","Frauenbereich","frauen","frauen fiqh ehe niqab hijab"],
 ["Propheten","Propheten","propheten","prophet gesandte"],
 ["Gebetszeiten","Gebetszeiten","prayer","fajr zuhr dhuhr asr maghrib isha ischa"],
 ["Qiblah","Gebet","qibla","qibla kibla kaaba kompass mekka"],
 ["Dīn-Quiz","Quiz","quiz","quiz fragen wissen"],
 ["Beiträge","Veröffentlichungen","recent","beitrag artikel veröffentlichungen"],
 ["Shirk","Themen","topics","schirk beigesellung"],
 ["Kufr","Themen","topics","unglaube kafir kuffar"],
 ["Ṭāghūt","Themen","topics","tagut taghoot falsche gottheit"]
];
function add(name,group,route,aliases,hash){
 if(name&&route&&catalog.length<1250)catalog.push(F.make(name,group,route,aliases||"",hash||""));
}
function load(){
 if(loading)return loading;
 for(const x of sections)add(x[0],x[1],x[2],x[3]);
 const urls=["/test/data/dar-smart-post-titles-v1.json","/data/canonical-books-index.json",
 "/data/scholar-index-meta.json","/data/frauen-bereiche-index.json","/data/quran-search-keywords.json"];
 loading=Promise.allSettled(urls.map(url=>fetch(url,{cache:"force-cache"}).then(r=>r.ok?r.json():null)))
 .then(out=>{
  const a=out.map(x=>x.status==="fulfilled"?x.value:null);
  for(const p of a[0]?.entries||[])add(p.label,"Beiträge","recent",p.slug);
  for(const b of a[1]?.books||[]){
   if(b.verification==="unverified")continue;
   add(b.title,"Werke","books",[b.author,b.category,...(b.aliases||[])].join(" "));
  }
  for(const scholar of Object.values(a[2]?.scholars||{})){
   if(scholar.displayName)add(scholar.displayName,"Gelehrte","scholars",
    [scholar.kuniyah,scholar.eraLabel,...(scholar.aliases||[])].join(" "));
  }
  for(const region of a[3]?.bereiche||[]){
   if(region.status==="aktiv")add(region.titel,"Frauenbereich","frauen",region.untertitel,region.route);
  }
  for(const word of a[4]||[])if(word.label)add(word.label,"Qurʾān-Stichwort","quran",(word.terms||[]).join(" "));
  return catalog;
 }).catch(()=>catalog);
 return loading;
}
function home(){return !!document.body?.classList.contains("is-home-route")}
function place(){
 if(!home())return;
 const slot=document.querySelector("#dtHero1194 .dt-hero-search-slot");
 const original=slot?.querySelector("#homeSearchInput");
 const compact=document.querySelector("#dv3Home .dv3-search-box");
 if(slot&&!original&&compact)slot.appendChild(compact);
 const input=slot?.querySelector("#homeSearchInput")||document.getElementById("homeSearchInput");
 if(input){
  input.placeholder="Wissen suchen: Tawḥīd, Īmān, Qurʾān, Gelehrte …";
  input.setAttribute("aria-label","Intelligente Suche in Beiträgen, Themen, Werken und Gelehrten");
 }
}
function getPanel(input){
 const field=input.closest(".dv3-search-box,.home-v380-search-field");if(!field)return null;
 if(!panel){
  panel=document.createElement("section");panel.id="darTestSmartSearchPanel";
  panel.className="dar-test-smart-panel";panel.hidden=true;
  const heading=document.createElement("div");heading.className="dar-test-smart-panel__title";
  heading.textContent="Treffer in Themen, Beiträgen, Werken und Gelehrten";
  const list=document.createElement("div");list.className="dar-test-smart-panel__list";list.setAttribute("role","listbox");
  panel.append(heading,list);
 }
 if(panel.previousElementSibling!==field)field.insertAdjacentElement("afterend",panel);
 return panel;
}
function find(q){return catalog.map(item=>({item,score:F.score(q,item)})).filter(x=>x.score>0)
 .sort((a,b)=>b.score-a.score||a.item.label.localeCompare(b.item.label,"de")).slice(0,9).map(x=>x.item)}
function render(input){
 if(!home()||!input.isConnected)return;
 const p=getPanel(input);if(!p)return;
 if(F.norm(input.value).length<2){p.hidden=true;return}
 const list=p.querySelector(".dar-test-smart-panel__list");list.replaceChildren();
 const found=find(input.value);
 if(!found.length){
  const note=document.createElement("p");note.className="dar-test-smart-panel__title";
  note.textContent="Kein Titel-Treffer. Die App-Suche kann weitere Inhalte prüfen.";list.append(note);
 }
 for(const item of found){
  const btn=document.createElement("button");btn.type="button";
  btn.className="dar-test-smart-panel__result";btn.dataset.dv3Nav=item.route;
  if(item.hash)btn.dataset.darSmartHash=item.hash;
  const name=document.createElement("span");name.className="dar-test-smart-panel__label";name.textContent=item.label;
  const group=document.createElement("span");group.className="dar-test-smart-panel__type";
  group.textContent=item.group==="Beiträge"?"Beitragsüberschrift":item.group;
  btn.append(name,group);list.append(btn);
 }
 p.hidden=false;
}
function lookup(input){
 clearTimeout(timer);timer=setTimeout(()=>load().then(()=>{
  if(active===input&&input.isConnected)render(input);
 }),120);
}
document.addEventListener("input",e=>{
 if(home()&&e.target.id==="homeSearchInput"){active=e.target;lookup(active)}
},true);
document.addEventListener("focusin",e=>{
 if(home()&&e.target.id==="homeSearchInput"){
  active=e.target;load();if(active.value)lookup(active);
 }
});
document.addEventListener("click",e=>{
 if(!panel||panel.hidden)return;
 const btn=e.target.closest?.(".dar-test-smart-panel__result");
 if(btn&&panel.contains(btn)){
  if(btn.dataset.darSmartHash){
   e.preventDefault();e.stopImmediatePropagation();location.hash=btn.dataset.darSmartHash;
  }
  panel.hidden=true;return;
 }
 if(!e.target.closest?.(".dv3-search-box,.home-v380-search-field"))panel.hidden=true;
},true);
document.addEventListener("keydown",e=>{
 if(!panel||panel.hidden)return;
 if(e.key==="Escape"){panel.hidden=true;return}
 const buttons=Array.from(panel.querySelectorAll(".dar-test-smart-panel__result"));
 if(e.target.id==="homeSearchInput"){
  if(e.key==="ArrowDown"&&buttons.length){e.preventDefault();buttons[0].focus()}
  if(e.key==="Enter"&&buttons.length){e.preventDefault();buttons[0].click();panel.hidden=true}
 }else{
  const idx=buttons.indexOf(e.target);
  if(idx<0)return;
  if(e.key==="ArrowDown"){e.preventDefault();buttons[Math.min(idx+1,buttons.length-1)].focus()}
  if(e.key==="ArrowUp"){e.preventDefault();idx===0?active.focus():buttons[idx-1].focus()}
 }
},true);
function schedule(){
 if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{place()}catch(e){}});
}
function init(){
 schedule();
 const view=document.getElementById("appView");
 if(view)new MutationObserver(schedule).observe(view,{childList:true,subtree:false});
 document.addEventListener("dar:view-rendered",schedule);
 window.addEventListener("hashchange",()=>{if(panel)panel.hidden=true;schedule()});
 window.addEventListener("pageshow",schedule);
 setTimeout(schedule,450);setTimeout(schedule,1500);
}
window.DarTestSmartSearchV48={find,load};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
