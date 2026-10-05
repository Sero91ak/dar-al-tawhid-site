/* DĀR AL TAWḤĪD · Hadith library structure v1297 · test-only */
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