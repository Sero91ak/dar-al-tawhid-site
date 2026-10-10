/* DĀR AL TAWḤĪD · Mehr V1.5 approved shared adult app UI.
   Render-only adapter for the existing featureCatalog / navigate / applyTheme APIs.
   The global footer and native bottom navigation remain the originals. */
(function(){
"use strict";
if(window.DARMoreFinalV15)return;
var categories=[["Lernen & Wissen","Wissen","prophets.png"],["Alltag & Gebet","Alltag","prayer.png"],["Werkzeuge & Assistenten","Werkzeuge","zakat.png"],["Persönlich","Persönlich","saved.png"],["App","App","settings.png"]];
var themes=[["light","Hell"],["soft","Sanft Elegant"],["salbei","Salbei Elfenbein"],["eisgold","Eisgold"],["dark","Klassisch Dunkel"],["royal","Royal Nachtblau"],["dar-al-layl","Dār al-Layl"],["bordeaux","Bordeaux Royal Premium"]];
var ico={"propheten":"prophets.png","frauen":"frauen.png","feed":"quran.png","quiz":"quiz.png","topics":"posts.png","quran":"quran.png","bibliothek":"library.png","quran-player":"quran.png","duas":"dua.png","scholars":"scholars.png","books":"library.png","hadith":"hadith.png","prayer":"prayer.png","notifications":"bell.png","jummah":"jummah.png","qibla":"compass.png","calendar":"calendar.png","zakat":"zakat.png","wasiyyah":"wasiyyah.png","saved":"saved.png","account":"saved.png","news":"news.png","settings":"settings.png","about":"scale.png","ramadan":"ramadan.png"};
var state={group:"Lernen & Wissen",search:"",density:"compact",items:[],api:null};
var escapeHtml=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var icon=function(s){return '<img loading="lazy" decoding="async" alt="" src="/assets/dar-3d-icons/'+escapeHtml(s)+'">'};
var palette='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 0 0 0 18h1.6a2.4 2.4 0 0 0 1.8-4c-.4-.4-.6-.9-.6-1.4a2 2 0 0 1 2-2H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="11.5" r=".9" fill="currentColor" stroke="none"/><circle cx="10" cy="7.5" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="7.5" r=".9" fill="currentColor" stroke="none"/><circle cx="17.7" cy="11" r=".9" fill="currentColor" stroke="none"/></svg>';
var searchSvg='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.6" cy="10.6" r="6.4"/><path d="m16 16 5 5"/></svg>';
var accountSvg='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.8 20c.1-4.1 2.9-6.2 7.2-6.2s7.1 2.1 7.2 6.2"/></svg>';
var byId=function(id){return document.getElementById(id)};
function featureCard(item){
 var id=escapeHtml(item.id||item.nav||"");
 var name=escapeHtml(item.title);
 var badge=item.badge?'<span class="dm15-badge">'+escapeHtml(item.badge)+'</span>':"";
 var art=icon(ico[item.id]||ico[item.nav]||"library.png");
 return '<button class="dm15-feature" data-dm15-open="'+id+'" type="button"><span class="dm15-row"><span class="dm15-glyph">'+art+'</span><span class="dm15-identity"><strong class="dm15-name">'+name+'</strong>'+badge+'</span></span><span class="dm15-description">'+escapeHtml(item.desc||"")+'</span></button>';
}
function draw(){
 var root=byId("darMoreFinalV15");if(!root)return;
 var searched=state.search.trim().toLocaleLowerCase("de");
 var group=categories.find(function(c){return c[0]===state.group})||categories[0];
 var shown=state.items.filter(function(item){return searched?([item.title,item.desc,item.badge,item.group].join(" ").toLocaleLowerCase("de").includes(searched)):item.group===state.group});
 var nav=byId("dm15Categories");
 if(nav)nav.innerHTML=categories.map(function(c){return '<button type="button" data-dm15-category="'+escapeHtml(c[0])+'" class="dm15-category'+(state.group===c[0]&&!searched?" is-current":"")+'" aria-pressed="'+(state.group===c[0]&&!searched)+'">'+icon(c[2])+'<span>'+escapeHtml(c[1])+'</span></button>'}).join("");
 var title=byId("dm15GroupName");if(title)title.textContent=searched?"Suchergebnisse":group[0];
 var count=byId("dm15Count");if(count)count.textContent=shown.length+" Funktionen";
 var grid=byId("dm15Grid");if(grid)grid.innerHTML=shown.length?shown.map(featureCard).join(""):'<p class="dm15-empty">Keine Funktion gefunden.</p>';
}
function closeTheme(){
 var o=byId("dm15ThemeSheet");if(o)o.hidden=true;
 var b=byId("dm15ThemeButton");if(b)b.setAttribute("aria-expanded","false");
 document.body.classList.remove("dm15-theme-open");
}
function closeSearch(){
 var el=byId("dm15SearchPanel");if(el)el.hidden=true;
 var b=byId("dm15SearchButton");if(b)b.setAttribute("aria-expanded","false");
 var input=byId("moreFeatureSearch");if(input)input.value="";
 state.search="";draw();
}
function closeAccount(){
 var el=byId("dm15AccountPanel");if(el)el.hidden=true;
 var b=byId("dm15AccountButton");if(b)b.setAttribute("aria-expanded","false");
}
function closeOverlays(){closeTheme();closeSearch();closeAccount()}
function themeButtons(){
 var name=state.api&&state.api.getTheme?state.api.getTheme():"dark";
 return themes.map(function(pair){
   return '<button type="button" class="dm15-theme" data-dm15-theme="'+escapeHtml(pair[0])+'" aria-pressed="'+(name===pair[0])+'"><span class="dm15-swatch dm15-swatch-'+escapeHtml(pair[0])+'"></span><span>'+escapeHtml(pair[1])+'</span>'+(name===pair[0]?'<b aria-hidden="true">✓</b>':'')+'</button>';
 }).join("");
}
var tastaturCard="<a class=\"dm15-tastatur-feature\" href=\"/tastatur/\" aria-label=\"Kostenlose arabische Textersetzungen – 565 Kürzel, Arabisch und Lautschrift\"><span class=\"dm15-tastatur-medallion\" aria-hidden=\"true\">﷽</span><span class=\"dm15-tastatur-copy\"><span class=\"dm15-tastatur-eyebrow\">NEU · KOSTENLOSE BIBLIOTHEK</span><strong>Arabische Textersetzungen</strong><small>565 Kürzel · Arabisch &amp; Lautschrift · Apple &amp; Android</small></span><span class=\"dm15-tastatur-cta\">Entdecken ↗</span></a>";
function render(items,api){
 state.items=Array.isArray(items)?items.slice():[];
 state.api=api||{};
 var savedGroup=state.group;
 if(!categories.some(function(c){return c[0]===savedGroup}))state.group=categories[0][0];
 requestAnimationFrame(draw);
 return '<section class="dm15-shell" id="darMoreFinalV15" data-density="'+state.density+'" aria-label="Mehr">'+
 '<header class="dm15-head"><div class="dm15-copy"><div class="dm15-eyebrow">MEHR</div><h1>Mehr</h1><p>Funktionen geordnet nach Lernen, Alltag, Werkzeugen und Einstellungen</p></div>'+
 '<div class="dm15-actions">'+
 '<button type="button" id="dm15SearchButton" class="dm15-circle" aria-label="Funktion suchen" aria-controls="dm15SearchPanel" aria-expanded="false">'+searchSvg+'</button>'+
 '<button type="button" id="dm15ThemeButton" class="dm15-circle" aria-label="Erscheinungsbild" aria-expanded="false" aria-controls="dm15ThemeSheet">'+palette+'</button>'+
 '<button type="button" id="dm15AccountButton" class="dm15-circle" aria-label="Konto und Synchronisierung" aria-expanded="false" aria-controls="dm15AccountPanel">'+accountSvg+'</button></div></header>'+
 '<div id="dm15SearchPanel" class="dm15-panel dm15-search" hidden><input id="moreFeatureSearch" type="search" placeholder="Funktion suchen…" autocomplete="off" aria-label="Funktion suchen"><button data-dm15-close-search type="button" aria-label="Suche schließen">×</button></div>'+
 '<div id="dm15AccountPanel" class="dm15-panel dm15-account" hidden><b>Konto & Synchronisierung</b><p>Die App bleibt auch ohne Konto nutzbar. Daten auf allen Geräten sichern.</p><div><button type="button" data-dm15-go-account>Mein Bereich</button><button type="button" data-dm15-go-account>Am Konto anmelden</button></div></div>'+
 tastaturCard+
 '<nav id="dm15Categories" class="dm15-categories" aria-label="Funktionsbereiche"></nav>'+
 '<div class="dm15-results"><div class="dm15-results-head"><h2 id="dm15GroupName"></h2><span id="dm15Count"></span></div><div class="dm15-grid" id="dm15Grid"></div></div>'+
 '<div class="dm15-scrim" id="dm15ThemeSheet" hidden><section class="dm15-sheet" role="dialog" aria-modal="true" aria-label="Erscheinungsbild wählen"><div class="dm15-handle"></div><div class="dm15-sheethead"><div><small>DĀR AL TAWḤĪD · DESIGN</small><h2>Erscheinungsbild</h2><p>Farbe und Darstellung wählen.</p></div><button type="button" data-dm15-close-theme aria-label="Schließen">×</button></div><div class="dm15-theme-list" id="dm15Themes">'+themeButtons()+'</div><h3>Darstellung</h3><div class="dm15-density"><button type="button" data-dm15-density="compact" aria-pressed="'+(state.density==="compact")+'">Kompakt</button><button type="button" data-dm15-density="comfort" aria-pressed="'+(state.density==="comfort")+'">Komfort</button></div></section></div></section>';
}
function handleClick(e){
 if(!document.body.classList.contains("is-more-route"))return;
 var t=e.target&&e.target.closest?e.target.closest("button,[data-dm15-close-theme]"):null;if(!t)return;
 var id=t.id||"";
 if(id==="dm15SearchButton"){
  closeTheme();closeAccount();var s=byId("dm15SearchPanel");if(s){var open=s.hidden;s.hidden=!open;t.setAttribute("aria-expanded",String(open));if(open){var input=byId("moreFeatureSearch");if(input)input.focus()}}return;
 }
 if(id==="dm15ThemeButton"){
  closeAccount();if(!byId("dm15SearchPanel")?.hidden)closeSearch();
  var sheet=byId("dm15ThemeSheet");if(sheet){var open=sheet.hidden;sheet.hidden=!open;t.setAttribute("aria-expanded",String(open));document.body.classList.toggle("dm15-theme-open",open)}return;
 }
 if(id==="dm15AccountButton"){
  closeTheme();if(!byId("dm15SearchPanel")?.hidden)closeSearch();
  var account=byId("dm15AccountPanel");if(account){var open=account.hidden;account.hidden=!open;t.setAttribute("aria-expanded",String(open))}return;
 }
 if(t.hasAttribute("data-dm15-close-search")){closeSearch();return}
 if(t.hasAttribute("data-dm15-close-theme")){closeTheme();return}
 if(t.hasAttribute("data-dm15-go-account")){closeOverlays();if(state.api?.navigate)state.api.navigate("account");return}
 var category=t.getAttribute("data-dm15-category");
 if(category){state.group=category;state.search="";var input=byId("moreFeatureSearch");if(input)input.value="";draw();return}
 var feature=t.getAttribute("data-dm15-open");
 if(feature){var item=state.items.find(function(x){return (x.id||x.nav)===feature});if(item&&state.api?.navigate){closeOverlays();state.api.navigate(item.nav,item.value||"")}return}
 var theme=t.getAttribute("data-dm15-theme");
 if(theme){if(themes.some(function(pair){return pair[0]===theme})&&state.api?.applyTheme){state.api.applyTheme(theme);var list=byId("dm15Themes");if(list)list.innerHTML=themeButtons()}return}
 var density=t.getAttribute("data-dm15-density");
 if(density==="compact"||density==="comfort"){state.density=density;var root=byId("darMoreFinalV15");if(root)root.setAttribute("data-density",density);document.querySelectorAll("[data-dm15-density]").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-dm15-density")===density))})}
}
document.addEventListener("click",handleClick);
document.addEventListener("input",function(e){if(e.target&&e.target.id==="moreFeatureSearch"){state.search=e.target.value||"";draw()}});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&document.body.classList.contains("is-more-route"))closeOverlays()});
document.addEventListener("click",function(e){if(e.target&&e.target.id==="dm15ThemeSheet")closeTheme()});
window.DARMoreFinalV15={render:render,draw:draw,closeOverlays:closeOverlays};
})();