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

  /* In Einstellungen nur einen Einstieg – die einzige Zentrale ist Mehr → Alltag → Benachrichtigungen. */
  function renderHtml() {
    return [
      '<section id="' + ROOT_ID + '" class="dar-setup-hub" data-dar-setup="true" data-dar-refined-setup="v1" aria-label="Mitteilungen verwalten">',
      ' <header class="dar-setup-hub__head">',
      '  <h2 class="dar-setup-hub__title">Benachrichtigungen</h2>',
      '  <p class="dar-setup-hub__sub">Gebete, Jumuʿah und tägliche Erinnerungen an einem Ort verwalten.</p>',
      ' </header>',
      ' <div class="dar-setup-hub__list"><div class="dar-setup-hub__row">',
      '   <div class="dar-setup-hub__copy"><strong>Deine Erinnerungen</strong><span>Mitteilungen, Standort und Zeiten einstellen</span></div>',
      '   <button type="button" class="dar-setup-hub__btn" data-dar-setup-action="notifications">Öffnen</button>',
      ' </div></div>',
      '</section>'
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
    /* Kein OS-Prompt aus der Einstellungsübersicht. Vorhandene Zentrale öffnen. */
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
      if (existing.getAttribute("data-dar-refined-setup") !== "v1") {
        existing.outerHTML = renderHtml();
        existing = document.getElementById(ROOT_ID);
      }
      bind(existing);
      return existing;
    }
    /* Older rendered app builds may omit the setup hub until JS loads. */
    page.insertAdjacentHTML("afterbegin", renderHtml());
    existing = document.getElementById(ROOT_ID);
    bind(existing);
    return existing;
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


/* DAR_TEST_NOTIFICATIONS_REFINED_V1
 * Schaltet ausschließlich die Oberfläche um; ältere Event-IDs und Push-Callbacks bleiben erhalten.
 */
(function () {
  "use strict";
  if (!/^\/test(?:\/|$)/.test(location.pathname)) return;
  var STYLE_ID = "dar-notifications-refined-css-v1";

  function loadStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var node = document.createElement("link");
    node.id = STYLE_ID;
    node.rel = "stylesheet";
    node.href = "/test/assets/notifications-refined-v1.css?v=1";
    document.head.appendChild(node);
  }

  function readableStatus(node) {
    if (!node) return;
    var raw = String(node.textContent || "").trim();
    if (!raw) return;
    if (raw.indexOf("Push nicht vollständig aktiv") !== -1) {
      node.title = raw;
      node.textContent = /Berechtigung/.test(raw)
        ? "Mitteilungen sind auf diesem Gerät noch nicht erlaubt."
        : "Mitteilungen sind noch nicht vollständig eingerichtet.";
    } else if (raw.indexOf(" · Gerät erkannt") !== -1 ||
               /^Web Push aktiv/.test(raw) || /^Safari\/Web Push aktiv/.test(raw)) {
      node.title = raw;
      node.textContent = "Mitteilungen sind auf diesem Gerät verbunden.";
    }
  }

  function polish() {
    loadStyles();
    var page = document.querySelector("body.is-notifications-route .notification-center-page");
    if (!page) return;
    var reenable = page.querySelector("#notificationReenableBtn");
    if (reenable) reenable.textContent = "Jetzt einrichten";
    var status = page.querySelector("#notificationHealthText");
    if (status) {
      readableStatus(status);
      if (!status.__darRefinedObserver) {
        status.__darRefinedObserver = new MutationObserver(function () {
          readableStatus(status);
        });
        status.__darRefinedObserver.observe(status, { childList: true, characterData: true, subtree: true });
      }
    }
  }

  function schedulePolish() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", schedulePolish, {once:true});
      return;
    }
    polish();
    requestAnimationFrame(polish);
    setTimeout(polish, 60);
    setTimeout(polish, 400);
  }
  window.addEventListener("hashchange", schedulePolish);
  window.addEventListener("pageshow", schedulePolish);
  document.addEventListener("dar:render", schedulePolish);
  schedulePolish();
})();


/* DAR_TEST_NOTIFICATION_LOCATION_V3
   Einziger Ort für Berechtigungen: die vorhandene Seite Benachrichtigungen.
   GPS wird ausschließlich durch einen direkten Nutzertipp angefragt.
   Nutzt getPrayerSettings, reversePrayerCity, setPrayerSettings und render
   aus der offiziellen Test-App; keine weitere Push- oder Navigationslogik.
 */
