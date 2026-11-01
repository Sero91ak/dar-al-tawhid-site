/* DĀR AL TAWḤĪD · V8 Browser Portal · responsive conversation, locale, Quran search and native audio player bridge.
 * Adult public browser only. No fabricated answers, translations, locations or Quran verses. */
(function(w,d){"use strict";
const supported=["de","ar","en","tr","ku","ckb","bs"],KEY="darAdultPreferredLocaleV1";
const langNames={de:"Deutsch",ar:"العربية الفصحى",en:"English",tr:"Türkçe",ku:"Kurmancî",ckb:"سۆرانی",bs:"Bosanski"};
let languageData=null,languagePromise=null,aliasPromise=null,aliasMap=new Map(),quranIndexPromise=null,currentPage="";
const norm=v=>String(v||"").toLocaleLowerCase("und").normalize("NFKD")
 .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي")
 .replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/[ʿʾʻ’']/g,"")
 .replace(/ā/g,"a").replace(/ī/g,"i").replace(/ū/g,"u").replace(/ḥ/g,"h").replace(/ḫ/g,"kh")
 .replace(/ṣ/g,"s").replace(/ḍ/g,"d").replace(/ṭ/g,"t").replace(/ẓ/g,"z").replace(/ġ/g,"gh")
 .replace(/š/g,"sh").replace(/ğ/g,"g").replace(/[^a-z0-9\u0600-\u06ff]+/g," ").trim().replace(/\s+/g," ");
const escape=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fallback={searchExplain:"Stelle eine Frage – wir durchsuchen ausschließlich unsere vorhandenen Quellen.",searchButton:"Quellen finden",searchPlaceholder:"Frage zu Qurʾān, Sunnah und Āṯār …",noResults:"Keine belegte Fundstelle in unserem indexierten Bestand.",unverified:"Diese Sprachfassung ist noch nicht fachlich geprüft. Der deutsche Originaltext bleibt maßgeblich.",langPicker:"Sprache",awaiting:"Fachübersetzung in Vorbereitung",readGerman:"Deutschen Originaltext lesen",sources:"Fundstellen",back:"Zurück",searchTitle:"Quellenbasierter Wissenschat",open:"Fundstelle öffnen"};
function locale(){try{const v=localStorage.getItem(KEY);return supported.includes(v)?v:"de"}catch(e){return"de"}}
function t(k){const l=locale();return languageData?.locales?.[l]?.messages?.[k]||languageData?.locales?.de?.messages?.[k]||fallback[k]||k}
function fetchLanguages(){if(languagePromise)return languagePromise;
 languagePromise=fetch("/desktop-preview/i18n-core-v1/locales.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("locales");return r.json()}).then(j=>{languageData=j;return j}).catch(()=>null);return languagePromise}
function fetchAliases(){if(aliasPromise)return aliasPromise;
 aliasPromise=fetch("/desktop-preview/i18n-core-v1/terms.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("aliases");return r.json()}).then(j=>{
  (j.entries||[]).forEach(x=>{[x.id,x.arabic,...(x.aliases||[])].forEach(a=>{const key=norm(a);if(key&&x.id)aliasMap.set(key,x.id)})});return aliasMap;
 }).catch(()=>aliasMap);return aliasPromise}
function searchQuery(input){
 let q=norm(input).replace(/\btawrid\b|\btawheed\b|\btauhid\b|\btevhid\b/g,"tawhid")
 .replace(/\biman\b|\biiman\b/g,"iman").replace(/\bquran\b|\bkoran\b|\bqur an\b/g,"quran");
 // Existing synonym data is used for searching, never as theological definitions.
 for(const [alias,id] of [...aliasMap.entries()].filter(([a,id])=>a.length>=4&&a!==id).sort((a,b)=>b[0].length-a[0].length)){
  if(q===alias){q=id;break}
  if(q.includes(" "+alias+" ")||q.startsWith(alias+" ")||q.endsWith(" "+alias)){
   q=(" "+q+" ").split(" "+alias+" ").join(" "+id+" ").trim();
  }
 }
 return q.replace(/\b(mit|und|oder|bei|von|zum|zur|fur|für|was|ist|sind|wie|der|die|das|den|ein|eine|ich|bitte|bedeutet|erklare|erklare|such|suche|finde|mir|zeigen|uber|über)\b/g," ").replace(/\s+/g," ").trim()||q;
}
function colorLocale(){
 d.body.dataset.v8Locale=locale();
 const b=d.getElementById("darV8LangToggle");if(b){b.textContent=(langNames[locale()]||"Deutsch")+" ▾";b.setAttribute("aria-label",t("langPicker"))}
 const sel=d.getElementById("darV8LanguageSelect");if(sel)sel.value=locale();
 const notice=d.getElementById("darV8TranslationNotice");if(notice)notice.textContent=locale()==="de"?"Deutsche Originaltexte und Quellen bleiben unverändert.":t("unverified");
 const root=d.getElementById("darV8LocalePanel");if(root){root.lang=locale();root.dir=["ar","ckb"].includes(locale())?"rtl":"ltr"}
 const labels=d.querySelectorAll("[data-v8-ui-key]");labels.forEach(el=>{const tx=t(el.dataset.v8UiKey);if(tx)el.textContent=tx});

 const translationRoutes={start:"start",quran:"quran",beitraege:"posts",hadith:"hadith",bibliothek:"library",frauen:"women",mehr:"more"};
 for(const [route,key] of Object.entries(translationRoutes)){
  const title=t(key);
  d.querySelectorAll('.dar-v8-mobile-dock [data-v8-route="'+route+'"] > span').forEach(el=>{el.textContent=title});
  d.querySelectorAll('.dar-v8-sidebar [data-v8-route="'+route+'"] span').forEach(el=>{if(!el.querySelector("img"))el.textContent=title});
 }
 const routeKey=translationRoutes[d.body?.dataset?.darV8Route];
 if(routeKey){
  const routeHero=d.querySelector("#pageRoot .dar-v8-route-copy h1");
  if(routeHero)routeHero.textContent=t(routeKey);
  const routeBreadcrumb=d.getElementById("darV8BreadLabel");
  if(routeBreadcrumb)routeBreadcrumb.textContent=t(routeKey);
 }
 const chatKicker=d.querySelector(".dar-v8-messenger-header>div>span");
 if(chatKicker)chatKicker.textContent="DĀR AL TAWḤĪD · "+t("searchTitle");
 const input=d.getElementById("siteSearch");if(input)input.placeholder=t("searchPlaceholder");
 const label=d.getElementById("darV8SourceSearchLabel");if(label)label.textContent=t("searchExplain");
}
function selectLanguage(code){if(!supported.includes(code))return;try{localStorage.setItem(KEY,code)}catch(e){}
 colorLocale();w.dispatchEvent(new CustomEvent("dar-v8-locale-changed",{detail:{locale:code}}));
 const m=d.getElementById("darV8LangMenu");if(m)m.hidden=true;
}
function setupLanguages(){
 if(d.getElementById("darV8LangToggle"))return;
 const mount=d.querySelector(".dar-v8-top-actions");if(!mount)return;
 const toggle=d.createElement("button");toggle.id="darV8LangToggle";toggle.type="button";toggle.className="dar-v8-lang-toggle";toggle.setAttribute("aria-controls","darV8LangMenu");toggle.setAttribute("aria-expanded","false");
 mount.insertBefore(toggle,d.getElementById("darV8ThemeToggle")||mount.firstChild);
 const menu=d.createElement("section");menu.id="darV8LangMenu";menu.className="dar-v8-language-menu";menu.hidden=true;menu.setAttribute("role","group");menu.setAttribute("aria-label","Sprache wählen");
 const heading=d.createElement("strong");heading.textContent="Sprache · Language";menu.append(heading);
 supported.forEach(code=>{const btn=d.createElement("button");btn.type="button";btn.textContent=langNames[code];btn.dataset.lang=code;btn.addEventListener("click",()=>{selectLanguage(code);toggle.setAttribute("aria-expanded","false")});menu.append(btn)});
 const notice=d.createElement("small");notice.textContent="UI-Sprache: Fachbeiträge bleiben in der überprüften Originalfassung, bis eine Fachübersetzung freigegeben ist.";menu.append(notice);d.body.append(menu);
 toggle.addEventListener("click",()=>{menu.hidden=!menu.hidden;toggle.setAttribute("aria-expanded",String(!menu.hidden))});
 d.addEventListener("click",e=>{if(!menu.hidden&&!menu.contains(e.target)&&!toggle.contains(e.target)){menu.hidden=true;toggle.setAttribute("aria-expanded","false")}});
 d.addEventListener("keydown",e=>{if(e.key==="Escape"){menu.hidden=true;toggle.setAttribute("aria-expanded","false");if(d.body.classList.contains("dar-v8-player-fullscreen"))togglePlayer(false)}});
 colorLocale();fetchLanguages().then(colorLocale);fetchAliases();
}
function settings(){
 const select=d.getElementById("darV8LanguageSelect");if(!select)return;
 select.value=locale();select.onchange=()=>selectLanguage(select.value);colorLocale();
}
function element(tag,cls,value){const e=d.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e}
function appendMessage(role,msg,sourceList,quranList){
 const log=d.getElementById("darV8Messages");if(!log)return;
 const entry=element("article","dar-v8-bubble "+(role==="user"?"is-user":"is-system"));
 const label=element("small","dar-v8-bubble-label",role==="user"?"Du":"DĀR AL TAWḤĪD · "+t("sources"));entry.append(label);
 entry.append(element("p","dar-v8-bubble-copy",msg));
 if(sourceList?.length){
  const group=element("div","dar-v8-bubble-sources");
  sourceList.slice(0,8).forEach(s=>{const url=new URL(s.href,location.origin);if(url.origin!==location.origin)return;
   const a=element("a","desktop-link dar-v8-bubble-source");a.href=url.pathname+url.search+url.hash;a.dataset.page=s.page||"suche";
   a.append(element("span","",s.kind||"Fundstelle"),element("strong","",s.title),element("small","",t("open")+" ↗"));group.append(a)});
  entry.append(group)
 }
 if(quranList?.length){
  const group=element("div","dar-v8-bubble-sources");
  quranList.slice(0,5).forEach(x=>{const a=element("a","desktop-link dar-v8-bubble-source");
   a.href="/?page=quran&surah="+encodeURIComponent(x.surahId)+"&ayah="+encodeURIComponent(x.ayah);
   a.dataset.page="quran";a.append(element("span","","Qurʾān · "+x.surahId+":"+x.ayah),element("strong","",x.surahName||"Āyah"),element("small","",(x.de||x.ar||"").slice(0,180)));group.append(a)});
  entry.append(group)
 }
 const time=element("time","dar-v8-bubble-time",new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}));entry.append(time);log.append(entry);
 log.scrollTop=log.scrollHeight;entry.scrollIntoView({block:"nearest",behavior:"auto"});return entry;
}
function quranIndex(){if(quranIndexPromise)return quranIndexPromise;
 quranIndexPromise=fetch("/data/quran-search-index.json",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("Qurʾān-Index HTTP "+r.status);return r.json()}).then(v=>Array.isArray(v)?v:[]).catch(()=>[]);
 return quranIndexPromise;
}
function quranResults(raw,rows,max=8){
 const q=searchQuery(raw);const tokens=norm(q).split(" ").filter(x=>x.length>1);
 if(!tokens.length||!rows.length)return [];
 const exact=/^(\d{1,3})[:.](\d{1,3})$/.exec(raw.trim());
 if(exact)return rows.filter(x=>x.surahId===Number(exact[1])&&x.ayah===Number(exact[2])).slice(0,max);
 const result=[];
 for(const row of rows){
  const tags=Array.isArray(row.keywordIds)?row.keywordIds.join(" "):"";
  const hay=norm([row.surahName,row.surahArabic,row.de,row.ar,row.tr,row.tagText,tags].join(" "));
  const found=tokens.filter(token=>hay.includes(token));
  if(found.length===tokens.length){result.push({row,score:found.length*6+(hay.includes(q)?6:0)});}
 }
 return result.sort((a,b)=>b.score-a.score).slice(0,max).map(x=>x.row);
}
function initChat(){
 const form=d.getElementById("darV8ChatForm"),input=d.getElementById("siteSearch"),log=d.getElementById("darV8Messages");
 if(!form||!input||!log||form.dataset.v8Bound)return;form.dataset.v8Bound="1";
 appendMessage("bot",t("searchExplain")+" "+(locale()==="de"?"Ich zeige nur vorhandene Fundstellen; ich erfinde keine religiösen Antworten.":""));
 const send=async()=>{
  const raw=input.value.trim();if(!raw)return;
  appendMessage("user",raw);
  const match=searchQuery(raw);
  // The canonical search renderer owns source indexing; do not duplicate data or fabricate text.
  input.value=match;input.dispatchEvent(new Event("input",{bubbles:true}));
  const links=[...d.querySelectorAll("#searchResults a.list-row")].slice(0,12).map(a=>({
   href:a.getAttribute("href")||"",page:a.dataset.page||"",title:a.querySelector("strong")?.textContent||a.textContent.trim().slice(0,160),
   kind:a.querySelector(".meta,.search-kind")?.textContent||"Website"}));
  input.value="";
  const bot=appendMessage("bot",links.length?
   "Ich habe "+links.length+" passende Fundstellen im geladenen Website-Index gefunden. Die Originalaussagen und Nachweise kannst du unten öffnen.":
   t("noResults")+" Ich prüfe zusätzlich den Qurʾān-Suchindex.",links);
  try{const q=await quranIndex();if(!bot?.isConnected)return;const hits=quranResults(raw,q,5);
   if(hits.length){
    if(!links.length)bot.querySelector(".dar-v8-bubble-copy").textContent="Im Qurʾān-Index wurden zu deiner Suche passende Verse ermittelt. Bitte lies die Āyāt im Zusammenhang.";
    const holder=element("div","dar-v8-bubble-sources");
    hits.forEach(x=>{const a=element("a","desktop-link dar-v8-bubble-source");a.dataset.page="quran";
      a.href="/?page=quran&surah="+x.surahId+"&ayah="+x.ayah;
      a.append(element("span","","Qurʾān · "+x.surahId+":"+x.ayah),element("strong","",x.surahName||"Qurʾān"),element("small","",(x.de||x.ar||"").slice(0,170)));holder.append(a)});
    bot.insertBefore(holder,bot.querySelector("time"));
   }else if(!links.length)bot.querySelector(".dar-v8-bubble-copy").textContent=t("noResults")+" Die Qurʾān-Suche hat ebenfalls keine vollständige Übereinstimmung gefunden.";
  }catch(e){ /* Honest website-only fallback remains visible. */ }
  log.scrollTop=log.scrollHeight;
 };
 form.addEventListener("submit",e=>{e.preventDefault();send()});
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
 d.querySelectorAll("[data-v8-ask]").forEach(btn=>btn.addEventListener("click",()=>{input.value=btn.dataset.v8Ask||"";form.requestSubmit()}));
 d.getElementById("darV8ChatClear")?.addEventListener("click",()=>{log.replaceChildren();appendMessage("bot",t("searchExplain"));input.focus()});
 d.getElementById("darV8ChatBack")?.addEventListener("click",()=>{location.href="/?page=start"});
 input.addEventListener("focus",()=>{d.body.classList.add("v8-chat-focused");syncVisualViewport()});
 input.addEventListener("blur",()=>{d.body.classList.remove("v8-chat-focused");syncVisualViewport()});
  const original=new URLSearchParams(location.search).get("q");
 if(original){input.value=original;form.requestSubmit()}
 colorLocale();
}
let bookMode="book";
function initQuran(){
 const launch=d.getElementById("darV8QuranAudioLaunch");if(launch)launch.onclick=()=>togglePlayer(true);
 const input=d.getElementById("bookQuranSearch"),host=d.getElementById("bookShell");
 if(!input||!host)return;
 let results=d.getElementById("darV8GlobalQuranResults");
 if(!results){results=element("section","dar-v8-quran-global-results");results.id="darV8GlobalQuranResults";results.hidden=true;
  input.closest(".quran-reading-zone")?.querySelector(".quran-layout")?.before(results);}
 input.setAttribute("aria-controls",results.id);
 const render=async()=>{
  const raw=input.value.trim();if(raw.length<2){results.hidden=true;return}
  const data=await quranIndex();if(!input.isConnected||input.value.trim()!==raw)return;
  const matches=quranResults(raw,data,16);
  results.replaceChildren();results.hidden=false;
  results.append(element("strong","dar-v8-quran-results-title",matches.length+" Qurʾān-Fundstellen · gesamte Sūren durchsuchen"));
  if(!matches.length)results.append(element("p","",t("noResults")));
  matches.forEach(x=>{const a=element("a","desktop-link dar-v8-quran-result");
   a.dataset.page="quran";a.href="/?page=quran&surah="+x.surahId+"&ayah="+x.ayah;
   a.append(element("strong","",x.surahName+" · "+x.surahId+":"+x.ayah),
    element("span","",(x.de||x.ar||"").slice(0,240)));results.append(a)});
 };
 let timer;input.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(render,240)});
 const btns=[...d.querySelectorAll(".quran-reading-zone .toolbar button")];
 btns.forEach((btn,i)=>{btn.dataset.v8QuranMode=["book","both","translit","tafsir","tadabbur"][i]||"book";
  btn.addEventListener("click",()=>{bookMode=btn.dataset.v8QuranMode;btns.forEach(b=>{const on=b===btn;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});updateBookMode(host)});
 });
 bookMode="book";updateBookMode(host);
 host.addEventListener("click",e=>{const verse=e.target.closest?.("[data-book-ayah]");if(!verse)return;v8SelectedAyah=Number(verse.dataset.bookAyah);if(bookMode==="tafsir"||bookMode==="tadabbur")updateBookMode(host)});
 const observe=new MutationObserver(()=>updateBookMode(host));observe.observe(host,{childList:true});
}
let bookUpdating=false,v8SelectedAyah=0,v8ModeToken=0,v8TadabburPromise=null;
const v8SurahContent=new Map(),v8TafsirContent=new Map();
function loadQuranJson(prefix,surah,cache){
 if(!cache.has(surah))cache.set(surah,fetch(prefix+String(surah).padStart(3,"0")+".json",{cache:"force-cache"}).then(r=>r.ok?r.json():null).catch(()=>null));
 return cache.get(surah)
}
function displayVerified(box,records){
 box.replaceChildren();
 records.forEach(x=>{
  const card=element("article","dar-v8-quran-source-item");
  card.append(element("strong","",x.title),element("p","",x.text));
  if(x.source)card.append(element("small","",x.source));box.append(card)
 })
}
function loadTadabbur(){
 if(w.DarQuranTadabbur?.loadSurah)return Promise.resolve(w.DarQuranTadabbur);
 if(!v8TadabburPromise)v8TadabburPromise=new Promise((resolve,reject)=>{
  const s=d.createElement("script");s.src="/assets/quran-tadabbur-shared.js";
  s.onload=()=>w.DarQuranTadabbur?resolve(w.DarQuranTadabbur):reject(Error("no loader"));
  s.onerror=()=>reject(Error("source missing"));d.head.append(s)
 });
 return v8TadabburPromise;
}
function updateBookMode(host){
 if(bookUpdating||!host?.isConnected)return;bookUpdating=true;
 const token=++v8ModeToken;
 try{
  const nodes=[...host.querySelectorAll("[data-book-ayah]")];
  if(!nodes.length)return;
  const sn=Number(new URLSearchParams(location.search).get("surah"))||1;
  const available=new Set(nodes.map(x=>Number(x.dataset.bookAyah)));
  if(!available.has(v8SelectedAyah))v8SelectedAyah=Number(new URLSearchParams(location.search).get("ayah"))||Number(nodes[0].dataset.bookAyah);
  if(!available.has(v8SelectedAyah))v8SelectedAyah=Number(nodes[0].dataset.bookAyah);
  const box=d.getElementById("darV8QuranModeNote")||element("div","dar-v8-quran-mode-note");
  box.id="darV8QuranModeNote";if(!box.isConnected)host.after(box);
  host.classList.toggle("dar-v8-quran-translit-mode",bookMode==="translit");
  box.hidden=!["tafsir","tadabbur"].includes(bookMode);
  if(bookMode==="translit"){
   loadQuranJson("/content/quran/",sn,v8SurahContent).then(data=>{
    if(!host.isConnected||bookMode!=="translit"||token!==v8ModeToken)return;
    nodes.forEach(node=>{
     if(node.querySelector(".dar-v8-verse-translit"))return;
     const verse=(data?.verses||[]).find(x=>Number(x.id)===Number(node.dataset.bookAyah));
     if(verse)node.append(element("div","dar-v8-verse-translit",verse.tr_academic||verse.tr_readable||verse.tr||""))
    })
   });
  }
  if(bookMode==="tafsir"){
   box.textContent="Tafsīr für Qurʾān "+sn+":"+v8SelectedAyah+" wird aus der vorhandenen Quellenbibliothek geladen …";
   loadQuranJson("/content/tafsir/de/",sn,v8TafsirContent).then(data=>{
    if(!box.isConnected||bookMode!=="tafsir"||token!==v8ModeToken)return;
    const row=(data?.verses||[]).find(x=>Number(x.id)===v8SelectedAyah);
    if(!row){box.textContent="Für diese Āyah liegt derzeit keine Tafsīr-Erklärung im vorhandenen Bestand vor.";return}
    const entries=(Array.isArray(row.tafsir)?row.tafsir:[]).filter(x=>x?.text).map(x=>({title:x.source||"Tafsīr",text:x.text,source:data.source||""}));
    if(row.meaning)entries.unshift({title:"Qurʾān "+sn+":"+v8SelectedAyah+" · Bedeutung",text:row.meaning,source:"Qurʾān-Reader"});
    displayVerified(box,entries.length?entries:[{title:"Tafsīr",text:"Keine gesonderte Erläuterung vorhanden."}])
   })
  }
  if(bookMode==="tadabbur"){
   box.textContent="Tadabbur für Qurʾān "+sn+":"+v8SelectedAyah+" wird aus dem geprüften Salaf-Katalog geladen …";
   loadTadabbur().then(api=>api.loadSurah(sn)).then(data=>{
    if(!box.isConnected||bookMode!=="tadabbur"||token!==v8ModeToken)return;
    if(!data?.verified){box.textContent="Geprüfter Tadabbur-Katalog derzeit nicht erreichbar.";return}
    const list=(data.verses?.get(v8SelectedAyah)?.athar||[]).filter(x=>x?.text)
      .map(x=>({title:x.person||x.name||"Überlieferung",text:x.text,source:[x.source,x.grading].filter(Boolean).join(" · ")}));
    displayVerified(box,list.length?list:[{title:"Kein geprüfter Eintrag",text:"Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor."}])
   }).catch(()=>{if(box.isConnected&&bookMode==="tadabbur"&&token===v8ModeToken)box.textContent="Tadabbur derzeit nicht erreichbar."})
  }
 }finally{bookUpdating=false}
}

