/* DAR Mehr V1.5 | shared functional UI; scoped to the adult Mehr view only. */
(function(){
"use strict";
/* One shared, cache-versioned nine-language picker. */
if(!window.DARAdultLanguagePickerV1&&!window.__DAR_LANGUAGE_PICKER_LOADING){
 window.__DAR_LANGUAGE_PICKER_LOADING=true;
 const picker=document.createElement("script");
 picker.src="/assets/i18n/adult-language-picker-v1.js?v=20261022-01";
 picker.async=true;
 picker.onerror=()=>{window.__DAR_LANGUAGE_PICKER_LOADING=false};
 (document.head||document.documentElement).appendChild(picker);
}

/* Shared adult TEST language runtime. No production, Kids, API or paid model access. */
if(/^\/test(?:\/|$)/.test(location.pathname)&&!/^\/test\/kids(?:\/|$)/.test(location.pathname)
    &&!window.__DAR_TEST_TR_UI_SCRIPT_LOADING){
 window.__DAR_TEST_TR_UI_SCRIPT_LOADING=true;
 const trScript=document.createElement("script");
 trScript.src="/test/assets/dar-test-turkish-ui.js?v=20261024-ui-more-35";
 trScript.async=true;
 trScript.onerror=()=>{window.__DAR_TEST_TR_UI_SCRIPT_LOADING=false};
 (document.head||document.documentElement).appendChild(trScript);
}

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

/* Cross-promotion is an editorial section of the App tab, not a navigation feature.
   The pictures below are real project artwork shown inside device illustrations;
   do not label them as captured App Store screenshots. */
function renderOurApps(){
 const appleUA=String(navigator.userAgent||"");
 const appleMobile=/(?:iPhone|iPad|iPod|DarAlTawhid-iOS|DarAlTawhidOfficialIOS)/i.test(appleUA)||(/Macintosh/i.test(appleUA)&&Number(navigator.maxTouchPoints||0)>1);
 // Apple publishes iPhone and tvOS under a single product ID; iOS product deep links open the phone app.
 // On iPhone/iPad use the verified official developer storefront listing (including Apple TV), not the shared product deep link.
 const tvStoreHref=appleMobile?"https://apps.apple.com/de/developer/serhat-akter/id6805988755":"https://apps.apple.com/de/app/d%C4%81r-al-taw%E1%B8%A5%C4%ABd/id6805988753?platform=tv";
 const asset="/assets/promo/mehr-apps-reference-20261017.jpg";
 return `<section class="dm-app-showcase dm-exact-promo" data-dm-app-promo data-dm-search="apps apple tv fernseher kids tawhid kinder iphone ipad familie verfügbar bald entdecken" aria-label="Weitere DĀR AL TAWḤĪD Apps">
 <header class="dm-showcase-head"><span class="dm-showcase-kicker">DĀR AL TAWḤĪD · UNSERE APPS</span><h4>Wissen auf jedem Bildschirm.</h4><p>Entdecke unsere Angebote für das Wohnzimmer und die ganze Familie.</p></header>
 <div class="dm-exact-stack">
 <article class="dm-exact-card dm-exact-apple" aria-label="DĀR AL TAWḤĪD für Apple TV – jetzt verfügbar">
  <img src="${asset}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="864" height="1536">
  <p class="dm-exact-sr">DĀR AL TAWḤĪD für Apple TV – jetzt verfügbar. Qurʾān, Sunnah und Āṯār am großen Bildschirm.</p>
  <a href="${tvStoreHref}" class="dm-exact-action dm-exact-apple-action" target="_blank" rel="noopener noreferrer" aria-label="DĀR AL TAWḤĪD auf Apple TV im App Store ansehen"><span class="dm-exact-sr">Im App Store ansehen</span></a>
 </article>
 <article class="dm-exact-card dm-exact-kids" aria-label="TAWḤĪD KIDS – iPhone-App in Vorbereitung">
  <img src="${asset}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="864" height="1536">
  <p class="dm-exact-sr">TAWḤĪD KIDS. Die iPhone-App ist noch nicht veröffentlicht. Demnächst verfügbar. Keine Verlinkung oder Installation.</p>
  <button type="button" class="dm-exact-action dm-exact-kids-locked" disabled aria-label="TAWḤĪD KIDS ist noch nicht verfügbar"><span class="dm-exact-sr">Demnächst verfügbar</span></button>
 </article>
 </div>
 <p class="dm-showcase-footnote">Gerätedarstellungen mit Werbemotiven aus unserer Vorschau. Keine App-Store-Screenshots.</p><a class="dm-i18n-reader-link" href="/test/i18n/?post=hasan-al-basri-selbstpruefung-20261021-481">Sprachfassung prüfen · DAR TEST</a>
 </section>`;
}

const localeKey="darAdultPreferredLocaleV1";
const localeChoicesList=[["de","Deutsch"],["tr","Türkçe"],["en","English"],["ar","العربية"],["ku","Kurmancî"],["ckb","سۆرانی"],["bs","Bosanski"],["fr","Français"],["es","Español"]];
const localeCodes=new Set(localeChoicesList.map(x=>x[0]));
function currentLocale(){try{return localeCodes.has(localStorage.getItem(localeKey))?localStorage.getItem(localeKey):"de"}catch(_){return"de"}}
function setLocale(code){if(!localeCodes.has(code))return;try{localStorage.setItem(localeKey,code)}catch(_){}window.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code}}));sync();}
function localeChoices(){
 return '<section data-dar-language-entry="quick" class="dal-entry dal-entry-quick" aria-label="Sprache wählen"></section>';
}
function ensureLocaleCss(){
 if(document.getElementById("dar-test-more-locale-css"))return;
 const el=document.createElement("style");el.id="dar-test-more-locale-css";
 el.textContent='.dar-more-v15 .dm-i18n-reader-link{color:var(--gold,#d4b978);display:inline-flex;align-items:center;min-height:42px;font:650 12px system-ui,-apple-system,sans-serif;padding:7px 0;text-underline-offset:4px}.dar-more-v15 .dm-locale{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:12px 0;padding:12px 2px;border-block:1px solid color-mix(in srgb,currentColor 18%,transparent);color:inherit}.dm-locale-copy{display:grid;gap:5px;flex:1 1 170px}.dm-locale-copy strong{font-size:14px}.dm-locale-copy small{font-size:11px;opacity:.79;line-height:1.4}.dm-locale-choices{display:flex;gap:7px}.dar-more-v15 .dm-locale-choices button{min-height:42px;padding:9px 14px;border:1px solid color-mix(in srgb,currentColor 26%,transparent);border-radius:999px;color:inherit;background:transparent;font:600 12px system-ui,-apple-system,sans-serif;cursor:pointer}.dar-more-v15 .dm-locale-choices button[aria-pressed="true"]{border-color:var(--accent-gold,#bba273);background:color-mix(in srgb,var(--accent-gold,#bba273) 13%,transparent)}.dar-more-v15 .dm-locale-choices button:focus-visible{outline:2px solid var(--accent-gold,#bba273);outline-offset:3px}';
 document.head.append(el);
}
const moreTheme=()=>document.documentElement.getAttribute("data-theme")||"dark";
function render(items,header){
 ensureLocaleCss();
 const data=Array.isArray(items)?items.filter(x=>x&&x.id!=="account"&&x.id!=="about"):[];
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
 return '<section class="dm-group" data-dm-group="'+c[0]+'"><header class="dm-group-head"><h3>'+safe(c[2])+'</h3><span data-dm-count="'+c[0]+'">'+matches.length+' Funktionen</span></header><div class="dm-grid">'+cards+'</div>'+(c[0]==="app"?renderOurApps():"")+'</section>';
 }).join("");
 const options=themes.map(t=>'<button type="button" class="dm-theme-choice" data-dm-theme="'+t[0]+'" aria-pressed="'+(moreTheme()===t[0])+'"><i style="background:'+t[2]+'"></i><span>'+safe(t[1])+'</span></button>').join("");
 const head=typeof header==="function"?header("Mehr","Funktionen geordnet nach Lernen, Alltag, Werkzeugen und Einstellungen","Mehr"):"";
 return '<section class="'+rootClass+'" data-dm-density="'+density+'">'+head+
 '<div class="dm-actions"><button type="button" class="dm-action" data-dm-search-toggle aria-label="Funktion suchen" aria-expanded="'+searchOpen+'">'+svg("search")+'</button><button type="button" class="dm-action" data-dm-theme-toggle aria-label="Erscheinungsbild in Einstellungen öffnen" aria-expanded="'+themeOpen+'">'+svg("palette")+'</button><button type="button" class="dm-action" data-dm-account-toggle aria-label="Konto und Synchronisierung öffnen" aria-expanded="'+accountOpen+'">'+svg("account")+'</button></div>'+
 '<div class="dm-search" '+(searchOpen?'':'hidden')+'><input id="moreFeatureSearch" type="search" placeholder="Funktion suchen…" autocomplete="off" aria-label="Funktion suchen" value="'+safe(query)+'"><button type="button" data-dm-search-close aria-label="Suche schließen">×</button></div>'+
 localeChoices()+
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
  const promo=group.querySelector("[data-dm-app-promo]");
  if(promo){
   const match=!query||String(promo.getAttribute("data-dm-search")||"").includes(query.toLocaleLowerCase("de"));
   promo.hidden=!!query&&!match;
   if(match&&query)visible++;
  }
  group.hidden=query?visible===0:!isCategory;
  const cnt=group.querySelector("[data-dm-count]");if(cnt)cnt.textContent=visible+" Funktionen";
  if(query)total+=visible;
 });
 root.querySelectorAll("[data-dm-category]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.getAttribute("data-dm-category")===chosen)));
 root.querySelectorAll("[data-dm-locale]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.dmLocale===currentLocale())));
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
 if(t.hasAttribute("data-dm-locale")){setLocale(t.dataset.dmLocale);return;}
 if(t.hasAttribute("data-dm-category")){chosen=t.getAttribute("data-dm-category");query="";searchOpen=false;const search=root.querySelector(".dm-search");if(search)search.hidden=true;sync();return;}
 if(t.hasAttribute("data-dm-search-toggle")){searchOpen=!searchOpen;const search=root.querySelector(".dm-search");if(search)search.hidden=!searchOpen;t.setAttribute("aria-expanded",String(searchOpen));if(searchOpen)search.querySelector("input")?.focus();else{query="";sync();}return;}
 if(t.hasAttribute("data-dm-search-close")){searchOpen=false;query="";root.querySelector(".dm-search").hidden=true;root.querySelector("[data-dm-search-toggle]")?.setAttribute("aria-expanded","false");sync();return;}
 if(t.hasAttribute("data-dm-account-toggle")){accountOpen=!accountOpen;sync();return;}
 if(t.hasAttribute("data-dm-theme-toggle")){if(typeof window.navigate==="function")window.navigate("settings","appearance");else location.hash="#settings/appearance";return;}
 if(t.hasAttribute("data-dm-theme-close")){closeSheet();return;}
 if(t.hasAttribute("data-dm-density")){density=t.getAttribute("data-dm-density")==="comfort"?"comfort":"compact";sync();root.querySelectorAll("[data-dm-density]").forEach(x=>x.setAttribute("aria-pressed",String(x.getAttribute("data-dm-density")===density)));return;}
 if(t.hasAttribute("data-dm-theme")){const v=t.getAttribute("data-dm-theme");if(themes.some(x=>x[0]===v)&&typeof window.applyTheme==="function"){window.applyTheme(v);root.querySelectorAll("[data-dm-theme]").forEach(x=>x.setAttribute("aria-pressed",String(x.getAttribute("data-dm-theme")===v)));}return;}
}
document.addEventListener("click",listen);
window.addEventListener("dar-adult-locale-changed",sync);
document.addEventListener("input",function(e){if(e.target?.id!=="moreFeatureSearch"||!e.target.closest("."+rootClass))return;query=e.target.value.trim().toLocaleLowerCase("de");sync();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&themeOpen){e.preventDefault();closeSheet();}});
const obs=new MutationObserver(()=>{const root=document.querySelector("."+rootClass);if(root&&root!==obs.last){obs.last=root;sync();}});
document.addEventListener("DOMContentLoaded",function(){const x=document.getElementById("appView");if(x)obs.observe(x,{childList:true,subtree:false});sync();});
window.DAR_MORE_V15={render,version:"1.5",sync};
})();