(function(){
  "use strict";
  if(!/^\/test(?:\/|$)/.test(String(location.pathname||"")))return;
  var PAGE="body.is-notifications-route .notification-center-page";
  var GPS_ID="darNotificationGpsQuickV3";
  var scheduled=false;
  var pending=false;
  var viewObserver=null;

  function prayerSettings(){
    try{return typeof getPrayerSettings==="function"?getPrayerSettings():{};}catch(e){return {};}
  }
  function setFeedback(message){
    var node=document.querySelector("#"+GPS_ID+" [data-dar-gps-feedback]");
    if(!node)return;
    node.textContent=String(message||"");
    node.hidden=!message;
  }
  function setGpsText(message){
    var node=document.querySelector("#"+GPS_ID+" [data-dar-gps-summary]");
    if(node)node.textContent=message;
  }
  function permissionLabel(state){
    if(state==="granted")return "Standortzugriff erlaubt. Du kannst deinen Ort jederzeit aktualisieren.";
    if(state==="denied")return "Standortzugriff am Gerät gesperrt. Die manuelle Ortswahl bleibt möglich.";
    if(state==="prompt")return "Automatische Ortung erst nach deiner Zustimmung.";
    return "Standort automatisch erkennen oder die Stadt manuell auswählen.";
  }
  function refreshPermission(){
    var node=document.getElementById(GPS_ID);
    if(!node)return;
    setGpsText(permissionLabel(""));
    try{
      if(!navigator.geolocation){
        setGpsText("Geräteortung hier nicht verfügbar. Stadt über „Ändern“ auswählen.");
        var btn=node.querySelector("[data-dar-detect-location]");
        if(btn)btn.disabled=true;
        return;
      }
      if(navigator.permissions&&typeof navigator.permissions.query==="function"){
        navigator.permissions.query({name:"geolocation"}).then(function(result){
          if(node.isConnected&&!pending)setGpsText(permissionLabel(result&&result.state));
        }).catch(function(){});
      }
    }catch(e){}
  }
  function updateSummary(){
    var page=document.querySelector(PAGE);
    if(!page)return;
    var count=page.querySelector(".notification-hero__count > span");
    if(count){
      var num=count.querySelector("b");
      if(num){
        var label=Number(num.textContent||0)===1?"Erinnerungsart gewählt":"Erinnerungsarten gewählt";
        count.setAttribute("aria-label",num.textContent+" "+label);
        var textNode=Array.prototype.slice.call(count.childNodes).find(function(n){return n.nodeType===3;});
        if(textNode&&textNode.textContent.trim()!=="gewählt")textNode.textContent=" gewählt";
      }
    }
    var test=page.querySelector("#notificationDeviceTestBtn");
    if(test){
      test.hidden=true;
      test.setAttribute("hidden","");
      test.setAttribute("aria-hidden","true");
      test.tabIndex=-1;
    }
    var note=page.querySelector(".notification-note");
    if(note&&!note.hasAttribute("data-dar-readable-note")){
      note.textContent="Deine Auswahl wird auf diesem Gerät gespeichert.";
      note.setAttribute("data-dar-readable-note","1");
    }
    var reenable=page.querySelector("#notificationReenableBtn");
    if(reenable){
      reenable.textContent="Mitteilungen einrichten";
    }
    var status=page.querySelector("#notificationHealthText");
    if(status){
      var raw=String(status.textContent||"").trim();
      var newLabel="";
      if(/^Push nicht vollständig aktiv/.test(raw)){
        newLabel=/Berechtigung/.test(raw)
          ?"Mitteilungen sind auf diesem Gerät noch nicht freigegeben."
          :"Mitteilungen sind noch nicht vollständig eingerichtet.";
      }else if(/^(?:Safari\/Web Push|Web Push|iOS Native) aktiv/.test(raw)){
        newLabel="Mitteilungen sind mit deinem Gerät verbunden.";
      }else if(raw==="Push-Status wird geprüft…"){
        newLabel="Gerätefreigabe wird geprüft …";
      }
      if(newLabel&&newLabel!==raw)status.textContent=newLabel;
    }
  }
  async function locate(button){
    if(pending)return;
    if(!navigator.geolocation&&!(window.DAR_NATIVE_LOCATION)){
      setFeedback("Standortbestimmung ist hier nicht verfügbar. Bitte „Ändern“ wählen.");
      return;
    }
    if(!window.isSecureContext&&!(window.DAR_NATIVE_LOCATION)){
      setFeedback("Standortfreigabe benötigt eine sichere HTTPS-Verbindung.");
      return;
    }
    pending=true;
    button.disabled=true;
    button.textContent="Wird ermittelt …";
    setFeedback("");
    try{
      /* Native Location oder Browser-Geolocation: synchron im Klick gestartet. */
      var pos;
      if(typeof requestBrowserPosition==="function"){
        pos=await requestBrowserPosition();
      }else{
        pos=await new Promise(function(resolve,reject){
          navigator.geolocation.getCurrentPosition(resolve,reject,{
            enableHighAccuracy:true,timeout:12000,maximumAge:600000
          });
        });
      }
      var lat=Number(pos&&pos.coords&&pos.coords.latitude);
      var lon=Number(pos&&pos.coords&&pos.coords.longitude);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180){
        throw new Error("invalid_coordinates");
      }
      var city=typeof reversePrayerCity==="function"
        ?await reversePrayerCity(lat,lon):"Aktueller Standort";
      if(typeof setPrayerSettings!=="function")throw new Error("prayer_settings_unavailable");
      setPrayerSettings({lat:lat,lon:lon,city:String(city||"Aktueller Standort"),
        locationGranted:true});
      setFeedback("Standort übernommen: "+city+". Die Gebetszeiten verwenden nun diesen Ort.");
      if(typeof render==="function")render();
      else queue();
    }catch(err){
      var code=Number(err&&err.code||0);
      if(code===1){
        setFeedback("Standortzugriff verweigert. Bitte die Freigabe in den Geräte- oder Browser-Einstellungen ändern. Die manuelle Stadtwahl bleibt möglich.");
      }else if(code===3){
        setFeedback("Standortbestimmung dauert zu lange. Bitte erneut versuchen oder die Stadt manuell auswählen.");
      }else{
        setFeedback("Ort konnte nicht ermittelt werden. Bitte erneut versuchen oder „Ändern“ nutzen.");
      }
    }finally{
      pending=false;
      if(button.isConnected){
        button.disabled=false;
        button.textContent="Standort erkennen";
      }
      refreshPermission();
    }
  }
  function mount(){
    var page=document.querySelector(PAGE);
    if(!page)return;
    var original=page.querySelector(".notification-location");
    if(!original)return;
    var row=document.getElementById(GPS_ID);
    if(!row||!page.contains(row)){
      row=document.createElement("div");
      row.id=GPS_ID;
      row.className="notification-gps-quick";
      row.innerHTML=[
        '<div class="notification-gps-quick__copy">',
        ' <strong>Automatischer Standort</strong>',
        ' <small data-dar-gps-summary>Standort nur mit deiner Zustimmung erkennen.</small>',
        '</div>',
        '<button type="button" class="notification-gps-quick__btn" data-dar-detect-location>Standort erkennen</button>',
        '<p class="notification-gps-quick__feedback" data-dar-gps-feedback hidden role="status" aria-live="polite"></p>'
      ].join("");
      original.insertAdjacentElement("afterend",row);
      row.addEventListener("click",function(ev){
        var btn=ev.target&&ev.target.closest("[data-dar-detect-location]");
        if(!btn||!row.contains(btn))return;
        ev.preventDefault();
        ev.stopPropagation();
        locate(btn);
      });
      refreshPermission();
    }
    updateSummary();
  }
  function queue(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      try{mount()}catch(e){}
    });
  }
  function boot(){
    var app=document.getElementById("appView");
    if(app&&!viewObserver){
      viewObserver=new MutationObserver(queue);
      viewObserver.observe(app,{childList:true,subtree:true,characterData:false});
    }
    queue();
    window.addEventListener("hashchange",queue);
    window.addEventListener("pageshow",queue);
    document.addEventListener("dar:render",queue);
    document.addEventListener("dar:view-rendered",queue);
    document.addEventListener("visibilitychange",function(){
      if(!document.hidden){refreshPermission();queue();}
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
