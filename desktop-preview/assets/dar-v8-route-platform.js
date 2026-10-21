/* DĀR AL TAWḤĪD · browser-only V8 route intelligence.
 * Layout navigation belongs to this public browser site; the native/PWA tabbar is untouched.
 * Dynamic responses are retrieval summaries, never invented religious interpretations.
 */
(function(global){"use strict";
if(global.DARV8Routes)return;
const iconRoot="/assets/dar-3d-icons/";
const map={
 start:["Start","home.png","Dein täglicher Zugang zu Wissen und Quellen."],
 quran:["Qurʾān","quran.png","Lesen, hören, Sūren suchen, Tafsīr und Tadabbur nutzen."],
 beitraege:["Beiträge","posts.png","Aussagen mit prüfbaren Quellen, Themen und Gelehrten."],
 beitrag:["Beitrag","posts.png","Originalbeitrag mit Nachweis und verwandten Aussagen."],
 hadith:["Ḥadīṯ & Āṯār","hadith.png","Überlieferungen mit Sammlung, Nummer und Bewertung durchsuchen."],
 dua:["Duʿāʾ","dua.png","Bittgebete mit Arabisch, Bedeutung und Quellenangabe."],
 wissen:["Masǧid al-ʿIlm","ilm.png","Fachbegriffe, Gelehrte und verknüpfte Wissensquellen."],
 suche:["Intelligenter Wissenschat","spark.png","Stelle eine Frage und öffne überprüfbare Fundstellen aus unserer Website."],
 bibliothek:["Bibliothek","library.png","Bücher, Publikationen und Fachgebiete intelligent erschließen."],
 werk:["Werk","library.png","Werkdetails und weiterführende Quellen."],
 frauen:["Frauen im Islam","frauen.png","Fiqh, Überlieferungen, Familie und religiöses Wissen."],
 frauenbereich:["Frauen · Fachbereich","frauen.png","Geprüfte Aussagen und Quellen zum gewählten Themenbereich."],
 gebetszeiten:["Gebetszeiten","prayer.png","Berechnet am freigegebenen Standort, mit nächstem Gebet und Countdown."],
 mehr:["Mehr entdecken","more.png","Alle Werkzeuge, Sammlungen und Einstellungen an einem Ort."],
 quellen:["Quellenarchiv","hadith.png","Direktnachweise und ihre ursprünglichen Fundstellen."],
 quiz:["Wissen prüfen","quiz.png","Überprüfte Lernfragen und Erklärungen."],
 propheten:["Propheten","prophets.png","Überlieferte Lebensgeschichten und belegte Qurʾānstellen."],
 prophet:["Prophet","prophets.png","Biografie und verifizierte Quellen."],
 thema:["Thema","ilm.png","Passende Beiträge nach Fachgebiet."],
 zakat:["Zakāt","zakat.png","Berechnungen und Quellen zum jeweiligen Sachverhalt."],
 einstellungen:["Einstellungen","settings.png","Darstellung und persönliche Browserpräferenzen."],
 downloads:["Downloads","spark.png","Web-App und native App entdecken."]
};
const links=[
 ["start","Start","home.png"],["quran","Qurʾān","quran.png"],
 ["beitraege","Beiträge","posts.png"],["hadith","Ḥadīṯ","hadith.png"],
 ["dua","Duʿāʾ","dua.png"],["wissen","Wissen","ilm.png"],
 ["bibliothek","Bibliothek","library.png"],["frauen","Frauen","frauen.png"],
 ["gebetszeiten","Gebetszeiten","prayer.png"],["quiz","Quiz","quiz.png"],
 ["mehr","Mehr","more.png"]
];
const related={
 quran:["suche","hadith","dua"],beitraege:["suche","wissen","quellen"],hadith:["suche","beitraege","quellen"],
 dua:["suche","quran","hadith"],wissen:["suche","beitraege","hadith"],suche:["wissen","beitraege","hadith"],
 bibliothek:["suche","beitraege","quellen"],frauen:["suche","hadith","wissen"],
 gebetszeiten:["quran","dua","mehr"],mehr:["gebetszeiten","bibliothek","frauen"],
 quellen:["beitraege","hadith","suche"],quiz:["wissen","beitraege","hadith"]
};
function escape(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function img(icon){return '<img src="'+iconRoot+escape(icon)+'?v=1095" alt="" loading="lazy" decoding="async" onerror="this.style.display=\'none\'">'}
function anchor(key,label){const data=map[key]||map.mehr;return '<a class="dar-v8-route-link desktop-link" href="/?page='+encodeURIComponent(key)+'" data-page="'+escape(key)+'">'+img(data[1])+'<span>'+escape(label||data[0])+'</span><span class="arrow" aria-hidden="true">↗</span></a>'}
function htmlFor(key){
 if(key==="start")return "";
 const data=map[key]||[key,"ilm.png","Erkunde alle verfügbaren Inhalte und ihre belegten Quellen."];
 const peers=related[key]||["suche","wissen","bibliothek"];
 return '<section class="dar-v8-route-hero" aria-label="'+escape(data[0])+'">'+
 '<div class="dar-v8-route-copy"><div class="dar-v8-route-eyebrow">DĀR AL TAWḤĪD <span> / </span> SMART KNOWLEDGE</div>'+
 '<h1>'+escape(data[0])+'</h1><p>'+escape(data[2])+'</p>'+
 '<div class="dar-v8-route-actions">'+anchor("suche","Wissenschat öffnen")+
 '</div></div><div class="dar-v8-route-visual" aria-hidden="true">'+img(data[1])+'</div>'+
 '<div class="dar-v8-route-related"><span>WEITER ENTDECKEN</span>'+peers.map(x=>anchor(x)).join("")+'</div></section>';
}
let prayerWatch=null,menuBound=false;
function updateNav(key){
 document.body.dataset.v8Route=key;
 document.querySelectorAll("[data-v8-route]").forEach(el=>{
  const k=el.getAttribute("data-v8-route"),active=k===key||k==="mehr"&&["frauen","hadith","bibliothek","gebetszeiten","dua","quiz","quellen","einstellungen","downloads","propheten"].includes(key);
  el.classList.toggle("active",active);
  if(active)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");
 });
 const menu=document.getElementById("darV8MoreSheet");
 if(menu){menu.hidden=true;const toggle=document.getElementById("darV8MoreToggle");if(toggle)toggle.setAttribute("aria-expanded","false")}
 const title=document.getElementById("darV8BreadLabel");if(title)title.textContent=(map[key]||map.mehr)[0];
}
function setupMenu(){
 if(menuBound)return;menuBound=true;
 document.addEventListener("click",function(e){
  const b=e.target.closest?.("[data-v8-toggle-more]");
  const sheet=document.getElementById("darV8MoreSheet"),toggle=document.getElementById("darV8MoreToggle");
  if(b&&sheet){const opened=sheet.hidden;sheet.hidden=!opened;toggle?.setAttribute("aria-expanded",String(opened));return}
  if(sheet&&!sheet.hidden&&!e.target.closest?.("#darV8MoreSheet")){sheet.hidden=true;toggle?.setAttribute("aria-expanded","false")}
 });
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){const m=document.getElementById("darV8MoreSheet");if(m)m.hidden=true;document.getElementById("darV8MoreToggle")?.setAttribute("aria-expanded","false")}
 });
}
function refreshPrayer(){
 const pane=document.getElementById("darV8PrayerOverview");if(!pane)return;
 const source=document.getElementById("darV8PrayerStrip");
 const times=pane.querySelectorAll("[data-v8-copy-prayer]");
 times.forEach(el=>{const from=source?.querySelector('[data-v8-prayer="'+el.getAttribute("data-v8-copy-prayer")+'"] b');el.textContent=from?.textContent?.trim()||"—"});
 const next=document.getElementById("darV8NextName"),time=document.getElementById("darV8NextTime"),count=document.getElementById("darV8Countdown");
 const out=pane.querySelector("[data-v8-prayer-status]");if(out)out.textContent=[next?.textContent,time?.textContent,count?.textContent].filter(Boolean).join(" · ");
}
function initPrayer(){
 if(prayerWatch){prayerWatch.disconnect();prayerWatch=null}
 const root=document.getElementById("darV8PrayerOverview");if(!root)return;
 refreshPrayer();
 const source=document.getElementById("darV8PrayerStrip");
 if(source&&global.MutationObserver){prayerWatch=new MutationObserver(refreshPrayer);prayerWatch.observe(source,{subtree:true,childList:true,characterData:true})}
 root.querySelector("[data-v8-location]")?.addEventListener("click",()=>{
  const sourceButton=document.getElementById("prLocate")||document.getElementById("prCityOpen");
  sourceButton?.click();
 });
}
function initHadith(ctx){
 const input=document.getElementById("darV8HadithQuery"),results=document.getElementById("darV8HadithResults"),count=document.getElementById("darV8HadithCount");
 if(!input||!results)return;
 const text=(s)=>String(s==null?"":s);
 let cache=[];
 const rank=(h,q)=>{
  const terms=ctx.searchFold(q).split(" ").filter(t=>t.length>1);if(!terms.length)return 1;
  const title=ctx.searchFold([h.bookTitle,h.chapterTitle,h.hadithNumber,h.id].join(" "));
  const description=ctx.searchFold([h.german,h.tags?.join(" "),h.grade].join(" "));
  let score=0;for(const t of terms){if(title.includes(t))score+=7;else if(description.includes(t))score+=2;else return 0}return score;
 };
 function paint(){
  const q=input.value.trim(),found=cache.map(h=>({h,score:rank(h,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,25);
  count.textContent=String(found.length)+(cache.length&&found.length===25?"+":"")+" Ergebnisse angezeigt";
  results.replaceChildren();
  if(!found.length){const p=document.createElement("p");p.className="dar-v8-empty";p.textContent=cache.length?"Keine passende Überlieferung in unserem derzeit durchsuchbaren Katalog gefunden.":"Überlieferungen werden geladen …";results.append(p);return}
  for(const {h} of found){
    const card=document.createElement("article");card.className="dar-v8-hadith-card";
    const ref=document.createElement("div");ref.className="dar-v8-hadith-ref";ref.textContent=[h.bookTitle,h.chapterTitle,h.hadithNumber?"Nr. "+h.hadithNumber:"",h.grade].filter(Boolean).join(" · ");
    const body=document.createElement("p");body.textContent=text(h.german).slice(0,900);
    const source=document.createElement("small");source.textContent=h.id+" · Katalogeintrag; arabisches Original nur anzeigen, falls belegt";
    card.append(ref,body,source);results.append(card);
  }
 }
 input.addEventListener("input",paint);
 fetch("/test/data/hadith/search-index.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("index "+r.status);return r.json()}).then(records=>{
  if(!input.isConnected)return;
  cache=Array.isArray(records)?records:[];
  if(!cache.length)throw Error("no canonical hadith search data");
  paint();
 }).catch(()=>{
  if(!input.isConnected)return;
  count.textContent="Index derzeit nicht abrufbar";
  results.textContent="Die Ḥadīṯ-Suche konnte den Quellenindex nicht laden. Es werden keine Überlieferungen erfunden. Bitte erneut versuchen.";
 });
 paint();
}
function enhanceSearch(ctx){
 const form=document.getElementById("darV8ChatForm"),input=document.getElementById("siteSearch"),summary=document.getElementById("darV8ChatSummary");
 if(!form||!input||!summary)return;
 function update(){
  const q=input.value.trim();
  const n=document.querySelectorAll("#searchResults .list-row").length;
  summary.replaceChildren();
  const msg=document.createElement("p");
  msg.textContent=q?(n?"Für „"+q+"“ wurden "+n+" Fundstellen angezeigt. Öffne einen Treffer, um die Quelle zu prüfen.":"Zu dieser Anfrage ist derzeit keine passende Fundstelle im geladenen Website-Index vorhanden."):"Stelle eine Frage. Die Suche zeigt nur tatsächlich vorhandene Quellen auf DĀR AL TAWḤĪD.";
  summary.append(msg);
 }
 form.addEventListener("submit",e=>{e.preventDefault();input.dispatchEvent(new Event("input",{bubbles:true}));update();document.getElementById("searchResults")?.scrollIntoView({block:"nearest",behavior:"smooth"})});
 input.addEventListener("input",update);
 document.querySelectorAll("[data-v8-ask]").forEach(btn=>btn.addEventListener("click",()=>{input.value=btn.getAttribute("data-v8-ask")||"";input.dispatchEvent(new Event("input",{bubbles:true}));update()}));
 update();
}
function init(key,ctx){
 updateNav(key);setupMenu();if(prayerWatch&&key!=="gebetszeiten"){prayerWatch.disconnect();prayerWatch=null}
 if(key==="gebetszeiten")initPrayer();
 if(key==="hadith")initHadith(ctx);
 if(key==="suche")enhanceSearch(ctx);
}
global.DARV8Routes={htmlFor,init,links,escape};
})(window);
