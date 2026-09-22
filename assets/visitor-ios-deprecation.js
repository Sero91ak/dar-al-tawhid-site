(function () {
  "use strict";
  if (window.__DAR_IOS_VISITOR_DEPRECATION_V1) return;
  window.__DAR_IOS_VISITOR_DEPRECATION_V1 = true;

  var APP_STORE_URL = "https://apps.apple.com/de/app/d%C4%81r-al-taw%E1%B8%A5%C4%ABd/id6805988753";

  function pathName() {
    try { return String(location.pathname || ""); } catch (e) { return ""; }
  }

  function isOfficialIosApp() {
    try {
      if (window.DAR_OFFICIAL_IOS_APP === true) return true;
      if (window.DAR_IOS_NATIVE_APP === true) return true;
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
      var path = pathName();
      if (path.indexOf("/test") === 0) return false;
      if (path.indexOf("/admin") === 0) return false;
      if (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.appPath === "test") return false;
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

  function cssText() {
    return [
      "html.ios-visitor-blocked,html.ios-visitor-blocked body{overflow:hidden!important;height:100%!important;background:#f7f0df!important}",
      "html.ios-visitor-blocked #appView,html.ios-visitor-blocked #bottomNav,html.ios-visitor-blocked .app,html.ios-visitor-blocked .footer,html.ios-visitor-blocked #darQuranMiniPlayer,html.ios-visitor-blocked #dar-soft-boot,html.ios-visitor-blocked .top-shell,html.ios-visitor-blocked .float-actions{display:none!important;visibility:hidden!important;pointer-events:none!important}",
      "#iosVisitorBlock{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:max(22px,env(safe-area-inset-top,0px)) 18px max(22px,env(safe-area-inset-bottom,0px));box-sizing:border-box;background:radial-gradient(120% 80% at 50% 8%,rgba(239,215,142,.28),transparent 46%),linear-gradient(180deg,#fffaf0 0%,#f7f0df 42%,#ead9b4 100%);font-family:Manrope,Inter,system-ui,-apple-system,sans-serif;color:#2a2218}",
      "#iosVisitorBlock .ios-visitor-block-card{width:min(440px,100%);max-height:100%;overflow:auto;padding:28px 22px 22px;border-radius:28px;background:linear-gradient(165deg,#fffdf7,#f4e8cc);border:1px solid rgba(155,122,60,.32);box-shadow:0 24px 48px rgba(90,62,20,.14),inset 0 1px 0 rgba(255,255,255,.86);text-align:center}",
      "#iosVisitorBlock .ios-visitor-brand{font-family:'Cormorant Garamond',Georgia,serif;letter-spacing:.16em;font-size:12px;font-weight:800;color:#8a6530;text-transform:uppercase;margin:0 0 14px}",
      "#iosVisitorBlock h1{margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(24px,6.4vw,32px);line-height:1.2;font-weight:700;color:#3d2a12}",
      "#iosVisitorBlock .bismillah{margin:0 0 14px;font-size:22px;color:#6d4e24;direction:rtl}",
      "#iosVisitorBlock p{margin:0 0 12px;font-size:15.5px;line-height:1.55;color:#3e2b17}",
      "#iosVisitorBlock .dua{color:#5c4e3c;font-style:italic}",
      "#iosVisitorBlock .app-store-button{display:flex;align-items:center;justify-content:center;gap:10px;margin:18px 0 12px;min-height:52px;padding:12px 16px;border-radius:16px;background:linear-gradient(180deg,#c9a86a,#9b7334);color:#fffaf0!important;text-decoration:none;font-weight:800;font-size:16px;box-shadow:0 10px 22px rgba(120,90,40,.22)}",
      "#iosVisitorBlock .android-note{margin:8px 0 0;font-size:12.5px;color:#7a6a54}"
    ].join("");
  }

  function htmlText() {
    return (
      '<div class="ios-visitor-block-card" role="dialog" aria-modal="true" aria-labelledby="iosVisitorBlockTitle">' +
        '<div class="ios-visitor-brand">DĀR AL TAWḤĪD</div>' +
        '<h1 id="iosVisitorBlockTitle">DĀR AL TAWḤĪD ist jetzt offiziell im App Store</h1>' +
        '<p class="bismillah">بِسْمِ اللهِ</p>' +
        '<p>Diese installierte Besucher-App auf iOS wird nicht mehr unterstützt.</p>' +
        '<p>Damit du DĀR AL TAWḤĪD weiterhin stabil, sicher und vollständig nutzen kannst, lade bitte die offizielle iOS-App aus dem App Store herunter.</p>' +
        '<p>Die neue App ist für iPhone optimiert und wird künftig dort gepflegt.</p>' +
        '<p class="dua">Möge Allah diese Arbeit nützlich machen und uns Standhaftigkeit auf Qurʾān und Sunnah schenken.</p>' +
        '<a class="app-store-button" href="' + APP_STORE_URL + '" rel="noopener">Offizielle iOS-App herunterladen</a>' +
        '<p class="android-note">Android-Nutzer können die Besucher-App weiterhin nutzen.</p>' +
      "</div>"
    );
  }

  function mount() {
    try { document.documentElement.classList.add("ios-visitor-blocked"); } catch (eCl) {}
    try { if (document.body) document.body.classList.add("ios-visitor-blocked"); } catch (eBd) {}
    if (!document.getElementById("iosVisitorBlockStyle")) {
      var st = document.createElement("style");
      st.id = "iosVisitorBlockStyle";
      st.textContent = cssText();
      (document.head || document.documentElement).appendChild(st);
    }
    var el = document.getElementById("iosVisitorBlock");
    if (!el) {
      el = document.createElement("div");
      el.id = "iosVisitorBlock";
      el.setAttribute("data-ios-visitor-block", "1");
      el.innerHTML = htmlText();
    }
    if (document.body) {
      if (el.parentNode !== document.body) document.body.appendChild(el);
    } else {
      document.documentElement.appendChild(el);
    }
    try {
      if (window.DARQuranPlayer && typeof window.DARQuranPlayer.stop === "function") window.DARQuranPlayer.stop();
    } catch (eStop) {}
  }

  function arm() {
    mount();
    ["hashchange", "popstate", "pageshow"].forEach(function (ev) {
      window.addEventListener(ev, mount);
    });
    document.addEventListener("click", function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest("a.app-store-button") : null;
      if (a) return;
      if (ev.target && ev.target.closest && ev.target.closest("#iosVisitorBlock")) return;
      ev.preventDefault();
      ev.stopPropagation();
      mount();
    }, true);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
    }
  }

  arm();
})();
