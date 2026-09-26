/* Test-only: replace emoji glyphs with themed noble 3D objects */
(function(){
  const VER="1037";
  const BASE="/test/assets/dar-3d-icons/";
  const BY_NAV={
    home:"home.png",ilm:"ilm.png",recent:"posts.png",feed:"posts.png",
    quran:"quran.png",more:"more.png",duas:"dua.png",dua:"dua.png","dua-cat":"dua.png",
    hadith:"hadith.png",scholars:"scholars.png",books:"library.png",book:"library.png",
    bibliothek:"library.png",topics:"library.png",topic:"library.png",
    prayer:"prayer.png",jummah:"jummah.png",qibla:"qibla.png",zakat:"zakat.png",
    ramadan:"ramadan.png",saved:"saved.png",settings:"settings.png",quiz:"quiz.png",
    calendar:"calendar.png",notifications:"bell.png",account:"lock.png",about:"scale.png",
    wasiyyah:"wasiyyah.png",widgets:"widgets.png","image-editor":"image.png",
    news:"news.png",frauen:"frauen.png",propheten:"prophets.png","quran-player":"audio.png"
  };
  const BY_EMOJI={
    "⌂":"home.png","🏠":"home.png","📚":"ilm.png","✦":"posts.png","✨":"news.png",
    "📖":"quran.png","☰":"more.png","🤲":"dua.png","📜":"hadith.png","👤":"scholars.png",
    "📘":"ilm.png","🕌":"prayer.png","🕋":"qibla.png","🧾":"zakat.png","🌙":"ramadan.png",
    "♡":"saved.png","⚙️":"settings.png","🧠":"quiz.png","🗓️":"calendar.png","🔔":"bell.png",
    "🔐":"lock.png","ℹ️":"scale.png","⚖️":"scale.png","🧩":"widgets.png","🖼️":"image.png",
    "🎧":"audio.png","📁":"library.png","🆕":"posts.png","🧭":"compass.png"
  };
  function src(file){return BASE+file+"?v="+VER}
  function imgFor(file){
    const im=document.createElement("img");
    im.className="dar3d-icon";
    im.alt="";
    im.decoding="async";
    im.src=src(file);
    return im;
  }
  function fileFromContext(el){
    const navBtn=el.closest("[data-bottom-nav],[data-nav],[data-feature-search]");
    if(navBtn){
      const nav=String(navBtn.getAttribute("data-bottom-nav")||navBtn.getAttribute("data-nav")||"").toLowerCase();
      if(BY_NAV[nav])return BY_NAV[nav];
      if(nav==="topics")return "library.png";
    }
    const t=String(el.textContent||"").trim();
    if(BY_EMOJI[t])return BY_EMOJI[t];
    for(const k of Object.keys(BY_EMOJI)){
      if(t.indexOf(k)!==-1)return BY_EMOJI[k];
    }
    const title=String((navBtn&&navBtn.querySelector("h3,h4")||{}).textContent||"").toLowerCase();
    if(/prophet/.test(title))return "prophets.png";
    if(/frau/.test(title))return "frauen.png";
    if(/qur/.test(title))return "quran.png";
    if(/ilm|wissen/.test(title))return "ilm.png";
    if(/gebet|jumu/.test(title))return "prayer.png";
    if(/qibla|kaʿ|ka'/.test(title))return "qibla.png";
    if(/zak/.test(title))return "zakat.png";
    if(/duʿ|dua|bitt/.test(title))return "dua.png";
    if(/hadith|ḥadī/.test(title))return "hadith.png";
    if(/gelehrt/.test(title))return "scholars.png";
    if(/biblioth|buch|werke/.test(title))return "library.png";
    if(/rama/.test(title))return "ramadan.png";
    if(/favorit|gespeich/.test(title))return "saved.png";
    if(/einstell/.test(title))return "settings.png";
    if(/quiz/.test(title))return "quiz.png";
    if(/kalender/.test(title))return "calendar.png";
    if(/benachricht/.test(title))return "bell.png";
    if(/bereich|anmeld|pin/.test(title))return "lock.png";
    if(/über die|maßstab/.test(title))return "scale.png";
    if(/wasiyy/.test(title))return "wasiyyah.png";
    if(/widget/.test(title))return "widgets.png";
    if(/bild-beitrag|vorlage/.test(title))return "image.png";
    if(/player|hören/.test(title))return "audio.png";
    return "";
  }
  function applyEl(el){
    if(!el||el.querySelector("img.dar3d-icon"))return;
    const file=fileFromContext(el);
    if(!file)return;
    el.textContent="";
    el.appendChild(imgFor(file));
  }
  function scan(root){
    const scope=root||document;
    scope.querySelectorAll(".nav-icon,.feature-icon,.emoji-emblem,.folder-icon,.book-library-icon").forEach(applyEl);
  }
  function navDirect(){
    document.querySelectorAll("#bottomNav [data-bottom-nav]").forEach(btn=>{
      const icon=btn.querySelector(".nav-icon");
      if(!icon)return;
      const nav=String(btn.getAttribute("data-bottom-nav")||"");
      const file=BY_NAV[nav];
      if(!file)return;
      if(icon.querySelector("img.dar3d-icon"))return;
      icon.textContent="";
      icon.appendChild(imgFor(file));
    });
  }
  function run(){navDirect();scan(document.getElementById("appView")||document);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);
  else run();
  let t=0;
  function queued(){clearTimeout(t);t=setTimeout(run,40)}
  const view=document.getElementById("appView");
  if(view&&typeof MutationObserver==="function"){
    const mo=new MutationObserver(queued);
    mo.observe(view,{childList:true,subtree:true});
  }
  document.addEventListener("dar:view-rendered",queued);
  setTimeout(run,400);
  setTimeout(run,1600);
})();
