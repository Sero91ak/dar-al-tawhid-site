/* Live + Test web/iOS/Android (not Kids): Islamic ʿilm 3D icons at render-time. */
(function(){
  if(window.__darNoble3dBoot)return;
  window.__darNoble3dBoot=true;
  const VER="1073";
  const BASE=(function(){
    try{
      const p=String(location.pathname||"");
      if(p==="/test"||p.indexOf("/test/")===0)return "/test/assets/dar-3d-icons/";
    }catch(e){}
    return "/assets/dar-3d-icons/";
  })();
  const BY_NAV={
    home:"home.png",ilm:"ilm.png",recent:"posts.png",feed:"posts.png",post:"posts.png",
    series:"posts.png",quran:"quran.png",more:"more.png",
    duas:"dua.png",dua:"dua.png","dua-cat":"dua.png",
    hadith:"hadith.png",scholars:"scholars.png",scholar:"scholars.png",
    books:"library.png",book:"library.png",bibliothek:"library.png","bibliothek-detail":"library.png",
    topics:"ilm.png",topic:"ilm.png",
    prayer:"prayer.png",jummah:"jummah.png",qibla:"qibla.png",zakat:"zakat.png",
    ramadan:"ramadan.png",saved:"saved.png",settings:"settings.png",quiz:"quiz.png",
    calendar:"calendar.png",notifications:"bell.png",account:"lock.png",about:"scale.png",
    wasiyyah:"wasiyyah.png",widgets:"widgets.png","image-editor":"image.png",
    news:"news.png","news-detail":"news.png",frauen:"frauen.png",propheten:"prophets.png",
    "quran-player":"audio.png",orient:"compass.png","continue-reading":"quran.png",
    "quran-topics":"ilm.png","quran-search":"ilm.png"
  };
  const BY_EMOJI={
    "⌂":"home.png","🏠":"home.png","📚":"library.png","✦":"spark.png","✨":"spark.png","🌟":"spark.png",
    "📖":"quran.png","☰":"more.png","🤲":"dua.png","📜":"hadith.png","👤":"scholars.png",
    "📘":"hadith.png","🕌":"mosque.png","🕋":"qibla.png","🧾":"zakat.png","🌙":"ramadan.png",
    "♡":"heart.png","❤️":"heart.png","♥":"heart.png","💛":"heart.png","⚙️":"settings.png","🧠":"quiz.png",
    "🗓️":"calendar.png","📅":"calendar.png","🔔":"bell.png","🔐":"lock.png","ℹ️":"scale.png","⚖️":"scale.png",
    "🧩":"widgets.png","🖼️":"image.png","🎧":"headphones.png","📁":"library.png","🆕":"posts.png",
    "🧭":"compass.png","⚠️":"shield.png","📿":"dua.png","☝️":"ilm.png","🔗":"hadith.png",
    "🕊️":"dua.png","🌌":"dua.png","🌤️":"prayer.png","🌳":"frauen.png","🌾":"zakat.png",
    "🌼":"dua.png","💧":"dua.png","🤝":"dua.png","📄":"library.png","🗂️":"ilm.png","🔍":"ilm.png",
    "📊":"scale.png","🔁":"saved.png","🏕":"prophets.png","⛺":"prophets.png","👶":"prophets.png",
    "🧬":"prophets.png","🙌":"prophets.png","🗡":"prophets.png","🗡️":"prophets.png","👑":"prophets.png",
    "⚡":"prophets.png","🌿":"prophets.png","🌊":"prophets.png","🐋":"prophets.png","🛕":"mosque.png",
    "◆":"prophets.png","◇":"prophets.png","▶":"play.png","🔖":"saved.png","⭐":"saved.png","📤":"posts.png",
    "🔎":"ilm.png","💡":"ilm.png","🎨":"image.png","🛡️":"shield.png","🌅":"prayer.png","☀️":"prayer.png",
    "🕐":"calendar.png","◷":"calendar.png"
  };
  function src(file){return BASE+(file||"ilm.png")+"?v="+VER}
  function imgHtml(file){return '<img class="dar3d-icon" alt="" decoding="async" src="'+src(file)+'">'}
  function imgFor(file,prio){
    const im=document.createElement("img");
    im.className="dar3d-icon";
    im.alt="";
    im.src=src(file);
    im.decoding=prio==="high"?"sync":"async";
    im.fetchPriority=prio==="high"?"high":"low";
    return im;
  }
  function fileFromTopic(text){
    const k=String(text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if(/prophet|nab[iī]|ras[uū]l/.test(k))return "prophets.png";
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
    if(/gebet|salah|salat|prayer|moschee/.test(k))return "mosque.png";
    if(/zakat|zak[aā]t/.test(k))return "zakat.png";
    if(/rama/.test(k))return "ramadan.png";
    if(/biblioth|buch|pdf|quelle/.test(k))return "library.png";
    if(/quiz/.test(k))return "quiz.png";
    if(/wasiyy|testament/.test(k))return "wasiyyah.png";
    if(/kalender/.test(k))return "calendar.png";
    if(/qibla|ka\u02bf|ka'bah|kaaba/.test(k))return "qibla.png";
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
  function fileFromKind(kind,hint){
    const k=String(kind||"").toLowerCase();
    const h=String(hint||"");
    if(k==="prophet"||k==="propheten")return "prophets.png";
    if(k==="scholar"||k==="scholars")return fileFromScholarGroup(h);
    if(k==="topic"||k==="post"||k==="series")return fileFromTopic(h)||"ilm.png";
    if(k==="dua"||k==="duas"||k==="dua-cat")return fileFromTopic(h)||"dua.png";
    if(k==="ayah-play"||k==="play")return "play.png";
    if(k==="ayah-bookmark"||k==="bookmark"||k==="bookmarkfill")return "saved.png";
    if(k==="ayah-share"||k==="share")return "posts.png";
    if(k==="ayah-tafsir"||k==="tafsir"||k==="book")return "quran.png";
    if(k==="search")return "ilm.png";
    if(k==="paint"||k==="image")return "image.png";
    if(k==="more")return "more.png";
    if(k==="quiz"){
      if(/stat|auswert|chart/i.test(h))return "scale.png";
      if(/repeat|wieder|merk|train/i.test(h))return "saved.png";
      return "quiz.png";
    }
    if(BY_NAV[k])return BY_NAV[k];
    const fromHint=fileFromTopic(h);
    if(fromHint)return fromHint;
    if(BY_EMOJI[h])return BY_EMOJI[h];
    return "ilm.png";
  }
  function fileFromHost(host,el){
    if(!host&&!el)return "";
    if(el&&el.classList){
      if(el.classList.contains("scholars-index__mono"))return fileFromScholarGroup(el.getAttribute("data-group")||"");
      if(el.classList.contains("prophets-row__icon")||el.classList.contains("prophets-detail__emoji")||el.classList.contains("prophets-spotlight__icon"))return "prophets.png";
      if(el.classList.contains("quiz-quick-icon")){
        const card=el.closest(".quiz-home-quick-card");
        const v=card?String(card.getAttribute("data-value")||""):"";
        if(v==="stats")return "scale.png";
        if(v==="repeat")return "saved.png";
        return "quiz.png";
      }
      if(el.classList.contains("quran-ayah-action-btn--play")||el.classList.contains("qrc-play-mark"))return "play.png";
      if(el.classList.contains("home-hijri-ico"))return "calendar.png";
    }
    const nav=host?String(host.getAttribute("data-bottom-nav")||host.getAttribute("data-nav")||host.getAttribute("data-qa-action")||"").toLowerCase():"";
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
  function fill(el,file,prio){
    if(!el||!file)return;
    const want=src(file);
    const existing=el.querySelector("img.dar3d-icon");
    if(existing){
      if(existing.getAttribute("src")!==want)existing.setAttribute("src",want);
      return;
    }
    if(el.matches&&el.matches("img.dar3d-icon")){
      if(el.getAttribute("src")!==want)el.setAttribute("src",want);
      return;
    }
    el.textContent="";
    el.appendChild(imgFor(file,prio));
  }
  const SLOT_SEL=".feature-icon,.emoji-emblem,.folder-icon,.book-library-icon,.prophets-spotlight__icon,.quick-action-emoji,.quiz-quick-icon,.scholars-index__mono,.prophets-row__icon,.prophets-detail__emoji,.home-v380-lib-card__ico,.library-focus-teaser__icon,.zakat-home-teaser-icon,.home-v380-quran-hero__mark,.qrc-btn-emoji,.qrc-play-mark,.home-hijri-ico,.settings-live-icon";
  function scan(){
    document.querySelectorAll("#bottomNav [data-bottom-nav]").forEach(btn=>{
      const icon=btn.querySelector(".nav-icon");
      const file=BY_NAV[String(btn.getAttribute("data-bottom-nav")||"")];
      fill(icon,file,"high");
    });
    const root=document.getElementById("appView")||document;
    root.querySelectorAll(SLOT_SEL).forEach(el=>{
      if(el.querySelector(".emoji-emblem")&&!el.classList.contains("emoji-emblem"))return;
      const host=el.closest("[data-bottom-nav],[data-nav],[data-qa-action],[data-quran-continue],[data-scholar-open],[data-prophet-id],.quick-action,.prophets-spotlight,.quiz-home-quick-card,.scholars-index__row,.prophets-row,.prophets-detail,.post-row,.topics-theme-card,.dua-theme-card,.dua-row,.quran-ayah-action-btn");
      fill(el,fileFromHost(host,el)||fileFromKind("",el.textContent||""));
    });
    root.querySelectorAll(".quran-ayah-action-btn").forEach(btn=>{
      if(btn.querySelector("img.dar3d-icon"))return;
      let file="quran.png";
      if(btn.classList.contains("quran-ayah-action-btn--play"))file="play.png";
      else if(btn.classList.contains("quran-ayah-action-btn--bookmark"))file="saved.png";
      else if(btn.classList.contains("quran-ayah-action-btn--share"))file="posts.png";
      else if(btn.classList.contains("quran-ayah-action-btn--tafsir"))file="quran.png";
      const svg=btn.querySelector("svg,.qrc-play-mark,.qrc-btn-emoji");
      if(svg)svg.replaceWith(imgFor(file));
      else btn.insertBefore(imgFor(file),btn.firstChild);
    });
  }
  window.dar3dIconSrc=src;
  window.dar3dImg=imgHtml;
  window.dar3dIconFile=fileFromKind;
  window.dar3dIconMarkup=function(kind,hint){return imgHtml(fileFromKind(kind,hint))};
  window.__darNoble3dScan=scan;
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
  function boot(){scan();observe()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
  document.addEventListener("dar:view-rendered",scan);
})();
