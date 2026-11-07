/* DĀR AL TAWḤĪD · DAR TEST ONLY · Qurʾān W Reader V1
 * Reuses existing qrc picker, Arabic/transliteration/German font-scale
 * controller, view toggles and sticky player. No media/route engine changes.
 */
(function () {
  "use strict";
  if (window.__DAR_TEST_QURAN_W_READER_V1) return;
  if (!(/^\/test(?:\/|$)/.test(location.pathname) || /^dar-al-tawhid-test\./.test(location.hostname))) return;
  window.__DAR_TEST_QURAN_W_READER_V1 = true;

  var PREFIX = "dqw", panel, watch, scheduled = false, active = "quranArabicScale";
  var TYPES = [
    { key: "quranArabicScale", code: "arabic" },
    { key: "quranTransliterationScale", code: "latin" },
    { key: "quranGermanScale", code: "german" }
  ];
  var I18N = {
    de: {title:"Schriftstudio",sub:"Schrift sofort anpassen",arabic:"Arabisch",latin:"Lautschrift",german:"Deutsch",size:"Schriftgröße",choose:"Sūrah / Āyah wählen",advanced:"Alle Einstellungen",reset:"Standard",close:"Schließen",showLatin:"Lautschrift anzeigen",showGerman:"Deutsch anzeigen",of:"von",reader:"Schrift anpassen"},
    ar: {title:"إعدادات الخط",sub:"تعديل الخط مباشرة",arabic:"العربية",latin:"النطق بالحروف",german:"الألمانية",size:"حجم الخط",choose:"اختيار السورة / الآية",advanced:"جميع الإعدادات",reset:"افتراضي",close:"إغلاق",showLatin:"إظهار النطق بالحروف",showGerman:"إظهار الألمانية",of:"من",reader:"تعديل الخط"},
    en: {title:"Reading typography",sub:"Adjust text instantly",arabic:"Arabic",latin:"Transliteration",german:"German",size:"Text size",choose:"Choose sūrah / āyah",advanced:"All settings",reset:"Default",close:"Close",showLatin:"Show transliteration",showGerman:"Show German",of:"of",reader:"Adjust text"},
    tr: {title:"Yazı ayarları",sub:"Yazıyı anında ayarla",arabic:"Arapça",latin:"Okunuş",german:"Almanca",size:"Yazı boyutu",choose:"Sûre / âyet seç",advanced:"Tüm ayarlar",reset:"Varsayılan",close:"Kapat",showLatin:"Okunuşu göster",showGerman:"Almancayı göster",of:"/",reader:"Yazıyı ayarla"},
    ku: {title:"Mîhengên nivîsê",sub:"Mezinahiya nivîsê biguherîne",arabic:"Erebî",latin:"Veguhastina tîpan",german:"Almanî",size:"Mezinahiya nivîsê",choose:"Sûre / ayet hilbijêre",advanced:"Hemû mîheng",reset:"Standard",close:"Bigire",showLatin:"Tîpên veguhastî nîşan bide",showGerman:"Almanî nîşan bide",of:"ji",reader:"Nivîsê biguherîne"},
    ckb: {title:"ڕێکخستنەکانی نووسین",sub:"گۆڕینی قەبارەی نووسین",arabic:"عەرەبی",latin:"نووسینی دەنگی",german:"ئەڵمانی",size:"قەبارەی نووسین",choose:"هەڵبژاردنی سوورەت / ئایەت",advanced:"هەموو ڕێکخستنەکان",reset:"بنەڕەتی",close:"داخستن",showLatin:"پیشاندانی نووسینی دەنگی",showGerman:"پیشاندانی ئەڵمانی",of:"لە",reader:"گۆڕینی نووسین"},
    bs: {title:"Postavke pisma",sub:"Odmah prilagodi tekst",arabic:"Arapski",latin:"Transliteracija",german:"Njemački",size:"Veličina teksta",choose:"Odaberi suru / ajet",advanced:"Sve postavke",reset:"Zadano",close:"Zatvori",showLatin:"Prikaži transliteraciju",showGerman:"Prikaži njemački",of:"od",reader:"Prilagodi tekst"},
    fr: {title:"Réglages de lecture",sub:"Ajuster le texte immédiatement",arabic:"Arabe",latin:"Translittération",german:"Allemand",size:"Taille du texte",choose:"Choisir sourate / verset",advanced:"Tous les réglages",reset:"Par défaut",close:"Fermer",showLatin:"Afficher la translittération",showGerman:"Afficher l’allemand",of:"sur",reader:"Ajuster le texte"},
    es: {title:"Ajustes de lectura",sub:"Ajustar texto al instante",arabic:"Árabe",latin:"Transliteración",german:"Alemán",size:"Tamaño del texto",choose:"Elegir sura / aleya",advanced:"Todos los ajustes",reset:"Predeterminado",close:"Cerrar",showLatin:"Mostrar transliteración",showGerman:"Mostrar alemán",of:"de",reader:"Ajustar texto"}
  };
  function $ (id) { return document.getElementById(id); }
  function locale() {
    var s = "";
    try { s = String(localStorage.getItem("darAdultPreferredLocaleV1") || ""); } catch (_) {}
    if (!/^(de|ar|en|tr|ku|ckb|bs|fr|es)$/.test(s)) s = String(document.documentElement.getAttribute("lang") || "de").toLowerCase().split("-")[0];
    return I18N[s] ? s : "de";
  }
  function txt() { return I18N[locale()]; }
  function clamp(value) { return Math.min(10, Math.max(1, Number(value) || 5)); }
  function scale() {
    try { if (typeof window.getFontScale === "function") return clamp(window.getFontScale(active)); } catch (_) {}
    try { return clamp(localStorage.getItem(active) || 5); } catch (_) { return 5; }
  }
  function setScale(value) {
    value = clamp(value);
    if (typeof window.applyFontScale === "function") window.applyFontScale(active,value);
    else {
      try { localStorage.setItem(active,String(value)); } catch (_) {}
      var css = active === "quranArabicScale" ? ["--quran-arabic-size",17+value*3.3] :
        active === "quranTransliterationScale" ? ["--quran-trans-size",12+value*2.1] : ["--quran-de-size",12+value*2.1];
      document.documentElement.style.setProperty(css[0],css[1]+"px");
    }
    refreshControls();
  }
  function viewSettings() {
    try { return JSON.parse(localStorage.getItem("darQuranViewSettingsV1") || "{}") || {}; } catch (_) { return {}; }
  }
  function setVisibility(k,yes) {
    if (typeof window.setQuranViewSettings === "function") {
      var patch = {}; patch[k] = yes; window.setQuranViewSettings(patch);
    } else {
      var data = viewSettings(); data[k] = yes;
      try { localStorage.setItem("darQuranViewSettingsV1",JSON.stringify(data)); } catch (_) {}
      document.querySelectorAll('[data-quran-view="'+k+'"]').forEach(function(n){n.hidden=!yes;});
    }
  }
  function render() {
    if (!panel) return;
    var L=txt(), lang=locale();
    panel.setAttribute("lang",lang);
    panel.setAttribute("dir",lang==="ar"||lang==="ckb"?"rtl":"ltr");
    panel.innerHTML =
      '<div class="dqw-head"><div><strong id="dqwTitle">'+L.title+'</strong><span>'+L.sub+'</span></div><button type="button" class="dqw-close" data-dqw-action="close" aria-label="'+L.close+'">×</button></div>'+
      '<div class="dqw-target" role="group" aria-label="'+L.size+'">'+TYPES.map(function(type){
        return '<button type="button" data-dqw-scale="'+type.key+'" aria-pressed="'+(active===type.key)+'">'+L[type.code]+'</button>';
      }).join("")+'</div>'+
      '<div class="dqw-scale-head"><label for="dqwRange">'+L.size+' · <span data-dqw-name></span></label><output id="dqwScaleOut"></output></div>'+
      '<div class="dqw-range-row"><span aria-hidden="true">A−</span><input id="dqwRange" type="range" min="1" max="10" step="1" value="'+scale()+'"><span aria-hidden="true">A+</span></div>'+
      '<div class="dqw-checks"><label><input type="checkbox" data-dqw-visible="showTransliteration"> '+L.showLatin+'</label><label><input type="checkbox" data-dqw-visible="showGerman"> '+L.showGerman+'</label></div>'+
      '<div class="dqw-links"><button type="button" data-dqw-action="picker">'+L.choose+'</button><button type="button" data-dqw-action="advanced">'+L.advanced+'</button></div>'+
      '<div class="dqw-footer"><button type="button" data-dqw-action="reset">'+L.reset+'</button><button type="button" data-dqw-action="close">'+L.close+'</button></div>';
    refreshControls();
  }
  function refreshControls() {
    if (!panel) return;
    var s=scale(), L=txt(), type=TYPES.find(function(x){return x.key===active;}) || TYPES[0];
    var range=$("dqwRange"), output=$("dqwScaleOut"), name=panel.querySelector("[data-dqw-name]");
    if (range) { range.value=String(s); range.setAttribute("aria-label", L.size+" · "+L[type.code]); range.style.setProperty("--dqw-fill",((s-1)/9*100)+"%"); }
    if (output) output.textContent=s+" / 10";
    if (name) name.textContent=L[type.code];
    panel.querySelectorAll("[data-dqw-scale]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.dqwScale===active));});
    var views=viewSettings();
    panel.querySelectorAll("[data-dqw-visible]").forEach(function(c){c.checked=views[c.dataset.dqwVisible]!==false;});
  }
  function position() {
    if (!panel || panel.hidden) return;
    var h=window.visualViewport ? window.visualViewport.height+window.visualViewport.offsetTop : window.innerHeight;
    var chrome=$("qrcChrome"), mini=$("darQuranMiniPlayer"), nav=$("bottomNav");
    var top=12, bottom=12;
    if (chrome && document.body.classList.contains("is-quran-reader-route")) top=Math.max(top,chrome.getBoundingClientRect().bottom+8);
    if (mini && mini.classList.contains("is-on") && document.body.classList.contains("is-quran-reader-route")) {
      var mr=mini.getBoundingClientRect();
      if(mr.bottom>0 && mr.top < h && mr.bottom < h) top=Math.max(top,mr.bottom+8);
    }
    if (nav) {
      var r=nav.getBoundingClientRect();
      if (r.height>20 && r.top<h && r.bottom>0) bottom=Math.max(bottom,h-r.top+8);
    }
    top=Math.min(top,Math.max(10,h-168));
    panel.style.top=Math.round(top)+"px";
    panel.style.bottom=Math.round(bottom)+"px";
  }
  function close(focus) {
    if (!panel || panel.hidden) return;
    panel.hidden=true;
    var b=$("darQrcWReaderToggleV1");
    if (b) b.setAttribute("aria-expanded","false");
    if (focus && b) b.focus({preventScroll:true});
  }
  function open() {
    if (!document.body.classList.contains("is-quran-reader-route")) return;
    if (!panel) buildPanel();
    render(); panel.hidden=false;
    var b=$("darQrcWReaderToggleV1"); if(b){b.setAttribute("aria-expanded","true");b.setAttribute("aria-label",txt().reader);}
    position();
    var range=$("dqwRange"); if(range)range.focus({preventScroll:true});
  }
  function buildPanel() {
    panel=document.createElement("section");
    panel.id="darQrcWReaderPanelV1";
    panel.className="dqw-panel";
    panel.setAttribute("role","dialog");
    panel.setAttribute("aria-label","Qurʾān Schriftstudio");
    panel.setAttribute("aria-modal","false");
    panel.hidden=true;
    document.body.appendChild(panel);
    panel.addEventListener("click",function(ev){
      var t=ev.target.closest("[data-dqw-scale],[data-dqw-action]"); if(!t)return;
      ev.preventDefault();
      if (t.dataset.dqwScale) {active=t.dataset.dqwScale; refreshControls();return;}
      var action=t.dataset.dqwAction;
      if (action==="close") {close(true);return;}
      if (action==="reset") {setScale(5);return;}
      if (action==="picker" || action==="advanced") {
        close(false);
        var id=action==="picker"?"qrcTitleBtn":"qrcSettingsBtn";
        var old=$(id);if(old)old.click();
      }
    });
    panel.addEventListener("input",function(ev){
      if (ev.target.id==="dqwRange") setScale(ev.target.value);
      if (ev.target.matches("[data-dqw-visible]")) setVisibility(ev.target.dataset.dqwVisible,ev.target.checked);
    });
  }
  function mount() {
    var actions=$("qrcActions");
    if (!actions || !document.body.classList.contains("is-quran-reader-route")) {close(false);return;}
    if ($("darQrcWReaderToggleV1")) { $("darQrcWReaderToggleV1").setAttribute("aria-label",txt().reader); return; }
    var b=document.createElement("button");
    b.type="button";
    b.id="darQrcWReaderToggleV1";
    b.className="qrc-icon-btn dqw-trigger";
    b.textContent="W";
    b.setAttribute("aria-haspopup","dialog");
    b.setAttribute("aria-controls","darQrcWReaderPanelV1");
    b.setAttribute("aria-expanded","false");
    b.setAttribute("aria-label",txt().reader);
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(panel&&!panel.hidden)close(false);else open();});
    actions.insertBefore(b,actions.firstChild);
  }
  function scheduleMount() {
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;mount();position();});
  }
  function boot() {
    if (!document.body) return;
    buildPanel();mount();
    var root=$("appView");
    if(root && window.MutationObserver) {
      watch=new MutationObserver(function(records){
        if(document.body.classList.contains("is-quran-reader-route") && !$("darQrcWReaderToggleV1")) scheduleMount();
        if(panel && !panel.hidden && (!document.body.classList.contains("is-quran-reader-route") || records.some(function(r){return r.target.id==="appView" && !r.target.querySelector("#qrcChrome");}))) close(false);
      });
      watch.observe(root,{childList:true,subtree:true});
    }
    // Follow route class changes without polling or touching the audio/reader controller.
    if (window.MutationObserver) {
      var routeWatch = new MutationObserver(function(){
        if (document.body.classList.contains("is-quran-reader-route")) scheduleMount();
        else close(false);
      });
      routeWatch.observe(document.body,{attributes:true,attributeFilter:["class"]});
    }
    document.addEventListener("pointerdown",function(e){if(panel&&!panel.hidden&&!panel.contains(e.target)&&!e.target.closest("#darQrcWReaderToggleV1"))close(false);},true);
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&panel&&!panel.hidden){close(true);e.stopPropagation();}});
    window.addEventListener("hashchange",scheduleMount);
    window.addEventListener("popstate",scheduleMount);
    window.addEventListener("resize",position,{passive:true});
    if(window.visualViewport)window.visualViewport.addEventListener("resize",position,{passive:true});
    window.addEventListener("pageshow",scheduleMount);
    document.addEventListener("change",function(e){if(e.target && e.target.matches("[data-qov-draft-scale],[data-font-scale],[data-qov-draft-view],[data-quran-view-toggle]"))refreshControls();},true);
  }
  window.DarQuranWReaderTestV1={open:open,close:close,getState:function(){return{active:active,value:scale(),open:!!(panel&&!panel.hidden)};}};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();