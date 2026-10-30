(function (root) {
  "use strict";

  var KAABA_LAT = 21.4225;
  var KAABA_LON = 39.8262;
  var LISTENER_FLAG = "__darQiblaQvListenerCount";

  function toRad(d) { return (Number(d) || 0) * Math.PI / 180; }
  function toDeg(r) { return (Number(r) || 0) * 180 / Math.PI; }
  function normalizeAngle(deg) {
    var n = Number(deg);
    if (!Number.isFinite(n)) return 0;
    n = n % 360;
    if (n < 0) n += 360;
    return n;
  }
  function shortestDelta(from, to) {
    var a = normalizeAngle(from);
    var b = normalizeAngle(to);
    var d = b - a;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }
  function qiblaBearing(lat, lon) {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
    var φ1 = toRad(lat), φ2 = toRad(KAABA_LAT);
    var λ1 = toRad(lon), λ2 = toRad(KAABA_LON);
    var dλ = λ2 - λ1;
    var y = Math.sin(dλ) * Math.cos(φ2);
    var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
    return normalizeAngle(toDeg(Math.atan2(y, x)));
  }
  function signedOffset(bearing, heading) {
    return shortestDelta(heading, bearing);
  }

  var QiblaCalculator = {
    KAABA_LAT: KAABA_LAT,
    KAABA_LON: KAABA_LON,
    normalizeAngle: normalizeAngle,
    shortestDelta: shortestDelta,
    qiblaBearing: qiblaBearing,
    signedOffset: signedOffset
  };

  function LowPassHeading() {
    this.value = null;
  }
  LowPassHeading.prototype.push = function (raw, alpha) {
    var a = alpha == null ? 0.18 : alpha;
    var n = normalizeAngle(raw);
    if (this.value == null) {
      this.value = n;
      return n;
    }
    this.value = normalizeAngle(this.value + shortestDelta(this.value, n) * a);
    return this.value;
  };
  LowPassHeading.prototype.reset = function () { this.value = null; };

  function HeadingProvider() {
    this._on = null;
    this._listening = false;
    this._filter = new LowPassHeading();
    this._handler = this._onEvent.bind(this);
    this._samples = [];
    this._nativeTimer = null;
    this._nativeActive = false;
    this.needsPermission = typeof window !== "undefined" &&
      window.DeviceOrientationEvent &&
      typeof window.DeviceOrientationEvent.requestPermission === "function";
    this.permission = this.needsPermission ? "prompt" : "granted";
    this.unreliable = false;
  }
  HeadingProvider.prototype._screenAngle = function () {
    try {
      if (screen.orientation && typeof screen.orientation.angle === "number") {
        return normalizeAngle(screen.orientation.angle);
      }
    } catch (e) {}
    if (typeof window.orientation === "number") return normalizeAngle(window.orientation);
    return 0;
  };
  HeadingProvider.prototype._rawHeading = function (event) {
    if (!event) return null;
    if (typeof event.webkitCompassHeading === "number" && !Number.isNaN(event.webkitCompassHeading)) {
      return normalizeAngle(event.webkitCompassHeading);
    }
    // Relative alpha has no magnetic-north reference and must never show
    // a false Qibla alignment. Use only absolute orientation as fallback.
    if (event.absolute === true && typeof event.alpha === "number" && Number.isFinite(event.alpha)) {
      return normalizeAngle(360 - event.alpha + this._screenAngle());
    }
    return null;
  };
  HeadingProvider.prototype._onEvent = function (event) {
    if (this._nativeActive) return; // Prefer CoreLocation true heading when available.
    var raw = this._rawHeading(event);
    if (raw == null) return;
    var acc = event.webkitCompassAccuracy;
    var badAcc = typeof acc === "number" && acc > 25;
    this._samples.push(raw);
    if (this._samples.length > 24) this._samples.shift();
    var jump = 0;
    if (this._samples.length > 6) {
      var i, d;
      for (i = 1; i < this._samples.length; i++) {
        d = Math.abs(shortestDelta(this._samples[i - 1], this._samples[i]));
        if (d > 50) jump++;
      }
    }
    this.unreliable = badAcc || jump > 10;
    var smooth = this._filter.push(raw, this.unreliable ? 0.08 : 0.2);
    if (this._on) this._on(smooth, raw, this.unreliable);
  };
  HeadingProvider.prototype._nativeBridge = function () {
    try {
      return root.webkit && root.webkit.messageHandlers && root.webkit.messageHandlers.darNative;
    } catch (e) { return null; }
  };
  HeadingProvider.prototype._readNative = function () {
    var raw = root.DAR_NATIVE_HEADING;
    if (raw === null || raw === undefined || raw === "" || !Number.isFinite(Number(raw))) return;
    // The iOS bridge supplies CoreLocation heading for the device's portrait top.
    var heading = normalizeAngle(Number(raw) + this._screenAngle());
    this._nativeActive = true;
    this.unreliable = false;
    var smooth = this._filter.push(heading, 0.23);
    if (this._on) this._on(smooth, heading, false);
  };
  HeadingProvider.prototype.requestPermission = async function () {
    if (!this.needsPermission) {
      this.permission = "granted";
      return "granted";
    }
    try {
      var res = await window.DeviceOrientationEvent.requestPermission();
      this.permission = res === "granted" ? "granted" : "denied";
      return this.permission;
    } catch (e) {
      this.permission = "denied";
      return "denied";
    }
  };
  HeadingProvider.prototype.start = function (onHeading) {
    this._on = onHeading;
    if (this._listening) return;
    this._filter.reset();
    this._samples = [];
    this._nativeActive = false;
    var nativeBridge = this._nativeBridge();
    if (nativeBridge) {
      try {
        root.DAR_NATIVE_HEADING = null; // Do not reuse heading from a previous session.
        nativeBridge.postMessage({ type: "qibla-compass" });
        var self = this;
        this._nativeTimer = window.setInterval(function () { self._readNative(); }, 220);
      } catch (e) { this._nativeTimer = null; }
    }
    window.addEventListener("deviceorientation", this._handler, true);
    window.addEventListener("deviceorientationabsolute", this._handler, true);
    this._listening = true;
    root[LISTENER_FLAG] = (root[LISTENER_FLAG] || 0) + 1;
  };
  HeadingProvider.prototype.stop = function () {
    if (!this._listening) return;
    if (this._nativeTimer != null) {
      window.clearInterval(this._nativeTimer);
      this._nativeTimer = null;
    }
    if (this._nativeBridge()) {
      try { this._nativeBridge().postMessage({ type: "qibla-stop" }); } catch (e) {}
    }
    this._nativeActive = false;
    window.removeEventListener("deviceorientation", this._handler, true);
    window.removeEventListener("deviceorientationabsolute", this._handler, true);
    this._listening = false;
    this._on = null;
    this._filter.reset();
    root[LISTENER_FLAG] = Math.max(0, (root[LISTENER_FLAG] || 1) - 1);
  };

  function validCoordinate(value, limit) {
    return value !== null && value !== undefined && value !== "" &&
      Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit;
  }
  function nativeLocation() {
    var n = root.DAR_NATIVE_LOCATION || root.__darNativeLocation;
    if (!n) return null;
    var rawLat = n.latitude ?? n.lat;
    var rawLon = n.longitude ?? n.lon ?? n.lng;
    if (!validCoordinate(rawLat, 90) || !validCoordinate(rawLon, 180)) return null;
    // Native timestamps are milliseconds. Ignore location data older than 10 minutes.
    var timestamp = Number(n.timestamp);
    if (Number.isFinite(timestamp) && timestamp > 0 &&
        (timestamp > Date.now() + 60000 || Date.now() - timestamp > 600000)) return null;
    return { lat: Number(rawLat), lon: Number(rawLon), city: n.city || "",
      stale: false, source: "native" };
  }
  function savedPrayerLocation() {
    try {
      if (typeof root.getPrayerSettings !== "function") return null;
      var s = root.getPrayerSettings();
      if (!s) return null;
      var lat = s.lat ?? s.latitude;
      var lon = s.lon ?? s.longitude ?? s.lng;
      if (!validCoordinate(lat, 90) || !validCoordinate(lon, 180)) return null;
      return { lat: Number(lat), lon: Number(lon), city: s.city || "",
        stale: true, source: "prayer", manual: s.locationMode === "manual" };
    } catch (e) { return null; }
  }
  function LocationProvider() { this._watchId = null; }
  LocationProvider.prototype.cached = function () {
    var saved = savedPrayerLocation();
    // Never silently override an explicitly selected city with the phone GPS.
    if (saved && saved.manual) return saved;
    return nativeLocation() || saved;
  };
  LocationProvider.prototype.refresh = function (highAccuracy) {
    var saved = savedPrayerLocation();
    if (saved && saved.manual && !highAccuracy) return Promise.resolve(saved);
    var nativeFix = nativeLocation();
    if (nativeFix) return Promise.resolve(nativeFix);
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) { reject(new Error("no-geo")); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos && pos.coords && pos.coords.latitude;
        var lon = pos && pos.coords && pos.coords.longitude;
        if (!validCoordinate(lat, 90) || !validCoordinate(lon, 180)) {
          reject(new Error("invalid-geo"));
          return;
        }
        resolve({lat: Number(lat), lon: Number(lon), city: "", stale: false,
          source: "geo", accuracy: pos.coords.accuracy});
      }, reject, {enableHighAccuracy: !!highAccuracy,
        timeout: highAccuracy ? 8000 : 5000,
        maximumAge: highAccuracy ? 30000 : 30 * 60 * 1000});
    });
  };
  LocationProvider.prototype.stop = function () {
    if (this._watchId != null && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(this._watchId); } catch (e) {}
    }
    this._watchId = null;
  };

  function QiblaPermissionManager() {}
  QiblaPermissionManager.prototype.openSettings = function () {
    try {
      var wk = root.webkit && root.webkit.messageHandlers;
      if (wk && wk.darOpenSystemSettings) {
        wk.darOpenSystemSettings.postMessage({ kind: "location" });
        return;
      }
    } catch (e) {}
    try {
      if (root.DAR_IOS_NATIVE_APP || /DarAlTawhid-iOS/i.test(String(navigator.userAgent || ""))) {
        location.href = "app-settings:";
        return;
      }
    } catch (e2) {}
  };

  var engine = {
    heading: new HeadingProvider(),
    location: new LocationProvider(),
    permissions: new QiblaPermissionManager(),
    calc: QiblaCalculator,
    loc: null,
    bearing: null,
    headingDeg: null,
    offset: null,
    started: false
  };

  var ui = {
    root: null,
    raf: 0,
    pending: false,
    alignedOnce: false,
    visBound: false,
    nativeLocBound: false,
    swipeY: null,
    cityMatches: [],
    cityRequest: 0
  };

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function hapticOnce() {
    try {
      if (typeof root.triggerLightHapticFeedback === "function") root.triggerLightHapticFeedback();
    } catch (e) {}
  }

  function persistLoc(loc) {
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lon) ||
        loc.source === "prayer" || loc.source === "native") return;
    // Native GPS synchronization is owned by dar-setup-hub; do not double-sync
    // or overwrite a location manually selected by the visitor.
    try {
      if (typeof root.getPrayerSettings !== "function" ||
          typeof root.setPrayerSettings !== "function") return;
      var current = root.getPrayerSettings() || {};
      if (current.locationMode === "manual") return;
      var lat = Number(current.lat), lon = Number(current.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon) &&
          Math.abs(lat - loc.lat) < 0.005 && Math.abs(lon - loc.lon) < 0.005) return;
      var patch = { lat: loc.lat, lon: loc.lon, locationMode: "auto",
        locationGranted: true, locationUpdatedAt: Date.now() };
      if (loc.city) patch.city = loc.city;
      root.setPrayerSettings(patch);
    } catch (e) {}
  }

  function fillCity(loc) {
    if (!loc || loc.city) return Promise.resolve(loc);
    if (typeof root.reversePrayerCity !== "function") return Promise.resolve(loc);
    return root.reversePrayerCity(loc.lat, loc.lon).then(function (city) {
      loc.city = city;
      persistLoc(loc);
      return loc;
    }).catch(function () { return loc; });
  }

  function ensureDom() {
    var el = document.getElementById("qiblaQuickView");
    if (el) return el;
    el = document.createElement("div");
    el.id = "qiblaQuickView";
    el.className = "qibla-qv";
    el.hidden = true;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "qiblaQvTitle");
    el.innerHTML =
      '<div class="qibla-qv__panel">' +
        '<div class="qibla-qv__swipe" data-qibla-swipe="1" aria-hidden="true"></div>' +
        '<div class="qibla-qv__top">' +
          '<div class="qibla-qv__titles">' +
            '<p class="qibla-qv__kicker" id="qiblaQvTitle">Qibla</p>' +
            '<p class="qibla-qv__sub">Richtung zur Kaʿbah</p>' +
          "</div>" +
          '<button type="button" class="qibla-qv__close" data-qibla-close="1" aria-label="Schließen">×</button>' +
        "</div>" +
        '<div class="qibla-qv__dial-wrap">' +
          '<div class="qibla-qv__dial" data-qibla-dial="1">' +
            '<span class="qibla-qv__tick" style="transform:rotate(0deg)"></span>' +
            '<span class="qibla-qv__tick" style="transform:rotate(90deg)"></span>' +
            '<span class="qibla-qv__tick" style="transform:rotate(180deg)"></span>' +
            '<span class="qibla-qv__tick" style="transform:rotate(270deg)"></span>' +
            '<div class="qibla-qv__kaaba" data-qibla-kaaba="1"><span></span></div>' +
          "</div>" +
          '<div class="qibla-qv__nock" aria-hidden="true"></div>' +
          '<div class="qibla-qv__core" aria-hidden="true">🕋</div>' +
          '<div class="qibla-qv__spinner" aria-hidden="true"></div>' +
        "</div>" +
        '<div class="qibla-qv__readout">' +
          '<p class="qibla-qv__bearing" data-qibla-bearing="1">—</p>' +
          '<p class="qibla-qv__hint" data-qibla-hint="1">Live-Kompass startet</p>' +
        "</div>" +
        '<p class="qibla-qv__meta" data-qibla-meta="1"></p>' +
        '<section class="qibla-qv__location" aria-label="Qibla-Standort und Koordinaten">' +
          '<p class="qibla-qv__coordinates" data-qibla-coordinates="1" aria-live="polite">Koordinaten werden ermittelt …</p>' +
          '<div class="qibla-qv__actions">' +
            '<button type="button" data-qibla-act="gps">GPS aktualisieren</button>' +
            '<button type="button" data-qibla-act="city">Stadt / Koordinaten</button>' +
            '<button type="button" data-qibla-act="app-settings">Einstellungen</button>' +
          '</div>' +
          '<div class="qibla-qv__city" data-qibla-city="1" hidden>' +
            '<label for="qiblaQvCitySearch">Stadt oder Postleitzahl suchen</label>' +
            '<div class="qibla-qv__city-search"><input id="qiblaQvCitySearch" type="search" autocomplete="off" placeholder="z. B. Bonn" /><button type="button" data-qibla-act="search-city">Suchen</button></div>' +
            '<div class="qibla-qv__city-results" data-qibla-city-results="1" role="group" aria-label="Gefundene Städte"></div>' +
            '<div class="qibla-qv__city-coords">' +
              '<label>Breitengrad<input type="number" step="any" min="-90" max="90" data-qibla-lat="1" inputmode="decimal" /></label>' +
              '<label>Längengrad<input type="number" step="any" min="-180" max="180" data-qibla-lon="1" inputmode="decimal" /></label>' +
            '</div>' +
            '<button type="button" class="qibla-qv__save" data-qibla-act="save-coordinates">Koordinaten übernehmen</button>' +
          '</div>' +
          '<p class="qibla-qv__location-status" data-qibla-location-status="1" role="status" aria-live="polite"></p>' +
        '</section>' +
        '<div class="qibla-qv__cal" data-qibla-cal="1">' +
          "<strong>Kompass kalibrieren</strong><br>Bewege das Gerät kurz in Form einer Acht." +
          '<div class="qibla-qv__figure" aria-hidden="true"></div>' +
        "</div>" +
        '<div class="qibla-qv__gate" data-qibla-gate="1"></div>' +
      "</div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (ev) {
      if (ev.target === el) QiblaQuickView.close();
    });
    el.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-qibla-close],[data-qibla-act],[data-qibla-city-choice]");
      if (!t) return;
      if (t.getAttribute("data-qibla-close")) {
        QiblaQuickView.close();
        return;
      }
      var act = t.getAttribute("data-qibla-act");
      if (act === "loc") requestLoc(true);
      if (act === "compass") startCompass(true);
      if (act === "settings") engine.permissions.openSettings();
      if (act === "gps") switchToGps();
      if (act === "city") toggleCitySearch();
      if (act === "search-city") searchCity();
      if (act === "save-coordinates") saveManualCoordinates();
      if (act === "app-settings") openAppLocationSettings();
      var choice = t.getAttribute("data-qibla-city-choice");
      if (choice != null) chooseCity(Number(choice));
    });
    el.addEventListener("touchstart", function (ev) {
      var handle = ev.target.closest("[data-qibla-swipe],.qibla-qv__top");
      if (!handle || ev.target.closest(".qibla-qv__close")) return;
      ui.swipeY = ev.touches[0].clientY;
    }, { passive: true });
    el.addEventListener("touchend", function (ev) {
      if (ui.swipeY == null) return;
      var y = ev.changedTouches[0].clientY;
      var dy = y - ui.swipeY;
      ui.swipeY = null;
      if (dy > 90) QiblaQuickView.close();
    }, { passive: true });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && QiblaQuickView.isOpen()) QiblaQuickView.close();
    }, { passive: true });
    return el;
  }

  function locationStatus(message) {
    var el = ui.root && ui.root.querySelector("[data-qibla-location-status]");
    if (el) el.textContent = String(message || "");
  }

  function coordinatesText(loc) {
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lon)) return "Koordinaten werden ermittelt …";
    var label = loc.manual || loc.source === "prayer" ? "Gewählter Standort" : "Aktueller Standort";
    return label + " · " + loc.lat.toFixed(5) + "°, " + loc.lon.toFixed(5) + "°";
  }

  function toggleCitySearch() {
    var panel = ui.root && ui.root.querySelector("[data-qibla-city]");
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      var settings = savedPrayerLocation();
      var lat = ui.root.querySelector("[data-qibla-lat]");
      var lon = ui.root.querySelector("[data-qibla-lon]");
      if (lat && settings) lat.value = String(settings.lat);
      if (lon && settings) lon.value = String(settings.lon);
      var input = ui.root.querySelector("#qiblaQvCitySearch");
      if (input) input.focus();
    }
  }

  function saveSelectedLocation(lat, lon, city) {
    if (!validCoordinate(lat, 90) || !validCoordinate(lon, 180)) {
      locationStatus("Bitte gültige Koordinaten eingeben.");
      return false;
    }
    if (typeof root.setPrayerSettings !== "function") {
      locationStatus("Die Standort-Einstellungen stehen gerade nicht zur Verfügung.");
      return false;
    }
    var name = String(city || "").trim() || "Manuell gewählte Koordinaten";
    try {
      root.setPrayerSettings({lat: Number(lat), lon: Number(lon), city: name,
        locationMode: "manual", locationGranted: true,
        locationUpdatedAt: Date.now()});
      applyLoc({lat: Number(lat), lon: Number(lon), city: name,
        source: "prayer", manual: true});
      var panel = ui.root.querySelector("[data-qibla-city]");
      if (panel) panel.hidden = true;
      locationStatus("Standort übernommen. Die Qibla-Richtung wurde aktualisiert.");
      return true;
    } catch (err) {
      locationStatus("Standort konnte nicht gespeichert werden.");
      return false;
    }
  }

  function saveManualCoordinates() {
    var el = ui.root;
    if (!el) return;
    var lat = el.querySelector("[data-qibla-lat]");
    var lon = el.querySelector("[data-qibla-lon]");
    var name = el.querySelector("#qiblaQvCitySearch");
    saveSelectedLocation(lat && lat.value, lon && lon.value, name && name.value);
  }

  function chooseCity(index) {
    var hit = ui.cityMatches[index];
    if (!hit) return;
    saveSelectedLocation(hit.latitude, hit.longitude,
      [hit.name, hit.admin1, hit.country].filter(Boolean).join(", "));
  }

  async function searchCity() {
    var panel = ui.root;
    if (!panel) return;
    var input = panel.querySelector("#qiblaQvCitySearch");
    var results = panel.querySelector("[data-qibla-city-results]");
    var term = input ? String(input.value || "").trim() : "";
    if (term.length < 2 || term.length > 90) {
      locationStatus("Bitte mindestens zwei Zeichen für die Stadt eingeben.");
      return;
    }
    if (!results) return;
    results.replaceChildren();
    locationStatus("Städte werden gesucht …");
    var serial = ++ui.cityRequest;
    try {
      var res = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" +
        encodeURIComponent(term) + "&count=8&language=de", {cache: "no-store"});
      if (!res.ok) throw new Error("city_http");
      var data = await res.json();
      if (serial !== ui.cityRequest || !QiblaQuickView.isOpen()) return;
      ui.cityMatches = (data && Array.isArray(data.results) ? data.results : [])
        .filter(function(x) {
          return x && validCoordinate(x.latitude, 90) && validCoordinate(x.longitude, 180);
        }).slice(0, 8);
      ui.cityMatches.forEach(function(hit, i) {
        var button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-qibla-city-choice", String(i));
        button.textContent = [hit.name, hit.admin1, hit.country].filter(Boolean).join(" · ");
        results.appendChild(button);
      });
      locationStatus(ui.cityMatches.length ? "Stadt auswählen, um den Standort zu übernehmen." :
        "Keine Stadt gefunden. Bitte genauer suchen oder Koordinaten eingeben.");
    } catch (err) {
      if (serial === ui.cityRequest) locationStatus("Stadtsuche nicht erreichbar. Koordinaten können direkt eingegeben werden.");
    }
  }

  async function switchToGps() {
    locationStatus("Aktueller GPS-Standort wird ermittelt …");
    try {
      var bridge = root.webkit && root.webkit.messageHandlers && root.webkit.messageHandlers.darNative;
      if (bridge) bridge.postMessage({type: "location-resume"});
    } catch (e) {}
    try {
      var loc = await engine.location.refresh(true);
      if (!loc || !validCoordinate(loc.lat, 90) || !validCoordinate(loc.lon, 180)) throw new Error("invalid_position");
      if (typeof root.setPrayerSettings === "function") {
        root.setPrayerSettings({lat: loc.lat, lon: loc.lon, city: loc.city || "GPS-Standort",
          locationMode: "auto", locationGranted: true, locationUpdatedAt: Date.now()});
      }
      loc.manual = false;
      applyLoc(loc);
      fillCity(loc).then(function(next) { if (next && QiblaQuickView.isOpen()) applyLoc(next); });
      var panel = ui.root && ui.root.querySelector("[data-qibla-city]");
      if (panel) panel.hidden = true;
      locationStatus("GPS aktiv. Standort und Qibla-Richtung wurden aktualisiert.");
    } catch (err) {
      locationStatus("GPS derzeit nicht verfügbar. Die bisherige Stadt bleibt erhalten.");
    }
  }

  function openAppLocationSettings() {
    QiblaQuickView.close();
    try {
      if (typeof root.navigate === "function") {
        root.navigate("settings", "location");
        return;
      }
      if (typeof root.go === "function") {
        root.go("settings");
        return;
      }
    } catch (e) {}
    location.hash = "#settings";
  }

  function setGate(kind) {
    var el = ui.root;
    if (!el) return;
    var gate = el.querySelector("[data-qibla-gate]");
    el.classList.toggle("is-gate", !!kind);
    if (!gate) return;
    if (!kind) { gate.innerHTML = ""; return; }
    if (kind === "loc-need") {
      gate.innerHTML = "<p>Standort wird benötigt, um die Qibla-Richtung für deinen aktuellen Ort zu bestimmen.</p>" +
        '<button type="button" class="qibla-qv__btn" data-qibla-act="loc">Standort erlauben</button>';
      return;
    }
    if (kind === "loc-denied") {
      gate.innerHTML = "<p><strong>Standort nicht verfügbar</strong></p><p>Aktiviere den Standort, damit die Qibla für deinen aktuellen Ort berechnet werden kann.</p>" +
        '<button type="button" class="qibla-qv__btn" data-qibla-act="settings">Einstellungen öffnen</button>';
      return;
    }
    if (kind === "compass") {
      gate.innerHTML = "<p>Bewegungssensoren werden benötigt, damit der Live-Kompass die Richtung anzeigen kann.</p>" +
        '<button type="button" class="qibla-qv__btn" data-qibla-act="compass">Kompass aktivieren</button>';
    }
  }

  function paint() {
    ui.pending = false;
    var el = ui.root;
    if (!el || el.hidden) return;
    var bearing = engine.bearing;
    var heading = engine.headingDeg;
    var bEl = el.querySelector("[data-qibla-bearing]");
    var hEl = el.querySelector("[data-qibla-hint]");
    var mEl = el.querySelector("[data-qibla-meta]");
    var coordsEl = el.querySelector("[data-qibla-coordinates]");
    if (coordsEl) coordsEl.textContent = coordinatesText(engine.loc);
    var dial = el.querySelector("[data-qibla-dial]");
    var kaaba = el.querySelector("[data-qibla-kaaba]");
    if (bearing == null) {
      if (bEl) bEl.textContent = "—";
      if (hEl && !el.classList.contains("is-gate")) hEl.textContent = "Standort wird geladen";
    } else {
      var shown = Math.round(bearing) % 360;
      if (bEl) bEl.textContent = "Qibla · " + shown + "°";
      if (kaaba) kaaba.style.transform = "rotate(" + bearing + "deg)";
    }
    if (heading != null && dial) {
      dial.style.transform = "rotate(" + (-heading) + "deg)";
    }
    var off = (bearing != null && heading != null) ? signedOffset(bearing, heading) : null;
    engine.offset = off;
    var abs = off == null ? null : Math.abs(off);
    el.classList.toggle("is-near", abs != null && abs <= 15);
    el.classList.toggle("is-closer", abs != null && abs <= 5);
    var aligned = abs != null && abs <= 2;
    el.classList.toggle("is-aligned", aligned);
    if (hEl && !el.classList.contains("is-gate")) {
      if (off == null) hEl.textContent = heading == null ? "Live-Kompass startet" : "Qibla wird berechnet";
      else if (aligned) hEl.textContent = "Qibla ausgerichtet";
      else if (off > 0) hEl.textContent = Math.round(abs) + "° nach rechts";
      else hEl.textContent = Math.round(abs) + "° nach links";
    }
    if (aligned && !ui.alignedOnce) {
      ui.alignedOnce = true;
      hapticOnce();
    }
    if (!aligned) ui.alignedOnce = false;
    el.classList.toggle("is-calibrating", !!engine.heading.unreliable);
    if (mEl) {
      var city = engine.loc && engine.loc.city ? String(engine.loc.city).split(",")[0] : "";
      var bits = [];
      if (city) bits.push("Standort: " + city);
      if (engine.loc && engine.loc.source === "prayer") bits.push("letzter bekannter Ort");
      if (engine.loc && engine.loc.source === "geo") bits.push("Standort aktualisiert");
      mEl.textContent = bits.join(" · ");
    }
  }

  function schedulePaint() {
    if (ui.pending) return;
    ui.pending = true;
    ui.raf = requestAnimationFrame(paint);
  }

  function applyLoc(loc, opts) {
    if (!loc) return;
    engine.loc = loc;
    engine.bearing = qiblaBearing(loc.lat, loc.lon);
    persistLoc(loc);
    if (ui.root) ui.root.classList.remove("is-loading");
    if (!(opts && opts.keepGate)) setGate(null);
    schedulePaint();
  }

  async function requestLoc(fromUser) {
    // Ask the native bridge for a fresh CoreLocation fix; a later event updates
    // this panel without reopening it. The web Geolocation API remains fallback.
    try {
      var bridge = root.webkit && root.webkit.messageHandlers && root.webkit.messageHandlers.darNative;
      if (bridge) bridge.postMessage({ type: "location-resume" });
    } catch (e) {}
    var cached = engine.location.cached();
    if (cached) applyLoc(cached);
    else if (ui.root) ui.root.classList.add("is-loading");
    try {
      var fresh = await engine.location.refresh(!!fromUser);
      applyLoc(fresh);
      fillCity(fresh).then(function (withCity) {
        if (withCity && withCity.city) applyLoc(withCity);
      });
    } catch (err) {
      if (cached) {
        cached.stale = true;
        applyLoc(cached);
        return;
      }
      var denied = err && (err.code === 1 || /denied/i.test(String(err.message || "")));
      setGate(denied ? "loc-denied" : "loc-need");
      if (ui.root) ui.root.classList.remove("is-loading");
    }
  }

  async function startCompass(fromUser) {
    if (!engine.heading._nativeBridge() && engine.heading.needsPermission && engine.heading.permission !== "granted") {
      var perm = await engine.heading.requestPermission();
      if (perm !== "granted") {
        setGate("compass");
        return;
      }
    }
    if (engine.bearing != null || engine.location.cached()) setGate(null);
    engine.heading.start(function (smooth) {
      engine.headingDeg = smooth;
      schedulePaint();
    });
    engine.started = true;
    schedulePaint();
  }

  function onNativeLocation() {
    if (!QiblaQuickView.isOpen()) return;
    var loc = engine.location.cached();
    if (loc) applyLoc(loc);
  }

  function onVis() {
    if (!QiblaQuickView.isOpen()) return;
    if (document.visibilityState === "hidden") QiblaQuickView.pause();
    else QiblaQuickView.resume();
  }

  var QiblaQuickView = {
    isOpen: function () {
      return !!(ui.root && !ui.root.hidden);
    },
    open: function () {
      try { if (typeof root.stopQiblaCompass === "function") root.stopQiblaCompass(); } catch (e) {}
      ui.root = ensureDom();
      ui.root.hidden = false;
      document.documentElement.classList.add("qibla-qv-open");
      document.body.classList.add("qibla-qv-open");
      ui.alignedOnce = false;
      ui.cityMatches = [];
      ui.cityRequest++;
      locationStatus("");
      engine.headingDeg = null;
      engine.offset = null;
      if (!ui.visBound) {
        document.addEventListener("visibilitychange", onVis);
        ui.visBound = true;
      }
      if (!ui.nativeLocBound) {
        window.addEventListener("dar-native-location", onNativeLocation);
        window.addEventListener("dar:location-updated", onNativeLocation);
        ui.nativeLocBound = true;
      }
      var cached = engine.location.cached();
      if (cached) applyLoc(cached);
      else ui.root.classList.add("is-loading");
      requestLoc(false);
      startCompass(false);
    },
    close: function () {
      ui.cityRequest++;
      this.stop();
      if (ui.root) ui.root.hidden = true;
      document.documentElement.classList.remove("qibla-qv-open");
      document.body.classList.remove("qibla-qv-open");
      try {
        if (/^#qibla/i.test(String(location.hash || ""))) {
          location.hash = "#more";
        }
      } catch (e) {}
    },
    start: function () { startCompass(true); },
    stop: function () {
      engine.heading.stop();
      engine.location.stop();
      engine.started = false;
      if (ui.raf) cancelAnimationFrame(ui.raf);
      ui.raf = 0;
      ui.pending = false;
    },
    pause: function () {
      engine.heading.stop();
    },
    resume: function () {
      if (!this.isOpen()) return;
      startCompass(false);
    },
    dispose: function () {
      this.close();
      if (ui.visBound) {
        document.removeEventListener("visibilitychange", onVis);
        ui.visBound = false;
      }
      if (ui.nativeLocBound) {
        window.removeEventListener("dar-native-location", onNativeLocation);
        window.removeEventListener("dar:location-updated", onNativeLocation);
        ui.nativeLocBound = false;
      }
      if (ui.root && ui.root.parentNode) ui.root.parentNode.removeChild(ui.root);
      ui.root = null;
    }
  };

  root.DARQiblaCalculator = QiblaCalculator;
  root.DARQiblaEngine = engine;
  root.DARQiblaQuickView = QiblaQuickView;
})(typeof window !== "undefined" ? window : globalThis);
