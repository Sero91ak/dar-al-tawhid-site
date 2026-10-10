/* DAR Mehr V1.5 | shared functional UI; scoped to the adult Mehr view only. */
(function(){
"use strict";
if(window.DAR_MORE_V15)return;
const rootClass="dar-more-v15";
const categories=[["wissen","Wissen","Lernen & Wissen","prophets"],["alltag","Alltag","Alltag & Gebet","prayer"],["werkzeuge","Werkzeuge","Werkzeuge & Assistenten","zakat"],["persoenlich","Persönlich","Persönlich","saved"],["app","App","App","settings"]];
const themes=[["dark","Klassisch Dunkel","#17241f"],["light","Klassisch Hell","#f8f9f6"],["soft","Sanft Elegant","#f1e9e1"],["salbei","Salbei Elfenbein","#a6bfa7"],["eisgold","Eisgold","#d4e8f1"],["royal","Royal Nachtblau","#162b49"],["dar-al-layl","Dār al-Layl","#18251f"],["bordeaux","Bordeaux Royal","#4d303e"]];
const icons={propheten:"prophets",frauen:"frauen",feed:"quran",quiz:"quiz",topics:"posts",quran:"quran","quran-player":"quran",bibliothek:"library",duas:"dua",scholars:"scholars",books:"library",hadith:"hadith",prayer:"prayer",notifications:"bell",jummah:"jummah",qibla:"compass",calendar:"calendar",zakat:"zakat",wasiyyah:"wasiyyah",saved:"saved",news:"news",settings:"settings",about:"scale",ramadan:"ramadan"};
let chosen="wissen",query="",density="compact",searchOpen=false,accountOpen=false,themeOpen=false,priorFocus=null;
const safe=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icon=(name)=>'<img src="/assets/dar-3d-icons/'+safe(name)+'.png" alt="" loading="lazy" decoding="async">';
const svg=(type)=>{
 if(type==="search")return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/></svg>';
 if(type==="palette")return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3a9 9 0 0 0 0 18h1.6a2.4 2.4 0 0 0 1.8-4 2 2 0 0 1 1.4-3.4H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="11.5" r=".9" fill="currentColor" stroke="none"/><circle cx="10" cy="7.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="7.5" r=".9" fill="currentColor" stroke="none"/></svg>';
 return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M4.8 20c.1-4.1 2.9-6.2 7.2-6.2s7.1 2.1 7.2 6.2"/></svg>';
};
const moreTheme=()=>document.documentElement.getAttribute("data-theme")||"dark";
function render(items,header){
 const data=Array.isArray(items)?items.filter(x=>x&&x.id!=="account"):[];
 if(!categories.some(c=>c[0]===chosen))chosen="wissen";
 const cats=categories.map(c=>'<button class="dm-cat" type="button" data-dm-category="'+c[0]+'" aria-pressed="'+(c[0]===chosen)+'">'+icon(c[3])+'<span>'+safe(c[1])+'</span></button>').join("");
 const groups=categories.map(c=>{
 const matches=data.filter(i=>i.group===c[2]);
 const cards=matches.map(i=>{
  const tag=i.badge?'<span class="dm-badge">'+safe(i.badge)+'</span>':"";
  const val=i.value?' data-value="'+safe(i.value)+'"':"";
  const search=[i.title,i.desc,i.group,i.badge].filter(Boolean).join(" ").toLocaleLowerCase("de");
  return '<button class="dm-card" type="button" data-dm-item="'+safe(i.id)+'" data-nav="'+safe(i.nav)+'"'+val+' data-dm-search="'+safe(search)+'"><span class="dm-cardhead"><span class="dm-cardicon">'+icon(icons[i.id]||"library")+'</span><span class="dm-cardtitle"><strong>'+safe(i.title)+'</strong>'+tag+'</span></span><span class="dm-desc">'+safe(i.desc||"")+'</span></button>';
 }).join("");
 return '<section class="dm-group" data-dm-group="'+c[0]+'"><header class="dm-group-head"><h3>'+safe(c[2])+'</h3><span data-dm-count="'+c[0]+'">'+matches.length+' Funktionen</span></header><div class="dm-grid">'+cards+'</div></section>';
 }).join("");
 const options=themes.map(t=>'<button type="button" class="dm-theme-choice" data-dm-theme="'+t[0]+'" aria-pressed="'+(moreTheme()===t[0])+'"><i style="background:'+t[2]+'"></i><span>'+safe(t[1])+'</span></button>').join("");
 const head=typeof header==="function"?header("Mehr","Funktionen geordnet nach Lernen, Alltag, Werkzeugen und Einstellungen","Mehr"):"";
 return '<section class="'+rootClass+'" data-dm-density="'+density+'">'+head+
 '<div class="dm-actions"><button type="button" class="dm-action" data-dm-search-toggle aria-label="Funktion suchen" aria-expanded="'+searchOpen+'">'+svg("search")+'</button><button type="button" class="dm-action" data-dm-theme-toggle aria-label="Erscheinungsbild auswählen" aria-expanded="'+themeOpen+'">'+svg("palette")+'</button><button type="button" class="dm-action" data-dm-account-toggle aria-label="Konto und Synchronisierung öffnen" aria-expanded="'+accountOpen+'">'+svg("account")+'</button></div>'+
 '<div class="dm-search" '+(searchOpen?'':'hidden')+'><input id="moreFeatureSearch" type="search" placeholder="Funktion suchen…" autocomplete="off" aria-label="Funktion suchen" value="'+safe(query)+'"><button type="button" data-dm-search-close aria-label="Suche schließen">×</button></div>'+
 '<nav class="dm-tabs" aria-label="Bereiche">'+cats+'</nav><div class="dm-groups">'+groups+'</div>'+
 '<div class="dm-theme-backdrop" data-dm-theme-backdrop '+(themeOpen?'':'hidden')+'><section class="dm-theme-sheet" role="dialog" aria-modal="true" aria-labelledby="dmThemeTitle"><div class="dm-handle"></div><div class="dm-sheet-head"><div><small>DĀR AL TAWḤĪD · DESIGN</small><h3 id="dmThemeTitle">Erscheinungsbild</h3><p>Farbwelt wählen – die Inhalte bleiben unverändert.</p></div><button type="button" data-dm-theme-close aria-label="Schließen">×</button></div><div class="dm-theme-list">'+options+'</div><div class="dm-density-head">Darstellung</div><div class="dm-density-row"><button type="button" data-dm-density="compact" aria-pressed="'+(density==="compact")+'">Kompakt</button><button type="button" data-dm-density="comfort" aria-pressed="'+(density==="comfort")+'">Komfort</button></div></section></div></section>';
}
function sync(){
 const root=document.querySelector("."+rootClass);if(!root)return;
 const all=root.querySelectorAll("[data-dm-group]");let total=0;
 all.forEach(group=>{
  const isCategory=group.getAttribute("data-dm-group")===chosen;
  const cards=group.querySelectorAll("[data-dm-item]");let visible=0;
  cards.forEach(card=>{
   const match=!query||String(card.getAttribute("data-dm-search")||"").includes(query.toLocaleLowerCase("de"));
   card.hidden=!match||(!query&&!isCategory);if(match)visible++;
  });
  group.hidden=query?visible===0:!isCategory;
  const cnt=group.querySelector("[data-dm-count]");if(cnt)cnt.textContent=visible+" Funktionen";
  if(query)total+=visible;
 });
 root.querySelectorAll("[data-dm-category]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.getAttribute("data-dm-category")===chosen)));
 const src=root.querySelector("#moreFeatureSearch");if(src&&src.value!==query)src.value=query;
 root.setAttribute("data-dm-density",density);
 root.classList.toggle("dm-searching",!!query);
 document.body.classList.toggle("dm-account-open",accountOpen);
 const acct=root.querySelector("[data-dm-account-toggle]");if(acct)acct.setAttribute("aria-expanded",String(accountOpen));
}
function closeSheet(){
 const b=document.querySelector("."+rootClass+" [data-dm-theme-backdrop]");
 if(!b)return;themeOpen=false;b.hidden=true;
 const btn=document.querySelector("."+rootClass+" [data-dm-theme-toggle]");if(btn){btn.setAttribute("aria-expanded","false");btn.focus();}
 document.body.classList.remove("dm-theme-open");
}
function listen(e){
 const t=e.target&&e.target.closest?e.target.closest("button,[data-dm-theme-backdrop]"):null;
 const root=t&&t.closest("."+rootClass);if(!root)return;
 if(t.matches("[data-dm-theme-backdrop]")){if(e.target===t)closeSheet();return;}
 if(t.hasAttribute("data-dm-category")){chosen=t.getAttribute("data-dm-category");query="";searchOpen=false;const search=root.querySelector(".dm-search");if(search)search.hidden=true;sync();return;}
 if(t.hasAttribute("data-dm-search-toggle")){searchOpen=!searchOpen;const search=root.querySelector(".dm-search");if(search)search.hidden=!searchOpen;t.setAttribute("aria-expanded",String(searchOpen));if(searchOpen)search.querySelector("input")?.focus();else{query="";sync();}return;}
 if(t.hasAttribute("data-dm-search-close")){searchOpen=false;query="";root.querySelector(".dm-search").hidden=true;root.querySelector("[data-dm-search-toggle]")?.setAttribute("aria-expanded","false");sync();return;}
 if(t.hasAttribute("data-dm-account-toggle")){accountOpen=!accountOpen;sync();return;}
 if(t.hasAttribute("data-dm-theme-toggle")){themeOpen=true;const scrim=root.querySelector("[data-dm-theme-backdrop]");if(scrim)scrim.hidden=false;document.body.classList.add("dm-theme-open");t.setAttribute("aria-expanded","true");root.querySelector("[data-dm-theme-close]")?.focus();return;}
 if(t.hasAttribute("data-dm-theme-close")){closeSheet();return;}
 if(t.hasAttribute("data-dm-density")){density=t.getAttribute("data-dm-density")==="comfort"?"comfort":"compact";sync();root.querySelectorAll("[data-dm-density]").forEach(x=>x.setAttribute("aria-pressed",String(x.getAttribute("data-dm-density")===density)));return;}
 if(t.hasAttribute("data-dm-theme")){const v=t.getAttribute("data-dm-theme");if(themes.some(x=>x[0]===v)&&typeof window.applyTheme==="function"){window.applyTheme(v);root.querySelectorAll("[data-dm-theme]").forEach(x=>x.setAttribute("aria-pressed",String(x.getAttribute("data-dm-theme")===v)));}return;}
}
document.addEventListener("click",listen);
document.addEventListener("input",function(e){if(e.target?.id!=="moreFeatureSearch"||!e.target.closest("."+rootClass))return;query=e.target.value.trim().toLocaleLowerCase("de");sync();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&themeOpen){e.preventDefault();closeSheet();}});
const obs=new MutationObserver(()=>{const root=document.querySelector("."+rootClass);if(root&&root!==obs.last){obs.last=root;sync();}});
document.addEventListener("DOMContentLoaded",function(){const x=document.getElementById("appView");if(x)obs.observe(x,{childList:true,subtree:false});sync();});
window.DAR_MORE_V15={render,version:"1.5",sync};
})();