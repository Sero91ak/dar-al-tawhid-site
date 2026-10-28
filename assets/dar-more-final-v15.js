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
 var promo=byId("dm15AppsPromo");
 var promoVisible=!!(searched?"apple tv fernseher kids tawhid kinder iphone ipad familie apps bildschirm".includes(searched):state.group==="App");
 if(promo)promo.hidden=!promoVisible;
 var grid=byId("dm15Grid");if(grid)grid.innerHTML=shown.length?shown.map(featureCard).join(""):(promoVisible?"":'<p class="dm15-empty">Keine Funktion gefunden.</p>');
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
function renderOurApps(){
 const appleUA=String(navigator.userAgent||"");
 const appleMobile=/(?:iPhone|iPad|iPod|DarAlTawhid-iOS|DarAlTawhidOfficialIOS)/i.test(appleUA)||(/Macintosh/i.test(appleUA)&&Number(navigator.maxTouchPoints||0)>1);
 // Same App Store product ID for iOS and tvOS: the direct product link may launch the installed iOS app.
 const tvStoreHref=appleMobile?"https://apps.apple.com/de/developer/serhat-akter/id6805988755":"https://apps.apple.com/de/app/d%C4%81r-al-taw%E1%B8%A5%C4%ABd/id6805988753?platform=tv";
 const asset="/assets/promo/mehr-apps-reference-20261017.jpg?v=mehr-promo-crop-20261028";
 return `<section id="dm15AppsPromo" class="dm-app-showcase dm-exact-promo" data-promo-crop-lock="v20261028" style="box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important;" data-dm-app-promo data-dm-search="apps apple tv fernseher kids tawhid kinder iphone ipad familie verfügbar bald entdecken" aria-label="Weitere DĀR AL TAWḤĪD Apps">
 <header class="dm-showcase-head"><span class="dm-showcase-kicker">DĀR AL TAWḤĪD · UNSERE APPS</span><h4>Wissen auf jedem Bildschirm.</h4><p>Entdecke unsere Angebote für das Wohnzimmer und die ganze Familie.</p></header>
 <div class="dm-exact-stack" style="box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;width:100%!important;max-width:100%!important;min-width:0!important;">
 <article class="dm-exact-card dm-exact-apple" style="box-sizing:border-box!important;position:relative!important;display:block!important;isolation:isolate!important;overflow:hidden!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;max-height:none!important;padding:0!important;margin:0!important;border:0!important;border-radius:clamp(14px,3vw,30px)!important;box-shadow:0 8px 26px rgba(0,0,0,.14)!important;aspect-ratio:808/376!important;" aria-label="DĀR AL TAWḤĪD für Apple TV – jetzt verfügbar">
  <img src="${asset}" style="position:absolute!important;display:block!important;left:-3.465347%!important;width:106.930693%!important;height:auto!important;max-width:none!important;max-height:none!important;min-width:0!important;border:0!important;border-radius:0!important;object-fit:unset!important;object-position:unset!important;pointer-events:none!important;top:-128.191489%!important;" alt="" aria-hidden="true" loading="lazy" decoding="async" width="864" height="1536">
  <p class="dm-exact-sr">DĀR AL TAWḤĪD für Apple TV – jetzt verfügbar. Qurʾān, Sunnah und Āṯār am großen Bildschirm.</p>
  <a href="${tvStoreHref}" class="dm-exact-action dm-exact-apple-action" style="position:absolute!important;z-index:10!important;display:block!important;left:0!important;top:0!important;width:100%!important;height:100%!important;min-width:0!important;padding:0!important;border:0!important;background:transparent!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(249,224,178,.23)!important;" target="_blank" rel="noopener noreferrer" aria-label="DĀR AL TAWḤĪD auf Apple TV im App Store ansehen"><span class="dm-exact-sr">Im App Store ansehen</span></a>
 </article>
 <article class="dm-exact-card dm-exact-kids" style="box-sizing:border-box!important;position:relative!important;display:block!important;isolation:isolate!important;overflow:hidden!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;max-height:none!important;padding:0!important;margin:0!important;border:0!important;border-radius:clamp(14px,3vw,30px)!important;box-shadow:0 8px 26px rgba(0,0,0,.14)!important;aspect-ratio:808/393!important;" aria-label="TAWḤĪD KIDS – iPhone-App in Vorbereitung">
  <img src="${asset}" style="position:absolute!important;display:block!important;left:-3.465347%!important;width:106.930693%!important;height:auto!important;max-width:none!important;max-height:none!important;min-width:0!important;border:0!important;border-radius:0!important;object-fit:unset!important;object-position:unset!important;pointer-events:none!important;top:-222.137405%!important;" alt="" aria-hidden="true" loading="lazy" decoding="async" width="864" height="1536">
  <p class="dm-exact-sr">TAWḤĪD KIDS. Die iPhone-App ist noch nicht veröffentlicht. Demnächst verfügbar. Keine Verlinkung oder Installation.</p>
  <button type="button" class="dm-exact-action dm-exact-kids-locked" disabled aria-label="TAWḤĪD KIDS ist noch nicht verfügbar"><span class="dm-exact-sr">Demnächst verfügbar</span></button>
 </article>
 </div>
 <p class="dm-showcase-footnote">Gerätedarstellungen mit Werbemotiven aus unserer Vorschau. Keine App-Store-Screenshots.</p>
 </section>`;
}

var darCrossPromo = renderOurApps();
function render(items,api){
 state.items=Array.isArray(items)?items.filter(function(item){return item&&item.id!=="notifications"&&item.id!=="about"}):[];
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
 darCrossPromo+
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
  closeOverlays();if(state.api&&typeof state.api.navigate==="function")state.api.navigate("settings","appearance");return;
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