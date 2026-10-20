/* DĀR AL TAWḤĪD · Test Home HTML-V3 visual parity.
 * Render a SINGLE preview-matched home. Preserve native routes, prayer feed,
 * fuzzy search, saved theme settings, and the existing bottom navigation.
 * Isolated to /test, never /kids or public visitor.
 */
(function(){
"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__darHomeHtmlParityV1)return;
window.__darHomeHtmlParityV1=true;
var ID="darHomeHtmlParityV1", pending=false, lastItems="", inputTimer=null, clock=0;
var quicks=[
 ["qibla","🧭","Qibla"],["theme","◐","Design"],
 ["settings","⚙","Einstellungen"],["library","▦","Bibliothek"]
];
var links=[
 ["frauen","✿","Frauen","Wissen & Fiqh"],["hadith","▤","Ḥadīṯ-Werke","Sammlungen"],
 ["books","▦","Bibliothek","Bücher & PDFs"],["scholars","♧","Gelehrte","Biografien"],
 ["books","⌘","Quellen","Nachweise"],["duas","☾","Duʿāʾ","Bittgebete"],
 ["topics","◇","ʿAqīdah","Grundlagen"],["quran","☪","Qurʾān","Lesen & hören"],
 ["quiz","✧","Quiz","Wissen prüfen"]
];
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(z){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[z]})}
function route(dest,val){if(dest==="library"){var el=document.getElementById("dhpLibrary");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return}
 try{if(typeof window.navigate==="function"){window.navigate(dest,val||"");return}}catch(e){}
 try{if(typeof navigate==="function"){navigate(dest,val||"");return}}catch(e){}
 location.hash="#"+dest+(val?"/"+encodeURIComponent(val):"");
}
function nativeText(node,query){var el=node&&node.querySelector(query);return el?String(el.textContent||"").replace(/\s+/g," ").trim():""}
function html(){
 var q=quicks.map(function(a){return '<button type="button" class="dhp-quick" data-dhp-route="'+a[0]+'"><span aria-hidden="true">'+a[1]+'</span>'+a[2]+'</button>'}).join("");
 var l=links.map(function(a){return '<button type="button" class="dhp-library-tile" data-dhp-route="'+a[0]+'"><span aria-hidden="true">'+a[1]+'</span><b>'+a[2]+'</b><small>'+a[3]+'</small></button>'}).join("");
 return '<div class="dhp-content">'+
  '<div class="dhp-kicker">BEITRÄGE NACH QURʾĀN, SUNNAH &amp; ĀTHĀR</div>'+
  '<div class="dhp-brand"><div class="dhp-seal" id="dhpBrandSeal">د</div><div><h1>DĀR AL TAWḤĪD</h1><small>Wissen · Überlieferung · Erkenntnis</small></div></div>'+
  '<button type="button" class="dhp-prayer" data-dhp-route="prayer" aria-label="Gebetszeiten öffnen"><div class="dhp-prayer-top"><div><div class="dhp-kicker">NÄCHSTES GEBET</div><b id="dhpPrayerName">Gebetszeiten</b><div class="dhp-tiny dhp-muted">Standortabhängige Gebetszeiten</div></div><div class="dhp-prayer-right"><div class="dhp-clock" id="dhpPrayerClock">–</div><div class="dhp-tiny dhp-muted" id="dhpPrayerRemain"></div></div></div><div class="dhp-prayer-footer"><span id="dhpPrayerDate">Gebetskalender</span><span id="dhpPrayerHijri"></span><span id="dhpPrayerPlace">Standort</span></div></button>'+
  '<h2 class="dhp-greeting">As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh</h2>'+
  '<p class="dhp-intro">Willkommen bei <strong>DĀR AL TAWḤĪD</strong> – einer geordneten Wissens-App mit Beiträgen aus Qurʾān, Sunnah und den Überlieferungen der Salaf.</p>'+
  '<div class="dhp-quickbar" aria-label="Schnellzugriffe">'+q+'</div>'+
  '<div class="dhp-search-box"><label class="dhp-search" for="dhpSearch"><span aria-hidden="true" class="dhp-search-icon">⌕</span><input id="dhpSearch" type="search" autocomplete="off" spellcheck="false" placeholder="Wissen, Qurʾān, Ḥadīṯ, Themen suchen …" aria-label="Intelligente Suche"><button type="button" id="dhpSearchClear" aria-label="Suche leeren">×</button></label><div id="dhpResults" class="dhp-results" hidden role="listbox"></div></div>'+
  '<section class="dhp-section" aria-labelledby="dhpQTitle"><div class="dhp-head"><h2 id="dhpQTitle">Dein Qurʾān</h2><button type="button" data-dhp-route="quran">Öffnen ↗</button></div><button type="button" class="dhp-panel dhp-resume" data-dhp-route="quran"><div><span class="dhp-kicker">WEITERLESEN</span><h3 id="dhpQResume">Deinen Lesefortschritt fortsetzen</h3><p>Qurʾān lesen · hören · weiterlernen</p></div><span class="dhp-arrow" aria-hidden="true">→</span></button></section>'+
  '<section class="dhp-section" aria-labelledby="dhpTodayTitle"><div class="dhp-head"><h2 id="dhpTodayTitle">Heute für dich</h2><span class="dhp-tiny dhp-muted">Tägliche Impulse</span></div><div class="dhp-two"><button type="button" class="dhp-panel dhp-smallcard" data-dhp-route="recent" id="dhpTodayArticle"><span class="dhp-kicker">EMPFEHLUNG</span><h3 id="dhpTodayName">Wissen vertiefen</h3><p>Ein ausgewählter Beitrag aus der App.</p></button><button type="button" class="dhp-panel dhp-smallcard" data-dhp-route="duas"><span class="dhp-kicker">DUʿĀʾ</span><h3>Bittgebet des Tages</h3><p>Mit Quellen und direktem Zugang.</p></button></div></section>'+
  '<section class="dhp-section" aria-labelledby="dhpPostsTitle"><div class="dhp-head"><h2 id="dhpPostsTitle">Neueste Veröffentlichungen</h2><button type="button" data-dhp-route="recent">Alle ansehen ↗</button></div><div id="dhpPosts" class="dhp-posts"><button type="button" class="dhp-panel dhp-feature" data-dhp-route="recent"><span class="dhp-kicker">VERÖFFENTLICHUNGEN</span><h3>Neueste Beiträge öffnen</h3><p>Aktuelle Veröffentlichungen direkt aus der App.</p><span class="dhp-link">Alle lesen →</span></button></div></section>'+
  '<section class="dhp-section" id="dhpPopular" hidden aria-labelledby="dhpPopularTitle"><div class="dhp-head"><h2 id="dhpPopularTitle">Meist gelesen</h2><button type="button" data-dhp-route="recent">Alle ansehen ↗</button></div><div id="dhpPopularList"></div></section>'+
  '<section class="dhp-section" id="dhpLibrary" aria-labelledby="dhpLibraryTitle"><div class="dhp-head"><h2 id="dhpLibraryTitle">Wissen direkt öffnen</h2><button type="button" data-dhp-route="more">Alle Bereiche ↗</button></div><div class="dhp-library">'+l+'</div></section>'+
  '<section class="dhp-section" aria-labelledby="dhpQuoteTitle"><div class="dhp-head"><h2 id="dhpQuoteTitle">Überlieferungsmaßstab</h2></div><div class="dhp-quote">„Dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.“<div class="dhp-tiny dhp-quote-source">Muḥammad ibn Sīrīn</div></div></section>'+
  '<div class="dhp-footer"><strong>DĀR AL TAWḤĪD</strong><span>Folgt für mehr Wissen aus Qurʾān &amp; Sunnah</span><span>by Serhat Abu Malik</span></div>'+
 '</div>';
}
function stylesheet(){
 return [
'body.is-home-route .top-shell,body.is-home-route #appView{display:none!important;}',
'body:not(.is-home-route) #darHomeHtmlParityV1{display:none!important;}',
'#darHomeHtmlParityV1{--dhp-bg:var(--dt-page,var(--bg,#f6f5ed));--dhp-paper:var(--dt-card,var(--card,#fffef9));--dhp-ink:var(--dt-ink,var(--text,#243b2d));--dhp-muted:var(--dt-muted,var(--muted,#6e796d));--dhp-accent:var(--dt-accent,var(--gold2,#42674d));--dhp-line:var(--dt-rule,#d8dfd3);--dhp-gold:var(--gold2,#a08a5c);display:block;position:relative;isolation:isolate;width:100%;min-height:calc(100svh - 60px);background:var(--dhp-bg)!important;color:var(--dhp-ink)!important;box-shadow:none!important;overflow:visible!important;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;-webkit-text-size-adjust:100%;}',
'html[data-theme="light"][data-theme-variant="salbei"] #darHomeHtmlParityV1{--dhp-bg:#f6f5ed;--dhp-paper:#fffef9;--dhp-ink:#243b2d;--dhp-muted:#6e796d;--dhp-accent:#42674d;--dhp-line:#d8dfd3;--dhp-gold:#a08a5c;}',
'html:is([data-theme="dark"],[data-theme="royal"],[data-theme="bordeaux"],[data-theme="dar-al-layl"]) #darHomeHtmlParityV1{--dhp-bg:var(--bg,#111e1c);--dhp-paper:var(--card,#1b2c29);--dhp-ink:var(--text,#e9f0e7);--dhp-muted:var(--muted,#aebeb3);--dhp-accent:var(--gold2,#b8d4bb);--dhp-line:var(--line,#344942);}',
'#darHomeHtmlParityV1 *{box-sizing:border-box!important;}',
'#darHomeHtmlParityV1 button{font:inherit;cursor:pointer;color:inherit;}',
'#darHomeHtmlParityV1 button:focus-visible,#darHomeHtmlParityV1 input:focus-visible{outline:2px solid var(--dhp-accent)!important;outline-offset:2px!important;}',
'#darHomeHtmlParityV1 .dhp-content{max-width:470px;margin:0 auto;padding:24px 20px calc(115px + env(safe-area-inset-bottom,0px));}',
'#darHomeHtmlParityV1 .dhp-kicker{display:block;font-size:10px;font-weight:800;letter-spacing:1.3px;color:var(--dhp-accent);}',
'#darHomeHtmlParityV1 .dhp-brand{display:flex;gap:14px;align-items:center;margin:13px 0 17px;}',
'#darHomeHtmlParityV1 .dhp-seal{width:61px;height:61px;flex:none;border:1px solid var(--dhp-gold);border-radius:50%;display:grid;place-items:center;overflow:hidden;font:27px Georgia,serif;color:var(--dhp-accent);}',
'#darHomeHtmlParityV1 .dhp-seal img{width:100%;height:100%;object-fit:contain;}',
'#darHomeHtmlParityV1 .dhp-brand h1{font:28px/1.05 Georgia,serif;letter-spacing:.3px;margin:0;color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-brand small{display:block;font-size:11px;color:var(--dhp-muted);margin-top:5px;}',
'#darHomeHtmlParityV1 .dhp-prayer{display:block;width:100%;text-align:left;border:1px solid var(--dhp-line);border-radius:17px;background:var(--dhp-paper);padding:15px;}',
'#darHomeHtmlParityV1 .dhp-prayer-top{display:flex;justify-content:space-between;gap:12px;}',
'#darHomeHtmlParityV1 .dhp-prayer-top b{display:block;font-size:20px;color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-prayer-right{text-align:right;}',
'#darHomeHtmlParityV1 .dhp-clock{font-size:24px;font-weight:750;letter-spacing:-.7px;color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-muted{color:var(--dhp-muted);}',
'#darHomeHtmlParityV1 .dhp-tiny{font-size:11px;}',
'#darHomeHtmlParityV1 .dhp-prayer-footer{border-top:1px solid var(--dhp-line);margin-top:12px;padding-top:10px;display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--dhp-muted);}',
'#darHomeHtmlParityV1 .dhp-greeting{font:24px/1.25 Georgia,serif;margin:20px 0 8px;color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-intro{font-size:14px;line-height:1.5;color:var(--dhp-muted);margin:0 0 10px;}',
'#darHomeHtmlParityV1 .dhp-intro strong{color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-quickbar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:10px 0;}',
'#darHomeHtmlParityV1 .dhp-quick{min-width:0;min-height:62px;border:1px solid var(--dhp-line);background:var(--dhp-paper);border-radius:11px;padding:7px 3px;font-size:11px;font-weight:600;text-align:center;line-height:1.2;}',
'#darHomeHtmlParityV1 .dhp-quick span{display:block;font-size:19px;margin-bottom:4px;}',
'#darHomeHtmlParityV1 .dhp-search-box{padding:5px 12px;border:1px solid var(--dhp-line);border-radius:14px;background:var(--dhp-paper);margin-top:12px;}',
'#darHomeHtmlParityV1 .dhp-search{display:flex;align-items:center;gap:10px;min-height:42px;}',
'#darHomeHtmlParityV1 .dhp-search-icon{font-size:24px;color:var(--dhp-accent);}',
'#darHomeHtmlParityV1 .dhp-search input{width:100%;min-width:0;flex:1;padding:7px 0;border:0;outline:0;background:transparent;color:var(--dhp-ink);font:14px/1.4 inherit;}',
'#darHomeHtmlParityV1 .dhp-search button{border:0;background:transparent;color:var(--dhp-accent);font-size:21px;padding:4px 0;}',
'#darHomeHtmlParityV1 .dhp-results[hidden],#darHomeHtmlParityV1 #dv3ThemePanel[hidden]{display:none!important;}',
'#darHomeHtmlParityV1 .dhp-results{max-height:245px;overflow:auto;padding:4px 0 8px;border-top:1px solid var(--dhp-line);}',
'#darHomeHtmlParityV1 .dhp-result{display:flex;align-items:center;justify-content:space-between;text-align:left;gap:8px;width:100%;border:0;border-bottom:1px solid var(--dhp-line);padding:8px 3px;background:transparent;font-size:13px;}',
'#darHomeHtmlParityV1 .dhp-result small{color:var(--dhp-muted);font-size:10px;}',
'#darHomeHtmlParityV1 .dhp-section{margin-top:21px;scroll-margin-top:15px;}',
'#darHomeHtmlParityV1 .dhp-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;border-bottom:1px solid var(--dhp-line);padding-bottom:8px;margin-bottom:10px;}',
'#darHomeHtmlParityV1 .dhp-head h2{margin:0;font:22px/1.15 Georgia,serif;color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-head button{border:0;background:none;padding:0;font-size:12px;font-weight:700;color:var(--dhp-accent);white-space:nowrap;}',
'#darHomeHtmlParityV1 .dhp-panel{display:block;width:100%;border:1px solid var(--dhp-line);border-radius:16px;padding:14px;background:var(--dhp-paper);text-align:left;}',
'#darHomeHtmlParityV1 .dhp-panel h3{margin:6px 0;font:18px/1.25 Georgia,serif;color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-panel p{margin:0;font-size:12px;color:var(--dhp-muted);}',
'#darHomeHtmlParityV1 .dhp-resume{display:flex;align-items:center;justify-content:space-between;gap:12px;}',
'#darHomeHtmlParityV1 .dhp-arrow{flex:none;font-size:21px;color:var(--dhp-accent);}',
'#darHomeHtmlParityV1 .dhp-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}',
'#darHomeHtmlParityV1 .dhp-smallcard{min-height:112px;padding:12px;}',
'#darHomeHtmlParityV1 .dhp-smallcard h3{font-size:17px;}',
'#darHomeHtmlParityV1 .dhp-feature{background:color-mix(in srgb,var(--dhp-bg) 68%,var(--dhp-accent) 32%);border-color:var(--dhp-line);}',
'#darHomeHtmlParityV1 .dhp-feature h3{font-size:21px;}',
'#darHomeHtmlParityV1 .dhp-feature p{font-size:13px;margin-bottom:10px;}',
'#darHomeHtmlParityV1 .dhp-link{font-size:12px;font-weight:700;color:var(--dhp-accent);}',
'#darHomeHtmlParityV1 .dhp-article{display:flex;align-items:center;gap:10px;width:100%;padding:13px 0;border:0;border-bottom:1px solid var(--dhp-line);text-align:left;background:transparent;}',
'#darHomeHtmlParityV1 .dhp-article div{flex:1;}',
'#darHomeHtmlParityV1 .dhp-article h3{font-size:15px;font-weight:650;margin:0 0 3px;color:var(--dhp-ink);}',
'#darHomeHtmlParityV1 .dhp-article p{font-size:12px;margin:0;color:var(--dhp-muted);}',
'#darHomeHtmlParityV1 .dhp-library{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}',
'#darHomeHtmlParityV1 .dhp-library-tile{min-width:0;min-height:82px;padding:9px 5px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1px;text-align:center;border:1px solid var(--dhp-line);border-radius:12px;background:var(--dhp-paper);}',
'#darHomeHtmlParityV1 .dhp-library-tile span{font-size:20px;color:var(--dhp-accent);}',
'#darHomeHtmlParityV1 .dhp-library-tile b{font-size:12px;color:var(--dhp-ink);line-height:1.2;}',
'#darHomeHtmlParityV1 .dhp-library-tile small{font-size:10px;color:var(--dhp-muted);line-height:1.2;}',
'#darHomeHtmlParityV1 .dhp-quote{border-left:2px solid var(--dhp-gold);padding-left:12px;color:var(--dhp-muted);font:15px/1.6 Georgia,serif;}',
'#darHomeHtmlParityV1 .dhp-quote-source{margin-top:7px;}',
'#darHomeHtmlParityV1 .dhp-footer{text-align:center;font-size:12px;color:var(--dhp-muted);margin-top:30px;display:flex;flex-direction:column;gap:4px;}',
'#darHomeHtmlParityV1 .dhp-footer strong{color:var(--dhp-ink);}',
'@media(max-width:480px){#darHomeHtmlParityV1 .dhp-content{padding:20px 16px calc(115px + env(safe-area-inset-bottom,0px));}#darHomeHtmlParityV1 .dhp-brand h1{font-size:27px;}#darHomeHtmlParityV1 .dhp-quick{font-size:10px;}}'
 ].join("\n");
}
function create(){
 var top=document.querySelector(".top-shell"),root=document.getElementById(ID);
 if(!top)return null;
 if(!document.getElementById("darHomeParityStyleV1")){
  var css=document.createElement("style");css.id="darHomeParityStyleV1";css.textContent=stylesheet();document.head.appendChild(css);
 }
 if(!root){
  root=document.createElement("main");root.id=ID;root.setAttribute("aria-label","DĀR AL TAWḤĪD · Startseite");
  root.innerHTML=html();top.insertAdjacentElement("afterend",root);
  root.addEventListener("click",click);
  var inp=root.querySelector("#dhpSearch");
  if(inp){inp.addEventListener("input",input);inp.addEventListener("keydown",function(e){
   if(e.key==="Escape"){root.querySelector("#dhpResults").hidden=true;inp.blur()}
   if(e.key==="Enter"){var first=root.querySelector("#dhpResults .dhp-result");if(first){e.preventDefault();first.click()}}
  })}
 }
 return root;
}
function click(e){
 var root=document.getElementById(ID);
 if(e.target.closest("#dhpSearchClear")){var inp=root.querySelector("#dhpSearch");inp.value="";input();inp.focus();return}
 var btn=e.target.closest("[data-dhp-route]");
 if(!btn)return;
 e.preventDefault();
 var name=btn.getAttribute("data-dhp-route");
 if(name==="theme"){
  var old=document.querySelector("#dv3HeaderActions [data-dv3-theme-open]");
  if(old){old.click();return}
  route("settings");return;
 }
 if(name==="post"){route("post",btn.getAttribute("data-dhp-value")||"");return}
 if(name==="hash"){location.hash=btn.getAttribute("data-dhp-value")||"#home";return}
 route(name);
}
function input(){
 var root=document.getElementById(ID),inp=root&&root.querySelector("#dhpSearch");
 if(!inp)return;
 clearTimeout(inputTimer);
 var box=root.querySelector("#dhpResults");
 var q=String(inp.value||"").trim();
 if(q.length<2){box.hidden=true;box.replaceChildren();return}
 inputTimer=setTimeout(function(){
  var api=window.DarTestSmartSearchV48;
  var start=api&&api.load?api.load():Promise.resolve();
  Promise.resolve(start).then(function(){
   if(!inp.isConnected||inp.value.trim()!==q)return;
   var found=api&&api.find?api.find(q).slice(0,7):[];
   box.replaceChildren();
   if(!found.length){var p=document.createElement("div");p.className="dhp-result";p.textContent="Keine direkten Titel gefunden – Suche verfeinern";box.appendChild(p)}
   found.forEach(function(a){
    var b=document.createElement("button");b.type="button";b.className="dhp-result";b.setAttribute("role","option");
    b.dataset.dhpRoute=a.hash?"hash":(a.route||"topics");
    if(a.hash)b.dataset.dhpValue=a.hash;
    var label=document.createElement("span");label.textContent=a.label||a.title||"";
    var kind=document.createElement("small");kind.textContent=a.group||"Wissen";
    b.appendChild(label);b.appendChild(kind);box.appendChild(b);
   });
   box.hidden=false;
  }).catch(function(){box.hidden=true});
 },120);
}
function updateBrand(){
 var root=document.getElementById(ID);if(!root)return;
 var real=document.querySelector(".top-shell .brand-main .logo,.top-shell .brand-main img.logo,.top-shell .brand img");
 var seal=root.querySelector("#dhpBrandSeal");
 if(real&&real.getAttribute("src")&&!seal.querySelector("img")){
  var img=document.createElement("img");img.src=real.currentSrc||real.getAttribute("src");img.alt="DĀR AL TAWḤĪD";
  seal.replaceChildren(img);
 }
}
function updatePrayer(){
 var root=document.getElementById(ID),hub=document.getElementById("headerPrayerStatus");
 if(!root||!hub)return;
 var zones=Array.from(hub.querySelectorAll(".header-prayer-zone"));
 var next=zones.find(function(n){return /nächste|next/i.test(nativeText(n,".header-prayer-zone__caption"))})||zones[1]||zones[0]||hub;
 var name=nativeText(next,".header-prayer-name")||nativeText(hub,".header-prayer-name");
 var hour=nativeText(next,".header-prayer-hour")||nativeText(hub,".header-prayer-hour");
 var remaining=nativeText(hub,".header-prayer-zone__countdown")||nativeText(hub,".header-prayer-zone__count-label");
 var date=nativeText(hub,".header-prayer-hub__date"),hijri=nativeText(hub,".header-prayer-hub__hijri"),place=nativeText(hub,".header-prayer-hub__place");
 if(name)root.querySelector("#dhpPrayerName").textContent=name;
 if(hour)root.querySelector("#dhpPrayerClock").textContent=hour;
 root.querySelector("#dhpPrayerRemain").textContent=remaining;
 if(date)root.querySelector("#dhpPrayerDate").textContent=date;
 root.querySelector("#dhpPrayerHijri").textContent=hijri;
 if(place)root.querySelector("#dhpPrayerPlace").textContent=place;
}
function recent(){
 var box=document.getElementById(ID),src=document.querySelectorAll("#dv3Latest .dv3-post[data-dv3-nav='post']");
 if(!box||!src.length)return;
 var list=Array.from(src).map(function(n){return {
  id:n.getAttribute("data-dv3-value")||"",
  title:nativeText(n,".dv3-post-body b"),sub:nativeText(n,".dv3-post-body em")
 }}).filter(function(a){return a.title&&a.id});
 if(!list.length)return;
 var sig=list.map(function(a){return a.id+"|"+a.title}).join(";");
 if(lastItems===sig)return;
 lastItems=sig;
 var target=box.querySelector("#dhpPosts");
 target.replaceChildren();
 list.slice(0,4).forEach(function(p,i){
  var btn=document.createElement("button");btn.type="button";
  btn.className=i?"dhp-article":"dhp-panel dhp-feature";
  btn.dataset.dhpRoute="post";btn.dataset.dhpValue=p.id;
  if(i===0){
   var tag=document.createElement("span");tag.className="dhp-kicker";tag.textContent="NEUESTE VERÖFFENTLICHUNG";
   var h=document.createElement("h3");h.textContent=p.title;
   var meta=document.createElement("p");meta.textContent=p.sub||"Qurʾān · Sunnah · Āthār";
   var action=document.createElement("span");action.className="dhp-link";action.textContent="Beitrag lesen →";
   btn.append(tag,h,meta,action);
  }else{
   var d=document.createElement("div"),h2=document.createElement("h3"),p2=document.createElement("p"),arrow=document.createElement("span");
   h2.textContent=p.title;p2.textContent=p.sub;arrow.className="dhp-arrow";arrow.textContent="›";
   d.append(h2,p2);btn.append(d,arrow);
  }
  target.appendChild(btn);
 });
 box.querySelector("#dhpTodayName").textContent=list[0].title;
 box.querySelector("#dhpTodayArticle").dataset.dhpRoute="post";
 box.querySelector("#dhpTodayArticle").dataset.dhpValue=list[0].id;
}
function quran(){
 var root=document.getElementById(ID);if(!root)return;
 var hero=document.querySelector("#dv3QuranSlot .home-v380-quran-hero");
 if(!hero)return;
 var name=nativeText(hero,"h2,h3,strong")||"";
 if(name&&name.length<75)root.querySelector("#dhpQResume").textContent=name;
}
function modal(){
 var root=document.getElementById(ID),p=document.getElementById("dv3ThemePanel");
 if(root&&p&&p.parentElement!==root)root.appendChild(p);
}
function sync(){
 if(!document.body||!document.body.classList.contains("is-home-route"))return;
 var root=create();if(!root)return;
 updateBrand();updatePrayer();recent();quran();modal();
}
function queue(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;try{sync()}catch(e){console.warn("Test Home parity",e)}})}
function init(){
 queue();
 var view=document.getElementById("appView");
 if(view)new MutationObserver(queue).observe(view,{subtree:true,childList:true});
 var top=document.querySelector(".top-shell");
 if(top)new MutationObserver(queue).observe(top,{subtree:true,childList:true,characterData:true});
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:["class"]});
 document.addEventListener("dar:view-rendered",queue);
 window.addEventListener("hashchange",queue);
 window.addEventListener("pageshow",queue);
 setTimeout(queue,500);setTimeout(queue,1800);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();