let playerRestoreFocus=null;
function togglePlayer(force){
 const on=typeof force==="boolean"?force:!d.body.classList.contains("dar-v8-player-fullscreen");
 const player=d.querySelector(".v8-real-player"),control=d.getElementById("darV8PlayerFullscreen");
 if(!player||!control)return;
 if(on){playerRestoreFocus=d.activeElement instanceof HTMLElement?d.activeElement:null}
 if(!on)closePicker();
 d.body.classList.toggle("dar-v8-player-fullscreen",on);
 player.setAttribute("role",on?"dialog":"region");
 if(on)player.setAttribute("aria-modal","true");else player.removeAttribute("aria-modal");
 player.setAttribute("aria-label",on?"Qurʾān – Rezitations-Player":"Qurʾān – Mini-Player");
 player.classList.toggle("dar-v8-controls-open",on||player.classList.contains("dar-v8-controls-open"));
 if(on){
  const expand=d.getElementById("darV8PlayerExpand");
  if(expand)expand.setAttribute("aria-expanded","true");
  const controls=d.getElementById("darV8PlayerControls");
  if(controls)controls.hidden=false;
 }
 control.setAttribute("aria-expanded",String(on));
 control.setAttribute("aria-label",on?"Vollbild-Player schließen":"Qurʾān-Player in voller Ansicht öffnen");
 control.textContent=on?"✕ Schließen":"⛶ Vollansicht";
 d.body.classList.toggle("dar-v8-player-dialog-open",on);
 if(on){control.focus({preventScroll:true})}
 else if(playerRestoreFocus?.isConnected && playerRestoreFocus!==control){
  playerRestoreFocus.focus({preventScroll:true});playerRestoreFocus=null;
 }
}
function installPlayer(){
 // Bind to the stable document, not to a player button that may be recreated
 // when the public homepage rerenders after its async content index loads.
 if(!w.__darV8FullscreenDelegatedV1){
  w.__darV8FullscreenDelegatedV1=true;
  d.addEventListener("click",function(ev){
   var btn=ev.target&&ev.target.closest&&ev.target.closest("#darV8PlayerFullscreen");
   if(!btn)return;
   ev.preventDefault();ev.stopPropagation();
   togglePlayer();
  },true);
 }
 if(d.getElementById("darV8PlayerFullscreen"))return;
 const player=d.querySelector(".v8-real-player");if(!player)return;
 const label=player.querySelector(".v8-player-label");
 if(!label)return;
 const b=element("button","dar-v8-player-fullscreen-toggle","⛶ Vollansicht");
 b.id="darV8PlayerFullscreen";b.type="button";b.setAttribute("aria-expanded","false");
 b.setAttribute("aria-controls","quranAudioPlayer");b.setAttribute("aria-label","Qurʾān-Player in voller Ansicht öffnen");
 // The button is a header control. Never position it over the label or audio content.
 label.append(b);
 // Click is handled by the stable capture listener above.
 const close=d.createElement("button");close.id="darV8PlayerBackdrop";close.type="button";
 close.className="dar-v8-player-backdrop";close.setAttribute("aria-label","Player schließen");
 close.addEventListener("click",()=>togglePlayer(false));d.body.append(close);
 d.addEventListener("keydown",e=>{if(e.key==="Escape"&&d.body.classList.contains("dar-v8-player-fullscreen")){e.preventDefault();togglePlayer(false)}});
}

