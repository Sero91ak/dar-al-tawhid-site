/* DĀR Admin · Command Center V2. Presentation only; existing editor/publish/auth remain authoritative. */
(()=>{"use strict";
const groups=[
 ["ÜBERSICHT",["start","besucher","wochenanalyse","quiz-stats"]],
 ["REDAKTION",["quellen","social","wissensbereich","actions","content","schedule"]],
 ["INHALTE",["news","ordner","feed","feed-bg","bibliothek","kurzlinks"]],
 ["VERWALTUNG",["reports","users","zakat","settings","tech","kennwoerter","live-edit"]]
];
const names={start:"Dashboard",quellen:"Beiträge",social:"Redaktionsatelier",wissensbereich:"Wissensbereich",actions:"Neuer Beitrag",besucher:"Besucher",wochenanalyse:"Wochenanalyse","quiz-stats":"Quiz-Statistik",news:"News",ordner:"Ordner",feed:"Feed / Im Fokus","feed-bg":"Feed-Hintergründe",bibliothek:"Bibliothek",kurzlinks:"Kurzlinks",kennwoerter:"Kennwörter",settings:"Einstellungen",tech:"Technik",zakat:"Zakāt","live-edit":"Live-Editor"};
const glyphs={start:"▦",quellen:"▤",social:"✎",wissensbereich:"◇",actions:"+",besucher:"◉",wochenanalyse:"▥","quiz-stats":"◈",news:"◌",ordner:"☷",feed:"▧","feed-bg":"▣",bibliothek:"▣",kurzlinks:"↗",kennwoerter:"⌑",settings:"⚙",tech:"⌘",zakat:"◈","live-edit":"✎"};
const primary=["start","quellen","actions","besucher"];
const $=(s)=>document.querySelector(s);
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
const picker=()=>$("#adminTabSelect");
const active=()=>!!($("#topbar")&&!$("#topbar").hidden&&picker()&&!$("#panel .login"));
const options=()=>Array.from(picker()?.options||[]).filter(x=>x.value).map(x=>({id:x.value,title:names[x.value]||x.textContent.trim()}));
let rail,bottom,overlay,searchField,searchResults,drawer=false,queued=false;
function go(id){if(!active()||!options().some(x=>x.id===id))return;closeDrawer();closeSearch();const p=picker();if(p.value!==id){p.value=id;p.dispatchEvent(new Event("change",{bubbles:true}))}queue()}
function navButton(id,title,compact=false){const b=el("button","dar-v2-nav"+(compact?" dar-v2-tab":""),undefined);b.type="button";b.dataset.v2Nav=id;b.title=title;b.setAttribute("aria-label",title);b.append(el("span","dar-v2-nav-icon",glyphs[id]||"•"),el("span","dar-v2-nav-label",title));b.addEventListener("click",()=>go(id));return b}
function init(){
 rail=el("aside","dar-v2-rail");rail.id="darV2Rail";rail.setAttribute("aria-label","DĀR Admin Hauptnavigation");
 const brand=el("div","dar-v2-brand");const logo=el("img","dar-v2-brand-logo");logo.src="/admin/admin-icon-192.png";logo.alt="";logo.width=40;logo.height=40;brand.append(logo);
 const words=el("span","dar-v2-brand-words");words.append(el("strong","", "DĀR ADMIN"),el("small","", "INTELLIGENCE CENTER V3"));brand.append(words);
 rail.append(brand,el("nav","dar-v2-menu"),el("div","dar-v2-rail-foot","PRIVATE VERWALTUNG"));document.body.append(rail);
 const scrim=el("button","dar-v2-scrim");scrim.type="button";scrim.setAttribute("aria-label","Menü schließen");scrim.addEventListener("click",closeDrawer);document.body.append(scrim);
 bottom=el("nav","dar-v2-bottom");bottom.setAttribute("aria-label","Admin Schnellnavigation");
 primary.forEach(id=>bottom.append(navButton(id,names[id],true)));
 const more=el("button","dar-v2-nav dar-v2-tab");more.type="button";more.id="darV2More";
 more.setAttribute("aria-label","Weitere Bereiche");more.setAttribute("aria-expanded","false");
 more.append(el("span","dar-v2-nav-icon","☰"),el("span","dar-v2-nav-label","Mehr"));
 more.addEventListener("click",()=>toggleDrawer(!drawer));bottom.append(more);document.body.append(bottom);
 overlay=el("div","dar-v2-overlay");overlay.hidden=true;overlay.id="darV2Overlay";
 const box=el("div","dar-v2-search-box");box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-label","Admin-Bereiche suchen");
 const head=el("div","dar-v2-search-head");searchField=el("input","dar-v2-search-input");searchField.type="search";searchField.placeholder="Admin-Bereich suchen …";searchField.setAttribute("aria-label","Admin-Bereich suchen");
 const close=el("button","dar-v2-search-close","Schließen");close.type="button";close.addEventListener("click",closeSearch);head.append(searchField,close);
 searchResults=el("div","dar-v2-search-results");box.append(head,searchResults,el("p","dar-v2-search-hint","Bereich auswählen · Esc zum Schließen"));
 overlay.append(box);overlay.addEventListener("click",e=>{if(e.target===overlay)closeSearch()});document.body.append(overlay);
 searchField.addEventListener("input",renderSearch);
 searchField.addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();searchResults.querySelector("button")?.focus()}});
 const toolbar=$("#topbar .toolbar");if(toolbar){const b=el("button","btn dar-v2-search-launch","⌕ Bereiche");b.type="button";b.setAttribute("aria-label","Bereiche suchen");b.addEventListener("click",openSearch);toolbar.prepend(b)}
}
let lastMenuSignature="";
function renderMenu(){
 const available=options();const signature=JSON.stringify(available);if(signature===lastMenuSignature)return;lastMenuSignature=signature;
 const root=rail.querySelector(".dar-v2-menu");root.replaceChildren();const seen=new Set();
 groups.forEach(([heading,ids])=>{
  const present=ids.filter(id=>available.some(x=>x.id===id));if(!present.length)return;
  const wrap=el("section","dar-v2-menu-group");wrap.append(el("h2","dar-v2-group-label",heading));
  present.forEach(id=>{wrap.append(navButton(id,available.find(x=>x.id===id).title));seen.add(id)});root.append(wrap);
 });
 const extra=available.filter(x=>!seen.has(x.id));if(extra.length){
  const wrap=el("section","dar-v2-menu-group");wrap.append(el("h2","dar-v2-group-label","WEITERE"));
  extra.forEach(x=>wrap.append(navButton(x.id,x.title)));root.append(wrap);
 }
}
function syncSelection(){
 const id=picker()?.value;
 document.querySelectorAll("[data-v2-nav]").forEach(b=>{const yes=b.dataset.v2Nav===id;b.classList.toggle("is-active",yes);if(yes)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
 $("#darV2More")?.classList.toggle("is-active",!primary.includes(id));
 document.body.dataset.darV2View=id||"start";
}
function toggleDrawer(open){
 drawer=!!open&&active();document.body.classList.toggle("dar-v2-drawer-open",drawer);if(rail)rail.inert=window.innerWidth<=719&&!drawer;
 $("#darV2More")?.setAttribute("aria-expanded",String(drawer));
}
function closeDrawer(){toggleDrawer(false)}
const searchAliases={
 quellen:["quelle","originalbeleg","q-id","nachweis","posts","beitrag"],
 social:["redaktion","sprachen","übersetzung","neun sprachen","sprache","atelier"],
 wissensbereich:["wissen","lehrbereich","frauen","männer","lernlinks"],
 actions:["entwurf","veröffentlichen","neuer post","schreiben","publizieren"],
 tech:["deploy","freigabe","release","cloudflare","system","health"],
 besucher:["statistik","besucherzahlen","analytik","aufrufe"],
 kennwoerter:["zugang","passwort","login"],
 bibliothek:["pdf","buch","bibliothek"],
 settings:["thema","design","hell","dunkel","salbei","layl"]
};
const searchNormalize=s=>String(s||"").normalize("NFKD").replace(/\p{M}/gu,"").toLocaleLowerCase("de-DE");
function renderSearch(){
 searchResults.replaceChildren();const term=searchNormalize(searchField.value.trim());
 const matches=options().filter(x=>[x.title,...(searchAliases[x.id]||[])].some(word=>searchNormalize(word).includes(term)));
 matches.forEach(x=>searchResults.append(navButton(x.id,x.title)));
 if(!matches.length)searchResults.append(el("p","dar-v2-empty","Kein passender Bereich"));
}
function openSearch(){if(!active())return;closeDrawer();overlay.hidden=false;searchField.value="";renderSearch();searchField.focus()}
function closeSearch(){if(overlay)overlay.hidden=true}
function getStats(){
 try{const value=typeof lastData==="undefined"?null:lastData;if(!value||!Array.isArray(value.totals))return null;
 const rows=value.totals;const sum=key=>rows.reduce((v,row)=>v+(Number(row[key])||0),0);
 return {online:Number(value.live?.live_now)||0,views:sum("views"),shares:sum("shares"),saves:sum("saves"),rows,updated:value.updated||null};}catch{return null}
}
const nf=value=>Math.round(Number(value)||0).toLocaleString("de-DE");
function buildOverview(){
 const cover=$("#panel .admin-cover");
 if(!cover||picker()?.value!=="start")return;
 let section=$("#darV2Overview");
 if(!section){
  section=el("section","dar-v2-overview");section.id="darV2Overview";
  const heading=el("div","dar-v2-overview-heading");heading.append(el("span","dar-v2-eyebrow","LIVE-DATEN & REDAKTION"),el("h2","","Auf einen Blick"));section.append(heading);
  section.append(el("div","dar-v2-kpis"));
  const grid=el("div","dar-v2-overview-grid");
  const chart=el("section","dar-v2-widget");chart.id="darV2Chart";chart.append(el("h3","","Beliebte Inhalte"),el("p","dar-v2-caption","Aufrufe nach Inhalten · vorhandene Statistik"),el("div","dar-v2-chart-list"));
  const flow=el("section","dar-v2-widget");flow.append(el("h3","","Redaktioneller Workflow"),el("p","dar-v2-caption","Vier kontrollierte Stationen"));
  const steps=el("div","dar-v2-steps");
  [["01","Entwurf verfassen","actions"],["02","Quellen überprüfen","quellen"],["03","Redaktion & Vorschau","social"],["04","Veröffentlichung vorbereiten","actions"]].forEach(([num,label,id])=>{const b=el("button","dar-v2-step");b.type="button";b.append(el("span","dar-v2-step-num",num),el("span","",label),el("span","dar-v2-step-arrow","↗"));b.addEventListener("click",()=>go(id));steps.append(b)});
  flow.append(steps);grid.append(chart,flow);section.append(grid);cover.insertAdjacentElement("afterend",section);
 }
 const stats=getStats();const data=[
 ["Besucher jetzt",stats?nf(stats.online):"—","Live-Zählung","◉"],
 ["Aufrufe",stats?nf(stats.views):"—","Erfasste Inhaltsaufrufe","▥"],
 ["Geteilt",stats?nf(stats.shares):"—","Erfasste Aktionen","↗"],
 ["Gespeichert",stats?nf(stats.saves):"—","Erfasste Aktionen","▣"]];
 const wrap=section.querySelector(".dar-v2-kpis"),serialized=JSON.stringify(data);
 if(wrap.dataset.payload!==serialized){wrap.dataset.payload=serialized;wrap.replaceChildren();
 data.forEach(([title,value,detail,icon])=>{const card=el("div","dar-v2-kpi");card.append(el("span","dar-v2-kpi-icon",icon),el("span","dar-v2-kpi-title",title),el("strong","dar-v2-kpi-value",value),el("span","dar-v2-kpi-detail",detail));wrap.append(card)})}
 const chart=section.querySelector(".dar-v2-chart-list");chart.replaceChildren();
 const best=(stats?.rows||[]).filter(row=>(Number(row.views)||0)>0).sort((a,b)=>(Number(b.views)||0)-(Number(a.views)||0)).slice(0,5);
 if(!best.length){chart.append(el("p","dar-v2-empty","Noch keine auswertbaren Daten verfügbar."));return}
 const max=Math.max(...best.map(row=>Number(row.views)||0));
 best.forEach(row=>{
  const item=el("div","dar-v2-chart-item"),legend=el("div","dar-v2-chart-label");
  legend.append(el("span","",String(row.content_title||row.content_id||"Inhalt")),el("strong","",nf(row.views)));
  const track=el("div","dar-v2-chart-track"),bar=el("div","dar-v2-chart-bar");
  bar.style.width=Math.max(3,Math.min(100,100*(Number(row.views)||0)/max))+"%";
  track.append(bar);item.append(legend,track);chart.append(item);
 });
}
function sync(){
 queued=false;const on=active();document.body.classList.toggle("dar-v2-active",on);
 if(!on){closeDrawer();closeSearch();if(rail){rail.hidden=true;bottom.hidden=true;}return}
 if(!rail)init();
 rail.hidden=false;bottom.hidden=false;
 rail.inert=window.innerWidth<=719&&!drawer;
 renderMenu();syncSelection();
 if(window.DARAdminIntelligenceV3){
  try{window.DARAdminIntelligenceV3.sync(getStats())}catch(error){console.error("DĀR Admin V3 display fallback",error);buildOverview()}
 }else buildOverview();
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync)}
function boot(){
 const panel=$("#panel"),top=$("#topbar");if(!panel||!top)return;
 new MutationObserver(queue).observe(panel,{childList:true});
 new MutationObserver(queue).observe(top,{attributes:true,attributeFilter:["hidden"]});
 document.addEventListener("change",e=>{if(e.target?.id==="adminTabSelect")queue()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeSearch();closeDrawer()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&active()){e.preventDefault();openSearch()}});
 window.addEventListener("resize",()=>{if(window.innerWidth>719)closeDrawer()},{passive:true});
 queue();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();