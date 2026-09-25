/* DAR Setup Hub — web + test parity with iOS setup card */
(function () {
  "use strict";
  var MARKER = "DAR_SETUP_HUB_V1";
  var SETTINGS_KEY = "darPrayerSettingsV1";
  var ROOT_ID = "dar-setup-hub";
  window.DAR_SETUP_HUB_V1 = MARKER;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readSettings() {
    try {
      if (typeof getPrayerSettings === "function") return getPrayerSettings() || {};
    } catch (e) {}
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e2) {
      return {};
    }
  }

  function hasLocation(s) {
    s = s || readSettings();
    try {
      if (typeof hasPrayerLocation === "function") return !!hasPrayerLocation(s);
    } catch (e) {}
    var lat = Number(s.lat != null ? s.lat : s.latitude);
    var lon = Number(s.lon != null ? s.lon : s.lng != null ? s.lng : s.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) && s.locationGranted === true;
  }

  function go(view, value) {
    try {
      if (typeof navigate === "function") {
        navigate(view, value || "");
        return;
      }
    } catch (e) {}
    try {
      location.hash = "#" + view + (value ? "/" + value : "");
    } catch (e2) {}
  }

  function toast(msg) {
    try {
      if (window.__darToast) {
        window.__darToast(msg);
        return;
      }
    } catch (e) {}
    try {
      if (typeof showToast === "function") {
        showToast(msg);
        return;
      }
    } catch (e2) {}
  }

  function openNativeSettings(kind) {
    try {
      if (
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.darOpenSystemSettings
      ) {
        window.webkit.messageHandlers.darOpenSystemSettings.postMessage({ kind: kind });
        return true;
      }
    } catch (e) {}
    return false;
  }

  function isNative() {
    try {
      if (typeof isDarNativeApp === "function") return !!isDarNativeApp();
    } catch (e) {}
    return !!(window.webkit && window.webkit.messageHandlers);
  }

  function renderHtml() {
    var s = readSettings();
    var locOk = hasLocation(s);
    var remOk = !!(s.reminder || s.remindersEnabled || s.prayerRemindersEnabled);
    var locBtnClass = "dar-setup-hub__btn" + (locOk ? " is-active" : "");
    var notifBtnClass = "dar-setup-hub__btn" + (remOk ? " is-active" : "");
    return [
      '<section id="' + ROOT_ID + '" class="dar-setup-hub" data-dar-setup="true" aria-label="Einrichtung">',
      '  <header class="dar-setup-hub__head">',
      '    <h2 class="dar-setup-hub__title">DĀR AL TAWḤĪD Einrichtung</h2>',
      '    <p class="dar-setup-hub__sub">Standort, Gebetszeiten, Mitteilungen und Widgets</p>',
      "  </header>",
      '  <div class="dar-setup-hub__list">',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Standort</strong><span>Für genaue Gebetszeiten und Widgets</span></div><button type="button" class="' +
        locBtnClass +
        '" data-dar-setup-action="location">Öffnen</button></div>',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Mitteilungen</strong><span>Für Gebets-Erinnerungen und Tests</span></div><button type="button" class="' +
        notifBtnClass +
        '" data-dar-setup-action="notifications">Öffnen</button></div>',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Gebetszeiten</strong><span>Daten für Widgets und Watch aktualisieren</span></div><button type="button" class="dar-setup-hub__btn is-active" data-dar-setup-action="sync">Sync</button></div>',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Widget-Ziele</strong><span>Öffnet direkt Gebetszeiten, Kalender, Qurʾān oder Duʿāʾ</span></div><button type="button" class="dar-setup-hub__btn is-active" data-dar-setup-action="widgets">Prüfen</button></div>',
      "  </div>",
      "</section>"
    ].join("");
  }

  async function syncPrayer() {
    var s = readSettings();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch (e) {}
    try {
      if (
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.darPushSettings
      ) {
        window.webkit.messageHandlers.darPushSettings.postMessage(s);
      }
    } catch (e2) {}
    try {
      if (window.__darWidgetPublish) window.__darWidgetPublish();
    } catch (e3) {}
    try {
      if (typeof syncPrayerPushTags === "function" && s.reminder && hasLocation(s)) {
        await syncPrayerPushTags(s, { retries: 2 });
      }
    } catch (e4) {}
    try {
      if (typeof scheduleLocalPrayerRemindersIfNeeded === "function") {
        await scheduleLocalPrayerRemindersIfNeeded({ silent: true });
      }
    } catch (e5) {}
    try {
      if (typeof maintainPushHealth === "function") await maintainPushHealth({ silent: true });
    } catch (e6) {}
    toast("Gebetszeiten aktualisiert");
  }

  function openLocation() {
    if (isNative() && openNativeSettings("location")) return;
    try {
      var btn = document.getElementById("useLocationBtn");
      if (btn) {
        go("prayer");
        setTimeout(function () {
          try {
            document.getElementById("useLocationBtn")?.click();
          } catch (e) {}
        }, 280);
        return;
      }
    } catch (e2) {}
    go("prayer");
  }

  function openNotifications() {
    if (isNative() && openNativeSettings("notifications")) return;
    var hero = document.querySelector(".notification-hero, #notificationHealthBox");
    if (hero) {
      try {
        hero.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) {
        hero.scrollIntoView();
      }
      return;
    }
    go("notifications");
  }

  function openWidgets() {
    go("prayer");
  }

  function bind(root) {
    var host = root || document.getElementById(ROOT_ID);
    if (!host || host.getAttribute("data-dar-setup-bound") === "1") return;
    host.setAttribute("data-dar-setup-bound", "1");
    host.addEventListener("click", function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest("[data-dar-setup-action]");
      if (!btn || !host.contains(btn)) return;
      var action = btn.getAttribute("data-dar-setup-action") || "";
      if (action === "location") {
        openLocation();
        return;
      }
      if (action === "notifications") {
        openNotifications();
        return;
      }
      if (action === "widgets") {
        openWidgets();
        return;
      }
      if (action === "sync") {
        btn.classList.add("is-busy");
        Promise.resolve(syncPrayer())
          .catch(function () {})
          .finally(function () {
            btn.classList.remove("is-busy");
            try {
              var html = renderHtml();
              var tmp = document.createElement("div");
              tmp.innerHTML = html;
              var next = tmp.firstElementChild;
              if (next && host.parentNode) {
                host.parentNode.replaceChild(next, host);
                bind(next);
              }
            } catch (e) {}
          });
      }
    });
  }

  function ensureCss() {
    if (document.querySelector('link[href*="dar-setup-hub.css"]') || document.getElementById("dar-setup-hub-style-link")) return;
    var link = document.createElement("link");
    link.id = "dar-setup-hub-style-link";
    link.rel = "stylesheet";
    var base = location.pathname.indexOf("/test/") === 0 ? "/test/assets/" : "/assets/";
    link.href = base + "dar-setup-hub.css?v=8";
    document.head.appendChild(link);
  }

  function mountIntoSettings() {
    ensureCss();
    var page = document.querySelector(".settings-one-page");
    if (!page) return null;
    page.classList.add("settings-flat-live-v1");
    page.classList.remove("settings-cards-hub-v1");
    var hubs = document.querySelectorAll("#" + ROOT_ID + '[data-dar-setup="true"]');
    for (var i = 1; i < hubs.length; i += 1) hubs[i].remove();
    var existing = hubs[0] || document.getElementById(ROOT_ID);
    if (existing) {
      bind(existing);
      return existing;
    }
    // Hub is rendered by index.html above the page head; do not inject into #appView
    return null;
  }

  function onSettingsRoute() {
    try {
      var view = "";
      if (typeof readRoute === "function") view = String((readRoute() || {}).view || "");
      else view = String(location.hash || "").replace(/^#/, "").split(/[/?&]/)[0];
      if (view !== "settings") return;
      mountIntoSettings();
      var hub = document.getElementById(ROOT_ID);
      if (hub) bind(hub);
    } catch (e) {}
  }

  window.DARSetupHub = {
    marker: MARKER,
    render: renderHtml,
    bind: bind,
    mount: mountIntoSettings,
    refresh: onSettingsRoute
  };

  function boot() {
    onSettingsRoute();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.addEventListener("hashchange", function () {
    setTimeout(onSettingsRoute, 60);
  });
  document.addEventListener("dar:render", function () {
    setTimeout(onSettingsRoute, 30);
  });

  // Hook after app bindEvents without editing large call sites too deeply
})();


