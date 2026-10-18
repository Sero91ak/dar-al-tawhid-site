/* DAR_HADITH_VISITOR_PARITY_V1397_20261018: exact adult test library hierarchy, leaf reader and navigation.
   Loads after visitor canonical inline functions. Does not touch push, Kids, prayer or data. */
(function(){
  "use strict";
  if(window.__DAR_HADITH_VISITOR_PARITY_V1397)return;
  if(typeof window.renderHadith!=="function"||typeof window.bindHadithLibraryEvents!=="function")return;
  window.__DAR_HADITH_VISITOR_PARITY_V1397=true;
  window.renderHadithBreadcrumb = function(book,chapter,section,leafLabel=""){
  const rows=[{label:"Ḥadīṯ-Bibliothek",value:""}];
  if(book&&book.id)rows.push({label:book.title||"Werk",value:String(book.id)});
  if(book&&chapter&&chapter.id)rows.push({label:chapter.title||"Kitāb",value:[book.id,chapter.id].filter(Boolean).join("/")});
  if(book&&chapter&&section&&section.id)rows.push({label:section.title||"Bāb",value:[book.id,chapter.id,section.id].filter(Boolean).join("/")});
  if(leafLabel)rows.push({label:String(leafLabel),value:null});
  if(rows.length<=1)return"";
  return '<nav class="hadith-crumbs" aria-label="Ḥadīṯ-Navigation">'+rows.map(function(row,i){const last=i===rows.length-1;return (i?'<span class="hadith-crumb-sep" aria-hidden="true">›</span>':"")+(last?'<span class="hadith-crumb-current">'+esc(row.label)+'</span>':'<button type="button" class="hadith-crumb-link" data-nav="hadith" data-value="'+esc(row.value||"")+'">'+esc(row.label)+'</button>')}).join("")+'</nav>';
};
  window.renderHadithSiblingNav = function(h){
  if(!h||!h.bookId||!h.chapterId)return"";
  const collection=hadithCollections.get(h.bookId);
  const chapter=collection&&Array.isArray(collection.chapters)?collection.chapters.find(ch=>String(ch.id)===String(h.chapterId)):null;
  if(!chapter)return"";
  const babs=Array.isArray(chapter.babs)?chapter.babs:[];
  const section=babs.find(b=>String(b.id)===String(h.babId));
  const pool=(section&&Array.isArray(section.hadiths)&&section.hadiths.length)?section.hadiths:(chapter.hadiths||[]);
  const i=pool.findIndex(x=>String(x.id)===String(h.id));
  if(i<0||pool.length<2)return"";
  const prev=i>0?pool[i-1]:null;
  const next=i<pool.length-1?pool[i+1]:null;
  const item=(x,dir)=>x?'<button type="button" class="hadith-sibling-btn hadith-sibling-'+dir+'" data-nav="hadith" data-value="'+esc(hadithPath(x))+'"><span class="hadith-sibling-kicker">'+(dir==="prev"?"Vorheriger Ḥadīṯ":"Nächster Ḥadīṯ")+'</span><strong>'+(x.hadithNumber?("Nr. "+esc(x.hadithNumber)):esc(x.chapterTitle||"Ḥadīṯ"))+'</strong></button>':'<span class="hadith-sibling-spacer" aria-hidden="true"></span>';
  return '<nav class="hadith-sibling-nav" aria-label="Zwischen Ḥadīṯen wechseln">'+item(prev,"prev")+item(next,"next")+'</nav>';
};
})();
/* DĀR AL TAWḤĪD · Hadith library structure v1297 · visitor parity */
(function(){
  "use strict";
  if(window.__DAR_HADITH_STRUCTURE_V1297)return;
  window.__DAR_HADITH_STRUCTURE_V1297=true;

  var ROOT_LIMIT=8;
  var EXPAND_KEY="darHadithWorksExpandedV1297";

  function txt(v){return String(v==null?"":v).trim()}
  function norm(v){
    return txt(v).toLowerCase()
      .replace(/[ḫ]/g,"kh").replace(/[ǧ]/g,"j").replace(/[ṯ]/g,"th")
      .replace(/[ā]/g,"a").replace(/[ī]/g,"i").replace(/[ū]/g,"u");
  }
  function workAuthor(title){
    var s=norm(title);
    if(s.indexOf("buhari")>=0||s.indexOf("bukhari")>=0)return "Imām al-Buḫārī";
    if(s.indexOf("muslim")>=0)return "Imām Muslim";
    if(s.indexOf("abi dawud")>=0||s.indexOf("abu dawud")>=0)return "Imām Abū Dāwūd";
    if(s.indexOf("tirmidhi")>=0)return "Imām at-Tirmiḏī";
    if(s.indexOf("nasai")>=0)return "Imām an-Nasāʾī";
    if(s.indexOf("ibn maja")>=0||s.indexOf("ibn majah")>=0)return "Imām Ibn Māǧah";
    if(s.indexOf("muwatta")>=0)return "Imām Mālik";
    if(s.indexOf("musnad ahmad")>=0)return "Imām Aḥmad";
    if(s.indexOf("darimi")>=0)return "Imām ad-Dārimī";
    return "Klassisches Ḥadīṯ-Werk";
  }
  function getExpanded(){
    try{return localStorage.getItem(EXPAND_KEY)==="1"}catch(e){return false}
  }
  function setExpanded(v){
    try{localStorage.setItem(EXPAND_KEY,v?"1":"0")}catch(e){}
  }
  function rootPath(){
    try{
      var r=typeof parseHadithRoute==="function"?parseHadithRoute():null;
      return !!r&&!r.bookId;
    }catch(e){
      var h=String(location.hash||"");
      return h==="#hadith"||h==="#/hadith"||h==="";
    }
  }
  function currentBookOnly(){
    try{
      var r=typeof parseHadithRoute==="function"?parseHadithRoute():null;
      return r&&r.bookId&&!r.chapterId?r:null;
    }catch(e){return null}
  }
  function findBook(id){
    try{return (hadithBooks||[]).find(function(b){return String(b.id)===String(id)})||null}catch(e){return null}
  }
  function decorateWorks(){
    if(!rootPath())return;
    var grid=document.querySelector("body.is-hadith-route .hadith-hub:not(.hadith-hub--nested) > .dua-theme-grid");
    if(!grid)return;
    var cards=[].slice.call(grid.querySelectorAll(".dua-theme-card"));
    cards.forEach(function(card){
      var titleEl=card.querySelector(".dua-theme-card__body h3");
      var metaEl=card.querySelector(".dua-theme-card__count");
      if(!titleEl||!metaEl)return;
      var author=workAuthor(titleEl.textContent);
      var count=txt(metaEl.textContent).match(/\d+\s+Ḥadīṯe?/i);
      metaEl.textContent="ḤADĪṮ-WERK · "+author+(count?" · "+count[0]:"");
    });

    var expanded=getExpanded();
    cards.forEach(function(card,i){card.hidden=!expanded&&i>=ROOT_LIMIT});
    var label=document.querySelector("body.is-hadith-route .hadith-hub:not(.hadith-hub--nested) > .dua-hub__label span");
    if(label)label.textContent=(expanded?cards.length:Math.min(ROOT_LIMIT,cards.length))+" von "+cards.length+" Werken";

    var old=document.querySelector(".hadith-works-toggle");
    if(old)old.remove();
    if(cards.length<=ROOT_LIMIT)return;

    var btn=document.createElement("button");
    btn.type="button";
    btn.className="hadith-works-toggle";
    btn.innerHTML="<span>"+(expanded?"Weniger Werke anzeigen":"Alle "+cards.length+" Werke anzeigen")+"</span><span aria-hidden=\"true\">"+(expanded?"↑":"↓")+"</span>";
    btn.addEventListener("click",function(){
      var next=!getExpanded();
      setExpanded(next);
      decorateWorks();
      if(!next){
        try{grid.scrollIntoView({block:"start",behavior:"smooth"})}catch(e){}
      }
    });
    grid.insertAdjacentElement("afterend",btn);
  }
  function decorateBookHeader(){
    var r=currentBookOnly();
    if(!r)return;
    var book=findBook(r.bookId);
    if(!book)return;
    var desc=document.querySelector("body.is-hadith-route .hadith-hub--nested > .view-head .view-desc");
    if(!desc)return;
    var author=workAuthor(book.title);
    var base=txt(desc.textContent);
    if(base.indexOf(author)<0)desc.textContent=author+" · "+base;
  }
  function cleanLeafRows(){
    var rows=document.querySelectorAll("body.is-hadith-route .hadith-leaf-list .dua-row, body.is-hadith-route #hadithSearchBlock .dua-row");
    rows.forEach(function(row){
      if(row.dataset.hadithStructured==="1")return;
      var body=row.querySelector(".dua-row__body");
      if(!body)return;
      var value=txt(row.getAttribute("data-value"));
      var id=value.split("/").filter(Boolean).pop();
      var h=null;
      try{if(id&&typeof findHadithById==="function")h=findHadithById(id)}catch(e){}
      if(!h)return;

      var title=body.querySelector("h3");
      var meta=body.querySelector(".dua-row__meta");
      var kicker=document.createElement("div");
      kicker.className="hadith-row__kicker";
      kicker.textContent=txt(h.bookTitle||"Ḥadīṯ-Werk");
      body.insertBefore(kicker,body.firstChild);

      if(title)title.textContent=h.hadithNumber?"Ḥadīṯ "+h.hadithNumber:(txt(h.babTitle)||"Ḥadīṯ");

      if(meta){
        var parts=[];
        if(h.narrator)parts.push(h.narrator);
        else if(h.chapterTitle)parts.push(h.chapterTitle);
        if(h.grade)parts.push(h.grade);
        meta.innerHTML="";
        parts.forEach(function(p){
          var s=document.createElement("span");
          s.textContent=txt(p);
          meta.appendChild(s);
        });
      }
      row.dataset.hadithStructured="1";
    });
  }
  function enhance(){
    try{decorateWorks()}catch(e){}
    try{decorateBookHeader()}catch(e){}
    try{cleanLeafRows()}catch(e){}
  }

  if(typeof bindHadithLibraryEvents==="function"){
    var originalBind=bindHadithLibraryEvents;
    bindHadithLibraryEvents=function(){
      var out=originalBind.apply(this,arguments);
      enhance();
      return out;
    };
  }
  document.addEventListener("DOMContentLoaded",enhance,{once:true});
  window.addEventListener("hashchange",function(){setTimeout(enhance,0)});
  setTimeout(enhance,0);
})();
/* DĀR AL TAWḤĪD · Besucher-App · Ḥadīṯ library hierarchy v1397 */
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
    const sharh=h.sharhText?`<section class="hadith-sharh" aria-label="Šarḥ – Erklärung zum Ḥadīṯ">
      <header class="hadith-sharh-head">
        <p class="hadith-sharh-eyebrow">Zum Verständnis des Ḥadīṯ</p>
        <h3 class="hadith-sharh-heading">Šarḥ <span>– Erklärung</span></h3>
      </header>
      ${(h.sharhScholar||h.sharhBook)?`<p class="hadith-sharh-label">${h.sharhScholar?esc(h.sharhScholar):""}${h.sharhScholar&&h.sharhBook?" · ":""}${h.sharhBook?esc(h.sharhBook):""}</p>`:""}
      <div class="hadith-sharh-text">${esc(h.sharhText)}</div>
      ${h.sharhReference?`<p class="hadith-sharh-reference">${esc(h.sharhReference)}</p>`:""}
    </section>`:"";
    const cite=h.source?`<p class="hadith-source-line">${esc(h.source)}</p>`:"";
    const share=sharePanel("Ḥadīṯ weitergeben",h.chapterTitle||h.bookTitle||"Ḥadīṯ",hadithShareText(h),location.href,"Ḥadīṯ kopieren","","");
    const actions=`${share}<div class="hadith-actions"><button type="button" class="share-btn link ${fav?"is-active":""}" data-hadith-favorite="${esc(h.id)}"><span>${fav?"Gemerkt":"Merken"}</span></button></div>`;
    const detailTitle=cleanTitle("Bāb",(h.babTitle&&h.babTitle!==h.chapterTitle)?h.babTitle:(h.chapterTitle||h.bookTitle||"Ḥadīṯ"));
    const detailKicker=`${esc(h.bookTitle||"Ḥadīṯ-Werk")}${h.hadithNumber?` · ḤADĪṮ NR. ${esc(h.hadithNumber)}`:""}`;
    const detailPath=renderHadithBreadcrumb(crumbBook,crumbChapter,crumbSection,h.hadithNumber?("Ḥadīṯ "+h.hadithNumber):"Ḥadīṯ");
    return`<article class="article post-reader hadith-detail hadith-detail--v1303"><header class="post-reader-title"><div class="kicker">${detailKicker}</div><h2>${esc(detailTitle)}</h2></header>${detailPath}<section class="post-reader-main">${narrator}${speaker}${german}${arabic}${h.grade?`<p class="hadith-card-grade">${esc(h.grade)}</p>`:""}${h.babTitle?`<p class="hadith-meta-line">${esc(h.babTitle)}</p>`:""}${cite}${sharh}${actions}${renderHadithSiblingNav(h)}</section></article>`;
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