let v8VisibleViewportBound=false,v8ActivePicker=null,v8PickerListenersBound=false;

let v8NoPinchGuardInstalled=false;
function installMobileGestureGuard(){
 if(v8NoPinchGuardInstalled||!w.matchMedia?.("(pointer:coarse)").matches)return;
 v8NoPinchGuardInstalled=true;
 // iOS WebKit can still permit gesture scaling in embedded browsers despite meta viewport.
 // Stop multitouch zoom but preserve one-finger vertical scrolling and every input control.
 const guard=e=>{if(e.cancelable)e.preventDefault()};
 d.addEventListener("gesturestart",guard,{passive:false});
 d.addEventListener("gesturechange",guard,{passive:false});
 d.addEventListener("touchmove",e=>{if(e.touches?.length>1&&e.cancelable)e.preventDefault()},{passive:false});
}

function syncVisualViewport(){
 const height=Math.round(w.visualViewport?.height||w.innerHeight);
 if(height>0)d.documentElement.style.setProperty("--v8-visible-height",height+"px");
}
function setupVisualViewport(){
 if(v8VisibleViewportBound)return;v8VisibleViewportBound=true;
 syncVisualViewport();w.visualViewport?.addEventListener("resize",syncVisualViewport,{passive:true});
 w.addEventListener("orientationchange",syncVisualViewport,{passive:true});
 w.addEventListener("resize",syncVisualViewport,{passive:true});
}
function closePicker(){
 if(!v8ActivePicker)return;
 v8ActivePicker.hidden=true;v8ActivePicker=null;
}
function openPicker(select){
 if(!select?.options?.length)return;
 const heading=select.closest("label")?.querySelector("span")?.textContent||select.getAttribute("aria-label")||"Auswahl";
 let overlay=d.getElementById("darV8PickerOverlay");
 if(!overlay){
  overlay=element("section","dar-v8-picker-overlay");overlay.id="darV8PickerOverlay";overlay.hidden=true;
  overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
  const sheet=element("div","dar-v8-picker-panel");
  const head=element("div","dar-v8-picker-head");
  const title=element("strong","");title.id="darV8PickerTitle";
  const close=element("button","","✕");close.type="button";close.setAttribute("aria-label","Auswahl schließen");
  close.addEventListener("click",closePicker);head.append(title,close);
  const search=element("input","");search.id="darV8PickerQuery";search.type="search";search.placeholder="Suchen …";search.setAttribute("aria-label","In Auswahl suchen");
  const list=element("div","dar-v8-picker-options");list.id="darV8PickerOptions";list.setAttribute("role","listbox");
  sheet.append(head,search,list);overlay.append(sheet);d.body.append(overlay);
  overlay.addEventListener("click",e=>{if(e.target===overlay)closePicker()});
  search.addEventListener("input",()=>paintPicker(select));
  overlay.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();closePicker();select.focus({preventScroll:true})}});
 }
 v8ActivePicker=overlay;overlay.hidden=false;
 d.getElementById("darV8PickerTitle").textContent=heading;
 d.getElementById("darV8PickerQuery").value="";
 paintPicker(select);
}
function paintPicker(select){
 const list=d.getElementById("darV8PickerOptions");if(!list)return;
 const term=norm(d.getElementById("darV8PickerQuery")?.value||"");
 const choices=[...select.options].filter(o=>!o.disabled&&(!term||norm(o.text).includes(term)));
 list.replaceChildren();
 if(!choices.length){list.append(element("p","", "Keine passende Auswahl"));return}
 const frag=d.createDocumentFragment();
 choices.forEach(option=>{
  const btn=element("button","",option.text.trim()||option.value);btn.type="button";
  btn.setAttribute("role","option");btn.setAttribute("aria-selected",String(select.value===option.value));
  btn.addEventListener("click",()=>{
   const changed=select.value!==option.value;
   select.value=option.value;
   if(changed)select.dispatchEvent(new Event("change",{bubbles:true}));
   closePicker();
  });
  frag.append(btn);
 });list.append(frag);
}
function setupTouchPlayerPicker(){
 if(v8PickerListenersBound||!w.matchMedia?.("(pointer:coarse)").matches)return;
 v8PickerListenersBound=true;
 for(const id of ["qaSurah","qaAyah","qaReciter"]){
  const el=d.getElementById(id);if(!el)continue;
  // Touch selection uses a real in-page list instead of iOS's giant native select wheel.
  // Mouse and keyboard keep the native accessible <select>.
  let alreadyOpened=false;
  el.addEventListener("touchstart",e=>{if(e.cancelable)e.preventDefault();e.stopPropagation();alreadyOpened=true;openPicker(el)},{passive:false});
  el.addEventListener("click",e=>{if(!w.matchMedia("(pointer:coarse)").matches)return;e.preventDefault();e.stopPropagation();if(!alreadyOpened)openPicker(el);alreadyOpened=false});
 }
}
function updateLocaleNotice(){
 let note=d.getElementById("darV8LocaleNotice");
 if(!note){note=element("p","dar-v8-locale-notice");note.id="darV8LocaleNotice";
  d.querySelector(".dar-v8-topbar")?.after(note)}
 if(!note)return;
 note.hidden=locale()==="de";
 if(!note.hidden)note.textContent=t("unverified")+" · "+t("readGerman");
}
w.addEventListener("dar-v8-locale-changed",updateLocaleNotice);


