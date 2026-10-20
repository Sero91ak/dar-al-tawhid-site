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
var quicks=[
 ["qibla","qibla.png","Qibla"],["theme","spark.png","Design"],
 ["settings","settings.png","Einstellungen"],["library","library.png","Bibliothek"]
];
var links=[
 ["frauen","frauen.png","Frauen","Wissen & Fiqh"],["hadith","hadith.png","Ḥadīṯ-Werke","Sammlungen"],
 ["books","library.png","Bibliothek","Bücher & PDFs"],["scholars","scholars.png","Gelehrte","Biografien"],
 ["books","scale.png","Quellen","Nachweise"],["duas","dua.png","Duʿāʾ","Bittgebete"],
 ["topics","topics.png","ʿAqīdah","Grundlagen"],["quran","quran.png","Qurʾān","Lesen & hören"],
 ["quiz","quiz.png","Quiz","Wissen prüfen"]
];
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(z){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[z]})}
function route(dest,val){if(dest==="library")dest="bibliothek"; // Open the real app library, not only the home-page tile grid.
 try{if(typeof window.navigate==="function"){window.navigate(dest,val||"");return}}catch(e){}
 try{if(typeof navigate==="function"){navigate(dest,val||"");return}}catch(e){}
 location.hash="#"+dest+(val?"/"+encodeURIComponent(val):"");
}
function nativeText(node,query){var el=node&&node.querySelector(query);return el?String(el.textContent||"").replace(/\s+/g," ").trim():""}
function html(){
 var q=quicks.map(function(a){return '<button type="button" class="dhp-quick" data-dhp-route="'+a[0]+'"><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/'+a[1]+'" alt="" loading="lazy" decoding="async"></span><b>'+a[2]+'</b></button>'}).join("");
 var l=links.map(function(a){return '<button type="button" class="dhp-library-tile" data-dhp-route="'+a[0]+'"><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/'+a[1]+'" alt="" loading="lazy" decoding="async"></span><b>'+a[2]+'</b><small>'+a[3]+'</small></button>'}).join("");
 return '<div class="dhp-content">'+
  '<div class="dhp-kicker">BEITRÄGE NACH QURʾĀN, SUNNAH &amp; ĀTHĀR</div>'+
  '<div class="dhp-brand"><div class="dhp-seal" id="dhpBrandSeal"></div><div class="dhp-brand-copy"><h1>DĀR AL TAWḤĪD</h1><span class="dhp-brand-rule" aria-hidden="true"></span><small>Wissen · Überlieferung · Erkenntnis</small></div></div>'+
  '<button type="button" class="dhp-prayer" data-dhp-route="prayer" aria-label="Gebetszeiten öffnen"><div class="dhp-prayer-top"><div><div class="dhp-kicker">NÄCHSTES GEBET</div><b id="dhpPrayerName">Gebetszeiten</b><div class="dhp-tiny dhp-muted">Standortabhängige Gebetszeiten</div></div><div class="dhp-prayer-right"><div class="dhp-clock" id="dhpPrayerClock">–</div><div class="dhp-tiny dhp-muted" id="dhpPrayerRemain"></div></div></div><div class="dhp-prayer-footer"><span id="dhpPrayerDate">Gebetskalender</span><span id="dhpPrayerHijri"></span><span id="dhpPrayerPlace">Standort</span></div></button>'+
  '<h2 class="dhp-greeting">As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh</h2>'+
  '<section class="dhp-isnad" aria-labelledby="dhpQuoteTitle"><div class="dhp-isnad-label" id="dhpQuoteTitle">ÜBERLIEFERUNGSMAẞSTAB</div><blockquote class="dhp-quote">„Dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.“<div class="dhp-tiny dhp-quote-source">Muḥammad ibn Sīrīn</div></blockquote></section>'+
  '<p class="dhp-intro">Willkommen bei <strong>DĀR AL TAWḤĪD</strong> – einer geordneten Wissens-App mit Beiträgen aus <strong>Qurʾān</strong>, <strong>Sunnah</strong>, den <strong>Āthār der frühen Imāme</strong> und einer umfangreichen Duʿāʾ-Sammlung aus Qurʾān und authentischer Sunnah.</p>'+
  '<div class="dhp-quickbar" aria-label="Schnellzugriffe">'+q+'</div>'+
  '<div class="dhp-search-box"><label class="dhp-search" for="dhpSearch"><span aria-hidden="true" class="dhp-search-icon">⌕</span><input id="dhpSearch" type="search" autocomplete="off" spellcheck="false" placeholder="Wissen, Qurʾān, Ḥadīṯ, Themen suchen …" aria-label="Intelligente Suche"><button type="button" id="dhpSearchClear" aria-label="Suche leeren">×</button></label><div id="dhpResults" class="dhp-results" hidden role="listbox"></div></div>'+
  '<section class="dhp-section dhp-quran-section" aria-label="Qurʾān"><button type="button" class="dhp-quran-capsule" data-dhp-route="quran"><span class="dhp-icon3d" aria-hidden="true"><img src="/test/assets/dar-3d-icons/quran.png" alt="" loading="lazy" decoding="async"></span><span><strong>Qurʾān</strong><small id="dhpQResume">Lesen · hören · weiterlernen</small></span></button></section>'+
  '<section class="dhp-section" aria-labelledby="dhpTodayTitle"><div class="dhp-head"><h2 id="dhpTodayTitle">Heute für dich</h2><span class="dhp-tiny dhp-muted">Tägliche Impulse</span></div><div class="dhp-two"><button type="button" class="dhp-panel dhp-smallcard" data-dhp-route="recent" id="dhpTodayArticle"><span class="dhp-kicker">EMPFEHLUNG</span><h3 id="dhpTodayName">Wissen vertiefen</h3><p>Ein ausgewählter Beitrag aus der App.</p></button><button type="button" class="dhp-panel dhp-smallcard" data-dhp-route="duas"><span class="dhp-kicker">DUʿĀʾ</span><h3>Bittgebet des Tages</h3><p>Mit Quellen und direktem Zugang.</p></button></div></section>'+
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
,
 "#darHomeHtmlParityV1{--dhp-light:color-mix(in srgb,var(--dhp-paper) 86%,var(--dhp-bg) 14%);--dhp-halo:color-mix(in srgb,var(--dhp-accent) 15%,transparent 85%);--dhp-goldline:color-mix(in srgb,var(--dhp-gold) 72%,var(--dhp-line) 28%);}",
 "#darHomeHtmlParityV1 .dhp-content{padding-top:17px!important;padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important;}",
 "#darHomeHtmlParityV1 .dhp-kicker{letter-spacing:.14em!important;}",
 "#darHomeHtmlParityV1 .dhp-brand{margin:12px 0 20px!important;align-items:center!important;gap:13px!important;}",
 "#darHomeHtmlParityV1 .dhp-brand-copy{flex:1;min-width:0!important;overflow:visible;}",
 "#darHomeHtmlParityV1 .dhp-brand h1{font:650 clamp(22px,5.75vw,30px)/1.15 \"Iowan Old Style\",Georgia,serif!important;letter-spacing:.015em!important;white-space:nowrap!important;}",
 "#darHomeHtmlParityV1 .dhp-brand small{font-size:clamp(11px,2.6vw,13px)!important;line-height:1.35!important;margin-top:9px!important;color:var(--dhp-muted)!important;}",
 "#darHomeHtmlParityV1 .dhp-brand-rule{display:block;height:2px;max-width:100%;margin-top:12px;overflow:hidden;background:linear-gradient(90deg,var(--dhp-goldline) 0%,color-mix(in srgb,var(--dhp-gold) 38%,transparent) 48%,transparent 98%)!important;mask-image:linear-gradient(180deg,#000 0%,transparent 100%);border:0!important;}",
 "#darHomeHtmlParityV1 .dhp-seal{width:53px!important;height:53px!important;border-color:var(--dhp-goldline)!important;box-shadow:0 5px 18px rgba(0,0,0,.04)!important;background:transparent!important;}",
 "#darHomeHtmlParityV1 .dhp-seal:empty{display:none!important;}",
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
 "#darHomeHtmlParityV1 .dhp-quote{border:0!important;padding:0!important;margin:0!important;font:500 14px/1.52 \"Iowan Old Style\",Georgia,serif!important;color:var(--dhp-ink)!important;}",
 "#darHomeHtmlParityV1 .dhp-quote-source{margin-top:5px!important;font:600 11px/1.4 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;color:var(--dhp-muted)!important;}",
 "#darHomeHtmlParityV1 .dhp-intro{line-height:1.57!important;margin-bottom:16px!important;}",
 "#darHomeHtmlParityV1 .dhp-intro strong{color:var(--dhp-accent)!important;}",
 "#darHomeHtmlParityV1 .dhp-quickbar{gap:9px!important;margin:14px 0 17px!important;}",
 "#darHomeHtmlParityV1 .dhp-quick{min-height:89px!important;border:1px solid var(--dhp-line)!important;border-radius:17px!important;padding:11px 4px 8px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--dhp-paper) 93%,var(--dhp-bg) 7%),var(--dhp-paper))!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;}",
 "#darHomeHtmlParityV1 .dhp-quick b{display:block!important;font:650 clamp(10px,2.35vw,12px)/1.25 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;}",
 "#darHomeHtmlParityV1 .dhp-icon3d{width:40px;height:40px;flex:none;display:grid!important;place-items:center!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;font-size:0!important;}",
 "#darHomeHtmlParityV1 .dhp-icon3d img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 5px rgba(0,0,0,.11));transform:translateZ(0);}",
 "#darHomeHtmlParityV1 .dhp-quick .dhp-icon3d{width:38px!important;height:38px!important;}",
 "#darHomeHtmlParityV1 .dhp-search-box{margin-top:0!important;padding:0 13px!important;background:transparent!important;box-shadow:none!important;border:1px solid var(--dhp-line)!important;border-radius:18px!important;}",
 "#darHomeHtmlParityV1 .dhp-search{min-height:49px!important;gap:11px!important;}",
 "#darHomeHtmlParityV1 .dhp-search-icon{display:grid;place-items:center;color:var(--dhp-accent)!important;font-size:26px!important;}",
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
 "#darHomeHtmlParityV1 .dhp-head button{font:700 11px/1.25 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif!important;border:1px solid var(--dhp-line)!important;border-radius:999px!important;padding:8px 12px!important;background:var(--dhp-paper)!important;white-space:nowrap!important;}",
 "#darHomeHtmlParityV1 .dhp-panel{border:1px solid var(--dhp-line)!important;border-radius:18px!important;background:var(--dhp-paper)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)!important;}",
 "#darHomeHtmlParityV1 .dhp-two{gap:10px!important;}",
 "#darHomeHtmlParityV1 .dhp-smallcard{min-height:110px!important;padding:14px 13px!important;}",
 "#darHomeHtmlParityV1 .dhp-smallcard h3{font-size:clamp(16px,3.9vw,18px)!important;line-height:1.25!important;}",
 "#darHomeHtmlParityV1 .dhp-feature{padding:14px 15px!important;background:linear-gradient(135deg,color-mix(in srgb,var(--dhp-paper) 78%,var(--dhp-accent) 22%),var(--dhp-paper))!important;margin-bottom:10px!important;}",
 "#darHomeHtmlParityV1 .dhp-feature h3{font-size:clamp(18px,4.6vw,21px)!important;line-height:1.25!important;}",
 "#darHomeHtmlParityV1 .dhp-feature p{margin-bottom:0!important;}",
 "#darHomeHtmlParityV1 .dhp-article{border-bottom:1px solid var(--dhp-line)!important;padding:13px 2px!important;background:transparent!important;}",
 "#darHomeHtmlParityV1 .dhp-article:last-child{border-bottom:0!important;}",
 "#darHomeHtmlParityV1 .dhp-library{gap:10px!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile{min-height:103px!important;padding:10px 5px 12px!important;gap:4px!important;border:1px solid var(--dhp-line)!important;border-radius:17px!important;background:radial-gradient(circle at 85% 3%,color-mix(in srgb,var(--dhp-accent) 9%,transparent),transparent 55%),var(--dhp-paper)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;overflow:hidden!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile .dhp-icon3d{width:41px!important;height:41px!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile b{font-size:clamp(11px,2.8vw,13px)!important;line-height:1.2!important;}",
 "#darHomeHtmlParityV1 .dhp-library-tile small{font-size:10px!important;line-height:1.25!important;}",
 "#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-quran-capsule,.dhp-panel,.dhp-article,.dhp-library-tile,.dhp-head button){transition:box-shadow .22s ease,border-color .22s ease,transform .22s ease,background .22s ease!important;}",
 "#darHomeHtmlParityV1 :is(.dhp-prayer,.dhp-quick,.dhp-quran-capsule,.dhp-panel,.dhp-article,.dhp-library-tile,.dhp-head button):is(:hover,:focus-visible){border-color:var(--dhp-accent)!important;box-shadow:0 0 0 4px var(--dhp-halo),0 8px 20px rgba(0,0,0,.065)!important;transform:translateY(-1px)!important;outline:none!important;}",
 "@media(hover:none){#darHomeHtmlParityV1 :is(.dhp-quick,.dhp-library-tile,.dhp-quran-capsule,.dhp-panel):active{box-shadow:0 0 0 4px var(--dhp-halo)!important;transform:scale(.988)!important;}}",
 "@media(max-width:375px){#darHomeHtmlParityV1 .dhp-content{padding-left:14px!important;padding-right:14px!important;}#darHomeHtmlParityV1 .dhp-brand h1{font-size:clamp(21px,5.65vw,25px)!important;}#darHomeHtmlParityV1 .dhp-brand{gap:10px!important;}#darHomeHtmlParityV1 .dhp-seal{width:46px!important;height:46px!important;}#darHomeHtmlParityV1 .dhp-quickbar{gap:6px!important;}#darHomeHtmlParityV1 .dhp-library{gap:7px!important;}#darHomeHtmlParityV1 .dhp-library-tile{padding-left:3px!important;padding-right:3px!important;}}"
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