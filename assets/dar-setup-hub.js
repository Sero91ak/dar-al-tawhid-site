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
      if (window.DAR_ANDROID_NATIVE_APP || window.DarNative) return true;
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
      '    <div class="dar-setup-hub__row"><div class="dar-setup-hub__copy"><strong>Widgets & App-Icon</strong><span>Gebetszeiten, Heute & Dhikr sowie Launcher-Icon verwalten</span></div><button type="button" class="dar-setup-hub__btn is-active" data-dar-setup-action="widgets">Öffnen</button></div>',
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
      if (window.DarNative && typeof window.DarNative.prayerSettings === "function") {
        window.DarNative.prayerSettings(JSON.stringify(s));
      }
    } catch (eAndroidWidget) {}
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
    try {
      if (window.DAR_ANDROID_NATIVE_APP || window.DarNative) {
        location.href = "/widgets/?platform=android&native=1";
        return;
      }
      if (window.webkit && window.webkit.messageHandlers) {
        location.href = "/widgets/?platform=apple";
        return;
      }
      location.href = "/widgets/?platform=android";
    } catch (e) {
      go("prayer");
    }
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

  function patchNativePrayerSettingsSync() {
    try {
      if (window.__darAndroidWidgetPrayerPatched) return true;
      if (typeof window.setPrayerSettings !== "function") return false;
      var original = window.setPrayerSettings;
      window.setPrayerSettings = function () {
        var result = original.apply(this, arguments);
        try {
          if (window.DarNative && typeof window.DarNative.prayerSettings === "function") {
            var latest = typeof window.getPrayerSettings === "function"
              ? window.getPrayerSettings()
              : readSettings();
            window.DarNative.prayerSettings(JSON.stringify(latest || {}));
          }
        } catch (e) {}
        return result;
      };
      window.__darAndroidWidgetPrayerPatched = true;
      try {
        if (window.DarNative && typeof window.DarNative.prayerSettings === "function") {
          window.DarNative.prayerSettings(JSON.stringify(readSettings() || {}));
        }
      } catch (e2) {}
      return true;
    } catch (e3) {
      return false;
    }
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
    refresh: onSettingsRoute,
    syncNativePrayerSettings: patchNativePrayerSettingsSync
  };

  function boot() {
    patchNativePrayerSettingsSync();
    onSettingsRoute();
    if (!window.__darAndroidWidgetPrayerPatched) {
      setTimeout(patchNativePrayerSettingsSync, 250);
      setTimeout(patchNativePrayerSettingsSync, 900);
    }
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

/* DAR LOCATION IN-PLACE V2 (2026-10-18): adult settings location detail only.
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
    if (city) city.textContent = (s.city || "Ort wird ermittelt …") + (s.locationMode === "auto" ? " · GPS automatisch" + (s.locationPrecision === "approximate" ? " · ungenau" : "") : " · Stadt manuell");
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
  // Prefer the app's CoreLocation bridge in WKWebView. The browser GPS API
  // remains a fallback for Safari/PWA and for transient native timeouts.
  function requestDevicePosition() {
    var nativeBridge = null;
    try { nativeBridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.darNative; } catch (e) {}
    if (!nativeBridge) {
      return typeof requestBrowserPosition === "function"
        ? requestBrowserPosition() : Promise.reject(new Error("geo_unavailable"));
    }
    return new Promise(function (resolve, reject) {
      var settled = false;
      var started = Date.now();
      var timer = null;
      function cleanup() {
        clearTimeout(timer);
        window.removeEventListener("dar-native-location", onLocation);
        window.removeEventListener("dar-native-location-status", onStatus);
        window.removeEventListener("dar-native-location-error", onError);
      }
      function finish(value, error) {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve(value);
      }
      function onLocation(event) {
        var data = event && event.detail || {};
        var lat = Number(data.lat), lon = Number(data.lng != null ? data.lng : data.lon);
        var accuracy = Number(data.acc), stamp = Number(data.timestamp);
        if (!validCoords(lat, lon) || !Number.isFinite(accuracy) ||
            accuracy < 0 || accuracy > 100000) return;
        // A fresh device request should not silently reuse a stale GPS fix.
        // CoreLocation may legitimately suppress duplicate stationary fixes for 15 minutes.
        var ageLimit = accuracy > 2500 ? 3600000 : 900000;
        if (!Number.isFinite(stamp) || stamp < started - ageLimit || stamp > Date.now() + 60000) return;
        finish({coords:{latitude:lat,longitude:lon,accuracy:accuracy}});
      }
      function onStatus(event) {
        var authorization = event && event.detail && event.detail.authorization;
        if (authorization === "denied" || authorization === "restricted") {
          var denied = new Error("location_denied");
          denied.code = 1;
          finish(null, denied);
        }
      }
      function onError(event) {
        // kCLErrorLocationUnknown is transient: leave CoreLocation time to retry.
        var code = Number(event && event.detail && event.detail.code);
        if (code === 1) {
          var denied = new Error("location_denied");
          denied.code = 1;
          finish(null, denied);
        }
      }
      window.addEventListener("dar-native-location", onLocation);
      window.addEventListener("dar-native-location-status", onStatus);
      window.addEventListener("dar-native-location-error", onError);
      timer = setTimeout(function () {
        var timeout = new Error("native_location_timeout");
        timeout.code = 3;
        finish(null, timeout);
      }, 12000);
      try { nativeBridge.postMessage({type:"location-resume"}); }
      catch (e) { finish(null, e); }
    }).catch(function (error) {
      if (error && error.code === 1) throw error;
      return typeof requestBrowserPosition === "function"
        ? requestBrowserPosition() : Promise.reject(error);
    });
  }
  async function detectLocation() {
    if (gpsBusy) return;
    clearTimeout(locationSearchTimer);
    var button = element("notificationDetectLocationBtn");
    gpsBusy = true;
    var serial = ++requestId;
    if (button) { button.disabled = true; button.textContent = "Standort wird ermittelt …"; }
    feedback("");
    try {
      var pos = await requestDevicePosition();
      // A city selected while GPS was pending is newer than this request.
      if (serial !== requestId) return;
      var lat = Number(pos && pos.coords && pos.coords.latitude);
      var lon = Number(pos && pos.coords && pos.coords.longitude);
      if (!validCoords(lat, lon)) throw new Error("invalid_gps");
      var old = current();
      var closeToOld = validCoords(Number(old.lat), Number(old.lon)) &&
        Math.abs(Number(old.lat)-lat) < .003 && Math.abs(Number(old.lon)-lon) < .003;
      var city = old.locationMode === "auto" && closeToOld && old.city && !/^(Ort wird|Ortsname|Aktueller Standort)/.test(old.city)
        ? old.city : "Ort wird ermittelt …";
      save({lat:lat,lon:lon,city:city,locationMode:"auto",locationGranted:true,locationUpdatedAt:Date.now(),
        locationAccuracy:Number(pos.coords.accuracy),
        locationPrecision:Number(pos.coords.accuracy)>2500?"approximate":"precise"});
      paint();
      if (Number(pos.coords.accuracy) > 2500) feedback("iOS liefert nur einen ungefähren Standort. Für präzisere Gebetszeiten aktiviere „Genauer Standort“ in iOS oder wähle deine Stadt.");
      try { if (typeof darGpsStartWatch === "function") darGpsStartWatch(); } catch (e) {}
      var name = "";
      try { if (typeof window.darResolveLocationCity === "function") name = await window.darResolveLocationCity(lat, lon);
        else if (typeof reversePrayerCity === "function") name = await reversePrayerCity(lat, lon); } catch (e) {}
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
    } else { ++requestId; clearTimeout(locationSearchTimer); }
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

  /* Postal code and city-name lookup:
     - Precise German postal result first for five-digit PLZ.
     - Open-Meteo for automatic suggestions; Nominatim only on explicit search.
     - No OSM autocomplete or unspecific cross-country postal-code results. */
  var locationSearchTimer = null;
  var lookupCache = new Map();
  async function lookupJson(url) {
    var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, 8500);
    try {
      var response = await fetch(url,{cache:"no-store",signal:ctl.signal});
      if(!response.ok) throw Error("lookup_http_" + response.status);
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  function normalizedPlace(city,lat,lon,postcode,region,country) {
    if(!city||!validCoords(Number(lat),Number(lon))) return null;
    var nativeCountry=String(country||"").toUpperCase();
    var name=String(city).trim(),zip=String(postcode||"").trim();
    return {city:name,lat:Number(lat),lon:Number(lon),postcode:zip,
      region:String(region||""),country:nativeCountry,
      label:[name,zip,region,nativeCountry==="DE"?"":nativeCountry].filter(Boolean).join(" · ")};
  }
  function dedupeAndRank(places,q) {
    var numeric=/^\d{5}$/.test(q), seen=new Set();
    return places.filter(Boolean).sort(function(a,b){
      var score=function(p) {
        return (p.country==="DE"?50:0)+(numeric&&p.postcode===q?90:0)+
          (!numeric&&p.city.toLocaleLowerCase("de")===q.toLocaleLowerCase("de")?30:0);
      };
      return score(b)-score(a);
    }).filter(function(p){
      var key=p.city.toLocaleLowerCase("de")+":"+p.lat.toFixed(2)+":"+p.lon.toFixed(2);
      if(seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0,10);
  }
  async function lookupGermanZip(q) {
    var data=await lookupJson("https://api.zippopotam.us/de/"+encodeURIComponent(q));
    return (Array.isArray(data.places)?data.places:[]).map(function(p){
      return normalizedPlace(p["place name"],p.latitude,p.longitude,q,p.state,"DE");
    }).filter(Boolean);
  }
  async function lookupOpenMeteo(q) {
    var url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(q)+"&count=12&language=de&format=json";
    var data=await lookupJson(url);
    return (Array.isArray(data.results)?data.results:[]).map(function(p) {
      var postcode=p.postcode||(Array.isArray(p.postcodes)&&p.postcodes.length===1?p.postcodes[0]:"");
      return normalizedPlace(p.name,p.latitude,p.longitude,postcode,p.admin1||p.admin2,p.country_code||p.country);
    }).filter(Boolean);
  }
  async function lookupNominatimExplicit(q) {
    var zip=/^\d{5}$/.test(q);
    var url="https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&accept-language=de&"+
      (zip?"postalcode="+encodeURIComponent(q)+"&countrycodes=de":"q="+encodeURIComponent(q));
    var data=await lookupJson(url);
    return (Array.isArray(data)?data:[]).map(function(p){
      var a=p.address||{};
      return normalizedPlace(a.city||a.town||a.village||a.municipality||a.hamlet||p.name,
        p.lat,p.lon,a.postcode||(zip?q:""),a.state||a.county,a.country_code);
    }).filter(Boolean);
  }
  async function lookupLocationOptions(q, explicit) {
    q=String(q||"").trim();
    var key=q.toLocaleLowerCase("de")+":"+String(!!explicit);
    var cached=lookupCache.get(key);
    if(cached&&Date.now()-cached.time<480000) return cached.data;
    var zip=/^\d{5}$/.test(q), places=[];
    if(zip) {
      try { places=await lookupGermanZip(q); } catch(e) {}
      if(!places.length) {
        try { places=(await lookupOpenMeteo(q)).filter(function(p){return p.country==="DE"&&(!p.postcode||p.postcode===q);}); }catch(e){}
      }
    } else {
      try { places=await lookupOpenMeteo(q); }catch(e){}
    }
    if(!places.length&&explicit) {
      try { places=await lookupNominatimExplicit(q); }catch(e){}
    }
    places=dedupeAndRank(places,q);
    lookupCache.set(key,{time:Date.now(),data:places});
    return places;
  }

  async function searchCities(explicit) {
    var input = element("darManualCityInput"), button = element("darManualCitySaveBtn");
    if (!input) return;
    var query = String(input.value || "").trim();
    if (query.length < 2) { if(explicit!==false) feedback("Bitte mindestens zwei Zeichen oder eine gültige PLZ eingeben."); return; }
    var serial = ++requestId;
    feedback("");
    if (button) { button.disabled = true; button.textContent = "Suche …"; }
    try {
      var items = await lookupLocationOptions(query,explicit!==false);
      if (serial !== requestId || !input.isConnected || !element("darManualCityPanel") || element("darManualCityPanel").hidden) return;
      showChoices(Array.isArray(items) ? items.filter(function (x) {return validCoords(Number(x.lat), Number(x.lon));}) : []);
      if (items && items.length && explicit!==false) feedback("Bitte die passende Stadt aus der Liste auswählen.");
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
    clearTimeout(locationSearchTimer);
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

  /* Keep the background GPS watch from rebuilding the settings form. */
  try {
    var originalGpsDisplay=window.darGpsUpdateDisplay;
    if(typeof originalGpsDisplay==="function"&&!originalGpsDisplay.__darLocationStable) {
      var stableGpsDisplay=function(){
        if(onLocationPage()){paint();return;}
        return originalGpsDisplay.apply(this,arguments);
      };
      stableGpsDisplay.__darLocationStable=true;
      window.darGpsUpdateDisplay=stableGpsDisplay;
    }
  }catch(e){}

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
    clearTimeout(locationSearchTimer);
    void searchCities(true);
  }, true);
  document.addEventListener("keydown", function (event) {
    if (!onLocationPage() || event.key !== "Enter" || event.isComposing || !event.target || event.target.id !== "darManualCityInput") return;
    stopNativeEvent(event);
    void searchCities();
  }, true);
  document.addEventListener("input", function (event) {
    if (!onLocationPage() || !event.target || event.target.id !== "darManualCityInput") return;
    ++requestId;
    clearTimeout(locationSearchTimer);
    var list = element("darCityResults");
    if (list) { list.hidden = true; list.replaceChildren(); }
    var q = String(event.target.value||"").trim();
    if (q.length>=3 && (!/^\d+$/.test(q) || q.length>=5)) {
      locationSearchTimer=setTimeout(function(){void searchCities(false)},420);
    }
  }, true);
})();


/* StandBy / Live Activities · Besucher-App · 19.10.2026
   Schalter bleibt bewusst deaktiviert, solange die echte native Bridge fehlt.
   Keine Abhängigkeit von OneSignal-/Gebets-Push-Einstellungen. */
(function () {
  "use strict";
  if (window.DarLiveActivitySettings) return;
  var rowId = "dar-live-activity-settings-row";
  var lastStatus = null;
  var waiting = false;
  var nativeHandler = function () {
    try { return window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.darLiveActivitySettings; }
    catch (e) { return null; }
  };
  function send(payload) {
    var handler = nativeHandler();
    if (!handler) return false;
    try { handler.postMessage(payload); return true; } catch (e) { return false; }
  }
  function label(status) {
    if (!nativeHandler()) return "Nur in der aktualisierten iOS-App steuerbar";
    if (!status) return "iOS-Verfügbarkeit wird geprüft";
    if (!status.supported) return "Live Activities sind in diesem App-Build noch nicht eingerichtet";
    if (!status.allowed) return "In den iOS-Einstellungen derzeit nicht erlaubt";
    return status.enabled ? "Auf diesem Gerät eingeschaltet" : "Auf diesem Gerät ausgeschaltet";
  }
  function refreshRow() {
    var row = document.getElementById(rowId);
    if (!row) return;
    var control = row.querySelector("input");
    var caption = row.querySelector(".dar-la-caption");
    var permitted = !!(nativeHandler() && lastStatus && lastStatus.supported && lastStatus.allowed);
    control.checked = !!(lastStatus && lastStatus.enabled && permitted);
    control.disabled = waiting || !permitted;
    control.setAttribute("aria-checked", String(control.checked));
    var message = label(lastStatus);
    if (caption && caption.textContent !== message) caption.textContent = message;
    row.classList.toggle("dar-la-unavailable", !permitted);
    var settingsButton = row.querySelector(".dar-la-system-link");
    if (settingsButton) settingsButton.hidden = !(nativeHandler() && lastStatus && lastStatus.supported && !lastStatus.allowed);
  }
  function mount() {
    var home = document.querySelector("#appView .dsh-shell.dsh-home");
    if (!home) return;
    if (document.getElementById(rowId)) { refreshRow(); return; }
    var rows = Array.prototype.slice.call(home.querySelectorAll(".dsh-list .dsh-row"));
    var anchor = rows.find(function (row) { return /Benachrichtigungen|Mitteilungen/i.test(row.textContent || ""); });
    var list = anchor ? anchor.closest(".dsh-list") : home.querySelector(".dsh-list");
    if (!list) return;
    var row = document.createElement("div");
    row.id = rowId;
    row.className = "dsh-row dar-la-settings-row";
    row.innerHTML =
      '<span class="dsh-row-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="4" width="14" height="16" rx="4"/><path d="M9 8h6M9 12h6M9 16h3"/></svg></span>' +
      '<span class="dsh-row-main"><span class="dsh-row-title">Live Activities</span>' +
      '<span class="dsh-row-sub dar-la-caption" aria-live="polite">iOS-Verfügbarkeit wird geprüft</span>' +
      '<button type="button" class="dar-la-system-link" hidden>iOS-Einstellungen öffnen</button></span>' +
      '<label class="dar-la-switch" aria-label="Live Activities ein- oder ausschalten">' +
      '<input type="checkbox" role="switch" aria-label="Live Activities" disabled>' +
      '<span class="dar-la-track" aria-hidden="true"></span></label>';
    if (anchor && anchor.parentNode === list) anchor.insertAdjacentElement("afterend", row);
    else list.appendChild(row);
    row.querySelector("input").addEventListener("change", function (event) {
      var desired = !!event.currentTarget.checked;
      if (waiting || !lastStatus || !lastStatus.supported || !lastStatus.allowed) {
        refreshRow(); return;
      }
      waiting = true;
      refreshRow();
      if (!send({ action: "set", enabled: desired })) {
        waiting = false;
        refreshRow();
      }
    });
    row.querySelector(".dar-la-system-link").addEventListener("click", function () {
      send({ action: "open-settings" });
    });
    refreshRow();
    if (nativeHandler()) send({ action: "status" });
  }
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; mount(); }, 35);
  }
  window.DarLiveActivitySettings = {
    receive: function (status) {
      if (!status || typeof status !== "object") return;
      waiting = false;
      lastStatus = status;
      refreshRow();
    },
    refresh: function () { if (nativeHandler()) send({ action: "status" }); schedule(); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
  window.addEventListener("hashchange", schedule);
  window.addEventListener("focus", function () { window.DarLiveActivitySettings.refresh(); });
  document.addEventListener("dar:render", schedule);
  var target = document.getElementById("appView") || document.body;
  if (target && window.MutationObserver) {
    new MutationObserver(schedule).observe(target, { childList: true, subtree: true });
  }
})();


/* DĀR AL TAWḤĪD · iOS GPS continuity V2 · 2026-10-22
   The native position is authoritative; place-name lookup is a separate,
   retryable operation. Manual city selection always wins. No background opt-in. */
(function(){
  "use strict";
  if(window.__darLocationContinuityV2)return;
  window.__darLocationContinuityV2=true;
  var lastApplied=0, lastGeocodeAttempt=0, geocodeSerial=0, retryTimer=0, resolving=false;
  var lastAcceptedStamp=0, lastGpsEventAt=0, lastWebAttempt=0, browserBusy=false, bridgeFallbackTimer=0;
  var cacheKey="darLocationResolvedCityV2";
  function current(){try{return typeof getPrayerSettings==="function"?(getPrayerSettings()||{}):{};}catch(e){return {};}}
  function valid(lat,lon,acc){
    return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180&&
      Number.isFinite(acc)&&acc>=0&&acc<=100000;
  }
  function distance(a,b,c,d){
    var p=Math.PI/180, x=(c-a)*p, y=(d-b)*p*Math.cos((a+c)*p/2);
    return 6371000*Math.sqrt(x*x+y*y);
  }
  function unresolved(city){
    return !city||/^(Ort wird|Ortsname|Aktueller Standort|Standort erkannt|GPS erkannt)/i.test(String(city).trim());
  }
  function cachedCity(lat,lon){
    try{
      var item=JSON.parse(localStorage.getItem(cacheKey)||"null");
      if(item&&!unresolved(item.city)&&Number.isFinite(item.lat)&&Number.isFinite(item.lon)&&
        Date.now()-item.time<30*86400000&&distance(lat,lon,item.lat,item.lon)<1500)return item.city;
    }catch(e){}
    return "";
  }
  function cacheCity(name,lat,lon){
    try{localStorage.setItem(cacheKey,JSON.stringify({city:name,lat:lat,lon:lon,time:Date.now()}));}catch(e){}
  }
  function withTimeout(value,ms){
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){reject(new Error("geocode_timeout"));},ms);
      Promise.resolve(value).then(function(x){clearTimeout(timer);resolve(x);},
        function(e){clearTimeout(timer);reject(e);});
    });
  }
  async function jsonLookup(url){
    var ctrl=typeof AbortController==="function"?new AbortController():null;
    var timer=ctrl?setTimeout(function(){ctrl.abort();},6500):null;
    try{
      var response=await fetch(url,ctrl?{cache:"no-store",signal:ctrl.signal}:{cache:"no-store"});
      if(!response.ok)throw new Error("geocode_http_"+response.status);
      return await response.json();
    }finally{if(timer)clearTimeout(timer);}
  }
  async function resolveCity(lat,lon){
    var name="";
    try{
      if(typeof reversePrayerCity==="function")
        name=await withTimeout(reversePrayerCity(lat,lon),6500);
    }catch(e){}
    if(typeof name==="string"&&name.trim()&&!unresolved(name))return name.trim();
    // Existing public-site fallback provider; only used if primary lookup fails.
    try{
      var url="https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+
        encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lon)+"&localityLanguage=de";
      var data=await jsonLookup(url);
      name=String(data.city||data.locality||"").trim();
      if(name&&!unresolved(name))return name;
    }catch(e){}
    try{
      var osm="https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+
        encodeURIComponent(lat)+"&lon="+encodeURIComponent(lon)+"&zoom=10&addressdetails=1&accept-language=de";
      var result=await jsonLookup(osm), a=result.address||{};
      name=String(a.city||a.town||a.village||a.municipality||a.hamlet||"").trim();
      if(name&&!unresolved(name))return name;
    }catch(e){}
    return "";
  }
  window.darResolveLocationCity=resolveCity;
  function notifyPrayer(s){
    try{if(typeof updateHeaderPrayerStatus==="function")updateHeaderPrayerStatus();}catch(e){}
    try{if(typeof updatePrayerCountdowns==="function")updatePrayerCountdowns();}catch(e){}
    try{window.dispatchEvent(new CustomEvent("dar:location-updated",{detail:{mode:"auto",city:s.city,source:"native"}}));}catch(e){}
    var el=document.getElementById("darPermissionCityText");
    if(el)el.textContent=(s.city||"GPS erkannt · Ortsname wird gesucht")+" · GPS automatisch"+(s.locationPrecision==="approximate"?" · ungenau":"");
  }
  async function updatePosition(data){
    // Reject incomplete native payloads: Number(null) is 0 and could otherwise
    // silently move prayer times to coordinates 0,0.
    if(!data||typeof data!=="object"||data.lat==null||
       (data.lng==null&&data.lon==null)||data.acc==null||data.timestamp==null)return;
    var lat=Number(data.lat),lon=Number(data.lng!=null?data.lng:data.lon);
    var acc=Number(data.acc), t=Number(data.timestamp);
    if(!valid(lat,lon,acc)||!Number.isFinite(t)||t<=0)return;
    if(t>Date.now()+60000||Date.now()-t>(acc>2500?3600000:600000))return;
    // A cached native fix may arrive before a new fix: ignore reversed GPS callbacks.
    if(t&&lastAcceptedStamp&&t+2000<lastAcceptedStamp)return;
    // Replayed cached fixes are useful for display, but do not prove that
    // the fresh-on-resume request succeeded. Allow the web GPS fallback.
    var gpsAge=Date.now()-t;
    if(gpsAge>=-2000&&gpsAge<=30000)lastGpsEventAt=Date.now();
    var s=current();
    // An explicit manually selected city is never replaced by CoreLocation.
    if(s.locationMode==="manual"&&(s.locationGranted===true||Number(s.locationUpdatedAt)>0))return;
    if(typeof setPrayerSettings!=="function"){
      if(!retryTimer)retryTimer=setTimeout(function(){retryTimer=0;void updatePosition(data);},500);
      return;
    }
    var hasOld=s.lat!=null&&s.lon!=null&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon));
    var meters=hasOld?distance(Number(s.lat),Number(s.lon),lat,lon):Infinity;
    var age=Date.now()-Number(s.locationUpdatedAt||0);
    var missingName=unresolved(s.city);
    // A recent coordinate fix MUST NOT suppress a missing-city retry.
    if(meters<700&&age<30*60000&&!missingName&&s.locationMode==="auto"){
      if(t)lastAcceptedStamp=Math.max(lastAcceptedStamp,t);
      return;
    }
    var precision=acc<=2500?"precise":"approximate";
    var shouldWrite=!hasOld||meters>=700||s.locationMode!=="auto"||s.locationGranted!==true||s.locationPrecision!==precision;
    // Throttle duplicate writes, never a real location change after cached replay.
    if(shouldWrite&&(Date.now()-lastApplied>=10000||!hasOld||s.locationMode!=="auto"||meters>=700)){
      if(t)lastAcceptedStamp=Math.max(lastAcceptedStamp,t);
      lastApplied=Date.now();
      var city=meters<1500&&!missingName?s.city:cachedCity(lat,lon)||"GPS erkannt · Ortsname wird gesucht";
      try{
        setPrayerSettings({lat:lat,lon:lon,city:city,locationMode:"auto",
          locationGranted:true,locationUpdatedAt:Date.now(),
          locationAccuracy:acc,locationPrecision:precision});
      }catch(e){return;}
      notifyPrayer(current());
    }
    // City reverse-geocoding does not alter coordinates or require a new GPS fix.
    // Limit retries so returning to the foreground does not hammer providers.
    var latest=current();
    if(latest.locationMode==="manual")return;
    var needsName=unresolved(latest.city)||meters>=700;
    if(!needsName||resolving||Date.now()-lastGeocodeAttempt<60000)return;
    lastGeocodeAttempt=Date.now();
    resolving=true;
    var serial=++geocodeSerial;
    try{
      var name=await resolveCity(lat,lon);
      if(serial!==geocodeSerial)return;
      var fresh=current();
      if(fresh.locationMode!=="auto"||
        Math.abs(Number(fresh.lat)-lat)>.003||Math.abs(Number(fresh.lon)-lon)>.003)return;
      if(name){
        cacheCity(name,lat,lon);
        if(fresh.city!==name){
          setPrayerSettings({city:name});
          notifyPrayer(current());
        }
      }else if(unresolved(fresh.city)&&fresh.city!=="GPS erkannt · Ortsname derzeit nicht verfügbar"){
        setPrayerSettings({city:"GPS erkannt · Ortsname derzeit nicht verfügbar"});
        notifyPrayer(current());
      }
    }catch(e){
      // Keep the GPS coordinates, last valid city and prayer settings.
    }finally{resolving=false;}
  }
  function nativeHandler(){
    try{return window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darNative;}
    catch(e){return null;}
  }
  // Safari, Android and foldable PWA need a browser request on foreground too.
  function requestWebFix(){
    var s=current();
    if(s.locationMode==="manual"||browserBusy||Date.now()-lastWebAttempt<20000)return;
    if(typeof navigator==="undefined"||!navigator.geolocation||
      typeof navigator.geolocation.getCurrentPosition!=="function")return;
    lastWebAttempt=Date.now();
    browserBusy=true;
    var attemptedLowAccuracy=false;
    function success(position){
      browserBusy=false;
      var coords=position&&position.coords;
      if(!coords)return;
      var stamp=Number(position.timestamp);
      if(!Number.isFinite(stamp)||stamp<=0)stamp=Date.now();
      void updatePosition({lat:coords.latitude,lng:coords.longitude,
        acc:coords.accuracy,timestamp:stamp});
    }
    function failure(error){
      if(!attemptedLowAccuracy&&error&&error.code===3){
        attemptedLowAccuracy=true;
        try{navigator.geolocation.getCurrentPosition(success,function(){browserBusy=false;},
          {enableHighAccuracy:false,timeout:8500,maximumAge:60000});return;}catch(e){}
      }
      browserBusy=false;
    }
    try{navigator.geolocation.getCurrentPosition(success,failure,
      {enableHighAccuracy:true,timeout:10500,maximumAge:60000});}
    catch(e){browserBusy=false;}
  }
  function requestFresh(){
    var s=current(),handler=nativeHandler();
    if(s.locationMode==="manual")return;
    if(bridgeFallbackTimer){clearTimeout(bridgeFallbackTimer);bridgeFallbackTimer=0;}
    if(!handler){requestWebFix();return;}
    try{handler.postMessage({type:"location-resume"});}
    catch(e){requestWebFix();return;}
    // Older iOS binaries may not deliver a usable native fix; recover via WKWebView GPS.
    bridgeFallbackTimer=setTimeout(function(){
      bridgeFallbackTimer=0;
      if(current().locationMode!=="manual"&&Date.now()-lastGpsEventAt>7500)
        requestWebFix();
    },8000);
  }
  window.addEventListener("dar-native-location",function(ev){void updatePosition(ev.detail);});
  window.addEventListener("dar-native-location-status",function(ev){
    var status=ev.detail||{},s=current();
    if(s.locationMode==="manual"||!unresolved(s.city))return;
    if(status.authorization==="denied"||status.authorization==="restricted"){
      var el=document.getElementById("darPermissionCityText");
      if(el)el.textContent="Standortfreigabe in iOS gesperrt · Stadt auswählen";
    }
  });
  window.addEventListener("pageshow",requestFresh);
  window.addEventListener("focus",requestFresh);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)requestFresh();});
  // A native fix can arrive before this script attaches its listener.
  var bootFix=window.DAR_NATIVE_LOCATION||window.__darNativeLocation;
  if(bootFix)void updatePosition(bootFix);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",requestFresh,{once:true});
  else requestFresh();
})();


