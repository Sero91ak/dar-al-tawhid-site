/* DĀR AL TAWḤĪD · Test Home HTML-V3 visual parity.
 * Refined V4.9 Test Home: native 3D assets, no duplicate footer. Preserve native routes, prayer feed,
 * fuzzy search, saved theme settings, and the existing bottom navigation.
 * Isolated to /test, never /kids or public visitor.
 */
(function(){
"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__darHomeHtmlParityV1)return;
window.__darHomeHtmlParityV1=true;
var ID="darHomeHtmlParityV1", pending=false, lastItems="", inputTimer=null, clock=0;
/* DAR TEST HOME SHORTCUTS V60: no duplicate appearance/settings tiles.
 * The fixed header owns appearance; Einstellungen remains in Mehr. */
var quicks=[
 ["qibla","qibla.png","Qibla-Schnellsuche"],
 ["library","library.png","Bibliothek"]
];
var links=[
 ["frauen","frauen.png","Frauen","Wissen & Fiqh"],["hadith","hadith.png","Ḥadīṯ-Werke","Sammlungen"],
 ["books","library.png","Bibliothek","Bücher & PDFs"],["scholars","scholars.png","Gelehrte","Biografien"],
 ["books","scale.png","Quellen","Nachweise"],["duas","dua.png","Duʿāʾ","Bittgebete"],
 ["topics","topics.png","ʿAqīdah","Grundlagen"],["quran","quran.png","Qurʾān","Lesen & hören"],
 ["quiz","quiz.png","Quiz","Wissen prüfen"],
 ["bibliothek","library.png","DĀR-Bibliothek","Eigene PDFs"],
 ["quran-player","audio.png","Qurʾān-Player","Hören & Rezitation"],
 ["zakat","zakat.png","Zakāt-Rechner","Berechnung"],
 ["wasiyyah","wasiyyah.png","Testament","Waṣiyyah"],
 ["propheten","prophets.png","Propheten","Geschichten"],
 ["prayer","prayer.png","Gebetszeiten","Kalender"]
];
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(z){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[z]})}
function route(dest,val){if(dest==="library")dest="bibliothek"; // Open the real app library, not only the home-page tile grid.
 try{if(typeof window.navigate==="function"){window.navigate(dest,val||"");return}}catch(e){}
 try{if(typeof navigate==="function"){navigate(dest,val||"");return}}catch(e){}
 location.hash="#"+dest+(val?"/"+encodeURIComponent(val):"");
}
/* The two Home quick capsules must invoke the exact fullscreen Qibla
 * focus already used by Mehr / iOS. Never open a secondary small popup. */
