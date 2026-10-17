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

  /* Berechtigungsstatus ist NICHT identisch mit gespeicherten Erinnerungen. */
  function isNativeIos() {
    return !!(window.DAR_IOS_NATIVE_APP || window.DAR_OFFICIAL_IOS_APP);
  }

  function notificationState() {
    if (isNativeIos()) {
      /* WebAppView simuliert aktuell "granted"; nicht als Systemstatus darstellen. */
      return "unknown";
    }
    try {
      if (typeof Notification !== "undefined" && typeof Notification.permission === "string") {
        return Notification.permission;
      }
    } catch (e) {}
    return "unsupported";
  }

  function labelForPermission(state) {
    if (state === "granted") return "Vom Gerät erlaubt";
    if (state === "denied") return "Vom Gerät verweigert";
    if (state === "prompt" || state === "default") return "Noch nicht erlaubt";
    if (state === "unsupported") return "Auf diesem Gerät nicht verfügbar";
    return "Systemstatus nicht überprüfbar";
  }

  function renderHtml() {
    var s = readSettings();
    var saved = hasLocation(s);
    var city = String(s.city || s.cityName || s.locationName || "").trim();
    var savedLabel = saved ? ("Ort gespeichert" + (city ? ": " + city : "")) : "Noch kein Ort gespeichert";
    return [
      '<section id="' + ROOT_ID + '" class="dar-setup-hub" data-dar-setup="true" data-dar-permission-hub="v2" aria-label="Standort und Mitteilungen">',
      '  <header class="dar-setup-hub__head">',
      '    <h2 class="dar-setup-hub__title">Standort &amp; Mitteilungen</h2>',
      '    <p class="dar-setup-hub__sub">Berechtigungen und Erinnerungen an einem Ort verwalten.</p>',
      '  </header>',
      '  <div class="dar-setup-hub__list">',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Standort</strong><span data-dar-permission-location aria-live="polite">' + esc(savedLabel) + ' · Zugriff wird geprüft</span></div><div class="dar-setup-hub__actions"><button type="button" class="dar-setup-hub__btn" data-dar-setup-action="location">Ort ermitteln</button><button type="button" class="dar-setup-hub__text-btn" data-dar-setup-action="manual-location">Stadt auswählen</button></div></div>',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Mitteilungen</strong><span data-dar-permission-notifications aria-live="polite">' + esc(labelForPermission(notificationState())) + '</span></div><button type="button" class="dar-setup-hub__btn" data-dar-setup-action="notifications">Mitteilungen erlauben</button></div>',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Erinnerungen</strong><span>Gebete, Jumuʿah, Duʿāʾ und Empfehlungen separat auswählen</span></div><button type="button" class="dar-setup-hub__btn" data-dar-setup-action="reminders">Anpassen</button></div>',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Gebetszeiten</strong><span>Gespeicherten Ort und Zeiten für Widgets synchronisieren</span></div><button type="button" class="dar-setup-hub__btn" data-dar-setup-action="sync">Aktualisieren</button></div>',
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Widgets</strong><span>Gebetszeiten und weitere Startbildschirm-Anzeigen</span></div><button type="button" class="dar-setup-hub__btn" data-dar-setup-action="widgets">Öffnen</button></div>',
      '  </div>',
      '  <p class="dar-setup-hub__help" data-dar-permission-help hidden role="status" aria-live="polite"></p>',
      '</section>'
    ].join("");
  }

  function help(message) {
    var node = document.querySelector("#" + ROOT_ID + " [data-dar-permission-help]");
    if (!node) return;
    node.textContent = message || "";
    node.hidden = !message;
  }

  function setButtonBusy(btn, busy) {
    if (!btn) return;
    btn.disabled = !!busy;
    btn.classList.toggle("is-busy", !!busy);
  }

  async function refreshPermissions() {
    var hub = document.getElementById(ROOT_ID);
    if (!hub || !hub.isConnected) return;
    var permission = notificationState();
    var msg = hub.querySelector("[data-dar-permission-notifications]");
    var notifyButton = hub.querySelector('[data-dar-setup-action="notifications"]');
    if (msg) msg.textContent = labelForPermission(permission);
    if (notifyButton) {
      notifyButton.textContent = permission === "granted" ? "Erlaubt" :
        permission === "denied" ? "Hilfe anzeigen" :
        permission === "unsupported" ? "Nicht verfügbar" : "Mitteilungen erlauben";
      notifyButton.disabled = permission === "granted" || permission === "unsupported";
    }
    var locLabel = hub.querySelector("[data-dar-permission-location]");
    var savedSettings = readSettings();
    var saved = hasLocation(savedSettings);
    var city = String(savedSettings.city || savedSettings.cityName || savedSettings.locationName || "").trim();
    var suffix = saved ? "Ort gespeichert" + (city ? ": " + city : "") : "Kein Ort gespeichert";
    var geo = "unknown";
    try {
      if (!navigator.geolocation) geo = "unsupported";
      else if (navigator.permissions && navigator.permissions.query) {
        var result = await navigator.permissions.query({ name: "geolocation" });
        geo = result.state || "unknown";
      }
    } catch (e) {}
    if (!hub.isConnected) return;
    if (locLabel) locLabel.textContent = suffix + " · " +
      (geo === "granted" ? "Gerätezugriff erlaubt" :
       geo === "denied" ? "Gerätezugriff verweigert" :
       geo === "prompt" ? "Zugriff noch nicht angefragt" :
       geo === "unsupported" ? "Geräteortung nicht verfügbar" : "Gerätefreigabe nicht überprüfbar");
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

  function manualLocation() {
    /* Manueller Ort bleibt ohne GPS-Zustimmung möglich. */
    go("prayer");
    help("");
  }

  async function openLocation(btn) {
    help("");
    if (!navigator.geolocation) {
      help("Dieses Gerät unterstützt keine Standortbestimmung. Bitte die Stadt manuell auswählen.");
      return;
    }
    setButtonBusy(btn, true);
    try {
      var position = await new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, timeout: 15000, maximumAge: 300000
        });
      });
      var patch = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        locationGranted: true
      };
      if (typeof setPrayerSettings === "function") setPrayerSettings(patch);
      else {
        var latest = Object.assign({}, readSettings(), patch);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(latest));
      }
      help("Standort gespeichert. Die Gebetszeiten verwenden jetzt diesen Ort.");
    } catch (e) {
      help(e && e.code === 1
        ? "Standort verweigert. In den Browser- oder iOS-App-Einstellungen erlauben oder die Stadt manuell auswählen."
        : "Standort konnte nicht ermittelt werden. Bitte erneut versuchen oder die Stadt manuell auswählen.");
    } finally {
      setButtonBusy(btn, false);
      refreshPermissions();
    }
  }

  async function openNotifications(btn) {
    help("");
    var state = notificationState();
    if (state === "denied") {
      help("Mitteilungen wurden verweigert. Bitte die Berechtigung in den Browser- bzw. iOS-Einstellungen ändern.");
      return;
    }
    if (state === "unsupported") {
      help("Mitteilungen sind hier nicht verfügbar. Unter iOS müssen Web-Pushs über die installierte Home-Bildschirm-App verwendet werden.");
      return;
    }
    if (state === "granted") return;
    setButtonBusy(btn, true);
    try {
      if (isNativeIos()) {
        var handlers = window.webkit && window.webkit.messageHandlers;
        if (handlers && handlers.darPushReactivate) {
          handlers.darPushReactivate.postMessage({});
          help("Die iOS-Anfrage wurde geöffnet. Den tatsächlichen Zustand bitte in den iOS-Einstellungen kontrollieren.");
        } else {
          help("Bitte Mitteilungen in Einstellungen → DĀR AL TAWḤĪD aktivieren.");
        }
      } else if (typeof window.requestNotificationPermission === "function") {
        await window.requestNotificationPermission();
      } else if (typeof Notification !== "undefined" && Notification.requestPermission) {
        await Notification.requestPermission();
      } else {
        help("Die Browserberechtigung ist nicht verfügbar.");
      }
    } catch (e) {
      help("Mitteilungen konnten nicht aktiviert werden. Bitte die Browser- oder Systemeinstellungen kontrollieren.");
    } finally {
      setButtonBusy(btn, false);
      refreshPermissions();
    }
  }

  function openReminders() {
    help("");
    /* Bestehende Präferenz-UI wiederverwenden; keine zweite Push-Engine. */
    var settings = document.querySelector(".settings-one-page");
    var target = settings && settings.querySelector(
      ".notification-settings-list, .notification-prayer-grid, .notification-section, #notificationHealthBox"
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    /* Ältere App-Builds bieten diese Optionen noch nur in #notifications. */
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
        openLocation(btn);
        return;
      }
      if (action === "manual-location") {
        manualLocation();
        return;
      }
      if (action === "notifications") {
        openNotifications(btn);
        return;
      }
      if (action === "reminders") {
        openReminders();
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
    link.href = base + "dar-setup-hub.css?v=9";
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
      if (existing.getAttribute("data-dar-permission-hub") !== "v2") {
        existing.outerHTML = renderHtml();
        existing = document.getElementById(ROOT_ID);
      }
      bind(existing);
      refreshPermissions();
      return existing;
    }
    /* Ältere Builds hatten keinen Hub im Markup: einmalig hier ergänzen. */
    page.insertAdjacentHTML("afterbegin", renderHtml());
    var hub = document.getElementById(ROOT_ID);
    bind(hub);
    refreshPermissions();
    return hub;
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
    refresh: onSettingsRoute,
    refreshPermissions: refreshPermissions
  };

  function boot() {
    onSettingsRoute();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.addEventListener("hashchange", function () {
    setTimeout(onSettingsRoute, 60);
  });
  window.addEventListener("pageshow", function () { refreshPermissions(); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshPermissions(); });
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


/* 2026-10-17 · Readability icon: replace the misleading A+dagger artwork
   with a neutral Aa glyph. Navigation and its click handlers stay untouched. */
(function(){
  "use strict";
  var queued=false;
  var observer=null;
  function patchFontRow(row){
    if(!row)return;
    var icon=row.querySelector(".dsh-row-icon");
    if(!icon || icon.querySelector(".dsh-font-clean-icon"))return;
    icon.innerHTML='<span class="dsh-font-clean-icon" aria-hidden="true">Aa</span>';
  }
  function patch(){
    queued=false;
    if(!document.body || !document.body.classList.contains("is-settings-route"))return;
    document.querySelectorAll("#appView .dsh-row").forEach(function(row){
      var title=row.querySelector(".dsh-row-title");
      if(title && /Schrift\s*&\s*Lesbarkeit/i.test(title.textContent||""))patchFontRow(row);
    });
    var detail=document.querySelector('#appView .dsh-detail[data-settings-page="font"] .dsh-detail-intro');
    if(detail)patchFontRow(detail);
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(patch);
  }
  function boot(){
    var host=document.getElementById("appView");
    if(host && !observer){
      observer=new MutationObserver(function(){
        if(document.body && document.body.classList.contains("is-settings-route"))schedule();
      });
      observer.observe(host,{subtree:true,childList:true});
    }
    schedule();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
  window.addEventListener("hashchange",function(){setTimeout(boot,40);});
  document.addEventListener("dar:render",schedule);
  window.addEventListener("pageshow",boot);
})();
