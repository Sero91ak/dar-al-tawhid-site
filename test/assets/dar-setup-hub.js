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


/* JUMMAH_FRIDAY_MODE_V1
 * DĀR AL TAWḤĪD – Friday/Jumuʿah test experience.
 * UI/state only. Does not alter OneSignal, server scheduler, prayer push or any other push lane.
 */
(function (global) {
  "use strict";

  var HOME_ID="darJummahFridayHome";
  var DETAIL_ID="darJummahFridayDetail";
  var STYLE_ID="darJummahFridayStyle";
  var timer=null, observer=null;

  var YEAR_PLAN=[
    ["Tawḥīd","Tawḥīd – Warum wir erschaffen wurden"],
    ["Tawḥīd","Lā ilāha illā Allāh – Bedeutung und Verpflichtung"],
    ["Tawḥīd","Ikhlāṣ – Allah allein dienen"],
    ["Tawḥīd","Shirk – die größte Gefahr für den Menschen"],
    ["Tawḥīd","Tawakkul – das Herz verlässt sich auf Allah"],
    ["Tawḥīd","Furcht und Hoffnung gehören Allah"],
    ["Tawḥīd","Die Liebe zu Allah und ihre Zeichen"],
    ["ʿAqīdah","Allahs Namen und Eigenschaften ehrfürchtig annehmen"],
    ["Īmān","Īmān – Glaube, Wort und Tat"],
    ["Īmān","Taqwā – Allah im Verborgenen und Sichtbaren fürchten"],
    ["ʿIbādah","Ṣalāh – die tägliche Verbindung zu Allah"],
    ["Qurʾān","Mit dem Qurʾān leben, nicht nur ihn lesen"],
    ["Sunnah","Festhalten an der Sunnah des Propheten ﷺ"],
    ["ʿIlm","Wissen vor Wort und Tat"],
    ["Dhikr","Dhikr – Leben für das Herz"],
    ["Duʿāʾ","Duʿāʾ – Bedürftigkeit vor Allah"],
    ["Tawbah","Tawbah – die Tür der Rückkehr bleibt offen"],
    ["Tawbah","Istighfār – Sünden erkennen und Vergebung suchen"],
    ["Tazkiyah","Ṣabr – Standhaftigkeit in Prüfung und Gehorsam"],
    ["Tazkiyah","Shukr – Dankbarkeit mit Herz, Zunge und Tat"],
    ["Akhlāq","Ṣidq – Wahrhaftigkeit rettet"],
    ["Akhlāq","Amānah – Verantwortung und anvertraute Rechte"],
    ["Familie","Die Rechte der Eltern"],
    ["Familie","Verantwortung für Familie und Kinder"],
    ["Brüderlichkeit","Die Rechte der Muslime untereinander"],
    ["Akhlāq","Die Zunge bewahren"],
    ["Akhlāq","Ghībah – die verborgene Gefahr der üblen Nachrede"],
    ["Tazkiyah","Ḥasad – das Herz von Neid reinigen"],
    ["Tazkiyah","Kibr – Hochmut erkennen und bekämpfen"],
    ["Akhlāq","Tawāḍuʿ – Demut ohne Erniedrigung"],
    ["Ākhirah","Die Dunyā ist Durchgang, nicht Heimat"],
    ["Ākhirah","Der Tod – Gewissheit, auf die wir zugehen"],
    ["Ākhirah","Das Grab und die Vorbereitung darauf"],
    ["Ākhirah","Auferstehung und Rückkehr zu Allah"],
    ["Ākhirah","Rechenschaft und Waage der Taten"],
    ["Ākhirah","Jannah – Hoffnung auf Allahs Belohnung"],
    ["Ākhirah","Das Feuer – Schutz vor den Ursachen der Strafe"],
    ["Tazkiyah","Hoffnung auf Allahs Barmherzigkeit"],
    ["Tazkiyah","Sünden nicht gering achten"],
    ["Muʿāmalāt","Ḥalāl verdienen und Ḥarām meiden"],
    ["Ṣadaqah","Ṣadaqah – geben, bevor man nichts mehr geben kann"],
    ["Zakāt","Zakāt – Reinigung von Vermögen und Seele"],
    ["Ṣiyām","Fasten – Erziehung zu Taqwā"],
    ["ʿIbādah","Beständigkeit in guten Taten"],
    ["Akhlāq","Versprechen und Verträge einhalten"],
    ["Brüderlichkeit","Barmherzigkeit, Nachsicht und gutes Miteinander"],
    ["Fitan","Standhaft bleiben in Zeiten der Fitnah"],
    ["Sunnah","Rettung im Festhalten an Qurʾān und Sunnah"],
    ["Ṣaḥābah","Die Ṣaḥābah lieben und ihrem Weg folgen"],
    ["Salaf","Was es bedeutet, dem Verständnis der Salaf zu folgen"],
    ["Tazkiyah","Verborgene Taten – wenn nur Allah dich sieht"],
    ["Tawḥīd","Allah mit Tawḥīd begegnen"]
  ];

  function esc(v){
    return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
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
  function buildCadence(s,w){
    var now=new Date(),items=[];
    for(var hour=9;hour<=23;hour+=2){
      var d=new Date(now);d.setHours(hour,0,0,0);
      if(w.lastStart&&d>=w.lastStart)break;
      if(w.maghrib&&d>=w.maghrib)break;
      items.push(d);
    }
    if(w.lastStart&&(!w.maghrib||w.lastStart<w.maghrib))items.push(w.lastStart);
    return{items:items,next:items.find(function(d){return d>now;})||null};
  }
  function currentState(){
    var s=readPrayerSettings(),fri=isFriday(s),w=prayerWindow(s),now=new Date();
    return{
      settings:s,friday:fri,window:w,
      ended:!!(fri&&w.maghrib&&now>=w.maghrib),
      last:!!(fri&&w.lastStart&&w.maghrib&&now>=w.lastStart&&now<w.maghrib),
      cadence:buildCadence(s,w)
    };
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var el=document.createElement("style");el.id=STYLE_ID;
    el.textContent=
      ".dar-jf-home,.dar-jf-detail{--jg:var(--gold2,#efd78e);--jc:var(--cream,#fff6dc);--jm:var(--muted,#bdb5a5);color:var(--jc)}"+
      ".dar-jf-home{position:relative;margin:12px 0 16px;padding:0 15px;border-top:1px solid color-mix(in srgb,var(--jg) 42%,transparent);border-bottom:1px solid color-mix(in srgb,var(--jg) 24%,transparent);background:linear-gradient(90deg,rgba(8,18,31,.96),rgba(7,14,24,.90));overflow:hidden}"+
      ".dar-jf-home:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 88% 0%,color-mix(in srgb,var(--jg) 11%,transparent),transparent 43%);pointer-events:none}"+
      ".dar-jf-inner{position:relative;padding:15px 0 13px}.dar-jf-kicker{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--jg);font-weight:900}"+
      ".dar-jf-home h2,.dar-jf-detail h2,.dar-jf-detail h3{font-family:var(--serif,Georgia,serif);color:var(--jg);margin:5px 0 7px;line-height:1.15}.dar-jf-home h2{font-size:clamp(22px,6vw,29px)}"+
      ".dar-jf-home p,.dar-jf-detail p{margin:0;color:var(--jm);line-height:1.55}.dar-jf-lead{font-size:14.5px!important;color:var(--jc)!important}.dar-jf-source{display:block;margin-top:7px;color:color-mix(in srgb,var(--jg) 76%,var(--jm));font-size:10.5px;line-height:1.4}"+
      ".dar-jf-chips{display:flex;gap:7px;flex-wrap:wrap;margin:11px 0 8px}.dar-jf-chip{display:inline-flex;align-items:center;min-height:27px;padding:5px 8px;border-radius:999px;border:1px solid color-mix(in srgb,var(--jg) 25%,transparent);font-size:10px;font-weight:800;color:var(--jm)}.dar-jf-chip b{color:var(--jc);margin-left:4px}.dar-jf-chip.live{border-color:color-mix(in srgb,var(--jg) 60%,transparent);color:var(--jg)}"+
      ".dar-jf-open{border:0;background:none;color:var(--jg);font:inherit;font-size:12px;font-weight:900;padding:7px 0;cursor:pointer}.dar-jf-open:after{content:'  ›';font-size:16px}"+
      ".dar-jf-detail{margin:12px 0 4px;border-top:1px solid color-mix(in srgb,var(--jg) 32%,transparent)}.dar-jf-section{padding:15px 2px;border-bottom:1px solid color-mix(in srgb,var(--jg) 18%,transparent)}.dar-jf-section:last-child{border-bottom:0}.dar-jf-detail h2{font-size:23px}.dar-jf-detail h3{font-size:18px}"+
      ".dar-jf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:10px;border-top:1px solid color-mix(in srgb,var(--jg) 18%,transparent);border-bottom:1px solid color-mix(in srgb,var(--jg) 18%,transparent)}.dar-jf-metric{padding:9px}.dar-jf-metric:nth-child(odd){border-right:1px solid color-mix(in srgb,var(--jg) 18%,transparent)}.dar-jf-metric b{display:block;color:var(--jg);font-size:9.5px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:3px}.dar-jf-metric span{font-size:12.5px;color:var(--jc)}"+
      ".dar-jf-callout{margin-top:10px;padding:11px 0;border-top:1px solid color-mix(in srgb,var(--jg) 24%,transparent)}.dar-jf-callout strong{display:block;color:var(--jc);font-size:13px;margin-bottom:4px}.dar-jf-khutbah blockquote{margin:10px 0;padding:0 0 0 12px;border-left:2px solid color-mix(in srgb,var(--jg) 55%,transparent);color:var(--jc);line-height:1.6;font-size:13.5px}.dar-jf-khutbah p{margin:9px 0}"+
      ".dar-jf-year{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}.dar-jf-year-item{padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--jg) 16%,transparent);font-size:10.7px;color:var(--jm)}.dar-jf-year-item b{color:var(--jc);display:block;margin-bottom:2px}.dar-jf-note{font-size:10.3px!important;margin-top:9px!important}"+
      "@media(max-width:480px){.dar-jf-home{padding-left:12px;padding-right:12px}.dar-jf-year,.dar-jf-grid{grid-template-columns:1fr}.dar-jf-metric:nth-child(odd){border-right:0}.dar-jf-metric+.dar-jf-metric{border-top:1px solid color-mix(in srgb,var(--jg) 14%,transparent)}}";
    document.head.appendChild(el);
  }

  function renderHome(){
    var old=document.getElementById(HOME_ID),st=currentState();
    if(!st.friday||st.ended){if(old)old.remove();return;}
    var mount=document.getElementById("focusFeedMount");
    if(!mount||!mount.parentNode)return;
    var next=st.cadence.next?fmt(st.cadence.next,st.settings):(st.last?"Duʿāʾ-Zeit":"bis Maghrib");
    var last=st.window.lastStart?fmt(st.window.lastStart,st.settings):"nach ʿAṣr";
    var mag=st.window.maghrib?fmt(st.window.maghrib,st.settings):"nach Standort";
    var sig=[st.last,next,last,mag].join("|");
    var html='<section id="'+HOME_ID+'" class="dar-jf-home" data-jf-sig="'+esc(sig)+'" aria-label="Jumuʿah am Freitag"><div class="dar-jf-inner">'+
      '<div class="dar-jf-kicker">'+(st.last?'LETZTE ZEIT VOR MAGHRIB':'JUMUʿAH · FREITAG')+'</div>'+
      '<h2>'+(st.last?'Nutze diese Zeit für Duʿāʾ':'Vermehre heute die Ṣalāh auf den Propheten ﷺ')+'</h2>'+
      '<p class="dar-jf-lead">'+(st.last?'Suche die besondere Zeit am Freitag in der letzten Zeit nach ʿAṣr und bitte Allah mit Gegenwart des Herzens.':'Der Prophet ﷺ ermunterte dazu, am Freitag vermehrt Ṣalāh auf ihn zu sprechen.')+'</p>'+
      '<span class="dar-jf-source">'+(st.last?'Sunan Abī Dāwūd 1048 · als ṣaḥīḥ eingestuft':'Aws ibn Aws · Überlieferung zum Freitag · Isnād ṣaḥīḥ')+'</span>'+
      '<div class="dar-jf-chips"><span class="dar-jf-chip'+(st.last?' live':'')+'">Nächste Erinnerung <b>'+esc(next)+'</b></span><span class="dar-jf-chip">Letzte Zeit <b>'+esc(last)+'</b></span><span class="dar-jf-chip">Maghrib <b>'+esc(mag)+'</b></span></div>'+
      '<button type="button" class="dar-jf-open" data-dar-jf-open="1">Jumuʿah öffnen</button></div></section>';
    if(old){
      if(old.getAttribute("data-jf-sig")===sig)return;
      old.outerHTML=html;return;
    }
    var box=document.createElement("div");box.innerHTML=html;mount.parentNode.insertBefore(box.firstElementChild,mount);
  }

  function yearPreview(){
    return YEAR_PLAN.slice(0,8).map(function(x,i){
      return'<div class="dar-jf-year-item"><b>Woche '+(i+1)+' · '+esc(x[0])+'</b>'+esc(x[1])+'</div>';
    }).join("");
  }

  function renderDetail(){
    var host=document.querySelector(".jummah-hub-page");
    if(!host)return;
    var old=document.getElementById(DETAIL_ID);
    var st=currentState(),asr=st.window.asr?fmt(st.window.asr,st.settings):"Standort nötig",mag=st.window.maghrib?fmt(st.window.maghrib,st.settings):"Standort nötig",last=st.window.lastStart?fmt(st.window.lastStart,st.settings):"nach ʿAṣr";
    var rhythm=st.cadence.items.length?st.cadence.items.map(function(d){return fmt(d,st.settings);}).join(" · "):"09:00 · 11:00 · 13:00 · … · bis Maghrib";
    var sig=[st.friday,st.last,asr,last,mag,rhythm].join("|");
    if(old&&old.getAttribute("data-jf-sig")===sig)return;
    var wrap=document.createElement("div");wrap.id=DETAIL_ID;wrap.className="dar-jf-detail";wrap.setAttribute("data-jf-sig",sig);
    wrap.innerHTML=
      '<section class="dar-jf-section"><div class="dar-jf-kicker">FREITAGSROUTINE</div><h2>Jumuʿah bewusst leben</h2>'+
      '<p>Am Freitag stehen Ṣalāh auf den Propheten ﷺ, Vorbereitung auf Jumuʿah, Dhikr und Duʿāʾ besonders im Fokus.</p>'+
      '<div class="dar-jf-grid"><div class="dar-jf-metric"><b>Rhythmus</b><span>'+esc(rhythm)+'</span></div><div class="dar-jf-metric"><b>ʿAṣr</b><span>'+esc(asr)+'</span></div><div class="dar-jf-metric"><b>Letzte Erinnerung</b><span>'+esc(last)+'</span></div><div class="dar-jf-metric"><b>Maghrib</b><span>'+esc(mag)+'</span></div></div>'+
      '<div class="dar-jf-callout"><strong>Ṣalāh auf den Propheten ﷺ</strong><p>Vermehre sie heute ohne erfundene feste Zahl. Der geplante App-Rhythmus beginnt um 09:00 Uhr und erinnert danach alle zwei Stunden bis zur Schlussphase vor Maghrib.</p><span class="dar-jf-source">Aws ibn Aws · Überlieferung über die vermehrte Ṣalāh am Freitag · authentisch belegt</span></div>'+
      '<div class="dar-jf-callout"><strong>Die besondere Zeit für Duʿāʾ</strong><p>Die App setzt zusätzlich ein technisches Erinnerungsfenster ungefähr 60 Minuten vor Maghrib. Maßgeblich bleibt die überlieferte letzte Zeit nach ʿAṣr; die 60 Minuten sind keine eigene religiöse Festlegung.</p><span class="dar-jf-source">Sunan Abī Dāwūd 1048 · Sunan an-Nasāʾī 1389 · als ṣaḥīḥ eingestuft</span></div></section>'+
      '<section class="dar-jf-section dar-jf-khutbah"><div class="dar-jf-kicker">DIESE WOCHE · KURZER FREITAGSIMPULS</div><h2>Tawḥīd – Warum wir erschaffen wurden</h2>'+
      '<p>Der Mensch wurde erschaffen, um Allah allein zu dienen. Tawḥīd ordnet das Herz, die ʿIbādah und das ganze Leben auf Allah aus.</p>'+
      '<blockquote>Allah hat Jinn und Menschen erschaffen, damit sie Ihm dienen. Der Kern dieser ʿIbādah ist Tawḥīd: Allah allein anzubeten und Ihm nichts beizugesellen.</blockquote>'+
      '<p>Der Prophet ﷺ erklärte Muʿādh ibn Jabal رضي الله عنه, dass Allahs Recht über Seine Diener darin besteht, dass sie Ihn allein anbeten und Ihm nichts beigesellen. Tawḥīd ist deshalb nicht nur ein Kapitel des Wissens. Er ist die Grundlage von Duʿāʾ, Hoffnung, Furcht, Liebe, Vertrauen und jeder ʿIbādah.</p>'+
      '<p>Prüfe dein Herz: Für wen betest du? Wen rufst du in Not an? Auf wen verlässt du dich? Wem gilt deine höchste Liebe und Unterwerfung? Kehre mit Aufrichtigkeit zu Allah zurück und bewahre den Tawḥīd, bis du Ihm begegnest.</p>'+
      '<span class="dar-jf-source">Qurʾān 51:56 · Ṣaḥīḥ al-Buḫārī 7373 · Ṣaḥīḥ Muslim 30</span>'+
      '<p class="dar-jf-note">Der Impuls bleibt bewusst kurz. Zur Kürze der Khuṭbah: Ṣaḥīḥ Muslim 869. Eine formelle Jumuʿah-Khuṭbah und ihre fiqhrechtlichen Voraussetzungen werden getrennt behandelt.</p></section>'+
      '<section class="dar-jf-section"><div class="dar-jf-kicker">52 WOCHEN</div><h3>Jahresplan für Jumuʿah</h3><p>52 Themen sind vorbereitet. Automatisch ausgespielt werden später nur Inhalte, deren Qurʾān-, Sunnah- und Aṯār-Nachweise einzeln geprüft und freigegeben wurden.</p><div class="dar-jf-year">'+yearPreview()+'</div><p class="dar-jf-note">Vorschau zeigt die ersten 8 Themen · Gesamtplan: 52 · aktuell ist nur der erste Wochenimpuls als Testinhalt freigegeben.</p></section>';
    if(old&&old.parentNode){old.parentNode.replaceChild(wrap,old);return;}
    var p=host.querySelector(".jummah-push-panel");
    if(p&&p.parentNode)p.parentNode.insertBefore(wrap,p.nextSibling);else host.insertBefore(wrap,host.firstChild);
  }

  function bind(){
    if(document.documentElement.getAttribute("data-dar-jf-bound")==="1")return;
    document.documentElement.setAttribute("data-dar-jf-bound","1");
    document.addEventListener("click",function(ev){
      var b=ev.target&&ev.target.closest?ev.target.closest("[data-dar-jf-open]"):null;
      if(!b)return;
      ev.preventDefault();
      try{if(typeof global.navigate==="function"){global.navigate("jummah");return;}}catch(e){}
      location.hash="#jummah";
    },true);
  }
  function refresh(){ensureStyle();renderHome();renderDetail();}
  function boot(){
    ensureStyle();bind();refresh();
    if(!observer&&document.body){
      observer=new MutationObserver(function(){clearTimeout(global.__darJfMutationTimer);global.__darJfMutationTimer=setTimeout(refresh,90);});
      observer.observe(document.body,{childList:true,subtree:true});
    }
    if(!timer)timer=setInterval(refresh,30000);
    window.addEventListener("hashchange",function(){setTimeout(refresh,90);});
    document.addEventListener("visibilitychange",function(){if(!document.hidden)refresh();});
  }
  global.DAR_JUMMAH_FRIDAY_TEST={build:"v1",refresh:refresh,state:currentState,yearPlan:YEAR_PLAN.slice()};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);


/* TEST_UPDATE_PROMPT_BRIDGE_V1013
 * Übergangsbrücke: auch eine noch geladene alte Test-Hülle (z. B. v1006)
 * bekommt bei neuer /test/version.json ein echtes "Jetzt aktualisieren"-Modal.
 * Keine Push-/OneSignal-Logik.
 */
(function () {
  "use strict";
  if (String(location.pathname || "").indexOf("/test") !== 0) return;

  var STYLE_ID = "dar-test-update-bridge-style-v1013";
  var busy = false;

  function buildNum(id) {
    var m = String(id || "").match(/app-shell-v(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function localBuildId() {
    try {
      if (typeof window.__DAR_EXPECTED_BUILD === "string" && window.__DAR_EXPECTED_BUILD) return window.__DAR_EXPECTED_BUILD;
    } catch (e) {}
    try {
      if (typeof APP_BUILD_ID === "string" && APP_BUILD_ID) return APP_BUILD_ID;
    } catch (e2) {}
    return "";
  }

  function ensureBridgeStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = [
      "html body .app-update-modal[data-test-update-bridge='1']{position:fixed!important;inset:0!important;z-index:2147483000!important;display:flex!important;visibility:visible!important;pointer-events:auto!important;align-items:center!important;justify-content:center!important;padding:max(18px,env(safe-area-inset-top,0px)) 18px max(18px,env(safe-area-inset-bottom,0px))!important}",
      "html body .app-update-modal[data-test-update-bridge='1'] .app-update-modal__backdrop{display:block!important;position:absolute!important;inset:0!important;background:rgba(2,7,15,.74)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important}",
      "html body .app-update-modal[data-test-update-bridge='1'] .app-update-modal__panel{display:block!important;position:relative!important;width:min(92vw,430px)!important;margin:auto!important;padding:24px 22px 21px!important;border:1px solid color-mix(in srgb,var(--gold2,#efd78e) 42%,transparent)!important;border-radius:22px!important;background:radial-gradient(circle at 82% 0%,color-mix(in srgb,var(--gold2,#efd78e) 13%,transparent),transparent 40%),linear-gradient(160deg,rgba(8,23,43,.985),rgba(5,12,23,.99))!important;box-shadow:0 28px 80px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.04)!important}",
      "html body .app-update-modal[data-test-update-bridge='1'] .app-update-modal__badge{display:inline-block!important;margin-bottom:9px!important;color:var(--gold2,#efd78e)!important;font-size:10px!important;font-weight:900!important;letter-spacing:.16em!important;text-transform:uppercase!important}",
      "html body .app-update-modal[data-test-update-bridge='1'] h2{margin:0 0 9px!important;color:var(--gold2,#efd78e)!important;font-family:var(--serif,Georgia,serif)!important;font-size:clamp(25px,7vw,32px)!important;line-height:1.08!important}",
      "html body .app-update-modal[data-test-update-bridge='1'] p{margin:0!important;color:var(--cream,#fff6dc)!important;font-size:13.5px!important;line-height:1.6!important;opacity:.9!important}",
      "html body .app-update-modal[data-test-update-bridge='1'] .app-update-modal__btn{display:block!important;width:100%!important;min-height:48px!important;margin-top:18px!important;border:1px solid color-mix(in srgb,var(--gold2,#efd78e) 58%,transparent)!important;border-radius:14px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--gold2,#efd78e) 22%,transparent),color-mix(in srgb,var(--gold2,#efd78e) 10%,transparent))!important;color:var(--cream,#fff6dc)!important;font-weight:900!important;font-size:14px!important}",
      "body.app-update-modal-open{overflow:hidden!important;touch-action:none!important}"
    ].join("\n");
    document.head.appendChild(s);
  }

  function showBridge(remoteId) {
    var modal = document.getElementById("appUpdateModal");
    var btn = document.getElementById("appUpdateModalBtn");
    if (!modal || !btn) return false;

    ensureBridgeStyle();
    window.__darRemoteBuildId = remoteId;
    window.__darAppVersionAvailable = true;

    var title = document.getElementById("appUpdateModalTitle");
    var text = document.getElementById("appUpdateModalText");
    if (title) title.textContent = "Neue Test-App-Version verfügbar";
    if (text) text.textContent = "Die Test-App wurde neu aufgebaut. Tippe auf „Jetzt aktualisieren“, um den neuen Jumuʿah-Bereich und die aktuelle Oberfläche zu laden.";
    btn.textContent = "Jetzt aktualisieren";

    modal.setAttribute("data-test-update-bridge", "1");
    modal.hidden = false;
    modal.removeAttribute("hidden");
    document.body.classList.add("app-update-modal-open");

    if (!btn.__darTestUpdateBridgeBound) {
      btn.__darTestUpdateBridgeBound = true;
      btn.addEventListener("click", function () {
        try {
          var target = String(window.__darRemoteBuildId || "");
          try {
            sessionStorage.setItem("dar_version_update_pending", JSON.stringify({ buildId: target, at: Date.now() }));
          } catch (e) {}
          if (typeof window.hardRefreshApp === "function") {
            window.hardRefreshApp();
            return;
          }
        } catch (e2) {}
        try {
          var u = new URL(location.href);
          u.searchParams.set("update", String(Date.now()));
          location.replace(u.toString());
        } catch (e3) {
          location.reload();
        }
      });
    }
    return true;
  }

  async function check() {
    if (busy || !navigator.onLine) return;
    busy = true;
    try {
      var local = localBuildId();
      var r = await fetch("/test/version.json?bridge=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      var remote = await r.json();
      var remoteId = String(remote && remote.buildId || "").trim();
      if (!remoteId || !local || remoteId === local) return;
      if (buildNum(remoteId) <= buildNum(local)) return;
      showBridge(remoteId);
    } catch (e) {
    } finally {
      busy = false;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(check, 350); }, { once: true });
  } else {
    setTimeout(check, 350);
  }
  window.addEventListener("pageshow", function () { setTimeout(check, 250); });
  window.addEventListener("online", function () { setTimeout(check, 250); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) setTimeout(check, 250);
  });
  setInterval(check, 60 * 1000);
})();