/* Opt-in control for iOS significant-location updates; no silent Always request.
   Uses the existing location detail, theme colors and native bridge. */
(function(){
  "use strict";
  if(window.__darIosBackgroundLocationUIV1)return;
  window.__darIosBackgroundLocationUIV1=true;
  var status=null,queued=false;
  function handler(){
    try{return window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darNative;}
    catch(e){return null;}
  }
  function send(type){var h=handler();if(h)try{h.postMessage({type:type});}catch(e){}}
  function settings(){
    try{return typeof getPrayerSettings==="function"?(getPrayerSettings()||{}):{};}catch(e){return {};}
  }
  function mount(){
    queued=false;
    var parent=document.querySelector('#appView .dsh-detail[data-settings-page="location"] .dar-permission-location');
    if(!parent||!handler())return;
    var row=parent.querySelector(".dar-location-native-background");
    var auto=settings().locationMode==="auto";
    if(!auto){if(row)row.remove();return;}
    if(!row){
      row=document.createElement("div");
      row.className="dar-location-native-background";
      row.style.cssText="padding:14px 2px 3px;margin-top:15px;border-top:1px solid var(--dsh-line,currentColor)";
      row.innerHTML='<strong style="display:block;font-size:14px;color:var(--dsh-ink,inherit)">Standortwechsel im Hintergrund</strong>'+
        '<p class="dar-location-native-caption" style="margin:5px 0 9px;font-size:12px;line-height:1.5;color:var(--dsh-muted,inherit)"></p>'+
        '<button type="button" class="dar-location-native-action" style="font:600 13px inherit;border:1px solid var(--dsh-line,#888);border-radius:12px;padding:10px 12px;background:var(--dsh-surface,transparent);color:var(--dsh-accent,inherit);cursor:pointer"></button>';
      parent.appendChild(row);
      row.querySelector("button").addEventListener("click",function(){
        if(status&&status.backgroundOptIn&&status.authorization==="always")send("location-background-off");
        else if(status&&(status.authorization==="denied"||status.authorization==="restricted"))send("location-open-settings");
        else send("location-background");
      });
    }
    var caption=row.querySelector(".dar-location-native-caption");
    var button=row.querySelector(".dar-location-native-action");
    var active=!!(status&&status.authorization==="always"&&status.backgroundOptIn);
    caption.textContent=active?
      "Aktiv. iOS meldet größere Ortswechsel energiesparend; Gebetszeiten werden bei der nächsten möglichen Ausführung aktualisiert.":
      "Optional: Mit „Immer erlauben“ kann iOS größere Standortwechsel auch außerhalb der geöffneten App melden. Manuelle Städte bleiben unberührt.";
    button.textContent=active?"Hintergrundaktualisierung ausschalten":
      status&&(status.authorization==="denied"||status.authorization==="restricted")
      ?"Standortfreigabe in iOS öffnen":"Hintergrundaktualisierung erlauben";
    button.setAttribute("aria-pressed",String(active));
  }
  function schedule(){
    if(queued)return;queued=true;setTimeout(mount,70);
  }
  window.addEventListener("dar-native-location-status",function(ev){status=ev.detail||null;schedule();});
  window.addEventListener("hashchange",schedule);
  document.addEventListener("dar:render",schedule);
  document.addEventListener("dar:location-updated",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  var app=document.getElementById("appView");
  if(app&&window.MutationObserver)new MutationObserver(schedule).observe(app,{subtree:true,childList:true});
})();
