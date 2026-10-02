/* Live + Test web/iOS/Android (not Kids): Islamic ʿilm 3D icons at render-time, local pack for offline. */
(function(){
  if(window.__darNoble3dBoot)return;
  window.__darNoble3dBoot=true;
  const VER="1165";
  const FILES=["audio.png","bell.png","calendar.png","compass.png","dua.png","frauen.png","hadith.png","headphones.png","heart.png","home.png","ilm.png","image.png","jummah.png","library.png","lock.png","more.png","mosque.png","news.png","play.png","posts.png","prayer.png","prophets.png","qibla.png","quiz.png","quran.png","ramadan.png","saved.png","scale.png","scholars.png","settings.png","shield.png","spark.png","topics.png","wasiyyah.png","widgets.png","zakat.png"];
  const BASE=(function(){
    try{
      const p=String(location.pathname||"");
      if(p==="/test"||p.indexOf("/test/")===0)return "/test/assets/dar-3d-icons/";
    }catch(e){}
    return "/assets/dar-3d-icons/";
  })();
  const localSrc={};
  const BY_NAV={
    home:"home.png",ilm:"ilm.png",recent:"posts.png",feed:"posts.png",post:"posts.png",
    series:"posts.png",quran:"quran.png",more:"more.png",
    duas:"dua.png",dua:"dua.png","dua-cat":"dua.png",
    hadith:"hadith.png",scholars:"scholars.png",scholar:"scholars.png",
    books:"library.png",book:"library.png",bibliothek:"library.png","bibliothek-detail":"library.png",
    topics:"ilm.png",topic:"ilm.png",
    prayer:"prayer.png",jummah:"jummah.png",qibla:"compass.png",zakat:"zakat.png",
    ramadan:"ramadan.png",saved:"saved.png",settings:"settings.png",quiz:"quiz.png",
    calendar:"calendar.png",notifications:"bell.png",account:"lock.png",about:"scale.png",
    wasiyyah:"wasiyyah.png",widgets:"widgets.png","image-editor":"image.png",
    news:"news.png","news-detail":"news.png",frauen:"frauen.png",propheten:"prophets.png",
    "quran-player":"quran.png",orient:"compass.png","continue-reading":"audio.png",
    audio:"audio.png",player:"audio.png",listen:"audio.png",reciter:"audio.png",
    "quran-topics":"topics.png","quran-search":"ilm.png",appstore:"spark.png"
  };
  const BY_EMOJI={
    "⌂":"home.png","🏠":"home.png","📚":"library.png","✦":"spark.png","✨":"spark.png","🌟":"spark.png",
    "📖":"quran.png","☰":"more.png","🤲":"dua.png","📜":"hadith.png","👤":"scholars.png",
    "📘":"hadith.png","📗":"hadith.png","📙":"hadith.png","📒":"hadith.png","📓":"hadith.png",
    "🕌":"mosque.png","🕋":"compass.png","🧾":"zakat.png","🌙":"ramadan.png",
    "♡":"heart.png","❤️":"heart.png","♥":"heart.png","💛":"heart.png","⚙️":"settings.png","🧠":"quiz.png",
    "🗓️":"calendar.png","📅":"calendar.png","🔔":"bell.png","🔐":"lock.png","ℹ️":"scale.png","⚖️":"scale.png",
    "🧩":"widgets.png","🖼️":"image.png","🎧":"audio.png","📁":"library.png","🆕":"posts.png",
    "🧭":"compass.png","⚠️":"shield.png","📿":"dua.png","☝️":"ilm.png","🔗":"hadith.png",
    "🕊️":"dua.png","🌌":"dua.png","🌤️":"prayer.png","🌳":"frauen.png","🌾":"zakat.png",
    "🌼":"dua.png","💧":"dua.png","🤝":"dua.png","📄":"library.png","🗂️":"ilm.png","🔍":"ilm.png",
    "📊":"scale.png","🔁":"saved.png","🏕":"prophets.png","⛺":"prophets.png","👶":"prophets.png",
    "🧬":"prophets.png","🙌":"prophets.png","🗡":"prophets.png","🗡️":"prophets.png","👑":"prophets.png",
    "⚡":"prophets.png","🌿":"prophets.png","🌊":"prophets.png","🐋":"prophets.png","🛕":"mosque.png",
    "◆":"prophets.png","◇":"prophets.png","▶":"audio.png","🔖":"saved.png","⭐":"saved.png","📤":"posts.png",
    "🔎":"ilm.png","💡":"ilm.png","🎨":"image.png","🛡️":"shield.png","🌅":"prayer.png","☀️":"prayer.png",
    "🕐":"calendar.png","◷":"calendar.png","📲":"spark.png","📍":"compass.png"
  };
  function adultFile(file){
    const f=String(file||"ilm.png");
    if(f==="headphones.png")return "headphones.png";
    return f;
  }
  function netSrc(file){return BASE+adultFile(file||"ilm.png")+"?v="+VER}
  function src(file){
    const f=adultFile(file||"ilm.png");
    return localSrc[f]||netSrc(f);
  }
  function imgHtml(file){return '<img class="dar3d-icon" alt="" decoding="async" src="'+src(file)+'">'}
  function imgFor(file,prio){
    const im=document.createElement("img");
    im.className="dar3d-icon";
    im.alt="";
    im.src=src(file);
    im.decoding=prio==="high"?"sync":"async";
    im.fetchPriority=prio==="high"?"high":"low";
    im.style.background="transparent";
    im.style.backgroundColor="transparent";
    return im;
  }
  function fileFromTopic(text){
    const k=String(text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if(/prophet|nab[iī]|ras[uū]l|anbiya/.test(k))return "prophets.png";
    if(/gelehrt|sahab|sahabah|tabi|imam|scholars?/.test(k))return "scholars.png";
    if(/frau/.test(k))return "frauen.png";
    if(/widerleg/.test(k))return "shield.png";
    if(/manhaj/.test(k))return "compass.png";
    if(/shirk|bid[a']?ah|hukm|muhakamah|tahakum|fiqh|takfir|urteil/.test(k))return "scale.png";
    if(/sifat|sifa allah|aqidah|aqida/.test(k))return "qibla.png";
    if(/tawhid|tauhid/.test(k))return "ilm.png";
    if(/sunnah|hadith/.test(k))return "hadith.png";
    if(/qur|quran|tafsir/.test(k))return "quran.png";
    if(/du'a|dua|bittgeb|du\u02bf/.test(k))return "dua.png";
    if(/adab|akhlaq|tarbiyyah|tazkiyah|zuhd/.test(k))return "heart.png";
    if(/wissen|ilm/.test(k))return "ilm.png";
    if(/thema|beitrag/.test(k))return "posts.png";
    if(/gebet|salah|salat|prayer|moschee/.test(k))return "mosque.png";
    if(/zakat|zak[aā]t/.test(k))return "zakat.png";
    if(/rama/.test(k))return "ramadan.png";
    if(/biblioth|buch|pdf|quelle/.test(k))return "library.png";
    if(/quiz/.test(k))return "quiz.png";
    if(/wasiyy|testament/.test(k))return "wasiyyah.png";
    if(/kalender/.test(k))return "calendar.png";
    if(/qibla|ka\u02bf|ka'bah|kaaba|orient/.test(k))return "qibla.png";
    if(/vergeb|reue/.test(k))return "dua.png";
    if(/schutz|zuflucht/.test(k))return "shield.png";
    if(/jannah|jenseits/.test(k))return "mosque.png";
    return "";
  }
  function fileFromScholarGroup(g){
    const k=String(g||"").toLowerCase();
    if(/prophet/.test(k))return "spark.png";
    if(/sahab/.test(k))return "scholars.png";
    if(/tabi/.test(k))return "hadith.png";
    if(/atba/.test(k))return "scholars.png";
    if(/imam/.test(k))return "scale.png";
    if(/mufassir/.test(k))return "quran.png";
    if(/muhaddith/.test(k))return "hadith.png";
    if(/faqih/.test(k))return "scale.png";
    return "scholars.png";
  }
  function topicFallback(text){
    const k=String(text||"");
    if(!k)return "ilm.png";
    const pool=["ilm.png","hadith.png","scholars.png","scale.png","compass.png","shield.png","spark.png","heart.png"];
    let n=0;
    for(let i=0;i<k.length;i++) n=(n+k.charCodeAt(i)*(i+3))%997;
    return pool[n%pool.length];
  }
  function fileFromKind(kind,hint){
    const k=String(kind||"").toLowerCase();
    const h=String(hint||"");
    if(k==="prophet"||k==="propheten"){
      const id=h.toLowerCase().replace(/[^a-z0-9-]/g,"");
      const story={adam:1,idris:1,nuh:1,hud:1,salih:1,ibrahim:1,lut:1,ismail:1,ishaq:1,yaqub:1,yusuf:1,ayyub:1,shuayb:1,musa:1,harun:1,dawud:1,sulayman:1,ilyas:1,alyasa:1,yunus:1,zakariyya:1,yahya:1,isa:1,"dhul-kifl":1,muhammad:1,"yusha-ibn-nun":1,"al-khidr":1,luqman:1,"dhul-qarnayn":1,uzayr:1};
      if(story[id])return "prophets/"+id+".png";
      return "prophets.png";
    }
    if(k==="scholar"||k==="scholars")return fileFromScholarGroup(h);
    if(k==="topic"||k==="post"||k==="series")return fileFromTopic(h)||topicFallback(h);
    if(k==="dua"||k==="duas"||k==="dua-cat")return fileFromTopic(h)||"dua.png";
    if(k==="audio"||k==="listen"||k==="headphones")return "audio.png";
    if(k==="ayah-play"||k==="play"||k==="player")return "play.png";
    if(k==="ayah-bookmark"||k==="bookmark"||k==="bookmarkfill")return "saved.png";
    if(k==="ayah-share"||k==="share")return "posts.png";
    if(k==="ayah-tafsir"||k==="tafsir"||k==="book")return "quran.png";
    if(k==="search")return "compass.png";
    if(k==="paint"||k==="image")return "image.png";
    if(k==="more")return "more.png";
    if(k==="orient")return "compass.png";
    if(k==="quiz"){
      if(/stat|auswert|chart/i.test(h))return "scale.png";
      if(/repeat|wieder|merk|train/i.test(h))return "saved.png";
      return "quiz.png";
    }
    if(BY_NAV[k])return BY_NAV[k];
    const fromHint=fileFromTopic(h);
    if(fromHint)return fromHint;
    if(BY_EMOJI[h])return BY_EMOJI[h];
    return topicFallback(h||k);
  }
  function fileFromHost(host,el){
    if(!host&&!el)return "";
    if(el&&el.classList){
      if(el.classList.contains("direct-pick-ico")){
        const well=el.closest(".direct-pick-well");
        const sel=well&&well.querySelector("select");
        const id=sel&&sel.id||"";
        if(id==="directCategory"||id==="homeFilterCat")return "ilm.png";
        if(id==="directScholar"||id==="homeFilterScholar")return "scholars.png";
        if(id==="directBook"||id==="homeFilterBook")return "library.png";
        return "ilm.png";
      }
      if(el.classList.contains("scholars-index__mono"))return fileFromScholarGroup(el.getAttribute("data-group")||"");
      if(el.classList.contains("prophets-spotlight__icon"))return "prophets.png";
      if(el.classList.contains("prophets-row__icon")||el.classList.contains("prophets-detail__emoji")){
        const row=el.closest("[data-prophet-id]");
        return fileFromKind("prophet",(row&&row.getAttribute("data-prophet-id"))||"");
      }
      if(el.classList.contains("related-compact-icon"))return "posts.png";
      if(el.classList.contains("quiz-quick-icon")){
        const card=el.closest(".quiz-home-quick-card");
        const v=card?String(card.getAttribute("data-value")||""):"";
        if(v==="stats")return "scale.png";
        if(v==="repeat")return "saved.png";
        return "quiz.png";
      }
      if(el.classList.contains("qov-icon-btn")||el.classList.contains("qov-player-launch-ico")){
        if(el.getAttribute("data-nav")==="quran-player"||el.classList.contains("qov-player-icon"))return "play.png";
        if(el.hasAttribute("data-qov-open-display")||el.id==="qovSettingsBtn")return "settings.png";
      }
      if(el.classList.contains("qov-wake-labeled-icon"))return "";
      if(el.classList.contains("qrc-context-btn")||(host&&host.classList&&host.classList.contains("qrc-context-btn"))){
        const hid=(el.id||(host&&host.id)||"");
        if(hid==="qrcContextSearchBtn")return "ilm.png";
        if(hid==="qrcContextTafsirBtn")return "quran.png";
        if(hid==="qrcContextBookmarksBtn")return "saved.png";
      }
      if(el.classList.contains("qrc-play-mark"))return "";
      if(el.classList.contains("quran-ayah-action-btn--play")||(host&&host.classList&&host.classList.contains("quran-ayah-action-btn--play")))return "";
      if(el.classList.contains("quran-ayah-action-btn--bookmark"))return "saved.png";
      if(el.classList.contains("quran-ayah-action-btn--tafsir"))return "quran.png";
      if(host&&host.classList){
        if(host.classList.contains("quran-ayah-action-btn--play"))return "";
        if(host.classList.contains("quran-ayah-action-btn--bookmark"))return "saved.png";
        if(host.classList.contains("quran-ayah-action-btn--tafsir"))return "quran.png";
      }
      if(el.classList.contains("home-hijri-ico"))return "calendar.png";
      if(el.classList.contains("more-quick-access__ico")){
        const chip=el.closest("[data-more-quick]");
        const q=chip?String(chip.getAttribute("data-more-quick")||""):"";
        if(q==="orient")return "compass.png";
        if(q==="saved")return "heart.png";
        if(q==="notifications")return "bell.png";
        if(q==="settings")return "settings.png";
      }
    }
    const nav=host?String(host.getAttribute("data-bottom-nav")||host.getAttribute("data-nav")||host.getAttribute("data-qa-action")||host.getAttribute("data-more-quick")||"").toLowerCase():"";
    const title=String((host&&(host.querySelector("h3,h4,.home-v380-open-row__title,.home-v380-post-title,.topics-theme-card__body h3,.scholars-index__name,.prophets-row__name")||{}).textContent)||(host&&host.getAttribute("aria-label"))||"").toLowerCase();
    const meta=String((host&&(host.querySelector(".post-row__meta,.dua-row__meta,.topics-theme-card__count,.scholars-index__sub")||{}).textContent)||"");
    const blob=title+" "+meta+" "+String((el&&el.textContent)||"");
    if(nav==="topic"||nav==="post"||nav==="series"||nav==="dua-cat"){
      return fileFromTopic(blob)||fileFromTopic(title)||fileFromKind(nav,blob);
    }
    if(BY_NAV[nav])return BY_NAV[nav];
    if(host&&host.getAttribute("data-quran-continue"))return "quran.png";
    const fromText=fileFromTopic(blob);
    if(fromText)return fromText;
    const t=String((el&&el.textContent)||"").trim();
    if(BY_EMOJI[t])return BY_EMOJI[t];
    for(const key of Object.keys(BY_EMOJI)){
      if(t.indexOf(key)!==-1)return BY_EMOJI[key];
    }
    return "";
  }
  function sameFile(cur,file){
    const f=String(file||"");
    const c=String(cur||"");
    if(!f||!c)return false;
    return c.indexOf(f)!==-1;
  }
  function fill(el,file,prio){
    if(!el||!file)return;
    if(el.closest&&(el.closest(".qov-wake-labeled-btn")||el.closest(".qov-player-icon")||el.closest(".quran-ayah-action-btn--play")||el.classList.contains("qov-wake-labeled-icon")||el.classList.contains("qrc-play-mark")))return;
    const want=src(file);
    el.querySelectorAll("img.dar3d-icon").forEach(function(im,i){if(i>0){try{im.remove()}catch(e){}}});
    const existing=el.querySelector("img.dar3d-icon");
    if(existing){
      existing.setAttribute("src",want);
      existing.style.background="transparent";
      existing.style.backgroundColor="transparent";
      try{el.style.fontSize="0";el.style.color="transparent"}catch(e){}
      return;
    }
    if(el.matches&&el.matches("img.dar3d-icon")){
      el.setAttribute("src",want);
      return;
    }
    try{el.style.fontSize="0";el.style.color="transparent"}catch(e){}
    el.querySelectorAll("svg,img.dar3d-icon").forEach(function(s){try{s.remove()}catch(e){}});
    const keep=[];
    el.childNodes.forEach(function(n){if(n.nodeType===1&&n.classList&&(n.classList.contains("quick-action-badge")||n.classList.contains("quick-action-dot")))keep.push(n)});
    el.textContent="";
    keep.forEach(function(n){el.appendChild(n)});
    const im=imgFor(file,prio);
    im.style.background="transparent";
    el.insertBefore(im,el.firstChild);
  }
  const SLOT_SEL=".feature-icon,.emoji-emblem,.folder-icon,.book-library-icon,.prophets-spotlight__icon,.quick-action-emoji,.quiz-quick-icon,.scholars-index__mono,.prophets-row__icon,.prophets-detail__emoji,.home-v380-lib-card__ico,.home-premium-access-card__icon,.home-premium-mini__icon,.home-tawhid-entry__icon,.library-focus-teaser__icon,.zakat-home-teaser-icon,.home-v380-quran-hero__mark,.qrc-btn-emoji,.home-hijri-ico,.settings-live-icon,.direct-pick-ico,.related-compact-icon,.more-quick-access__ico,.current-focus-icon,.qrc-menu-emoji";
  function scan(){
    document.querySelectorAll("#bottomNav [data-bottom-nav]").forEach(btn=>{
      const icon=btn.querySelector(".nav-icon");
      const file=BY_NAV[String(btn.getAttribute("data-bottom-nav")||"")];
      fill(icon,file,"high");
    });
    const root=document.getElementById("appView")||document;
    root.querySelectorAll(SLOT_SEL).forEach(el=>{
      if(el.querySelector(".emoji-emblem")&&!el.classList.contains("emoji-emblem"))return;
      const host=el.closest("[data-bottom-nav],[data-nav],[data-qa-action],[data-more-quick],[data-quran-continue],[data-scholar-open],[data-prophet-id],.quick-action,.prophets-spotlight,.quiz-home-quick-card,.scholars-index__row,.prophets-row,.prophets-detail,.post-row,.topics-theme-card,.dua-theme-card,.dua-row,.quran-ayah-action-btn,.direct-pick-well,.related-compact-card,.current-focus-row,.qrc-context-btn,.qov-icon-btn,.qov-learn-launch,.qov-player-launch");
      fill(el,fileFromHost(host,el)||fileFromKind("",el.textContent||""));
    });
    document.querySelectorAll("#quickAccessMenu .quick-action-emoji,#quickAccessLayer .quick-action-emoji").forEach(el=>{
      const host=el.closest("[data-qa-action],.quick-action");
      fill(el,fileFromHost(host,el)||fileFromKind("",el.textContent||""));
    });
    root.querySelectorAll(".quran-ayah-action-btn").forEach(btn=>{
      if(btn.classList.contains("quran-ayah-action-btn--play")){
        btn.querySelectorAll("img,svg,.qrc-play-mark,.qrc-btn-emoji").forEach(function(n){try{n.remove()}catch(e){}});
        if(String(btn.textContent||"").trim()!=="\u25B6") btn.textContent="\u25B6";
        btn.classList.remove("qov-player-icon");
        btn.style.fontSize="";
        btn.style.color="";
        btn.style.backgroundImage="none";
        return;
      }
      let file="quran.png";
      if(btn.classList.contains("quran-ayah-action-btn--bookmark"))file="saved.png";
      else if(btn.classList.contains("quran-ayah-action-btn--share")) { btn.remove(); return; }
      else if(btn.classList.contains("quran-ayah-action-btn--tafsir"))file="quran.png";
      const imgs=btn.querySelectorAll("img.dar3d-icon");
      if(imgs.length){
        imgs.forEach(function(im,i){if(i>0)try{im.remove()}catch(e){}});
        imgs[0].setAttribute("src",src(file));
        btn.style.backgroundImage="none";
        return;
      }
      const svg=btn.querySelector("svg,.qrc-play-mark,.qrc-btn-emoji");
      if(svg)svg.replaceWith(imgFor(file));
      else btn.insertBefore(imgFor(file),btn.firstChild);
      btn.style.backgroundImage="none";
    });
  }
  function openDb(){
    return new Promise((res,rej)=>{
      try{
        const r=indexedDB.open("dar-3d-icon-pack-v1106",1);
        r.onupgradeneeded=function(){r.result.createObjectStore("png")};
        r.onsuccess=function(){res(r.result)};
        r.onerror=function(){rej(r.error)};
      }catch(e){rej(e)}
    });
  }
  async function hydrateLocal(){
    try{
      const db=await openDb();
      const tx=db.transaction("png","readonly");
      const store=tx.objectStore("png");
      await Promise.all(FILES.map(f=>new Promise(done=>{
        try{
          const g=store.get(f);
          g.onsuccess=function(){
            if(g.result instanceof Blob && g.result.size>0){
              if(localSrc[f]){try{URL.revokeObjectURL(localSrc[f])}catch(e){}}
              localSrc[f]=URL.createObjectURL(g.result);
            }
            done();
          };
          g.onerror=function(){done()};
        }catch(e){done()}
      })));
    }catch(e){}
  }
  function decodeWarm(url){
    try{
      const im=new Image();
      im.decoding="async";
      im.src=url;
    }catch(e){}
  }
  async function persistPack(){
    const urls=FILES.map(netSrc);
    urls.forEach(decodeWarm);
    try{
      if("caches" in window){
        const cache=await caches.open("dar-3d-icons-v"+VER);
        await Promise.all(urls.map(async u=>{
          try{
            const hit=await cache.match(u);
            if(hit)return;
            const r=await fetch(u,{cache:"force-cache",credentials:"same-origin"});
            if(r&&r.ok)await cache.put(u,r.clone());
          }catch(e){}
        }));
      }
    }catch(e){}
    try{
      const db=await openDb();
      const tx=db.transaction("png","readwrite");
      const store=tx.objectStore("png");
      for(const f of FILES){
        if(localSrc[f])continue;
        try{
          const r=await fetch(netSrc(f),{cache:"force-cache",credentials:"same-origin"});
          if(!r||!r.ok)continue;
          const b=await r.blob();
          if(!b||!b.size)continue;
          store.put(b,f);
          localSrc[f]=URL.createObjectURL(b);
        }catch(e){}
      }
    }catch(e){}
    scan();
  }
  window.dar3dIconSrc=src;
  window.dar3dImg=imgHtml;
  window.dar3dIconFile=fileFromKind;
  window.dar3dIconMarkup=function(kind,hint){return imgHtml(fileFromKind(kind,hint))};
  window.__darNoble3dScan=scan;
  window.__darNoble3dFiles=FILES.slice();
  function observe(){
    const root=document.getElementById("appView");
    if(!root||root.__dar3dObs)return;
    let t=null;
    root.__dar3dObs=new MutationObserver(function(){
      if(t)return;
      t=setTimeout(function(){t=null;scan();},50);
    });
    root.__dar3dObs.observe(root,{childList:true,subtree:true});
  }
  function boot(){
    scan();
    observe();
    hydrateLocal().then(function(){scan();persistPack()});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
  document.addEventListener("dar:view-rendered",scan);
})();


/* DAR_LIBRARY_ENHANCER_V1170 · Test/Staging only. */
(function(){
  "use strict";
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]})}
  function routeParts(){
    var raw="";
    try{raw=decodeURIComponent(String(location.hash||"#home").replace(/^#/,""))}catch(e){raw=String(location.hash||"#home").replace(/^#/,"")}
    var p=raw.split("/").filter(Boolean);
    return{view:p[0]||"home",value:p.slice(1).join("/")};
  }
  function syncRouteClasses(){
    if(!document.body)return;
    var r=routeParts();
    document.body.classList.toggle("dar-library-quiz-home",r.view==="quiz"&&(!r.value||r.value==="home"));
    document.body.classList.toggle("dar-library-more",r.view==="more"&&!r.value);
  }
  function insertHomeFeature(){
    var r=routeParts();
    if(r.view!=="home")return;
    var shell=document.querySelector(".home-v380-shell");
    if(!shell||shell.querySelector(".dar-library-feature"))return;
    var post=null;
    try{if(typeof recommendedPost==="function")post=recommendedPost()}catch(e){}
    var btn=document.createElement("button");
    btn.type="button";
    btn.className="dar-library-feature dar-click-glow";
    if(post&&post.id){
      btn.setAttribute("data-nav","post");
      btn.setAttribute("data-value",String(post.id));
      btn.setAttribute("aria-label","Heute empfohlen lesen: "+String(post.title||"Beitrag"));
    }else{
      btn.setAttribute("data-nav","recent");
      btn.setAttribute("aria-label","Empfohlene Beiträge öffnen");
    }
    var title=post&&post.title?post.title:"Heute empfohlen";
    var meta=[post&&post.category,post&&post.scholar].filter(Boolean).join(" · ")||"Wissen aus Qurʾān, authentischer Sunnah und den Āthār";
    btn.innerHTML='<span class="dar-library-feature__kicker">Heute empfohlen</span><span class="dar-library-feature__title">'+esc(title)+'</span><span class="dar-library-feature__meta">'+esc(meta)+'</span>';
    var hero=shell.querySelector(".home-v380-quran-hero");
    if(hero)hero.insertAdjacentElement("afterend",btn);else shell.prepend(btn);
  }
  function markNeutralOrnament(){
    document.querySelectorAll(".dar-library-feature,.home-line-tawhid,.quiz-menu-card,.qov-header,.more-group").forEach(function(el){
      el.setAttribute("data-dar-ornament","neutral-no-cross-no-six-point-star");
    });
  }
  function enhance(){syncRouteClasses();insertHomeFeature();markNeutralOrnament()}
  var timer=0;
  function schedule(){clearTimeout(timer);timer=setTimeout(enhance,24)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",enhance,{once:true});else enhance();
  window.addEventListener("hashchange",schedule,{passive:true});
  document.addEventListener("dar:view-rendered",schedule);
  var root=document.getElementById("appView");
  if(root&&!root.__darLibraryObs){
    root.__darLibraryObs=new MutationObserver(schedule);
    root.__darLibraryObs.observe(root,{childList:true,subtree:true});
  }
})();
