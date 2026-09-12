(function () {
  "use strict";

  var ua = String(navigator.userAgent || "");
  var nativeIOS =
    !!window.DAR_IOS_NATIVE_APP ||
    /DarAlTawhid-iOS/i.test(ua) ||
    !!(window.webkit && window.webkit.messageHandlers);
  if (!nativeIOS) return;

  function linkedNode(event) {
    var target = event && event.target;
    return target && target.closest ? target.closest("a[href]") : null;
  }

  function isSourceOrPDF(link) {
    if (!link) return false;
    var href = String(link.getAttribute("href") || "");
    return (
      /\.pdf(?:$|[?#])/i.test(href) ||
      link.matches(
        ".post-beleg-link,.post-slide-pdf-link,.post-slide-links a,.qsource-link,.source-btn,.ilm-source-open"
      )
    );
  }

  function prepareLink(event) {
    var link = linkedNode(event);
    if (!isSourceOrPDF(link)) return;
    /*
     * WKWebView occasionally drops target=_blank navigation when no secondary
     * web view is returned. Keeping the original click but forcing the main
     * frame preserves WKNavigationDelegate handling for web and PDF links.
     */
    link.removeAttribute("target");
    link.setAttribute("data-dar-ios-main-frame", "1");
  }

  ["touchstart", "pointerdown", "mousedown", "click"].forEach(function (name) {
    document.addEventListener(name, prepareLink, true);
  });

})();
