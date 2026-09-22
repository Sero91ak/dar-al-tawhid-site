(function () {
  "use strict";
  if (window.__DAR_IOS_VISITOR_DEPRECATION_V1) return;
  window.__DAR_IOS_VISITOR_DEPRECATION_V1 = true;

  var APP_STORE_URL = "https://apps.apple.com/de/app/d%C4%81r-al-taw%E1%B8%A5%C4%ABd/id6805988753";

  function pathName() {
    try { return String(location.pathname || ""); } catch (e) { return ""; }
  }

  function appTarget() {
    try {
      if (typeof window.APP_TARGET === "string" && window.APP_TARGET) return String(window.APP_TARGET);
      if (typeof window.DAR_APP_TARGET === "string" && window.DAR_APP_TARGET) return String(window.DAR_APP_TARGET);
      var ds = document.documentElement && document.documentElement.dataset;
      if (ds && ds.appPath) return String(ds.appPath);
    } catch (eT) {}
    return "";
  }

  function isOfficialIosApp() {
    try {
      if (window.DAR_OFFICIAL_IOS_APP === true) return true;
      if (window.DAR_IOS_NATIVE_APP === true) return true;
      var target = appTarget();
      if (target === "ios-official") return true;
      var ua = String(navigator.userAgent || "");
      if (/DarAlTawhid-iOS/i.test(ua) || /DarAlTawhidOfficialIOS/i.test(ua)) return true;
      var root = document.documentElement;
      if (root && (root.classList.contains("dar-ios-native-app") || root.classList.contains("dar-ios-native-tabs"))) return true;
      var h = window.webkit && window.webkit.messageHandlers;
      if (h && (h.darWidgetSnapshot || h.darNative || h.darPushSettings)) return true;
    } catch (eOff) {}
    return false;
  }

  function isIOSDevice() {
    try {
      var ua = String(navigator.userAgent || "");
      if (/Android/i.test(ua)) return false;
      if (/iPad|iPhone|iPod/i.test(ua)) return true;
      if (navigator.platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1) return true;
    } catch (eIos) {}
    return false;
  }

  function isStandalonePWA() {
    try {
      if (window.navigator && window.navigator.standalone === true) return true;
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    } catch (eSt) {}
    return false;
  }

  function isOldVisitorApp() {
    try {
      var target = appTarget();
      if (target === "test" || target === "admin" || target === "ios-official") return false;
      var path = pathName();
      if (path.indexOf("/test") === 0) return false;
      if (path.indexOf("/admin") === 0) return false;
    } catch (eVis) {}
    return true;
  }

  function shouldBlockOldIOSVisitorApp() {
    if (isOfficialIosApp()) return false;
    if (!isOldVisitorApp()) return false;
    if (!isIOSDevice()) return false;
    if (!isStandalonePWA()) return false;
    return true;
  }

  window.DARShouldBlockOldIOSVisitorApp = shouldBlockOldIOSVisitorApp;
  window.DAR_APP_STORE_URL = APP_STORE_URL;

  if (!shouldBlockOldIOSVisitorApp()) return;

  window.DAR_IOS_VISITOR_BLOCKED = true;
  window.__darAppBootOk = true;
  window.__DAR_STOP_APP_BOOT = true;

  function cssText() {
    return [
      "html.ios-visitor-blocked,html.ios-visitor-blocked body{position:fixed!important;inset:0!important;overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important;height:100%!important;height:100dvh!important;width:100%!important;max-width:100%!important;background:#f7f0df!important}",
      "html.ios-visitor-blocked #appView,html.ios-visitor-blocked #bottomNav,html.ios-visitor-blocked .app,html.ios-visitor-blocked .footer,html.ios-visitor-blocked #darQuranMiniPlayer,html.ios-visitor-blocked #dar-soft-boot,html.ios-visitor-blocked .top-shell,html.ios-visitor-blocked .float-actions,html.ios-visitor-blocked .home-discover,html.ios-visitor-blocked .home-v380{display:none!important;visibility:hidden!important;pointer-events:none!important}",
      "#iosVisitorBlock{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top,0px)) 18px max(16px,env(safe-area-inset-bottom,0px));box-sizing:border-box;width:100%;height:100%;height:100dvh;overflow:hidden;overscroll-behavior:none;touch-action:none;-webkit-overflow-scrolling:auto;background:radial-gradient(120% 80% at 50% 8%,rgba(239,215,142,.28),transparent 46%),linear-gradient(180deg,#fffaf0 0%,#f7f0df 42%,#ead9b4 100%);font-family:Manrope,Inter,system-ui,-apple-system,sans-serif;color:#2a2218}",
      "#iosVisitorBlock .ios-visitor-block-card{width:min(400px,100%);max-height:100%;overflow:hidden;overscroll-behavior:none;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 20px 18px;border-radius:28px;background:linear-gradient(165deg,#fffdf7,#f4e8cc);border:1px solid rgba(155,122,60,.32);box-shadow:0 24px 48px rgba(90,62,20,.14),inset 0 1px 0 rgba(255,255,255,.86);text-align:center;box-sizing:border-box}",
      "#iosVisitorBlock .ios-visitor-goldline{height:1px;margin:0 auto 12px;width:64px;background:linear-gradient(90deg,transparent,#c9a86a,transparent);flex:0 0 auto}",
      "#iosVisitorBlock .ios-visitor-brand{font-family:'Cormorant Garamond',Georgia,serif;letter-spacing:.18em;font-size:11px;font-weight:800;color:#8a6530;text-transform:uppercase;margin:0 0 8px;flex:0 0 auto}",
      "#iosVisitorBlock h1{margin:0 0 12px;font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(22px,6vw,28px);line-height:1.18;font-weight:700;color:#8a6530;max-width:100%;overflow:hidden}",
      "#iosVisitorBlock h1 span{display:block}",
      "#iosVisitorBlock .bismillah{margin:0 0 10px;font-size:20px;color:#6d4e24;direction:rtl}",
      "#iosVisitorBlock p{margin:0 0 8px;font-size:14.5px;line-height:1.45;color:#3e2b17}",
      "#iosVisitorBlock .dua{color:#5c4e3c;font-style:italic;font-size:13.5px;margin-bottom:4px}",
      "#iosVisitorBlock .app-store-button{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0 8px;width:100%;min-height:50px;padding:12px 16px;border-radius:16px;background:linear-gradient(180deg,#c9a86a,#9b7334);color:#fffaf0!important;text-decoration:none;font-weight:800;font-size:15.5px;box-shadow:0 10px 22px rgba(120,90,40,.22);-webkit-tap-highlight-color:transparent;touch-action:manipulation;flex:0 0 auto}",
      "#iosVisitorBlock .app-store-button svg{width:18px;height:18px;flex:0 0 auto}",
      "#iosVisitorBlock .android-note{margin:4px 0 0;font-size:12px;color:#7a6a54}"
    ].join("");
  }

  function htmlText() {
    return (
      '<div class="ios-visitor-block-card" role="dialog" aria-modal="true" aria-labelledby="iosVisitorBlockTitle">' +
        '<div class="ios-visitor-brand">DĀR AL TAWḤĪD</div>' +
        '<div class="ios-visitor-goldline" aria-hidden="true"></div>' +
        '<h1 id="iosVisitorBlockTitle"><span>DĀR AL TAWḤĪD ist jetzt</span><span>offiziell im App Store</span></h1>' +
        '<p class="bismillah">بِسْمِ اللهِ</p>' +
        '<p>Diese installierte Besucher-App auf iOS wird nicht mehr unterstützt.</p>' +
        '<p>Damit du DĀR AL TAWḤĪD weiterhin stabil, sicher und vollständig nutzen kannst, lade bitte die offizielle iOS-App aus dem App Store herunter.</p>' +
        '<p>Die neue App ist für iPhone optimiert und wird künftig dort gepflegt.</p>' +
        '<p class="dua">Möge Allah diese Arbeit nützlich machen und uns Standhaftigkeit auf Qurʾān und Sunnah schenken.</p>' +
        '<a class="app-store-button" href="' + APP_STORE_URL + '" rel="noopener">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.64c-.03-2.16 1.76-3.2 1.84-3.25-1-1.47-2.57-1.67-3.12-1.69-1.32-.14-2.59.78-3.26.78s-1.7-.76-2.81-.74c-1.44.02-2.78.84-3.52 2.14-1.51 2.62-.39 6.5 1.08 8.63.72 1.04 1.58 2.21 2.71 2.17 1.09-.05 1.5-.7 2.81-.7s1.68.7 2.82.68c1.17-.02 1.91-1.06 2.62-2.11.83-1.2 1.17-2.37 1.19-2.43-.03-.01-2.27-.87-2.3-3.48zM14.5 6.9c.6-.73 1-1.74.89-2.75-.86.03-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.65.96.07 1.95-.49 2.54-1.2z"/></svg>' +
          "Offizielle iOS-App herunterladen</a>" +
        '<p class="android-note">Android-Nutzer können die Besucher-App weiterhin nutzen.</p>' +
      "</div>"
    );
  }

  function stopPlayers() {
    try {
      if (window.DARQuranPlayer && typeof window.DARQuranPlayer.stop === "function") window.DARQuranPlayer.stop();
    } catch (eStop) {}
    try {
      document.querySelectorAll("audio,video").forEach(function (m) {
        try { m.pause(); m.removeAttribute("src"); m.load(); } catch (eM) {}
      });
    } catch (eAud) {}
  }

  function mount() {
    try { document.documentElement.classList.add("ios-visitor-blocked"); } catch (eCl) {}
    try { if (document.body) document.body.classList.add("ios-visitor-blocked"); } catch (eBd) {}
    if (!document.getElementById("iosVisitorBlockStyle")) {
      var st = document.createElement("style");
      st.id = "iosVisitorBlockStyle";
      (document.head || document.documentElement).appendChild(st);
    }
    document.getElementById("iosVisitorBlockStyle").textContent = cssText();
    var el = document.getElementById("iosVisitorBlock");
    if (!el) {
      el = document.createElement("div");
      el.id = "iosVisitorBlock";
      el.setAttribute("data-ios-visitor-block", "1");
    }
    if (el.getAttribute("data-lock-version") !== "836") {
      el.setAttribute("data-lock-version", "836");
      el.innerHTML = htmlText();
      var btn = el.querySelector("a.app-store-button");
      if (btn) {
        btn.addEventListener("click", function (ev) {
          ev.preventDefault();
          try { window.location.href = APP_STORE_URL; } catch (eGo) {
            try { window.open(APP_STORE_URL, "_self"); } catch (eOpen) {}
          }
        });
      }
    }
    if (document.body) {
      if (el.parentNode !== document.body) document.body.appendChild(el);
    } else {
      document.documentElement.appendChild(el);
    }
    stopPlayers();
    lockScroll();
  }

  function lockScroll() {
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (eSc) {}
  }

  function haltNavigation(ev) {
    var t = ev && ev.target;
    if (t && t.closest && t.closest("a.app-store-button")) return;
    if (t && t.closest && t.closest("#iosVisitorBlock")) {
      if (ev.type === "click" && t.closest && !t.closest("a.app-store-button")) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      return;
    }
    if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
    if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
    if (ev && typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
    mount();
  }

  function arm() {
    mount();
    ["hashchange", "popstate", "pageshow"].forEach(function (ev) {
      window.addEventListener(ev, function () { mount(); }, true);
    });
    document.addEventListener("click", haltNavigation, true);
    document.addEventListener("submit", haltNavigation, true);
    ["touchmove", "wheel", "scroll"].forEach(function (ev) {
      window.addEventListener(ev, function (e) {
        var t = e && e.target;
        if (t && t.closest && t.closest("a.app-store-button")) return;
        if (e.cancelable && typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        lockScroll();
      }, { capture: true, passive: false });
    });
    document.addEventListener("gesturestart", function (e) {
      if (e.cancelable) e.preventDefault();
    }, { capture: true, passive: false });
    try {
      if (window.MutationObserver) {
        var obs = new MutationObserver(function () {
          if (!document.getElementById("iosVisitorBlock")) mount();
          try { document.documentElement.classList.add("ios-visitor-blocked"); } catch (eMo) {}
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
      }
    } catch (eObs) {}
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
    }
  }

  arm();
})();
