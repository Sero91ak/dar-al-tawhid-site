/* DĀR AL TAWḤĪD · Test-only immersive Muṣḥaf book preview.
   Reads the existing Quran JSON; does not create/modify any audio controller.
   Preview leaf grouping is NOT the canonical Madinah 604-page layout. */
(function () {
  "use strict";
  if (!/^\/test(?:\/|$)/.test(location.pathname) && !/^dar-al-tawhid-test\./.test(location.hostname)) return;
  if (window.__DAR_MUSHAF_TEST_BOOK_V1__) return;
  window.__DAR_MUSHAF_TEST_BOOK_V1__ = true;
  var ROOT = "darMushafTestBook", trigger, root, chapterSelect, leftPage, rightPage;
  var meta = [], chapter = null, leafs = [], spread = 0, surahNo = 1, mode = "ar", loadingToken = 0, turning = false, observer, ready = false;
  var lastFocused = null, previousOverflow = "", referenceAyah = 1;
  var STORE = "darMushafTestBookPrefsV1";
  var DICT = {
    de: ["Muṣḥaf", "Buchansicht", "Muṣḥaf öffnen", "Buch schließen", "Sūrah", "Arabisch", "Mit Lautschrift", "Mit Deutsch", "Taǧwīd · folgt", "Zurückblättern", "Weiterblättern", "Vorschauseite", "Qurʾān wird geladen …", "Qurʾān-Daten konnten nicht geladen werden.", "Testoberfläche · originale Versdaten · vorläufige Seiteneinteilung"],
    en: ["Muṣḥaf", "Book view", "Open Muṣḥaf", "Close book", "Surah", "Arabic", "With transliteration", "With German", "Tajwīd · coming", "Previous page", "Next page", "Preview page", "Loading Qurʾān …", "Unable to load Qurʾān data.", "Test surface · original verse data · provisional pagination"]
  };
  function t() { return /^en\b/i.test(document.documentElement.lang || "") ? DICT.en : DICT.de; }
  function byId(id) { return document.getElementById(id); }
  function escapeHtml(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function num(n,min,max) { return Math.min(max,Math.max(min,Math.floor(Number(n)||min))); }
  function pad(n) { return String(n).padStart(3,"0"); }
  function safeStore(data) { try { localStorage.setItem(STORE,JSON.stringify(data)); } catch (_) {} }
  function previousSelection() {
    try { var saved=JSON.parse(localStorage.getItem(STORE)||"{}"); if(saved && typeof saved==="object") {
      mode=/^(ar|latin|de)$/.test(saved.mode)?saved.mode:"ar";
      return num(saved.surah,1,114);
    }} catch (_) {}
    return 1;
  }
  function detectedPosition() {
    var found = /(?:surah|sura|chapter|s)=(\d{1,3})(?:[&#?]|$)/i.exec(location.hash || "");
    var ay = /(?:ayah|aya|verse)=(\d{1,3})(?:[&#?]|$)/i.exec(location.hash || "");
    if (found) return {surah:num(found[1],1,114),ayah:num(ay&&ay[1],1,286)};
    var continueButton = document.querySelector("[data-quran-continue]");
    var pair = continueButton && /^(\d{1,3}):(\d{1,3})$/.exec(continueButton.getAttribute("data-quran-continue")||"");
    if(pair) return {surah:num(pair[1],1,114),ayah:num(pair[2],1,286)};
    return {surah:previousSelection(),ayah:1};
  }
  function pageMarkup(items, ix) {
    var w=t(), title=chapter?chapter.name:"", roman=chapter?(chapter.transliteration||""):"";
    var text = items.map(function(v) {
      var ar=escapeHtml(v.ar||""), transliteration=escapeHtml(v.tr_readable||v.tr_academic||v.tr||""), de=escapeHtml(v.de||"");
      return '<div class="dam-verse" data-verse="'+num(v.id,1,286)+'"><div class="dam-verse-ar" lang="ar" dir="rtl">'+ar+' <span class="dam-verse-number" aria-label="Āyah '+num(v.id,1,286)+'">﴿'+num(v.id,1,286)+'﴾</span></div>'+
        (mode==="latin" && transliteration?'<div class="dam-verse-secondary" lang="en" dir="ltr">'+transliteration+'</div>':"")+
        (mode==="de" && de?'<div class="dam-verse-secondary" lang="de" dir="ltr">'+de+'</div>':"")+'</div>';
    }).join("");
    return '<div class="dam-page-inner"><header class="dam-page-head"><span>'+escapeHtml(roman)+'</span><span lang="ar" dir="rtl">'+escapeHtml(title)+'</span></header>'+
      '<div class="dam-page-content" dir="rtl">'+(text||'<div class="dam-empty" aria-hidden="true">✦</div>')+'</div>'+
      '<footer class="dam-page-footer"><span>'+w[11]+'</span><span>'+(ix+1)+'</span></footer></div>';
  }
  function groupVerses() {
    leafs=[];if(!chapter || !Array.isArray(chapter.verses)) return;
    var current=[],weight=0, limit=mode==="ar"?270:mode==="latin"?210:175;
    chapter.verses.forEach(function(v) {
      var len=String(v.ar||"").length*1.25+(mode==="latin"?String(v.tr_readable||v.tr||"").length*.45:mode==="de"?String(v.de||"").length*.55:0)+35;
      if(current.length && (weight+len>limit || current.length>=4)) {leafs.push(current);current=[];weight=0;}
      current.push(v);weight+=len;
    });
    if(current.length) leafs.push(current);
    if(!leafs.length) leafs=[[]];
  }
  function perView() { return window.matchMedia && window.matchMedia("(max-width:740px)").matches ? 1 : 2; }
  function updateControls() {
    if(!root)return;
    var count=Math.max(1,Math.ceil(leafs.length/perView()));
    byId("damPageCount").textContent=(spread+1)+" / "+count;
    byId("damBack").disabled=turning||spread<=0;
    byId("damNext").disabled=turning||spread>=count-1;
    root.querySelectorAll("[data-dam-mode]").forEach(function(b){
      b.setAttribute("aria-pressed",String(mode===b.dataset.damMode));
    });
  }
  function render() {
    if(!root || !chapter) return;
    leftPage.innerHTML=perView()===2 ? pageMarkup(leafs[spread*2+1]||[],spread*2+1) : "";
    rightPage.innerHTML=pageMarkup(leafs[spread*perView()]||[],spread*perView());
    leftPage.scrollTop=0;rightPage.scrollTop=0;
    updateControls();
  }
  function goToAyah(ayah) {
    var target=Math.max(1,Number(ayah)||1), idx=leafs.findIndex(function(a){return a.some(function(v){return Number(v.id)===target;});});
    spread=Math.max(0,Math.floor(Math.max(0,idx)/perView()));render();
  }
  function turn(delta) {
    if(turning || !chapter) return;
    var next=spread+delta, max=Math.ceil(leafs.length/perView())-1;
    if(next<0 || next>max)return;
    var sheet=byId("damFlipSheet"), surface=byId("damBook");
    if(!sheet || !surface)return;
    var reduced=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduced){spread=next;render();return;}
    turning=true;updateControls();
    var oldRight=rightPage.innerHTML,oldLeft=leftPage.innerHTML;
    sheet.innerHTML='<div class="dam-flip-front">'+(delta>0?oldRight:oldLeft)+'</div><div class="dam-flip-back">'+(delta>0?pageMarkup(leafs[next*perView()+1]||[],next*perView()+1):pageMarkup(leafs[next*perView()]||[],next*perView()))+'</div>';
    sheet.hidden=false;surface.classList.add(delta>0?"dam-anim-next":"dam-anim-back");
    var finished=false;
    function done(){
      if(finished)return;finished=true;
      surface.classList.remove("dam-anim-next","dam-anim-back");
      sheet.hidden=true;sheet.innerHTML="";
      spread=next;turning=false;render();
    }
    sheet.addEventListener("animationend",done,{once:true});
    window.setTimeout(done,750);
  }
  async function loadMeta() {
    if(meta.length)return;
    var response=await fetch("/content/quran/surahs.json",{credentials:"same-origin"});
    if(!response.ok)throw new Error("Sūrah-Verzeichnis HTTP "+response.status);
    var obj=await response.json();if(!obj || !Array.isArray(obj.surahs)||obj.surahs.length!==114)throw new Error("Sūrah-Verzeichnis unvollständig");
    meta=obj.surahs;
    chapterSelect.innerHTML=meta.map(function(s){return '<option value="'+num(s.id,1,114)+'">'+num(s.id,1,114)+". "+escapeHtml(s.transliteration||s.name||"Sūrah")+'</option>';}).join("");
  }
  async function loadChapter(number,ayah) {
    var token=++loadingToken;surahNo=num(number,1,114);referenceAyah=num(ayah||1,1,286);
    var status=byId("damStatus");status.textContent=t()[12];status.hidden=false;
    chapterSelect.value=String(surahNo);
    try {
      await loadMeta();
      if(token!==loadingToken)return;
      chapterSelect.value=String(surahNo);
      var response=await fetch("/content/quran/"+pad(surahNo)+".json",{credentials:"same-origin"});
      if(!response.ok)throw new Error("Sūrah HTTP "+response.status);
      var data=await response.json();
      if(token!==loadingToken)return;
      if(Number(data.id)!==surahNo || !Array.isArray(data.verses)||data.verses.length!==Number(data.total_verses))throw new Error("Unvollständige Versdaten");
      chapter=data;groupVerses();goToAyah(referenceAyah);
      safeStore({surah:surahNo,mode:mode});status.hidden=true;
    }catch(e) {
      if(token!==loadingToken)return;
      chapter=null;leftPage.innerHTML="";rightPage.innerHTML="";
      status.textContent=t()[13];status.hidden=false;
      byId("damPageCount").textContent="–";
    }
  }
  function updateMode(next) {
    if(!/^(ar|latin|de)$/.test(next)||next===mode)return;
    var current=leafs[spread*perView()]&&leafs[spread*perView()][0];
    var target=current?Number(current.id):referenceAyah;
    mode=next;groupVerses();goToAyah(target);
    safeStore({surah:surahNo,mode:mode});
  }
  function closeBook() {
    if(!root||root.hidden)return;
    ++loadingToken;turning=false;root.hidden=true;document.documentElement.classList.remove("dam-book-open");
    document.body.style.overflow=previousOverflow;
    if(lastFocused && lastFocused.isConnected)lastFocused.focus({preventScroll:true});
  }
  function openBook() {
    if(!root)makeUI();
    lastFocused=document.activeElement;previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";root.hidden=false;
    document.documentElement.classList.add("dam-book-open");
    var position=detectedPosition();
    loadChapter(position.surah,position.ayah);
    byId("damClose").focus({preventScroll:true});
  }
  function makeUI() {
    var w=t();
    root=document.createElement("section");root.id=ROOT;root.className="dam-overlay";root.hidden=true;
    root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label",w[0]);
    root.innerHTML='<div class="dam-shell"><header class="dam-header">'+
      '<div class="dam-brand"><span class="dam-brand-kicker">DĀR AL TAWḤĪD · TEST</span><strong>'+w[0]+'</strong><span>'+w[1]+'</span></div>'+
      '<button type="button" id="damClose" class="dam-close" aria-label="'+w[3]+'">×</button></header>'+
      '<div class="dam-toolbar"><label class="dam-surah-label" for="damSurah">'+w[4]+'</label><select id="damSurah" class="dam-select" aria-label="'+w[4]+'"><option value="1">Al-Fātiḥah</option></select>'+
      '<div class="dam-modes" role="group" aria-label="Lesemodus"><button data-dam-mode="ar">'+w[5]+'</button><button data-dam-mode="latin">'+w[6]+'</button><button data-dam-mode="de">'+w[7]+'</button><button disabled title="Geprüfte Taǧwīd-Wortdaten werden benötigt">'+w[8]+'</button></div></div>'+
      '<div class="dam-stage"><div id="damBook" class="dam-book"><div class="dam-book-pages"><article id="damLeft" class="dam-page dam-page-left" aria-label="Linke Buchseite"></article><article id="damRight" class="dam-page dam-page-right" aria-label="Rechte Buchseite"></article><div id="damFlipSheet" class="dam-flip-sheet" hidden></div><div class="dam-gutter" aria-hidden="true"></div></div></div><div id="damStatus" class="dam-status" role="status"></div></div>'+
      '<footer class="dam-foot"><button type="button" id="damBack" aria-label="'+w[9]+'">‹ <span>'+w[9]+'</span></button><div class="dam-progress"><span id="damPageCount">–</span><small>'+w[14]+'</small></div><button type="button" id="damNext" aria-label="'+w[10]+'"><span>'+w[10]+'</span> ›</button></footer></div>';
    document.body.appendChild(root);
    chapterSelect=byId("damSurah");leftPage=byId("damLeft");rightPage=byId("damRight");
    byId("damClose").addEventListener("click",closeBook);
    byId("damBack").addEventListener("click",function(){turn(-1);});
    byId("damNext").addEventListener("click",function(){turn(1);});
    chapterSelect.addEventListener("change",function(){loadChapter(chapterSelect.value,1);});
    root.querySelectorAll("[data-dam-mode]").forEach(function(b){b.addEventListener("click",function(){updateMode(b.dataset.damMode);});});
    var startX=0,startY=0;
    byId("damBook").addEventListener("touchstart",function(e){if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY;}},{passive:true});
    byId("damBook").addEventListener("touchend",function(e){if(!e.changedTouches.length)return;var dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3)turn(dx<0?1:-1);},{passive:true});
    root.addEventListener("keydown",function(e) {
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeBook();return;}
      if(e.key==="ArrowLeft" && !/SELECT|INPUT/.test(e.target.tagName)){e.preventDefault();turn(1);}
      if(e.key==="ArrowRight" && !/SELECT|INPUT/.test(e.target.tagName)){e.preventDefault();turn(-1);}
      if(e.key==="Tab"){var buttons=Array.from(root.querySelectorAll("button:not(:disabled),select")).filter(function(x){return x.offsetParent!==null;});if(!buttons.length)return;var first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    root.addEventListener("pointerdown",function(e){if(e.target===root)closeBook();});
  }
  function mountTrigger() {
    var isReader=document.body.classList.contains("is-quran-reader-route");
    var isOverview=document.body.classList.contains("is-quran-overview");
    var actions=isReader?byId("qrcActions"):isOverview?document.querySelector("#qovHeader .qov-icon-actions"):null;
    if(!actions) {
      if(trigger)trigger.remove();
      trigger=null;
      if(root&&!root.hidden)closeBook();
      return;
    }
    if(trigger&&trigger.parentElement===actions)return;
    if(trigger)trigger.remove();
    trigger=document.createElement("button");trigger.type="button";trigger.id="damMushafTrigger";
    trigger.className=(isReader?"qrc-icon-btn":"qov-icon-btn")+" dam-trigger";
    trigger.textContent="▣";trigger.title=t()[2];
    trigger.setAttribute("aria-label",t()[2]);trigger.setAttribute("aria-haspopup","dialog");
    trigger.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();openBook();});
    actions.appendChild(trigger);
  }
  function boot() {
    if(ready||!document.body)return;ready=true;
    previousSelection();mountTrigger();
    var pending=false;
    function schedule(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;mountTrigger();});}
    observer=new MutationObserver(function(){schedule();});
    observer.observe(document.body,{attributes:true,attributeFilter:["class"]});
    var app=byId("appView");if(app)observer.observe(app,{childList:true,subtree:true});
    window.addEventListener("hashchange",schedule);
    window.addEventListener("pageshow",schedule);
    window.addEventListener("resize",function(){if(root&&!root.hidden&&chapter){var first=leafs[spread*perView()]&&leafs[spread*perView()][0];if(first)goToAyah(first.id);}}, {passive:true});
  }
  window.DarMushafTestBook={open:openBook,close:closeBook};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();