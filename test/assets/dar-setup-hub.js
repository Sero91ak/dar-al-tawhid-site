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