function openQuickQibla(){
 try{
  var mini=window.DARQiblaQuickView;
  if(mini&&typeof mini.isOpen==="function"&&mini.isOpen()&&typeof mini.close==="function")mini.close();
 }catch(_){}
 try{
  if(typeof openQiblaFromFloat==="function"){openQiblaFromFloat();return;}
 }catch(err){console.warn("Qibla fullscreen shortcut",err)}
 try{
  if(typeof openQiblaQuickSheet==="function"){openQiblaQuickSheet();return;}
 }catch(err){console.warn("Qibla native quick-sheet shortcut",err)}
 route("qibla");
}
function nativeText(node,query){var el=node&&node.querySelector(query);return el?String(el.textContent||"").replace(/\s+/g," ").trim():""}
function html(){
 var q=quicks.map(function(a){return '<button type="button" class="dhp-quick'+(a[0]==="qibla"?" dhp-quick-qibla":"")+'" data-dhp-route="'+a[0]+'"'+(a[0]==="qibla"?' aria-label="Qibla-Schnellsuche öffnen"':'')+'><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/'+a[1]+'" alt="" loading="lazy" decoding="async"></span><span class="dhp-quick-label"><b>'+a[2]+'</b><small>'+(a[0]==="qibla"?"Vollbild öffnen":"Wissen öffnen")+'</small></span></button>'}).join("");
 var l=links.map(function(a){return '<button type="button" class="dhp-library-tile" data-dhp-route="'+a[0]+'"><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/'+a[1]+'" alt="" loading="lazy" decoding="async"></span><b>'+a[2]+'</b><small>'+a[3]+'</small></button>'}).join("");
 return '<div class="dhp-content">'+
  /* Only one logo/name in fixed app header; home has its own source line. */
  '<div class="dhp-home-source-v55">Beiträge nach Qurʾān, Sunnah und Āthār</div>'+ 
  '<button type="button" class="dhp-prayer" data-dhp-route="prayer" aria-label="Gebetszeiten öffnen"><div class="dhp-prayer-top"><div><div class="dhp-kicker">NÄCHSTES GEBET</div><b id="dhpPrayerName">Gebetszeiten</b><div class="dhp-tiny dhp-muted">Standortabhängige Gebetszeiten</div></div><div class="dhp-prayer-right"><div class="dhp-clock" id="dhpPrayerClock">–</div><div class="dhp-tiny dhp-muted" id="dhpPrayerRemain"></div></div></div><div class="dhp-prayer-footer"><span id="dhpPrayerDate">Gebetskalender</span><span id="dhpPrayerHijri"></span><span id="dhpPrayerPlace">Standort</span></div></button>'+
  '<section class="dhp-welcome" aria-label="Begrüßung bei DĀR AL TAWḤĪD"><h2 class="dhp-greeting">As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh</h2><div class="dhp-welcome-rule" aria-hidden="true"></div><p class="dhp-intro">Willkommen bei <strong>DĀR AL TAWḤĪD</strong> – einer geordneten Wissens-App mit Beiträgen aus <strong>Qurʾān</strong>, <strong>Sunnah</strong>, den <strong>Āthār der frühen Imāme</strong> und einer umfangreichen Duʿāʾ-Sammlung aus Qurʾān und authentischer Sunnah.</p></section>'+
  '<section class="dhp-isnad" aria-labelledby="dhpQuoteTitle"><div class="dhp-isnad-label" id="dhpQuoteTitle">ÜBERLIEFERUNGSMAẞSTAB</div><blockquote class="dhp-quote"><span class="dhp-quote-text">„Dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.“</span><div class="dhp-tiny dhp-quote-source">Muḥammad ibn Sīrīn</div></blockquote></section>'+
  '<div class="dhp-quickbar" aria-label="Schnellzugriffe">'+q+'</div>'+
  '<section class="dhp-search-box" aria-label="Intelligente Wissenssuche"><div class="dhp-search-pill"><span aria-hidden="true" class="dhp-search-icon">⌕</span><input id="dhpSearch" type="search" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search" placeholder="Wissen, Qurʾān, Ḥadīṯ, Themen suchen …" aria-label="Intelligente Suche in allen Bereichen" aria-controls="dhpResults" aria-expanded="false"><button type="button" id="dhpSearchClear" aria-label="Suchtext löschen" hidden>×</button></div><div id="dhpResults" class="dhp-results" hidden role="listbox" aria-label="Suchergebnisse"></div></section>'+
  '<section class="dhp-section dhp-quran-section" aria-label="Qurʾān"><button type="button" class="dhp-quran-capsule" data-dhp-route="quran"><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/quran.png" alt="" loading="lazy" decoding="async"></span><span><strong>Qurʾān</strong><small id="dhpQResume">Lesen · hören · weiterlernen</small></span></button></section>'+
  '<section class="dhp-section" aria-labelledby="dhpTodayTitle"><div class="dhp-head"><h2 id="dhpTodayTitle">Heute für dich</h2><span class="dhp-tiny dhp-muted">Tägliche Impulse</span></div><div class="dhp-today-stack"><button type="button" class="dhp-today-row" data-dhp-route="recent" id="dhpTodayArticle"><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/posts.png" alt="" loading="lazy"></span><span class="dhp-today-copy"><span class="dhp-kicker">EMPFEHLUNG</span><strong id="dhpTodayName">Wissen vertiefen</strong></span></button><button type="button" class="dhp-today-row" data-dhp-route="duas"><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/dua.png" alt="" loading="lazy"></span><span class="dhp-today-copy"><span class="dhp-kicker">DUʿĀʾ</span><strong>Bittgebet des Tages</strong></span></button></div></section>'+
  '<section class="dhp-section" aria-labelledby="dhpPostsTitle"><div class="dhp-head"><h2 id="dhpPostsTitle">Neueste Veröffentlichungen</h2><button type="button" data-dhp-route="recent">Alle ansehen</button></div><div id="dhpPosts" class="dhp-posts"><button type="button" class="dhp-panel dhp-feature" data-dhp-route="recent"><span class="dhp-kicker">VERÖFFENTLICHUNGEN</span><h3>Neueste Beiträge öffnen</h3><p>Aktuelle Veröffentlichungen direkt aus der App.</p></button></div></section>'+
  '<section class="dhp-section" id="dhpPopular" hidden aria-labelledby="dhpPopularTitle"><div class="dhp-head"><h2 id="dhpPopularTitle">Meist gelesen</h2><button type="button" data-dhp-route="recent">Alle ansehen</button></div><div id="dhpPopularList"></div></section>'+
  '<section class="dhp-section" id="dhpLibrary" aria-labelledby="dhpLibraryTitle"><div class="dhp-head"><h2 id="dhpLibraryTitle">Wissen direkt öffnen</h2><button type="button" data-dhp-route="more">Alle Bereiche</button></div><div class="dhp-library">'+l+'</div></section>'+
  
  
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
'#darHomeHtmlParityV1 button:focus-visible,#darHomeHtmlParityV1 input:focus-visible{outline:2px solid var(--dhp-accent)!important;}',
'#darHomeHtmlParityV1 .dhp-content{max-width:470px;margin:0 auto;padding:24px 20px calc(115px + env(safe-area-inset-bottom,0px));}',
'#darHomeHtmlParityV1 .dhp-kicker{display:block;font-size:10px;font-weight:800;letter-spacing:1.3px;color:var(--dhp-accent);}',
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
'#darHomeHtmlParityV1 .dhp-feature{background:color-mix(in srgb,var(--dhp-bg) 68%,var(--dhp-accent) 32%);border-color:var(--dhp-line);}',
'#darHomeHtmlParityV1 .dhp-feature h3{font-size:21px;}',
'#darHomeHtmlParityV1 .dhp-feature p{font-size:13px;margin-bottom:10px;}',
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
'@media(max-width:480px){#darHomeHtmlParityV1 .dhp-content{padding:20px 16px calc(115px + env(safe-area-inset-bottom,0px));}#darHomeHtmlParityV1 .dhp-quick{font-size:10px;}}'
,
 "#darHomeHtmlParityV1{--dhp-light:color-mix(in srgb,var(--dhp-paper) 86%,var(--dhp-bg) 14%);--dhp-halo:color-mix(in srgb,var(--dhp-accent) 15%,transparent 85%);--dhp-goldline:color-mix(in srgb,var(--dhp-gold) 72%,var(--dhp-line) 28%);}",
 "#darHomeHtmlParityV1 .dhp-content{padding-top:17px!important;padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important;}",
 "#darHomeHtmlParityV1 .dhp-kicker{letter-spacing:.14em!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer{position:relative!important;isolation:isolate!important;overflow:hidden!important;border-radius:21px!important;border:1px solid var(--dhp-goldline)!important;background:linear-gradient(115deg,color-mix(in srgb,var(--dhp-paper) 88%,var(--dhp-bg) 12%),var(--dhp-paper))!important;box-shadow:0 10px 24px rgba(0,0,0,.045),inset 0 1px rgba(255,255,255,.13)!important;padding:17px 16px 14px!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer::before{content:\"\";position:absolute;right:-30px;top:-58px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--dhp-gold) 10%,transparent),transparent 67%);pointer-events:none;z-index:-1;}",
 "#darHomeHtmlParityV1 .dhp-prayer-top{align-items:center!important;gap:12px!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer-top b{font:650 clamp(21px,5.8vw,27px)/1.14 \"Iowan Old Style\",Georgia,serif!important;margin:6px 0 4px!important;color:var(--dhp-ink)!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer-right{flex:0 0 auto!important;}",
 "#darHomeHtmlParityV1 .dhp-clock{font:650 clamp(27px,7.2vw,35px)/1.1 \"Iowan Old Style\",Georgia,serif!important;font-variant-numeric:tabular-nums!important;letter-spacing:0!important;color:var(--dhp-gold)!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer-footer{margin-top:13px!important;padding-top:11px!important;border-color:var(--dhp-line)!important;gap:6px 12px!important;}",
 "#darHomeHtmlParityV1 .dhp-greeting{font:650 clamp(23px,5.8vw,28px)/1.29 \"Iowan Old Style\",Georgia,serif!important;margin:21px 0 10px!important;letter-spacing:.005em!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad{margin:0 0 14px;padding:12px 15px 13px 16px;border:1px solid var(--dhp-line);border-radius:15px;background:color-mix(in srgb,var(--dhp-paper) 62%,var(--dhp-bg) 38%);position:relative;}",
 "#darHomeHtmlParityV1 .dhp-isnad::before{content:\"\";position:absolute;left:0;top:13px;bottom:13px;width:2px;background:linear-gradient(180deg,var(--dhp-goldline),transparent);}",
 "#darHomeHtmlParityV1 .dhp-isnad-label{font-size:10px;color:var(--dhp-accent);font-weight:800;letter-spacing:.12em;margin-bottom:5px;}",
 "#darHomeHtmlParityV1 .dhp-quote{font:500 14px/1.52 \"Iowan Old Style\",Georgia,serif!important;}",
 "#darHomeHtmlParityV1 .dhp-quote-source{margin-top:5px!important;font:600 11px/1.4 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;}",
 "#darHomeHtmlParityV1 .dhp-intro{line-height:1.57!important;margin-bottom:16px!important;}",
 "#darHomeHtmlParityV1 .dhp-intro strong{color:var(--dhp-accent)!important;}",
 "#darHomeHtmlParityV1 .dhp-quickbar{gap:9px!important;margin:14px 0 17px!important;}",
 "#darHomeHtmlParityV1 .dhp-quick{min-height:89px!important;border:1px solid var(--dhp-line)!important;padding:11px 4px 8px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--dhp-paper) 93%,var(--dhp-bg) 7%),var(--dhp-paper))!important;flex-direction:column!important;gap:6px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;}",
 "#darHomeHtmlParityV1 .dhp-quick b{display:block!important;font:650 clamp(10px,2.35vw,12px)/1.25 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;}",
 "#darHomeHtmlParityV1 .dhp-icon3d{width:40px;height:40px;flex:none;display:grid!important;place-items:center!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;font-size:0!important;}",
 "#darHomeHtmlParityV1 .dhp-icon3d img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 5px rgba(0,0,0,.11));transform:translateZ(0);}",
 "#darHomeHtmlParityV1 .dhp-search-box{margin-top:0!important;padding:0 13px!important;border:1px solid var(--dhp-line)!important;border-radius:18px!important;}",
 "#darHomeHtmlParityV1 .dhp-search{min-height:49px!important;gap:11px!important;}",
 "#darHomeHtmlParityV1 .dhp-search-icon{display:grid;place-items:center;font-size:26px!important;}",
 "#darHomeHtmlParityV1 .dhp-search input{height:45px!important;min-height:45px!important;padding:8px 0!important;font-size:14px!important;line-height:1.4!important;}",
 "#darHomeHtmlParityV1 .dhp-search-box:focus-within{border-color:var(--dhp-accent)!important;box-shadow:0 0 0 4px var(--dhp-halo)!important;}",
 "#darHomeHtmlParityV1 .dhp-quran-section{margin-top:18px!important;}",
 "#darHomeHtmlParityV1 .dhp-quran-capsule{width:100%;min-height:67px;display:flex;align-items:center;gap:13px;text-align:left;border:1px solid var(--dhp-goldline);border-radius:999px;padding:11px 18px;background:linear-gradient(100deg,color-mix(in srgb,var(--dhp-paper) 83%,var(--dhp-bg) 17%),var(--dhp-paper));box-shadow:inset 0 1px 0 rgba(255,255,255,.10);}",
 "#darHomeHtmlParityV1 .dhp-quran-capsule .dhp-icon3d{width:43px!important;height:43px!important;}",
 "#darHomeHtmlParityV1 .dhp-quran-capsule strong{display:block;font:700 17px/1.2 \"Iowan Old Style\",Georgia,serif;color:var(--dhp-ink);}",
 "#darHomeHtmlParityV1 .dhp-quran-capsule small{display:block;margin-top:3px;color:var(--dhp-muted);font:12px/1.35 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;}",
 "#darHomeHtmlParityV1 .dhp-section{margin-top:23px!important;}",
 "#darHomeHtmlParityV1 .dhp-head{align-items:center!important;gap:12px!important;padding-bottom:9px!important;margin-bottom:12px!important;border-bottom:1px solid var(--dhp-line)!important;}",
 "#darHomeHtmlParityV1 .dhp-head h2{font:650 clamp(20px,5.1vw,24px)/1.25 \"Iowan Old Style\",Georgia,serif!important;}",
 "#darHomeHtmlParityV1 .dhp-head button{font:700 11px/1.25 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;border:1px solid var(--dhp-line)!important;padding:8px 12px!important;background:var(--dhp-paper)!important;white-space:nowrap!important;}",
 "#darHomeHtmlParityV1 .dhp-panel{border:1px solid var(--dhp-line)!important;border-radius:18px!important;background:var(--dhp-paper)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)!important;}",
 "#darHomeHtmlParityV1 .dhp-feature{padding:14px 15px!important;background:linear-gradient(135deg,color-mix(in srgb,var(--dhp-paper) 78%,var(--dhp-accent) 22%),var(--dhp-paper))!important;margin-bottom:10px!important;}",
 "#darHomeHtmlParityV1 .dhp-feature h3{font-size:clamp(18px,4.6vw,21px)!important;line-height:1.25!important;}",
 "#darHomeHtmlParityV1 .dhp-feature p{margin-bottom:0!important;}",
 "#darHomeHtmlParityV1 .dhp-article{border-bottom:1px solid var(--dhp-line)!important;padding:13px 2px!important;background:transparent!important;}",
 "#darHomeHtmlParityV1 .dhp-library{gap:10px!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile{min-height:103px!important;padding:10px 5px 12px!important;gap:4px!important;border:1px solid var(--dhp-line)!important;border-radius:17px!important;background:radial-gradient(circle at 85% 3%,color-mix(in srgb,var(--dhp-accent) 9%,transparent),transparent 55%),var(--dhp-paper)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;overflow:hidden!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile .dhp-icon3d{width:41px!important;height:41px!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile b{font-size:clamp(11px,2.8vw,13px)!important;line-height:1.2!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile small{font-size:10px!important;line-height:1.25!important;}",
 "#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-quran-capsule,.dhp-panel,.dhp-article,.dhp-library-tile,.dhp-head button){transition:box-shadow .22s ease,border-color .22s ease,transform .22s ease,background .22s ease!important;}",
 "#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-quran-capsule,.dhp-panel,.dhp-article,.dhp-library-tile,.dhp-head button):is(:hover,:focus-visible){border-color:var(--dhp-accent)!important;box-shadow:0 0 0 4px var(--dhp-halo),0 8px 20px rgba(0,0,0,.065)!important;transform:translateY(-1px)!important;outline:none!important;}",
 "@media(hover:none){#darHomeHtmlParityV1 :is(.dhp-quick,.dhp-library-tile,.dhp-quran-capsule,.dhp-panel):active{box-shadow:0 0 0 4px var(--dhp-halo)!important;transform:scale(.988)!important;}}",
 "@media(max-width:375px){#darHomeHtmlParityV1 .dhp-content{padding-left:14px!important;padding-right:14px!important;}#darHomeHtmlParityV1 .dhp-quickbar{gap:6px!important;}#darHomeHtmlParityV1 .dhp-library{gap:7px!important;}#darHomeHtmlParityV1 .dhp-library-tile{padding-left:3px!important;padding-right:3px!important;}}"
,
"/* V5.0: approved cohesive welcome and theme-aware ink */",
"#darHomeHtmlParityV1{--dhp-focus:color-mix(in srgb,var(--dhp-accent) 15%,transparent);--dhp-rim:color-mix(in srgb,var(--dhp-gold) 60%,var(--dhp-line) 40%);}",
"html:is([data-theme=\"light\"],[data-theme=\"soft\"],[data-theme=\"eisgold\"]) #darHomeHtmlParityV1{--dhp-strong-ink:#202921;}",
"html:is([data-theme=\"dark\"],[data-theme=\"royal\"],[data-theme=\"bordeaux\"],[data-theme=\"dar-al-layl\"]) #darHomeHtmlParityV1{--dhp-strong-ink:#f2f2ed;}",
"#darHomeHtmlParityV1{--dhp-strong-ink:var(--dhp-ink);}",
"#darHomeHtmlParityV1 :is(h1,h2,h3,strong,b,.dhp-result-title,.dhp-today-copy strong){color:var(--dhp-strong-ink,var(--dhp-ink))!important;-webkit-text-fill-color:var(--dhp-strong-ink,var(--dhp-ink))!important;}",
"#darHomeHtmlParityV1 .dhp-welcome{margin:20px 0 0!important;padding:14px 15px 15px!important;border:1px solid var(--dhp-line)!important;border-radius:19px!important;background:color-mix(in srgb,var(--dhp-paper) 72%,var(--dhp-bg) 28%)!important;}",
"#darHomeHtmlParityV1 .dhp-greeting{font:630 clamp(19px,4.9vw,23px)/1.3 \"Iowan Old Style\",Georgia,serif!important;letter-spacing:0!important;overflow-wrap:normal!important;}",
"#darHomeHtmlParityV1 .dhp-welcome-rule{height:2px;max-width:100%;margin:14px 0 13px;background:linear-gradient(90deg,var(--dhp-rim) 0%,color-mix(in srgb,var(--dhp-rim) 44%,transparent) 47%,transparent 100%);border:0;border-radius:999px;}",
"#darHomeHtmlParityV1 .dhp-intro{font:400 14px/1.62 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;}",
"#darHomeHtmlParityV1 .dhp-intro strong{font-weight:750!important;}",
"#darHomeHtmlParityV1 .dhp-isnad{margin:12px 0 16px!important;padding:13px 15px 15px!important;border-radius:18px!important;}",
"#darHomeHtmlParityV1 .dhp-isnad-label{margin-bottom:7px!important;}",
"#darHomeHtmlParityV1 .dhp-quickbar{margin-top:17px!important;}",
"/* Single oval capsule: no pill inside an outer card */",
"#darHomeHtmlParityV1 .dhp-search-box{display:block!important;background:transparent!important;padding:0!important;margin:15px 0 0!important;overflow:visible!important;}",
"#darHomeHtmlParityV1 .dhp-search-pill{display:flex!important;align-items:center!important;gap:10px!important;width:100%!important;min-height:57px!important;border:1px solid var(--dhp-line)!important;border-radius:999px!important;background:var(--dhp-paper)!important;padding:5px 8px 5px 17px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.09)!important;transition:border-color .18s ease,box-shadow .18s ease!important;}",
"#darHomeHtmlParityV1 .dhp-search-icon{width:24px!important;flex:0 0 24px!important;font-size:27px!important;color:var(--dhp-accent)!important;margin:0!important;line-height:1!important;}",
"#darHomeHtmlParityV1 #dhpSearch{flex:1!important;min-width:0!important;width:100%!important;height:43px!important;padding:7px 4px 7px 7px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--dhp-strong-ink,var(--dhp-ink))!important;-webkit-text-fill-color:var(--dhp-strong-ink,var(--dhp-ink))!important;font:500 14px/1.4 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;outline:0!important;}",
"#darHomeHtmlParityV1 #dhpSearch::placeholder{color:var(--dhp-muted)!important;-webkit-text-fill-color:var(--dhp-muted)!important;opacity:.88!important;}",
"#darHomeHtmlParityV1 #dhpSearch::-webkit-search-cancel-button{-webkit-appearance:none;display:none;}",
"#darHomeHtmlParityV1 .dhp-search-pill:focus-within{border-color:var(--dhp-accent)!important;box-shadow:0 0 0 4px var(--dhp-focus),0 8px 21px rgba(0,0,0,.045)!important;}",
"#darHomeHtmlParityV1 #dhpSearch:focus-visible{box-shadow:none!important;}",
"#darHomeHtmlParityV1 #dhpSearchClear{flex:0 0 38px!important;width:38px!important;height:38px!important;min-height:38px!important;display:grid!important;place-items:center!important;padding:0!important;margin-right:1px!important;border:1px solid var(--dhp-line)!important;border-radius:50%!important;background:color-mix(in srgb,var(--dhp-bg) 55%,var(--dhp-paper) 45%)!important;color:var(--dhp-ink)!important;font:500 24px/1 sans-serif!important;}",
"#darHomeHtmlParityV1 #dhpSearchClear[hidden]{display:none!important;}",
"#darHomeHtmlParityV1 #dhpSearchClear:is(:hover,:focus-visible){background:var(--dhp-focus)!important;border-color:var(--dhp-accent)!important;}",
"#darHomeHtmlParityV1 .dhp-results{margin:9px 0 0!important;padding:2px 14px 6px!important;max-height:none!important;overflow:visible!important;background:var(--dhp-paper)!important;border:1px solid var(--dhp-line)!important;border-radius:18px!important;box-shadow:0 12px 29px rgba(0,0,0,.045)!important;}",
"#darHomeHtmlParityV1 .dhp-results-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;padding:12px 2px 9px!important;border-bottom:1px solid var(--dhp-rim)!important;}",
"#darHomeHtmlParityV1 .dhp-results-head strong{font:750 12px/1.3 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;}",
"#darHomeHtmlParityV1 .dhp-results-head>span{font:500 11px/1.3 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;color:var(--dhp-muted)!important;}",
"#darHomeHtmlParityV1 .dhp-results-list{max-height:335px!important;overflow-y:auto!important;overscroll-behavior:contain!important;}",
"#darHomeHtmlParityV1 .dhp-result{width:100%!important;min-height:59px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:11px 2px!important;margin:0!important;border:0!important;border-bottom:1px solid color-mix(in srgb,var(--dhp-line) 90%,transparent)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;text-align:left!important;}",
"#darHomeHtmlParityV1 .dhp-result:last-child{border-bottom:0!important;}",
"#darHomeHtmlParityV1 .dhp-result-title{flex:1!important;min-width:0!important;overflow-wrap:anywhere!important;font:650 13px/1.45 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;letter-spacing:0!important;}",
"#darHomeHtmlParityV1 .dhp-result-group{flex:0 0 auto!important;max-width:34%!important;white-space:nowrap!important;padding:6px 8px!important;border:1px solid var(--dhp-line)!important;border-radius:999px!important;background:color-mix(in srgb,var(--dhp-paper) 72%,var(--dhp-bg) 28%)!important;color:var(--dhp-muted)!important;font:500 10px/1.2 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;}",
"#darHomeHtmlParityV1 .dhp-result:is(:hover,:focus-visible){background:var(--dhp-focus)!important;transform:none!important;outline:0!important;}",
"#darHomeHtmlParityV1 .dhp-empty-search{margin:0!important;padding:15px 1px!important;color:var(--dhp-muted)!important;font-size:12px!important;}",
"/* Today cards: horizontal, readable, auto-height capsules */",
"#darHomeHtmlParityV1 .dhp-today-stack{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:9px!important;}",
"#darHomeHtmlParityV1 .dhp-today-row{position:relative!important;display:flex!important;align-items:center!important;gap:13px!important;width:100%!important;min-height:73px!important;padding:10px 16px!important;border:1px solid var(--dhp-line)!important;border-radius:999px!important;background:var(--dhp-paper)!important;text-align:left!important;overflow:hidden!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.1)!important;}",
"#darHomeHtmlParityV1 .dhp-today-row .dhp-icon3d{flex:0 0 42px!important;width:42px!important;height:42px!important;}",
"#darHomeHtmlParityV1 .dhp-today-copy{min-width:0!important;flex:1!important;display:flex!important;flex-direction:column!important;gap:3px!important;}",
"#darHomeHtmlParityV1 .dhp-today-copy .dhp-kicker{font-size:9px!important;letter-spacing:.12em!important;}",
"#darHomeHtmlParityV1 .dhp-today-copy strong{display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;max-width:100%!important;font:650 clamp(16px,4.1vw,19px)/1.27 \"Iowan Old Style\",Georgia,serif!important;}",
"/* Featured and secondary posts: clear capsule boundary and comfortable gaps */",
"#darHomeHtmlParityV1 .dhp-posts{display:grid!important;gap:10px!important;overflow:visible!important;}",
"#darHomeHtmlParityV1 .dhp-post-capsule{position:relative!important;margin:0!important;border:1px solid var(--dhp-line)!important;border-radius:21px!important;background:var(--dhp-paper)!important;overflow:visible!important;}",
"#darHomeHtmlParityV1 .dhp-feature{padding:15px 17px!important;background:color-mix(in srgb,var(--dhp-paper) 92%,var(--dhp-accent) 8%)!important;}",
"#darHomeHtmlParityV1 .dhp-feature h3{margin:5px 0!important;font:650 19px/1.3 \"Iowan Old Style\",Georgia,serif!important;}",
"#darHomeHtmlParityV1 .dhp-article{min-height:61px!important;display:flex!important;align-items:center!important;padding:12px 15px!important;}",
"#darHomeHtmlParityV1 .dhp-article h3{font:650 15px/1.35 \"Iowan Old Style\",Georgia,serif!important;margin:0 0 4px!important;}",
"#darHomeHtmlParityV1 .dhp-article p{font:500 11px/1.35 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;}",
"/* One elegant tapering rim that keeps native theme contrast */",
"#darHomeHtmlParityV1 :is(.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-quran-capsule){isolation:isolate!important;}",
"#darHomeHtmlParityV1 .dhp-quran-capsule{position:relative!important;overflow:hidden!important;}",
"#darHomeHtmlParityV1 .dhp-library-tile{min-height:100px!important;}",
"#darHomeHtmlParityV1 :is(.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-quran-capsule):is(:focus-visible,:hover){box-shadow:0 0 0 4px var(--dhp-focus),0 8px 19px rgba(0,0,0,.06)!important;}",
"@media(max-width:370px){#darHomeHtmlParityV1 .dhp-welcome{padding:14px 12px!important;}#darHomeHtmlParityV1 .dhp-today-row{padding:11px 12px!important;}#darHomeHtmlParityV1 .dhp-search-pill{padding-left:13px!important;}#darHomeHtmlParityV1 .dhp-results{padding-left:11px!important;padding-right:11px!important;}#darHomeHtmlParityV1 .dhp-result-group{max-width:30%!important;}}",
"@media(prefers-reduced-motion:reduce){#darHomeHtmlParityV1 *{transition-duration:.01ms!important;animation-duration:.01ms!important;}}",
 "/* DAR_TEST_HOME_ELEGANT_CAPSULE_V52 · Only the active /test/ Home dhp surface. Outer section rectangles removed; true interactive capsule rims + theme glow restored. No Visitor/Kids changes. */",
 "body.is-home-route :is(.app,.app-shell,.page-shell,#appRoot,#appShell){border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;}",
 "body.is-home-route #darHomeHtmlParityV1{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;margin-inline:0!important;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;overflow-x:clip!important;}",
 "body.is-home-route #darHomeHtmlParityV1::before,body.is-home-route #darHomeHtmlParityV1::after{content:none!important;display:none!important;}",
 "#darHomeHtmlParityV1 .dhp-content{box-sizing:border-box!important;width:100%!important;max-width:1280px!important;min-width:0!important;margin-inline:auto!important;padding-inline:clamp(14px,3vw,38px)!important;}",
 "/* Inert content wrappers have NO secondary rectangular panel, frame, gradient or shadow. */",
 "#darHomeHtmlParityV1 :is(.dhp-content,.dhp-section,.dhp-head,.dhp-quickbar,.dhp-today-stack,.dhp-posts,.dhp-library,.dhp-welcome,.dhp-isnad,.dhp-search-box,.dhp-results){background:transparent!important;background-image:none!important;border:0!important;outline:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}",
 "#darHomeHtmlParityV1 :is(.dhp-welcome,.dhp-isnad){border-radius:0!important;}",
 "#darHomeHtmlParityV1 .dhp-welcome-rule{box-shadow:none!important;max-width:100%!important;background:linear-gradient(90deg,color-mix(in srgb,var(--dhp-capsule-accent) 46%,transparent),transparent 80%)!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad::before{content:none!important;}",
 "#darHomeHtmlParityV1 .dhp-results[hidden]{display:none!important;}",
 "/* Capsule palette derives from the selected appearance and never changes text. */",
 "#darHomeHtmlParityV1{--dhp-capsule-accent:var(--dhp-gold,var(--dhp-accent,#9d875e));--dhp-capsule-rim:color-mix(in srgb,var(--dhp-capsule-accent) 36%,var(--dhp-line) 64%);--dhp-capsule-active-rim:color-mix(in srgb,var(--dhp-capsule-accent) 76%,var(--dhp-line) 24%);--dhp-capsule-fill:color-mix(in srgb,var(--dhp-bg) 82%,var(--dhp-paper) 18%);--dhp-capsule-glow:color-mix(in srgb,var(--dhp-capsule-accent) 19%,transparent);}",
 "html[data-theme=\"light\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#987f56;}",
 "html[data-theme=\"light\"][data-theme-variant=\"salbei\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#8e9d77;}",
 "html[data-theme=\"soft\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#a27791;}",
 "html[data-theme=\"eisgold\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#a18a4f;}",
 "html[data-theme=\"royal\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#c5a66c;}",
 "html[data-theme=\"bordeaux\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#bd9084;}",
 "html[data-theme=\"dar-al-layl\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#bea878;}",
 "html[data-theme=\"aurora\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#93b6a9;}",
 "html[data-theme=\"dark\"] #darHomeHtmlParityV1{--dhp-capsule-accent:#aa9e78;}",
 "/* One delicate 1px accent around EACH actionable pill: no big rectangular parent box. */",
 "#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-search-pill,.dhp-quran-capsule,.dhp-panel,.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-head button){border:1px solid var(--dhp-capsule-rim)!important;border-image:none!important;outline:0!important;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--dhp-capsule-accent) 10%,transparent)!important;background:var(--dhp-capsule-fill)!important;background-image:none!important;transition:border-color 170ms ease,box-shadow 170ms ease,background-color 170ms ease!important;transform:none!important;}",
 "/* Capsule geometry is elegant and consistent from iPhone to wide-screen. */",
 "#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-panel,.dhp-post-capsule){border-radius:clamp(16px,3vw,21px)!important;}",
 "#darHomeHtmlParityV1 :is(.dhp-search-pill,.dhp-quran-capsule,.dhp-today-row){border-radius:999px!important;}",
 "#darHomeHtmlParityV1 :is(.dhp-quick,.dhp-library-tile){border-radius:clamp(15px,3vw,19px)!important;}",
 "#darHomeHtmlParityV1 .dhp-head button{border-radius:999px!important;padding-inline:10px!important;background:transparent!important;}",
 "/* Accessible native touch response, keyboard focus and mouse hover. */",
 "#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-search-pill,.dhp-quran-capsule,.dhp-panel,.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-head button):is(:active,:focus-visible,:focus-within){border-color:var(--dhp-capsule-active-rim)!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--dhp-capsule-accent) 35%,transparent),0 0 13px 2px var(--dhp-capsule-glow)!important;transform:none!important;}",
 "@media(hover:hover) and (pointer:fine){#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-search-pill,.dhp-quran-capsule,.dhp-panel,.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-head button):hover{border-color:var(--dhp-capsule-active-rim)!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--dhp-capsule-accent) 22%,transparent),0 0 12px 1px var(--dhp-capsule-glow)!important;transform:none!important;}}",
 "/* Old ornamental fake rims are NOT a second perimeter around any capsule. */",
 "#darHomeHtmlParityV1 :is(.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-quran-capsule)::before{content:none!important;display:none!important;-webkit-mask:none!important;mask:none!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer::before{content:none!important;display:none!important;}",
 "/* Preserve coherent pill interior: no sub-rectangles in the clickable card. */",
 "#darHomeHtmlParityV1 .dhp-feature{background:var(--dhp-capsule-fill)!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer-footer{border-top:0!important;padding-top:9px!important;}",
 "#darHomeHtmlParityV1 .dhp-results{border:0!important;border-radius:0!important;box-shadow:none!important;}",
 "#darHomeHtmlParityV1 .dhp-search-box{border:0!important;border-radius:0!important;box-shadow:none!important;}",
 "#darHomeHtmlParityV1 #dhpSearchClear{border:1px solid var(--dhp-capsule-rim)!important;box-shadow:none!important;}",
 "#darHomeHtmlParityV1 #dhpSearchClear:is(:active,:focus-visible){border-color:var(--dhp-capsule-active-rim)!important;box-shadow:0 0 0 1px var(--dhp-capsule-glow)!important;}",
 "#darHomeHtmlParityV1 button:focus-visible,#darHomeHtmlParityV1 input:focus-visible{outline:2px solid var(--dhp-capsule-accent)!important;outline-offset:2px!important;}",
 "#darHomeHtmlParityV1 #dhpSearch:focus-visible{outline:0!important;}",
 "@media(max-width:699px){#darHomeHtmlParityV1 .dhp-content{max-width:100%!important;padding-inline:max(14px,env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))!important;}}",
 "@media(min-width:700px){#darHomeHtmlParityV1 .dhp-content{max-width:1280px!important;padding-inline:clamp(24px,3vw,44px)!important;}}",
 "@media(prefers-reduced-motion:reduce){#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-search-pill,.dhp-quran-capsule,.dhp-panel,.dhp-today-row,.dhp-post-capsule,.dhp-library-tile,.dhp-head button){transition:none!important;}}",
 "/* DAR_TEST_LAST_ROW_FOOTER_FLOW_V53 · keep final 3 tiles fully visible, eliminate phantom footer gap, all themes */",
 "#darHomeHtmlParityV1 .dhp-library{height:auto!important;max-height:none!important;overflow:visible!important;align-content:start!important;grid-auto-rows:minmax(112px,auto)!important;padding:0 0 4px!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile{position:relative!important;box-sizing:border-box!important;min-height:112px!important;height:auto!important;max-height:none!important;overflow:visible!important;padding:12px 5px 14px!important;}",
 "#darHomeHtmlParityV1 .dhp-section:has(.dhp-library){height:auto!important;max-height:none!important;overflow:visible!important;padding-bottom:0!important;margin-bottom:0!important;}",
 "#darHomeHtmlParityV1 .dhp-content{height:auto!important;min-height:0!important;max-height:none!important;padding-bottom:calc(var(--dar-nav-height,76px) + env(safe-area-inset-bottom,0px) + 14px)!important;}",
 "body.is-home-route #darHomeHtmlParityV1{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile::before,#darHomeHtmlParityV1 .dhp-library-tile::after{pointer-events:none!important;}",
 "@media(max-width:699px){#darHomeHtmlParityV1 .dhp-library{grid-auto-rows:minmax(108px,auto)!important;}#darHomeHtmlParityV1 .dhp-library-tile{min-height:108px!important;padding-block:10px 12px!important;}#darHomeHtmlParityV1 .dhp-content{padding-bottom:calc(var(--dar-nav-height,76px) + env(safe-area-inset-bottom,0px) + 12px)!important;}}",
 /* DAR_TEST_HOME_PRAYER_FIRST_ACTUAL_V54: the parity renderer, not .top-shell, is visible! */
 "#darHomeHtmlParityV1 .dhp-content{padding-top:0!important;}",
 "#darHomeHtmlParityV1 .dhp-home-source-v55{margin:4px 0 12px!important;color:var(--dhp-accent)!important;font:750 clamp(10px,2.85vw,14px)/1.35 system-ui,-apple-system,sans-serif!important;letter-spacing:.10em!important;text-transform:uppercase!important;overflow-wrap:break-word!important;}",
 "#darHomeHtmlParityV1 .dhp-welcome{margin-top:clamp(22px,5vw,36px)!important;margin-bottom:clamp(23px,5vw,37px)!important;}",
 "#darHomeHtmlParityV1 .dhp-greeting{font-size:clamp(22px,5.3vw,36px)!important;line-height:1.23!important;}",
 "#darHomeHtmlParityV1 .dhp-content>.dhp-prayer:first-child{margin-top:4px!important;}",
 /* DAR_TEST_HOME_WELCOME_DENSITY_V56: actual app Home renderer, no duplicate design. */
 "#darHomeHtmlParityV1 .dhp-welcome{height:auto!important;min-height:0!important;margin:clamp(12px,3.3vw,17px) 0 5px!important;padding:0!important;}",
 "#darHomeHtmlParityV1 .dhp-greeting{font:650 clamp(19px,4.8vw,27px)/1.18 Georgia,serif!important;letter-spacing:-.014em!important;text-wrap:pretty!important;}",
 "#darHomeHtmlParityV1 .dhp-welcome-rule{width:min(64%,320px)!important;margin:9px 0!important;background:linear-gradient(90deg,var(--dhp-line),transparent)!important;}",
 "#darHomeHtmlParityV1 .dhp-intro{font:400 clamp(13px,3.48vw,15.5px)/1.45 system-ui,-apple-system,sans-serif!important;padding:0!important;text-wrap:pretty!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad{margin:7px 0 10px!important;padding:5px 0 7px!important;min-height:0!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad-label{margin-bottom:5px!important;}",
 "#darHomeHtmlParityV1 .dhp-quote{line-height:1.42!important;}",
 "/* DAR TEST HOME EDITORIAL HIERARCHY V59: compact rhythm; original text, player and prayer untouched. */",
 "#darHomeHtmlParityV1 .dhp-home-source-v55{display:block!important;margin:clamp(10px,2vw,15px) 0 clamp(15px,3vw,20px)!important;padding:0!important;color:var(--dhp-gold)!important;letter-spacing:.1em!important;line-height:1.5!important;text-wrap:balance!important;}",
 "#darHomeHtmlParityV1 .dhp-home-source-v55::after{content:\"\"!important;display:block!important;width:100%!important;height:1px!important;margin-top:13px!important;background:linear-gradient(90deg,var(--dhp-gold) 0%,color-mix(in srgb,var(--dhp-gold) 42%,transparent) 58%,transparent 100%)!important;opacity:.85!important;}",
 "#darHomeHtmlParityV1 .dhp-prayer{margin:0!important;border-color:color-mix(in srgb,var(--dhp-gold) 50%,var(--dhp-line))!important;}",
 "#darHomeHtmlParityV1 .dhp-welcome{position:relative!important;display:block!important;margin:clamp(12px,2.4vw,18px) 0 0!important;padding:clamp(10px,2.1vw,14px) 0 0!important;border:0!important;border-top:1px solid color-mix(in srgb,var(--dhp-gold) 44%,var(--dhp-line))!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;}",
 "#darHomeHtmlParityV1 .dhp-welcome::before{content:none!important;display:none!important;box-shadow:none!important;}",
 "#darHomeHtmlParityV1 .dhp-greeting{margin:0!important;font:650 clamp(20px,3.6vw,24px)/1.19 \"Iowan Old Style\",Georgia,serif!important;letter-spacing:-.012em!important;max-width:100%!important;overflow-wrap:break-word!important;text-wrap:balance!important;color:var(--dhp-ink)!important;}",
 "#darHomeHtmlParityV1 .dhp-welcome-rule{display:block!important;position:relative!important;width:min(100%,430px)!important;max-width:none!important;height:1px!important;margin:clamp(9px,1.7vw,12px) 0 clamp(9px,1.7vw,12px)!important;background:linear-gradient(90deg,var(--dhp-gold) 0%,color-mix(in srgb,var(--dhp-gold) 57%,transparent) 60%,transparent 100%)!important;opacity:.84!important;border:0!important;}",
 "#darHomeHtmlParityV1 .dhp-welcome-rule::before{content:none!important;display:none!important;}",
 "#darHomeHtmlParityV1 .dhp-intro{margin:0!important;max-width:72ch!important;font:400 clamp(13px,2.2vw,15px)/1.47 system-ui,-apple-system,sans-serif!important;color:var(--dhp-muted)!important;text-wrap:balance!important;hyphens:none!important;overflow-wrap:break-word!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad{display:block!important;position:relative!important;margin:clamp(13px,2.5vw,18px) 0 clamp(13px,2.5vw,18px)!important;padding:clamp(11px,2.1vw,14px) clamp(12px,2.4vw,16px) clamp(11px,2.1vw,14px)!important;border:1px solid color-mix(in srgb,var(--dhp-gold) 34%,var(--dhp-line))!important;border-inline-start:2px solid var(--dhp-gold)!important;border-radius:0 13px 13px 0!important;background:linear-gradient(110deg,color-mix(in srgb,var(--dhp-gold) 5%,transparent) 0%,transparent 88%)!important;box-shadow:none!important;overflow:visible!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad::before{content:none!important;display:none!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad-label{display:flex!important;align-items:center!important;gap:9px!important;margin:0 0 clamp(7px,1.4vw,10px)!important;font-size:clamp(9.5px,1.5vw,11px)!important;line-height:1.35!important;letter-spacing:.105em!important;color:var(--dhp-gold)!important;}",
 "#darHomeHtmlParityV1 .dhp-isnad-label::after{content:\"\"!important;display:block!important;flex:1 1 auto!important;min-width:18px!important;height:1px!important;background:linear-gradient(90deg,color-mix(in srgb,var(--dhp-gold) 57%,transparent),transparent)!important;}",
 "#darHomeHtmlParityV1 .dhp-quote{display:block!important;margin:0!important;padding:0!important;border:0!important;font:550 clamp(14px,2.25vw,16px)/1.43 \"Iowan Old Style\",Georgia,serif!important;color:var(--dhp-ink)!important;text-wrap:balance!important;}",
 "#darHomeHtmlParityV1 .dhp-quote-text{display:block!important;max-width:64ch!important;margin:0!important;text-wrap:balance!important;hyphens:none!important;overflow-wrap:break-word!important;}",
 "#darHomeHtmlParityV1 .dhp-quote-source{display:block!important;margin:clamp(6px,1.35vw,9px) 0 0!important;font:600 clamp(10px,1.7vw,12px)/1.35 system-ui,-apple-system,sans-serif!important;color:var(--dhp-muted)!important;text-align:end!important;}",
 "#darHomeHtmlParityV1 .dhp-quickbar{margin-top:0!important;}",
 "@media(max-width:359px){#darHomeHtmlParityV1 .dhp-greeting{font-size:19px!important;}#darHomeHtmlParityV1 .dhp-isnad{padding-inline:12px!important;}#darHomeHtmlParityV1 .dhp-home-source-v55{letter-spacing:.06em!important;}}",
 "@media(min-width:700px){#darHomeHtmlParityV1 .dhp-welcome{margin-top:18px!important;}#darHomeHtmlParityV1 .dhp-isnad{margin-top:18px!important;}}",
 /* DAR TEST SHORTCUTS: quick Qibla opens the existing camera/compass sheet, not the settings page. */
 "#darHomeHtmlParityV1 .dhp-quickbar{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:10px 0 13px!important;}",
 "#darHomeHtmlParityV1 .dhp-quick{min-height:66px!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:10px!important;padding:9px 13px!important;border-radius:17px!important;text-align:start!important;}",
 "#darHomeHtmlParityV1 .dhp-quick .dhp-icon3d{width:38px!important;height:38px!important;flex:0 0 38px!important;}",
 "#darHomeHtmlParityV1 .dhp-quick b{font-size:clamp(11px,2.8vw,14px)!important;line-height:1.25!important;}",
 "#darHomeHtmlParityV1 .dhp-quick-label{min-width:0!important;display:flex!important;flex-direction:column!important;gap:3px!important;justify-content:center!important;}",
 "#darHomeHtmlParityV1 .dhp-quick-label small{display:block!important;font-size:10px!important;line-height:1.2!important;color:var(--dhp-muted)!important;font-weight:450!important;}",
 "#darHomeHtmlParityV1 .dhp-quick-qibla{justify-content:flex-start!important;border-color:var(--dhp-capsule-accent,var(--dhp-line))!important;}",
 "#darHomeHtmlParityV1 .dhp-quick-qibla .dhp-icon3d{width:43px!important;height:43px!important;flex-basis:43px!important;}",
 "@media(max-width:359px){#darHomeHtmlParityV1 .dhp-quick{padding:8px!important;gap:6px!important;}#darHomeHtmlParityV1 .dhp-quick .dhp-icon3d{width:32px!important;height:32px!important;flex-basis:32px!important;}}",
 "html,html body{overscroll-behavior-y:none!important;}",
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
  if(inp){
   var pill=root.querySelector(".dhp-search-pill");
   if(pill)pill.addEventListener("click",function(e){if(e.target.closest("#dhpSearchClear"))return;inp.focus()});
   inp.addEventListener("input",input);
   inp.addEventListener("focus",function(){root.querySelector(".dhp-search-box").classList.add("is-focused")});
   inp.addEventListener("blur",function(){root.querySelector(".dhp-search-box").classList.remove("is-focused")});
   inp.addEventListener("keydown",function(e){
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
 if(name==="qibla"){openQuickQibla();return}
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
 var box=root.querySelector("#dhpResults"), clear=root.querySelector("#dhpSearchClear");
 var q=String(inp.value||"").trim();
 if(clear)clear.hidden=!q;
 inp.setAttribute("aria-expanded",q.length>=2?"true":"false");
 if(q.length<2){box.hidden=true;box.replaceChildren();return}
 inputTimer=setTimeout(function(){
  var api=window.DarTestSmartSearchV48;
  var start=api&&api.load?api.load():Promise.resolve();
  Promise.resolve(start).then(function(){
   if(!inp.isConnected||inp.value.trim()!==q)return;
   var found=api&&api.find?api.find(q).slice(0,9):[];
   box.replaceChildren();
   var title=document.createElement("div");title.className="dhp-results-head";
   var heading=document.createElement("strong");heading.textContent="Suchergebnisse";
   var count=document.createElement("span");count.textContent=found.length+" Treffer";
   title.append(heading,count);box.append(title);
   var list=document.createElement("div");list.className="dhp-results-list";
   if(!found.length){
    var empty=document.createElement("p");empty.className="dhp-empty-search";
    empty.textContent="Keine direkten Treffer. Versuche eine andere Schreibweise oder einen verwandten Begriff.";
    list.append(empty);
   }
   found.forEach(function(a){
    var b=document.createElement("button");b.type="button";b.className="dhp-result";b.setAttribute("role","option");
    b.dataset.dhpRoute=a.hash?"hash":(a.route||"topics");
    if(a.hash)b.dataset.dhpValue=a.hash;
    var label=document.createElement("strong");label.className="dhp-result-title";
    label.textContent=a.label||a.title||"";
    var kind=document.createElement("span");kind.className="dhp-result-group";
    kind.textContent=a.group==="Beiträge"?"Beitrag":(a.group||"Wissen");
    b.append(label,kind);list.append(b);
   });
   box.append(list);box.hidden=false;
  }).catch(function(){box.hidden=true;inp.setAttribute("aria-expanded","false")});
 },120);
}
function updateBrand(){
 var root=document.getElementById(ID);if(!root)return;
 var real=document.querySelector(".top-shell .brand-main .logo,.top-shell .brand-main img.logo,.top-shell .brand img");
 var seal=root.querySelector("#dhpBrandSeal");
 if(!seal)return; // Legacy Home brand removed; upper fixed header owns the seal.
 if(real&&real.getAttribute("src")&&!seal.querySelector("img")){
  var img=document.createElement("img");img.src=real.currentSrc||real.getAttribute("src");img.alt="DĀR AL TAWḤĪD";
  seal.replaceChildren(img);
 }
}
function transliteratePrayer(name){
 var words={"fajr":"Faǧr","fadschar":"Faǧr","fadsr":"Faǧr","dhuhr":"Ẓuhr","zuhr":"Ẓuhr","dhur":"Ẓuhr","dohr":"Ẓuhr","asr":"ʿAṣr","asar":"ʿAṣr","maghrib":"Maghrib","magrib":"Maghrib","isha":"ʿIshāʾ","ischaa":"ʿIshāʾ","ischā":"ʿIshāʾ","ischāʾ":"ʿIshāʾ","isha'a":"ʿIshāʾ"};
 return words[String(name||"").toLowerCase().replace(/[^a-z\u00e4\u00f6\u00fc\u00df\u0101\u02bf\u02be]/g,"")]||name;
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
 if(name)root.querySelector("#dhpPrayerName").textContent=transliteratePrayer(name);
 if(hour)root.querySelector("#dhpPrayerClock").textContent=hour;
 root.querySelector("#dhpPrayerRemain").textContent=remaining;
 if(date)root.querySelector("#dhpPrayerDate").textContent=date;
 root.querySelector("#dhpPrayerHijri").textContent=hijri;
 if(place)root.querySelector("#dhpPrayerPlace").textContent=place;
}
function recent(){
 var box=document.getElementById(ID);
 if(!box)return;
 // Read the same canonical posts collection used by the established V3 renderer.
 // Never scrape the hidden V3 HTML tree to populate the visible DHP capsules.
 var list=[];
 try{
  if(typeof posts!=="undefined"&&Array.isArray(posts)){
   list=posts.filter(function(p){return p&&p.id&&p.title}).slice(0,2).map(function(p){
    var sub=[p.scholar,p.category].filter(Boolean).join(" · ");
    return {id:String(p.id),title:String(p.title),sub:sub||"Qurʾān · Sunnah · Aṯār"};
   });
  }
 }catch(e){console.warn("DĀR TEST latest posts model",e)}
 if(!list.length)return;
 var sig=list.map(function(a){return a.id+"|"+a.title}).join(";");
 if(lastItems===sig)return;
 lastItems=sig;
 var target=box.querySelector("#dhpPosts");
 target.replaceChildren();
 list.slice(0,4).forEach(function(p,i){
  var btn=document.createElement("button");btn.type="button";
  btn.className=i?"dhp-article dhp-post-capsule":"dhp-panel dhp-feature dhp-post-capsule";
  btn.dataset.dhpRoute="post";btn.dataset.dhpValue=p.id;
  if(i===0){
   var tag=document.createElement("span");tag.className="dhp-kicker";tag.textContent="NEUESTE VERÖFFENTLICHUNG";
   var h=document.createElement("h3");h.textContent=p.title;
   var meta=document.createElement("p");meta.textContent=p.sub||"Qurʾān · Sunnah · Āthār";
   btn.append(tag,h,meta);
  }else{
   var d=document.createElement("div"),h2=document.createElement("h3"),p2=document.createElement("p");
   h2.textContent=p.title;p2.textContent=p.sub;
   d.append(h2,p2);btn.append(d);
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
 if(name&&name.length<70)root.querySelector("#dhpQResume").textContent=name;
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
function loadTestSmartProfileV1(){
 /* Only this active adult /test renderer owns the enhancement; no Visitor/Kids. */
 if(!document.getElementById("darTestSmartProfileCssV1")){
  var css=document.createElement("link");css.rel="stylesheet";css.id="darTestSmartProfileCssV1";
  css.href="/test/assets/dar-smart-profile-v1.css?v=20261030-v5";document.head.appendChild(css);
 }
 if(!document.getElementById("darTestSmartProfileScriptV1")){
  var script=document.createElement("script");script.id="darTestSmartProfileScriptV1";
  script.src="/test/assets/dar-smart-profile-v1.js?v=20261030-v5";script.defer=true;
  document.head.appendChild(script);
 }
 /* Responsive daily knowledge and profile-adaptive navigation: only adult DĀR TEST. */
 if(!document.getElementById("darDailyHubStylesV1")){
  var dailyStyles=document.createElement("link");dailyStyles.rel="stylesheet";dailyStyles.id="darDailyHubStylesV1";
  dailyStyles.href="/test/assets/dar-daily-hub-v1.css?v=20261030-v1";document.head.appendChild(dailyStyles);
 }
 if(!document.getElementById("darDailyHubScriptV1")){
  var dailyScript=document.createElement("script");dailyScript.id="darDailyHubScriptV1";
  dailyScript.src="/test/assets/dar-daily-hub-v1.js?v=20261030-v1";dailyScript.defer=true;
  document.head.appendChild(dailyScript);
 }
}
function init(){
 loadTestSmartProfileV1();
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

/* DAT SMART PRAYER CLOCK V1 — same canonical prayer feed; no new calculation engine.
   Adult visitor / Dar Test only. Locally hosted display font, reduced-motion safe. */
;(function(){
"use strict";
var path=location.pathname||"/";
var visitor=path==="/"||path==="/index.html"||path==="/pwa"||path.indexOf("/pwa/")===0;
var test=/^\/test(?:\/|$)/.test(path)&&!/^\/test\/kids(?:\/|$)/.test(path);
if(!visitor&&!test||window.__datSmartPrayerClockV1)return;
window.__datSmartPrayerClockV1=true;
var CSS=String.raw`
@font-face{font-family:"DAT Prayer Numerals";src:url("/assets/fonts/fraunces-latin.woff2") format("woff2");font-style:normal;font-weight:400 900;font-display:swap}
#darHomeHtmlParityV1 .dat-smart-prayer{
 --dat-ink:var(--dhp-ink,var(--text,#243e31));
 --dat-num:var(--gold2,var(--dat-ink));
 --dat-muted:var(--muted,#66796b);
 --dat-gold:var(--dhp-gold,var(--gold,#9c8552));
 --dat-line:var(--line,rgba(100,120,100,.24));
 --dat-capsule:var(--soft,rgba(100,140,100,.08));
 box-sizing:border-box;display:block;width:100%;min-width:0;margin:7px 0 11px!important;
 padding:11px 12px 10px!important;border:0!important;
 border-top:1px solid var(--dat-line)!important;border-bottom:1px solid var(--dat-line)!important;
 border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;
 text-align:left;position:relative;color:var(--dat-ink);cursor:pointer;
 font-family:"Manrope",-apple-system,BlinkMacSystemFont,sans-serif;
 -webkit-tap-highlight-color:transparent;
}
#darHomeHtmlParityV1 .dat-smart-prayer:focus-visible{outline:2px solid var(--dat-gold)!important;outline-offset:3px}
#darHomeHtmlParityV1 .datp-head,#darHomeHtmlParityV1 .datp-top,#darHomeHtmlParityV1 .datp-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;min-width:0}
#darHomeHtmlParityV1 .datp-head{margin-bottom:8px}
#darHomeHtmlParityV1 .datp-kicker{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.13em;color:var(--dat-ink);white-space:nowrap}
#darHomeHtmlParityV1 .datp-goldbar{width:3px;height:12px;border-radius:4px;background:var(--dat-gold)}
#darHomeHtmlParityV1 .datp-location{font-size:10px;font-weight:650;line-height:1.25;color:var(--dat-muted);max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#darHomeHtmlParityV1 .datp-live{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:750;letter-spacing:.08em;color:var(--dat-muted)}
#darHomeHtmlParityV1 .datp-beacon{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--dat-gold);animation:datp-breathe 2.8s ease-in-out infinite}
#darHomeHtmlParityV1 .datp-grid{display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);gap:10px;align-items:center;min-width:0}
#darHomeHtmlParityV1 .datp-item{min-width:0}
#darHomeHtmlParityV1 .datp-right{text-align:right}
#darHomeHtmlParityV1 .datp-caption{display:block;color:var(--dat-muted);font-size:10px;font-weight:750;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#darHomeHtmlParityV1 .datp-prayername{font-family:"Cormorant Garamond","Iowan Old Style",Georgia,serif;font-size:16px;font-weight:700;letter-spacing:0;color:var(--dat-ink)}
#darHomeHtmlParityV1 .datp-dot{padding:0 3px;color:var(--dat-gold)}
#darHomeHtmlParityV1 .datp-number,#darHomeHtmlParityV1 .datp-counter,#darHomeHtmlParityV1 .datp-now{
 font-family:"DAT Prayer Numerals","Bodoni 72",Didot,Georgia,serif!important;
 font-variant-numeric:lining-nums tabular-nums;font-feature-settings:"lnum" 1,"tnum" 1;
 font-weight:650;color:var(--dat-num);white-space:nowrap;
}
#darHomeHtmlParityV1 .datp-number{display:block;font-size:clamp(35px,10vw,44px);line-height:1.05;letter-spacing:-1.2px;margin-top:1px}
#darHomeHtmlParityV1 .datp-colon{color:var(--dat-gold)}
#darHomeHtmlParityV1 .datp-centerline{width:1px;min-height:49px;align-self:stretch;background:linear-gradient(transparent,var(--dat-line) 19%,var(--dat-line) 82%,transparent);position:relative}
#darHomeHtmlParityV1 .datp-centerline:after{content:"";position:absolute;top:50%;left:-2px;width:5px;height:5px;border-radius:100%;background:var(--dat-gold)}
#darHomeHtmlParityV1 .datp-capsule{position:relative;display:flex;justify-content:space-between;align-items:center;gap:8px;
 margin-top:8px;padding:6px 10px 8px;min-width:0;overflow:hidden;border-radius:9px;background:var(--dat-capsule)}
#darHomeHtmlParityV1 .datp-until{display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:750;color:var(--dat-ink);white-space:nowrap;letter-spacing:.05em}
#darHomeHtmlParityV1 .datp-ring{width:13px;height:13px;display:inline-grid;place-items:center;border:1px solid var(--dat-gold);border-radius:50%}
#darHomeHtmlParityV1 .datp-ring:before{content:"";width:4px;height:4px;border-radius:50%;background:var(--dat-gold);animation:datp-breathe 3s ease-in-out infinite}
#darHomeHtmlParityV1 .datp-counter{font-size:clamp(20px,6.7vw,26px);line-height:1.05;letter-spacing:.2px}
#darHomeHtmlParityV1 .datp-track{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--dat-line)}
#darHomeHtmlParityV1 .datp-fill{display:block;height:100%;background:var(--dat-gold);width:0%;transition:width 1s linear}
#darHomeHtmlParityV1 .datp-foot{padding-top:8px;align-items:end}
#darHomeHtmlParityV1 .datp-dates{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:baseline;gap:5px;min-width:0;flex:1 1 auto;overflow:hidden;white-space:nowrap}
#darHomeHtmlParityV1 .datp-greg{font-size:clamp(9px,2.8vw,11px);font-weight:750;line-height:1.35;color:var(--dat-ink);white-space:nowrap;flex:none}
#darHomeHtmlParityV1 .datp-hijri{font-size:clamp(9px,2.55vw,10px);line-height:1.35;color:var(--dat-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
#darHomeHtmlParityV1 .datp-local{display:flex;flex-direction:row;align-items:baseline;gap:5px;flex:none}
#darHomeHtmlParityV1 .datp-local-label{font-size:8px;font-weight:750;letter-spacing:.06em;color:var(--dat-muted)}
#darHomeHtmlParityV1 .datp-now{font-size:clamp(20px,5.8vw,25px);line-height:1.05}
#darHomeHtmlParityV1 .datp-seconds{font-size:.52em;color:var(--dat-muted)}
#darHomeHtmlParityV1 .datp-date-dot{font-size:11px;color:var(--dat-gold);flex:none}
@media(max-width:430px){#darHomeHtmlParityV1 .datp-local-label{display:none}}
@media(max-width:359px){#darHomeHtmlParityV1 .datp-foot{display:block}#darHomeHtmlParityV1 .datp-dates{width:100%;justify-content:center}#darHomeHtmlParityV1 .datp-local{margin-top:3px;justify-content:center}#darHomeHtmlParityV1 .datp-local-label{display:inline}}
@media(min-width:700px){#darHomeHtmlParityV1 .dat-smart-prayer{padding:14px 22px!important}#darHomeHtmlParityV1 .datp-number{font-size:clamp(46px,5vw,64px)}#darHomeHtmlParityV1 .datp-counter{font-size:32px}#darHomeHtmlParityV1 .datp-greg,#darHomeHtmlParityV1 .datp-hijri{font-size:13px}#darHomeHtmlParityV1 .datp-now{font-size:30px}#darHomeHtmlParityV1 .datp-foot{padding-top:11px}}
html[data-theme="light"][data-theme-variant="salbei"] #darHomeHtmlParityV1 .dat-smart-prayer{--dat-num:#3f5d4b;--dat-gold:#8b7648;--dat-capsule:#e8ede4;--dat-ink:#17211b;--dat-muted:#536057}
html[data-theme="eisgold"] #darHomeHtmlParityV1 .dat-smart-prayer{--dat-num:#3d5664;--dat-gold:#977744;--dat-capsule:#edf3f5;--dat-ink:#233e4b;--dat-muted:#5c6a73}
html[data-theme="royal"] #darHomeHtmlParityV1 .dat-smart-prayer{--dat-num:#eddaab;--dat-gold:#c7aa6d;--dat-capsule:rgba(196,175,120,.11);--dat-ink:#f4efe1;--dat-muted:#b8c8d6}
html[data-theme="bordeaux"] #darHomeHtmlParityV1 .dat-smart-prayer{--dat-num:#e9ce9a;--dat-gold:#c8a16e;--dat-capsule:rgba(200,161,110,.12);--dat-ink:#fbefeb;--dat-muted:#d0bdbf}
html[data-theme="dark"] #darHomeHtmlParityV1 .dat-smart-prayer,html[data-theme="dar-al-layl"] #darHomeHtmlParityV1 .dat-smart-prayer{--dat-num:#e6d5a9;--dat-gold:#c3a46b;--dat-capsule:rgba(195,164,107,.11);--dat-ink:#eee8da;--dat-muted:#bdbbb2}
html[data-theme="soft"] #darHomeHtmlParityV1 .dat-smart-prayer{--dat-num:var(--gold2,#4d6257);--dat-capsule:var(--soft,#edf0e7)}
body.is-home-route[data-dat-smart-prayer="ready"] #darHomeHtmlParityV1 .dhp-prayer{display:none!important}
body.is-home-route[data-dat-smart-prayer="ready"] #darHomeHtmlParityV1 #dhpPrayerNativeMount.top-shell.theme-hero-shell{display:none!important}
body.is-home-route[data-dat-smart-prayer="ready"] #darHomeHtmlParityV1 #dhpNativePrayerStatus{display:none!important}
body.is-home-route[data-dat-smart-prayer="ready"] #headerPrayerStatus{
 position:absolute!important;width:1px!important;height:1px!important;min-height:0!important;max-height:1px!important;
 margin:0!important;padding:0!important;overflow:hidden!important;clip-path:inset(50%)!important;opacity:0!important;pointer-events:none!important
}
@keyframes datp-breathe{0%,100%{opacity:.48;transform:scale(.8)}50%{opacity:1;transform:scale(1.16)}}
@media(max-width:360px){
 #darHomeHtmlParityV1 .dat-smart-prayer{padding-inline:9px!important}
 #darHomeHtmlParityV1 .datp-grid{gap:7px}
 #darHomeHtmlParityV1 .datp-caption{font-size:9px}
 #darHomeHtmlParityV1 .datp-prayername{font-size:14px}
 #darHomeHtmlParityV1 .datp-number{font-size:34px}
 #darHomeHtmlParityV1 .datp-counter{font-size:20px}
 #darHomeHtmlParityV1 .datp-greg{font-size:10px}
 #darHomeHtmlParityV1 .datp-now{font-size:21px}
}
@media(prefers-reduced-motion:reduce){#darHomeHtmlParityV1 .datp-beacon,#darHomeHtmlParityV1 .datp-ring:before{animation:none}#darHomeHtmlParityV1 .datp-fill{transition:none}}
`;
if(!document.getElementById("datSmartPrayerClockStyleV1")){
 var style=document.createElement("style");style.id="datSmartPrayerClockStyleV1";
 style.textContent=CSS;document.head.appendChild(style);
}
var labels={
 de:["GEBETSZEITEN","LIVE","AKTUELL","NÄCHSTES","BIS","ORTSZEIT"],
 en:["PRAYER TIMES","LIVE","CURRENT","NEXT","UNTIL","LOCAL TIME"],
 tr:["NAMAZ VAKİTLERİ","CANLI","ŞİMDİ","SONRAKİ","KALAN","YEREL SAAT"],
 ar:["مَوَاقِيتُ الصَّلَاة","مباشر","الحالية","القادمة","حتى","الوقت المحلي"],
 ku:["DEMÊN NIMÊJÊ","LIVE","NIHA","PAŞÊ","HEYA","DEMA HERÊMÎ"],
 ckb:["کاتەکانی نوێژ","ڕاستەوخۆ","ئێستا","دواتر","تا","کاتی ناوخۆیی"],
 bs:["NAMASKA VREMENA","UŽIVO","TRENUTNO","SLJEDEĆE","DO","LOKALNO VRIJEME"]
};
function locale(){
 var l="";try{l=localStorage.getItem("darAdultPreferredLocaleV1")||""}catch(e){}
 return labels[l]?l:(labels[(document.documentElement.lang||"de").split("-")[0]]?(document.documentElement.lang||"de").split("-")[0]:"de");
}
var card=null,previousKey="",targetDate=null,prayerStartDate=null,lastSource=0,remainingTime=null;
var canonicalHub=null,canonicalOldDisplay="",canonicalOldPriority="";
function hideCanonicalSource(hub){
 if(canonicalHub&&canonicalHub!==hub)restoreCanonicalSource();
 if(!canonicalHub){canonicalHub=hub;canonicalOldDisplay=hub.style.getPropertyValue("display");canonicalOldPriority=hub.style.getPropertyPriority("display")}
 hub.style.setProperty("display","none","important");
}
function restoreCanonicalSource(){
 if(!canonicalHub)return;
 if(canonicalOldDisplay)canonicalHub.style.setProperty("display",canonicalOldDisplay,canonicalOldPriority);
 else canonicalHub.style.removeProperty("display");
 canonicalHub=null;canonicalOldDisplay="";canonicalOldPriority="";
}
function text(node,sel){var el=node&&node.querySelector(sel);return el?String(el.textContent||"").replace(/\s+/g," ").trim():""}
function clockText(s){var m=String(s||"").match(/(?:^|[^\d])(\d{1,2}):(\d{2})(?:[^\d]|$)/);return m?String(m[1]).padStart(2,"0")+":"+m[2]:""}
function normalizePrayer(name){
 var s=String(name||"").trim(),key=s.toLocaleLowerCase("en").replace(/[\s.\u0300-\u036f]/g,"");
 var map={fajr:"Faǧr",fadschar:"Faǧr",dhuhr:"Ẓuhr",zuhr:"Ẓuhr",dohr:"Ẓuhr",asr:"ʿAṣr",asar:"ʿAṣr",maghrib:"Maghrib",magrib:"Maghrib",isha:"ʿIshāʾ",ischaa:"ʿIshāʾ",ischā:"ʿIshāʾ",ischāʾ:"ʿIshāʾ"};
 if(locale()==="de")return map[key]||s;
 return s;
}
function make(){
 if(card)return card;
 var root=document.getElementById("darHomeHtmlParityV1");
 if(!root)return null;
 card=document.createElement("button");
 card.type="button";card.className="dat-smart-prayer";card.dataset.dhpRoute="prayer";
 card.setAttribute("aria-label","Gebetszeiten öffnen");
 card.innerHTML='<span class="datp-head"><span class="datp-kicker"><span class="datp-goldbar" aria-hidden="true"></span><span data-dat-label="0">GEBETSZEITEN</span><span class="datp-live"><span class="datp-beacon" aria-hidden="true"></span><span data-dat-label="1">LIVE</span></span></span><span class="datp-location" data-dat-place></span></span>'+
 '<span class="datp-grid"><span class="datp-item"><span class="datp-caption"><span data-dat-label="2">AKTUELL</span><span class="datp-dot">·</span><span class="datp-prayername" data-dat-current-name></span></span><span class="datp-number" data-dat-current-time>--:--</span></span><span class="datp-centerline" aria-hidden="true"></span><span class="datp-item datp-right"><span class="datp-caption"><span data-dat-label="3">NÄCHSTES</span><span class="datp-dot">·</span><span class="datp-prayername" data-dat-next-name></span></span><span class="datp-number" data-dat-next-time>--:--</span></span></span>'+
 '<span class="datp-capsule"><span class="datp-until"><span class="datp-ring" aria-hidden="true"></span><span data-dat-label="4">BIS</span> <span data-dat-until-name></span></span><span class="datp-counter" data-dat-counter>--:--:--</span><span class="datp-track" aria-hidden="true"><span class="datp-fill" data-dat-fill></span></span></span>'+
 '<span class="datp-foot"><span class="datp-dates"><span class="datp-greg" data-dat-date></span><span class="datp-date-dot" aria-hidden="true">·</span><span class="datp-hijri" data-dat-hijri></span></span><span class="datp-local"><span class="datp-local-label" data-dat-label="5">ORTSZEIT</span><span class="datp-now"><span data-dat-now>--:--</span><span class="datp-seconds" data-dat-seconds>:--</span></span></span></span>';
 return card;
}
function put(sel,v){var x=card&&card.querySelector(sel);if(x&&x.textContent!==v)x.textContent=v}
function when(time,now,dayShift){
 var p=time.split(":").map(Number),d=new Date(now);d.setHours(p[0],p[1],0,0);if(dayShift)d.setDate(d.getDate()+dayShift);return d;
}
function refreshSource(now){
 var root=document.getElementById("darHomeHtmlParityV1"),hub=document.getElementById("headerPrayerStatus");
 if(!root||!hub||!document.body.classList.contains("is-home-route"))return false;
 var zones=Array.from(hub.querySelectorAll(".header-prayer-zone")).map(function(z){
  return {caption:text(z,".header-prayer-zone__caption"),name:text(z,".header-prayer-name"),time:clockText(text(z,".header-prayer-hour"))};
 });
 var timed=zones.filter(function(z){return z.name&&z.time});
 var current=timed.find(function(z){return /aktuell|current|jetzt|şimdi|trenut|الحالي|ئێستا/i.test(z.caption)})||timed[0];
 var next=timed.find(function(z){return /nächste|next|sonraki|sljede|القادم|دواتر/i.test(z.caption)})||timed[1];
 if(!current||!next||!next.time||!current.time)return false;
 var x=make();if(!x)return false;
 var source=root.querySelector(".dhp-home-source-v55");
 if(!source)return false;
 if(x.previousElementSibling!==source)source.insertAdjacentElement("afterend",x);
 /* Never let the previous visible mirror survive or reappear beneath Smart Prayer. */
 var oldMirror=root.querySelector("#dhpPrayerNativeMount");if(oldMirror)oldMirror.remove();
 var friday=root.querySelector("#dhpFridayMirror");if(friday&&friday.previousElementSibling!==x)x.insertAdjacentElement("afterend",friday);
 hideCanonicalSource(hub); /* The original engine stays mounted and keeps supplying live values. */
 document.body.setAttribute("data-dat-smart-prayer","ready");
 var signature=current.name+"|"+current.time+"|"+next.name+"|"+next.time+"|"+locale();
 if(signature!==previousKey){
  previousKey=signature;
  var tgt=when(next.time,now,0);if(tgt.getTime()<=now.getTime()-1000)tgt.setDate(tgt.getDate()+1);
  var beg=when(current.time,now,0);
  if(beg>now)beg.setDate(beg.getDate()-1);
  targetDate=tgt;prayerStartDate=beg;
  put("[data-dat-current-name]",normalizePrayer(current.name));
  put("[data-dat-current-time]",current.time);
  put("[data-dat-next-name]",normalizePrayer(next.name));
  put("[data-dat-next-time]",next.time);
  put("[data-dat-until-name]",normalizePrayer(next.name));
  var lbl=labels[locale()]||labels.de;
  x.querySelectorAll("[data-dat-label]").forEach(function(e){e.textContent=lbl[Number(e.dataset.datLabel)]||""});
 }
 var place=text(hub,".header-prayer-hub__place").replace(/^[\s·➜→↗⌖📍]+/gu,"");
 var hijri=text(hub,".header-prayer-hub__hijri").replace(/^[^\p{L}\p{N}]+/gu,"").trim();
 var greg=text(hub,".header-prayer-hub__date").replace(/^[^\p{L}\p{N}]+/gu,"").trim();
 if(!greg)greg=new Intl.DateTimeFormat(locale()==="de"?"de-DE":locale(),{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}).format(now);
 put("[data-dat-place]",place);
 put("[data-dat-date]",greg);
 put("[data-dat-hijri]",hijri);
 x.setAttribute("aria-label",current.name+" "+current.time+", "+next.name+" "+next.time+". "+(place||"Gebetszeiten"));
 return true;
}
function update(){
 if(!document.body)return;
 if(!document.body.classList.contains("is-home-route")){document.body.removeAttribute("data-dat-smart-prayer");restoreCanonicalSource();return}
 if(document.hidden)return;
 var now=new Date();
 if(!card||now.getTime()-lastSource>4500){lastSource=now.getTime();if(!refreshSource(now)){
  document.body.removeAttribute("data-dat-smart-prayer");restoreCanonicalSource();return;
 }}
 if(!card||!targetDate)return;
 if(now.getTime()>=targetDate.getTime()+1000){lastSource=0;refreshSource(now)}
 var diff=Math.max(0,Math.ceil((targetDate.getTime()-now.getTime())/1000));
 var h=Math.floor(diff/3600),m=Math.floor(diff%3600/60),s=diff%60;
 function two(n){return String(n).padStart(2,"0")}
 put("[data-dat-counter]",two(h)+":"+two(m)+":"+two(s));
 var progress=prayerStartDate&&targetDate>prayerStartDate?(now.getTime()-prayerStartDate.getTime())/(targetDate.getTime()-prayerStartDate.getTime()):0;
 var fill=card.querySelector("[data-dat-fill]");if(fill)fill.style.width=(Math.max(0,Math.min(1,progress))*100).toFixed(3)+"%";
 put("[data-dat-now]",two(now.getHours())+":"+two(now.getMinutes()));
 put("[data-dat-seconds]",":"+two(now.getSeconds()));
}
function boot(){update();window.setInterval(update,1000);document.addEventListener("visibilitychange",function(){lastSource=0;update()});window.addEventListener("pageshow",function(){lastSource=0;update()});window.addEventListener("dar-adult-locale-changed",function(){previousKey="";lastSource=0;update()})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
