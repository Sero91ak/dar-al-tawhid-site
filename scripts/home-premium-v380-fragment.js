
const HOME_LAST_SYNC_KEY="darHomeLastSyncV1";
function getHomeLastSyncTime(){try{const raw=localStorage.getItem(HOME_LAST_SYNC_KEY);return raw?JSON.parse(raw):null}catch(e){return null}}
function markHomeLastSyncOk(){try{localStorage.setItem(HOME_LAST_SYNC_KEY,JSON.stringify({at:Date.now(),ok:true}))}catch(e){}}
function markHomeLastSyncError(){try{localStorage.setItem(HOME_LAST_SYNC_KEY,JSON.stringify({at:Date.now(),ok:false}));window.__darHomeSyncError=true}catch(e){}}
function formatHomeSyncClock(ts){if(!ts)return"";const d=new Date(ts);if(!Number.isFinite(d.getTime()))return"";return d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}
function homeHasNewContentSignal(){if(window.__darAppVersionAvailable===true)return true;const banner=document.getElementById("newPostsBanner");return !!(banner&&!banner.classList.contains("hidden"))}
function homeSyncStatusSummary(){
  if(postsSyncBusy)return{line:"Inhalte werden synchronisiert…",state:"busy",aria:"Synchronisierung läuft"};
  if(window.__darHomeSyncError)return{line:"Synchronisierung fehlgeschlagen · Erneut versuchen",state:"error",aria:"Synchronisierung fehlgeschlagen. Erneut versuchen."};
  if(homeHasNewContentSignal()){
  const n=Number(window.__darNewPostsCount||0);
  return{line:n>0?`${n} neue Beiträge verfügbar · Aktualisieren`:"Neue Beiträge verfügbar · Aktualisieren",state:"update",aria:"Neue Inhalte verfügbar. Aktualisieren."};
  }
  const last=getHomeLastSyncTime();
  const t=last?.at?formatHomeSyncClock(last.at):"";
  return{line:t?`Inhalte aktuell · zuletzt ${t}`:"Inhalte aktuell",state:"ok",aria:t?`Inhalte aktuell. Zuletzt synchronisiert um ${t}.`:"Inhalte aktuell."};
}
function homePushStatusCompact(settings=getPrayerSettings()){
  if(hasNotificationApi()&&getNotificationPermission()==="denied"){
    return{line:"Mitteilungen nicht erlaubt · Einstellungen öffnen",actionLabel:"",state:"permission-denied",ariaLabel:"Mitteilungen nicht erlaubt. Einstellungen öffnen."};
  }
  const prayerOn=Boolean(settings.reminder);
  const duaOn=dailyPushPref(settings,"dailyDua");
  const recOn=dailyPushPref(settings,"dailyRecommendation");
  const jummahOn=jummahPref(settings,"jummahNotifications");
  if(!prayerOn&&!duaOn&&!recOn&&!jummahOn){
    return{line:"Erinnerungen deaktiviert · Aktivieren",actionLabel:"Aktivieren",state:"all-off",ariaLabel:"Erinnerungen deaktiviert. Aktivieren."};
  }
  const parts=[];
  if(prayerOn)parts.push("5 Gebete aktiv");else parts.push("Gebete deaktiviert");
  if(duaOn)parts.push("Duʿāʾ 09:00");else parts.push("Duʿāʾ deaktiviert");
  if(recOn)parts.push("Empfehlung 12:00");
  if(jummahOn)parts.push("Jumuʿah aktiv");
  const line=parts.join(" · ");
  return{line,actionLabel:"",state:prayerOn&&duaOn&&recOn?"full":"partial",ariaLabel:`Push-Erinnerungen öffnen. ${line.replace(/\s*·\s*/g,", ")}.`};
}
function updateHomeAppStatusUi(){
  const sync=homeSyncStatusSummary();
  const push=homePushStatusCompact();
  const syncLine=document.getElementById("homeAppStatusSyncLine");
  const pushLine=document.getElementById("homeAppStatusPushLine");
  const syncBtn=document.getElementById("homeAppStatusSync");
  const pushBtn=document.getElementById("homeAppStatusPush");
  if(syncLine)syncLine.textContent=sync.line;
  if(pushLine)pushLine.textContent=push.line;
  if(syncBtn){
    syncBtn.setAttribute("aria-label",sync.aria);
    syncBtn.classList.toggle("is-update",sync.state==="update");
    syncBtn.classList.toggle("is-error",sync.state==="error");
  }
  if(pushBtn)pushBtn.setAttribute("aria-label",push.ariaLabel);
  updateHomePushRemindersSummary();
}
function renderHomePushSheetOnly(){
  return `<div id="homePushRemindersBackdrop" class="home-push-sheet-backdrop" hidden tabindex="-1"><div class="home-push-sheet" role="dialog" aria-modal="true" aria-labelledby="homePushSheetTitle"><div class="home-push-sheet__head"><h3 id="homePushSheetTitle">Gebets- & Duʿāʾ-Erinnerungen</h3><button type="button" id="homePushRemindersClose" class="home-push-sheet__close" aria-label="Schließen">×</button></div><div class="home-push-sheet__body" id="prayerPushSettingsBody">${renderPrayerReminderSettingsInner()}</div></div></div>`;
}
function renderHomeAppStatus(){
  const sync=homeSyncStatusSummary();
  const push=homePushStatusCompact();
  return `<section class="home-v380-app-status" aria-label="App-Status"><button type="button" id="homeAppStatusSync" class="home-v380-app-status__half${sync.state==="update"?" is-update":""}${sync.state==="error"?" is-error":""}" aria-label="${esc(sync.aria)}"><span class="home-v380-app-status__label">App-Status</span><span class="home-v380-app-status__line" id="homeAppStatusSyncLine">${esc(sync.line)}</span></button><button type="button" id="homeAppStatusPush" class="home-v380-app-status__half" aria-label="${esc(push.ariaLabel)}"><span class="home-v380-app-status__label">Erinnerungen</span><span class="home-v380-app-status__line" id="homeAppStatusPushLine">${esc(push.line)}</span></button></section>${renderHomePushSheetOnly()}`;
}
function homePostPreviewCard(post,{label="NEUSTER BEITRAG",action="Öffnen"}={}){
  if(!post)return"";
  const excerpt=findQuote(post);
  const meta=[post.scholar,post.source].filter(Boolean).join(" · ");
  return `<article class="home-v380-post-preview" data-nav="post" data-value="${esc(post.id)}" tabindex="0" role="link" aria-label="${esc(post.title)} öffnen"><span class="home-v380-kicker">${esc(label)}</span><h3 class="home-v380-post-title">${esc(post.title)}</h3>${excerpt?`<p class="home-v380-post-excerpt">${esc(excerpt)}</p>`:""}${meta?`<p class="home-v380-post-meta">${esc(meta)}</p>`:""}<span class="home-v380-post-action" aria-hidden="true">${esc(action)} →</span></article>`;
}
function renderHomeQuranHero(){
  const prog=getPreferredQuranProgress();
  if(!prog){
    return `<button type="button" class="home-v380-quran-hero" data-nav="quran" aria-label="Qurʾān-Lesung beginnen"><div class="home-v380-quran-hero__body"><span class="home-v380-kicker">Qurʾān</span><h3 class="home-v380-quran-hero__title">Qurʾān-Lesung beginnen</h3><p class="home-v380-quran-hero__meta">Wähle eine Sūrah und beginne deine Lesung</p></div><span class="home-v380-quran-hero__chevron" aria-hidden="true">→</span></button>`;
  }
  const when=formatQuranProgressTime(prog.updatedAt);
  const target=`${esc(prog.surahNumber)}:${esc(prog.ayahNumber)}`;
  const aria=`Qurʾān weiterlesen. ${quranContinueMetaLine(prog)}${when?`. Zuletzt gelesen ${when}`:""}`;
  return `<button type="button" class="home-v380-quran-hero" data-quran-continue="${target}" aria-label="${esc(aria)}"><div class="home-v380-quran-hero__body"><span class="home-v380-kicker">Weiterlesen</span><h3 class="home-v380-quran-hero__title">Qurʾān weiterlesen</h3><p class="home-v380-quran-hero__meta">${esc(quranContinueMetaLine(prog))}</p>${when?`<p class="home-v380-quran-hero__when">Zuletzt gelesen: ${esc(when)}</p>`:""}</div><span class="home-v380-quran-hero__chevron" aria-hidden="true">→</span></button>`;
}
function renderHomeDailyDuaRow(){
  const d=dailyDua();
  if(!d)return"";
  const preview=String(d.de||d.occasion||"").trim();
  return `<button type="button" class="home-v380-open-row" data-nav="dua" data-value="${esc(d.id)}" aria-label="Duʿāʾ des Tages öffnen: ${esc(d.title)}"><div class="home-v380-open-row__body"><span class="home-v380-kicker">Duʿāʾ des Tages</span><h3 class="home-v380-open-row__title">${esc(d.title)}</h3>${preview?`<p class="home-v380-open-row__excerpt">${esc(preview)}</p>`:""}</div><span class="home-v380-open-row__action" aria-hidden="true">Öffnen →</span></button>`;
}
function renderHomeRecommendedRow(excludeIds=new Set()){
  const post=recommendedPost();
  if(!post||excludeIds.has(String(post.id)))return"";
  const excerpt=findQuote(post);
  const meta=[post.category?normalizePostCategory(post.category):"",post.scholar].filter(Boolean).join(" · ");
  return `<button type="button" class="home-v380-open-row" data-nav="post" data-value="${esc(post.id)}" aria-label="Heute empfohlen lesen: ${esc(post.title)}"><div class="home-v380-open-row__body"><span class="home-v380-kicker">Heute empfohlen</span><h3 class="home-v380-open-row__title">${esc(post.title)}</h3>${excerpt?`<p class="home-v380-open-row__excerpt">${esc(excerpt)}</p>`:""}${meta?`<p class="home-v380-open-row__meta">${esc(meta)}</p>`:""}</div><span class="home-v380-open-row__action" aria-hidden="true">Lesen →</span></button>`;
}
function renderHomeRamadanRow(){
  const ctx=seasonalIslamicContext();
  if(!ctx)return"";
  const headline=ctx.phase==="countdown"?`Noch ca. ${ctx.daysLeft} Tage bis Ramaḍān`:ctx.phase==="ramadan"?`Tag ${ctx.day} im Fastenmonat`:ctx.title;
  return `<button type="button" class="home-v380-open-row" data-nav="ramadan" aria-label="Ramaḍān-Bereich öffnen"><div class="home-v380-open-row__body"><span class="home-v380-kicker">Saison</span><h3 class="home-v380-open-row__title">${esc(headline)}</h3><p class="home-v380-open-row__excerpt">${esc(ctx.subtitle)} · Suḥūr, Iftār, Duʿāʾ & Beiträge</p></div><span class="home-v380-open-row__action" aria-hidden="true">Öffnen →</span></button>`;
}
function renderHomeTodaySection(){
  const used=new Set();
  const recPost=recommendedPost();
  if(recPost)used.add(String(recPost.id));
  const dua=renderHomeDailyDuaRow();
  const rec=renderHomeRecommendedRow(used);
  const ramadan=renderHomeRamadanRow();
  const rows=[ramadan,dua,rec].filter(Boolean).join("");
  if(!rows)return"";
  return `<section class="home-v380-section" aria-labelledby="homeTodayTitle"><h2 class="home-v380-section-title" id="homeTodayTitle">Heute für dich</h2><div class="home-v380-section-rule" aria-hidden="true"></div>${rows}</section>`;
}
function homeDiscoverPosts(excludeIds=new Set()){
  const rec=recommendedPost();
  if(rec)excludeIds.add(String(rec.id));
  return posts.filter(p=>!excludeIds.has(String(p.id)));
}
function renderHomeLatestBlock(excludeIds=new Set()){
  const pool=homeDiscoverPosts(new Set(excludeIds));
  const latest=pool.slice(0,6);
  if(!latest.length)return"";
  if(latest.length===1)return homePostPreviewCard(latest[0],{label:"Neuester Beitrag",action:"Öffnen"});
  return `<div class="home-v380-post-slider" role="list">${latest.map((p,i)=>homePostPreviewCard(p,{label:i===0?"Neuester Beitrag":"Beitrag",action:"Öffnen"})).join("")}</div>`;
}
function renderHomePopularBlock(excludeIds=new Set()){
  const rec=recommendedPost();
  if(rec)excludeIds.add(String(rec.id));
  posts.slice(0,8).forEach(p=>excludeIds.add(String(p.id)));
  return `<section class="home-v380-section home-v380-popular-wrap" aria-labelledby="homePopularTitle"><h3 class="home-v380-kicker" id="homePopularTitle">Meist gelesen</h3><div id="popularPostsContent" class="home-v380-popular-list"><div class="loading" style="padding:12px 0;margin:0">Wird geladen …</div></div></section>`;
}
function renderHomeDiscoverSection(){
  const exclude=new Set();
  const rec=recommendedPost();
  if(rec)exclude.add(String(rec.id));
  const pool=homeDiscoverPosts(new Set(exclude));
  const latest=pool.slice(0,6);
  latest.forEach(p=>exclude.add(String(p.id)));
  let latestHtml="";
  if(latest.length===1)latestHtml=homePostPreviewCard(latest[0],{label:"Neuester Beitrag",action:"Öffnen"});
  else if(latest.length>1)latestHtml=`<div class="home-v380-post-slider" role="list">${latest.map((p,i)=>homePostPreviewCard(p,{label:i===0?"Neuester Beitrag":"Beitrag",action:"Öffnen"})).join("")}</div>`;
  const popular=renderHomePopularBlock(exclude);
  if(!latestHtml&&!popular)return"";
  return `<section class="home-v380-section" aria-labelledby="homeDiscoverTitle"><div class="home-v380-section-head"><h2 class="home-v380-section-title" id="homeDiscoverTitle">Entdecken</h2><button type="button" class="home-v380-text-link" data-nav="recent">Alle Beiträge →</button></div><div class="home-v380-section-rule" aria-hidden="true"></div>${latestHtml}${popular}</section>`;
}
function renderHomeLibrariesSection(){
  const testOnly=typeof IS_TEST_PATH!=="undefined"&&IS_TEST_PATH;
  const cards=[];
  if(testOnly)cards.push(`<button type="button" class="home-v380-lib-card" data-nav="bibliothek" aria-label="DAR AL TAWḤĪD Bibliothek öffnen"><h3>DAR AL TAWḤĪD Bibliothek</h3><p>Eigene PDFs, Bücher und thematische Lernmaterialien</p><span class="home-v380-lib-card__foot" aria-hidden="true">Öffnen →</span></button>`);
  if(testOnly)cards.push(`<button type="button" class="home-v380-lib-card" data-nav="books" aria-label="Quellenbibliothek öffnen"><h3>Quellenbibliothek</h3><p>Geprüfte historische Werke und klassische Quellen</p><span class="home-v380-lib-card__foot" aria-hidden="true">Öffnen →</span></button>`);
  else cards.push(`<button type="button" class="home-v380-lib-card" data-nav="books" aria-label="Quellenbibliothek öffnen"><h3>Quellenbibliothek</h3><p>Geprüfte historische Werke und klassische Quellen</p><span class="home-v380-lib-card__foot" aria-hidden="true">Öffnen →</span></button>`);
  if(!cards.length)return"";
  const sliderClass=" home-v380-lib-grid--slider";
  return `<section class="home-v380-section" aria-labelledby="homeLibrariesTitle"><div class="home-v380-section-head"><div><h2 class="home-v380-section-title" id="homeLibrariesTitle">Bibliotheken</h2><p class="home-v380-open-row__meta" style="margin-top:4px">Wissen und Quellen gezielt durchsuchen</p></div><button type="button" class="home-v380-text-link" data-nav="topics">Alle anzeigen →</button></div><div class="home-v380-section-rule" aria-hidden="true"></div><div class="home-v380-lib-grid${sliderClass}">${cards.join("")}</div></section>`;
}
function renderHomeSearchSection(){
  const cats=uniqueList("category").map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
  const scholars=renderScholarOptions();
  const books=uniqueList("book").map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
  return `<section class="home-v380-section home-v380-search" aria-labelledby="homeSearchTitle"><h2 class="home-v380-section-title" id="homeSearchTitle">Suche und Filter</h2><div class="home-v380-section-rule" aria-hidden="true"></div><div class="home-v380-search-field"><span class="search-input-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></span><input id="homeSearchInput" class="search search-input-field" type="search" placeholder="Beiträge, Duʿāʾ, Themen, Gelehrte und Bücher durchsuchen" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-label="Beiträge, Duʿāʾ, Themen, Gelehrte und Bücher durchsuchen"><button type="button" id="homeSearchClear" class="home-v380-search-clear" hidden aria-label="Suche löschen">×</button></div><div class="home-v380-filter-chips" role="toolbar" aria-label="Filter"><button type="button" class="home-v380-filter-chip" data-home-filter-open="cat">Thema</button><button type="button" class="home-v380-filter-chip" data-home-filter-open="scholar">Gelehrter</button><button type="button" class="home-v380-filter-chip" data-home-filter-open="book">Buch</button><button type="button" class="home-v380-filter-chip" data-home-filter-open="more">Weitere Filter</button></div><div id="homeActiveFilters" class="home-v380-active-filters" hidden></div><div id="homeFilterPanel" class="home-v380-filter-panel-wrap advanced-hidden"><div class="filter-grid"><select id="homeFilterCat" class="filter-select" aria-label="Thema filtern"><option value="">Alle Kategorien</option>${cats}</select><select id="homeFilterScholar" class="filter-select" aria-label="Gelehrten filtern"><option value="">Alle Gelehrten</option>${scholars}</select><select id="homeFilterBook" class="filter-select" aria-label="Buch filtern"><option value="">Alle Bücher</option>${books}</select><select id="homeFilterType" class="filter-select" aria-label="Quellentyp filtern"><option value="">Qurʾān / Sunnah / Athar</option><option value="quran">Qurʾān / Tafsīr</option><option value="sunnah">Sunnah / Hadith</option><option value="athar">Āthār</option><option value="other">Sonstige</option></select></div></div><div id="homeFilterSheetBackdrop" class="home-push-sheet-backdrop" hidden tabindex="-1"><div class="home-push-sheet" role="dialog" aria-modal="true" aria-labelledby="homeFilterSheetTitle"><div class="home-push-sheet__head"><h3 id="homeFilterSheetTitle">Filter</h3><button type="button" id="homeFilterSheetClose" class="home-push-sheet__close" aria-label="Schließen">×</button></div><div class="home-push-sheet__body" id="homeFilterSheetBody"></div></div></div></section>`;
}
function updateHomeActiveFilterChips(){
  const wrap=document.getElementById("homeActiveFilters");
  if(!wrap)return;
  const cat=$("homeFilterCat")?.value||"";
  const scholar=$("homeFilterScholar")?.value||"";
  const book=$("homeFilterBook")?.value||"";
  const typ=$("homeFilterType")?.value||"";
  const chips=[];
  if(cat)chips.push({key:"cat",label:cat});
  if(scholar){const ref=resolveScholarRef(scholar);chips.push({key:"scholar",label:ref.label})}
  if(book)chips.push({key:"book",label:book});
  if(typ){const map={quran:"Qurʾān",sunnah:"Sunnah",athar:"Āthār",other:"Sonstige"};chips.push({key:"type",label:map[typ]||typ})}
  document.querySelectorAll(".home-v380-filter-chip").forEach(btn=>{
    const k=btn.getAttribute("data-home-filter-open");
    const active=(k==="cat"&&cat)||(k==="scholar"&&scholar)||(k==="book"&&book)||(k==="more"&&(typ||cat||scholar||book));
    btn.classList.toggle("is-active",!!active);
  });
  if(!chips.length){wrap.hidden=true;wrap.innerHTML="";return}
  wrap.hidden=false;
  wrap.innerHTML=chips.map(c=>`<span class="home-v380-active-chip">${esc(c.label)} <button type="button" data-home-filter-clear="${esc(c.key)}" aria-label="${esc(c.label)} entfernen">×</button></span>`).join("")+`<button type="button" class="home-v380-filter-reset" id="homeFilterResetAll">Alle zurücksetzen</button>`;
}
function openHomeFilterSheet(mode="more"){
  const backdrop=document.getElementById("homeFilterSheetBackdrop");
  const body=document.getElementById("homeFilterSheetBody");
  const panel=document.getElementById("homeFilterPanel");
  if(!backdrop||!body||!panel)return;
  body.innerHTML=panel.innerHTML;
  const title=document.getElementById("homeFilterSheetTitle");
  const map={cat:"Thema wählen",scholar:"Gelehrten wählen",book:"Buch wählen",more:"Weitere Filter"};
  if(title)title.textContent=map[mode]||"Filter";
  backdrop.removeAttribute("hidden");
  document.body.classList.add("home-push-sheet-open");
  body.querySelectorAll("select").forEach(sel=>{
    const id=sel.id;
    const src=$(id);
    if(src)sel.value=src.value;
    sel.onchange=()=>{if(src)src.value=sel.value;applyHomeFilters();updateHomeActiveFilterChips()};
  });
  document.getElementById("homeFilterSheetClose")?.focus();
}
function closeHomeFilterSheet(){
  const backdrop=document.getElementById("homeFilterSheetBackdrop");
  if(!backdrop)return;
  backdrop.setAttribute("hidden","");
  document.body.classList.remove("home-push-sheet-open");
}
function bindHomeV380Events(){
  updateHomeAppStatusUi();
  const syncBtn=document.getElementById("homeAppStatusSync");
  if(syncBtn)syncBtn.onclick=()=>hardRefreshApp();
  const pushBtn=document.getElementById("homeAppStatusPush");
  if(pushBtn)pushBtn.onclick=()=>{
    const s=homePushStatusCompact();
    if(s.state==="permission-denied"&&hasNotificationApi()){requestNotificationPermission().then(()=>{updateHomeAppStatusUi();openHomePushRemindersSheet()}).catch(()=>openHomePushRemindersSheet());return}
    openHomePushRemindersSheet();
  };
  bindHomePushRemindersSheet();
  const clearBtn=document.getElementById("homeSearchClear");
  const searchInput=$("homeSearchInput");
  const syncSearchClear=()=>{if(!clearBtn||!searchInput)return;const has=!!searchInput.value.trim();clearBtn.hidden=!has};
  if(searchInput){searchInput.oninput=()=>{syncSearchClear();applyHomeFilters()};syncSearchClear()}
  if(clearBtn)clearBtn.onclick=()=>{if(searchInput){searchInput.value="";syncSearchClear();applyHomeFilters();searchInput.focus()}};
  document.querySelectorAll("[data-home-filter-open]").forEach(btn=>{
    btn.onclick=()=>openHomeFilterSheet(btn.getAttribute("data-home-filter-open")||"more");
  });
  const filterClose=document.getElementById("homeFilterSheetClose");
  if(filterClose)filterClose.onclick=e=>{e.stopPropagation();closeHomeFilterSheet()};
  const filterBackdrop=document.getElementById("homeFilterSheetBackdrop");
  if(filterBackdrop)filterBackdrop.onclick=e=>{if(e.target===filterBackdrop)closeHomeFilterSheet()};
  document.getElementById("homeActiveFilters")?.addEventListener("click",e=>{
    const btn=e.target.closest("[data-home-filter-clear]");
    if(!btn)return;
    const key=btn.getAttribute("data-home-filter-clear");
    if(key==="cat"&&$("homeFilterCat"))$("homeFilterCat").value="";
    if(key==="scholar"&&$("homeFilterScholar"))$("homeFilterScholar").value="";
    if(key==="book"&&$("homeFilterBook"))$("homeFilterBook").value="";
    if(key==="type"&&$("homeFilterType"))$("homeFilterType").value="";
    applyHomeFilters();updateHomeActiveFilterChips();
  });
  const resetAll=document.getElementById("homeFilterResetAll");
  if(resetAll)resetAll.onclick=()=>{["homeFilterCat","homeFilterScholar","homeFilterBook","homeFilterType"].forEach(id=>{const el=$(id);if(el)el.value=""});applyHomeFilters();updateHomeActiveFilterChips()};
  updateHomeActiveFilterChips();
  updateFooterAppSaveVisibility();
}
function shouldShowFooterAppSave(){
  if(isStandalonePwa())return false;
  if(isIOSDevice())return true;
  return typeof window!=="undefined";
}
function updateFooterAppSaveVisibility(){
  const btn=document.getElementById("footerAppSave");
  if(!btn)return;
  const show=shouldShowFooterAppSave();
  if(show){btn.removeAttribute("hidden");btn.style.display=""}else{btn.setAttribute("hidden","");btn.style.display="none"}
}
