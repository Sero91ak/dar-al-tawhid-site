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
  var dockResizeWatch = null, dockAttrWatch = null, dockTargets = [], dockFrame = false;
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
    panel.setAttribute("aria-label",L.title);
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
  /* DAR_QURAN_W_DOCK_V3: Observe the existing chrome/player/nav only.
   * Never write to player layout or playback; the W overlay follows them. */
  function unwatchDock() {
    if (dockResizeWatch) dockTargets.forEach(function(node) {
      try { dockResizeWatch.unobserve(node); } catch (_) {}
    });
    if (dockAttrWatch) dockAttrWatch.disconnect();
    dockTargets = [];
  }
  function watchDock() {
    if (!panel || panel.hidden) return;
    var nodes = [$("qrcChrome"), $("qovHeader"), $("darQuranMiniPlayer"), $("bottomNav")].filter(Boolean);
    var stable = nodes.length === dockTargets.length &&
      nodes.every(function(node, index) { return node === dockTargets[index]; });
    if (stable) return;
    unwatchDock();
    if (typeof window.ResizeObserver === "function") {
      if (!dockResizeWatch) dockResizeWatch = new window.ResizeObserver(schedulePosition);
      nodes.forEach(function(node) { dockResizeWatch.observe(node); });
    }
    if (typeof window.MutationObserver === "function") {
      if (!dockAttrWatch) dockAttrWatch = new window.MutationObserver(schedulePosition);
      nodes.forEach(function(node) {
        dockAttrWatch.observe(node, { attributes:true, attributeFilter:["class","style","data-size","hidden"] });
      });
      dockAttrWatch.observe(document.documentElement, { attributes:true, attributeFilter:["class"] });
    }
    dockTargets = nodes;
  }
  function schedulePosition() {
    if (dockFrame || !panel || panel.hidden) return;
    dockFrame = true;
    window.requestAnimationFrame(function() {
      dockFrame = false;
      if (!panel || panel.hidden) return;
      watchDock();
      position();
    });
  }
  function position() {
    if (!panel || panel.hidden) return;
    var vv = window.visualViewport;
    var screenHeight = window.innerHeight;
    var viewportTop = vv ? vv.offsetTop : 0;
    var viewportBottom = vv ? vv.offsetTop + vv.height : screenHeight;
    var top = Math.max(12, Math.ceil(viewportTop + 8));
    var bottom = Math.max(12, Math.ceil(screenHeight - viewportBottom + 8));
    var reader = document.body.classList.contains("is-quran-reader-route");
    var chrome = reader ? $("qrcChrome") : $("qovHeader");
    var mini = $("darQuranMiniPlayer"), nav = $("bottomNav");
    if (chrome) {
      var cr = chrome.getBoundingClientRect();
      if (cr.bottom > viewportTop && cr.top < viewportBottom) top = Math.max(top, Math.ceil(cr.bottom + 8));
    }
    if (reader && mini && mini.classList.contains("is-on")) {
      var mr = mini.getBoundingClientRect();
      if (mr.bottom > viewportTop && mr.top < viewportBottom) top = Math.max(top, Math.ceil(mr.bottom + 8));
    }
    if (nav) {
      var nr = nav.getBoundingClientRect();
      if (nr.height > 20 && nr.top < viewportBottom && nr.bottom > viewportTop) {
        bottom = Math.max(bottom, Math.ceil(screenHeight - nr.top + 8));
      }
    }
    var available = Math.floor(screenHeight - top - bottom);
    // A keyboard or expanded player may leave no safe interaction space.
    // Closing the non-modal W sheet does not pause or restart recitation.
    if (available < 190) { close(false); return; }
    var t = top + "px", b = bottom + "px", mh = available + "px";
    if (panel.style.top !== t) panel.style.top = t;
    if (panel.style.bottom !== b) panel.style.bottom = b;
    if (panel.style.maxHeight !== mh) panel.style.maxHeight = mh;
  }
  function close(focus) {
    if (!panel || panel.hidden) return;
    panel.hidden=true;
    unwatchDock();
    var b=$("darQrcWReaderToggleV1");
    if (b) b.setAttribute("aria-expanded","false");
    if (focus && b) b.focus({preventScroll:true});
  }
  function open() {
    if (!document.body.classList.contains("is-quran-reader-route") && !document.body.classList.contains("is-quran-overview")) return;
    if (!panel) buildPanel();
    render(); panel.hidden=false;
    watchDock();
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
        if(document.body.classList.contains("is-quran-overview")){
          if(action==="picker" && typeof window.openQuranDirectSheet==="function") window.openQuranDirectSheet();
          else {var ov=$("qovSettingsBtn");if(ov)ov.click();}
        }else{
          var id=action==="picker"?"qrcTitleBtn":"qrcSettingsBtn";
          var old=$(id);if(old)old.click();
        }
      }
    });
    panel.addEventListener("input",function(ev){
      if (ev.target.id==="dqwRange") setScale(ev.target.value);
      if (ev.target.matches("[data-dqw-visible]")) setVisibility(ev.target.dataset.dqwVisible,ev.target.checked);
    });
  }
  /* DAR_QURAN_DASHBOARD_QUICK_V2 · Test-only, no second navigation/record store */
  var QUICK_TEXT = {
    de: ["Schnellzugriff", "Ǧuzʾ · Sūrah · Āyah", "Stelle direkt wählen", "Meine Merkliste", "Gespeicherte Verse & Notizen"],
    ar: ["الوصول السريع", "الجزء · السورة · الآية", "الانتقال إلى موضع محدد", "المحفوظات", "الآيات والملاحظات المحفوظة"],
    en: ["Quick access", "Juzʾ · Sūrah · Āyah", "Jump to a verse", "My saved verses", "Saved verses and notes"],
    tr: ["Hızlı erişim", "Cüz · Sûre · Âyet", "Doğrudan âyete git", "Kaydettiklerim", "Kaydedilen âyetler ve notlar"],
    ku: ["Destpêka bilez", "Cuzʾ · Sûre · Ayet", "Rast biçe ser ayetê", "Yên min ên tomar kirî", "Ayet û têbîniyên tomar kirî"],
    ckb: ["دەستگەیشتنی خێرا", "جوزء · سوورەت · ئایەت", "ڕاستەوخۆ بڕۆ بۆ ئایەت", "پاشەکەوتکراوەکانم", "ئایەت و تێبینییە پاشەکەوتکراوەکان"],
    bs: ["Brzi pristup", "Džuz · Sura · Ajet", "Idi direktno na ajet", "Moje zabilješke", "Sačuvani ajeti i bilješke"],
    fr: ["Accès rapide", "Juzʾ · Sourate · Verset", "Aller directement au verset", "Mes enregistrements", "Versets et notes enregistrés"],
    es: ["Acceso rápido", "Yuz · Sura · Aleya", "Ir directamente a una aleya", "Mis guardados", "Aleyas y notas guardadas"]
  };
  function mountQuickActions() {
    var old = $("darQovQuickActionsV2");
    if (!document.body.classList.contains("is-quran-overview")) {
      if (old) old.remove();
      return;
    }
    var host = $("qovStickyTools");
    if (!host || !host.parentNode) return;
    var lang = locale();
    if (old && old.previousElementSibling === host && old.getAttribute("lang") === lang) return;
    if (old) old.remove();
    var words = QUICK_TEXT[lang] || QUICK_TEXT.de;
    var section = document.createElement("section");
    section.id = "darQovQuickActionsV2";
    section.className = "dqw-quick-actions";
    section.setAttribute("lang", lang);
    section.setAttribute("dir", lang === "ar" || lang === "ckb" ? "rtl" : "ltr");
    section.setAttribute("aria-label", words[0]);
    section.innerHTML =
      '<div class="dqw-quick-heading"><span>' + words[0] + '</span></div>' +
      '<div class="dqw-quick-list">' +
        '<button type="button" class="dqw-quick-item" data-dqw-quick="jump" aria-controls="qovSmartJumpFields">' +
          '<span class="dqw-quick-mark" aria-hidden="true">↗</span><span class="dqw-quick-copy"><strong>' + words[1] + '</strong><small>' + words[2] + '</small></span>' +
        '</button>' +
        '<button type="button" class="dqw-quick-item" data-nav="quran-topic" data-value="saved">' +
          '<span class="dqw-quick-mark" aria-hidden="true">☆</span><span class="dqw-quick-copy"><strong>' + words[3] + '</strong><small>' + words[4] + '</small></span>' +
        '</button>' +
      '</div>';
    section.addEventListener("click", function(event) {
      var trigger = event.target.closest('[data-dqw-quick="jump"]');
      if (!trigger || !section.contains(trigger)) return;
      var toggle = $("qovSmartJumpToggle"), fields = $("qovSmartJumpFields");
      if (!toggle || !fields) return;
      if (fields.hidden) toggle.click(); // canonical existing Ǧuzʾ/Sūrah/Āyah controller
      var surah = $("qovJumpSurah");
      if (surah) surah.focus({preventScroll:true});
    });
    host.insertAdjacentElement("afterend", section);
  }
  function mount() {
    var reading=document.body.classList.contains("is-quran-reader-route");
    var overview=document.body.classList.contains("is-quran-overview");
    var actions=reading ? $("qrcActions") : overview ? document.querySelector("#qovHeader .qov-icon-actions") : null;
    if (!actions) {close(false);mountQuickActions();return;}
    mountQuickActions();
    var existing=$("darQrcWReaderToggleV1");
    if (existing && actions.contains(existing)) { existing.setAttribute("aria-label",txt().reader);return; }
    if (existing) existing.remove();
    var b=document.createElement("button");
    b.type="button";
    b.id="darQrcWReaderToggleV1";
    b.className=(reading?"qrc-icon-btn":"qov-icon-btn")+" dqw-trigger";
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
    requestAnimationFrame(function(){scheduled=false;mount();schedulePosition();});
  }
  function boot() {
    if (!document.body) return;
    buildPanel();mount();
    var root=$("appView");
    if(root && window.MutationObserver) {
      watch=new MutationObserver(function(records){
        var activeRoute=document.body.classList.contains("is-quran-reader-route") || document.body.classList.contains("is-quran-overview");
        if(activeRoute && (!$("darQrcWReaderToggleV1") || (document.body.classList.contains("is-quran-overview") && !$("darQovQuickActionsV2")))) scheduleMount();
        if(panel && !panel.hidden && !activeRoute) close(false);
      });
      watch.observe(root,{childList:true,subtree:true});
    }
    // Follow route class changes without polling or touching the audio/reader controller.
    if (window.MutationObserver) {
      var routeWatch = new MutationObserver(function(){
        if (document.body.classList.contains("is-quran-reader-route") || document.body.classList.contains("is-quran-overview")) scheduleMount();
        else close(false);
      });
      routeWatch.observe(document.body,{attributes:true,attributeFilter:["class"]});
    }
    document.addEventListener("pointerdown",function(e){if(panel&&!panel.hidden&&!panel.contains(e.target)&&!e.target.closest("#darQrcWReaderToggleV1"))close(false);},true);
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&panel&&!panel.hidden){close(true);e.stopPropagation();}});
    window.addEventListener("hashchange",scheduleMount);
    window.addEventListener("popstate",scheduleMount);
    window.addEventListener("resize",schedulePosition,{passive:true});
    if(window.visualViewport){
      window.visualViewport.addEventListener("resize",schedulePosition,{passive:true});
      window.visualViewport.addEventListener("scroll",schedulePosition,{passive:true});
    }
    document.addEventListener("scroll",function(e){
      if (!panel || panel.hidden || (e.target && panel.contains(e.target))) return;
      schedulePosition();
    },{capture:true,passive:true});
    document.addEventListener("transitionend",function(e){
      if(e.target && (e.target.id==="darQuranMiniPlayer" || e.target.id==="qrcChrome")) schedulePosition();
    },true);
    window.addEventListener("pageshow",scheduleMount);
    document.addEventListener("change",function(e){if(e.target && e.target.matches("[data-qov-draft-scale],[data-font-scale],[data-qov-draft-view],[data-quran-view-toggle]"))refreshControls();},true);
  }
  window.DarQuranWReaderTestV1={open:open,close:close,getState:function(){return{active:active,value:scale(),open:!!(panel&&!panel.hidden)};}};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();