/* JUMMAH_FRIDAY_MODE_V5
 * DĀR AL TAWḤĪD – besucherorientierter Jumuʿah-Bereich.
 * Theme-adaptiv, ohne interne Produkt-/Redaktionsinformationen.
 * Keine Änderung an OneSignal, Server-Scheduler oder anderen Push-Spuren.
 */
(function (global) {
  "use strict";

  var HOME_ID="darJummahFridayHome";
  var DETAIL_ID="darJummahFridayDetail";
  var STYLE_ID="darJummahFridayStyle";
  var timer=null, observer=null;

  function esc(v){
    return String(v==null?"":v)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function readPrayerSettings(){
    try{if(typeof global.getPrayerSettings==="function")return global.getPrayerSettings()||{};}catch(e){}
    try{return JSON.parse(localStorage.getItem("darPrayerSettingsV1")||"{}");}catch(e2){return{};}
  }

  function timeZone(s){
    try{return String((s&&(s.timeZone||s.timezone))||Intl.DateTimeFormat().resolvedOptions().timeZone||"Europe/Berlin");}
    catch(e){return"Europe/Berlin";}
  }

  function isFriday(s){
    try{return new Intl.DateTimeFormat("en-US",{timeZone:timeZone(s),weekday:"short"}).format(new Date())==="Fri";}
    catch(e){return new Date().getDay()===5;}
  }

  function prayerDate(base,p){
    if(!p)return null;
    try{
      if(typeof global.prayerEventDate==="function"){
        var d=global.prayerEventDate(base,p);
        if(d instanceof Date&&!isNaN(d))return d;
      }
    }catch(e){}
    if(p.eventDate){
      var x=new Date(p.eventDate);
      if(!isNaN(x))return x;
    }
    var h=Number(p.time);
    if(!Number.isFinite(h))return null;
    var d2=new Date(base),hh=Math.floor(h),mm=Math.round((h-hh)*60);
    d2.setHours(hh,mm,0,0);
    return d2;
  }

  function prayerWindow(s){
    var out={asr:null,maghrib:null,lastStart:null};
    try{
      if(typeof global.hasPrayerLocation==="function"&&!global.hasPrayerLocation(s))return out;
      if(typeof global.calculatePrayerTimes!=="function")return out;
      var base=new Date(),list=global.calculatePrayerTimes(base,s)||[];
      out.asr=prayerDate(base,list.find(function(p){return p.key==="asr";}));
      out.maghrib=prayerDate(base,list.find(function(p){return p.key==="maghrib";}));
      if(out.maghrib){
        var technical=new Date(out.maghrib.getTime()-60*60000);
        out.lastStart=(out.asr&&out.asr>technical)?out.asr:technical;
      }
    }catch(e){}
    return out;
  }

  function fmt(d,s){
    if(!(d instanceof Date)||isNaN(d))return"—";
    try{return new Intl.DateTimeFormat("de-DE",{timeZone:timeZone(s),hour:"2-digit",minute:"2-digit"}).format(d);}
    catch(e){return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");}
  }

  function currentState(){
    var s=readPrayerSettings(),fri=isFriday(s),w=prayerWindow(s),now=new Date();
    return{
      settings:s,
      friday:fri,
      window:w,
      ended:!!(fri&&w.maghrib&&now>=w.maghrib),
      last:!!(fri&&w.lastStart&&w.maghrib&&now>=w.lastStart&&now<w.maghrib)
    };
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var el=document.createElement("style");
    el.id=STYLE_ID;
    el.textContent=[
      ".dar-jf-home,.dar-jf-detail{--jf-accent:var(--gold2,#c9a96a);--jf-text:var(--ink,var(--cream,#f6f0e2));--jf-muted:var(--muted,#9f9a90);--jf-line:var(--line2,var(--line,rgba(128,128,128,.22)));--jf-surface:var(--card,transparent);color:var(--jf-text)}",
      ".dar-jf-home{position:relative;margin:16px 0 20px;padding:0;border:1px solid var(--jf-line);border-radius:21px;background:var(--jf-surface);box-shadow:none;overflow:hidden}",
      ".dar-jf-home:before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--jf-accent);opacity:.7;pointer-events:none}",
      ".dar-jf-inner{position:relative;padding:16px 17px 13px}",
      ".dar-jf-kicker{font-size:9px;letter-spacing:.17em;text-transform:uppercase;color:var(--jf-accent);font-weight:900}",
      ".dar-jf-home h2,.dar-jf-detail h2,.dar-jf-detail h3{font-family:var(--serif,Georgia,serif);color:var(--jf-text);margin:5px 0 7px;line-height:1.14}",
      ".dar-jf-home h2{font-size:clamp(22px,5.3vw,29px);max-width:760px}",
      ".dar-jf-home p,.dar-jf-detail p{margin:0;color:var(--jf-muted);line-height:1.53}",
      ".dar-jf-lead{font-size:13px!important;max-width:760px}",
      ".dar-jf-source{display:block;margin-top:6px;color:var(--jf-muted);font-size:9.8px;line-height:1.4}",
      ".dar-jf-home-stack{margin-top:13px;border-top:1px solid var(--jf-line)}",
      ".dar-jf-home-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 14px;align-items:center;padding:11px 0;border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-home-item__copy{min-width:0}",
      ".dar-jf-home-item__label{display:block;margin-bottom:3px;color:var(--jf-accent);font-size:8.8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}",
      ".dar-jf-home-item__title{display:block;color:var(--jf-text);font-size:13px;font-weight:900;line-height:1.35}",
      ".dar-jf-home-item__text{display:block;margin-top:3px;color:var(--jf-muted);font-size:10.8px;line-height:1.43}",
      ".dar-jf-salawat{margin-top:6px;padding-top:7px;border-top:1px solid color-mix(in srgb,var(--jf-line) 76%,transparent)}",
      ".dar-jf-salawat__latin{display:block;color:var(--jf-text);font-size:12px;font-weight:850;line-height:1.4;letter-spacing:.005em}",
      ".dar-jf-salawat__de{display:block;margin-top:2px;color:var(--jf-muted);font-size:10.4px;line-height:1.42}",
      ".dar-jf-salawat__hint{display:block;margin-top:4px;color:var(--jf-accent);font-size:8.6px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}",
      ".dar-jf-home-item__time{min-width:74px;text-align:right}",
      ".dar-jf-home-item__time b{display:block;color:var(--jf-text);font-size:15px;line-height:1.1}",
      ".dar-jf-home-item__time span{display:block;margin-top:3px;color:var(--jf-muted);font-size:8.7px;letter-spacing:.08em;text-transform:uppercase}",
      ".dar-jf-home-item.is-active .dar-jf-home-item__label,.dar-jf-home-item.is-active .dar-jf-home-item__time b{color:var(--jf-accent)}",
      ".dar-jf-more-wrap{margin-top:4px;padding-top:14px;border-top:1px solid var(--jf-line)}",
      ".dar-jf-more{width:100%;min-height:64px;display:grid;grid-template-columns:minmax(0,1fr) 40px;align-items:center;gap:14px;padding:11px 12px 11px 14px;border:1px solid color-mix(in srgb,var(--jf-line) 92%,transparent);border-radius:16px;background:color-mix(in srgb,var(--jf-surface) 88%,transparent);color:var(--jf-text);font:inherit;text-align:left;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.018)}",
      ".dar-jf-more-copy{display:block;min-width:0;padding-right:2px}",
      ".dar-jf-more-title{display:block;color:var(--jf-text);font-size:12.5px;font-weight:900;line-height:1.28}",
      ".dar-jf-more small{display:block;margin-top:3px;color:var(--jf-muted);font-size:9.8px;font-weight:600;line-height:1.35}",
      ".dar-jf-more-arrow{width:38px;height:38px;display:grid;place-items:center;align-self:center;justify-self:end;border:1px solid color-mix(in srgb,var(--jf-line) 96%,transparent);border-radius:50%;color:var(--jf-accent);font-size:20px;font-weight:500;line-height:1;transform:none}",
      ".dar-jf-more:hover{border-color:color-mix(in srgb,var(--jf-accent) 36%,var(--jf-line))}",
      ".dar-jf-more:active .dar-jf-more-arrow{transform:translateX(1px)}",
      ".dar-jf-detail{margin:14px 0 4px;border-top:1px solid var(--jf-line)}",
      ".dar-jf-section{padding:18px 2px;border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-section:last-child{border-bottom:0}",
      ".dar-jf-detail h2{font-size:clamp(23px,5.5vw,30px)}",
      ".dar-jf-detail h3{font-size:18px}",
      ".dar-jf-detail-lead{font-size:13.5px!important;max-width:720px}",
      ".dar-jf-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:14px;border-top:1px solid var(--jf-line);border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-fact{padding:12px 10px}",
      ".dar-jf-fact:nth-child(odd){border-right:1px solid var(--jf-line)}",
      ".dar-jf-fact span{display:block;color:var(--jf-muted);font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:850;margin-bottom:3px}",
      ".dar-jf-fact b{display:block;color:var(--jf-text);font-size:13px;font-weight:850}",
      ".dar-jf-callout{padding:14px 0;border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-callout:last-child{border-bottom:0}",
      ".dar-jf-callout strong{display:block;color:var(--jf-text);font-size:13.5px;margin-bottom:5px}",
      ".dar-jf-callout p{font-size:13px}",
      ".dar-jf-khutbah blockquote{margin:12px 0;padding:1px 0 1px 13px;border-left:2px solid color-mix(in srgb,var(--jf-accent) 64%,transparent);color:var(--jf-text);line-height:1.62;font-size:13.5px}",
      ".dar-jf-khutbah p{margin:10px 0;font-size:13px}",
      ".dar-jf-note{font-size:10.5px!important;margin-top:10px!important;color:var(--jf-muted)!important}",
      "html[data-theme='light'] .dar-jf-home,html[data-theme='soft'] .dar-jf-home{background:color-mix(in srgb,var(--card,#fff) 96%,transparent)}",
      "html[data-theme='royal'] .dar-jf-home,html[data-theme='bordeaux'] .dar-jf-home,html[data-theme='dar-al-layl'] .dar-jf-home,html[data-theme='dark'] .dar-jf-home{background:color-mix(in srgb,var(--card,#111) 92%,transparent)}",
      "@media(max-width:560px){.dar-jf-home{margin:14px 0 18px;border-radius:19px}.dar-jf-inner{padding:15px 14px 13px}.dar-jf-home-item{grid-template-columns:minmax(0,1fr) auto;padding:10px 0}.dar-jf-home-item__time{min-width:66px}.dar-jf-salawat__latin{font-size:11.6px}.dar-jf-more-wrap{padding-top:13px}.dar-jf-more{min-height:62px;grid-template-columns:minmax(0,1fr) 38px;gap:12px;padding:10px 10px 10px 13px;border-radius:15px}.dar-jf-more-arrow{width:36px;height:36px;font-size:19px}.dar-jf-facts{grid-template-columns:1fr}.dar-jf-fact:nth-child(odd){border-right:0}.dar-jf-fact+.dar-jf-fact{border-top:1px solid var(--jf-line)}}"
    ].join("\n");
    document.head.appendChild(el);
  }

  function renderHome(){
    var old=document.getElementById(HOME_ID),st=currentState();
    if(!st.friday||st.ended){if(old)old.remove();return;}

    var shell=document.querySelector(".home-v380-shell");
    if(!shell)return;

    var last=st.window.lastStart?fmt(st.window.lastStart,st.settings):"nach ʿAṣr";
    var mag=st.window.maghrib?fmt(st.window.maghrib,st.settings):"nach Standort";
    var sig=[st.last,last,mag].join("|");

    var html=
      '<section id="'+HOME_ID+'" class="dar-jf-home" data-jf-sig="'+esc(sig)+'" aria-label="Jumuʿah am Freitag">'+
        '<div class="dar-jf-inner">'+
          '<div class="dar-jf-kicker">JUMUʿAH · FREITAG</div>'+
          '<h2>'+(st.last?'Besondere Zeit für Duʿāʾ':'Der Freitag')+'</h2>'+
          '<p class="dar-jf-lead">'+
            (st.last
              ?'Die letzte Zeit vor Maghrib wird besonders für Duʿāʾ, Dhikr und die Hinwendung zu Allah genutzt.'
              :'Am Freitag stehen Ṣalāh auf den Propheten ﷺ, Duʿāʾ und die Erinnerung an zentrale Themen des Dīn im Mittelpunkt.')+
          '</p>'+

          '<div class="dar-jf-home-stack">'+
            '<div class="dar-jf-home-item">'+
              '<div class="dar-jf-home-item__copy">'+
                '<span class="dar-jf-home-item__label">Ṣalāh auf den Propheten ﷺ</span>'+
                '<span class="dar-jf-home-item__title">Am Freitag vermehrt empfohlen</span>'+
                '<span class="dar-jf-salawat">'+
                  '<span class="dar-jf-salawat__latin">Allāhumma ṣalli wa sallim ʿalā Muḥammad</span>'+
                  '<span class="dar-jf-salawat__de">O Allah, sende Ṣalāh und Frieden auf Muḥammad.</span>'+
                  '<span class="dar-jf-salawat__hint">Segenswunsch</span>'+
                '</span>'+
              '</div>'+
            '</div>'+

            '<div class="dar-jf-home-item'+(st.last?' is-active':'')+'">'+
              '<div class="dar-jf-home-item__copy">'+
                '<span class="dar-jf-home-item__label">'+(st.last?'Jetzt besonders beachten':'Duʿāʾ · besondere Zeit')+'</span>'+
                '<span class="dar-jf-home-item__title">'+(st.last?'Zeit vor Maghrib':'Letzte Zeit nach ʿAṣr')+'</span>'+
                '<span class="dar-jf-home-item__text">Bis zum Eintritt von Maghrib.</span>'+
              '</div>'+
              '<div class="dar-jf-home-item__time"><b>'+esc(last)+'</b><span>bis '+esc(mag)+'</span></div>'+
            '</div>'+

            '<div class="dar-jf-home-item">'+
              '<div class="dar-jf-home-item__copy">'+
                '<span class="dar-jf-home-item__label">Freitagsimpuls</span>'+
                '<span class="dar-jf-home-item__title">Tawḥīd – Warum wir erschaffen wurden</span>'+
                '<span class="dar-jf-home-item__text">Allah allein zu dienen ist die Grundlage jeder ʿIbādah. Qurʾān 51:56.</span>'+
              '</div>'+
            '</div>'+
          '</div>'+

          '<div class="dar-jf-more-wrap">'+
            '<button type="button" class="dar-jf-more" data-dar-jf-open="1" aria-label="Mehr zu Jumuʿah öffnen">'+
              '<span class="dar-jf-more-copy"><span class="dar-jf-more-title">Mehr zu Jumuʿah</span><small>Sunnah · Duʿāʾ · Freitagsimpuls</small></span>'+
              '<span class="dar-jf-more-arrow" aria-hidden="true">›</span>'+
            '</button>'+
          '</div>'+
        '</div>'+
      '</section>';

    if(old){
      if(old.getAttribute("data-jf-sig")===sig)return;
      old.outerHTML=html;
      return;
    }

    var box=document.createElement("div");
    box.innerHTML=html;
    shell.insertBefore(box.firstElementChild,shell.firstChild);
  }

  function renderDetail(){
    var host=document.querySelector(".jummah-hub-page");
    if(!host)return;

    var old=document.getElementById(DETAIL_ID);
    var st=currentState();
    var asr=st.window.asr?fmt(st.window.asr,st.settings):"nach Standort";
    var mag=st.window.maghrib?fmt(st.window.maghrib,st.settings):"nach Standort";
    var last=st.window.lastStart?fmt(st.window.lastStart,st.settings):"nach ʿAṣr";
    var sig=[st.friday,st.last,asr,last,mag].join("|");

    if(old&&old.getAttribute("data-jf-sig")===sig)return;

    var wrap=document.createElement("div");
    wrap.id=DETAIL_ID;
    wrap.className="dar-jf-detail";
    wrap.setAttribute("data-jf-sig",sig);

    wrap.innerHTML=
      '<section class="dar-jf-section">'+
        '<div class="dar-jf-kicker">JUMUʿAH</div>'+
        '<h2>Der Freitag</h2>'+
        '<p class="dar-jf-detail-lead">Der Freitag ist ein besonderer Tag der Muslime. In diesem Bereich stehen authentisch überlieferte Hinweise zu Ṣalāh auf den Propheten ﷺ, Duʿāʾ, Dhikr und ein kurzer wöchentlicher Freitagsimpuls im Mittelpunkt.</p>'+
        '<div class="dar-jf-facts">'+
          '<div class="dar-jf-fact"><span>ʿAṣr</span><b>'+esc(asr)+'</b></div>'+
          '<div class="dar-jf-fact"><span>Maghrib</span><b>'+esc(mag)+'</b></div>'+
        '</div>'+
      '</section>'+

      '<section class="dar-jf-section">'+
        '<div class="dar-jf-callout">'+
          '<strong>Ṣalāh auf den Propheten ﷺ</strong>'+
          '<p>Für den Freitag ist überliefert, die Ṣalāh auf den Propheten ﷺ zu vermehren. Eine bestimmte erfundene Anzahl wird dabei nicht festgelegt.</p>'+
          '<div class="dar-jf-salawat"><span class="dar-jf-salawat__latin">Allāhumma ṣalli wa sallim ʿalā Muḥammad</span><span class="dar-jf-salawat__de">O Allah, sende Ṣalāh und Frieden auf Muḥammad.</span></div>'+
          '<span class="dar-jf-source">Überlieferung von Aws ibn Aws · authentisch überliefert</span>'+
        '</div>'+
        '<div class="dar-jf-callout">'+
          '<strong>Die besondere Zeit für Duʿāʾ</strong>'+
          '<p>Überliefert ist eine besondere Zeit am Freitag, in der Duʿāʾ erhört wird. Zu den starken überlieferten Auffassungen gehört die letzte Zeit nach ʿAṣr bis Maghrib.</p>'+
          '<span class="dar-jf-source">Sunan Abī Dāwūd 1048 · Sunan an-Nasāʾī 1389</span>'+
        '</div>'+
      '</section>'+

      '<section class="dar-jf-section dar-jf-khutbah">'+
        '<div class="dar-jf-kicker">FREITAGSIMPULS</div>'+
        '<h2>Tawḥīd – Warum wir erschaffen wurden</h2>'+
        '<p>Der Mensch wurde erschaffen, um Allah allein zu dienen. Tawḥīd ist die Grundlage jeder ʿIbādah und richtet Herz und Handeln allein auf Allah aus.</p>'+
        '<blockquote>Allah hat Jinn und Menschen erschaffen, damit sie Ihm dienen. Der Kern dieser ʿIbādah ist Tawḥīd: Allah allein anzubeten und Ihm nichts beizugesellen.</blockquote>'+
        '<p>Der Prophet ﷺ erklärte Muʿādh ibn Jabal رضي الله عنه, dass Allahs Recht über Seine Diener darin besteht, dass sie Ihn allein anbeten und Ihm nichts beigesellen. Dazu gehören Duʿāʾ, Hoffnung, Furcht, Liebe, Vertrauen und alle Formen der ʿIbādah.</p>'+
        '<p>Tawḥīd ist damit nicht nur ein Wissenskapitel, sondern die Grundlage des gesamten Dīn und die wichtigste Vorbereitung auf die Begegnung mit Allah.</p>'+
        '<span class="dar-jf-source">Qurʾān 51:56 · Ṣaḥīḥ al-Buḫārī 7373 · Ṣaḥīḥ Muslim 30</span>'+
        '<p class="dar-jf-note">Der Freitagsimpuls ist bewusst kurz gehalten. Die formelle Jumuʿah-Khuṭbah und ihre fiqhrechtlichen Voraussetzungen werden getrennt behandelt.</p>'+
      '</section>';

    if(old&&old.parentNode){
      old.parentNode.replaceChild(wrap,old);
      return;
    }

    var pushPanel=host.querySelector(".jummah-push-panel");
    if(pushPanel&&pushPanel.parentNode)pushPanel.parentNode.insertBefore(wrap,pushPanel.nextSibling);
    else host.insertBefore(wrap,host.firstChild);
  }

  function bind(){
    if(document.documentElement.getAttribute("data-dar-jf-bound")==="1")return;
    document.documentElement.setAttribute("data-dar-jf-bound","1");
    document.addEventListener("click",function(ev){
      var b=ev.target&&ev.target.closest?ev.target.closest("[data-dar-jf-open]"):null;
      if(!b)return;
      ev.preventDefault();
      try{
        if(typeof global.navigate==="function"){
          global.navigate("jummah");
          return;
        }
      }catch(e){}
      location.hash="#jummah";
    },true);
  }

  function refresh(){
    ensureStyle();
    renderHome();
    renderDetail();
  }

  function boot(){
    ensureStyle();
    bind();
    refresh();

    if(!observer&&document.body){
      observer=new MutationObserver(function(){
        clearTimeout(global.__darJfMutationTimer);
        global.__darJfMutationTimer=setTimeout(refresh,90);
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }

    if(!timer)timer=setInterval(refresh,30000);
    window.addEventListener("hashchange",function(){setTimeout(refresh,90);});
    document.addEventListener("visibilitychange",function(){if(!document.hidden)refresh();});
  }

  global.DAR_JUMMAH_FRIDAY_TEST={
    build:"v5",
    refresh:refresh,
    state:currentState
  };

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})(window);

/* TEST_UPDATE_BLUE_BANNER_COMPAT_V1016
 * Übergangsschutz für alte Test-App-Hüllen:
 * niemals blockierendes Update-Modal, ausschließlich blauer Top-Hinweis.
 */
(function () {
  "use strict";
  if (String(location.pathname || "").indexOf("/test") !== 0) return;

  var STYLE_ID="dar-test-update-blue-compat-v1016";
  var busy=false;
  var lastRemoteId="";

  function buildNum(id){
    var m=String(id||"").match(/app-shell-v(\d+)/);
    return m?parseInt(m[1],10):0;
  }

  function localBuildId(){
    try{
      if(typeof window.__DAR_EXPECTED_BUILD==="string"&&window.__DAR_EXPECTED_BUILD)return window.__DAR_EXPECTED_BUILD;
    }catch(e){}
    try{
      if(typeof APP_BUILD_ID==="string"&&APP_BUILD_ID)return APP_BUILD_ID;
    }catch(e2){}
    return "";
  }

  function forceNoModalStyle(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=[
      "html body .app-update-modal,html body .app-update-modal[hidden],html body .app-update-modal[data-test-update-bridge='1']{display:none!important;visibility:hidden!important;pointer-events:none!important}",
      "html body .app-update-modal__backdrop,html body .app-update-modal__panel{display:none!important}",
      "body.app-update-modal-open{overflow:auto!important;touch-action:auto!important}"
    ].join("\n");
    document.head.appendChild(s);
  }

  function hideWrongModal(){
    forceNoModalStyle();
    var modal=document.getElementById("appUpdateModal");
    if(modal){
      modal.hidden=true;
      modal.setAttribute("hidden","");
      modal.removeAttribute("data-test-update-bridge");
    }
    document.body.classList.remove("app-update-modal-open");
  }

  function showBlueBanner(remoteId, recovery){
    hideWrongModal();
    var banner=document.getElementById("newPostsBanner");
    if(!banner)return false;

    lastRemoteId=String(remoteId||lastRemoteId||window.__darRemoteBuildId||"").trim();
    if(lastRemoteId)window.__darRemoteBuildId=lastRemoteId;
    window.__darAppVersionAvailable=true;
    window.__darNewPostsAvailable=false;

    var icon=banner.querySelector(".new-posts-icon");
    var text=banner.querySelector(".new-posts-text");
    var refresh=banner.querySelector(".new-posts-refresh");

    banner.classList.remove("is-app-repair");
    banner.classList.add("is-app-version");
    if(icon)icon.textContent=recovery?"⟳":"↑";
    if(text)text.textContent=recovery?"App-Update erforderlich":"Neue Version verfügbar";
    if(refresh)refresh.textContent=recovery?"Jetzt aktualisieren":"Aktualisieren";
    banner.setAttribute("aria-label",recovery?"App-Update erforderlich":"Neue Version laden");
    banner.classList.remove("hidden");
    banner.style.setProperty("display","flex","important");

    if(!banner.__darBlueCompatBound){
      banner.__darBlueCompatBound=true;
      banner.addEventListener("click",function(){
        try{
          var target=String(lastRemoteId||window.__darRemoteBuildId||"");
          if(target){
            try{sessionStorage.setItem("dar_version_update_pending",JSON.stringify({buildId:target,at:Date.now()}));}catch(e){}
          }
          if(typeof window.hardRefreshApp==="function"){
            window.hardRefreshApp();
            return;
          }
        }catch(e2){}
        try{
          var u=new URL(location.href);
          u.searchParams.set("update",String(Date.now()));
          location.replace(u.toString());
        }catch(e3){
          location.reload();
        }
      });
    }
    return true;
  }

  async function check(){
    if(busy||!navigator.onLine)return;
    busy=true;
    try{
      var local=localBuildId();
      var r=await fetch("/test/version.json?blue="+Date.now(),{cache:"no-store"});
      if(!r.ok)return;
      var remote=await r.json();
      var remoteId=String(remote&&remote.buildId||"").trim();
      if(!remoteId||!local||remoteId===local){
        hideWrongModal();
        return;
      }
      if(buildNum(remoteId)<=buildNum(local)){
        hideWrongModal();
        return;
      }
      showBlueBanner(remoteId,false);
    }catch(e){
      hideWrongModal();
    }finally{
      busy=false;
    }
  }

  function watchWrongModal(){
    var modal=document.getElementById("appUpdateModal");
    if(!modal||modal.__darBlueCompatObserved)return;
    modal.__darBlueCompatObserved=true;
    new MutationObserver(function(){
      if(!modal.hidden||!modal.hasAttribute("hidden")||modal.hasAttribute("data-test-update-bridge")){
        showBlueBanner(lastRemoteId||window.__darRemoteBuildId||"",false);
      }
    }).observe(modal,{attributes:true,attributeFilter:["hidden","style","class","data-test-update-bridge"]});
  }

  function boot(){
    forceNoModalStyle();
    hideWrongModal();
    watchWrongModal();
    setTimeout(check,250);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();

  window.addEventListener("pageshow",function(){setTimeout(check,180);});
  window.addEventListener("online",function(){setTimeout(check,180);});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(check,180);});
  setInterval(check,60*1000);
})();
