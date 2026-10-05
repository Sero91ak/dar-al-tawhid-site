/* DĀR AL TAWḤĪD · Test-App · Ḥadīṯ library hierarchy v1299 */
(function(){
  const ROOT_LIMIT=8;
  function workAuthor(title){
    const t=String(title||"").toLowerCase();
    if(t.includes("buḫār")||t.includes("bukh")||t.includes("buhar"))return"Imām al-Buḫārī";
    if(t.includes("ṣaḥīḥ muslim")||t.includes("sahih muslim"))return"Imām Muslim";
    if(t.includes("abī dāwūd")||t.includes("abi dawud")||t.includes("abū dāwūd")||t.includes("abu dawud"))return"Imām Abū Dāwūd";
    if(t.includes("tirmiḏ")||t.includes("tirmidh"))return"Imām at-Tirmiḏī";
    if(t.includes("nasā")||t.includes("nasai"))return"Imām an-Nasāʾī";
    if(t.includes("ibn māǧ")||t.includes("ibn maj"))return"Imām Ibn Māǧah";
    return"";
  }
  function cleanTitle(kind,title){
    let t=String(title||kind||"").trim();
    if(kind==="Kitāb")t=t.replace(/^Kitāb\s+/i,"");
    if(kind==="Bāb")t=t.replace(/^Bāb[:\s-]*/i,"");
    return t||kind;
  }
  function hierarchyCard(kind,title,meta,value,idx){
    const cls=String(kind||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    return `<article class="dua-theme-card hadith-hierarchy-card hadith-hierarchy-card--${esc(cls)}" data-nav="hadith" data-value="${esc(value)}"><span class="dua-theme-card__idx" aria-hidden="true">${String(idx).padStart(2,"0")}</span><div class="dua-theme-card__body"><span class="hadith-hierarchy-card__kind">${esc(String(kind).toUpperCase())}</span><h3>${esc(cleanTitle(kind,title))}</h3><p class="dua-theme-card__count">${esc(meta)}</p></div><span class="dua-theme-card__chev" aria-hidden="true">›</span></article>`;
  }
  function leafRow(h){
    const preview=String(h.german||"").replace(/\s+/g," ").trim();
    const num=h.hadithNumber?String(h.hadithNumber):"";
    const narrator=String(h.narrator||h.narratorLine||"").trim();
    const title=preview?preview.slice(0,170):cleanTitle("Bāb",h.babTitle||h.chapterTitle||"Ḥadīṯ");
    return `<article class="dua-row hadith-leaf-row" data-nav="hadith" data-value="${esc(hadithPath(h))}"><div class="hadith-leaf-row__kicker">ḤADĪṮ${num?` · NR. ${esc(num)}`:""}</div><div class="dua-row__body"><h3>${esc(title)}</h3>${narrator?`<p class="dua-row__sub">${esc(narrator)}</p>`:""}<div class="dua-row__meta">${h.grade?`<span>${esc(h.grade)}</span>`:""}${h.source?`<span>${esc(h.source)}</span>`:""}</div></div><span class="hadith-leaf-row__chev" aria-hidden="true">›</span></article>`;
  }
  function allExpanded(){try{return sessionStorage.getItem("darHadithShowAllWorksV1")==="1"}catch(e){return false}}
  function workToggle(expanded,total){
    if(total<=ROOT_LIMIT)return"";
    return `<button type="button" class="hadith-work-toggle" data-hadith-toggle-all="1">${expanded?"Nur Hauptwerke anzeigen":`Alle ${total} Werke anzeigen`}<span aria-hidden="true">${expanded?"↑":"↓"}</span></button>`;
  }
  function newBookCard(book,idx){
    const author=workAuthor(book&&book.title);
    const meta=[author,`${Number(book&&book.hadithCount||0)} Ḥadīṯe`].filter(Boolean).join(" · ");
    return hierarchyCard("Ḥadīṯ-Werk",book&&book.title||"Ḥadīṯ-Werk",meta,book.id,idx||1);
  }
  function newDetail(h){
    if(!h)return`<div class="empty">Dieser Ḥadīṯ konnte nicht geladen werden.</div>`;
    const crumbBook={id:h.bookId||hadithSlug(h.bookTitle),title:h.bookTitle||"Ḥadīṯ-Werk"};
    const crumbChapter={id:h.chapterId||hadithSlug(h.chapterTitle),title:h.chapterTitle||"Kitāb"};
    const crumbSection={id:h.babId||h.chapterId||hadithSlug(h.babTitle||h.chapterTitle),title:h.babTitle||h.chapterTitle||"Bāb"};
    const fav=isHadithFavorite(h.id);
    const f=readHadithFilters();
    const showArabic=f.language==="both"||f.language==="arabic";
    const showGerman=f.language!=="arabic";
    const narrator=h.narrator?`<div class="post-reader-speaker"><span class="post-reader-speaker__label">Überliefert von</span><span class="post-reader-speaker__rule" aria-hidden="true"></span><span class="post-reader-speaker__name">${esc(h.narrator)}</span></div>`:"";
    const speaker=h.speakerLabel?`<div class="post-reader-speaker"><span class="post-reader-speaker__label">Sprecher</span><span class="post-reader-speaker__rule" aria-hidden="true"></span><span class="post-reader-speaker__name">${esc(h.speakerLabel)}</span></div>`:"";
    const german=showGerman&&(h.germanHtml||h.german)?`<section class="statement post-aussage"><div class="post-aussage-kicker">Aussage</div><div class="post-aussage-text">${h.germanHtml||esc(h.german)}</div></section>`:"";
    const arabic=showArabic&&h.arabic?`<div class="hadith-arabic" dir="rtl" lang="ar">${esc(h.arabic)}</div>`:"";
    const sharh=h.sharhText?`<div class="hadith-sharh"><p class="hadith-sharh-label">Šarḥ${h.sharhScholar?` · ${esc(h.sharhScholar)}`:""}${h.sharhBook?` · ${esc(h.sharhBook)}`:""}</p><p class="hadith-sharh-text">${esc(h.sharhText)}</p></div>`:"";
    const cite=h.source?`<p class="hadith-source-line">${esc(h.source)}</p>`:"";
    const share=sharePanel("Ḥadīṯ weitergeben",h.chapterTitle||h.bookTitle||"Ḥadīṯ",hadithShareText(h),location.href,"Ḥadīṯ kopieren","","");
    const actions=`${share}<div class="hadith-actions"><button type="button" class="share-btn link ${fav?"is-active":""}" data-hadith-favorite="${esc(h.id)}"><span>${fav?"Gemerkt":"Merken"}</span></button></div>`;
    const detailTitle=cleanTitle("Bāb",(h.babTitle&&h.babTitle!==h.chapterTitle)?h.babTitle:(h.chapterTitle||h.bookTitle||"Ḥadīṯ"));
    const detailKicker=`${esc(h.bookTitle||"Ḥadīṯ-Werk")}${h.hadithNumber?` · ḤADĪṮ NR. ${esc(h.hadithNumber)}`:""}`;
    return`${renderHadithBreadcrumb(crumbBook,crumbChapter,crumbSection,h.hadithNumber?("Ḥadīṯ "+h.hadithNumber):"Ḥadīṯ")}<article class="article post-reader hadith-detail"><header class="post-reader-title"><div class="kicker">${detailKicker}</div><h2>${esc(detailTitle)}</h2></header><section class="post-reader-main">${narrator}${speaker}${german}${arabic}${h.grade?`<p class="hadith-card-grade">${esc(h.grade)}</p>`:""}${h.babTitle?`<p class="hadith-meta-line">${esc(h.babTitle)}</p>`:""}${sharh}${cite}${actions}${renderHadithSiblingNav(h)}</section></article>`;
  }
  function newBookPanel(book,route){
    if(!book)return"";
    const collection=hadithCollections.get(book.id);
    if(!collection)return `<div class="dua-collection-page">${setHeader(book.title,"Das Werk wird geöffnet…","Ḥadīṯ-Werk")}<div class="empty">Das Werk wird geöffnet…</div></div>`;
    const chapters=[...(collection.chapters||[])];
    const chapter=route.chapterId?chapters.find(ch=>String(ch.id)===String(route.chapterId)):null;
    if(!chapter){
      const cards=chapters.map((ch,i)=>hierarchyCard("Kitāb",ch.title||"Kitāb",`${(ch.hadiths||[]).length} Ḥadīṯe`,`${book.id}/${ch.id}`,i+1)).join("");
      const workMeta=[workAuthor(book.title),`${chapters.length} Kitāb`,`${Number(book.hadithCount||0)} Ḥadīṯe`].filter(Boolean).join(" · ");
      return`<div class="dua-hub hadith-hub hadith-hub--nested hadith-hub--work">${setPageHeader(book.title,workMeta,"Ḥadīṯ-Werk")}${renderHadithBreadcrumb(book,null,null)}${renderHadithHubSearch("")}<div class="dua-hub__label"><b>Kitāb</b><span>${chapters.length} im Werk</span></div><section class="dua-theme-grid" aria-label="Kitāb">${cards||`<div class="empty">Noch keine Kitāb.</div>`}</section></div>`;
    }
    const babs=(chapter.babs||[]).filter(b=>b&&(b.hadiths||[]).length);
    const section=route.babId?babs.find(s=>String(s.id)===String(route.babId)):null;
    if(babs.length>1&&!section){
      const cards=babs.map((s,i)=>hierarchyCard("Bāb",s.title||"Bāb",`${(s.hadiths||[]).length} Ḥadīṯe`,`${book.id}/${chapter.id}/${s.id}`,i+1)).join("");
      return`<div class="dua-hub hadith-hub hadith-hub--nested hadith-hub--chapter">${setPageHeader(cleanTitle("Kitāb",chapter.title||"Kitāb"),`${babs.length} Bāb`,"Kitāb")}${renderHadithBreadcrumb(book,chapter,null)}${renderHadithHubSearch("")}<div class="dua-hub__label"><b>Bāb</b><span>${babs.length} Kapitelbereiche</span></div><section class="dua-theme-grid" aria-label="Bāb">${cards}</section></div>`;
    }
    if(route.hadithId){
      const pool=section?section.hadiths:(chapter.hadiths||[]);
      const h=pool.find(x=>String(x.id)===String(route.hadithId))||findHadithById(route.hadithId);
      return newDetail(h);
    }
    const pool=section?section.hadiths:(chapter.hadiths||[]);
    const hadiths=filterHadithList(pool,getJson("darHadithSearchQueryV1",""));
    const title=cleanTitle("Bāb",(section&&section.title)||chapter.title);
    return`<div class="dua-hub hadith-hub hadith-hub--nested hadith-hub--leaf">${setPageHeader(title,`${hadiths.length} Ḥadīṯe in diesem Bāb.`,"Bāb")}${renderHadithBreadcrumb(book,chapter,section||null)}<div class="dua-hub__label"><b>Ḥadīṯe</b><span>${hadiths.length} Einträge</span></div><section class="dua-collection hadith-leaf-list" aria-label="${esc(title)}">${hadiths.length?hadiths.map(leafRow).join(""):`<div class="empty">Keine Ḥadīṯe in diesem Bāb.</div>`}</section></div>`;
  }
  function newRender(){
    try{hydrateHadithLibraryCache()}catch(e){}
    if(!hadithBooks.length){
      if(hadithLoadFailed)return`<div class="dua-hub hadith-hub">${setPageHeader("Ḥadīṯ-Bibliothek","Werke · Kitāb · Bāb · Nummer","Ḥadīṯ")}<div class="empty">Die Bibliothek ist gerade nicht erreichbar.</div></div>`;
      ensureHadithLibrary().then(()=>{if(readRoute().view==="hadith")render()});
      return`<div class="dua-hub hadith-hub">${setPageHeader("Ḥadīṯ-Bibliothek","Werke · Kitāb · Bāb · Nummer","Ḥadīṯ")}<div class="empty">Die Bibliothek wird geöffnet…</div></div>`;
    }
    readHadithFilters();
    const visible=[...hadithVisibleBooks()];
    const route=parseHadithRoute();
    const selected=route.bookId?visible.find(b=>String(b.id)===String(route.bookId)):null;
    if(selected){
      hadithActiveBook=selected.id;hadithActiveChapter=route.chapterId||"";hadithActiveSection=route.babId||"";
      if(selected.status==="imported"&&!hadithCollections.has(selected.id))ensureHadithCollection(selected.id).then(()=>{if(readRoute().view==="hadith")render()});
    }else{hadithActiveBook="";hadithActiveChapter="";hadithActiveSection=""}
    const q=getJson("darHadithSearchQueryV1","");
    if(q&&!route.bookId)return renderHadithSearchResults(q);
    if(selected)return newBookPanel(selected,route);
    const expanded=allExpanded();
    const rootBooks=expanded?visible:visible.slice(0,ROOT_LIMIT);
    const cards=rootBooks.map((book,i)=>newBookCard(book,i+1)).join("");
    const totalRecords=visible.reduce((n,b)=>n+Number(b.hadithCount||0),0);
    const hadithTotal=(hadithSearchIndex||[]).filter(h=>String(h.recordType||"hadith")!=="athar").length;
    const atharTotal=(hadithSearchIndex||[]).filter(h=>String(h.recordType||"")==="athar").length;
    const libraryDesc=atharTotal?`${totalRecords} Überlieferungen · ${hadithTotal} Ḥadīṯe · ${atharTotal} Āṯār`:`${totalRecords} Ḥadīṯe – nach Werken geordnet.`;
    return`<div class="dua-hub hadith-hub">${setPageHeader("Ḥadīṯ-Bibliothek",libraryDesc,"Ḥadīṯ")}${renderHadithHubSearch("")}<div class="dua-hub__label"><b>Werke</b><span>${visible.length} im Katalog</span></div><section class="dua-theme-grid" aria-label="Ḥadīṯ-Werke">${cards||`<div class="empty">Noch keine Werke.</div>`}</section>${workToggle(expanded,visible.length)}</div>`;
  }
  const oldBind=(typeof bindHadithLibraryEvents==="function")?bindHadithLibraryEvents:null;
  function newBind(){
    if(oldBind)oldBind();
    if(typeof currentRoute!=="undefined"&&currentRoute.view!=="hadith")return;
    document.querySelectorAll("[data-hadith-toggle-all]").forEach(btn=>{
      btn.onclick=ev=>{
        ev.preventDefault();ev.stopPropagation();
        try{const next=!allExpanded();if(next)sessionStorage.setItem("darHadithShowAllWorksV1","1");else sessionStorage.removeItem("darHadithShowAllWorksV1")}catch(e){}
        try{window.DARScrollManager?.preserveNextRender?.()}catch(e){}
        render();
      };
    });
  }
  renderHadithBookCard=newBookCard;
  renderHadithDetail=newDetail;
  renderHadithBookPanel=newBookPanel;
  renderHadith=newRender;
  bindHadithLibraryEvents=newBind;
  try{if(/^#\/?hadith(?:\/|$)/i.test(location.hash||""))requestAnimationFrame(()=>{try{render()}catch(e){console.error("Hadith reframe render",e)}})}catch(e){}
})();