/* Home has editorial content only; product ads/install panels belong in Mehr > Downloads.
   This applies to delayed legacy promotional widgets as well as server-inserted cards. */
let v8HomePromoObserver=null,v8HomePromoQueued=false;
function removeRedundantHomePromo(){
 if(d.body.dataset.darV8Route!=="start")return;
 // Only the App Store links are candidates. Scanning every section on every
 // live countdown DOM update caused unnecessary full-page text traversal.
 const links=d.querySelectorAll('a[href*="apps.apple.com"]');
 for(const link of links){
  const node=link.closest("aside,article,section");
  if(!node||!node.isConnected)continue;
  if(node.closest("#darV8MoreSheet")||node.closest('[data-dar-v8-route="mehr"]'))continue;
  const content=(node.textContent||"").replace(/\s+/g," ");
  if(content.length<1400&&/DĀR AL TAWḤĪD für iPhone\s*(?:&|und)\s*iPad/i.test(content)){
   node.remove();
  }
 }
}
function setupHomePromoCleanup(){
 if(!v8HomePromoObserver){
  v8HomePromoObserver=new MutationObserver(records=>{
   if(d.body.dataset.darV8Route!=="start"||v8HomePromoQueued)return;
   // Ignore ordinary content and the once-per-second prayer countdown.
   // React only when a new App Store promo link enters the document.
   const hasNewPromo=records.some(record=>[...record.addedNodes].some(node=>
    node.nodeType===1&&(
     node.matches?.('a[href*="apps.apple.com"]')||
     node.querySelector?.('a[href*="apps.apple.com"]')
    )
   ));
   if(!hasNewPromo)return;
   v8HomePromoQueued=true;
   requestAnimationFrame(()=>{v8HomePromoQueued=false;removeRedundantHomePromo()});
  });
  v8HomePromoObserver.observe(d.body,{subtree:true,childList:true});
 }
 removeRedundantHomePromo();
}
/* Side effects must stay on the active page. No stale media or controls retained. */
function syncV8Route(){
 const key=d.body.dataset.darV8Route;
 const isReader=key==="quran";
 const player=d.querySelector(".v8-real-player");
 if(player){
  player.classList.toggle("dar-v8-audio-reader-route",isReader);
  player.setAttribute("aria-label","Qurʾān-Rezitation");
 }
 if(key==="start")setupHomePromoCleanup();
}

function init(key){
 if(currentPage && currentPage!==key){closePicker();if(d.body.classList.contains("dar-v8-player-fullscreen"))togglePlayer(false)}
 currentPage=key;setupLanguages();installPlayer();setupVisualViewport();setupTouchPlayerPicker();colorLocale();updateLocaleNotice();syncV8Route();
 if(key==="suche")initChat();
 if(key==="quran")initQuran();
 if(key==="einstellungen")settings();
}
w.DARV8Portal={init,searchQuery,togglePlayer,selectLanguage,quranIndex,quranResults};
})(window,document);
