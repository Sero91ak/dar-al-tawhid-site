/* Test-only: Islamic ʿilm 3D icons on every surface, including home-v380 */
(function(){
  const VER="1040";
  const BASE="/test/assets/dar-3d-icons/";
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
    "quran-player":"audio.png",orient:"qibla.png","continue-reading":"quran.png",
    "quran-topics":"ilm.png","quran-search":"ilm.png"
  };
  const BY_EMOJI={
    "⌂":"home.png","🏠":"home.png","📚":"library.png","✦":"posts.png","✨":"prophets.png",
    "📖":"quran.png","☰":"more.png","🤲":"dua.png","📜":"hadith.png","👤":"scholars.png",
    "📘":"hadith.png","🕌":"prayer.png","🕋":"qibla.png","🧾":"zakat.png","🌙":"ramadan.png",
    "♡":"saved.png","❤️":"saved.png","♥":"saved.png","⚙️":"settings.png","🧠":"quiz.png",
    "🗓️":"calendar.png","🔔":"bell.png","🔐":"lock.png","ℹ️":"scale.png","⚖️":"scale.png",
    "🧩":"widgets.png","🖼️":"image.png","🎧":"audio.png","📁":"library.png","🆕":"posts.png",
    "🧭":"compass.png","⚠️":"scale.png","📿":"quran.png","☝️":"home.png","🔗":"hadith.png",
    "🕊️":"dua.png","💛":"dua.png","🌌":"dua.png","🌤️":"dua.png","🌳":"dua.png","🌾":"dua.png",
    "🌼":"dua.png","💧":"dua.png","🤝":"dua.png","📄":"library.png","🗂️":"ilm.png","🔍":"ilm.png"
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
  function fileFromHost(host,el){
    if(!host&&!el)return "";
    const nav=host?String(host.getAttribute("data-bottom-nav")||host.getAttribute("data-nav")||host.getAttribute("data-qa-action")||"").toLowerCase():"";
    if(BY_NAV[nav])return BY_NAV[nav];
    if(host&&host.getAttribute("data-quran-continue"))return "quran.png";
    const title=String((host&&(host.querySelector("h3,h4,.home-v380-open-row__title,.home-v380-post-title")||{}).textContent)||host&&host.getAttribute("aria-label")||"").toLowerCase();
    if(/prophet/.test(title))return "prophets.png";
    if(/frau/.test(title))return "frauen.png";
    if(/qurʾ|qur'an|quran/.test(title))return "quran.png";
    if(/ilm|wissen/.test(title))return "ilm.png";
    if(/jumu/.test(title))return "jummah.png";
    if(/gebet/.test(title))return "prayer.png";
    if(/qibla|kaʿ|ka'bah/.test(title))return "qibla.png";
    if(/zak/.test(title))return "zakat.png";
    if(/duʿ|dua|bitt/.test(title))return "dua.png";
    if(/hadith|ḥadī/.test(title))return "hadith.png";
    if(/gelehrt/.test(title))return "scholars.png";
    if(/biblioth|pdf/.test(title))return "library.png";
    if(/rama/.test(title))return "ramadan.png";
    if(/favorit|gespeich|merk/.test(title))return "saved.png";
    if(/einstell/.test(title))return "settings.png";
    if(/quiz/.test(title))return "quiz.png";
    if(/kalender/.test(title))return "calendar.png";
    if(/benachricht|erinner/.test(title))return "bell.png";
    if(/wasiyy|testament/.test(title))return "wasiyyah.png";
    if(/widget/.test(title))return "widgets.png";
    if(/player|hören|tilaw/.test(title))return "audio.png";
    if(/maßstab|manhaj|über die/.test(title))return "scale.png";
    const t=String((el&&el.textContent)||"").trim();
    if(BY_EMOJI[t])return BY_EMOJI[t];
    for(const k of Object.keys(BY_EMOJI)){
      if(t.indexOf(k)!==-1)return BY_EMOJI[k];
    }
    if(nav==="post"||nav==="recent")return "posts.png";
    return "";
  }
  function fill(el,file){
    if(!el||!file)return;
    if(el.querySelector("img.dar3d-icon"))return;
    el.textContent="";
    el.appendChild(imgFor(file));
  }
  function prependSlot(host,file){
    if(!host||!file)return;
    if(host.querySelector(":scope > .dar3d-slot, :scope > img.dar3d-icon"))return;
    const slot=document.createElement("span");
    slot.className="dar3d-slot";
    slot.setAttribute("aria-hidden","true");
    slot.appendChild(imgFor(file));
    host.insertBefore(slot,host.firstChild);
    host.classList.add("dar3d-has-icon");
  }
  function scan(){
    document.querySelectorAll("#bottomNav [data-bottom-nav]").forEach(btn=>{
      const icon=btn.querySelector(".nav-icon");
      const file=BY_NAV[String(btn.getAttribute("data-bottom-nav")||"")];
      fill(icon,file);
    });
    const marks=[
      ".nav-icon",".feature-icon",".emoji-emblem",".folder-icon",".book-library-icon",
      ".home-v380-lib-card__ico",".home-v380-quran-hero__mark",".library-focus-teaser__icon",
      ".zakat-home-teaser-icon",".quick-action-emoji",".home-discover-pdf-cover__fallback"
    ].join(",");
    document.querySelectorAll(marks).forEach(el=>{
      const host=el.closest("[data-bottom-nav],[data-nav],[data-qa-action],[data-quran-continue],.quick-action");
      fill(el,fileFromHost(host,el));
    });
    document.querySelectorAll(".home-v380-open-row[data-nav],.home-v380-post-preview[data-nav],.home-v380-popular-row[data-nav]").forEach(host=>{
      prependSlot(host,fileFromHost(host,null));
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scan);
  else scan();
  let t=0;
  function queued(){clearTimeout(t);t=setTimeout(scan,50)}
  if(typeof MutationObserver==="function"){
    const mo=new MutationObserver(queued);
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }
  document.addEventListener("dar:view-rendered",queued);
  setTimeout(scan,300);
  setTimeout(scan,1200);
  setTimeout(scan,2800);
})();
