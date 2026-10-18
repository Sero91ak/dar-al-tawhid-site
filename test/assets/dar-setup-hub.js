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


/* DAR LOCATION IN-PLACE V1 (2026-10-18): adult settings location detail only.
   Capture existing controls before full-render handlers. Never reload, navigate,
   replace #appView, or change Push, service worker, prayer calculation or other pages. */
(function () {
  "use strict";
  if (window.__darLocationInPlaceV1) return;
  window.__darLocationInPlaceV1 = true;
  var requestId = 0;
  var gpsBusy = false;
  var choices = [];

  function element(id) { return document.getElementById(id); }
  function onLocationPage() {
    return !!document.querySelector('#appView .dsh-detail[data-settings-page="location"] .dar-permission-location');
  }
  function current() {
    try { return typeof getPrayerSettings === "function" ? getPrayerSettings() || {} : {}; }
    catch (e) { return {}; }
  }
  function save(value) {
    if (typeof setPrayerSettings !== "function") throw new Error("prayer_settings_unavailable");
    setPrayerSettings(value);
    return current();
  }
  function feedback(text) {
    var el = element("darLocationFeedback");
    if (!el) return;
    el.textContent = text || "";
    el.hidden = !text;
  }
  function paint(s) {
    s = s || current();
    var city = element("darPermissionCityText");
    if (city) city.textContent = (s.city || "Ort wird ermittelt …") + (s.locationMode === "auto" ? " · GPS automatisch" : " · Stadt manuell");
    try { if (typeof updateHeaderPrayerStatus === "function") updateHeaderPrayerStatus(); } catch (e) {}
    try { if (typeof updatePrayerCountdowns === "function") updatePrayerCountdowns(); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("dar:location-updated", {detail:{mode:s.locationMode,city:s.city}})); } catch (e) {}
  }
  function validCoords(lat, lon) {
    return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
  function stopNativeEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  async function detectLocation() {
    if (gpsBusy) return;
    var button = element("notificationDetectLocationBtn");
    gpsBusy = true;
    var serial = ++requestId;
    if (button) { button.disabled = true; button.textContent = "Standort wird ermittelt …"; }
    feedback("");
    try {
      if (typeof requestBrowserPosition !== "function") throw new Error("geo_unavailable");
      var pos = await requestBrowserPosition();
      var lat = Number(pos && pos.coords && pos.coords.latitude);
      var lon = Number(pos && pos.coords && pos.coords.longitude);
      if (!validCoords(lat, lon)) throw new Error("invalid_gps");
      var old = current();
      var closeToOld = validCoords(Number(old.lat), Number(old.lon)) &&
        Math.abs(Number(old.lat)-lat) < .003 && Math.abs(Number(old.lon)-lon) < .003;
      var city = old.locationMode === "auto" && closeToOld && old.city && !/^(Ort wird|Ortsname|Aktueller Standort)/.test(old.city)
        ? old.city : "Ort wird ermittelt …";
      save({lat:lat,lon:lon,city:city,locationMode:"auto",locationGranted:true,locationUpdatedAt:Date.now()});
      paint();
      try { if (typeof darGpsStartWatch === "function") darGpsStartWatch(); } catch (e) {}
      var name = "";
      try { if (typeof reversePrayerCity === "function") name = await reversePrayerCity(lat, lon); } catch (e) {}
      if (serial !== requestId || current().locationMode !== "auto") return;
      var now = current();
      if (!validCoords(Number(now.lat),Number(now.lon)) || Math.abs(Number(now.lat)-lat) > .003 || Math.abs(Number(now.lon)-lon) > .003) return;
      if (name && typeof name === "string" && name.trim()) {
        if (now.city !== name.trim()) save({city:name.trim()});
        paint();
      } else if (now.city === "Ort wird ermittelt …") {
        save({city:"Ortsname derzeit nicht verfügbar"});
        paint();
        feedback("GPS erkannt. Ortsname derzeit nicht verfügbar – bitte später erneut versuchen.");
      }
    } catch (err) {
      var code = Number(err && err.code);
      feedback(code === 1 ? "Standortzugriff nicht erlaubt. Bitte Standortfreigabe prüfen oder eine Stadt wählen." :
        code === 3 ? "Standortbestimmung dauert zu lange. Bitte erneut versuchen." :
        "Standort konnte nicht ermittelt werden. Bitte GPS prüfen oder eine Stadt wählen.");
    } finally {
      gpsBusy = false;
      var latest = element("notificationDetectLocationBtn");
      if (latest) { latest.disabled = false; latest.textContent = "Standort erkennen"; }
    }
  }
  function toggleManual() {
    var panel = element("darManualCityPanel"), button = element("notificationManualCityToggle");
    if (!panel || !button) return;
    var open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) {
      var input = element("darManualCityInput");
      if (input) { input.removeAttribute("readonly"); input.focus({preventScroll:true}); }
    } else { ++requestId; }
  }
  function showChoices(items) {
    var root = element("darCityResults");
    if (!root) return;
    choices = items;
    root.replaceChildren();
    root.hidden = false;
    if (!items.length) { root.textContent = "Kein passender Ort gefunden. Bitte Stadt oder PLZ genauer eingeben."; return; }
    items.forEach(function (item, i) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "dar-city-search-result";
      button.dataset.darCityIndex = String(i);
      button.textContent = item.label || [item.city,item.postcode,item.region].filter(Boolean).join(" · ");
      root.appendChild(button);
    });
  }
  async function searchCities() {
    var input = element("darManualCityInput"), button = element("darManualCitySaveBtn");
    if (!input) return;
    var query = String(input.value || "").trim();
    if (query.length < 2) { feedback("Bitte mindestens zwei Zeichen oder eine gültige PLZ eingeben."); return; }
    var serial = ++requestId;
    feedback("");
    if (button) { button.disabled = true; button.textContent = "Suche …"; }
    try {
      if (typeof searchPrayerCities !== "function") throw new Error("city_lookup_unavailable");
      var items = await searchPrayerCities(query);
      if (serial !== requestId || !input.isConnected || !element("darManualCityPanel") || element("darManualCityPanel").hidden) return;
      showChoices(Array.isArray(items) ? items.filter(function (x) {return validCoords(Number(x.lat), Number(x.lon));}) : []);
      if (items && items.length) feedback("Bitte die passende Stadt aus der Liste auswählen.");
    } catch (e) {
      if (serial === requestId) feedback("Stadtsuche momentan nicht erreichbar. Bitte erneut suchen.");
    } finally {
      var latest = element("darManualCitySaveBtn");
      if (latest) { latest.disabled = false; latest.textContent = "Suchen"; }
    }
  }
  function chooseCity(index) {
    var item = choices[index];
    if (!item || !validCoords(Number(item.lat),Number(item.lon))) return;
    ++requestId;
    try {
      if (typeof darGpsStopWatch === "function") darGpsStopWatch();
      var updated = save({city:String(item.city),lat:Number(item.lat),lon:Number(item.lon),locationMode:"manual",locationGranted:true,locationUpdatedAt:Date.now()});
      paint(updated);
      feedback("Standort gespeichert: " + item.city);
      var panel = element("darManualCityPanel"), toggle = element("notificationManualCityToggle");
      if (panel) panel.hidden = true;
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      choices = [];
    } catch (e) { feedback("Stadt konnte nicht gespeichert werden. Bitte erneut versuchen."); }
  }
  document.addEventListener("click", function (event) {
    if (!onLocationPage() || !event.target || !event.target.closest) return;
    var opt = event.target.closest("#darCityResults [data-dar-city-index]");
    if (opt) { stopNativeEvent(event); chooseCity(Number(opt.dataset.darCityIndex)); return; }
    var gps = event.target.closest("#notificationDetectLocationBtn");
    if (gps) { stopNativeEvent(event); void detectLocation(); return; }
    var manual = event.target.closest("#notificationManualCityToggle");
    if (manual) { stopNativeEvent(event); toggleManual(); }
  }, true);
  document.addEventListener("submit", function (event) {
    if (!onLocationPage() || !event.target || event.target.id !== "darManualCityPanel") return;
    stopNativeEvent(event);
    void searchCities();
  }, true);
  document.addEventListener("keydown", function (event) {
    if (!onLocationPage() || event.key !== "Enter" || event.isComposing || !event.target || event.target.id !== "darManualCityInput") return;
    stopNativeEvent(event);
    void searchCities();
  }, true);
  document.addEventListener("input", function (event) {
    if (!onLocationPage() || !event.target || event.target.id !== "darManualCityInput") return;
    ++requestId;
    var list = element("darCityResults");
    if (list) { list.hidden = true; list.replaceChildren(); }
  }, true);
})();
