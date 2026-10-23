/* DĀR NEXT · Test only · Progressive enhancement without reimplementing any app data. */
(function() {
  "use strict";
  if (!/^\/test(?:\/|$)/.test(location.pathname) || /^\/test\/(?:kids|admin)(?:\/|$)/.test(location.pathname)) return;
  if (window.DAR_NEXT_V1) return;
  window.DAR_NEXT_V1 = {version: "1.0.0", mode: "test-only"};
  var root = document.documentElement;
  root.classList.add("dar-next-v1");
  var ASSET = "/test/assets/dar-3d-icons/";
  var HERO = "/test/assets/area-heroes-v1290/";
  var routes = [
    {id:"home", title:"Start", sub:"Dein Wissenszentrum", icon:"home.png", art:"more-hub.webp"},
    {id:"ilm", title:"Majlis al-ʿIlm", sub:"Quellenbasierter Wissensassistent", icon:"ilm.png", art:"ilm-chat.webp"},
    {id:"recent", title:"Beiträge", sub:"Qurʾān · Sunnah · Āṯār", icon:"posts.png", art:"post-reader.webp"},
    {id:"quran", title:"Qurʾān", sub:"Lesen, hören und verstehen", icon:"quran.png", art:"quran-overview.webp"},
    {id:"quran-player", title:"Qurʾān-Player", sub:"Rezitationen und Wiedergabe", icon:"audio.png", art:"quran-player.webp"},
    {id:"duas", title:"Duʿāʾ", sub:"Bittgebete mit Nachweisen", icon:"dua.png", art:"dua.webp"},
    {id:"topics", title:"Themen", sub:"Wissen systematisch entdecken", icon:"topics.png", art:"topics.webp"},
    {id:"hadith", title:"Ḥadīṯ", sub:"Sammlungen und Überlieferungen", icon:"hadith.png", art:"topics.webp"},
    {id:"scholars", title:"Gelehrte", sub:"Biografien und Überlieferer", icon:"scholars.png", art:"scholars.webp"},
    {id:"books", title:"Bücher", sub:"Werke und Quellen", icon:"library.png", art:"library.webp"},
    {id:"bibliothek", title:"Bibliothek", sub:"Publikationen und PDFs", icon:"library.png", art:"library.webp"},
    {id:"prayer", title:"Gebetszeiten", sub:"Gebet und Kalender", icon:"prayer.png", art:"prayer.webp"},
    {id:"qibla", title:"Qibla", sub:"Gebetsrichtung und Standort", icon:"qibla.png", art:"qibla.webp"},
    {id:"quiz", title:"Quiz", sub:"Wissen überprüfen", icon:"quiz.png", art:"quiz.webp"},
    {id:"zakat", title:"Zakāt", sub:"Berechnen und nachlesen", icon:"zakat.png", art:"more-hub.webp"},
    {id:"propheten", title:"Propheten", sub:"Geschichten und Lehren", icon:"prophets.png", art:"topics.webp"},
    {id:"frauen", title:"Frauen", sub:"Wissen und Fiqh", icon:"frauen.png", art:"topics.webp"},
    {id:"settings", title:"Einstellungen", sub:"Sprache und Erscheinungsbild", icon:"settings.png", art:"more-hub.webp"},
    {id:"more", title:"Alle Bereiche", sub:"Funktionen und Einstellungen", icon:"more.png", art:"more-hub.webp"}
  ];
  var translations = {
    de: ["DĀR AL TAWḤĪD · WISSENSZENTRUM","Wissen in einer neuen Dimension","Qurʾān, authentische Sunnah und Āṯār – verbunden in einer ruhigen, modernen Wissensumgebung.","Majlis al-ʿIlm öffnen","Bereiche entdecken","Schnellzugriff","Bereich suchen …","Wähle einen Bereich. Die bestehenden Funktionen bleiben vollständig erhalten.","Menü öffnen"],
    en: ["DĀR AL TAWḤĪD · KNOWLEDGE HUB","Knowledge, thoughtfully connected","Qurʾān, authentic Sunnah and Āṯār in a calm, modern knowledge space.","Open Majlis al-ʿIlm","Explore sections","Quick access","Search sections …","Select a section. Existing functions are preserved.","Open menu"],
    tr: ["DĀR AL TAWḤĪD · İLİM MERKEZİ","Bilgiye yeni bir bakış","Kurʾān, sahih Sünnet ve erken dönem rivayetleri modern bir ilim ortamında.","İlim meclisini aç","Bölümleri keşfet","Hızlı erişim","Bölüm ara …","Bir bölüm seçin. Mevcut işlevler korunur.","Menüyü aç"],
    ar: ["دَارُ التَّوْحِيدِ · مَرْكَزُ الْعِلْمِ","العلم في تجربة جديدة","القرآن والسنة الصحيحة وآثار السلف في مساحة علمية هادئة وحديثة.","افتح مجلس العلم","اكتشف الأقسام","الوصول السريع","ابحث عن قسم …","اختر قسمًا. جميع الوظائف الحالية محفوظة.","افتح القائمة"],
    ku: ["DĀR AL TAWḤĪD · NAVENDA ZANISTÊ","Zanist bi awayekî nû","Qurʾān, Sunneta rast û āṯār di navendeke zanistê ya nû de.","Majlis al-ʿIlm veke","Beşan bibîne","Gihîştina bilez","Li beşan bigere …","Beşek hilbijêre. Fonksiyonên heyî tên parastin.","Menûyê veke"],
    ckb: ["دَار التَّوْحِيد · ناوەندی زانست","زانست بە شێوەیەکی نوێ","قورئان، سوننەتی ڕاست و ئاسەوار لە ژینگەیەکی ئارامدا.","مەجلیسی عیلم بکەرەوە","بەشەکان ببینە","دەستگەیشتنی خێرا","گەڕان بۆ بەش …","بەشێک هەڵبژێرە. تایبەتمەندییەکان پارێزراون.","مێنیو بکەرەوە"],
    bs: ["DĀR AL TAWḤĪD · CENTAR ZNANJA","Znanje u novom okruženju","Kurʾān, vjerodostojni Sunnet i predaje ranih generacija.","Otvori medžlis znanja","Istraži odjeljke","Brzi pristup","Pretraži odjeljke …","Odaberi odjeljak. Postojeće funkcije su sačuvane.","Otvori meni"],
    fr: ["DĀR AL TAWḤĪD · CENTRE DU SAVOIR","Le savoir dans un nouvel espace","Coran, Sunna authentique et Āṯār dans un environnement serein.","Ouvrir Majlis al-ʿIlm","Explorer les rubriques","Accès rapide","Rechercher une rubrique …","Choisissez une rubrique. Les fonctions existantes sont préservées.","Ouvrir le menu"],
    es: ["DĀR AL TAWḤĪD · CENTRO DE CONOCIMIENTO","El conocimiento en un nuevo espacio","Corán, Sunna auténtica y Āṯār en un entorno sereno.","Abrir Majlis al-ʿIlm","Explorar secciones","Acceso rápido","Buscar sección …","Elige una sección. Se conservan las funciones existentes.","Abrir menú"]
  };
  var palette = null, launcher = null, search = null, grid = null, previousFocus = null;
  var scheduling = false, lastLocale = "";
  function lang() {
    var chosen = "";
    try {chosen = String(localStorage.getItem("darAdultPreferredLocaleV1") || "");} catch (_e) {}
    var raw = (chosen || String(root.lang || "de")).toLowerCase().split("-")[0];
    return Object.prototype.hasOwnProperty.call(translations,raw) ? raw : "de";
  }
  function t(index) { return translations[lang()][index]; }
  function el(tag,cls,txt) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (txt != null) node.textContent = txt;
    return node;
  }
  function image(path) {
    var img = document.createElement("img");
    img.src = ASSET + path; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    return img;
  }
  function routeId() {
    var part = String(location.hash || "#home").replace(/^#\/?/,"").split(/[/?]/)[0];
    try {part = decodeURIComponent(part);} catch (_e) {}
    return part || "home";
  }
  function go(id) {
    if (!routes.some(function (item) {return item.id === id;})) return;
    closePalette();
    if (routeId() === id) return;
    /* Preserve existing hash router and native navigation stack. */
    var native = document.querySelector('#bottomNav [data-bottom-nav="' + id + '"]');
    if (native && typeof native.click === "function") {native.click(); return;}
    location.hash = "#" + id;
  }
  function action(label,dest,primary) {
    var button=el("button","dar-next-btn"+(primary?" dar-next-btn--primary":""),label);
    button.type="button";button.addEventListener("click",function(){go(dest);});
    return button;
  }
  function makeHomeHero() {
    var box=el("section","dar-next-hero");
    box.id="darNextHomeHero";box.setAttribute("aria-label","DĀR AL TAWḤĪD");box.dataset.darnextAnimate="";
    var inner=el("div","dar-next-hero__inner");
    inner.appendChild(el("span","dar-next-kicker",t(0)));
    inner.appendChild(el("h2","",t(1)));
    inner.appendChild(el("p","",t(2)));
    var buttons=el("div","dar-next-actions");
    buttons.appendChild(action(t(3),"ilm",true));
    buttons.appendChild(action(t(4),"more",false));
    inner.appendChild(buttons);box.appendChild(inner);
    var seal=el("div","dar-next-hero__seal");seal.setAttribute("aria-hidden","true");seal.appendChild(image("ilm.png"));box.appendChild(seal);
    return box;
  }
  function makeRouteHero(item) {
    var box=el("section","dar-next-route-hero");box.id="darNextRouteHero";box.dataset.darnextAnimate="";box.dataset.darnextRoute=item.id;
    box.setAttribute("aria-label",item.title);box.style.setProperty("--dn-art",'url("' + HERO + item.art + '")');
    var copy=el("div","dar-next-route-hero__copy");
    copy.appendChild(el("div","dar-next-kicker","DĀR AL TAWḤĪD · TEST"));
    copy.appendChild(el("h2","",item.title));
    copy.appendChild(el("p","",item.sub));
    box.appendChild(copy);box.appendChild(image(item.icon));
    return box;
  }
  function makeLauncher() {
    if (launcher) return;
    launcher=el("button","dar-next-launcher");
    launcher.type="button";launcher.id="darNextLauncher";launcher.setAttribute("aria-haspopup","dialog");launcher.setAttribute("aria-controls","darNextPalette");
    launcher.setAttribute("aria-label",t(8));launcher.appendChild(image("ilm.png"));launcher.appendChild(el("span","",t(5)));
    launcher.addEventListener("click",openPalette);document.body.appendChild(launcher);
  }
  function makePalette() {
    if (palette) return;
    palette=el("div");palette.id="darNextPalette";palette.hidden=true;
    palette.setAttribute("role","dialog");palette.setAttribute("aria-modal","true");palette.setAttribute("aria-label",t(5));
    var panel=el("div","dar-next-palette__panel");
    var head=el("div","dar-next-palette__head");head.appendChild(image("ilm.png"));
    var title=el("div");
    title.appendChild(el("b","",t(5)));title.appendChild(el("small","", "DĀR AL TAWḤĪD · TEST"));
    head.appendChild(title);
    var close=el("button","dar-next-palette__close","×");close.type="button";close.setAttribute("aria-label","Schließen");
    close.addEventListener("click",closePalette);head.appendChild(close);panel.appendChild(head);
    var area=el("div","dar-next-palette__search");
    search=el("input");search.id="darNextSearch";search.type="search";search.autocomplete="off";search.placeholder=t(6);
    search.setAttribute("aria-label",t(6));
    search.addEventListener("input",renderTiles);area.appendChild(search);panel.appendChild(area);
    grid=el("div","dar-next-palette__sections");grid.id="darNextTiles";panel.appendChild(grid);
    panel.appendChild(el("div","dar-next-palette__footer",t(7)));
    palette.appendChild(panel);
    palette.addEventListener("click",function(ev){if(ev.target===palette)closePalette();});
    palette.addEventListener("keydown",function(ev) {
      if (ev.key==="Escape") {ev.preventDefault();closePalette();}
      if (ev.key!=="Tab") return;
      var controls=Array.prototype.slice.call(palette.querySelectorAll("button:not([hidden]),input:not([hidden])"));
      if (!controls.length) return;
      var first=controls[0],last=controls[controls.length-1];
      if (ev.shiftKey && document.activeElement===first){ev.preventDefault();last.focus();}
      else if (!ev.shiftKey && document.activeElement===last){ev.preventDefault();first.focus();}
    });
    document.body.appendChild(palette);renderTiles();
  }
  function renderTiles() {
    if (!grid) return;
    var val=String(search && search.value || "").trim().toLocaleLowerCase();
    grid.replaceChildren();
    var selected=routes.filter(function(item){
      return !val || (item.title+" "+item.sub+" "+item.id).toLocaleLowerCase().includes(val);
    });
    if (!selected.length){grid.appendChild(el("p","dar-next-palette__empty","Keine passenden Bereiche gefunden."));return;}
    selected.forEach(function(item){
      var btn=el("button","dar-next-palette__tile");btn.type="button";btn.dataset.darnextRoute=item.id;
      btn.appendChild(image(item.icon));
      var copy=el("span");copy.appendChild(el("strong","",item.title));copy.appendChild(el("small","",item.sub));btn.appendChild(copy);
      btn.addEventListener("click",function(){go(item.id);});grid.appendChild(btn);
    });
  }
  function openPalette() {
    makePalette();previousFocus=document.activeElement;
    palette.hidden=false;
    search.value="";renderTiles();
    document.body.classList.add("dar-next-palette-open");
    search.focus({preventScroll:true});
  }
  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.hidden=true;document.body.classList.remove("dar-next-palette-open");
    if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus==="function") previousFocus.focus({preventScroll:true});
  }
  function update() {
    if (!document.body || !document.getElementById("appView")) return;
    makeLauncher();makePalette();
    var selectedLocale = lang();
    if (lastLocale !== selectedLocale) {
      lastLocale = selectedLocale;
      var staleHome = document.getElementById("darNextHomeHero");
      var staleRoute = document.getElementById("darNextRouteHero");
      if (staleHome) staleHome.remove();
      if (staleRoute) staleRoute.remove();
    }
    document.body.classList.toggle("dar-next-is-ilm",routeId()==="ilm");
    var id=routeId(),main=document.getElementById("appView");
    if (id==="home"){
      var oldBanner=document.getElementById("darNextRouteHero");
      if(oldBanner)oldBanner.remove();
      var home=main.querySelector(".home-v380-shell");
      if (home && !home.querySelector("#darNextHomeHero")) home.insertBefore(makeHomeHero(),home.firstChild);
    } else {
      var old=document.getElementById("darNextHomeHero");
      if(old)old.remove();
      var section=routes.find(function(item){return item.id===id;});
      /* No extra hero above article readers, verse detail, player or full-screen tools. */
      var compact=["recent","quran","duas","topics","scholars","books","bibliothek","prayer","qibla","quiz","more","settings","propheten","frauen","hadith","zakat"];
      var current=main.querySelector("#darNextRouteHero");
      if (current && current.dataset.darnextRoute !== id) {current.remove();current=null;}
      if (section && compact.indexOf(id)!==-1 && !current) main.insertBefore(makeRouteHero(section),main.firstChild);
      else if (current && (!section || compact.indexOf(id)===-1)) current.remove();
    }
    if (launcher) {launcher.setAttribute("aria-label",t(8));launcher.querySelector("span").textContent=t(5);}
    if (palette) {palette.setAttribute("aria-label",t(5));palette.querySelector(".dar-next-palette__head b").textContent=t(5);
      search.placeholder=t(6);search.setAttribute("aria-label",t(6));
      palette.querySelector(".dar-next-palette__footer").textContent=t(7);}
  }
  function schedule() {
    if(scheduling)return;scheduling=true;
    requestAnimationFrame(function(){scheduling=false;try{update();}catch(e){console.warn("DAR NEXT staging surface:",e);}});
  }
  function init() {
    if(!document.body)return;
    makeLauncher();makePalette();schedule();
    var app=document.getElementById("appView");
    if(app && window.MutationObserver) new MutationObserver(function(m) {
      if (m.some(function(entry){return Array.prototype.some.call(entry.addedNodes,function(n) {
        return n.nodeType===1 && n.id!=="darNextHomeHero" && n.id!=="darNextRouteHero";
      });}))schedule();
    }).observe(app,{childList:true});
    window.addEventListener("hashchange",schedule);
    window.addEventListener("pageshow",schedule);
    window.addEventListener("dar-adult-locale-changed",schedule);
    window.addEventListener("storage",schedule);
    document.addEventListener("dar:view-rendered",schedule);
    if(window.MutationObserver) new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:["lang"]});
    document.addEventListener("keydown",function(ev){
      if ((ev.metaKey||ev.ctrlKey) && ev.key.toLowerCase()==="k") {ev.preventDefault();palette && !palette.hidden?closePalette():openPalette();}
      if(ev.key==="Escape" && palette && !palette.hidden){ev.preventDefault();closePalette();}
    });
    /* The recovered legacy app sometimes mounts Home after network content arrives. */
    [350,1400,3500].forEach(function(ms){setTimeout(schedule,ms);});
  }
  window.DAR_NEXT_V1.open=openPalette;
  window.DAR_NEXT_V1.close=closePalette;
  window.DAR_NEXT_V1.navigate=go;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();